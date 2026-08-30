import { resolveDisplayName } from './display-name';

describe('resolveDisplayName', () => {
  it('renvoie « Prénom Nom » si présents', () => {
    expect(resolveDisplayName({ firstName: 'Grace', lastName: 'Hopper', email: 'g@x.io' })).toBe(
      'Grace Hopper',
    );
  });
  it('replie sur la partie locale de l’e-mail, jamais l’e-mail complet', () => {
    expect(
      resolveDisplayName({ firstName: null, lastName: null, email: 'admin.demo@mediplan.test' }),
    ).toBe('admin.demo');
  });
  it('gère un seul nom présent', () => {
    expect(resolveDisplayName({ firstName: 'Ada', lastName: null, email: 'a@x.io' })).toBe('Ada');
  });
  it('renvoie une chaîne vide si utilisateur null', () => {
    expect(resolveDisplayName(null)).toBe('');
  });
});
