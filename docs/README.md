# Documentation — MediPlan

Index de la documentation du projet. Le **code applicatif** vit dans `apps/`
(monorepo Turborepo + pnpm) — voir le [README racine](../README.md).

---

## Les livrables de la remise finale

Les documents de remise sont en **PDF**. Le Markdown reste la source et se lit
directement sur GitHub ; le `.docx` sert aux retouches.

| Livrable | PDF | Source |
|---|---|---|
| **Cahier des charges final** | [13 p.](cahier-des-charges/Cahier_des_charges_MediPlan_v2.pdf) | [`.md`](cahier-des-charges/Cahier-des-charges-v2.md) · [`.docx`](cahier-des-charges/Cahier_des_charges_MediPlan_v2.docx) |
| **Rapport final de projet** | [8 p.](MediPlan-Rapport-Final.pdf) | [`.md`](RAPPORT-FINAL.md) · [`.docx`](MediPlan-Rapport-Final.docx) |
| **Manuel d'utilisation** | [18 p.](guide-utilisation/MediPlan-Manuel-Utilisation.pdf) | [`.md`](guide-utilisation/README.md) |
| **Tests, résultats, corrections** | [7 p.](tests/MediPlan-Tests-et-Resultats.pdf) | [`.md`](tests/plan-et-resultats.md) |
| **Contributions individuelles** | [6 p.](presentation/MediPlan-Contributions.pdf) | [`.md`](presentation/CONTRIBUTIONS.md) |
| **Dossier de conception** | — | [`conception/`](conception/) — les diagrammes s'affichent sur GitHub |
| **Vidéo démonstrative** | — | [`../MediPlan-Demo.mp4`](../MediPlan-Demo.mp4) — 4 min 05 |
| **Instructions de lancement** | — | [`../README.md`](../README.md) |

> La **v1.0** du cahier des charges est également convertie
> ([22 p.](cahier-des-charges/Cahier_des_charges_MediPlan.pdf)) : elle sert de
> point de comparaison, la v2.0 fait 13 pages.

---

## Si vous n'en lisez que trois

| Document | Ce qu'il répond |
|---|---|
| [Rapport final](RAPPORT-FINAL.md) | Comment le projet a été conduit, ce qui a changé, ce qui reste — la synthèse |
| [Cahier des charges v2.0](cahier-des-charges/Cahier-des-charges-v2.md) | Ce qui était prévu, ce qui a été livré, **et où les deux s'écartent** |
| [Manuel d'utilisation](guide-utilisation/) | Comment se servir de l'application, écran par écran |

---

## Par dossier

| Dossier | Contenu |
|---|---|
| [`cahier-des-charges/`](cahier-des-charges/) | Le cahier des charges, v1.0 (initiale) et **v2.0 (finale)** — LIV-05 |
| [`conception/`](conception/) | 7 cas d'utilisation, diagramme de classes, 3 diagrammes de séquence, ERD — LIV-06 |
| [`guide-utilisation/`](guide-utilisation/) | Manuel d'utilisation, avec captures d'écran |
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
