import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  // Le thème doit s'appliquer dès la racine, pas seulement dans le shell : sinon
  // les écrans hors shell (connexion, inscription, réinitialisation) restent en
  // clair et l'utilisateur en sombre subit un flash blanc à la déconnexion.
  it('applique le thème persisté dès la racine, hors du shell', () => {
    localStorage.setItem('mediplan.theme', 'dark');

    TestBed.createComponent(App);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  afterEach(() => {
    localStorage.removeItem('mediplan.theme');
    document.documentElement.removeAttribute('data-theme');
  });
});
