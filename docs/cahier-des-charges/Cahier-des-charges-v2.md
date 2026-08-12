# Cahier des charges — MediPlan

**Plateforme web de gestion des rendez-vous médicaux**

| | |
|---|---|
| Cadre | Projet intégrateur 030747 — Programmation informatique, Collège La Cité |
| Session | Printemps 2026 |
| **Version** | **2.0 — révision de fin de projet** |
| Date | 12 août 2026 |
| Remplace | v1.0 du 28 mai 2026 (`Cahier_des_charges_MediPlan.docx`, conservée telle quelle) |
| Équipe | Souleymane DIALLO · Zakaria Lahouiri · Larbi Saib |

---

## Note de révision

La version 1.0 se terminait par cet engagement :

> « Le présent cahier des charges fixe le cadre du travail à réaliser […]. Il sera
> maintenu vivant tout au long du projet : toute évolution du périmètre ou des
> exigences entraînera une nouvelle révision documentée. »

C'est cette révision. Elle a été écrite **après** le développement, en confrontant
chaque exigence de la v1.0 au produit réellement livré et au code réellement
écrit. Elle n'a pas pour but de faire coïncider le document avec le résultat :
elle a pour but de **dire où le résultat s'écarte du document, et pourquoi**.

La v1.0 n'est pas corrigée ni détruite. Elle reste la référence de ce que nous
avions prévu ; ce document est la référence de ce que nous avons fait.

### Les six écarts structurants

| # | v1.0 prévoyait | La réalité | Nature |
|---|---|---|---|
| 1 | Déploiement **local** via Docker Compose ; « aucun hébergement cloud requis » | Application **en ligne** sur Azure Container Apps, base PostgreSQL infogérée, infrastructure décrite en Bicep, ~0 $/mois | **Dépassement** |
| 2 | Le **patient** est l'acteur central de la réservation | Deux canaux : le **patient léger** créé au comptoir (canal principal, calqué sur le téléphone) *et* la réservation en libre-service par un patient inscrit | **Réorientation** |
| 3 | Disponibilités en **plages récurrentes** avec exceptions | Plages **datées**, plus congés. La récurrence n'est pas implémentée | **Réduction** |
| 4 | **Modification / replanification** d'un rendez-vous | Réservation et annulation seulement. L'annulation exige un **motif** ; le créneau est libéré | **Réduction** |
| 5 | Gestion des **médecins et des cliniques par l'interface** (deux exigences *Must*) | Non livrées. Les données existent, l'écran d'administration n'existe pas | **Non tenu** |
| 6 | Validation par tests **E2E, tests de charge et audits Lighthouse** | 203 tests unitaires et d'intégration verts. Aucun test de bout en bout, de charge ni d'audit automatisé | **Non tenu** |

Les écarts 1 et 2 sont des décisions assumées et défendues ci-dessous. Les écarts
3 à 6 sont des renoncements dictés par le temps.

---

## 1. Présentation du projet

### 1.1 Contexte

