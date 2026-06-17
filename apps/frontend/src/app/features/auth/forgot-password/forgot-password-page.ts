import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/auth';
import { Alert } from '@shared/ui';

/**
 * Écran « Mot de passe oublié » (composant smart).
 *
 * Appelle directement `AuthService` (ne touche pas l'état de session, donc pas
 * d'AuthFacade). ANTI-ÉNUMÉRATION : quel que soit le résultat (202 toujours côté
 * backend), on affiche un message neutre identique et on masque le formulaire.
 * Ne révèle JAMAIS si un compte existe.
 */
@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    Alert,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  /** Message neutre fixe affiché après une demande réussie (anti-énumération). */
  protected readonly neutralMessage =
    'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.';

  readonly loading = signal(false);
  /** Erreur réseau générique (jamais d'info sur l'existence du compte). */
  readonly errorMessage = signal<string | null>(null);
  /** Passe à `true` après une réponse réussie : masque le formulaire. */
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.controls.email;
  }

  /** Soumet la demande de réinitialisation. */
  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(this.email.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.loading.set(false);
        // Message générique : ne révèle rien sur l'existence du compte.
        this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }
}
