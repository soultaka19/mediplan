import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PublicUser } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, NotificationService, Skeleton } from '@shared/ui';
import { UserService } from './user.service';

@Component({
  selector: 'app-patient-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    Alert,
    Skeleton,
  ],
  templateUrl: './patient-edit-page.html',
  styleUrl: './patient-edit-page.scss',
})
export class PatientEditPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);

  readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly patient = signal<PublicUser | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(320)]],
  });

  constructor() {
    this.loadPatient();
  }

  loadPatient(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.listUsers().subscribe({
      next: (users) => {
        const patient = users.find((user) => user.id === this.patientId && user.role === 'patient');
        if (!patient) {
          this.error.set('Patient introuvable.');
          this.loading.set(false);
          return;
        }

        this.patient.set(patient);
        this.form.patchValue({
          firstName: patient.firstName ?? '',
          lastName: patient.lastName ?? '',
          email: patient.email ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.userService
      .updatePatient(this.patientId, {
        firstName: value.firstName.trim() || null,
        lastName: value.lastName.trim() || null,
        email: value.email.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('Patient modifie.');
          void this.router.navigate(['/admin/users']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(authErrorMessage(err));
        },
      });
  }
}
