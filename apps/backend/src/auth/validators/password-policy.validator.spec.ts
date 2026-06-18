import { countCharClasses, isStrongPassword } from './password-policy.validator';

describe('password policy', () => {
  describe('countCharClasses', () => {
    it('compte les classes présentes', () => {
      expect(countCharClasses('abc')).toBe(1);
      expect(countCharClasses('abcABC')).toBe(2);
      expect(countCharClasses('abcABC1')).toBe(3);
      expect(countCharClasses('abcABC1!')).toBe(4);
    });
  });

  describe('isStrongPassword', () => {
    it('accepte >= 8 caractères et >= 3 classes', () => {
      expect(isStrongPassword('Str0ngPwd')).toBe(true); // min+maj+chiffre
      expect(isStrongPassword('abcd1234!')).toBe(true); // min+chiffre+spécial
    });

    it('rejette si trop court', () => {
      expect(isStrongPassword('Ab1!')).toBe(false);
    });

    it('rejette si moins de 3 classes', () => {
      expect(isStrongPassword('alllowercase')).toBe(false); // 1 classe
      expect(isStrongPassword('lowerUPPER')).toBe(false); // 2 classes
    });

    it('rejette les valeurs non-string', () => {
      expect(isStrongPassword(12345678)).toBe(false);
      expect(isStrongPassword(undefined)).toBe(false);
      expect(isStrongPassword(null)).toBe(false);
    });
  });
});
