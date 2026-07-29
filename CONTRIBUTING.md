# Guide du collaborateur — MediPlan

Ce document explique **comment cloner le projet et configurer proprement son environnement de développement**. Pour la présentation du produit et la stack, voir le [README](README.md).

---

## 1. Prérequis (outils à installer)

| Outil | Version | Pourquoi / comment |
| ----- | ------- | ------------------ |
| **Git** | récent | Cloner et versionner. |
| **Node.js** | **22.22+** (LTS) ou **24.15+** | Requis par Angular 22. Conseillé via [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) ou [nvm-windows](https://github.com/coreybutler/nvm-windows). |
| **pnpm** | **11.7.0** | Gestionnaire de paquets du monorepo. **Active-le via Corepack** (fourni avec Node) plutôt que `npm i -g` : voir §2. |
| **Docker Desktop** | récent (Compose v2) | Lancer PostgreSQL (et, en option, toute la stack). |

> ⚠️ Le champ `engines` indique Node ≥ 20, mais **Angular 22 exige Node ≥ 22.22 / ≥ 24.15** : utilise bien une de ces versions, sinon `ng` échouera.

### Outils recommandés (facultatif mais conseillé)
- **VS Code** avec les extensions : **Angular Language Service**, **ESLint**, **Prettier**, **EditorConfig**. Un dossier `apps/frontend/.vscode/` fournit déjà des réglages.
- Un client PostgreSQL (DBeaver, TablePlus, ou `psql`) pour inspecter la base.

---

## 2. Installation pas à pas

```bash
# 1. Cloner le dépôt
git clone https://github.com/soultaka19/mediplan.git
cd mediplan

# 2. Activer pnpm via Corepack (recommandé — fixe la bonne version)
corepack enable
corepack prepare pnpm@11.7.0 --activate

# 3. Installer toutes les dépendances du monorepo (backend + frontend)
pnpm install

# 4. Créer le fichier de configuration local
cp .env.example .env        # Windows PowerShell : Copy-Item .env.example .env
```

> `.env` est **gitignoré** : il ne doit jamais être commité. Voir §3 pour les variables.

---

## 3. Configuration de l'environnement (`.env`)

Le fichier `.env` (copié depuis `.env.example`) alimente le backend **et** Docker Compose. Des valeurs de dev par défaut existent, **mais le `JWT_SECRET` doit être renseigné avec un vrai secret**.

| Variable | Rôle | Note |
| -------- | ---- | ---- |
| `DB_HOST` | Hôte PostgreSQL | `127.0.0.1` hors Docker ; `postgres` dans Compose (géré automatiquement). Sous Windows, préférer `127.0.0.1` à `localhost` (cf. §9). |
| `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Connexion BD | Cohérents avec le service `postgres`. |
| `JWT_SECRET` | Clé de signature des JWT | **≥ 32 caractères**, aléatoire, différent par environnement. Le backend refuse de démarrer sinon. |
| `JWT_EXPIRES_IN` | Durée de validité du jeton | ex. `60m`. |
| `BCRYPT_ROUNDS` | Coût du hachage des mots de passe | `12` (décision sécurité). |
| `BACKEND_PORT` / `FRONTEND_PORT` | Ports applicatifs | `3000` / `4200`. |

Générer un `JWT_SECRET` solide :
```bash
# macOS / Linux / Git Bash
openssl rand -base64 48
# ou, multiplateforme (Node) :
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 4. Lancer le projet en développement

### Option A — recommandée pour développer (rechargement à chaud)

Trois processus : PostgreSQL en conteneur, backend NestJS, frontend Angular.

```bash
# 1) Base de données (conteneur Postgres)
docker compose up -d postgres

# 2) Appliquer les migrations (crée le schéma) — à refaire quand de nouvelles migrations arrivent
pnpm --filter backend migration:run

# 3) Backend NestJS (port 3000, watch)  — dans un terminal
pnpm --filter backend dev

# 4) Frontend Angular (port 4200, proxy /api -> :3000) — dans un autre terminal
pnpm --filter frontend dev
```

Ouvre **http://localhost:4200**. Le frontend appelle des URLs **relatives** `/api/v1/...` ; en dev, le proxy `ng serve` (`apps/frontend/proxy.conf.json`) les redirige vers le backend — pas de souci CORS.

> Astuce : `pnpm dev` à la racine (Turbo) lance backend + frontend ensemble, **mais ne démarre ni Postgres ni les migrations**. Pour un premier lancement, préfère les étapes ci-dessus.

### Option B — tout en conteneurs (proche de la prod)

```bash
docker compose up -d --build
```

| Service | URL |
| ------- | --- |
| Frontend (nginx) | http://localhost:4200 |
| API backend | http://localhost:4200/api/v1 (proxy nginx) ou http://localhost:3000/api/v1 |
| Santé backend | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

```bash
docker compose ps          # état
docker compose logs -f     # journaux
docker compose down        # arrêter (le volume de données est conservé)
```

---

## 5. Vérifier son environnement (smoke test)

Une fois le backend lancé, tester l'inscription d'un patient :
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"patient.test@mediplan.com","password":"Mediplan2026!","firstName":"Awa","lastName":"Traore"}'
```
Une réponse `201` avec `accessToken` confirme que backend + BD + migrations fonctionnent.

> Politique mot de passe : **≥ 8 caractères** et **≥ 3 des 4 classes** (minuscule, majuscule, chiffre, spécial).

---

## 6. Qualité du code (à lancer avant de pousser)

```bash
pnpm lint                                  # ESLint sur tout le monorepo
pnpm format                                # Formatage Prettier (écriture)
pnpm --filter backend test                 # Tests backend (Jest)
pnpm --filter frontend exec ng test --watch=false   # Tests frontend (Vitest, en une passe)
pnpm build                                 # Build de production (backend + frontend)
```

> Le runner frontend est **Vitest** via le builder Angular : utiliser `--watch=false` (et **non** `--run`, non reconnu) pour une exécution unique en CI/local.

---

## 7. Workflow Git

- Branche d'intégration : **`dev`** ; branche stable : **`main`**. On ne pousse jamais directement sur `dev`/`main`.
- Créer une branche par tâche **depuis `dev` à jour** :
  ```bash
  git checkout dev && git pull --ff-only
  git checkout -b feat/MEDIPLAN-XX-courte-description
  ```
- **Commits conventionnels** : `feat(scope): …`, `fix(scope): …`, `docs: …`, `refactor(scope): …`, `test(scope): …`. Référencer le ticket Jira (ex. `(MEDIPLAN-15)`).
- Ouvrir une **Pull Request vers `dev`**, faire relire, puis merger. Garder Jira (`MEDIPLAN`) à jour (statut + lien PR).
- Avant de pousser : lint + tests + build verts (cf. §6).

---

## 8. Organisation du code (où mettre quoi)

- `apps/backend/` — API NestJS (modules, TypeORM, migrations dans `src/database`).
- `apps/frontend/` — Angular standalone. Architecture `core/ shared/ features/` (voir le guide de design : [`docs/frontend/design-system.md`](docs/frontend/design-system.md)).
- `docs/conception/` — dossier de conception (UML, ERD).
- `docker/` — Dockerfiles + config nginx ; `docker-compose.yml` à la racine.

---

## 9. Dépannage courant

| Symptôme | Cause probable / solution |
| -------- | ------------------------- |
| Le backend ne démarre pas, erreur sur le secret | `JWT_SECRET` absent ou < 32 caractères dans `.env`. |
| `ECONNREFUSED` / erreurs BD au démarrage backend | Postgres pas lancé (`docker compose up -d postgres`) ou migrations non appliquées (`pnpm --filter backend migration:run`). |
| `ECONNRESET` sur la BD **sous Windows**, alors que le conteneur est `healthy` | `localhost` résout d'abord en IPv6 (`::1`), où `wslrelay.exe` intercepte le port publié par Docker. Mettre `DB_HOST=127.0.0.1` dans `.env`. Diagnostic : `Get-NetTCPConnection -LocalPort <port> -State Listen` révèle deux processus à l'écoute. |
| Erreurs de tables manquantes | Migrations non exécutées — relancer `migration:run`. |
| `ng` / build échoue avec une erreur de version Node | Node trop ancien — passer à 22.22+ ou 24.15+ (cf. §1). |
| `pnpm` introuvable ou mauvaise version | `corepack enable && corepack prepare pnpm@11.7.0 --activate`. |
| Port 3000/4200/5432 déjà utilisé | Arrêter le service qui l'occupe, ou changer le port dans `.env`. |
| 401 inattendu côté frontend | Jeton expiré/invalide — l'app purge et redirige vers `/login` ; se reconnecter. |

---

## 10. Suivi de projet

Planification (Epics, User Stories, statuts) dans **Jira — projet MediPlan (`MEDIPLAN`)**. Toute tâche en cours doit avoir un ticket associé et un statut à jour.
