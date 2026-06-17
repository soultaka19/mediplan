# Design — Équipe d'agents & cadrage du projet MediPlan

> Spec de conception — 2026-06-16
> Statut : en attente de relecture utilisateur

## 1. Contexte et objectif

MediPlan est le projet intégrateur (Collège La Cité, Printemps 2026) : plateforme web de
gestion de rendez-vous médicaux (Angular + NestJS + PostgreSQL + Docker). Équipe réelle de
3 personnes : Souleymane DIALLO (pilotage), Zakaria Lahouiri, Larbi Saib.

**Objectif de ce travail** : mettre en place une **équipe d'agents Claude** (un par rôle d'un
vrai projet logiciel) pour **piloter l'ensemble du projet**, puis cadrer proprement la suite
(planning → architecture → développement) au bon rythme.

La priorité explicite est le **cadrage**, pas la production précipitée de fonctionnalités avant
le cours du 17 juin.

## 2. État actuel (vérifié le 2026-06-16)

**Jira (projet MEDIPLAN)** — 7 Epics, 23 Stories, 3 Tâches :
- ✅ Sprint-1 (conception) **terminé** : cahier des charges (MEDIPLAN-8), cas d'utilisation (9),
  diagramme de classes + ERD (10), diagrammes de séquence (11), explications (12), dépôt
  GitHub (13), tâches 31/32/33.
- 🔄 MEDIPLAN-14 (soumission eCité + accès prof) = *En cours*.
- ⬜ Tout le reste (auth/RBAC, cliniques, RDV, notifs, stats, **squelettes Angular/NestJS
  MEDIPLAN-28, Docker MEDIPLAN-29, CI MEDIPLAN-30**) = *À faire*.

**GitHub (`soultaka19/mediplan`)** — branches `main`, `dev`, `creation-diagramme-cas-d'utilisation`,
`diagramme-classe`. Contenu : **uniquement de la documentation de conception**
(`docs/conception/`) + `docs/PLAN-SPRINTS.md` + une présentation Sprint-1 (`docs/presentation/`).

**⚠️ Aucun code applicatif** (pas de `package.json`, `angular.json`, `nest-cli.json`,
`docker-compose.yml`). Le projet est en fin de phase conception.

## 3. Décisions de cadrage

1. **Cadrage d'abord** : construire l'équipe d'agents et poser le pilotage avant tout code.
2. **Rythme maîtrisé** : avancer planning → architecture → développement, sans forcer du code
   bâclé pour le 17 juin.
3. **Présentation du 17 juin = instantané honnête** : on montre la conception terminée, l'équipe
   et la gouvernance, le planning des sprints, et l'architecture cible — en indiquant clairement
   ce qui reste à développer.
4. **Agents en global** (`~/.claude/agents/`), au format des agents existants de l'utilisateur.

## 4. L'équipe d'agents (13 agents)

Tous au format des agents existants : frontmatter (`name`, `description` avec blocs `<example>`,
`model: opus`, `memory: user`), system prompt en français (Mission, Principes, Méthodologie,
Format de réponse, Auto-vérification), et bloc *Persistent Agent Memory* pointant vers
`C:\Users\souleymane\.claude\agent-memory\<agent-name>\`.

| # | Agent | Rôle | Périmètre principal |
|---|-------|------|---------------------|
| 1 | `mediplan-product-owner` | Product Owner / Chef de projet | Backlog Jira, user stories, priorisation, valeur, démos, lien consigne académique |
| 2 | `mediplan-scrum-master` | Scrum Master | Cérémonies, découpage en sprints, déblocage, suivi d'avancement, gestion des risques |
| 3 | `mediplan-business-analyst` | Analyste d'affaires | Besoins, règles métier, critères d'acceptation, cohérence cahier des charges ↔ backlog |
| 4 | `mediplan-software-architect` | Architecte logiciel | Architecture monorepo, décisions techniques, cohérence conception ↔ code, diagrammes |
| 5 | `mediplan-data-engineer` | Data engineer / DBA | Modélisation PostgreSQL, ERD, migrations, intégrité, performances des requêtes |
| 6 | `mediplan-nestjs-backend` | Dev Backend | Modules NestJS, API REST, TypeORM, validation, RBAC, tests backend |
| 7 | `mediplan-angular-frontend` | Dev Frontend | Angular + Angular Material, écrans, routing, état, intégration API, tests front |
| 8 | `mediplan-ux-ui-designer` | UX/UI Designer | Parcours, wireframes, design system, accessibilité |
| 9 | `mediplan-security-engineer` | Ingénieur sécurité | Sécurité applicative, RBAC, protection des données de santé, audit |
| 10 | `mediplan-devops-infra` | DevOps / Infra | Docker Compose, CI GitHub Actions, environnements, déploiement local |
| 11 | `mediplan-qa-tester` | QA / Testeur | Stratégie de tests, unitaires/e2e, plans de test, qualité |
| 12 | `mediplan-code-reviewer` | Réviseur de code | Revue de PR, qualité, conventions, détection de bugs et simplifications |
| 13 | `mediplan-tech-writer` | Rédacteur technique | Documentation, dossier de conception, README, guides de remise |

Chaque agent connaît le contexte MediPlan (stack, périmètre, équipe, références Jira/GitHub) et
respecte le périmètre inclus/exclu du cahier des charges.

## 5. Workflow de pilotage

Le **Product Owner** et le **Scrum Master** cadrent (backlog, sprints, priorités). L'**analyste
d'affaires** traduit les besoins en critères d'acceptation. L'**architecte** + le **data engineer**
+ le **security engineer** posent l'architecture. Les **devs front/back** implémentent, guidés par
l'**UX/UI**. Le **DevOps** fournit le socle (Docker, CI). Le **QA** et le **code-reviewer**
verrouillent la qualité. Le **tech-writer** tient la documentation à jour.

L'agent pertinent est invoqué selon la tâche ; pour les décisions transverses, le Product Owner
arbitre.

## 6. Plan d'exécution (par phases, au bon rythme)

- **Phase 0 — Cadrage (cette session)** : créer les 13 agents en global.
- **Phase 1 — Planning** : PO + Scrum Master consolident backlog/roadmap des sprints à partir de
  `docs/PLAN-SPRINTS.md` et de Jira.
- **Phase 2 — Architecture** : architecte + data engineer + security posent l'architecture du
  monorepo (structure `frontend/` + `backend/` + Docker, conventions, modèle de données).
- **Phase 3 — Développement** : amorce du socle (squelettes Angular/NestJS/PostgreSQL, MEDIPLAN-28/29)
  puis fonctionnalités, sprint par sprint, sur des branches `feature/*`.

## 7. Présentation du 17 juin

Instantané honnête du cadrage, structuré selon la consigne (≥ 3 fonctionnalités avec
commencé / fonctionne / reste à compléter, chacune liée à Jira + GitHub + conception), répartition
des rôles entre les 3 membres, et liens utiles. Les 3 fonctionnalités présentées s'appuient sur
les artefacts de conception existants (ex. Authentification/UC-02, Réservation de RDV/UC-03,
Modèle de données/ERD), en indiquant le développement à venir.

## 8. Hors périmètre

- Pas de production de code applicatif complet dans cette session de cadrage.
- Pas de modification du périmètre fonctionnel du cahier des charges.
- Pas de création de sprints natifs Jira (déjà gérés par l'utilisateur ; labels `Sprint-N`).
