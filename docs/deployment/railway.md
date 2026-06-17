# Déploiement sur Railway

> **Statut : préparé, non déployé.** Les adaptations cloud sont en place dans le repo, mais le
> déploiement réel est volontairement reporté **après l'authentification (MEDIPLAN-15)** :
> tant que TypeORM n'est pas branché, la base PostgreSQL serait inactive et la démo live se
> limiterait au squelette (`/health` + coquille Angular).
>
> ⚠️ **Hors périmètre du cahier des charges** (qui fixe « Docker Compose local »). Railway est un
> **bonus** pour disposer d'une démo en ligne. Suivi : voir la story Jira correspondante (Epic E7).

## Coût (à connaître)

Pas d'offre gratuite durable : crédit d'essai unique **5 $ / 30 jours** (sans carte), puis plan
**Hobby ~5 $/mois** (5 $ d'usage inclus), facturation à l'usage au‑delà (CPU/RAM/egress/volume).
Le crédit d'essai suffit pour une démo ponctuelle.

## Architecture cible (1 projet, 3 services)

| Service     | Source                              | Réglages clés |
| ----------- | ----------------------------------- | ------------- |
| **Postgres**| Plugin managé Railway (`railway add`) | Fournit `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` + `DATABASE_URL` |
| **backend** | Repo, `docker/backend/Dockerfile`   | Var. service `RAILWAY_DOCKERFILE_PATH=docker/backend/Dockerfile`, **Root Directory = `/`** (le build pnpm a besoin de tout le monorepo). Écoute déjà `process.env.PORT` ✅ |
| **frontend**| Repo, `docker/frontend/Dockerfile`  | `RAILWAY_DOCKERFILE_PATH=docker/frontend/Dockerfile`, Root `/`. nginx écoute `$PORT` et proxy via `BACKEND_ORIGIN` (déjà paramétrables) |

## Variables d'environnement

**backend** (références aux variables du service Postgres) :

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<secret >= 32 octets aléatoires>
JWT_EXPIRES_IN=60m
BCRYPT_ROUNDS=12
```
(`PORT` est injecté automatiquement par Railway ; le backend l'utilise déjà.)

**frontend** :

```
# Domaine privé Railway du backend (réseau interne) + son port
BACKEND_ORIGIN=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3000
```
(`PORT` est injecté par Railway et utilisé par nginx via le template envsubst.)

## Adaptations cloud déjà en place

- **nginx** : `docker/frontend/default.conf.template` écoute `${PORT}` et proxy vers
  `${BACKEND_ORIGIN}`. Défauts (`PORT=80`, `BACKEND_ORIGIN=http://backend:3000`) = Docker Compose
  local **inchangé** ; Railway surcharge ces variables. Rendu par `envsubst` au démarrage (natif image nginx).
- **backend** : écoute `process.env.BACKEND_PORT ?? process.env.PORT ?? 3000` → compatible Railway.

## Étapes de déploiement (le moment venu)

```bash
# 1. CLI
npm i -g @railway/cli
railway login                # interactif (navigateur) ; sinon: railway login --browserless

# 2. Projet + base
railway init                 # créer le projet (à la racine du repo)
railway add                  # ajouter PostgreSQL

# 3. Créer les services backend/frontend (recommandé : depuis GitHub pour l'auto-deploy),
#    puis pour chacun définir RAILWAY_DOCKERFILE_PATH et Root Directory = /.
railway variables --set "RAILWAY_DOCKERFILE_PATH=docker/backend/Dockerfile"   # service backend
railway variables --set "RAILWAY_DOCKERFILE_PATH=docker/frontend/Dockerfile"  # service frontend
#    + les variables d'environnement ci-dessus.

# 4. Déployer + exposer
railway up                   # ou push GitHub si service lié au repo
railway domain               # générer un domaine public (frontend)
railway logs                 # journaux
```

## À finaliser au moment du déploiement réel

- **Brancher TypeORM** sur les variables `DB_*` (fait avec MEDIPLAN-15 / couche données) + migrations.
- **CORS** côté backend si le frontend appelle l'API via une URL publique distincte.
- Vérifier les **healthchecks** et le démarrage (le backend doit être *healthy* avant le frontend).

## Références

- Pricing : <https://docs.railway.com/reference/pricing/plans>
- Monorepo : <https://docs.railway.com/guides/monorepo>
- CLI : <https://docs.railway.com/cli/deploying>
