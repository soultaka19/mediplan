# Cas d'utilisation 5 — Flux clinique du jour

**Fonctionnalité** : EF-06 — **Scénario** : SC-03

```mermaid
flowchart LR
    Medecin(("👨‍⚕️ Médecin"))
    Admin(("🧑‍💼 Admin clinique"))

    subgraph Flux["Module Flux clinique du jour"]
        direction TB
        UC1(["Ouvrir la vue du jour"])
        UC2(["Marquer un patient « arrivé »"])
        UC3(["Marquer « en consultation »"])
        UC4(["Marquer « terminé »"])
        UC5(["Marquer « absent » (no-show)"])
        UC6(["Décaler les RDV (action groupée)"])
        UC7(["Mettre à jour les statistiques temps réel"])
    end

    Medecin --- UC1
    Medecin --- UC2
    Medecin --- UC3
    Medecin --- UC4
    Medecin --- UC5

    Admin --- UC1
    Admin --- UC5
    Admin --- UC6

    UC2 -. include .-> UC7
    UC3 -. include .-> UC7
    UC4 -. include .-> UC7
    UC5 -. include .-> UC7
```

## Explication

Ce diagramme représente la **gestion du flux clinique du jour** (EF-06), c'est-à-dire le suivi
en temps réel de la file d'attente d'une clinique. Le médecin fait progresser chaque rendez-vous
à travers ses statuts (arrivé → en consultation → terminé, ou absent). L'administrateur peut, en
cas de retard, **décaler en bloc** les rendez-vous d'un médecin (action groupée du scénario
SC-03). Chaque changement de statut **met à jour les statistiques en temps réel** (`include`),
notamment le taux de no-show suivi dans les tableaux de bord.

**Lien avec le projet** : cette fonctionnalité **Must** matérialise l'objectif OM-02 (vue claire
de l'horaire du jour) et alimente l'objectif OM-07 (statistiques). Elle dépend du module de
rendez-vous et précède le module de statistiques (EF-08).
