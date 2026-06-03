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

| Rôle | Besoins principaux |
|------|--------------------|
| **Patient** | Réserver, modifier ou annuler un rendez-vous sans téléphoner |
| **Médecin** | Consulter son horaire, gérer ses disponibilités, suivre le flux du jour |
| **Administrateur de clinique** | Gérer utilisateurs, médecins, disponibilités, statistiques |
| **Super administrateur** | Configurer les cliniques et la plateforme |

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular + Angular Material + TypeScript |
| Backend | NestJS (API REST) + TypeScript |
| Base de données | PostgreSQL |
| Déploiement | Docker + Docker Compose (local) |
| Qualité | Jest, Cypress/Playwright, ESLint, Prettier, GitHub Actions |

## Structure du dépôt

```
.
├── docs/
│   └── conception/          ← Dossier de conception (diagrammes UML, explications)
├── Cahier_des_charges_MediPlan.docx
└── README.md
```

> Les sous-dossiers `frontend/` (Angular) et `backend/` (NestJS) seront ajoutés lors des
> phases de développement (Phases 2 et 3 du cahier des charges).

## Dossier de conception

Le dossier de conception du **Sprint 1** se trouve dans
[`docs/conception/`](docs/conception/) : diagrammes de cas d'utilisation, diagramme de
classes, diagrammes de séquence, diagramme entité-association et explications écrites.

## Suivi de projet

La planification (Epics, User Stories, tâches, statuts) est tenue à jour dans Jira —
projet **MediPlan** (`MEDIPLAN`).

## Équipe

- Souleymane DIALLO
- _(coéquipiers à compléter)_
