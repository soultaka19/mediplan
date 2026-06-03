# Introduction au dossier de conception

## Contexte

MediPlan est une plateforme web de gestion des rendez-vous médicaux destinée aux cliniques de
proximité, aux médecins, au personnel administratif et aux patients. Le projet répond à un
problème documenté : la fragmentation des outils de réservation (appels, papier, Excel) qui
engendre des doubles réservations, des rendez-vous manqués (« no-shows ») et une surcharge
administrative.

Ce dossier de conception correspond à la **Phase 1 — Analyse et conception** du cahier des
charges (Semaines 1 à 3). Il formalise, avant le développement, *qui* utilise le système, *quoi*
le système doit faire, *comment* les données sont structurées et *comment* les principaux
scénarios se déroulent dans l'architecture.

## Périmètre couvert par les diagrammes

Les diagrammes ci-dessous portent sur le cœur fonctionnel **Must** du projet et préparent le
Sprint 1 :

- l'authentification et la gestion des rôles (RBAC) — EF-01, EF-09 ;
- la gestion des cliniques, des médecins et des disponibilités — EF-02, EF-03, EF-04 ;
- la réservation, la modification et l'annulation de rendez-vous — EF-05 ;
- le flux clinique du jour — EF-06 ;
- les tableaux de bord et statistiques — EF-08.

Les éléments **exclus** du périmètre (dossier médical, prescriptions, paiement, application
mobile native, IA médicale, intégrations hospitalières externes) n'apparaissent volontairement
pas dans les diagrammes.

## Les quatre acteurs

| Acteur | Description | Persona du cahier des charges |
|--------|-------------|-------------------------------|
| **Patient** | Réserve, modifie ou annule ses rendez-vous | Marie, 34 ans |
| **Médecin** | Consulte son horaire, gère ses disponibilités et le flux du jour | Dr Tremblay, 52 ans |
| **Administrateur de clinique** | Supervise utilisateurs, médecins, disponibilités, statistiques | Sophie, 41 ans |
| **Super administrateur** | Configure les cliniques et la plateforme | Karim, 38 ans |

> Le modèle RBAC applique le principe du moindre privilège : un administrateur n'accède qu'aux
> données de **sa** clinique (cloisonnement par `clinic_id`).

## Architecture de référence (rappel)

Les diagrammes de séquence s'appuient sur l'architecture client-serveur en trois tiers du
cahier des charges (§3.2) :

```
Utilisateur (navigateur) → Frontend Angular (SPA) → API REST NestJS → PostgreSQL
```

Les trois services sont conteneurisés et orchestrés par Docker Compose.

## Méthode et outils

- **Notation** : UML (cas d'utilisation, classes, séquence) + modèle entité-association.
- **Outil** : Mermaid (diagrammes en texte, versionnés dans Git, rendus nativement par GitHub),
  avec export en images PNG.
- **Traçabilité** : chaque diagramme référence explicitement les identifiants du cahier des
  charges (EF-xx, SC-xx, OM-xx) afin d'assurer le lien avec les exigences.