*(inchangé par rapport à la v1.0 — le constat de départ n'a pas bougé)*

Dans une partie des cliniques de proximité du Québec, la prise et le suivi des
rendez-vous restent organisés à l'aide d'outils hétérogènes : appels
téléphoniques, agendas papier, fichiers de calcul non partagés. Cette
fragmentation engendre des doubles réservations, des rendez-vous manqués
(« no-shows », 10 % à 30 % selon les contextes), une surcharge administrative et
une absence de données pour piloter l'activité.

**Ce que le projet a précisé en cours de route.** La v1.0 posait le patient comme
utilisateur principal, sur le modèle des plateformes grand public (Doctolib,
Clic Santé). En travaillant le besoin, nous avons retenu un constat plus
resserré : **dans une petite clinique, le patient appelle — il ne s'inscrit
pas.** L'utilisateur qui vit le problème n'est pas le patient, c'est la personne
qui décroche.

Cela n'a pas supprimé le canal patient, mais l'a fait passer du premier au second
plan. C'est l'écart n° 2, et c'est le choix produit le plus structurant du
projet.

### 1.2 Objectifs — et le résultat atteint

#### Objectifs métiers

| ID | Objectif v1.0 | Résultat |
|---|---|---|
| **OM-01** | Réserver, modifier ou annuler en moins de 90 s sans téléphoner | ⚠️ **Partiel.** Réservation et annulation livrées ; **modification non livrée**. Le délai n'a pas été chronométré formellement |
| **OM-02** | Le médecin consulte son horaire du jour et de la semaine en une vue | ✅ **Atteint** — le flux du jour, partagé avec la réception |
| **OM-03** | Réduire la charge administrative en automatisant prise, confirmation, annulation | ✅ **Atteint** — et renforcé : une plage saisie une fois génère ses créneaux |
| **OM-04** | Éviter les doubles réservations par contrôle serveur **et** base | ✅ **Atteint et dépassé.** La garantie est un **index unique partiel** en base : ce n'est plus le code applicatif qui arbitre |
| **OM-05** | Centraliser en garantissant la séparation logique par clinique | ✅ **Atteint** — chaque requête est bornée par la clinique portée par le jeton |
| **OM-06** | Sécuriser les accès selon le rôle | ✅ **Atteint** — RBAC à 4 rôles, gardes sur chaque route protégée |
| **OM-07** | Statistiques d'activité (volumes, no-show, occupation) | ✅ **Atteint** — sur données réelles, filtrables par période et par médecin |

**6 objectifs métiers sur 7 atteints**, le septième partiellement.

#### Objectifs pédagogiques

| ID | Objectif v1.0 | Résultat |
|---|---|---|
| **OP-01** | Architecture client-serveur complète | ✅ Atteint, et déployée en ligne |
| **OP-02** | Qualité de code : typage, linting, revues, tests | ⚠️ **Partiel.** Typage strict ✅, 203 tests ✅, 21 revues de PR ✅ — mais **dette de formatage assumée** : 233 fichiers jamais passés au formateur, 9 avertissements d'accessibilité |
| **OP-03** | Stratégie de sécurité conforme OWASP | ⚠️ **Partiel** — voir §3.3, où chaque écart est nommé |
| **OP-04** | Schéma relationnel normalisé et performant | ✅ Atteint — 7 migrations versionnées, contraintes et index posés en base |
| **OP-05** | Déploiement local industrialisé via Docker Compose | ✅ **Atteint et dépassé** — Docker Compose fonctionne, *et* l'application est en ligne |

### 1.3 Périmètre réel

#### Livré

- l'authentification (inscription, connexion, déconnexion, réinitialisation du
  mot de passe, verrouillage après échecs) et le RBAC à 4 rôles ;
- la gestion des utilisateurs, bornée à la clinique de l'appelant ;
- la gestion des disponibilités par **plages datées**, avec génération
  automatique des créneaux réservables, et les congés ;
- la réservation par la réception pour un **patient léger** créé au comptoir ;
- la réservation en **libre-service par un patient inscrit** — annuaire public
  des cliniques, choix de sa clinique, créneaux réellement libres, « Mes
  rendez-vous » ;
- l'annulation avec **motif obligatoire**, qui libère le créneau ;
- le flux clinique du jour et les transitions de statut ;
- les notifications internes sur les trois événements du cycle de vie ;
- l'export CSV des rendez-vous sur une période ;
- les tableaux de bord et statistiques ;
- la base PostgreSQL pilotée uniquement par migrations versionnées ;
- le déploiement local Docker Compose **et** la mise en ligne sur Azure.

#### Prévu mais non livré

| Élément | Raison |
|---|---|
| Gestion des médecins et des spécialités par l'interface (EF-03, *Must*) | Non commencé. L'accès rapide « Médecins » est visible mais **grisé** : l'emplacement est réservé et l'absence est assumée plutôt que masquée |
| Configuration d'une clinique par l'interface (EF-02, *Must*) | Codée sur une branche (MEDIPLAN-18), **non intégrée** — voir §4.3 |
| Modification / replanification d'un rendez-vous (EF-05, *Must*) | Non commencée |
| Décalage en bloc des rendez-vous d'un médecin | Codé et testé sur une branche (MEDIPLAN-24), **non intégré** |
| Disponibilités **récurrentes** (EF-04, *Must*) | Remplacées par des plages datées, plus simples et suffisantes pour le besoin démontré |
| Rappels par courriel (EF-11, *Should*) | Non commencés. Aucune notification ne sort de l'application |
| Annulation par le patient lui-même | Suppose une règle de délai minimum, non implémentée. Nous avons préféré ne pas livrer l'une sans l'autre |
| Wireframes des écrans clés (LIV-07) | Remplacés par un **design system documenté** et un audit UX/UI — voir §4.2 |
| Documentation OpenAPI / Swagger (LIV-10) | Non produite. La dépendance n'est pas installée |

#### Exclu dès l'origine, et toujours exclu

Dossier médical (DSE/DSQ), prescriptions, paiement en ligne, application mobile
native, synchronisation d'agenda externe, IA médicale, intégration hospitalière.

---

## 2. Description fonctionnelle

### 2.1 Scénarios — révisés

Les scénarios SC-01 à SC-05 de la v1.0 sont réécrits ci-dessous pour décrire ce
que l'application fait réellement. Les écarts sont signalés.

