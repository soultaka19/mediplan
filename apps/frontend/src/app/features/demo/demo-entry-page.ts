import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { DemoService } from '@core/demo/demo.service';

/**
 * Porte d'entrée de la démonstration : `/demo`.
 *
 * Le visiteur n'a rien à remplir. On crée sa clinique de démonstration et on
 * l'emmène directement sur le tableau de bord, déjà peuplé.
 */
@Component({
  selector: 'app-demo-entry-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="mp-demo-entry">
      <div class="mp-demo-entry__card">
        @if (!erreur()) {
          <div class="mp-demo-entry__spinner" role="status" aria-label="Préparation en cours"></div>
          <h1>Préparation de votre démonstration</h1>
          <p>
            Une clinique de démonstration vous est créée, remplie de données fictives. Aucune
            information ne vous est demandée, et tout sera effacé automatiquement dans une heure.
          </p>
        } @else {
          <mat-icon class="mp-demo-entry__icon" aria-hidden="true">error_outline</mat-icon>
          <h1>{{ titreErreur() }}</h1>
          <p>{{ erreur() }}</p>
          <button type="button" class="mp-demo-entry__btn" (click)="demarrer()">Réessayer</button>
        }
      </div>
    </div>
  `,
  styles: `
    .mp-demo-entry {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: var(--mat-sys-surface-container-low, #f4f4f7);
    }
    .mp-demo-entry__card {
      width: min(28rem, 100%);
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      background: var(--mat-sys-surface, #fff);
      box-shadow: 0 10px 30px rgb(0 0 0 / 8%);
    }
    .mp-demo-entry__card h1 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .mp-demo-entry__card p {
      margin: 0;
      line-height: 1.6;
      color: var(--mat-sys-on-surface-variant, #55555f);
    }
    .mp-demo-entry__spinner {
      width: 3rem;
      height: 3rem;
      margin: 0 auto 1.5rem;
      border: 4px solid var(--mat-sys-outline-variant, #d5d5dd);
      border-top-color: var(--mat-sys-primary, #4f46e5);
      border-radius: 50%;
      animation: mp-demo-spin 0.9s linear infinite;
    }
    @keyframes mp-demo-spin {
      to {
        transform: rotate(360deg);
      }
    }
    /* Respecte le réglage système : une rotation permanente peut gêner. */
    @media (prefers-reduced-motion: reduce) {
      .mp-demo-entry__spinner {
        animation-duration: 3s;
      }
    }
    .mp-demo-entry__icon {
      width: 3rem;
      height: 3rem;
      font-size: 3rem;
      margin-bottom: 1rem;
      color: var(--mat-sys-error, #b3261e);
    }
    .mp-demo-entry__btn {
      margin-top: 1.5rem;
      padding: 0.65rem 1.25rem;
      border: 0;
      border-radius: 0.5rem;
      cursor: pointer;
      font: inherit;
      font-weight: 500;
      color: var(--mat-sys-on-primary, #fff);
      background: var(--mat-sys-primary, #4f46e5);
    }
  `,
})
export class DemoEntryPage {
  private readonly demo = inject(DemoService);
  private readonly router = inject(Router);

  readonly erreur = signal<string | null>(null);
  readonly titreErreur = signal('Démonstration indisponible');

  constructor() {
    this.demarrer();
  }

  demarrer(): void {
    this.erreur.set(null);
    this.demo.creer().subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (erreur: unknown) => this.afficherErreur(erreur),
    });
  }

  private afficherErreur(erreur: unknown): void {
    // 429 et 503 ne sont pas des pannes : ce sont les garde-fous qui font leur
    // travail. On le dit au visiteur plutôt que d'afficher « une erreur est
    // survenue », qui laisserait croire que le produit ne fonctionne pas.
    const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;

    if (statut === 429) {
      this.titreErreur.set('Trop de démonstrations lancées');
      this.erreur.set(
        'Vous avez ouvert plusieurs espaces coup sur coup. Patientez quelques ' +
          'minutes avant d’en créer un nouveau.',
      );
      return;
    }

    if (statut === 503) {
      this.titreErreur.set('Démonstration momentanément saturée');
      this.erreur.set(
        'Trop d’espaces sont ouverts en ce moment. Chacun expire au bout d’une ' +
          'heure ; réessayez dans quelques minutes.',
      );
      return;
    }

    this.titreErreur.set('Démonstration indisponible');
    this.erreur.set(
      'L’espace de démonstration n’a pas pu être créé. Le service est peut-être ' +
        'en cours de redémarrage.',
    );
  }
}
