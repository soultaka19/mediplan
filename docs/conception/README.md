# Dossier de conception — MediPlan

**Sprint 1 — Phase 1 : Analyse et conception**
Collège La Cité — Projet intégrateur — Printemps 2026

Ce dossier regroupe les diagrammes UML et les explications écrites produits lors de la phase
d'analyse et de conception du projet MediPlan. Le type de solution étant une **application web**,
les diagrammes attendus sont : **cas d'utilisation + classes + séquence**, complétés ici par un
diagramme **entité-association** (ERD) en appui de la base de données PostgreSQL.

> Tous les diagrammes sont écrits en [Mermaid](https://mermaid.js.org/) : ils s'affichent
> directement dans GitHub et sont aussi exportés en images dans [`images/`](images/).

## Table des matières

### 0. Introduction
- [Introduction, contexte et périmètre](00-introduction.md)

### 1. Diagrammes de cas d'utilisation (≥ 5)
| # | Diagramme | Fonctionnalités / scénarios |
|---|-----------|------------------------------|
| 1 | [Vue d'ensemble du système](cas-utilisation/uc-01-global.md) | Tous les acteurs |
| 2 | [Authentification & gestion des comptes](cas-utilisation/uc-02-authentification.md) | EF-01, EF-09 |
| 3 | [Réservation, modification, annulation de RDV](cas-utilisation/uc-03-reservation-rdv.md) | EF-05 · SC-01 · SC-02 |
| 4 | [Gestion des médecins et des disponibilités](cas-utilisation/uc-04-disponibilites.md) | EF-03, EF-04 |
| 5 | [Flux clinique du jour](cas-utilisation/uc-05-flux-clinique.md) | EF-06 · SC-03 |
| 6 | [Administration des cliniques](cas-utilisation/uc-06-administration.md) | EF-02 · SC-04 |
| 7 | [Tableaux de bord et statistiques](cas-utilisation/uc-07-statistiques.md) | EF-08 · SC-05 |

### 2. Diagramme de classes
- [Diagramme de classes du domaine](classes/diagramme-classes.md)

### 3. Diagrammes de séquence
| # | Diagramme | Scénario |
|---|-----------|----------|
| 1 | [Réserver un rendez-vous](sequence/seq-01-reservation.md) | SC-01 (EF-05) |
| 2 | [Annuler ou modifier un rendez-vous](sequence/seq-02-annulation.md) | SC-02 (EF-05) |
| 3 | [Authentification (connexion JWT)](sequence/seq-03-authentification.md) | EF-01 |

### 4. Diagramme entité-association (bonus)
- [MCD / ERD de la base PostgreSQL](erd/mcd-erd.md)

## Correspondance avec le cahier des charges

| Élément du cahier des charges | Couverture dans ce dossier |
|-------------------------------|----------------------------|
| Fonctionnalités EF-01 à EF-09 | Diagrammes de cas d'utilisation 1 à 7 |
| Scénarios SC-01 à SC-05 | Cas d'utilisation + séquences |
| Architecture client-serveur 3 tiers (§3.2) | Diagrammes de séquence (Frontend → API → BDD) |
| Modèle de données relationnel (§3.2, OP-04) | Diagramme de classes + ERD |
| Contrôle anti-double-réservation (OM-04, ENF-PERF-05) | Séquence de réservation |
| Sécurité / RBAC / JWT (§3.3) | Séquence d'authentification |

## Auteurs

Équipe MediPlan — Souleymane DIALLO _(et coéquipiers)_.