#### SC-01 — Réserver un rendez-vous · **deux canaux**

**Canal A — la réception, pour un patient au téléphone** *(canal principal)*

> Acteur : administrateur de clinique · Précondition : au moins une plage publiée

1. La réception ouvre « Nouveau rendez-vous » et choisit le médecin.
2. Elle choisit une plage de disponibilité, puis un créneau **parmi ceux qui
   sont réellement libres** — un créneau pris n'apparaît plus.
3. Elle saisit le patient (prénom, nom, motif) : un **patient léger** est créé,
   sans compte ni mot de passe.
4. La base refuse toute seconde écriture sur le même créneau.

**Canal B — le patient, en libre-service**

> Acteur : patient inscrit et rattaché à une clinique

1. Le patient consulte les créneaux libres de sa clinique.
2. Il réserve. **L'identité vient du jeton**, jamais du corps de la requête : un
   patient ne peut pas réserver au nom d'un autre.
3. Le rendez-vous apparaît dans « Mes rendez-vous ».

> ⚠️ **Écart avec la v1.0.** Celle-ci décrivait une recherche par spécialité sur
> 30 jours. La recherche par spécialité n'existe pas : on choisit un médecin.
>
> ✅ **Point non prévu par la v1.0, et tenu.** Les deux canaux empruntent **la
> même transaction, le même verrou et le même index**. La garantie
> anti-double-réservation ne dépend pas du canal.

#### SC-02 — Annuler un rendez-vous

> Acteur : administrateur de clinique

1. Il ouvre le menu de la ligne du rendez-vous et choisit « Annuler ».
2. **Le bouton de confirmation reste inactif tant que le motif est vide.** C'est
   une règle métier, pas une politesse d'interface.
3. Le rendez-vous passe au statut « annulé » et **le créneau redevient
   réservable** — rendu possible par l'index unique *partiel*, qui exclut les
   rendez-vous annulés.

> ⚠️ **Écarts avec la v1.0** : pas de modification/replanification ; pas de délai
> minimum de 24 h ; le patient ne peut pas annuler lui-même.

#### SC-03 — Gérer le flux clinique du jour

> Acteur : administrateur de clinique ou médecin

Vue partagée de la journée. Chaque rendez-vous suit : **Réservé → Arrivé → En
consultation → Terminé**, ou **Annulé**. Les statuts terminaux demandent une
confirmation. Une notification interne est émise à chaque changement.

> ⚠️ **Écart** : le décalage en bloc en cas de retard n'est pas intégré.

#### SC-04 — Configurer une clinique

> **Non livré par l'interface.** Les cliniques existent en base, alimentent
> l'annuaire public et bornent toutes les requêtes ; mais aucun écran ne permet
> de les créer ou de les configurer. Le rôle super administrateur existe et est
> appliqué côté sécurité.

#### SC-05 — Consulter les statistiques

> Acteur : administrateur de clinique

Volume de rendez-vous, taux d'absence, taux d'occupation, détail par médecin,
filtrables par période. Calculés en base sur les données réelles, bornés à la
clinique de l'appelant.

> ⚠️ **Écart** : les motifs d'annulation ne sont pas agrégés. L'export CSV existe,
> mais séparément (EF-10).

### 2.2 Fonctionnalités — état de livraison

| ID | Fonctionnalité | Priorité v1.0 | État |
|---|---|---|---|
| EF-01 | Authentification et gestion des comptes | Must | ✅ **Livré** — et dépassé (verrouillage, réinitialisation) |
| EF-02 | Gestion des cliniques | Must | ⚠️ **Partiel** — en base et à l'inscription ; pas d'écran de configuration |
| EF-03 | Gestion des médecins et des spécialités | Must | ❌ **Non livré** |
| EF-04 | Gestion des disponibilités | Must | ⚠️ **Partiel** — plages **datées** + congés ; pas de récurrence |
| EF-05 | Réservation, modification, annulation | Must | ⚠️ **Partiel** — réservation (2 canaux) et annulation ✅ ; **modification ❌** |
| EF-06 | Flux clinique du jour | Must | ✅ **Livré** |
| EF-07 | Notifications internes | Must | ✅ **Livré** |
| EF-08 | Tableaux de bord et statistiques | Should | ✅ **Livré** |
| EF-09 | Gestion des rôles et permissions (RBAC) | Must | ✅ **Livré** |
| EF-10 | Export CSV | Could | ✅ **Livré** |
| EF-11 | Rappels par courriel | Should | ❌ **Non livré** |

