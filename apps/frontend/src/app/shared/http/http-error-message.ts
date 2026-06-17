import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduit une erreur HTTP d'authentification en message utilisateur clair (FR).
 *
 * Si l'API fournit un message (ex. compte verrouillé 423, trop de tentatives
 * 429), on le privilégie. Factorisé ici car réutilisé par LoginPage et
 * RegisterPage (usage `shared/` réellement justifié).
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiMessage = extractApiMessage(error);

    switch (error.status) {
      case 0:
        return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
      case 400:
        return apiMessage ?? 'Données invalides. Vérifiez les champs saisis.';
      case 401:
        return apiMessage ?? 'Adresse e-mail ou mot de passe incorrect.';
      case 409:
        return apiMessage ?? 'Cette adresse e-mail est déjà utilisée.';
      case 423:
      case 429:
        // Messages contextuels (verrouillage / limitation) renvoyés par l'API.
        return apiMessage ?? 'Compte temporairement indisponible. Réessayez plus tard.';
      default:
        return apiMessage ?? 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

/**
 * Extrait un message lisible du corps d'erreur de l'API.
 *
 * NestJS renvoie soit `message: string`, soit `message: string[]` (validation).
 */
function extractApiMessage(error: HttpErrorResponse): string | null {
  const body = error.error as { message?: string | string[] } | null;
  if (!body || body.message === undefined) {
    return null;
  }
  if (Array.isArray(body.message)) {
    return body.message.length > 0 ? body.message.join(' ') : null;
  }
  return typeof body.message === 'string' ? body.message : null;
}
