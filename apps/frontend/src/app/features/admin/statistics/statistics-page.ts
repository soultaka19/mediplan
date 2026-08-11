import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PublicUser } from '@core/auth';
import { UserService } from '@features/admin/users/user.service';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, Skeleton } from '@shared/ui';
import { DoctorStatistics, StatisticsResponse } from './statistics.models';
import { StatisticsService } from './statistics.service';

interface KpiCard {
  icon: string;
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-statistics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.scss',
})
export class StatisticsPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly statisticsService = inject(StatisticsService);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statistics = signal<StatisticsResponse | null>(null);
  readonly doctors = signal<readonly PublicUser[]>([]);

  protected readonly displayedColumns = [
    'doctor',
    'appointments',
    'noShow',
    'slots',
    'occupancy',
  ] as const;
  protected readonly skeletonRows = Array.from({ length: 4 });

  readonly filtersForm = this.fb.group({
    startDate: [this.toDateInputValue(this.daysBefore(new Date(), 30))],
    endDate: [this.toDateInputValue(new Date())],
    doctorId: [''],
  });

  readonly isEmpty = computed(
    () =>
      !this.loading() &&
      this.error() === null &&
      this.statistics() !== null &&
      this.statistics()!.summary.totalSlots === 0 &&
      this.statistics()!.summary.totalAppointments === 0,
  );

  readonly kpis = computed<readonly KpiCard[]>(() => {
    const summary = this.statistics()?.summary;
    if (!summary) {
      return [];
    }

    return [
      {
        icon: 'event_available',
        label: 'Volume RDV',
        value: String(summary.totalAppointments),
        hint: `${summary.completedAppointments} terminés, ${summary.cancelledAppointments} annulés`,
      },
      {
        icon: 'person_off',
        label: 'No-show',
        value: `${summary.noShowRate} %`,
        hint: `${summary.noShowAppointments} patient(s) absent(s)`,
      },
      {
        icon: 'donut_large',
        label: 'Occupation',
        value: `${summary.occupancyRate} %`,
        hint: `${summary.occupiedSlots}/${summary.totalSlots} créneaux occupés`,
      },
    ];
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const values = this.filtersForm.getRawValue();

    forkJoin({
      users: this.userService.listUsers(),
      statistics: this.statisticsService.getActivity({
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        doctorId: values.doctorId || undefined,
      }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, statistics }) => {
          this.doctors.set(users.filter((user) => user.role === 'doctor'));
          this.statistics.set(statistics);
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  protected doctorLabel(doctor: PublicUser): string {
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || `Médecin ${doctor.id.slice(0, 8)}`;
  }

  protected doctorRows(): readonly DoctorStatistics[] {
    return this.statistics()?.byDoctor ?? [];
  }

  protected formatPeriod(): string {
    const filters = this.statistics()?.filters;
    if (!filters) {
      return '';
    }

    return `${this.formatDate(filters.startDate)} - ${this.formatDate(filters.endDate)}`;
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
  }

  private daysBefore(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
