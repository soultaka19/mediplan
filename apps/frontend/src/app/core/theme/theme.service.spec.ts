import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

const STORAGE_KEY = 'mediplan.theme';

/**
 * Fake de stockage cohérent avec l'approche `TokenStorage` (clé dédiée).
 * Remplace `localStorage` globalement (via `vi.stubGlobal`) par une `Storage`
 * en mémoire, pour isoler les tests de l'état réel du navigateur de test.
 */
function installFakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map<string, string>(Object.entries(initial));
  const fake: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  vi.stubGlobal('localStorage', fake);
  return fake;
}

/**
 * Force la réponse de `prefers-color-scheme: dark`. `matchMedia` n'est pas
 * implémenté par jsdom : on le pose globalement via `vi.stubGlobal` (visible
 * depuis `document.defaultView` que lit le service). Restauré en afterEach.
 */
function stubPrefersDark(matches: boolean): void {
  vi.stubGlobal('matchMedia', () => ({ matches }) as MediaQueryList);
}

function createService(): ThemeService {
  return TestBed.runInInjectionContext(() => new ThemeService());
}

describe('ThemeService', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('initialise en clair par défaut (pas de stockage, système clair)', () => {
    installFakeStorage();
    stubPrefersDark(false);

    const service = createService();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('suit la préférence système sombre quand aucun thème n’est stocké', () => {
    installFakeStorage();
    stubPrefersDark(true);

    const service = createService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('restaure le thème persisté en priorité sur la préférence système', () => {
    installFakeStorage({ [STORAGE_KEY]: 'dark' });
    stubPrefersDark(false);

    const service = createService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('bascule clair → sombre → clair, met à jour le DOM et persiste', () => {
    installFakeStorage();
    stubPrefersDark(false);
    const service = createService();

    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('ignore une valeur stockée invalide et retombe sur la préférence système', () => {
    installFakeStorage({ [STORAGE_KEY]: 'bleu' });
    stubPrefersDark(true);

    const service = createService();

    expect(service.theme()).toBe('dark');
  });
});
