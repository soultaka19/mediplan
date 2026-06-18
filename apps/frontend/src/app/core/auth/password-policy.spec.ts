import { FormControl } from '@angular/forms';

import { countCharClasses, isStrongPassword, strongPasswordValidator } from './password-policy';

describe('password-policy', () => {
  it('compte les classes de caractères', () => {
    expect(countCharClasses('abc')).toBe(1);
    expect(countCharClasses('abcABC')).toBe(2);
    expect(countCharClasses('abcABC1')).toBe(3);
    expect(countCharClasses('abcABC1!')).toBe(4);
  });

  it('rejette les mots de passe trop courts ou trop simples', () => {
    expect(isStrongPassword('Ab1!')).toBe(false); // trop court
    expect(isStrongPassword('alllowercase')).toBe(false); // 1 seule classe
    expect(isStrongPassword('abcdefgh1')).toBe(false); // 2 classes seulement
  });

  it('accepte un mot de passe conforme (>=8, >=3 classes)', () => {
    expect(isStrongPassword('Str0ngPass')).toBe(true);
    expect(isStrongPassword('weak-but-Long1')).toBe(true);
  });

  it('le validateur retourne weakPassword pour un mot de passe faible', () => {
    const validator = strongPasswordValidator();
    expect(validator(new FormControl('abc'))).toEqual({ weakPassword: true });
    expect(validator(new FormControl('Str0ngPass'))).toBeNull();
    // Champ vide : laissé au validateur required.
    expect(validator(new FormControl(''))).toBeNull();
  });
});