**Bilan MoSCoW** — 8 *Must* : 4 livrés, 3 partiels, 1 absent. 2 *Should* : 1 livré.
1 *Could* : livré.

> **Un *Could* est livré pendant qu'un *Must* ne l'est pas.** C'est le symptôme le
> plus net de notre défaut de méthode : l'export CSV était rapide et bien cerné,
> la gestion des médecins était longue et floue. Nous avons suivi la facilité au
> lieu de la priorité. C'est exactement ce que MoSCoW sert à empêcher, et nous ne
> l'avons pas relu en cours de projet.

### 2.3 Interface utilisateur

Les exigences ergonomiques de la v1.0 sont **tenues** :

| Exigence v1.0 | Résultat |
|---|---|
| Moins de trois clics pour réserver depuis l'accueil | ✅ Deux clics jusqu'au formulaire |
| Navigation adaptée au rôle, retours systématiques | ✅ Le menu change visiblement selon le rôle — le RBAC se voit à l'écran |
| Responsive à partir de 360 px | ✅ Vérifié en captures mobile |
| WCAG 2.1 AA | ⚠️ **Travaillé, non certifié** — lien d'évitement, focus visible, ARIA, cibles 44 px, contrastes vérifiés ; **9 avertissements d'accessibilité clavier restent** |

**Ajouts non prévus par la v1.0** : un design system tokenisé
(`docs/frontend/design-system.md`), une refonte complète de l'interface et un
**mode sombre**.

**Retrait** : les wireframes annoncés (LIV-07) n'ont pas été produits comme tels.
Ils ont été remplacés en cours de route par un design system documenté et un
audit UX/UI — ce qui est plus utile en aval, mais ne remplace pas un wireframe en
amont. Nous avons donc conçu l'interface en la codant.

---

## 3. Description technique

### 3.1 Technologies retenues

| Couche | v1.0 annonçait | Réellement utilisé |
|---|---|---|
| Frontend | Angular + Angular Material | **Angular 22** standalone + Signals, **Angular Material 3**, **Tailwind CSS 4** |
| Backend | NestJS | **NestJS 11**, préfixe `api/v1` |
| ORM | « TypeORM **ou** Prisma » | **TypeORM**, migrations versionnées |
| Base | PostgreSQL | **PostgreSQL** — infogéré chez Neon en ligne |
| Tests | Jest + Cypress/Playwright | **Jest** seul |
| Conteneurs | Docker + Docker Compose | ✅ **+ Azure Container Apps** |
| CI | GitHub Actions | ✅ |
| Suivi | « kanban GitHub Projects » | **Jira** (projet MEDIPLAN) |
| Non installés | Helmet, Swagger, Artillery/k6, Cypress | ❌ aucune de ces quatre |

### 3.2 Architecture réelle

La v1.0 décrivait trois tiers orchestrés par Docker Compose, en local. C'est
toujours vrai en développement. **En ligne, l'architecture est allée plus loin :**

```
Navigateur
    │  HTTPS
    ▼
Frontend Angular servi par nginx        ── Azure Container Apps (ingress public)
    │  proxy /api/  ──►  Host: $proxy_host
    ▼
API REST NestJS                          ── Azure Container Apps (ingress INTERNE)
    │
    ▼
PostgreSQL infogéré                      ── Neon
```

Trois décisions structurantes, aucune n'était dans la v1.0 :

1. **Le backend n'a aucune adresse publique.** Ingress interne : il n'est
   joignable que par le frontend. C'est ce qui **supprime tout besoin de CORS** —
   il n'y a jamais de requête inter-origines.
2. **Toute l'infrastructure naît d'un template Bicep.** Aucune ressource n'a été
   créée à la main ; chaque déploiement est précédé d'un `what-if`.
3. **Scale-to-zero partout où c'est possible.** Coût maintenu à **~0 $/mois**,
   contrainte d'un crédit étudiant non renouvelable. Le prix payé est un
   démarrage à froid de 10 à 15 secondes, assumé et expliqué en démonstration.

**Conventions de schéma.** `synchronize: false`, `migrationsRun: false` : le
schéma est piloté **uniquement** par des migrations versionnées, et chaque entité
est déclarée explicitement, jamais par recherche de répertoire. N'importe qui
reconstruit exactement le même schéma.

### 3.3 Sécurité — ce qui est en place, et ce qui manque

C'est la section où la v1.0 promettait le plus. Voici l'état exact.

#### Tenu

