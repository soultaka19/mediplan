# MediPlan — Brief de design & document de brainstorming produit

> Document de référence pour le·la designer chargé·e de repenser l'interface de MediPlan.
> Il regroupe l'idée, les objectifs, les utilisateurs cibles, le périmètre fonctionnel,
> les parcours, l'inventaire des écrans, le design system existant et les axes d'amélioration.
>
> **Captures de l'existant** : dossier [`../../captures/`](../../../captures/) (20 écrans, clair + sombre + mobile).
> **Statut** : produit fonctionnel (MVP livré), en phase de refonte UI/UX.
> **Dernière mise à jour** : 2026-07-27.

---

## 1. Résumé exécutif (pitch en une phrase)

**MediPlan est une application web de gestion des rendez-vous pour une clinique médicale :
elle permet au personnel d'accueil et aux médecins de planifier des disponibilités,
réserver des rendez-vous pour les patients, et suivre en temps réel le flux clinique de la journée.**

Ce n'est pas une app grand public de prise de RDV « façon Doctolib » : le cœur du produit est
l'**outil interne de la clinique** (back-office), avec une porte d'entrée patient plus légère.

---

## 2. Contexte & nature du projet

- **Type** : projet intégrateur académique (semestre Printemps 2026), mené comme un vrai produit.
- **Équipe** : 3 personnes, méthode agile (sprints, backlog Jira, GitHub).
- **Stack** : Angular 22 (standalone, Signals, Angular Material 3) · NestJS 11 · PostgreSQL · Docker.
- **État** : le MVP est **fonctionnel et déployable** — authentification, disponibilités, prise de RDV,
  flux du jour, gestion des utilisateurs. La refonte porte sur la **qualité perçue de l'interface**
  (aujourd'hui estimée ~6/10, objectif 10/10), pas sur la logique métier.

> ⚠️ **Périmètre du redesign** : on repense l'**habillage, la hiérarchie visuelle, les composants et les
> parcours**. On ne change pas le modèle de données ni les règles métier (décrites §7 et §8).

---

## 3. Problème résolu & proposition de valeur

### Le problème métier
Une clinique gère chaque jour des dizaines de rendez-vous répartis entre plusieurs médecins.
Sans outil unifié, c'est du papier, des tableurs, des doubles réservations, des créneaux perdus,
et aucune vision temps réel de « qui est arrivé / qui est en consultation / qui manque ».

### Ce que MediPlan apporte
| Douleur | Réponse MediPlan |
|---|---|
| Doubles réservations sur un même créneau | Verrou anti-double-booking (contrainte base + créneaux calculés) |
| Pas de vision du planning des médecins | Écran **Disponibilités** (plages datées + congés) |
| Prise de RDV lente au comptoir | **Modale de réservation** en 3 champs + patient léger |
| « Où en est-on aujourd'hui ? » | **Flux du jour** : file clinique avec statuts en direct |
| Comptes/rôles éparpillés | **Gestion des utilisateurs** centralisée avec rôles |

### Ce que MediPlan n'est PAS (anti-scope)
- Pas un dossier médical (aucune donnée clinique/santé stockée sur le patient — patient « léger »).
- Pas une facturation / paiement.
- Pas une messagerie patient-médecin.
- Pas une app mobile native (web responsive uniquement).

---

## 4. Utilisateurs cibles (personas & rôles)

L'application repose sur **4 rôles** (RBAC). Le rôle détermine ce qui est visible et faisant.

### 4.1 Personnel d'accueil / Administrateur de clinique — `clinic_admin` ⭐ persona principal
- **Qui** : la réceptionniste / gestionnaire de la clinique. Utilisatrice **quotidienne et intensive**.
- **Contexte** : au comptoir, souvent pressée, plusieurs patients en attente, téléphone qui sonne.
- **Objectifs** : réserver un RDV en < 30 s, voir le flux du jour d'un coup d'œil, gérer les comptes.
- **Frustrations à éviter** : trop de clics, formulaires longs, informations noyées, latence.
- **Voit tout** : Tableau de bord, Disponibilités, Rendez-vous, Flux du jour, Utilisateurs.
- **C'est le rôle par défaut de la démo** (`admin.demo@mediplan.test`).

### 4.2 Médecin — `doctor`
- **Qui** : un praticien de la clinique.
- **Objectifs** : consulter/gérer ses disponibilités, suivre sa file de patients du jour.
- **Voit** : Tableau de bord, Disponibilités, Flux du jour. **Ne voit pas** : Rendez-vous (prise de RDV réception), Utilisateurs.

### 4.3 Patient — `patient`
- **Qui** : la personne soignée. Profil **léger** (nom, prénom, e-mail optionnel — pas de données santé).
- **Objectifs** : se créer un compte, se connecter, voir son tableau de bord.
- **Voit** : Tableau de bord uniquement (parcours patient encore minimal — opportunité de design).

### 4.4 Super-administrateur — `super_admin`
- **Qui** : administrateur transverse (multi-clinique potentiellement).
- **Voit** : tout, comme `clinic_admin`, sans restriction de périmètre `clinic_id`.

> **Priorité de design** : optimiser d'abord l'expérience du **`clinic_admin`** (usage le plus intense),
> puis le **`doctor`**, puis fluidifier l'entrée **`patient`**.

---

## 5. Objectifs du redesign & critères de succès

### Objectifs
1. **Faire passer la qualité perçue de ~6/10 à 10/10** : rendu pro, cohérent, « produit fini ».
2. **Clarifier la hiérarchie visuelle** : que l'action principale de chaque écran saute aux yeux.
3. **Fiabiliser les composants récurrents** : tableaux, barres de recherche, badges de statut, états vides.
4. **Renforcer l'identité** « bleu clinique » : sérieux médical + modernité, sans froideur.
5. **Excellence responsive & sombre** : desktop, mobile et dark mode également soignés.

### Critères de succès (mesurables)
- Une action clé (réserver, ajouter une dispo) réalisable en **≤ 3 interactions** visibles.
- **0 élément « cassé »** à l'écran (ex. l'icône de recherche actuelle, cf. §11).
- Cohérence : mêmes composants = même apparence partout (statuts, cartes, tableaux).
- Accessibilité **WCAG AA** conservée (contrastes, focus visible, cibles ≥ 44px).
- Lisibilité immédiate des **états vides** (aujourd'hui trop neutres, cf. §9 et §11).

---

## 6. Ton, personnalité & direction artistique souhaités

- **Registre** : médical, fiable, calme, précis. Ni ludique ni « startup flashy », ni austère/hospitalier.
- **Mots-clés** : clinique, clair, structuré, rassurant, efficace.
- **Direction couleur actuelle** (à conserver / sublimer) : **bleu clinique** primaire + **teal** en accent.
- **Densité** : équilibrée — assez d'air pour respirer, assez dense pour un usage pro répété.
- **Inspirations utiles** : outils SaaS santé/admin modernes (Linear pour la rigueur, interfaces
  hospitalières récentes pour le sérieux), Material 3 comme socle (le projet est bâti dessus).

---

## 7. Périmètre fonctionnel (fonctionnalités livrées)

### F1 — Authentification & comptes
- Connexion (e-mail + mot de passe), inscription patient, mot de passe oublié.
- Sécurité : mots de passe hachés (bcrypt), session JWT, verrouillage après échecs répétés.
- Écrans : `01-login`, `02-register`, `03-forgot-password`.

### F2 — Tableau de bord
- Accueil personnalisé (« Bonjour, {prénom} » + badge rôle).
- KPIs : RDV du jour, Médecins actifs, Taux de remplissage *(certains encore « bientôt »)*.
- Blocs : Prochain rendez-vous, Accès rapides, Mon compte.
- Écran : `04-dashboard` (+ `12-dark-dashboard`, `17-mobile-dashboard`).

### F3 — Disponibilités
- Planification de **plages datées réservables** par médecin (jour, heure début/fin, durée de créneau).
- Gestion des **congés** (indisponibilités).
- Options avancées (type, durée, note). Table groupée par médecin, avec recherche.
- Écran : `05-disponibilites` (+ `13-dark-disponibilites`).

### F4 — Prise de rendez-vous (réception)
- **Modale de réservation** : sélection Médecin → Disponibilité → Créneau, puis patient léger (prénom, nom, e-mail optionnel) + motif optionnel.
- Accessible via CTA topbar « Nouveau rendez-vous » et bouton « Ajouter un rendez-vous » sur l'écran Rendez-vous.
- Anti-double-booking garanti côté serveur.
- Écrans : `09-modale-prise-rdv`, `10-modale-select-medecin`.

### F5 — Historique & liste des rendez-vous
- Table : Date, Patient, Médecin, **Statut**, Motif. Recherche intégrée.
- Écran : `06-rendez-vous` (+ `14-dark-rendez-vous`).

### F6 — Flux clinique du jour
- File des RDV du jour avec **suivi de statut en direct** (arrivé, en consultation, terminé, absent…).
- État vide soigné quand aucun RDV n'est prévu.
- Écran : `07-flux-du-jour` (+ `15-dark-flux-du-jour`, `19-mobile-flux-du-jour`).

### F7 — Gestion des utilisateurs
- Table des comptes (Nom, E-mail, **Rôle**, **Statut actif**) + recherche + pagination.
- Écran : `08-utilisateurs` (+ `16-dark-utilisateurs`).

### F8 — Chrome applicatif (transverse)
- **Topbar** : burger, wordmark MediPlan, CTA « Nouveau rendez-vous » (admins), bascule thème clair/sombre, menu utilisateur.
- **Sidenav** : navigation principale filtrée par rôle (item actif en « pilule » avec liseré teal).
- **Thème clair/sombre** complet. **Responsive** (sidenav overlay < 960px).
- Écrans : `11-menu-utilisateur`, `18-mobile-menu-ouvert`, `20-mobile-login`.

---

## 8. Modèle de données (simplifié, pour comprendre les états à designer)

> Utile au designer pour anticiper tous les **états d'un écran** (vide, plein, partiel, erreur).

- **Utilisateur** : `id`, `email`, `firstName?`, `lastName?`, `role` (patient|doctor|clinic_admin|super_admin), `clinicId?`, `isActive`, `createdAt`.
  - Le nom affiché tombe sur la partie locale de l'e-mail si prénom/nom absents (fréquent chez les patients).
- **Disponibilité (plage)** : médecin, date(s), heure début/fin, durée de créneau, **type** (disponible | congé), note optionnelle.
- **Rendez-vous** : date + créneau horaire, médecin, **patient léger** (prénom, nom, e-mail optionnel), motif optionnel, **statut**.
- **Clinique** : périmètre de rattachement (scoping `clinic_id` pour le RBAC).

### 8.1 Statuts de rendez-vous (à traiter comme un système de badges cohérent)
| Statut | Sens | Couleur sémantique actuelle |
|---|---|---|
| **Réservé** | RDV planifié, à venir | neutre / primaire |
| **Arrivé** | Patient présent en salle d'attente | info |
| **En consultation** | Patient avec le médecin | accent / en cours |
| **Terminé** | Consultation finie | succès (vert) |
| **Absent** | No-show | avertissement (ambre) |
| **Annulé** | RDV annulé (motif possible) | erreur / atténué |

### 8.2 Types de disponibilité
| Type | Sens | Couleur |
|---|---|---|
| **Disponible** | Plage réservable | succès (vert soft) |
| **Congé** | Indisponibilité | avertissement (ambre soft) |

> 🎯 **Attente designer** : proposer un **système de statuts unifié** (forme, couleur, icône optionnelle)
> réutilisable sur RDV, disponibilités et gestion des comptes (Actif/Inactif).

---

## 9. Architecture de l'information & navigation

### Navigation principale (sidenav) et visibilité par rôle
| Item | Route | patient | doctor | clinic_admin | super_admin |
|---|---|:--:|:--:|:--:|:--:|
| Tableau de bord | `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| Disponibilités | `/availabilities` | — | ✅ | ✅ | ✅ |
| Rendez-vous | `/appointments` | — | — | ✅ | ✅ |
| Flux du jour | `/clinic-flow/today` | — | ✅ | ✅ | ✅ |
| Utilisateurs | `/admin/users` | — | — | ✅ | ✅ |

- Le CTA topbar **« Nouveau rendez-vous »** n'apparaît que pour `clinic_admin` / `super_admin`.
- Principe : **on n'affiche jamais une fonctionnalité non développée** ; un item « bientôt » désactivé est possible mais évité.

### Parcours clés à soigner (user flows)
1. **Réserver un RDV (accueil)** : Topbar → CTA → modale (Médecin → Dispo → Créneau → Patient) → confirmation → retour liste.
2. **Ouvrir une disponibilité (médecin/admin)** : Disponibilités → formulaire (médecin, dates, heures) → Ajouter → apparaît dans la table groupée.
3. **Suivre la journée (accueil/médecin)** : Flux du jour → faire avancer les statuts des patients.
4. **Créer un compte patient** : Register → connexion → Tableau de bord.

---

## 10. Design system existant (matière première à réutiliser)

> Le projet possède déjà un **design system tokenisé** (`--mp-*`) en source unique de vérité,
> ponté vers Material 3. Le·la designer peut **s'appuyer dessus et le faire évoluer**, pas repartir de zéro.

### 10.1 Couleurs — mode clair
| Rôle | Token | Valeur |
|---|---|---|
| Primaire (bleu clinique) | `--mp-color-primary` | `#1e5fa8` |
| Primaire hover | `--mp-color-primary-hover` | `#17518f` |
| Conteneur primaire | `--mp-color-primary-container` | `#e8f0fb` |
| Accent (teal décoratif) | `--mp-color-accent` | `#16a6a6` |
| Accent signifiant (AA) | `--mp-color-accent-ink` | `#0f766e` |
| Accent soft | `--mp-color-accent-soft` | `#def3f3` |
| Fond de page | `--mp-color-background` | `#f6f8fb` |
| Surface (cartes/toolbar) | `--mp-color-surface` | `#ffffff` |
| Surface variante | `--mp-color-surface-variant` | `#f1f5f9` |
| Texte principal | `--mp-color-text` | `#1a2233` |
| Texte secondaire | `--mp-color-text-secondary` | `#4a5568` |
| Texte désactivé | `--mp-color-text-disabled` | `#6b7280` |
| Bordure | `--mp-color-border` | `#e7ecf3` |
| Succès | `--mp-color-success` | `#15803d` |
| Avertissement | `--mp-color-warning` | `#b45309` |
| Erreur | `--mp-color-error` | `#c62828` |

### 10.2 Couleurs — mode sombre (navy)
| Rôle | Valeur |
|---|---|
| Primaire | `#5b9be8` · hover `#7db2ef` · conteneur `#1e3149` |
| Accent | `#3fc9b7` · signifiant `#5fded0` · soft `#123b38` |
| Fond | `#0f1722` · surface `#172234` · surface variante `#1f2b3e` |
| Texte | principal `#e6eaf2` · secondaire `#a9b4c6` · désactivé `#7e8aa0` |
| Bordure | `#2a384f` |
| Succès `#5dd27a` · Avertissement `#e0a23c` · Erreur `#f0707a` | |

### 10.3 Typographie
- **Famille** : `Inter` (auto-hébergée), repli `Roboto` / system-ui.
- **Display** : 32px / 40px, poids 700, letter-spacing −0.5px.
- **Titre** : 22px / 30px, poids 600, letter-spacing −0.2px.
- **KPI** : 34px / 40px, poids 700 (valeurs de cartes du dashboard).
- Chiffres tabulaires (`.mp-tnum`) pour heures, dates, compteurs.

### 10.4 Espacement (échelle 4px)
`4 · 8 · 12 · 16 · 24 · 32 · 48` px (tokens `--mp-space-1` → `--mp-space-8`).

### 10.5 Rayons
`sm 4px · md 8px · lg 12px · full 9999px` (pilules/badges).

### 10.6 Élévations (sobres, opacité ≤ ~14 %, registre médical)
`elevation-1` (cartes) → `elevation-3` (modales), + `elevation-hover` pour les cartes interactives.

### 10.7 Motion
Durées sobres : `fast 120ms · base 180ms · slow 240ms`, courbe `cubic-bezier(0.2,0,0,1)`, **pas de bounce**,
`prefers-reduced-motion` respecté.

---

## 11. Diagnostic de l'existant — axes d'amélioration (audit 6→10)

> Constats issus du parcours complet de l'app (cf. captures). À traiter dans la refonte.

### 🔴 Problèmes prioritaires
1. **Icône de recherche cassée visuellement** : dans les barres « Rechercher » (Utilisateurs, RDV,
   Disponibilités), le glyphe `search` apparaît comme un petit artefact difforme (taille/couleur inadaptées).
   → Repenser le champ de recherche (icône nette ~20px, couleur affirmée, conteneur resserré).
2. **KPIs « bientôt » sur le tableau de bord** : « Médecins actifs » et « Taux de remplissage » sont des
   placeholders vides. → Soit les rendre réels, soit les redessiner en états « à venir » assumés (pas des trous).
3. **États vides trop neutres / contradictoires** : le dashboard peut afficher « La prise de rendez-vous
   arrive bientôt » alors que la réservation existe déjà. → Messages d'état vides cohérents, engageants,
   avec une action claire (ex. « Réserver le premier rendez-vous »).

### 🟠 Améliorations de fond
4. **Hiérarchie des tableaux** : lignes, en-têtes et zones d'action manquent de rythme ; densité à calibrer,
   colonnes à prioriser, actions de ligne à rendre évidentes (aujourd'hui discrètes).
5. **Système de statuts** : les badges (Réservé, Annulé, Absent…) doivent former un langage visuel unique
   et lisible d'un coup d'œil (couleur + éventuellement icône), y compris en sombre.
6. **Responsive des tableaux** : sur mobile, prévoir un basculement en **cartes** lisibles plutôt qu'un
   tableau qui déborde.
7. **Densité & respiration de la topbar / sidenav** : équilibre wordmark / CTA / actions à affiner
   (la barre a déjà été rehaussée à 72px — valider la proportion).

### 🟡 Finitions
8. **Tooltips** sur les boutons-icônes (actions de ligne, bascule thème).
9. **Colonnes triables** sur les tables (RDV, Utilisateurs).
10. **Micro-états** : hover, focus visible homogène, chargement (skeletons déjà tokenisés via `--mp-motion-shimmer`).

---

## 12. Contraintes techniques (cadre pour le design)

- **Socle** : Angular **Material 3** — les composants (form-field, table, dialog, menu, list) existent déjà
  et sont thémés via les tokens `--mp-*`. Le design doit rester **implémentable avec Material** (ou justifier un composant custom léger).
- **Thème clair ET sombre** obligatoires, tokenisés (toute nouvelle couleur = un token clair + un token sombre).
- **Responsive** : desktop (≥ 960px, sidenav `side`) et mobile (< 960px, sidenav `overlay`). Cibles tactiles ≥ 44px.
- **Accessibilité WCAG AA** : contrastes vérifiés, focus visible (anneau teal 3px), aria-labels, skip link.
- **Langue** : **français** intégral (libellés, accents corrects, statuts).
- **Sobriété d'animation** : ≤ 240ms, pas d'effets tape-à-l'œil, `prefers-reduced-motion` respecté.

---

## 13. Livrables attendus du·de la designer

1. **Direction visuelle** (1–2 pistes) : moodboard, application de la palette bleu/teal, typographie.
2. **Design system affiné** : boutons, champs (dont recherche), badges de statut, cartes, tableaux, états vides, modale — en clair et sombre.
3. **Maquettes des écrans clés** (desktop + mobile) :
   Login, Tableau de bord, Disponibilités, Rendez-vous, Flux du jour, Utilisateurs, Modale de réservation.
4. **Spécifications d'états** : vide / chargement / plein / erreur pour chaque écran à données.
5. **Guide d'implémentation** : mapping vers les composants Material et les tokens `--mp-*` existants.

---

## 14. Références & annexes

- **Captures de l'existant** : [`../../captures/`](../../../captures/) — 20 écrans numérotés (clair, sombre, mobile).
- **Design system technique** : `apps/frontend/src/styles/_theme.scss` (source unique des tokens).
- **Navigation & RBAC** : `apps/frontend/src/app/core/layout/nav-items.ts`.
- **Comptes de démo** :
  - Admin clinique : `admin.demo@mediplan.test` / `Adm1n!Secret`
  - Médecins : `doctor.demo@mediplan.test`, `doctor2.demo@mediplan.test`
- **Lancer l'app en local** : backend `pnpm --filter backend dev` (port 3100) · frontend `pnpm --filter frontend exec ng serve --port 4201` · Postgres via `docker start mediplan-postgres`.

---

### Index rapide des captures

| # | Fichier | Écran / état |
|---|---|---|
| 01 | `01-login.png` | Connexion |
| 02 | `02-register.png` | Inscription patient |
| 03 | `03-forgot-password.png` | Mot de passe oublié |
| 04 | `04-dashboard.png` | Tableau de bord (admin) |
| 05 | `05-disponibilites.png` | Disponibilités (peuplé) |
| 06 | `06-rendez-vous.png` | Historique RDV (tous statuts) |
| 07 | `07-flux-du-jour.png` | Flux du jour (état vide) |
| 08 | `08-utilisateurs.png` | Utilisateurs (table + pagination) |
| 09 | `09-modale-prise-rdv.png` | Modale « Réserver un rendez-vous » |
| 10 | `10-modale-select-medecin.png` | Modale — sélecteur Médecin |
| 11 | `11-menu-utilisateur.png` | Menu utilisateur ouvert |
| 12–16 | `1x-dark-*.png` | Dashboard / Dispo / RDV / Flux / Users **en sombre** |
| 17 | `17-mobile-dashboard.png` | Dashboard mobile |
| 18 | `18-mobile-menu-ouvert.png` | Sidenav mobile ouvert |
| 19 | `19-mobile-flux-du-jour.png` | Flux du jour mobile |
| 20 | `20-mobile-login.png` | Connexion mobile |
