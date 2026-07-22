import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from '@core/theme';

/** Composant racine : héberge le routeur. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Instancie le thème dès la racine : son constructeur applique `data-theme`
  // sur <html>. Sans cela, seuls les écrans du shell seraient thémés, et la
  // connexion resterait en clair pour un utilisateur en mode sombre.
  private readonly themeService = inject(ThemeService);
}
