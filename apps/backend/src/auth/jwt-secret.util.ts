import { ConfigService } from '@nestjs/config';

/**
 * Longueur minimale du secret JWT. HS256 tire sa sécurité de l'entropie du
 * secret : un secret court produit des tokens forgeables. Décision Phase 2 :
 * secret >= 32 octets.
 */
export const JWT_SECRET_MIN_LENGTH = 32;

/**
 * Lit et valide `JWT_SECRET` depuis la configuration. Échoue explicitement au
 * démarrage si le secret est absent OU trop court — plutôt que de signer/vérifier
 * avec un secret faible. Source unique partagée par `JwtModule` (signature) et
 * `JwtStrategy` (vérification) pour éviter toute divergence de règle.
 */
export function requireJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret || secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET manquant ou trop court (>= ${JWT_SECRET_MIN_LENGTH} caractères requis) : configuration JWT invalide.`,
    );
  }
  return secret;
}
