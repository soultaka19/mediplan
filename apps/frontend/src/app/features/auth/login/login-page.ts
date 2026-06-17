import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthFacade } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';

/**
 * Écran de connexion (composant smart).
 *
 * Orchestre le formulaire réactif typé et l'appel via l'AuthFacade. Les états
 * `loading`/`error` sont exposés en signals ; aucun appel HTTP direct ici.
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  /** Soumission en cours : désactive le bouton et les champs. */
  readonly loading = signal(false);
  /** Message d'erreur serveur à afficher, ou `null`. */
  readonly errorMessage = signal<string | null>(null);

  /** Formulaire réactif typé. */
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  /** Soumet le formulaire de connexion. */
  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(authErrorMessage(error));
      },
    });
  }
}
