import { TestBed } from '@angular/core/testing';

import { StatCard } from './stat-card';

describe('StatCard', () => {
  function setup(inputs: { label: string; value?: string; hint?: string; icon?: string }) {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', inputs.label);
    if (inputs.value !== undefined) {
      fixture.componentRef.setInput('value', inputs.value);
    }
    if (inputs.hint !== undefined) {
      fixture.componentRef.setInput('hint', inputs.hint);
    }
    if (inputs.icon !== undefined) {
      fixture.componentRef.setInput('icon', inputs.icon);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('affiche le placeholder « — » quand aucune valeur n’est fournie', () => {
    const fixture = setup({ label: 'Rendez-vous à venir' });
    const number = (fixture.nativeElement as HTMLElement).querySelector('.mp-stat__number');
    expect(number?.textContent?.trim()).toBe('—');
  });

  it('affiche la valeur fournie', () => {
    const fixture = setup({ label: 'RDV du jour', value: '24' });
    const number = (fixture.nativeElement as HTMLElement).querySelector('.mp-stat__number');
    expect(number?.textContent?.trim()).toBe('24');
  });

  it('lie la valeur et le label dans un libellé accessible (pas seulement la couleur)', () => {
    const fixture = setup({ label: 'Rendez-vous à venir', value: '—' });
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('— Rendez-vous à venir');
  });

  it('affiche l’aide optionnelle uniquement si fournie', () => {
    const without = setup({ label: 'Médecins actifs' });
    expect((without.nativeElement as HTMLElement).querySelector('.mp-stat__hint')).toBeNull();

    const withHint = setup({ label: 'Médecins actifs', hint: 'bientôt' });
    expect(
      (withHint.nativeElement as HTMLElement).querySelector('.mp-stat__hint')?.textContent?.trim(),
    ).toBe('bientôt');
  });
});
