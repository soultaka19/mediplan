import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthFacade } from '@core/auth';
import { LoginPage } from './login-page';

/** Fake minimal d'AuthFacade contrôlable par test. */
function createFakeFacade() {
  return {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: () => false,
    currentUser: () => null,
  };
}

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

describe('LoginPage', () => {
  let facade: ReturnType<typeof createFakeFacade>;

  function setup() {
    facade = createFakeFacade();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: facade }],
    });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  it("n'appelle pas login si le formulaire est invalide", () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'login-submit').click();
    fixture.detectChanges();

    expect(facade.login).not.toHaveBeenCalled();
  });

  it('appelle login avec les valeurs et redirige en cas de succès', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    facade.login.mockReturnValue(of({ accessToken: 't' }));

    component.form.setValue({ email: 'patient@example.com', password: 'Str0ng!Pass' });
    component.submit();

    expect(facade.login).toHaveBeenCalledWith({
      email: 'patient@example.com',
      password: 'Str0ng!Pass',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(component.loading()).toBe(false);
  });

  it("affiche un message d'erreur sur 401", () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    facade.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    component.form.setValue({ email: 'patient@example.com', password: 'wrongpass' });
    component.submit();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'login-error')).not.toBeNull();
    expect(component.errorMessage()).toBe('Adresse e-mail ou mot de passe incorrect.');
  });
});
