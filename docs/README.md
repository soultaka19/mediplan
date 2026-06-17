# Documentation — MediPlan

Index de la documentation du projet. Le **code applicatif** vit dans `apps/` (monorepo
Turborepo + pnpm) — voir le [README racine](../README.md).

| Dossier / fichier | Contenu |
| --- | --- |
| [cahier-des-charges/](cahier-des-charges/) | Cahier des charges (LIV-05) |
| [conception/](conception/) | Dossier de conception (Sprint 1) : cas d'utilisation, diagramme de classes, ERD, diagrammes de séquence, explications écrites |
| [consignes/](consignes/) | Énoncés et consignes du cours |
| [presentation/](presentation/) | Supports de présentation d'avancement (sprint review) |
| [deployment/](deployment/) | Guides de déploiement (Railway / cloud) |
| [superpowers/specs/](superpowers/specs/) | Spécifications internes de cadrage (équipe d'agents, plan par phases) |
| [PLAN-SPRINTS.md](PLAN-SPRINTS.md) | Découpage du backlog Jira en sprints |

## Organisation de l'espace de travail

```
.
├── apps/            # Code applicatif (monorepo) : backend NestJS, frontend Angular
├── packages/        # Paquets partagés (à venir)
├── docs/            # Toute la documentation (ce dossier)
└── <config racine>  # package.json, turbo.json, pnpm-workspace.yaml, .env.example, ...
```
