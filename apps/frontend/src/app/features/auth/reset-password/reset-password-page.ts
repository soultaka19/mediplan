import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, PASSWORD_MIN_LENGTH, strongPasswordValidator } from '@core/auth';
import { Alert, NotificationService } from '@shared/ui';
import { authErrorMessage } from '@shared/http/http-error-message';

/**
 * Validateur de groupe : vérifie que `confirmPassword` correspond à
 * `newPassword`. Pose l'erreur `passwordMismatch` au niveau du groupe.
 */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value as string;
  const confirmPassword = group.get('confirmPassword')?.value as string;
  if (!confirmPassword) {
    return null;
  }
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * Écran « Réinitialiser le mot de passe » (composant smart).
 *
 * Le `token` provient du query param de l'URL (`/reset-password?token=...`), pas
 * du formulaire. Sans token, la soumission est interdite. Appelle directement
 * `AuthService` (hors état de session). Succès (200) → message + redirection
 * vers `/login`.
 */
@Component({
  selector: 'app-reset-password-page',
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
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  /** Jeton lu depuis l'URL au chargement (peut être `null` si absent). */
  private readonly token = this.route.snapshot.queryParamMap.get('token');
  /** `true` si l'URL contient un jeton exploitable. */
  readonly hasToken = signal<boolean>(!!this.token);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  get newPassword() {
    return this.form.controls.newPassword;
  }

  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  /** Soumet la réinitialisation du mot de passe. */
  submit(): void {
    this.errorMessage.set(null);

    if (!this.token) {
      this.errorMessage.set('Lien invalide : jeton de réinitialisation manquant.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.token, this.newPassword.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        // Toast persistant après navigation (le message inline disparaîtrait
        // instantanément avec la redirection) — cf. NotificationService.
        this.notifications.success(
          response?.message ?? 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.',
        );
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        // 400 générique « Jeton invalide ou expiré. » privilégié par le helper.
        this.errorMessage.set(authErrorMessage(error));
      },
    });
  }
}
