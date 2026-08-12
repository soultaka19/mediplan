# Plan de Sprint 3 — MediPlan (Groupe 1)

Support de la présentation du plan de Sprint 3 à la professeure (présentation informelle, évaluée).

- **Diaporama** : [`MediPlan-Sprint3-Plan.pptx`](MediPlan-Sprint3-Plan.pptx) — 7 diapositives, 16:9.
  Le texte à dire est dans les **notes de l'orateur** (mode Présentateur).
- **Régénération** : `python docs/presentation/build_sprint3_pptx.py` (nécessite `python-pptx`).

## Découpage et minutage (≈ 10 min)

| # | Diapositive | Orateur | Durée |
|---|---|---|---|
| 1 | Page de titre | Souleymane | 0:30 |
| 2 | Où en est le projet | Souleymane | 2:00 |
| 3 | Objectif et backlog du Sprint 3 | Souleymane | 2:00 |
| 4 | Répartition et séquençage | Zakaria | 2:00 |
| 5 | Risques et règles de travail | Larbi | 2:00 |
| 6 | Definition of Done, démo visée, Sprint 4 | Larbi | 1:30 |
| 7 | Questions | les trois | — |

## Note de renumérotation (interne — ne pas présenter)

Notre backlog avait été découpé en 6 sprints dès la conception. Nous avons livré plus vite que le
calendrier du cours et fusionné plusieurs sprints en tranches verticales. Pour éviter toute
confusion devant la professeure, les tableaux Jira sont renumérotés afin de coller au calendrier
du cours :

| Ancien nom | Nouveau nom | Contenu |
|---|---|---|
| Tableau Sprint 3 | **Sprint 2 — partie 2 : prise de RDV** | 20, 21, 23, 35, 36, 49 — tous Terminé |
| Tableau Sprint 4 | **Sprint 3 — cycle de vie du RDV** | 22, 24, 25, 26, 50, 51 — le sprint présenté |
| Tableau Sprint 5 | **Sprint 4 — finalisation** | 27, 30, 40 |
| Tableau Sprint 6 | *(vidé — à supprimer)* | — |

Le discours devient : « notre Sprint 2 est terminé, il incluait l'authentification **et** la prise
de rendez-vous ; voici le Sprint 3 ». Aucune nuance à expliquer.

---

## 1. Où en est le projet

**Quatre fonctionnalités livrées, fusionnées dans `dev` et promues sur `main`** :

| Fonctionnalité | Tickets | État |
|---|---|---|
| Authentification complète (inscription, connexion JWT, verrouillage, réinitialisation, RBAC 4 rôles) | 15, 16, 17 | Terminé |
| Patient léger (géré par la réception, sans compte) | 35 | Terminé |
| Disponibilités médecins + génération des créneaux | 20 | Terminé |
| Prise de RDV par la réception + flux clinique du jour | 21, 36, 23 | Terminé |
| Socle technique RDV + index anti-double-booking | 49 | Terminé |

**Preuves à montrer à l'écran :**

- Jira : tableaux Sprint 1 et Sprint 2, tickets en « Terminé ».
- GitHub : `dev` et `main` identiques (merges `71cb40f` puis `38400da`).
- Tests : **48 backend + 123 frontend, verts** (mesurés le 15/07/2026 ; les 123 incluent les tests
  de la refonte UI en cours — `dev` seul en compte 117).
- Démo live : connexion → agenda → réservation d'un créneau → flux du jour.

**Point à assumer à l'oral** : l'intégration a demandé une réintégration manuelle de six branches
jamais fusionnées. C'est réglé, et cela a produit les règles de travail du § 4.

## 2. Objectif et backlog du Sprint 3

**Objectif :**

> À la fin du Sprint 3, la réception gère le **cycle de vie complet d'un rendez-vous** — création,
> annulation motivée, notification à l'équipe — et la clinique lit son **activité réelle** sur son
> tableau de bord.

| Priorité | Ticket | User story | Responsable |
|---|---|---|---|
| **Must** | MEDIPLAN-22 | Annuler un RDV avec motif obligatoire, ce qui libère le créneau. | Souleymane |
| **Must** | MEDIPLAN-25 | Recevoir une notification interne lors des changements sur un RDV. | Zakaria |
| **Must** | MEDIPLAN-26 | Consulter des statistiques réelles sur l'activité. | Larbi |
| **Must** | MEDIPLAN-50 | Garantir qu'un patient léger ne s'authentifie pas et que les cliniques sont cloisonnées. | Souleymane |
| Should | MEDIPLAN-24 | Décaler en bloc les RDV d'un médecin (code écrit, reste à intégrer). | Zakaria |
| Should | MEDIPLAN-51 | Interface modernisée (palette clinique, typographie, composants). | Souleymane |

