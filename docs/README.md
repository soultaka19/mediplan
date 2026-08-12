# Documentation — MediPlan

Index de la documentation du projet. Le **code applicatif** vit dans `apps/`
(monorepo Turborepo + pnpm) — voir le [README racine](../README.md).

---

## Les six documents à lire en premier

Si vous n'en lisez que six, ce sont ceux-là. Ils suffisent à comprendre ce que le
projet devait faire, ce qu'il fait, comment il est construit et qui a fait quoi.

| Document | Ce qu'il répond |
|---|---|
| [Cahier des charges v2.0](cahier-des-charges/Cahier-des-charges-v2.md) | Ce qui était prévu, ce qui a été livré, **et où les deux s'écartent** |
| [Dossier de conception](conception/README.md) | Les diagrammes UML et l'ERD, avec leurs explications écrites |
| [Tests et résultats](tests/plan-et-resultats.md) | Ce que nous testons, pourquoi, et ce qui n'est pas couvert |
| [Contributions individuelles](presentation/CONTRIBUTIONS.md) | Qui a fait quoi, retracé commit par commit |
| [Déploiement Azure](deployment/azure.md) | La mise en ligne, de bout en bout |
| [Design system](frontend/design-system.md) | Les jetons visuels — source unique de l'interface |

---

## Par dossier

| Dossier | Contenu |
|---|---|
| [`cahier-des-charges/`](cahier-des-charges/) | Le cahier des charges, v1.0 (initiale) et **v2.0 (finale)** — LIV-05 |
| [`conception/`](conception/) | 7 cas d'utilisation, diagramme de classes, 3 diagrammes de séquence, ERD — LIV-06 |
| [`tests/`](tests/) | Stratégie de test, les 203 tests, bogues et corrections |
| [`deployment/`](deployment/) | Mise en ligne sur Azure Container Apps |
| [`frontend/`](frontend/) | Design system et audit UX/UI |
| [`reflexion-ux-ui/`](reflexion-ux-ui/) | Réflexion UX/UI livrable, avec captures avant / après |
| [`presentation/`](presentation/) | Présentation finale du 13 août 2026 — support, scénario, vidéo |
| [`archives/`](archives/) | Documents périmés, conservés pour l'historique — [pourquoi](archives/README.md) |

---

## Trois conventions à connaître avant de lire

**Les sprints ont été renumérotés en cours de projet.** Sprint 0 = conception,
Sprint 1 = authentification, Sprint 2 = rendez-vous. Les documents archivés
portent encore l'ancienne numérotation, **décalée de +1**.

**Le cahier des charges existe en deux versions, et c'est voulu.** La v1.0 dit ce
que nous avions prévu le 28 mai ; la v2.0 dit ce que nous avons fait et où nous
nous en sommes écartés. La v1.0 n'a pas été corrigée après coup.

**Le schéma de base est piloté uniquement par des migrations versionnées.**
`synchronize: false`, `migrationsRun: false` : toute entité ou migration doit
être déclarée explicitement dans `apps/backend/src/database/data-source-options.ts`.

---

## Organisation de l'espace de travail

```
.
├── apps/        Code applicatif — backend NestJS, frontend Angular
├── docker/      Dockerfiles multi-étapes
├── docs/        Toute la documentation (ce dossier)
├── infra/       Infrastructure Azure décrite en Bicep
├── packages/    Paquets partagés
├── scripts/     deploy.sh, teardown.sh
└── captures/    Captures d'écran de l'application (hors dépôt)
```
