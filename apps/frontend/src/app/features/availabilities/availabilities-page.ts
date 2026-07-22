import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { AuthFacade, PublicUser } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, ErrorState, NotificationService, Skeleton } from '@shared/ui';
import { UserService } from '@features/admin/users/user.service';
import { Availability, AvailabilitySlot, AvailabilityType } from './availability.models';
import { AvailabilityService } from './availability.service';

/** Minuit d'aujourd'hui : borne minimale du calendrier (pas de plage passée). */
function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Minutes depuis minuit d'une heure (issue du sélecteur d'heure). */
function minutesOfDay(time: Date): number {
  return time.getHours() * 60 + time.getMinutes();
}

/**
 * Validateur croisé posé sur `endTime` : l'heure de fin doit suivre l'heure de
 * début. Lit `startTime` via le groupe parent ; ne se déclenche que si les deux
 * heures sont renseignées.
 */
function endAfterStart(control: AbstractControl): ValidationErrors | null {
  const start = control.parent?.get('startTime')?.value as Date | null | undefined;
  const end = control.value as Date | null;
  if (!start || !end) {
    return null;
  }
  return minutesOfDay(end) > minutesOfDay(start) ? null : { endBeforeStart: true };
}

/** Index d'un jour (à minuit), pour comparer des dates sans tenir compte de l'heure. */
function dayIndex(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Validateur croisé posé sur `endDate` : la date de fin ne précède pas le début. */
function endDateNotBeforeStart(control: AbstractControl): ValidationErrors | null {
  const start = control.parent?.get('startDate')?.value as Date | null | undefined;
  const end = control.value as Date | null;
  if (!start || !end) {
    return null;
  }
  return dayIndex(end) >= dayIndex(start) ? null : { endDateBeforeStart: true };
}

/** Liste des jours (à minuit) de `start` à `end` inclus. */
function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Garde-fou : plage maximale créée en une fois (évite les boucles accidentelles). */
const MAX_RANGE_DAYS = 62;

/** En-tête de groupe (médecin) inséré dans les lignes du tableau groupé. */
interface DoctorGroupRow {
  readonly group: true;
  readonly doctorId: string;
  readonly doctorName: string;
  readonly count: number;
}

/** Ligne du tableau : soit un en-tête de médecin, soit une disponibilité. */
type AvailabilityRow = DoctorGroupRow | Availability;

@Component({
  selector: 'app-availabilities-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTimepickerModule,
    Alert,
    EmptyState,
    ErrorState,
    Skeleton,
  ],
  templateUrl: './availabilities-page.html',
  styleUrl: './availabilities-page.scss',
})
export class AvailabilitiesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthFacade);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  /** Erreur inline du formulaire (soumission). */
  readonly error = signal<string | null>(null);
  /** Erreur de chargement de la liste (état d'erreur avec reprise). */
  readonly loadError = signal<string | null>(null);
  readonly availabilities = signal<readonly Availability[]>([]);
  readonly doctors = signal<readonly PublicUser[]>([]);
  readonly selectedSlots = signal<readonly AvailabilitySlot[]>([]);
  readonly selectedAvailabilityId = signal<string | null>(null);
  /** Terme de recherche sur la liste des disponibilités. */
  readonly searchTerm = signal('');
  /** Aperçu en direct des créneaux que la plage saisie va générer. */
  readonly slotPreview = signal<string | null>(null);
  /** Repli des options secondaires (type, durée, note) pour un formulaire épuré. */
  readonly showAdvanced = signal(false);

  /** Ancre de la liste, pour y défiler après un ajout réussi. */
  private readonly listAnchor = viewChild<ElementRef<HTMLElement>>('listAnchor');

  /** Pas de réservation proposés (réglage de clinique, pas la durée réelle). */
  protected readonly slotDurationOptions = [15, 20, 30, 45, 60] as const;

  readonly currentUser = this.auth.currentUser;
  readonly isDoctor = computed(() => this.currentUser()?.role === 'doctor');
  readonly isEmpty = computed(
    () => !this.loading() && this.loadError() === null && this.availabilities().length === 0,
  );

  /** Disponibilités filtrées par la recherche (médecin, type, note, horaire). */
  readonly filteredAvailabilities = computed<readonly Availability[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.availabilities();
    if (!term) {
      return all;
    }
    return all.filter((a) =>
      [
        this.doctorName(a.doctorId),
        this.typeLabel(a.type),
        a.note ?? '',
        this.formatDate(a.startAt),
        this.formatTime(a.startAt),
        this.formatTime(a.endAt),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  });

  /** Nombre de disponibilités après filtre (0 = aucun résultat). */
  readonly filteredCount = computed(() => this.filteredAvailabilities().length);

  /**
   * Lignes du tableau, groupées par médecin (nom affiché une seule fois en
   * en-tête). Pour un médecin qui consulte ses propres plages, aucun en-tête
   * (une seule personne) : on renvoie directement ses disponibilités triées.
   */
  readonly groupedRows = computed<AvailabilityRow[]>(() => {
    const filtered = [...this.filteredAvailabilities()].sort((a, b) =>
      a.startAt.localeCompare(b.startAt),
    );

    if (this.isDoctor()) {
      return filtered;
    }

    const byDoctor = new Map<string, Availability[]>();
    for (const availability of filtered) {
      const list = byDoctor.get(availability.doctorId) ?? [];
      list.push(availability);
      byDoctor.set(availability.doctorId, list);
    }

    const orderedDoctorIds = [...byDoctor.keys()].sort((x, y) =>
      this.doctorName(x).localeCompare(this.doctorName(y), 'fr'),
    );

    const rows: AvailabilityRow[] = [];
    for (const doctorId of orderedDoctorIds) {
      const items = byDoctor.get(doctorId)!;
      rows.push({ group: true, doctorId, doctorName: this.doctorName(doctorId), count: items.length });
      rows.push(...items);
    }
    return rows;
  });

  /** Prédicat de ligne : vrai pour un en-tête de groupe (médecin). */
  protected readonly isGroupRow = (_: number, row: AvailabilityRow): row is DoctorGroupRow =>
    (row as DoctorGroupRow).group === true;

  /** Colonnes de données (le médecin est porté par l'en-tête de groupe). */
  protected readonly displayedColumns = ['type', 'period', 'duration', 'note', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 4 });
  /** Borne minimale du calendrier (aujourd'hui). */
  protected readonly minDate = startOfToday();

  readonly form = this.fb.group({
    doctorId: this.fb.control(''),
    type: this.fb.control<AvailabilityType>('available', { validators: [Validators.required] }),
    startDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endDate: this.fb.control<Date | null>(null, {
      validators: [Validators.required, endDateNotBeforeStart],
    }),
    startTime: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endTime: this.fb.control<Date | null>(null, { validators: [Validators.required, endAfterStart] }),
    slotDurationMin: this.fb.control(30, {
      validators: [Validators.required, Validators.min(5), Validators.max(240)],
    }),
    note: this.fb.control(''),
  });

  constructor() {
    this.load();

    // Date de fin : par défaut = date de début (cas « journée unique » en un clic),
    // et on revalide la règle « fin ≥ début » à chaque changement de début.
    this.form.controls.startDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((start) => {
        const end = this.form.controls.endDate.value;
        if (start && (!end || dayIndex(end) < dayIndex(start))) {
          this.form.controls.endDate.setValue(start);
        }
        this.form.controls.endDate.updateValueAndValidity({ emitEvent: false });
      });

    // Revalide l'heure de fin quand l'heure de début change (règle « fin > début »).
    this.form.controls.startTime.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.endTime.updateValueAndValidity({ emitEvent: false }));

    // Aperçu en direct des créneaux à partir de la plage + du pas choisi.
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.slotPreview.set(this.computeSlotPreview()));
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const doctors$ = this.isDoctor()
      ? of([] as PublicUser[])
      : this.userService.listUsers().pipe(catchError(() => of([] as PublicUser[])));

    forkJoin({
      availabilities: this.availabilityService.listAvailabilities(),
      doctors: doctors$,
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ availabilities, doctors }) => {
          this.doctors.set(doctors.filter((doctor) => doctor.role === 'doctor'));
          this.availabilities.set(availabilities);
        },
        error: (err: unknown) => {
          this.loadError.set(authErrorMessage(err));
        },
      });
  }

  /** Met à jour le terme de recherche (le filtrage/regroupement est réactif). */
  applyFilter(value: string): void {
    this.searchTerm.set(value);
  }

  /**
   * Décrit, en une ligne, ce que la plage saisie va produire : « ≈ N créneaux de
   * D min ». Renvoie null si les données sont incomplètes ou incohérentes ; pour
   * un congé, le rappelle explicitement (aucun créneau généré).
   */
  private computeSlotPreview(): string | null {
    const { type, startDate, endDate, startTime, endTime, slotDurationMin } =
      this.form.getRawValue();

    const days =
      startDate && endDate && dayIndex(endDate) >= dayIndex(startDate)
        ? eachDay(startDate, endDate).length
        : 0;

    if (type === 'time_off') {
      return days > 0 ? `Congé sur ${days} jour${days > 1 ? 's' : ''} — aucun créneau généré.` : null;
    }

    if (!days || !startTime || !endTime || !slotDurationMin) {
      return null;
    }
    const span = minutesOfDay(endTime) - minutesOfDay(startTime);
    if (span <= 0) {
      return null;
    }
    const perDay = Math.floor(span / slotDurationMin);
    if (perDay <= 0) {
      return `La plage horaire est plus courte qu'un créneau de ${slotDurationMin} min.`;
    }
    if (days === 1) {
      return `≈ ${perDay} créneau${perDay > 1 ? 'x' : ''} de ${slotDurationMin} min réservables.`;
    }
    return `≈ ${days} jours × ${perDay} = ${perDay * days} créneaux de ${slotDurationMin} min.`;
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isDoctor() && !this.form.controls.doctorId.value) {
      this.form.controls.doctorId.setErrors({ required: true });
      this.form.controls.doctorId.markAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const days = eachDay(value.startDate!, value.endDate!);
    if (days.length > MAX_RANGE_DAYS) {
      this.error.set(`La plage est trop longue (maximum ${MAX_RANGE_DAYS} jours en une fois).`);
      return;
    }

    // Le backend n'empêche pas les chevauchements : on saute côté client les
    // jours où le médecin a déjà une disponibilité qui recouvre ce créneau
    // horaire, pour ne pas créer de doublons.
    const targetDoctorId = this.isDoctor() ? (this.currentUser()?.id ?? '') : value.doctorId;
    const startMin = minutesOfDay(value.startTime!);
    const endMin = minutesOfDay(value.endTime!);
    const alreadyCovered = (day: Date): boolean =>
      this.availabilities().some((existing) => {
        if (existing.doctorId !== targetDoctorId) {
          return false;
        }
        const existingStart = new Date(existing.startAt);
        if (dayIndex(existingStart) !== dayIndex(day)) {
          return false;
        }
        // Chevauchement horaire : [aStart, aEnd) ∩ [start, end) ≠ ∅.
        return minutesOfDay(existingStart) < endMin && startMin < minutesOfDay(new Date(existing.endAt));
      });

    const daysToCreate = days.filter((day) => !alreadyCovered(day));
    const alreadyDefined = days.length - daysToCreate.length;

    if (daysToCreate.length === 0) {
      this.error.set('Toute la plage est déjà définie pour ce médecin sur ce créneau horaire.');
      return;
    }

    this.saving.set(true);

    // Une disponibilité par jour restant, avec le même horaire journalier. Chaque
    // création est isolée : un échec ponctuel n'interrompt pas toute la plage.
    const requests = daysToCreate.map((day) =>
      this.availabilityService
        .createAvailability({
          doctorId: this.isDoctor() ? undefined : value.doctorId,
          type: value.type,
          startAt: this.combine(day, value.startTime!).toISOString(),
          endAt: this.combine(day, value.endTime!).toISOString(),
          slotDurationMin: value.slotDurationMin,
          note: value.note.trim() || undefined,
        })
        .pipe(
          map(() => true),
          catchError(() => of(false)),
        ),
    );

    forkJoin(requests)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((results) => {
        const created = results.filter(Boolean).length;
        const skipped = alreadyDefined + (results.length - created);

        if (created > 0) {
          const { title, message } = this.buildSuccessNotice(created, skipped, daysToCreate, value);
          this.resetForm();
          this.notifications
            .successDialog(title, message)
            .afterClosed()
            .subscribe(() => {
              // Le retour de focus du dialogue peut « toucher » un champ vidé et
              // afficher une erreur : on remet le formulaire à l'état intact,
              // puis on défile vers la liste où figure la nouvelle plage.
              this.form.markAsUntouched();
              this.form.markAsPristine();
              this.scrollToList();
            });
        } else {
          this.error.set('Aucune disponibilité créée : la plage est déjà définie pour ce médecin.');
        }
        this.load();
      });
  }

  /** Affiche/masque les options secondaires (type, durée, note). */
  protected toggleAdvanced(): void {
    this.showAdvanced.update((visible) => !visible);
  }

  /** Défile en douceur jusqu'à la liste des disponibilités. */
  private scrollToList(): void {
    this.listAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Compose le titre + message clair du popup de confirmation d'ajout. */
  private buildSuccessNotice(
    created: number,
    skipped: number,
    days: readonly Date[],
    value: {
      doctorId: string;
      type: AvailabilityType;
      startTime: Date | null;
      endTime: Date | null;
      slotDurationMin: number;
    },
  ): { title: string; message: string } {
    const plural = created > 1 ? 's' : '';
    const title = `Disponibilité${plural} ajoutée${plural}`;

    const dateFmt = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' });
    const timeFmt = (time: Date): string =>
      new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(time);

    const who = this.isDoctor() ? 'Vos disponibilités' : this.doctorName(value.doctorId);
    const first = days[0];
    const last = days[days.length - 1];
    const dateText =
      days.length > 1 ? `du ${dateFmt.format(first)} au ${dateFmt.format(last)}` : `le ${dateFmt.format(first)}`;

    const lines: string[] = [];
    if (value.type === 'time_off') {
      lines.push(`${who} — congé ${dateText}.`);
    } else {
      lines.push(
        `${who} — ${dateText}, de ${timeFmt(value.startTime!)} à ${timeFmt(value.endTime!)}.`,
      );
      lines.push(`Pas de réservation : ${value.slotDurationMin} min par créneau.`);
    }
    if (skipped > 0) {
      lines.push(`${skipped} jour${skipped > 1 ? 's' : ''} déjà défini${skipped > 1 ? 's' : ''} : ignoré${skipped > 1 ? 's' : ''}.`);
    }
    return { title, message: lines.join('\n') };
  }

  /** Réinitialise le formulaire en conservant le médecin sélectionné. */
  private resetForm(): void {
    this.form.reset({
      doctorId: this.form.controls.doctorId.value,
      type: 'available',
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      slotDurationMin: 30,
      note: '',
    });
  }

  deleteAvailability(availability: Availability): void {
    this.availabilityService.deleteAvailability(availability.id).subscribe({
      next: () => {
        this.notifications.successDialog(
          'Disponibilité supprimée',
          'La plage et ses créneaux réservables ont été retirés.',
        );
        if (this.selectedAvailabilityId() === availability.id) {
          this.selectedAvailabilityId.set(null);
          this.selectedSlots.set([]);
        }
        this.load();
      },
      error: (err: unknown) => {
        this.notifications.error(authErrorMessage(err));
      },
    });
  }

  showSlots(availability: Availability): void {
    this.selectedAvailabilityId.set(availability.id);
    this.availabilityService.generateSlots(availability.id).subscribe({
      next: (slots) => this.selectedSlots.set(slots),
      error: (err: unknown) => this.notifications.error(authErrorMessage(err)),
    });
  }

  protected doctorName(doctorId: string): string {
    const doctor = this.doctors().find((item) => item.id === doctorId);
    if (!doctor) {
      return 'Médecin';
    }
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || 'Médecin';
  }

  protected typeLabel(type: AvailabilityType): string {
    return type === 'available' ? 'Disponible' : 'Congé';
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  /** Date seule, lisible (ex. « 22 juill. 2026 »). */
  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
  }

  /** Heure seule (ex. « 08:30 »). */
  protected formatTime(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(new Date(value));
  }

  /** Combine une date (jour) et une heure (h/min) en un instant unique. */
  private combine(date: Date, time: Date): Date {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  }
}
