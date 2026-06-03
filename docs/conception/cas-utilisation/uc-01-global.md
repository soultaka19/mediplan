# Cas d'utilisation 1 — Vue d'ensemble du système

```mermaid
flowchart LR
    Patient(("👤 Patient"))
    Medecin(("👨‍⚕️ Médecin"))
    Admin(("🧑‍💼 Admin clinique"))
    Super(("🛠️ Super admin"))

    subgraph MediPlan["Système MediPlan"]
        direction TB
        UC_Auth(["S'authentifier / gérer son compte"])
        UC_Resa(["Réserver / modifier / annuler un RDV"])
        UC_Agenda(["Consulter son agenda"])
        UC_Dispo(["Gérer les disponibilités"])
        UC_Flux(["Gérer le flux clinique du jour"])
        UC_Users(["Gérer utilisateurs & médecins"])
        UC_Stats(["Consulter les statistiques"])
        UC_Clinic(["Configurer les cliniques"])
        UC_Notif(["Recevoir des notifications"])
    end

    Patient --- UC_Auth
    Patient --- UC_Resa
    Patient --- UC_Notif

    Medecin --- UC_Auth
    Medecin --- UC_Agenda
    Medecin --- UC_Dispo
    Medecin --- UC_Flux
    Medecin --- UC_Notif

    Admin --- UC_Auth
    Admin --- UC_Users
    Admin --- UC_Dispo
    Admin --- UC_Flux
    Admin --- UC_Stats
    Admin --- UC_Resa

    Super --- UC_Auth
    Super --- UC_Clinic
    Super --- UC_Users
```

## Explication

Ce diagramme offre une **vue d'ensemble** des interactions entre les quatre acteurs et les
grandes fonctionnalités de MediPlan. Il montre comment les responsabilités se répartissent
selon le modèle RBAC : le patient se limite à la réservation et au suivi de ses rendez-vous ;
le médecin gère son agenda, ses disponibilités et le flux du jour ; l'administrateur de clinique
supervise les utilisateurs, les disponibilités et les statistiques de sa clinique ; le super
administrateur configure les cliniques.

**Lien avec le projet** : ce diagramme cadre l'ensemble du périmètre fonctionnel **Must** du
cahier des charges (EF-01 à EF-09) et sert de point d'entrée aux six diagrammes de cas
d'utilisation détaillés qui suivent. Il oriente le découpage en Epics du Sprint 1 et des sprints
suivants.