| Exigence v1.0 | État |
|---|---|
| Hachage des mots de passe, jamais en clair | ✅ **bcrypt, coût 12** (la v1.0 autorisait bcrypt à coût adapté) |
| Verrouillage après tentatives échouées | ✅ configurable |
| RBAC à 4 rôles, gardes sur chaque route protégée | ✅ |
| Séparation stricte des données par clinique | ✅ chaque requête bornée par le jeton |
| Moindre privilège dès la conception | ✅ |
| Validation systématique des entrées | ✅ `ValidationPipe` global en `whitelist` + `forbidNonWhitelisted` : tout champ non déclaré est **rejeté**, pas ignoré |
| Requêtes paramétrées contre l'injection SQL | ✅ via l'ORM, exclusivement |
| HTTPS en production | ✅ terminaison TLS par Container Apps |
| Pas de fuite d'information dans les erreurs | ✅ filtre d'exception global qui normalise toutes les réponses |
| Aucun secret dans le dépôt | ✅ paramètres Bicep `@secure()` puis secrets natifs Container Apps |

#### Non tenu — nommé sans détour

| Exigence v1.0 | État | Portée réelle du risque |
|---|---|---|
| **Refresh token avec rotation** | ❌ **Absent.** Un seul JWT HS256, durée 60 min | Pas de révocation possible avant expiration |
| **Déconnexion serveur par invalidation** | ❌ **Absente.** La déconnexion est côté client : le jeton reste valide jusqu'à son expiration | Conséquence directe du point ci-dessus |
| **En-têtes HTTP de sécurité (Helmet)** | ❌ **Absents.** Ni Helmet côté API, ni `add_header` côté nginx : pas de CSP, X-Frame-Options, HSTS ni X-Content-Type-Options | C'est l'écart le plus facile à combler — quelques lignes |
| **Journalisation des actions sensibles** | ❌ **Absente.** Aucun journal d'audit applicatif | Aucune traçabilité des accès |
| Protection CSRF | ➖ **Sans objet** — aucun cookie de session : l'authentification passe par un en-tête `Authorization: Bearer` |
| Limitation de débit (anti-force brute réseau) | ❌ Absente. Le verrouillage de compte protège un compte donné, pas l'API dans son ensemble |

> **Notre lecture.** Le socle est correct : hachage, validation stricte, RBAC
> réellement appliqué, séparation par clinique, aucun secret versionné. Ce qui
> manque relève de la **défense en profondeur** — les couches qu'on ajoute quand
> le principal tient. Les en-têtes de sécurité et la journalisation sont les deux
> premiers éléments que nous ajouterions, et ils demandent moins d'une journée.
>
> La v1.0 s'engageait sur l'ASVS niveau 1. Nous ne pouvons pas prétendre l'avoir
> atteint : nous ne l'avons pas vérifié point par point.

#### Cadre légal

Inchangé et sans objet pratique : **aucune donnée réelle de patient n'a jamais
été manipulée**. Le jeu de démonstration est entièrement fictif et généré. Les
principes de la Loi 25 et de la LPRPDE ont guidé la conception (minimisation,
séparation, moindre privilège) sans faire l'objet d'une mise en conformité.

### 3.4 Performance

Les cinq exigences ENF-PERF de la v1.0 supposaient des outils qui n'ont pas été
installés. État réel :

| ID | Exigence v1.0 | État |
|---|---|---|
| ENF-PERF-01 | API < 300 ms au 95ᵉ percentile | ❌ **Non mesuré.** Observé le 12 août sur l'application en ligne : sonde `/health` **0,44 s**, connexion **0,99 s** — mesures ponctuelles, pas un percentile |
| ENF-PERF-02 | Frontend < 2 s en 4G | ❌ Non mesuré. Premier accès à froid observé : **9,9 s**, dû au scale-to-zero, pas au poids de la page |
| ENF-PERF-03 | Tableau de bord de 100 RDV < 1 s | ❌ Non mesuré |
| ENF-PERF-04 | 50 utilisateurs concurrents | ❌ Non testé |
| ENF-PERF-05 | **Aucune double réservation en accès concurrent** | ✅ **Vérifié** sur l'application déployée : deux réservations simultanées sur le même créneau → une **201**, une **409**. Non rejoué à 1000 itérations |

**Un seul des cinq est vérifié — mais c'est celui qui compte.** ENF-PERF-05 est
la seule exigence de performance qui porte une garantie d'intégrité ; les quatre
autres portent un confort. Nous avons vérifié la garantie et laissé le confort.

---

## 4. Planification et livrables

### 4.1 Phases — prévues et réelles

La v1.0 prévoyait cinq phases séquentielles sur 14 semaines. Le projet a été
mené en **sprints**, suivis dans Jira, avec un découpage **par tranche
verticale** : chacun mène sa fonctionnalité de la migration jusqu'à l'écran,
plutôt qu'une séparation « un front / un back ».

