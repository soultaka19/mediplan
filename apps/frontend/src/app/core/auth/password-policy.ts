import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Politique de mot de passe — miroir exact du backend
 * (`apps/backend/src/auth/validators/password-policy.validator.ts`) :
 *  - longueur minimale de 8 caractères ;
 *  - au moins 3 des 4 classes : minuscule, majuscule, chiffre, spécial.
 *
 * Validation purement côté client pour un retour immédiat ; le backend reste
 * l'autorité finale (400 si non conforme).
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_CHAR_CLASSES = 3;

/** Compte le nombre de classes de caractères distinctes présentes. */
export function countCharClasses(value: string): number {
  let classes = 0;
  if (/[a-z]/.test(value)) classes += 1;
  if (/[A-Z]/.test(value)) classes += 1;
  if (/[0-9]/.test(value)) classes += 1;
  // Tout ce qui n'est ni lettre ASCII ni chiffre est considéré « spécial ».
  if (/[^a-zA-Z0-9]/.test(value)) classes += 1;
  return classes;
}

/** Vrai si `value` respecte la politique de mot de passe MediPlan. */
export function isStrongPassword(value: string): boolean {
  if (value.length < PASSWORD_MIN_LENGTH) return false;
  return countCharClasses(value) >= PASSWORD_MIN_CHAR_CLASSES;
}

/** Validateur Reactive Forms appliquant la politique de mot de passe. */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    // Laisse le validateur `required` gérer le cas vide.
    if (!value) {
      return null;
    }
    return isStrongPassword(value) ? null : { weakPassword: true };
  };
}
