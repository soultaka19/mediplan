# Cas d'utilisation 2 — Authentification et gestion des comptes

**Fonctionnalités** : EF-01 (Authentification et gestion des comptes), EF-09 (RBAC)

```mermaid
flowchart LR
    Patient(("👤 Patient"))
    Medecin(("👨‍⚕️ Médecin"))
    Admin(("🧑‍💼 Admin clinique"))
    Super(("🛠️ Super admin"))

    subgraph Auth["Module Authentification & Comptes"]
        direction TB
        UC1(["S'inscrire"])
        UC2(["Se connecter"])
        UC3(["Se déconnecter"])
        UC4(["Réinitialiser le mot de passe"])
        UC5(["Modifier son profil"])
        UC6(["Vérifier les permissions (RBAC)"])
        UC7(["Verrouiller le compte après N échecs"])
    end

    Patient --- UC1
    Patient --- UC2
    Patient --- UC3
    Patient --- UC4
    Patient --- UC5

    Medecin --- UC2
    Medecin --- UC5
    Admin --- UC2
    Admin --- UC5
    Super --- UC2

    UC2 -. include .-> UC6
    UC2 -. extend .-> UC7
```

## Explication

Ce diagramme représente le **module d'authentification et de gestion des comptes**, socle de
toute la sécurité applicative. Tout utilisateur peut se connecter, se déconnecter et gérer son
profil ; seul le patient peut **s'inscrire** librement (les autres comptes sont créés par un
administrateur ou un super administrateur). Deux relations UML sont mises en évidence : la
connexion **inclut** systématiquement une vérification des permissions RBAC (`include`), et elle
**peut être étendue** par un verrouillage temporaire du compte après plusieurs tentatives
échouées (`extend`), conformément aux exigences de sécurité OWASP du §3.3.

**Lien avec le Sprint 1** : l'authentification et le RBAC sont des fonctionnalités **Must**
(EF-01, EF-09) et un prérequis technique de toutes les autres ; elles constituent une des
premières Epics implémentées (Phase 2 — Développement backend).