| Phase v1.0 | Réalité |
|---|---|
| 1 — Analyse et conception | ✅ **Sprint 0** — cahier des charges, 7 cas d'utilisation, diagramme de classes, 3 diagrammes de séquence, ERD |
| 2 — Développement backend | ✅ **Sprint 1** — socle monorepo, Docker, CI, puis authentification et RBAC |
| 3 — Développement frontend | ✅ mené **en parallèle**, pas après : la tranche verticale l'impose |
| 4 — Tests, sécurité, qualité | ⚠️ **Partiel** — tests unitaires oui, sécurité partielle, audits absents |
| 5 — Déploiement et présentation | ✅ **Dépassé** — mise en ligne réelle, faite **en parallèle** du dernier sprint, pas à la fin |

> ⚠️ **Les sprints ont été renumérotés en cours de projet** : Sprint 0 =
> conception, Sprint 1 = authentification, Sprint 2 = rendez-vous. Certains
> documents archivés portent encore l'ancienne numérotation, décalée de +1.

**Ce que le découpage en phases nous a coûté.** Il supposait qu'on finisse le
backend avant d'attaquer le frontend. Nous ne l'avons pas fait, et c'était le bon
choix — mais nous avons gardé du modèle en phases l'idée qu'on peut travailler
longtemps sans intégrer. C'est de là que vient l'écart n° 5.

### 4.2 Livrables

| ID | Livrable v1.0 | État |
|---|---|---|
| LIV-01 | Code source frontend Angular + tests + README | ✅ `apps/frontend` — 133 tests |
| LIV-02 | Code source backend NestJS + tests + README | ✅ `apps/backend` — 70 tests |
| LIV-03 | Schéma PostgreSQL versionné par migrations | ✅ 7 migrations |
| LIV-04 | Documentation technique | ✅ `README.md`, `CONTRIBUTING.md`, `docs/` |
| LIV-05 | **Cahier des charges en version finale** | ✅ **le présent document** |
| LIV-06 | Diagrammes UML + MCD/ERD | ✅ `docs/conception/` — 7 UC, classes, 3 séquences, ERD |
| LIV-07 | Wireframes des écrans clés | ❌ **Remplacés** par `docs/frontend/design-system.md` et l'audit UX/UI |
| LIV-08 | Application démontrable de bout en bout | ✅ **en ligne**, plus une vidéo de démonstration de 4 min 05 |
| LIV-09 | `docker-compose.yml` et Dockerfiles | ✅ démarrage en une commande |
| LIV-10 | Documentation OpenAPI (Swagger) | ❌ **Non produite** |
| LIV-11 | Support de présentation finale | ✅ 16 diapositives |

**9 livrables sur 11.**

**Livrables produits en plus de la v1.0** : infrastructure Azure en Bicep
(`infra/`), document de tests et résultats, contributions individuelles
tracées commit par commit, scénario de démonstration vérifié en ligne, réflexion
UX/UI, vidéo de démonstration.

### 4.3 Suivi

**Jira, projet MEDIPLAN** — 51 tickets, 7 épiques. **GitHub** — 21 pull requests,
3 contributeurs sur `main`. Le flux : un ticket → une branche → une pull request
→ une revue → la CI. **La CI bloque la fusion** si la compilation ou les tests
échouent ; le formatage et le lint sont rapportés sans bloquer, dette assumée.

> **La difficulté qui a le plus coûté : la dérive d'intégration.** Des branches
> sont restées non fusionnées pendant des semaines — jusqu'à **56 commits de
> retard**, dont une refonte complète de l'interface. Cinq tickets étaient marqués
> « Terminé » sans exister dans le produit.
>
> Correction appliquée en fin de projet : trois branches réintégrées par pull
> requests revues, les autres repassées « À faire » **avec la raison écrite**, et
> une définition de « terminé » resserrée — **terminé = fusionné dans `main`, CI
> verte**. C'est ce qui explique les écarts n° 5 et n° 6 de ce document.

---

## 5. Modalités de validation

### 5.1 Ce qui a réellement été testé

**203 tests automatisés, tous verts** au 12 août 2026 : **70 backend** (11
suites) et **133 frontend** (28 suites).