**Hors périmètre, assumé** → Sprint 4 (finalisation) : export CSV (27), CI GitHub Actions (30),
déploiement Railway (40, bonus), documentation des tests, réflexion UI/UX.

## 3. Répartition et séquençage

```
PR-1  MEDIPLAN-22  ── touche le statut du RDV → passe SEUL et EN PREMIER
        │
        ├── PR-2  MEDIPLAN-25  (dépend de l'événement d'annulation)
        └── PR-3  MEDIPLAN-26  (parallèle, lecture seule)
                │
PR-4  MEDIPLAN-50  ── revue transverse de sécurité, en fin de sprint
PR-UI MEDIPLAN-51  ── fusionnée tôt, pour éviter les conflits de styles
```

**Dépendance bloquante** : l'endpoint de changement de statut d'un RDV doit accepter `cancelled`
avant que MEDIPLAN-22 aboutisse. Sans cela, 22 et 25 sont bloqués tous les deux. C'est le premier
travail du sprint.

## 4. Risques et règles de travail

**Risque n° 1 — dérive d'intégration (vécue).** Six branches en parallèle sans fusion : migrations
en double sur le même horodatage, module `appointment/` recréé par deux personnes. Séquelle encore
active : MEDIPLAN-24, marqué « Terminé » alors que son code n'était pas dans `dev` — rouvert en
préparant ce sprint.

**Les 6 règles adoptées :**

1. **Socle d'abord** — le ticket qui touche le modèle ou une migration passe seul et en premier.
2. **PR sous 72 h** — aucune branche ne vit plus de trois jours sans PR ouverte vers `dev`.
3. **Horodatage de migration annoncé** avant création ; séquence continue (616, 617…).
4. **Un module par ticket** — interdiction de recréer un module existant.
5. **Gates de fusion** — lint + tests verts + `migration:run` sur une base neuve.
6. **Point d'intégration à mi-sprint**, pas à la fin.

**Risque n° 2 — rythme inégal entre membres.** Mitigation : un Must par personne, démontrable
seul ; les Should servent de variable d'ajustement ; aucun ticket ne dépend de deux personnes.

## 5. Definition of Done et suite

Un ticket est « Terminé » quand le code est **fusionné dans `dev`**, que lint et tests sont verts,
que les migrations passent sur une base neuve, que les critères Given/When/Then du ticket sont
vérifiés, et que la fonctionnalité est démontrable.

**Démo visée** : réserver un RDV → l'annuler avec motif → voir le créneau se libérer → voir la
notification apparaître → voir le compteur du tableau de bord bouger. Un scénario, cinq
fonctionnalités enchaînées.

---

## Annexe A — À faire dans Jira avant la présentation (manuel)

Le renommage des sprints n'est pas possible via l'API. Dans **Backlog → menu « … » de chaque
sprint → Modifier le sprint** :

1. « Tableau Sprint 3 » → **Sprint 2 — partie 2 : prise de RDV**
2. « Tableau Sprint 4 » → **Sprint 3 — cycle de vie du RDV**
3. « Tableau Sprint 5 » → **Sprint 4 — finalisation**
4. « Tableau Sprint 6 » → le supprimer (vidé : MEDIPLAN-30 a été déplacé)

**Aucun sprint n'a jamais été démarré** (tous à l'état `future`), y compris ceux dont le travail
est terminé. Pour que le tableau reflète la réalité : démarrer puis clore les Sprints 1 et 2, puis
**démarrer le Sprint 3** — idéalement avant la présentation, ou pendant, en calant les dates avec
la professeure.

## Annexe B — Déjà fait dans Jira (via l'API, le 15/07/2026)

- MEDIPLAN-49 (socle RDV) fermé : livré par la branche d'intégration.
- MEDIPLAN-24 rouvert (« À faire ») : marqué Terminé à tort, code non fusionné dans `dev`.
- 20, 21, 23, 35, 36, 49 → label `Sprint-2`, tableau « Sprint 2 — partie 2 ».
- 22, 24, 25, 26, 50, 51 → label `Sprint-3`, tableau « Sprint 3 ».
- 27, 30, 40 → label `Sprint-4`, tableau « Sprint 4 — finalisation ».
- MEDIPLAN-51 créé : modernisation UI « Direction A », avec fiche complète.

## Annexe C — Dates

Durée du Sprint 3 : **à caler avec la professeure lors de la présentation**, en visant la fin des
cours pour laisser place au Sprint 4 de finalisation.
