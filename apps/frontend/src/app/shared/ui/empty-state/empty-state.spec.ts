import { TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  function setup(inputs: {
    title: string;
    icon?: string;
    description?: string;
    actionLabel?: string;
    headingLevel?: 2 | 3;
    dense?: boolean;
  }) {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('title', inputs.title);
    if (inputs.icon !== undefined) {
      fixture.componentRef.setInput('icon', inputs.icon);
    }
    if (inputs.description !== undefined) {
      fixture.componentRef.setInput('description', inputs.description);
    }
    if (inputs.actionLabel !== undefined) {
      fixture.componentRef.setInput('actionLabel', inputs.actionLabel);
    }
    if (inputs.headingLevel !== undefined) {
      fixture.componentRef.setInput('headingLevel', inputs.headingLevel);
    }
    if (inputs.dense !== undefined) {
      fixture.componentRef.setInput('dense', inputs.dense);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('rend le titre en <h2> par défaut', () => {
    const fixture = setup({ title: 'Aucun élément' });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h2.mp-empty__title')?.textContent).toContain('Aucun élément');
    expect(root.querySelector('h3.mp-empty__title')).toBeNull();
  });

  it('rend le titre en <h3> quand headingLevel vaut 3', () => {
    const fixture = setup({ title: 'Aucun rendez-vous à venir', headingLevel: 3 });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h3.mp-empty__title')?.textContent).toContain(
      'Aucun rendez-vous à venir',
    );
    expect(root.querySelector('h2.mp-empty__title')).toBeNull();
  });

  it('applique la variante compacte quand dense est vrai', () => {
    const fixture = setup({ title: 'Vide', dense: true });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.mp-empty')?.classList.contains('mp-empty--dense')).toBe(true);
  });

  it('n’affiche pas de bouton sans actionLabel', () => {
    const fixture = setup({ title: 'Vide' });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('button')).toBeNull();
  });

  it('émet action au clic sur le bouton quand actionLabel est fourni', () => {
    const fixture = setup({ title: 'Vide', actionLabel: 'Réessayer' });
    const emitted = vi.fn();
    fixture.componentInstance.action.subscribe(emitted);

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();

    expect(emitted).toHaveBeenCalled();
  });
});
