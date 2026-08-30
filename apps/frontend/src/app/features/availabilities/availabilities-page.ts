import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

import { AuthFacade, PublicUser } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import {
  EmptyState,
  ErrorState,
  NotificationService,
  StatusChip,
  StatusChipModel,
} from '@shared/ui';
import { UserService } from '@features/admin/users/user.service';
import { Availability, AvailabilityType } from './availability.models';
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

/** Validateur croisé posé sur `endTime` : l'heure de fin doit suivre le début. */
function endAfterStart(control: AbstractControl): ValidationErrors | null {
  const start = control.parent?.get('startTime')?.value as Date | null | undefined;
  const end = control.value as Date | null;
  if (!start || !end) return null;
  return minutesOfDay(end) > minutesOfDay(start) ? null : { endBeforeStart: true };
}

/** Index d'un jour (à minuit), pour comparer des dates sans l'heure. */
function dayIndex(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Validateur croisé posé sur `endDate` : la fin ne précède pas le début. */
function endDateNotBeforeStart(control: AbstractControl): ValidationErrors | null {
  const start = control.parent?.get('startDate')?.value as Date | null | undefined;
  const end = control.value as Date | null;
  if (!start || !end) return null;
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

/** Garde-fou : plage maximale créée en une fois. */
const MAX_RANGE_DAYS = 62;

/**
 * Nombre de plages affichées par médecin et par page. Un médecin peut cumuler
 * plusieurs dizaines de plages (une par jour ouvré) : sans pagination, la carte
 * dépliée devenait une liste interminable et illisible.
 */
const AVAILABILITY_PAGE_SIZE = 8;

/** Groupe de disponibilités par médecin (carte repliable et paginée). */
interface DoctorGroup {
  readonly doctorId: string;
  readonly name: string;
  readonly initials: string;
  readonly summary: string;
  readonly open: boolean;
  /** Lignes de la page courante uniquement. */
  readonly rows: readonly AvailabilityRowView[];
  readonly totalRows: number;
  readonly rangeLabel: string;
  readonly canPrev: boolean;
  readonly canNext: boolean;
}

/** Ligne de disponibilité prête à l'affichage. */
interface AvailabilityRowView {
  readonly item: Availability;
  readonly chip: StatusChipModel;
  readonly date: string;
  readonly hours: string;
  readonly slot: string;
  readonly note: string;
  readonly notePlaceholder: boolean;
}

/** Puce de type de plage (Disponible / Congé). */
function typeChip(type: AvailabilityType): StatusChipModel {
  return type === 'time_off'
    ? { tone: 'absent', label: 'Congé' }
    : { tone: 'done', label: 'Disponible' };
}

/** Initiales (2 lettres max) à partir d'un nom affiché. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Disponibilités (redesign MediPlan.dc.html §dispo).
 *
 * Liste en cartes groupées par médecin (repliables, résumé d'heures), type en
 * `StatusChip`. Le formulaire d'ajout (Material datepicker/timepicker, validateurs
 * croisés, aperçu de créneaux, création multi-jours) est ouvert en panneau
 * latéral. Logique métier inchangée.
 */
@Component({
  selector: 'app-availabilities-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
    EmptyState,
    ErrorState,
    StatusChip,
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
  readonly slotPreview = signal<string | null>(null);
  readonly showAdvanced = signal(false);

  /** Panneau latéral « Ajouter une plage » ouvert. */
  readonly panelOpen = signal(false);
  /** Médecins repliés (par id). */
  private readonly collapsed = signal<ReadonlySet<string>>(new Set());
  /** Page courante de chaque médecin (0 par défaut). */
  private readonly pageByDoctor = signal<ReadonlyMap<string, number>>(new Map());

  protected readonly slotDurationOptions = [15, 20, 30, 45, 60] as const;

  readonly currentUser = this.auth.currentUser;
  readonly isDoctor = computed(() => this.currentUser()?.role === 'doctor');
  readonly isEmpty = computed(
    () => !this.loading() && this.loadError() === null && this.availabilities().length === 0,
  );

  protected readonly skeletonRows = Array.from({ length: 3 });
  protected readonly minDate = startOfToday();

  /** Disponibilités groupées par médecin, prêtes pour les cartes repliables. */
  readonly doctorGroups = computed<readonly DoctorGroup[]>(() => {
    const sorted = [...this.availabilities()].sort((a, b) => a.startAt.localeCompare(b.startAt));
    const byDoctor = new Map<string, Availability[]>();
    for (const a of sorted) {
      const list = byDoctor.get(a.doctorId) ?? [];
      list.push(a);
      byDoctor.set(a.doctorId, list);
    }
    const collapsed = this.collapsed();
    const pages = this.pageByDoctor();
    return [...byDoctor.keys()]
      .sort((x, y) => this.doctorName(x).localeCompare(this.doctorName(y), 'fr'))
      .map((doctorId) => {
        const items = byDoctor.get(doctorId)!;
        const name = this.doctorName(doctorId);
        const available = items.filter((i) => i.type === 'available').length;
        const off = items.length - available;
        const parts = [`${items.length} plage${items.length > 1 ? 's' : ''}`];
        if (off > 0) parts.push(`${off} congé${off > 1 ? 's' : ''}`);

        // La page est bornée ici plutôt qu'au clic : une suppression peut vider
        // la dernière page, qui doit alors se replier sur la précédente.
        const total = items.length;
        const lastPage = Math.max(0, Math.ceil(total / AVAILABILITY_PAGE_SIZE) - 1);
        const page = Math.min(pages.get(doctorId) ?? 0, lastPage);
        const start = page * AVAILABILITY_PAGE_SIZE;
        const end = Math.min(start + AVAILABILITY_PAGE_SIZE, total);

        return {
          doctorId,
          name,
          initials: initialsOf(name),
          summary: parts.join(' · '),
          open: !collapsed.has(doctorId),
          rows: items.slice(start, end).map((item) => this.toRow(item)),
          totalRows: total,
          rangeLabel: total === 0 ? '0' : `${start + 1} – ${end} sur ${total}`,
          canPrev: page > 0,
          canNext: page < lastPage,
        };
      });
  });

  readonly form = this.fb.group({
    doctorId: this.fb.control(''),
    type: this.fb.control<AvailabilityType>('available', { validators: [Validators.required] }),
    startDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endDate: this.fb.control<Date | null>(null, {
      validators: [Validators.required, endDateNotBeforeStart],
    }),
    startTime: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    endTime: this.fb.control<Date | null>(null, {
      validators: [Validators.required, endAfterStart],
    }),
    slotDurationMin: this.fb.control(30, {
      validators: [Validators.required, Validators.min(5), Validators.max(240)],
    }),
    note: this.fb.control(''),
  });

  constructor() {
    this.load();

    this.form.controls.startDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((start) => {
        const end = this.form.controls.endDate.value;
        if (start && (!end || dayIndex(end) < dayIndex(start))) {
          this.form.controls.endDate.setValue(start);
        }
        this.form.controls.endDate.updateValueAndValidity({ emitEvent: false });
      });

    this.form.controls.startTime.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.endTime.updateValueAndValidity({ emitEvent: false }));

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

  /** Ouvre le panneau d'ajout. */
  openPanel(): void {
    this.error.set(null);
    this.panelOpen.set(true);
  }

  /** Ferme le panneau d'ajout. */
  closePanel(): void {
    this.panelOpen.set(false);
  }

  /** Échap ferme le panneau d'ajout (convention modale + accessibilité). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.panelOpen()) this.closePanel();
  }

  /**
   * Vrai si le formulaire peut être soumis : validité standard + médecin choisi
   * (obligatoire quand l'utilisateur n'est pas lui-même médecin). Utilisé pour
   * désactiver « Ajouter » tant que le formulaire est incomplet — même patron que
   * la réservation, pour une soumission cohérente dans toute l'application.
   */
  protected canSubmit(): boolean {
    return this.form.valid && (this.isDoctor() || !!this.form.controls.doctorId.value);
  }

  /** Replie/déplie un groupe de médecin. */
  toggleGroup(doctorId: string): void {
    const next = new Set(this.collapsed());
    if (next.has(doctorId)) next.delete(doctorId);
    else next.add(doctorId);
    this.collapsed.set(next);
  }

  /** Page précédente des plages d'un médecin. */
  prevPage(doctorId: string): void {
    this.shiftPage(doctorId, -1);
  }

  /** Page suivante des plages d'un médecin. */
  nextPage(doctorId: string): void {
    this.shiftPage(doctorId, 1);
  }

  /**
   * Décale la page d'un médecin. La borne haute est appliquée par
   * `doctorGroups` : on se contente ici d'empêcher les pages négatives.
   */
  private shiftPage(doctorId: string, delta: number): void {
    const next = new Map(this.pageByDoctor());
    next.set(doctorId, Math.max(0, (next.get(doctorId) ?? 0) + delta));
    this.pageByDoctor.set(next);
  }

  private computeSlotPreview(): string | null {
    const { type, startDate, endDate, startTime, endTime, slotDurationMin } =
      this.form.getRawValue();

    const days =
      startDate && endDate && dayIndex(endDate) >= dayIndex(startDate)
        ? eachDay(startDate, endDate).length
        : 0;

    if (type === 'time_off') {
      return days > 0
        ? `Congé sur ${days} jour${days > 1 ? 's' : ''} — aucun créneau généré.`
        : null;
    }

    if (!days || !startTime || !endTime || !slotDurationMin) return null;
    const span = minutesOfDay(endTime) - minutesOfDay(startTime);
    if (span <= 0) return null;
    const perDay = Math.floor(span / slotDurationMin);
    if (perDay <= 0)
      return `La plage horaire est plus courte qu'un créneau de ${slotDurationMin} min.`;
    if (days === 1)
      return `≈ ${perDay} créneau${perDay > 1 ? 'x' : ''} de ${slotDurationMin} min réservables.`;
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

    const targetDoctorId = this.isDoctor() ? (this.currentUser()?.id ?? '') : value.doctorId;
    const startMin = minutesOfDay(value.startTime!);
    const endMin = minutesOfDay(value.endTime!);
    const alreadyCovered = (day: Date): boolean =>
      this.availabilities().some((existing) => {
        if (existing.doctorId !== targetDoctorId) return false;
        const existingStart = new Date(existing.startAt);
        if (dayIndex(existingStart) !== dayIndex(day)) return false;
        return (
          minutesOfDay(existingStart) < endMin && startMin < minutesOfDay(new Date(existing.endAt))
        );
      });

    const daysToCreate = days.filter((day) => !alreadyCovered(day));
    const alreadyDefined = days.length - daysToCreate.length;

    if (daysToCreate.length === 0) {
      this.error.set('Toute la plage est déjà définie pour ce médecin sur ce créneau horaire.');
      return;
    }

    this.saving.set(true);

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
          this.closePanel();
          this.notifications
            .successDialog(title, message)
            .afterClosed()
            .subscribe(() => {
              this.form.markAsUntouched();
              this.form.markAsPristine();
            });
        } else {
          this.error.set('Aucune disponibilité créée : la plage est déjà définie pour ce médecin.');
        }
        this.load();
      });
  }

  protected toggleAdvanced(): void {
    this.showAdvanced.update((visible) => !visible);
  }

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
      days.length > 1
        ? `du ${dateFmt.format(first)} au ${dateFmt.format(last)}`
        : `le ${dateFmt.format(first)}`;

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
      lines.push(
        `${skipped} jour${skipped > 1 ? 's' : ''} déjà défini${skipped > 1 ? 's' : ''} : ignoré${skipped > 1 ? 's' : ''}.`,
      );
    }
    return { title, message: lines.join('\n') };
  }

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
        this.load();
      },
      error: (err: unknown) => {
        this.notifications.error(authErrorMessage(err));
      },
    });
  }

  protected doctorName(doctorId: string): string {
    const current = this.currentUser();
    if (current && current.id === doctorId) {
      const self = [current.firstName, current.lastName].filter(Boolean).join(' ').trim();
      if (self) return self;
    }
    const doctor = this.doctors().find((item) => item.id === doctorId);
    if (!doctor) return 'Médecin';
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || 'Médecin';
  }

  /** Date seule, lisible (ex. « 22 juill. 2026 »). */
  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
  }

  /** Heure seule (ex. « 08:30 »). */
  private formatTime(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(new Date(value));
  }

  private toRow(item: Availability): AvailabilityRowView {
    return {
      item,
      chip: typeChip(item.type),
      date: this.formatDate(item.startAt),
      hours: `${this.formatTime(item.startAt)} – ${this.formatTime(item.endAt)}`,
      slot: `${item.slotDurationMin} min`,
      note: item.note?.trim() ? item.note : '—',
      notePlaceholder: !item.note?.trim(),
    };
  }

  private combine(date: Date, time: Date): Date {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  }
}
