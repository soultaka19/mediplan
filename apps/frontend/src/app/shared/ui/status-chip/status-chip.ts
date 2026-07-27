import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatusChipModel, StatusTone } from './status-tones';

/**
 * Puce de statut réutilisable : pastille colorée + libellé (cf. redesign
 * MediPlan.dc.html). Couleurs portées par les tokens `--mp-status-{tone}-*`
 * (clair + sombre, AA) ; l'information reste portée par le texte, pas seulement
 * la couleur. Générique : sert RDV, disponibilités, comptes.
 *
 * Deux usages :
 * - `[model]` : passer directement un `StatusChipModel` (via `appointmentStatusChip(...)`) ;
 * - `[tone]` + `[label]` : composer à la main.
 */
@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './status-chip.html',
  styleUrl: './status-chip.scss',
})
export class StatusChip {
  /** Descripteur complet (prioritaire sur `tone`/`label`/`pulse`/`strike`). */
  readonly model = input<StatusChipModel | null>(null);

  /** Tonalité (si `model` absent). */
  readonly tone = input<StatusTone>('booked');
  /** Libellé (si `model` absent). */
  readonly label = input('');
  /** Pastille animée (si `model` absent). */
  readonly pulse = input(false);
  /** Libellé barré (si `model` absent). */
  readonly strike = input(false);

  /** Taille : `sm` (tables, 24px) ou `md` (flux actif, 26px). */
  readonly size = input<'sm' | 'md'>('sm');

  private readonly resolved = computed<StatusChipModel>(
    () =>
      this.model() ?? {
        tone: this.tone(),
        label: this.label(),
        pulse: this.pulse(),
        strike: this.strike(),
      },
  );

  readonly toneValue = computed(() => this.resolved().tone);
  readonly labelValue = computed(() => this.resolved().label);
  readonly isPulse = computed(() => this.resolved().pulse === true);
  readonly isStrike = computed(() => this.resolved().strike === true);

  /** Fond depuis le token de tonalité. */
  readonly bg = computed(() => `var(--mp-status-${this.toneValue()}-bg)`);
  /** Texte + pastille depuis le token de tonalité. */
  readonly fg = computed(() => `var(--mp-status-${this.toneValue()}-fg)`);
}
