# Déploiement de MediPlan — migration d'Azure vers le socle partagé

MediPlan tournait sur **Azure Container Apps** avec une base **Neon**, à ~0 $/mois
grâce au crédit étudiant. Ce crédit n'est pas renouvelable : le projet rejoint le
VPS mutualisé, où il ne coûte plus rien de marginal.

| Élément | Avant (Azure) | Maintenant |
|---|---|---|
| Front Angular | conteneur nginx sur Container Apps | **Vercel**, `mediplan.soultaka.com` |
| API NestJS | Container Apps, ingress **interne** | **VPS**, `mediplan-api.soultaka.com` |
| PostgreSQL | Neon (infogéré) | **socle partagé**, base `mediplan` |
| Proxy `/api` | nginx dans l'image frontend | **réécriture Vercel** |

## Ce que la migration supprime

**Le conteneur nginx du frontend n'a plus lieu d'être.** `docker/frontend/` reste
dans le dépôt pour la pile Docker locale, mais la production ne l'utilise plus :
Vercel sert les fichiers et sa réécriture remplace le proxy.

**Avec lui disparaît le piège documenté du `Host`.** L'ancien proxy nginx devait
transmettre `Host $proxy_host` et jamais `$host`, faute de quoi Container Apps
répondait 404 sur tous les appels `/api/` — invisible en local. Il n'y a plus de
nginx, donc plus de piège.

**L'ingress interne n'existe plus** : l'API est désormais publique, derrière Caddy.
Ce n'est pas une régression de sécurité — l'authentification JWT n'a jamais reposé
sur l'isolement réseau — mais l'API est maintenant exposée à Internet et c'est
`helmet`, la validation des DTO et le verrouillage de compte qui la protègent.

## Pourquoi aucune configuration CORS

`environment.ts` et `environment.prod.ts` portent tous deux `apiUrl: '/api/v1'`,
une URL **relative**. Le front n'émet donc que des requêtes de même origine, que
Vercel réécrit vers le VPS. Ni CORS, ni préflight, ni variable d'environnement à
poser au tableau de bord.

Le préfixe `/api/v1` est **conservé** dans la destination de la réécriture :
`setGlobalPrefix('api/v1')` le fait attendre par NestJS.

## Attention au slash final

Piège payé sur ProfMatch : derrière la réécriture, Vercel répond **308** pour
normaliser un slash final, et si le serveur redirige ensuite vers son propre nom
d'hôte, le changement d'origine fait **perdre l'en-tête `Authorization`** au
navigateur. Express, sous NestJS, traite `/route` et `/route/` comme équivalents
**sans redirection** — MediPlan y échappe donc, mais il faut le vérifier plutôt
que le supposer : chercher un `301`/`307` sur un chemin d'API à slash final.

## Base de données

Base `mediplan` et rôle `mediplan` du socle, déjà créés, avec `CONNECT` révoqué à
`PUBLIC` pour les autres rôles. `DATABASE_URL` a la priorité sur les variables
`DB_*` dans `buildDataSourceOptions()` — c'est elle qui est renseignée.

`RUN_MIGRATIONS_ON_BOOT=true` : l'entrypoint joue les migrations TypeORM au
démarrage. Sûr, chaque migration étant transactionnelle et la table `migrations`
empêchant tout rejeu.

**Le seed de démonstration n'est pas au démarrage** — il purge et réinsère, ce qui
effacerait les rendez-vous créés pendant une démonstration. Il se lance à la
demande :

```bash
docker compose -f docker-compose.socle.yml exec mediplan-api \
  node ./node_modules/typeorm/cli.js ... # ou la commande de seed dédiée
```

## Lancer

```bash
cd /srv/projets/mediplan/deploy
docker compose -f docker-compose.socle.yml up -d --build
```

Puis le bloc Caddy, dans `/srv/socle/caddy/Caddyfile` :

```
mediplan-api.soultaka.com {
	reverse_proxy mediplan-api:3000
}
```

Le port est **3000**, pas 8000 : c'est celui de NestJS.
