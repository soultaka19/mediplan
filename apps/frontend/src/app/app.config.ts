import { registerLocaleData } from '@angular/common';
import localeFrCa from '@angular/common/locales/fr-CA';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withViewTransitions } from '@angular/router';

import { authBearerInterceptor, authErrorInterceptor } from '@core/http';
import { routes } from './app.routes';

// Données de locale fr-CA : formats de date/heure, séparateurs, etc. Utilisées
// par le pipe `date`, le calendrier (MatDatepicker) et le sélecteur d'heure.
registerLocaleData(localeFrCa);

/** Libellés accessibles français du calendrier (sinon anglais par défaut). */
function frenchDatepickerIntl(): MatDatepickerIntl {
  const intl = new MatDatepickerIntl();
  intl.calendarLabel = 'Calendrier';
  intl.openCalendarLabel = 'Ouvrir le calendrier';
  intl.closeCalendarLabel = 'Fermer le calendrier';
  intl.prevMonthLabel = 'Mois précédent';
  intl.nextMonthLabel = 'Mois suivant';
  intl.prevYearLabel = 'Année précédente';
  intl.nextYearLabel = 'Année suivante';
  intl.prevMultiYearLabel = 'Vingt années précédentes';
  intl.nextMultiYearLabel = 'Vingt années suivantes';
  intl.switchToMonthViewLabel = 'Choisir une date';
  intl.switchToMultiYearViewLabel = "Choisir le mois et l'année";
  return intl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Conservé : le reste du projet est en zone-based (pas de zoneless ici).
    provideZoneChangeDetection({ eventCoalescing: true }),
    // `withViewTransitions` : fondu natif entre deux écrans (API View Transitions).
    // Le contenu sortant reste visible jusqu'à ce que l'entrant soit prêt, ce qui
    // supprime le flash blanc au changement de page. Les navigateurs sans support
    // ignorent simplement l'effet — la navigation reste identique.
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authBearerInterceptor, authErrorInterceptor])),
    // Requis par les composants Material animés (sidenav, menu, snackbar).
    provideAnimationsAsync(),
    // Sélection de date/heure souple (calendrier + heures) en français canadien.
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'fr-CA' },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-CA' },
    // Traductions françaises des libellés accessibles du calendrier (le sélecteur
    // d'heure se traduit via `aria-label` sur chaque `mat-timepicker-toggle`).
    { provide: MatDatepickerIntl, useFactory: frenchDatepickerIntl },
  ],
};
