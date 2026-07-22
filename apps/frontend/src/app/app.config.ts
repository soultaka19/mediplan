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
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { authBearerInterceptor, authErrorInterceptor } from '@core/http';
import { routes } from './app.routes';

// Données de locale fr-CA : formats de date/heure, séparateurs, etc. Utilisées
// par le pipe `date`, le calendrier (MatDatepicker) et le sélecteur d'heure.
registerLocaleData(localeFrCa);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Conservé : le reste du projet est en zone-based (pas de zoneless ici).
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authBearerInterceptor, authErrorInterceptor])),
    // Requis par les composants Material animés (sidenav, menu, snackbar).
    provideAnimationsAsync(),
    // Sélection de date/heure souple (calendrier + heures) en français canadien.
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'fr-CA' },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-CA' },
  ],
};
