import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let snackBar: { open: ReturnType<typeof vi.fn> };

  function setup() {
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [NotificationService, { provide: MatSnackBar, useValue: snackBar }],
    });
    return TestBed.inject(NotificationService);
  }

  it('success() ouvre un snackbar « polite » de 3 s sans action', () => {
    const service = setup();
    service.success('Profil mis à jour');

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    const [message, action, config] = snackBar.open.mock.calls[0];
    expect(message).toBe('Profil mis à jour');
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
});