Nous n'avons pas cherché une couverture uniforme. Nous avons testé **ce qui casse
silencieusement** : les règles métier (une transition de statut invalide, un
créneau réservé deux fois), la sécurité (un défaut de contrôle d'accès ne se voit
jamais à l'usage), et le comportement des écrans. L'apparence est explicitement
hors périmètre : un test qui vérifie une couleur casse à chaque retouche et
n'attrape aucun défaut réel.

**Validation manuelle** : le parcours complet est rejoué avant chaque
démonstration, selon `docs/presentation/SCENARIO-DEMO-Finale.md`, écrit **en
jouant le parcours sur l'application en ligne** — chaque libellé et chaque
message cité a été observé, pas supposé.

### 5.2 Ce qui n'a pas été testé — et l'écart avec la v1.0

| Prévu v1.0 | État |
|---|---|
| Tests E2E Cypress ou Playwright | ❌ **Aucun.** Le parcours complet est validé à la main |
| Tests d'intégration API avec base dédiée (Supertest) | ❌ Absents. Les contrôleurs sont testés unitairement, avec doublures |
| Tests de charge (Artillery / k6) | ❌ Aucun |
| Audits Lighthouse | ❌ Aucun |
| Couverture ≥ 70 % sur les modules métier | ❌ **Non mesurée** — aucun rapport de couverture n'a été produit |
| Critères d'acceptation au format Gherkin | ❌ Non rédigés |
| Enquête de satisfaction (3 à 5 utilisateurs) | ❌ Non réalisée |

### 5.3 Indicateurs de succès — révisés

Les sept KPI de la v1.0 supposaient un outillage de mesure que nous n'avons pas
mis en place. Aucun n'a été mesuré selon la méthode annoncée. Plutôt que de les
maquiller, nous les remplaçons par ce qui a **effectivement** été vérifié.

| KPI v1.0 | Cible | Mesuré ? |
|---|---|---|
| KPI-01 Temps de réservation | < 90 s | ❌ non chronométré |
| KPI-02 Doubles réservations / 1000 | 0 % | ⚠️ vérifié en concurrence réelle, pas à 1000 itérations |
| KPI-03 API p95 | < 300 ms | ❌ non mesuré |
| KPI-04 Lighthouse performance | ≥ 90 | ❌ non mesuré |
| KPI-05 Lighthouse accessibilité | ≥ 90 | ❌ non mesuré |
| KPI-06 Couverture backend | ≥ 70 % | ❌ non mesurée |
| KPI-07 Satisfaction utilisateurs | ≥ 4/5 | ❌ non réalisée |

**Indicateurs réellement vérifiés, au 12 août 2026 :**

| ID | Indicateur | Valeur | Comment |
|---|---|---|---|
| **IV-01** | Tests automatisés verts | **203 / 203** | `pnpm test` |
| **IV-02** | Double réservation en accès concurrent | **impossible** | Deux requêtes simultanées → 201 et 409, sur l'application déployée |
| **IV-03** | Disponibilité de l'application en ligne | **opérationnelle** | Sonde `/health` 200 en 0,44 s ; connexion 200 en 0,99 s |
| **IV-04** | Parcours complet rejoué de bout en bout | **14 points ✅** | Scénario du 10 août, sur l'application en ligne |
| **IV-05** | Erreurs dans la console du navigateur | **aucune** | Parcours complet du 10 août |
| **IV-06** | Fonctionnalités livrées | **9** | |
| **IV-07** | Coût d'hébergement mensuel | **~0 $** | Scale-to-zero + crédit étudiant |

### 5.4 Definition of Done — ce qu'elle est devenue

La v1.0 en proposait une de six critères. Elle n'a pas tenu : elle était trop
longue à vérifier et personne ne la relisait. Elle a été remplacée en cours de
projet par une règle en une ligne, que nous avons réellement appliquée :

> **Terminé = fusionné dans `main`, CI verte.**

Ce qui reste des six critères d'origine est ce que la CI vérifie toute seule : la
compilation et les tests. Le reste — revue de code, documentation à jour, lint
sans avertissement — dépendait de la discipline, et la discipline a cédé.

> **Ce que nous en retenons.** Une définition de « terminé » que l'outillage ne
> vérifie pas n'est pas une définition, c'est une intention.

---

## 6. Conclusion

MediPlan est livré : une application **réellement déployée**, testée, et
démontrable de bout en bout, qui traite le problème posé — la double
réservation devient techniquement impossible, la journée de clinique est visible
d'un seul écran, et un créneau annulé n'est plus un créneau perdu.

Le produit est en deçà du cahier des charges initial sur trois points, tous
nommés dans ce document : **la gestion des médecins et des cliniques par
l'interface**, **la modification d'un rendez-vous**, et **la validation
automatisée de bout en bout**. Il le dépasse sur deux autres : **la mise en ligne
réelle**, jamais exigée, et **le second canal de réservation en libre-service**.

La cause des manques n'est pas technique. Elle est de méthode : nous avons
travaillé longtemps sans intégrer, et notre définition de « terminé » a laissé du
code exister sans être dans le produit. Le correctif est déjà appliqué — et c'est
probablement ce que nous retenons le plus de ce projet.

---

## Annexe A — Hypothèses révisées

| Hypothèse v1.0 | Révision |
|---|---|
| Déploiement de référence **local** | ❌ **Caduque.** Le déploiement de référence est **Azure Container Apps**. Docker Compose reste l'environnement de développement |
| Données de démonstration fictives | ✅ **Tenue sans exception** |
| Clinique unique duplicable | ✅ Tenue — le multi-clinique est dans le modèle et appliqué côté sécurité, mais peu outillé côté interface |
| Notifications internes, courriel non obligatoire | ✅ Tenue — aucune notification ne sort de l'application |
| Navigateurs : deux dernières versions majeures | ⚠️ Développé et vérifié sur **Chrome et Edge** uniquement. Firefox et Safari n'ont pas été testés |

## Annexe B — Risques : ce qui s'est réellement produit

| ID | Risque v1.0 | Survenu ? |
|---|---|---|
| R-01 | Sous-estimation du frontend | ⚠️ **Partiellement** — absorbé par la tranche verticale |
| R-02 | Complexité du modèle de disponibilités | ✅ **Survenu**, et mitigé en **supprimant la récurrence** : plages datées |
| R-03 | Indisponibilité d'un membre | ❌ Non survenu |
| R-04 | Failles de sécurité non détectées | ⚠️ **Non détectées faute d'avoir cherché** — aucun scan, aucune revue OWASP formelle |
| R-05 | Problèmes Docker en démonstration | ✅ **Survenu deux fois** : fins de ligne CRLF empêchant le démarrage d'un conteneur, et horaires décalés de 4 h parce que le conteneur tourne en UTC |
| R-06 | Dérive du périmètre | ❌ **Le contraire s'est produit** — le périmètre s'est réduit |

**Risque non prévu, et le plus coûteux : la dérive d'intégration** (§4.3). Il ne
figurait pas dans la matrice. Il aurait dû.

**Second risque non prévu : les écarts entre environnements.** Trois incidents,
tous invisibles en local : un 404 sur toutes les routes en production (l'en-tête
`Host` transmis au proxy), les fins de ligne, le fuseau horaire. Aucun n'était un
bogue de code.

## Annexe C — Pistes d'évolution, réordonnées

L'ordre n'est pas arbitraire : finir ce qui est écrit, sécuriser ce qui existe,
puis seulement ajouter. Ajouter sur une base fragile est ce qui nous a coûté le
plus cher.

**1 — Solder l'existant.** Intégrer le décalage en bloc (codé, testé) et la
configuration de clinique. Livrer la gestion des médecins. Passer le formateur
sur les 233 fichiers en attente.

**2 — Fiabiliser.** En-têtes de sécurité et journalisation d'audit (moins d'une
journée). Refresh token avec rotation et déconnexion serveur. Tests de bout en
bout. Pagination serveur. Rendre le lint bloquant une fois la dette résorbée.

