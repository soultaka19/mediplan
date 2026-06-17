import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

/**
 * Layout « auth » (hors shell) pour les écrans publics login/register.
 *
 * Centre la carte sur le fond de page, avec le logo MediPlan au-dessus. Ne
 * contient ni toolbar ni sidenav (cf. design-system §7.1). Les écrans enfants
 * s'affichent dans le `<router-outlet>`.
 */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {}
