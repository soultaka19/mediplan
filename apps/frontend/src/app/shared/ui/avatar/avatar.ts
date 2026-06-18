import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Taille de l'avatar : `sm` (compact, toolbar) ou `md` (accueil dashboard). */
export type AvatarSize = 'sm' | 'md';

/**
 * Avatar à initiales déterministes (pas d'image — KISS, cf. roadmap UX §3.6).
 *
 * Calcule 1 à 2 lettres à partir du nom complet ; à défaut de nom, retombe sur
 * la première lettre de l'e-mail. Cercle tonal (fond `primary-container`, texte
 * `primary`). `aria-label` = nom complet (ou e-mail) pour les lecteurs d'écran.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  host: {
    '[class]': '"mp-avatar mp-avatar--" + size()',
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
})
export class Avatar {
  /** Nom complet affiché/source des initiales (ex. « Ada Lovelace »). */
  readonly name = input('');
  /** E-mail de repli quand le nom est absent. */
  readonly email = input('');
  /** Taille visuelle. */
  readonly size = input<AvatarSize>('md');

  /** Libellé accessible : nom complet, sinon e-mail, sinon « Utilisateur ». */
  readonly label = computed(() => this.name().trim() || this.email().trim() || 'Utilisateur');

  /** Initiales déterministes (1-2 lettres majuscules). */
  readonly initials = computed(() => {
    const name = this.name().trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    const email = this.email().trim();
    return email ? email[0].toUpperCase() : '?';
  });
}
