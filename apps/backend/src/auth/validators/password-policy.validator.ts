import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Politique de mot de passe (décision sécurité Phase 2) :
 *  - longueur minimale de 8 caractères ;
 *  - au moins 3 des 4 classes de caractères :
 *      minuscule, majuscule, chiffre, caractère spécial.
 *
 * Implémenté comme contrainte class-validator réutilisable (`@IsStrongPassword()`)
 * afin que tout DTO exigeant un mot de passe applique la même règle, et que le
 * rejet soit produit par le ValidationPipe global (HTTP 400).
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_CHAR_CLASSES = 3;

/** Compte le nombre de classes de caractères distinctes présentes dans `value`. */
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
export function isStrongPassword(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length < PASSWORD_MIN_LENGTH) return false;
  return countCharClasses(value) >= PASSWORD_MIN_CHAR_CLASSES;
}

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isStrongPassword(value);
  }

  defaultMessage(): string {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères et au moins ${PASSWORD_MIN_CHAR_CLASSES} des 4 classes : minuscule, majuscule, chiffre, caractère spécial.`;
  }
}

/** Décorateur de validation réutilisable appliquant la politique de mot de passe. */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordConstraint,
    });
  };
}
