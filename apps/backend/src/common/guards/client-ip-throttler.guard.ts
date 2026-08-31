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
 * Vercel transmet correctement l'adresse du visiteur dans `X-Forwarded-For`,
 * puis Caddy y ajoute celle de l'edge Vercel qu'il a vu. Le conteneur reçoit
 * donc `X-Forwarded-For: <visiteur>, <edge Vercel>` — et l'adresse de l'edge
 * ALTERNE d'une requête à l'autre (35.182.251.83 / 15.156.206.244 observées).
 * Toute résolution qui retient l'élément de droite change donc de valeur à
 * chaque requête, et la limite ne compte plus rien : 5 créations de bac à
 * sable d'affilée passaient toutes, alors qu'elle est fixée à 3.
 *
 * On prend donc explicitement le PREMIER élément, seul à désigner le visiteur.
 *
 * Limite assumée : sur le domaine de l'API, joignable sans passer par Vercel,
 * un appelant peut forger cet en-tête et se donner une adresse par requête. Le
 * garde-fou qui tient dans ce cas est le plafond de bacs à sable vivants, qui
 * ne dépend d'aucun en-tête. Fermer complètement la porte demanderait de ne
 * plus exposer publiquement le domaine de l'API — un autre chantier.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const requete = req as unknown as Request;
    const entete = requete.headers?.['x-forwarded-for'];

    const brut = Array.isArray(entete) ? entete[0] : entete;
    const premier = brut?.split(',')[0]?.trim();

    return Promise.resolve(premier || requete.ip || 'inconnu');
  }
}