**3 — Étendre la valeur.** Rappels par courriel ou SMS — la vraie arme contre
l'absentéisme, et le seul chiffre que la clinique voit sur sa facture. Liste
d'attente : proposer automatiquement un créneau libéré par une annulation.
Annulation par le patient, avec son délai minimum. Puis, seulement ensuite,
l'ouverture à un réseau de cliniques et une API publique documentée.

## Annexe D — Références

Les sources de la v1.0 restent valables et ne sont pas reproduites ici
(Cayirli & Veral 2003 ; Dantas et al. 2018 ; OCDE ; Loi 25 ; LPRPDE ; OWASP Top 10
et ASVS ; ISO/IEC 25010 ; WCAG 2.1 AA). Le benchmark de l'annexe B de la v1.0
(Bonjour-Santé, Clic Santé, Chronos, Doctolib) et le glossaire n'ont pas eu à
être révisés.

**Documents du projet qui complètent celui-ci :**

| Document | Contenu |
|---|---|
| `docs/conception/` | 7 cas d'utilisation, diagramme de classes, 3 diagrammes de séquence, ERD |
| `docs/tests/plan-et-resultats.md` | Stratégie de test, les 203 tests, ce qui n'est pas couvert |
| `docs/presentation/CONTRIBUTIONS.md` | Qui a fait quoi, retracé commit par commit |
| `docs/presentation/SCENARIO-DEMO-Finale.md` | Le parcours de démonstration, vérifié en ligne |
| `docs/deployment/azure.md` | La mise en ligne, de bout en bout |
| `docs/frontend/design-system.md` | Les jetons de design — source unique |
| `infra/README.md` | Choix de SKU et maîtrise des coûts |
