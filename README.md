# MediPlan

**Plateforme web de gestion des rendez-vous médicaux**
Projet intégrateur — Programmation informatique — Collège La Cité — Session Printemps 2026

---

## Présentation

MediPlan est une plateforme web qui centralise la prise, la modification et l'annulation
de rendez-vous médicaux pour des cliniques de petite et moyenne taille. Elle remplace les
outils hétérogènes actuels (appels téléphoniques, agendas papier, fichiers Excel) par une
solution unique, sécurisée et accessible 24 h/24.

Quatre rôles interagissent avec la plateforme :

| Rôle                           | Besoins principaux                                                      |
| ------------------------------ | ----------------------------------------------------------------------- |
| **Patient**                    | Réserver, modifier ou annuler un rendez-vous sans téléphoner            |
| **Médecin**                    | Consulter son horaire, gérer ses disponibilités, suivre le flux du jour |
| **Administrateur de clinique** | Gérer utilisateurs, médecins, disponibilités, statistiques              |
| **Super administrateur**       | Configurer les cliniques et la plateforme                               |

## Stack technique

| Couche          | Technologie                                                |
| --------------- | ---------------------------------------------------------- |
| Frontend        | Angular + Angular Material + TypeScript                    |
| Backend         | NestJS (API REST) + TypeScript                             |
| Base de données | PostgreSQL                                                 |
| Déploiement     | Docker + Docker Compose (local)                            |
| Qualité         | Jest, Cypress/Playwright, ESLint, Prettier, GitHub Actions |

## Structure du dépôt

Monorepo géré avec **Turborepo + pnpm workspaces** :

```
.
├── apps/
│   ├── backend/    ← API NestJS (TypeScript, TypeORM, PostgreSQL)
│   └── frontend/   ← Application Angular (Angular Material, standalone components)
├── packages/       ← Paquets partagés (vide pour l'instant)
├── docs/
│   └── conception/ ← Dossier de conception (diagrammes UML, ERD, explications)
├── package.json    ← Scripts racine (délégués à Turbo)
├── pnpm-workspace.yaml
├── turbo.json      ← Pipelines de tâches (build/lint/test/dev)
├── docker-compose.yml ← Orchestration locale (postgres + backend + frontend)
├── docker/         ← Dockerfiles (backend, frontend) + config nginx
├── .env.example    ← Modèle de configuration (copier en .env)
└── README.md
```

## Démarrage (développement local)

> 📖 **Nouveau sur le projet ?** Suivez le [**Guide du collaborateur** (`CONTRIBUTING.md`)](CONTRIBUTING.md) : prérequis détaillés, outils, configuration de l'environnement, migrations, workflow Git et dépannage.

> Prérequis : **Node.js ≥ 22.22 (ou ≥ 24.15)** — requis par Angular 22 — et **pnpm** (via Corepack : `corepack enable`, sinon `npm i -g pnpm`).

```bash
# 1. Installer les dépendances de tout le monorepo
pnpm install

# 2. Copier la configuration et renseigner les valeurs
cp .env.example .env

# 3. Lancer les apps en développement (toutes via Turbo)
pnpm dev

# Autres commandes utiles
pnpm build         # build de toutes les apps
pnpm lint          # lint de tout le monorepo
pnpm test          # tests
pnpm format        # formatage Prettier
```

## Démarrage avec Docker (« une commande »)

> Prérequis : **Docker Desktop** (ou Docker Engine + Compose v2).

```bash
# Copier la configuration (des valeurs de dev par défaut existent sinon)
cp .env.example .env

# Construire et lancer postgres + backend + frontend
docker compose up -d --build
```

| Service          | URL                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| Frontend (nginx) | http://localhost:4200                                                  |
| API backend      | http://localhost:4200/api/v1 (proxy) — ou http://localhost:3000/api/v1 |
| Santé backend    | http://localhost:3000/health                                           |
| PostgreSQL       | localhost:5432                                                         |

```bash
docker compose ps        # état des conteneurs
docker compose logs -f   # journaux
docker compose down      # arrêter (le volume de données est conservé)
```

## Déploiement (Azure)

L'application est déployée sur **Azure Container Apps**, avec une base PostgreSQL
infogérée hébergée chez Neon.

> **Coût : ~0 $/mois.** Le projet tourne sur un crédit étudiant de 100 $ non
> renouvelable : les deux conteneurs sont en *scale-to-zero* (rien ne tourne, donc
> rien n'est facturé au repos) et leur consommation reste sous la franchise
> mensuelle gratuite de Container Apps. Détail des coûts et justification de
> chaque choix : [`infra/README.md`](infra/README.md).

```
Internet (HTTPS)
    │
ca-mediplan-frontend   ingress externe · nginx + Angular · minReplicas 0
    │  proxy /api/ (réseau privé)
ca-mediplan-backend    ingress interne · NestJS · minReplicas 0
    │  TLS obligatoire
PostgreSQL (Neon)      hors Azure, palier gratuit
```

Le backend **n'a aucune adresse publique** : il n'est joignable que par le
frontend. L'API est donc hors d'atteinte directe depuis Internet, et le navigateur
ne voyant qu'une seule origine, aucune configuration CORS n'est nécessaire.

### Déployer

> Prérequis : **Azure CLI** connecté (`az login`), et un fichier `.env.azure` à la
> racine (ignoré par git) contenant `DATABASE_URL` et `JWT_SECRET`.

```bash
# Prévisualiser les changements sans rien appliquer
./scripts/deploy.sh --what-if

# Déployer (réaffiche le plan, puis demande confirmation)
./scripts/deploy.sh

# Peupler le jeu de démonstration — ÉCRASE les données existantes
az containerapp job start --name caj-mediplan-seed --resource-group rg-projet-dev

# Tout supprimer
./scripts/teardown.sh
```

Toute l'infrastructure est décrite en **Bicep** dans [`infra/`](infra/) : aucune
ressource n'est créée à la main, et chaque déploiement est prévisualisé avant
d'être appliqué. Le guide complet — première mise en ligne, dépannage, comptes de
démonstration — est dans
[`docs/deployment/azure.md`](docs/deployment/azure.md).

## Dossier de conception

Le dossier de conception du **Sprint 1** se trouve dans
[`docs/conception/`](docs/conception/) : diagrammes de cas d'utilisation, diagramme de
classes, diagrammes de séquence, diagramme entité-association et explications écrites.

## Suivi de projet

La planification (Epics, User Stories, tâches, statuts) est tenue à jour dans Jira —
projet **MediPlan** (`MEDIPLAN`).

## Équipe

- Souleymane DIALLO
- Zakaria Lahouiri
- Larbi Saib
