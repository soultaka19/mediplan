import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Limitation de débit indexée sur l'adresse du VISITEUR, pas sur celle du
 * dernier relais.
 *
 * Le problème, mesuré le 31 août 2026. La chaîne de production est :
 *
 *   visiteur → edge Vercel → Caddy → ce conteneur
 *
 * Vercel transmet bien l'adresse du visiteur, mais **Caddy la détruit** :
 * n'ayant aucun `trusted_proxies` configuré, il considère son interlocuteur
 * direct comme le client et REMPLACE `X-Forwarded-For` par l'adresse de l'edge
 * Vercel. Le conteneur reçoit donc `X-Forwarded-For: <edge Vercel>` — et cette
 * adresse alterne d'une requête à l'autre (35.182.251.83, 15.156.206.244,
 * 3.96.159.140 observées). Chaque requête tombait ainsi dans un compteur
 * différent : cinq créations de bac à sable d'affilée passaient toutes, alors
 * que la limite est de trois, et vingt-cinq tentatives de connexion passaient
 * alors que `@Throttle` en autorise vingt.
 *
 * `X-Vercel-Forwarded-For` est en revanche transmis tel quel par Caddy, qui ne
 * le connaît pas. C'est donc lui qui porte l'adresse du visiteur.
 *
 * Ordre retenu :
 *   1. `X-Vercel-Forwarded-For` — chemin réel du visiteur, via le front ;
 *   2. premier élément de `X-Forwarded-For` — appel direct sur le domaine de
 *      l'API, où Caddy y met la vraie adresse du client ;
 *   3. `req.ip`, en dernier recours.
 *
 * Limite assumée : sur le domaine de l'API, joignable sans passer par Vercel,
 * un appelant peut forger ces en-têtes et se donner une adresse par requête. Le
 * garde-fou qui tient dans ce cas est le plafond de bacs à sable vivants, qui
 * ne dépend d'aucun en-tête. Fermer complètement la porte demanderait soit de
 * configurer `trusted_proxies` dans Caddy sur les plages de sortie de Vercel
 * (mouvantes), soit de ne plus exposer publiquement le domaine de l'API.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const requete = req as unknown as Request;
    const entetes = requete.headers ?? {};

    return Promise.resolve(
      premiereAdresse(entetes['x-vercel-forwarded-for']) ??
        premiereAdresse(entetes['x-forwarded-for']) ??
        requete.ip ??
        'inconnu',
    );
  }
}

/** Première adresse d'un en-tête `a, b, c`, ou undefined s'il est vide. */
function premiereAdresse(entete: string | string[] | undefined): string | undefined {
  const brut = Array.isArray(entete) ? entete[0] : entete;
  const premier = brut?.split(',')[0]?.trim();
  return premier && premier.length > 0 ? premier : undefined;
}
