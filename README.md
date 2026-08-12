# MediPlan

**Plateforme web de gestion des rendez-vous médicaux**
Projet intégrateur — Programmation informatique — Collège La Cité — Session Printemps 2026

---

## 🚀 L'application en ligne

**`https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io`**

> ⏱️ Le premier accès prend **10 à 15 secondes** : les conteneurs sont en
> *scale-to-zero* et doivent se réveiller. Ensuite, la navigation est instantanée.

| Rôle | Identifiant | Mot de passe |
| --- | --- | --- |
| Réception | `admin.demo@mediplan.test` | `Adm1n!Secret` |
| Médecin | `doctor.demo@mediplan.test` | `Doct0r!Secret` | 
| Patient | `patient.demo@mediplan.test` | `Pat1ent!Secret` |

Comptes de démonstration, **données entièrement fictives**. Aucune donnée réelle de
patient n'est manipulée par la plateforme.

## 📦 Livrables

| Livrable | Où |
| --- | --- |
| 🎬 **Vidéo démonstrative** — 4 min 05 | [`MediPlan-Demo.mp4`](MediPlan-Demo.mp4) |
| 📘 **Manuel d'utilisation** | [`docs/guide-utilisation/`](docs/guide-utilisation/) |
| 📄 **Rapport final de projet** | [`docs/RAPPORT-FINAL.md`](docs/RAPPORT-FINAL.md) · [`.docx`](docs/MediPlan-Rapport-Final.docx) |
| 📋 **Cahier des charges final** | [`docs/cahier-des-charges/`](docs/cahier-des-charges/) — v1.0 initiale et v2.0 finale |
| 📐 **Dossier de conception** | [`docs/conception/`](docs/conception/) — 7 cas d'utilisation, classes, séquence, ERD |
| ✅ **Tests, résultats, bogues corrigés** | [`docs/tests/plan-et-resultats.md`](docs/tests/plan-et-resultats.md) |
| 👥 **Contributions individuelles** | [`docs/presentation/CONTRIBUTIONS.md`](docs/presentation/CONTRIBUTIONS.md) |
| 🖥️ **Support de présentation** | [`docs/presentation/`](docs/presentation/) |

Index complet de la documentation : [`docs/README.md`](docs/README.md).

## Présentation

MediPlan est une plateforme web qui centralise la prise et l'annulation de
rendez-vous médicaux pour des cliniques de petite et moyenne taille. Elle remplace
les outils hétérogènes actuels (appels téléphoniques, agendas papier, fichiers
Excel) par un agenda unique, partagé entre la réception et les médecins.

Quatre rôles interagissent avec la plateforme :

| Rôle                           | Ce qu'il fait                                                            |
| ------------------------------ | ------------------------------------------------------------------------ |
| **Administrateur de clinique** | *L'utilisateur principal.* Disponibilités, réservations, flux du jour, statistiques, utilisateurs |
| **Médecin**                    | Consulte son tableau de bord, ses disponibilités et le flux du jour      |
| **Patient**                    | Réserve un rendez-vous en libre-service et consulte les siens            |
| **Super administrateur**       | Supervise l'ensemble des cliniques                                       |

Chaque utilisateur ne voit que les données de **sa** clinique — une règle appliquée
par le serveur, pas par l'affichage.

## Stack technique

| Couche          | Technologie                                                |
| --------------- | ---------------------------------------------------------- |
| Frontend        | Angular 22 (standalone, Signals) + Angular Material 3 + Tailwind 4 |
| Backend         | NestJS 11 (API REST `api/v1`) + TypeORM + JWT/Passport     |
| Base de données | PostgreSQL — schéma piloté uniquement par migrations versionnées |
| Déploiement     | Docker Compose (local) · Azure Container Apps + Neon (en ligne) |
| Qualité         | Jest (203 tests), ESLint, Prettier, GitHub Actions          |

## Structure du dépôt

Monorepo géré avec **Turborepo + pnpm workspaces** :

```
.
├── apps/
│   ├── backend/    ← API NestJS (TypeScript, TypeORM, PostgreSQL)
│   └── frontend/   ← Application Angular (Angular Material, standalone components)
├── packages/       ← Paquets partagés (vide pour l'instant)
├── MediPlan-Demo.mp4 ← Vidéo démonstrative (4 min 05)
├── docs/           ← Toute la documentation — voir docs/README.md
│   ├── RAPPORT-FINAL.md    ← Rapport final de projet (+ .docx)
│   ├── guide-utilisation/  ← Manuel d'utilisation, avec captures d'écran
│   ├── cahier-des-charges/ ← v1.0 (initiale) et v2.0 (finale, LIV-05)
│   ├── conception/ ← Diagrammes UML, ERD, explications écrites (LIV-06)
│   ├── tests/      ← Stratégie de test, résultats, bogues corrigés
│   ├── deployment/ ← Mise en ligne sur Azure
│   ├── frontend/   ← Design system et audit UX/UI
│   ├── presentation/ ← Présentation finale du 13 août 2026
│   └── archives/   ← Documents périmés, conservés pour l'historique
├── infra/          ← Infrastructure Azure décrite en Bicep
├── scripts/        ← deploy.sh, teardown.sh
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

## Utiliser l'application

Une fois lancée — en ligne, avec Docker ou en développement — l'application
s'utilise dans un navigateur, sans rien installer de plus.

📘 **[Manuel d'utilisation](docs/guide-utilisation/)** — écran par écran, rôle par
rôle : se connecter, publier une plage de disponibilité, réserver pour un patient
au téléphone, suivre le flux du jour, annuler, consulter les statistiques. Avec
captures d'écran, et une section « en cas de problème ».

🎬 **[Vidéo démonstrative](MediPlan-Demo.mp4)** (4 min 05) — le même parcours,
commenté à voix haute par les trois membres de l'équipe.

### Les gestes essentiels, en résumé

| Je veux… | Où |
| --- | --- |
| Ouvrir des créneaux pour un médecin | **Disponibilités** → *Ajouter une plage* — les créneaux se génèrent seuls |
| Réserver pour un patient au téléphone | Bouton **Nouveau rendez-vous** — médecin, créneau, patient |
| Suivre la journée en cours | **Flux du jour** — Réservé → Arrivé → En consultation → Terminé |
| Annuler un rendez-vous | **Flux du jour** → bouton ⋯ → *Annuler* — le motif est obligatoire |
| Mesurer l'activité | **Statistiques** — volume, no-show, occupation |
| Récupérer les rendez-vous dans un tableur | **Flux du jour** → *Exporter CSV* |

## Dossier de conception

Le dossier de conception se trouve dans [`docs/conception/`](docs/conception/) :
7 diagrammes de cas d'utilisation, diagramme de classes, 3 diagrammes de séquence,
diagramme entité-association, et une explication écrite pour chacun.

## Suivi de projet

La planification (épiques, user stories, tâches, statuts et responsables) est tenue
à jour dans **Jira** — projet `MEDIPLAN`. Le déroulé du projet, ce qui a changé en
cours de route et le bilan sont dans le
[**rapport final**](docs/RAPPORT-FINAL.md).

## Équipe

- Souleymane DIALLO
- Zakaria Lahouiri
- Larbi Saib
