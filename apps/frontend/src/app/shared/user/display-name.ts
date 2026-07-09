/** Utilisateur minimal pour dériver un nom affichable. */
export interface NameableUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * Nom affichable : « Prénom Nom » si présent, sinon la partie locale de
 * l'e-mail (avant `@`). Ne renvoie jamais un e-mail complet (cf. spec Direction A
 * §3.5 : en-tête au nom, pas à l'e-mail).
 */
export function resolveDisplayName(user: NameableUser | null): string {
  if (!user) {
    return '';
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  const email = user.email?.trim() ?? '';
  return email.split('@')[0]?.trim() ?? '';
}
