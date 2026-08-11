import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthFacade } from '@core/auth';
import { ClinicDirectoryService } from '@features/patient/clinic-directory.service';
import { PublicClinic } from '@features/patient/patient.models';
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

  /**
   * Par défaut, l'annuaire ne renvoie aucune clinique : le champ disparaît et
   * cesse d'être obligatoire. C'est le cas dégradé, et il garde le formulaire
   * soumettable — les tests historiques restent donc valides tels quels.
   */
  function setup(clinics: readonly PublicClinic[] = []) {
    facade = createFakeFacade();
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthFacade, useValue: facade },
        { provide: ClinicDirectoryService, useValue: { listClinics: () => of(clinics) } },
      ],
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
      clinicId: '',
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
      clinicId: '',
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
      clinicId: '',
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
      clinicId: '',
    });
    component.submit();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(byTestId(root, 'register-error')).not.toBeNull();
    expect(component.errorMessage()).toBe('Cette adresse e-mail est déjà utilisée.');
  });

  // MEDIPLAN-21 : sans clinique, le compte créé ne peut réserver aucun créneau.
  describe('choix de la clinique', () => {
    const CLINICS: readonly PublicClinic[] = [
      { id: 'clinic-1', name: 'Clinique MediPlan — Ottawa', address: '123 rue Rideau' },
    ];

    it('rend le champ obligatoire et transmet la clinique choisie', () => {
      const fixture = setup(CLINICS);
      const component = fixture.componentInstance;
      facade.register.mockReturnValue(of({ accessToken: 't' }));
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      expect(byTestId(fixture.nativeElement as HTMLElement, 'register-clinic')).not.toBeNull();

      component.form.setValue({
        firstName: '',
        lastName: '',
        email: 'julie@example.com',
        password: 'Str0ng!Pass',
        clinicId: '',
      });
      component.submit();
      // Clinique manquante : rien n'est envoyé, le formulaire signale l'erreur.
      expect(facade.register).not.toHaveBeenCalled();
      expect(component.clinicId.invalid).toBe(true);

      component.form.controls.clinicId.setValue('clinic-1');
      component.submit();

      expect(facade.register).toHaveBeenCalledWith({
        email: 'julie@example.com',
        password: 'Str0ng!Pass',
        clinicId: 'clinic-1',
      });
    });

    it("annuaire vide : le champ disparaît et cesse de bloquer l'inscription", () => {
      const fixture = setup([]);
      const component = fixture.componentInstance;

      expect(byTestId(fixture.nativeElement as HTMLElement, 'register-clinic')).toBeNull();
      expect(component.clinicId.invalid).toBe(false);
    });
  });
});
