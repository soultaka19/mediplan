# Plan des sprints — MediPlan

Ce document décrit le découpage du backlog Jira (projet `MEDIPLAN`) en sprints, aligné sur les
5 phases du cahier des charges (§4.1). Chaque sprint regroupe les User Stories et Tâches portant
le label `Sprint-N` correspondant dans Jira.

> Filtre Jira par sprint : `project = MEDIPLAN AND labels = "Sprint-1"` (remplacer le numéro).

| Sprint | Thème | Phase (cahier) | Tickets Jira | Épics |
|--------|-------|----------------|--------------|-------|
| **Sprint 1** | Analyse & conception | Phase 1 (sem. 1-3) | MEDIPLAN-8, 9, 10, 11, 12, 13, 14, 31, 32, 33 | E1 |
| **Sprint 2** | Fondations & authentification | Phase 2 (sem. 3-7) | MEDIPLAN-28, 29, 15, 16, 17 | E7, E2 |
| **Sprint 3** | Cliniques, médecins & disponibilités | Phase 2 (sem. 3-7) | MEDIPLAN-18, 19, 20 | E3, E4 |
| **Sprint 4** | Rendez-vous & notifications | Phase 2-3 (sem. 5-10) | MEDIPLAN-21, 22, 25 | E4, E5 |
| **Sprint 5** | Flux clinique & tableaux de bord | Phase 3 (sem. 5-10) | MEDIPLAN-23, 24, 26, 27 | E5, E6 |
| **Sprint 6** | Qualité, CI & déploiement | Phase 4-5 (sem. 9-14) | MEDIPLAN-30 | E7 |

## Détail par sprint

### Sprint 1 — Analyse & conception *(en cours / terminé)*
Cahier des charges, 7 diagrammes de cas d'utilisation, diagramme de classes + ERD, 3 diagrammes
de séquence, explications écrites, mise en place GitHub, remise eCité. Jalon : dossier de
conception validé.

### Sprint 2 — Fondations & authentification
Squelettes Angular/NestJS, conteneurisation Docker Compose, inscription/connexion (JWT),
réinitialisation et verrouillage de compte, contrôle d'accès RBAC. Jalon : socle technique +
authentification fonctionnels.

### Sprint 3 — Cliniques, médecins & disponibilités
Création/configuration des cliniques, gestion des médecins et spécialités, définition des
disponibilités (récurrentes, ponctuelles, congés). Jalon : données de référence et créneaux
générables.

### Sprint 4 — Rendez-vous & notifications
Réservation avec contrôle anti-double-réservation, modification/annulation selon règles de délai,
notifications internes. Jalon : cœur métier de réservation opérationnel (OM-04).

### Sprint 5 — Flux clinique & tableaux de bord
Suivi du flux du jour (statuts), décalage groupé, statistiques filtrables, export CSV.
Jalon : pilotage de l'activité par rôle.

### Sprint 6 — Qualité, CI & déploiement
CI GitHub Actions (lint, tests, build), finalisation du déploiement, tests E2E, audit Lighthouse,
revue sécurité OWASP. Jalon : application stable, démontrable et déployable en une commande.

## Transformer ces groupes en sprints natifs Jira

Les sprints sont actuellement matérialisés par des **labels** (`Sprint-1` … `Sprint-6`), car
l'API utilisée ne crée pas de sprints natifs. Pour obtenir de vrais sprints Scrum dans Jira :

1. Ouvrir le **Backlog** du projet MediPlan (tableau Scrum). Si le tableau est en mode Kanban,
   créer un tableau Scrum (Boards → Create board → Scrum → à partir du projet MediPlan).
2. Cliquer **Create sprint** autant de fois que nécessaire (Sprint 1 à 6).
3. Pour chaque sprint, filtrer le backlog par label (`Sprint-N`) et glisser les tickets
   correspondants dans le sprint, ou utiliser l'action groupée *Move to sprint*.
4. Démarrer le **Sprint 1** (*Start sprint*) : il contient le travail de conception déjà terminé.
