import { TestBed } from '@angular/core/testing';

import { StatCard } from './stat-card';

describe('StatCard', () => {
  function setup(inputs: {
    label: string;
    value?: string;
    hint?: string;
    icon?: string;
    trend?: string;
    trendUp?: boolean;
  }) {
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
    if (inputs.trend !== undefined) {
      fixture.componentRef.setInput('trend', inputs.trend);
    }
    if (inputs.trendUp !== undefined) {
      fixture.componentRef.setInput('trendUp', inputs.trendUp);
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

  it('marque le placeholder « — » comme discret (classe --placeholder)', () => {
    const fixture = setup({ label: 'Rendez-vous à venir' });
    const number = (fixture.nativeElement as HTMLElement).querySelector('.mp-stat__number');
    expect(number?.classList.contains('mp-stat__number--placeholder')).toBe(true);
  });

  it('n’applique pas le style placeholder à une vraie valeur', () => {
    const fixture = setup({ label: 'RDV du jour', value: '24' });
    const number = (fixture.nativeElement as HTMLElement).querySelector('.mp-stat__number');
    expect(number?.classList.contains('mp-stat__number--placeholder')).toBe(false);
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

  it('affiche la tendance en texte + icône quand fournie', () => {
    const fixture = setup({ label: 'RDV du jour', value: '8', trend: '+2', trendUp: true });
    const trend = (fixture.nativeElement as HTMLElement).querySelector('.mp-stat__trend');
    expect(trend).toBeTruthy();
    expect(trend?.textContent).toContain('+2');
    // Information non portée par la seule couleur : une icône accompagne le texte.
    expect(trend?.querySelector('mat-icon')).toBeTruthy();
  });

  it('ne rend aucune tendance par défaut', () => {
    const fixture = setup({ label: 'RDV du jour' });
    expect((fixture.nativeElement as HTMLElement).querySelector('.mp-stat__trend')).toBeNull();
  });
});
