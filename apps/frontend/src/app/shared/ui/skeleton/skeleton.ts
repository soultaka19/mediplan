import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloc de chargement (skeleton) tokenisé avec shimmer sobre (cf. roadmap UX §3.6).
 *
 * Largeur/hauteur paramétrables ; animation shimmer lente
 * (`--mp-motion-shimmer`) figée sous `prefers-reduced-motion`. Purement
 * décoratif : `aria-hidden="true"`. Le conteneur appelant porte `aria-busy`.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: '',
  styleUrl: './skeleton.scss',
  host: {
    class: 'mp-skeleton',
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
})
export class Skeleton {
  /** Largeur CSS (ex. « 100% », « 8rem »). */
  readonly width = input('100%');
  /** Hauteur CSS (ex. « 1rem », « 120px »). */
  readonly height = input('1rem');
}
