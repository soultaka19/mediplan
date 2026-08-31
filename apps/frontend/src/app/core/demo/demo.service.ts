import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { AuthFacade } from '@core/auth/auth.facade';
import { ENV_CONFIG } from '@core/config/env.config';
import { DemoSession } from './demo.models';

const DEMO_KEY = 'mediplan.demo.session';

/**
 * Bac à sable de démonstration.
 *
 * Un visiteur reçoit sa propre clinique, remplie de données fictives et
 * effacée automatiquement côté serveur. Rien ne lui est demandé : ni adresse
 * courriel, ni mot de passe.
 *
 * Ce service ne garantit aucune isolation — elle est assurée par le
 * cloisonnement `clinic_id` de l'API. Il ne porte que l'état d'affichage.
 */
@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthFacade);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  private readonly sessionState = signal<DemoSession | null>(this.restaurer());

  /** Horloge d'une seconde, pour que le compte à rebours descende vraiment. */
  private readonly maintenant = signal(Date.now());

  readonly session = this.sessionState.asReadonly();
  readonly estDemo = computed(() => this.sessionState() !== null);
  readonly comptes = computed(() => this.sessionState()?.accounts ?? []);

  /** Millisecondes restantes, jamais négatives. */
  readonly resteMs = computed(() => {
    const session = this.sessionState();
    if (!session) {
      return 0;
    }
    return Math.max(0, new Date(session.sandboxExpiresAt).getTime() - this.maintenant());
  });

  readonly resteLisible = computed(() => {
    const secondes = Math.floor(this.resteMs() / 1000);
    const minutes = Math.floor(secondes / 60);
    return `${minutes} min ${(secondes % 60).toString().padStart(2, '0')} s`;
  });

  readonly expire = computed(() => this.estDemo() && this.resteMs() === 0);

  constructor() {
    // L'horloge ne tourne que s'il y a une démonstration en cours : inutile de
    // réveiller la détection de changements chaque seconde pour les autres.
    setInterval(() => {
      if (this.sessionState()) {
        this.maintenant.set(Date.now());
      }
    }, 1000);
  }

  /** Crée un bac à sable et ouvre la session dans la foulée. */
  creer(): Observable<DemoSession> {
    return this.http.post<DemoSession>(`${this.apiUrl}/demo/sandbox`, {}).pipe(
      tap((session) => {
        localStorage.setItem(DEMO_KEY, JSON.stringify(session));
        this.sessionState.set(session);
        this.auth.applySession({
          accessToken: session.accessToken,
          tokenType: session.tokenType,
          expiresIn: session.expiresIn,
          user: session.user,
        });
      }),
    );
  }

  /**
   * Bascule vers un autre rôle du même bac à sable. C'est ce qui rend le
   * contrôle d'accès visible : l'interface change sous les yeux du visiteur,
   * sans qu'il quitte la démonstration.
   */
  changerDeRole(email: string): Observable<unknown> {
    const session = this.sessionState();
    if (!session) {
      throw new Error('Aucun bac à sable en cours');
    }
    return this.auth.login({ email, password: session.sharedPassword });
  }

  /** Efface l'état local. Le serveur purge de son côté à l'expiration. */
  terminer(): void {
    localStorage.removeItem(DEMO_KEY);
    this.sessionState.set(null);
  }

  private restaurer(): DemoSession | null {
    const brut = localStorage.getItem(DEMO_KEY);
    if (!brut) {
      return null;
    }
    try {
      const session = JSON.parse(brut) as DemoSession;
      // Un bac déjà expiré côté serveur ne doit pas ressusciter au
      // rechargement de la page.
      if (new Date(session.sandboxExpiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(DEMO_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(DEMO_KEY);
      return null;
    }
  }
}
