import { HttpErrorResponse } from '@angular/common/http';

import { authErrorMessage } from './http-error-message';

describe('authErrorMessage', () => {
  it('423 avec message API : renvoie le message de l\'API', () => {
    const error = new HttpErrorResponse({
      status: 423,
      error: {
        message: 'Compte temporairement verrouillé suite à trop de tentatives. Réessayez plus tard.',
      },
    });

    expect(authErrorMessage(error)).toBe(
      'Compte temporairement verrouillé suite à trop de tentatives. Réessayez plus tard.',
    );
  });

  it('423 sans message API : renvoie le repli verrouillage', () => {
    const error = new HttpErrorResponse({ status: 423, statusText: 'Locked' });

    expect(authErrorMessage(error)).toBe(
      'Compte temporairement verrouillé suite à trop de tentatives. Réessayez plus tard.',
    );
  });

  it('401 sans message API : renvoie le message identifiants invalides', () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });

    expect(authErrorMessage(error)).toBe('Adresse e-mail ou mot de passe incorrect.');
  });

  it('400 avec message tableau : joint les messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['Le courriel est requis.', 'Le mot de passe est requis.'] },
    });

    expect(authErrorMessage(error)).toBe('Le courriel est requis. Le mot de passe est requis.');
  });

  it('status 0 : renvoie le message réseau', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

    expect(authErrorMessage(error)).toBe(
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
    );
  });
});
