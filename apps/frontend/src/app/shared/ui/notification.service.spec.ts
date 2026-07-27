import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  function setup() {
    snackBar = { open: vi.fn() };
    dialog = { open: vi.fn(() => ({ afterClosed: vi.fn() })) };
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    return TestBed.inject(NotificationService);
  }

  it('success() ouvre un snackbar « polite » de 3 s sans action', () => {
    const service = setup();
    service.success('Profil mis à jour');

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    const [message, action, config] = snackBar.open.mock.calls[0];
    // Le message est préfixé d'un « ✓ » de succès (indicateur d'état).
    expect(message).toContain('Profil mis à jour');
    expect(message).toContain('✓');
    expect(action).toBeUndefined();
    expect(config).toMatchObject({ duration: 3000, politeness: 'polite' });
  });

  it('error() ouvre un snackbar « assertive » de 5 s avec action « Fermer »', () => {
    const service = setup();
    service.error('Échec de la requête');

    const [message, action, config] = snackBar.open.mock.calls[0];
    expect(message).toBe('Échec de la requête');
    expect(action).toBe('Fermer');
    expect(config).toMatchObject({ duration: 5000, politeness: 'assertive' });
  });

  it('successDialog() ouvre un popup de succès avec titre et message', () => {
    const service = setup();
    service.successDialog('Disponibilité ajoutée', 'Détails de la plage.');

    expect(dialog.open).toHaveBeenCalledTimes(1);
    const config = dialog.open.mock.calls[0][1];
    expect(config.data).toMatchObject({
      title: 'Disponibilité ajoutée',
      message: 'Détails de la plage.',
      variant: 'success',
    });
  });
});
