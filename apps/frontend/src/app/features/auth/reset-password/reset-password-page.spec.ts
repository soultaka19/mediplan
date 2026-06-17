import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@core/auth';
import { NotificationService } from '@shared/ui';
import { ResetPasswordPage } from './reset-password-page';

/** Fake minimal d'AuthService contrôlable par test. */
function createFakeAuth() {
  return {
    resetPassword: vi.fn(),
  };
}

/** Fake de NotificationService (snackbar de succès). */
function createFakeNotifications() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

/** Fake d'ActivatedRoute exposant un query param `token`. */
function createFakeRoute(token: string | null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(token === null ? {} : { token }),
    },
  };
}

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

const VALID_PASSWORD = 'Str0ng!Pass';

describe('ResetPasswordPage', () => {
  let auth: ReturnType<typeof createFakeAuth>;
  let notifications: ReturnType<typeof createFakeNotifications>;

  function setup(token: string | null = 'reset-token-123') {
    auth = createFakeAuth();
    notifications = createFakeNotifications();
    TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
        { provide: ActivatedRoute, useValue: createFakeRoute(token) },
      ],
    });
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    return fixture;
  }

  it('réinitialise puis redirige vers /login en cas de succès (200)', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    auth.resetPassword.mockReturnValue(of({ message: 'Mot de passe réinitialisé.' }));

    component.form.setValue({ newPassword: VALID_PASSWORD, confirmPassword: VALID_PASSWORD });
    component.submit();
    fixture.detectChanges();

    expect(auth.resetPassword).toHaveBeenCalledWith('reset-token-123', VALID_PASSWORD);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(notifications.success).toHaveBeenCalledWith('Mot de passe réinitialisé.');
    expect(component.loading()).toBe(false);
  });

  it('affiche un message générique sur 400 jeton invalide', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    auth.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Jeton invalide ou expiré.' },
          }),
      ),
    );

    component.form.setValue({ newPassword: VALID_PASSWORD, confirmPassword: VALID_PASSWORD });
    component.submit();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'reset-error')).not.toBeNull();
    expect(component.errorMessage()).toBe('Jeton invalide ou expiré.');
  });

  it('bloque la soumission côté client si le mot de passe est faible', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'weak', confirmPassword: 'weak' });
    component.submit();
    fixture.detectChanges();

    expect(component.form.controls.newPassword.errors?.['weakPassword']).toBe(true);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('bloque la soumission si les mots de passe ne correspondent pas', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: VALID_PASSWORD, confirmPassword: 'Different1!' });
    component.submit();
    fixture.detectChanges();

    expect(component.form.errors?.['passwordMismatch']).toBe(true);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('interdit la soumission et signale le jeton manquant si absent de l’URL', () => {
    const fixture = setup(null);
    const component = fixture.componentInstance;

    expect(component.hasToken()).toBe(false);
    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'reset-no-token')).not.toBeNull();
    // Le formulaire n'est pas rendu, mais une soumission directe reste bloquée.
    component.submit();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });
});
