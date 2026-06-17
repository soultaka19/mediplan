import { TestBed } from '@angular/core/testing';

import { Avatar } from './avatar';

describe('Avatar', () => {
  function setup(inputs: { name?: string; email?: string }) {
    const fixture = TestBed.createComponent(Avatar);
    if (inputs.name !== undefined) {
      fixture.componentRef.setInput('name', inputs.name);
    }
    if (inputs.email !== undefined) {
      fixture.componentRef.setInput('email', inputs.email);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('calcule des initiales à partir du prénom et du nom', () => {
    const fixture = setup({ name: 'Ada Lovelace' });
    expect(fixture.componentInstance.initials()).toBe('AL');
  });

  it('prend les deux premières lettres pour un nom unique', () => {
    const fixture = setup({ name: 'Cher' });
    expect(fixture.componentInstance.initials()).toBe('CH');
  });

  it('utilise le prénom et le dernier mot pour un nom composé', () => {
    const fixture = setup({ name: 'Marie Anne Dupont' });
    expect(fixture.componentInstance.initials()).toBe('MD');
  });

  it('retombe sur la première lettre de l’e-mail sans nom', () => {
    const fixture = setup({ name: '', email: 'patient@example.com' });
    expect(fixture.componentInstance.initials()).toBe('P');
  });

  it('expose le nom complet comme libellé accessible', () => {
    const fixture = setup({ name: 'Ada Lovelace', email: 'ada@example.com' });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(host.getAttribute('role')).toBe('img');
  });

  it('affiche les initiales dans le gabarit', () => {
    const fixture = setup({ name: 'Ada Lovelace' });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('AL');
  });
});
