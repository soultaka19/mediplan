import { TestBed } from '@angular/core/testing';

import { UserRole } from '@core/auth';
import { RoleBadge } from './role-badge';

describe('RoleBadge', () => {
  function setup(role: UserRole) {
    const fixture = TestBed.createComponent(RoleBadge);
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges();
    return fixture;
  }

  it.each<[UserRole, string]>([
    ['patient', 'Patient'],
    ['doctor', 'Médecin'],
    ['clinic_admin', 'Administrateur de clinique'],
    ['super_admin', 'Super administrateur'],
  ])('affiche le libellé français pour %s', (role, expected) => {
    const fixture = setup(role);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain(expected);
  });

  it('expose le rôle en toutes lettres (information non portée par la seule couleur)', () => {
    const fixture = setup('clinic_admin');
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.mp-role-badge');
    expect(badge?.textContent?.trim()).toBe('Administrateur de clinique');
  });
});
