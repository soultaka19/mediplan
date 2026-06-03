# Cas d'utilisation 6 — Administration des cliniques

**Fonctionnalité** : EF-02 — **Scénario** : SC-04

```mermaid
flowchart LR
    Super(("🛠️ Super admin"))
    Admin(("🧑‍💼 Admin clinique"))

    subgraph Cli["Module Administration des cliniques"]
        direction TB
        UC1(["Créer une clinique"])
        UC2(["Configurer heures d'ouverture & spécialités"])
        UC3(["Activer / désactiver une clinique"])
        UC4(["Créer / rattacher des comptes admin & médecins"])
        UC5(["Attribuer les rôles (RBAC)"])
        UC6(["Gérer les utilisateurs de sa clinique"])
        UC7(["Consulter les journaux d'audit"])
    end

    Super --- UC1
    Super --- UC2
    Super --- UC3
    Super --- UC4
    Super --- UC5
    Super --- UC7

    Admin --- UC6

    UC1 -. include .-> UC2
    UC4 -. include .-> UC5
```

## Explication

Ce diagramme décrit la **configuration multi-cliniques** réservée au super administrateur
(EF-02, scénario SC-04). Celui-ci crée une clinique, configure ses heures d'ouverture et ses
spécialités, rattache les comptes administrateurs et médecins, et attribue automatiquement les
rôles RBAC (`include`). Une clinique peut être **désactivée sans être supprimée**, afin de
préserver l'historique. L'administrateur de clinique, lui, ne gère que les utilisateurs de **sa**
clinique, ce qui illustre le cloisonnement strict des données (séparation par `clinic_id`).

**Lien avec le projet** : ce module établit la **séparation logique des données entre cliniques**
(objectif OM-05) et le principe du moindre privilège (OM-06). Il conditionne la création des
jeux de données de démonstration utilisés dans les autres modules.
