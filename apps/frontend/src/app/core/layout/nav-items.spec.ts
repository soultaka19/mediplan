import { NavItem, visibleNavItems } from './nav-items';

const items: readonly NavItem[] = [
  { label: 'Public A', icon: 'a', route: '/a' },
  { label: 'Public B', icon: 'b', route: null },
  { label: 'Admin', icon: 'group', route: null, roles: ['clinic_admin', 'super_admin'] },
  { label: 'Doctor', icon: 'event_note', route: '/doctor', roles: ['doctor'] },
];

describe('visibleNavItems', () => {
  it('garde tous les items publics et masque les items restreints pour un patient', () => {
    const result = visibleNavItems(items, 'patient');
    expect(result.map((i) => i.label)).toEqual(['Public A', 'Public B']);
  });

  it('expose les items restreints pour un rôle autorisé', () => {
    const result = visibleNavItems(items, 'clinic_admin');
    expect(result.map((i) => i.label)).toEqual(['Public A', 'Public B', 'Admin']);
  });

  it('expose les items médecin pour le rôle doctor', () => {
    const result = visibleNavItems(items, 'doctor');
    expect(result.map((i) => i.label)).toEqual(['Public A', 'Public B', 'Doctor']);
  });

  it('ne montre que les items publics quand aucun rôle non authentifié', () => {
    const result = visibleNavItems(items, null);
    expect(result.map((i) => i.label)).toEqual(['Public A', 'Public B']);
  });
});
