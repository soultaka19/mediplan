import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';

import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, Skeleton } from '@shared/ui';
import { Clinic, CreateClinicPayload } from './clinic.models';
import { ClinicService } from './clinic.service';

@Component({
  selector: 'app-clinics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './clinics-page.html',
  styleUrl: './clinics-page.scss',
})
export class ClinicsPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly clinicService = inject(ClinicService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly clinics = signal<readonly Clinic[]>([]);
  readonly editingClinicId = signal<string | null>(null);

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.clinics().length === 0,
  );

  protected readonly displayedColumns = ['name', 'hours', 'address', 'status', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 4 });

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    address: ['', [Validators.maxLength(255)]],
    openingHour: [''],
    closingHour: [''],
    isActive: [true],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clinicService.listClinics().subscribe({
      next: (clinics) => {
        this.clinics.set(clinics);
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

    const clinicId = this.editingClinicId();
    const payload = this.buildPayload();
    const request$ = clinicId
      ? this.clinicService.updateClinic(clinicId, payload)
      : this.clinicService.createClinic(payload);

    this.saving.set(true);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notifications.success(clinicId ? 'Clinique mise a jour.' : 'Clinique creee.');
        this.resetForm();
        this.load();
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
      },
    });
  }

  editClinic(clinic: Clinic): void {
    this.editingClinicId.set(clinic.id);
    this.form.setValue({
      name: clinic.name,
      address: clinic.address ?? '',
      openingHour: this.toInputTime(clinic.openingHour),
      closingHour: this.toInputTime(clinic.closingHour),
      isActive: clinic.isActive,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  protected hoursLabel(clinic: Clinic): string {
    if (!clinic.openingHour || !clinic.closingHour) {
      return 'Non configure';
    }
    return `${this.toInputTime(clinic.openingHour)} - ${this.toInputTime(clinic.closingHour)}`;
  }

  private buildPayload(): CreateClinicPayload {
    const value = this.form.getRawValue();
    return {
      name: value.name.trim(),
      address: value.address.trim() || undefined,
      openingHour: value.openingHour || undefined,
      closingHour: value.closingHour || undefined,
      isActive: value.isActive,
    };
  }

  private resetForm(): void {
    this.editingClinicId.set(null);
    this.form.reset({
      name: '',
      address: '',
      openingHour: '',
      closingHour: '',
      isActive: true,
    });
  }

  private toInputTime(value: string | null): string {
    return value?.slice(0, 5) ?? '';
  }
}
