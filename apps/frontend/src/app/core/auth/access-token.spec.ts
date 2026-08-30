import { userFromAccessToken } from './access-token';

/** Encode un objet en segment base64url (sans padding), comme un JWT. */
function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Construit un JWT non signé (signature factice) à partir d'un payload. */
function makeToken(payload: Record<string, unknown>): string {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  return `${header}.${base64Url(payload)}.signature`;
}

describe('userFromAccessToken', () => {
  const future = Math.floor(Date.now() / 1000) + 3600;

  it('reconstruit l’utilisateur depuis un jeton valide', () => {
    const token = makeToken({
      sub: 'u1',
      role: 'patient',
      clinic_id: null,
      email: 'patient@example.com',
      exp: future,
    });

    const user = userFromAccessToken(token);

    expect(user).not.toBeNull();
    expect(user?.id).toBe('u1');
    expect(user?.role).toBe('patient');
    expect(user?.email).toBe('patient@example.com');
    expect(user?.clinicId).toBeNull();
  });

  it('rejette un jeton expiré', () => {
    const token = makeToken({
      sub: 'u1',
      role: 'patient',
      clinic_id: null,
      email: null,
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    expect(userFromAccessToken(token)).toBeNull();
  });

  it('rejette un jeton mal formé', () => {
    expect(userFromAccessToken('pas-un-jwt')).toBeNull();
  });

  it('rejette un jeton sans claims requis', () => {
    expect(userFromAccessToken(makeToken({ email: 'x@example.com' }))).toBeNull();
  });
});
