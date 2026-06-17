import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthFacade, PASSWORD_MIN_LENGTH, strongPasswordValidator } from '@core/auth';
import { RegisterPayload } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';

/**
 * Écran d'inscription patient (composant smart).
 *
 * SÉCURITÉ : n'envoie que email/password/firstName/lastName. Jamais `role` ni
 * `clinicId` — le backend force le rôle `patient` pour l'inscription libre.
 */
@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  /** Longueur minimale exposée au template (message d'aide). */
  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Formulaire réactif typé. Prénom/nom optionnels (alignés sur le DTO). */
  readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator()]],
  });

  get firstName() {
    return this.form.controls.firstName;
  }

  get lastName() {
    return this.form.controls.lastName;
  }

  get email() {
    return this.form.controls.email;
  }

  get password() {
    return this.form.controls.password;
  }

  /** Soumet le formulaire d'inscription. */
  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.register(this.buildPayload()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(authErrorMessage(error));
      },
    });
  }

  /** Construit le payload en omettant les champs optionnels vides. */
  private buildPayload(): RegisterPayload {
    const { email, password, firstName, lastName } = this.form.getRawValue();
    const payload: RegisterPayload = { email, password };
    if (firstName.trim()) {
      payload.firstName = firstName.trim();
    }
    if (lastName.trim()) {
      payload.lastName = lastName.trim();
    }
    return payload;
  }
}
