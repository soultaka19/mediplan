import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from '@core/auth/auth.facade';
import { DemoService } from '@core/demo/demo.service';
import { UserRole } from '@core/auth/models/user-role';

const LIBELLES_ROLE: Record<UserRole, string> = {
  super_admin: 'Super administrateur',
  clinic_admin: 'Administrateur',
  doctor: 'Médecin',
  patient: 'Patient',
};

/**
 * Bandeau permanent de la démonstration.
 *
 * Il dit trois choses en continu : que les données sont fictives, dans combien
 * de temps elles disparaissent, et qu'on peut changer de rôle. Le changement de
 * rôle est ce qui rend le contrôle d'accès visible — la navigation et les
 * écrans changent sous les yeux du visiteur.
 */
@Component({
  selector: 'app-demo-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (demo.estDemo()) {
      <div class="mp-demo-banner" role="region" aria-label="Bandeau de démonstration">
        <strong>Démonstration — données fictives</strong>

        <span role="timer">
          @if (demo.expire()) {
            Cet espace a expiré et va être effacé.
          } @else {
            Effacé automatiquement dans {{ demo.resteLisible() }}
          }
        </span>

        <span class="mp-demo-banner__actions">
          <label for="mp-demo-role">Rôle&nbsp;:</label>
          <select id="mp-demo-role" [value]="emailCourant()" (change)="basculer($event)">
            @for (compte of demo.comptes(); track compte.email) {
              <option [value]="compte.email">
                {{ libelle(compte.role) }} — {{ compte.firstName }} {{ compte.lastName }}
              </option>
            }
          </select>
          <button type="button" (click)="quitter()">Quitter</button>
        </span>
      </div>
    }
  `,
  styles: `
    .mp-demo-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: #7a4d00;
      background: #fff6e0;
      border-bottom: 1px solid #f0d9a8;
    }
    .mp-demo-banner__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-inline-start: auto;
    }
    .mp-demo-banner select {
      font: inherit;
      padding: 0.15rem 0.35rem;
      color: inherit;
      background: #fff;
      border: 1px solid #e0bf80;
      border-radius: 0.25rem;
    }
    .mp-demo-banner button {
      font: inherit;
      padding: 0.15rem 0.35rem;
      color: inherit;
      background: none;
      border: 0;
      cursor: pointer;
      text-decoration: underline;
    }
    /* Le bandeau reste lisible en thème sombre : on garde un fond ambré
       assombri plutôt qu'un contraste inversé qui le ferait disparaître. */
    :host-context(.dark) .mp-demo-banner {
      color: #ffdfa3;
      background: #4a3410;
      border-bottom-color: #6b4d1c;
    }
  `,
})
export class DemoBanner {
  readonly demo = inject(DemoService);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly emailCourant = computed(() => this.auth.currentUser()?.email ?? '');

  libelle(role: UserRole): string {
    return LIBELLES_ROLE[role];
  }

  basculer(evenement: Event): void {
    const email = (evenement.target as HTMLSelectElement).value;
    this.demo.changerDeRole(email).subscribe({
      // Le tableau de bord est l'écran commun aux trois rôles : basculer vers
      // Patient depuis un écran d'administration mènerait sur une page
      // interdite juste après le changement.
      next: () => void this.router.navigate(['/dashboard']),
    });
  }

  quitter(): void {
    this.demo.terminer();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
