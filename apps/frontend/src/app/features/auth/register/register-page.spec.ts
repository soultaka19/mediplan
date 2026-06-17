import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthFacade } from '@core/auth';
import { RegisterPage } from './register-page';

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

describe('RegisterPage', () => {
  let facade: ReturnType<typeof createFakeFacade>;

  function setup() {
    facade = createFakeFacade();
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: facade }],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    return fixture;
  }

  it('rejette un mot de passe faible côté client (pas d’appel register)', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({
      firstName: '',
      lastName: '',
      email: 'patient@example.com',
      password: 'weak', // < 8 et 1 seule classe
    });
    component.submit();

    expect(component.password.errors).toEqual({ weakPassword: true });
    expect(facade.register).not.toHaveBeenCalled();
  });

  it('n’envoie pas les champs optionnels vides', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    facade.register.mockReturnValue(of({ accessToken: 't' }));
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.setValue({
      firstName: '',
      lastName: '',
      email: 'patient@example.com',
      password: 'Str0ng!Pass',
    });
    component.submit();

    expect(facade.register).toHaveBeenCalledWith({
      email: 'patient@example.com',
      password: 'Str0ng!Pass',
    });
  });

  it('transmet prénom/nom quand renseignés', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    facade.register.mockReturnValue(of({ accessToken: 't' }));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.form.setValue({
      firstName: '  Ada ',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Str0ng!Pass',
    });
    component.submit();

    expect(facade.register).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'Str0ng!Pass',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('affiche le message 409 (email déjà utilisé)', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    facade.register.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })),
    );

    component.form.setValue({
      firstName: '',
      lastName: '',
      email: 'patient@example.com',
      password: 'Str0ng!Pass',
    });
    component.submit();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'register-error')).not.toBeNull();
    expect(component.errorMessage()).toBe('Cette adresse e-mail est déjà utilisée.');
  });
});
