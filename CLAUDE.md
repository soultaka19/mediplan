# MediPlan — contexte du projet

Plateforme web de gestion de rendez-vous médicaux. **Projet intégrateur
académique** (Collège la Cité, printemps 2026) — pas un produit en production.

## Stack

Monorepo **Turborepo + pnpm** (`pnpm@11.7.0`, Node ≥ 22.22.3 — exigence
d'Angular CLI 22, voir `.nvmrc`).

|                 |                                                      |
| --------------- | ---------------------------------------------------- |
| `apps/backend`  | NestJS 11, TypeORM, PostgreSQL, JWT/Passport, bcrypt |
| `apps/frontend` | Angular 22 standalone, Angular Material, Tailwind 4  |
| `docker/`       | Dockerfiles multi-étapes (backend, frontend nginx)   |
| `infra/`        | Bicep — infrastructure Azure                         |
| `scripts/`      | `deploy.sh`, `teardown.sh`                           |

## Commandes

```bash
pnpm install                      # à la racine
pnpm dev                          # backend + frontend
pnpm test                         # tests (backend : 72 Jest · frontend : 133 Vitest)
pnpm build

docker compose up -d --build      # pile complète locale

pnpm --filter backend migration:run   # migrations (local, ts-node)
pnpm --filter backend seed:demo       # jeu de démonstration (local)
```

## Conventions importantes

**Le schéma est piloté uniquement par des migrations versionnées.**
`synchronize: false` et `migrationsRun: false`. Toute nouvelle entité ou
migration doit être **ajoutée explicitement** dans les tableaux de
`apps/backend/src/database/data-source-options.ts` : les classes y sont
référencées une par une, jamais par glob de répertoire — c'est déterministe et
compatible ts-node, `dist` et jest.

**Une seule source pour la connexion à la base.** `buildDataSourceOptions()` est
partagée par le runtime NestJS, la CLI de migration et le seed. Elle accepte
soit `DATABASE_URL` (prioritaire, format des hébergeurs infogérés), soit les
variables `DB_*` séparées.

**Préfixe d'API** : `api/v1`, sauf `/health` qui en est exclu (sonde de
disponibilité).

**Aucun secret dans le dépôt.** `.env` et `.env.azure` sont ignorés par git. En
cloud, les secrets sont des paramètres Bicep `@secure()` puis des secrets natifs
Container Apps.

**Fins de ligne** : `.gitattributes` force LF sur les scripts shell. Le poste de
développement est sous Windows avec `core.autocrlf=true` ; un entrypoint
checkouté en CRLF fait échouer le démarrage du conteneur.

## Déploiement

En ligne sur **Azure Container Apps**, base PostgreSQL infogérée chez **Neon**,
images sur **ghcr.io**. Coût : **~0 $/mois** (contrainte de crédit étudiant
non renouvelable).

- Guide complet : [`docs/deployment/azure.md`](docs/deployment/azure.md)
- Coûts et choix de SKU : [`infra/README.md`](infra/README.md)

Règles de travail sur l'infrastructure :

- **aucune ressource créée à la main** — tout naît d'un template Bicep ;
- `what-if` avant chaque déploiement, appliqué seulement après confirmation ;
- scale-to-zero partout où c'est possible.

Le backend est en **ingress interne** : aucune adresse publique, joignable
uniquement par le frontend. C'est ce qui supprime tout besoin de CORS.

⚠️ Le proxy nginx doit transmettre `Host $proxy_host`, jamais `$host` : Container
Apps route selon cet en-tête, et l'erreur produit un 404 sur tous les appels
`/api/` — invisible en local, où Docker Compose ne route pas par `Host`.

## Qualité

`pnpm lint`, `pnpm test`, `pnpm build` et `pnpm format:check` passent tous les
quatre. La dette de lint et de formatage qui était documentée ici a été résorbée
le 29 août 2026 ; ces commandes peuvent donc redevenir bloquantes en CI.

Trois points de configuration valent d'être connus, car ils expliquent des choix
qui paraissent arbitraires en les lisant :

- **`endOfLine: "auto"`** dans `.prettierrc.json`, et non `"lf"`. `.gitattributes`
  normalise déjà en LF dans l'index, tandis que les postes Windows checkoutent en
  CRLF : avec `"lf"`, `format:check` signalait les **271** fichiers du dépôt sur
  toute machine Windows (contre 37 écarts réels), ce qui le rendait inutilisable.
- **`@typescript-eslint/unbound-method` désactivée dans les `*.spec.ts`** :
  `expect(repo.remove).toHaveBeenCalled()` n'appelle jamais la méthode, il en
  inspecte la doublure. C'est le faux positif documenté par typescript-eslint,
  qui publie `jest/unbound-method` pour ce cas précis. La règle reste active dans
  le code de production.
- **Les voiles d'arrière-plan portent `aria-hidden="true"`** : ce sont des
  raccourcis souris (« cliquer à côté pour fermer ») qui doublent un chemin
  clavier déjà présent (Échap + bouton « Fermer »). Les rendre focalisables
  n'ajouterait qu'un arrêt de tabulation plein écran sans action propre.

Reste ouvert : bundle initial de **819 kB** (budget Angular fixé à 500 kB), dû
pour l'essentiel à la police d'icônes Material et aux familles de polices
chargées. Le build avertit sans échouer.

## Suivi

Jira, projet **MEDIPLAN**. Le dossier de conception est dans `docs/conception/`.

⚠️ Les sprints ont été renumérotés : Sprint 0 = conception, Sprint 1 =
authentification, Sprint 2 = rendez-vous. Certains documents portent encore
l'ancienne numérotation (décalée de +1).
