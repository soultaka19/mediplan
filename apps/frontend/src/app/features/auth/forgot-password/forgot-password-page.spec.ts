import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@core/auth';
import { ForgotPasswordPage } from './forgot-password-page';

/** Fake minimal d'AuthService contrôlable par test. */
function createFakeAuth() {
  return {
    forgotPassword: vi.fn(),
  };
}

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

describe('ForgotPasswordPage', () => {
  let auth: ReturnType<typeof createFakeAuth>;

  function setup() {
    auth = createFakeAuth();
    TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
      ],
    });
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    return fixture;
  }

  it("n'appelle pas forgotPassword si le formulaire est invalide", () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'forgot-submit').click();
    fixture.detectChanges();

    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('appelle forgotPassword et affiche le message neutre en cas de succès (202)', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    auth.forgotPassword.mockReturnValue(of(undefined));

    component.form.setValue({ email: 'patient@example.com' });
    component.submit();
    fixture.detectChanges();

    expect(auth.forgotPassword).toHaveBeenCalledWith('patient@example.com');
    expect(component.submitted()).toBe(true);
    expect(component.loading()).toBe(false);

    const root = fixture.nativeElement as HTMLElement;
    const success = byTestId(root, 'forgot-success');
    expect(success).not.toBeNull();
    expect(success.textContent).toContain('Si un compte existe pour cette adresse');
  });

  it("affiche un message d'erreur générique sur erreur réseau", () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    auth.forgotPassword.mockReturnValue(throwError(() => new Error('network')));

    component.form.setValue({ email: 'patient@example.com' });
    component.submit();
    fixture.detectChanges();

    expect(component.submitted()).toBe(false);
    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'forgot-error')).not.toBeNull();
  });
});
