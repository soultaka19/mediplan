# Cas d'utilisation 3 — Réservation, modification et annulation de rendez-vous

**Fonctionnalité** : EF-05 — **Scénarios** : SC-01, SC-02

```mermaid
flowchart LR
    Patient(("👤 Patient"))
    Admin(("🧑‍💼 Admin clinique"))

    subgraph Resa["Module Rendez-vous"]
        direction TB
        UC1(["Rechercher par spécialité / médecin"])
        UC2(["Consulter les plages disponibles"])
        UC3(["Réserver un rendez-vous"])
        UC4(["Modifier / replanifier un rendez-vous"])
        UC5(["Annuler un rendez-vous"])
        UC6(["Vérifier l'unicité de la plage"])
        UC7(["Contrôler le délai minimum d'annulation"])
        UC8(["Forcer l'annulation avec motif"])
    end

    Patient --- UC1
    Patient --- UC2
    Patient --- UC3
    Patient --- UC4
    Patient --- UC5

    Admin --- UC3
    Admin --- UC4
    Admin --- UC5
    Admin --- UC8

    UC3 -. include .-> UC6
    UC4 -. include .-> UC7
    UC5 -. include .-> UC7
    UC8 -. extend .-> UC5
```

## Explication

Ce diagramme détaille le **cœur métier de MediPlan** : la réservation, la modification et
l'annulation de rendez-vous (EF-05). Le patient recherche une plage par spécialité ou médecin,
la réserve, puis peut la modifier ou l'annuler. Deux contrôles critiques sont modélisés en
`include` : la **vérification d'unicité de la plage** (qui garantit l'objectif OM-04 « éviter
les doubles réservations ») et le **contrôle du délai minimum d'annulation** (ex. 24 h). Lorsque
ce délai est dépassé, seul l'administrateur peut **forcer l'annulation** avec un motif (`extend`),
en agissant au nom du patient — ce qui illustre le scénario SC-02.

**Lien avec le projet** : il s'agit de la fonctionnalité la plus prioritaire et la plus risquée
(risque R-02 du cahier des charges). Le détail du flux de réservation est approfondi dans le
[diagramme de séquence SEQ-01](../sequence/seq-01-reservation.md).
