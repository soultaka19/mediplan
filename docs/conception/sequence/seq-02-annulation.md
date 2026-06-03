# Diagramme de séquence 2 — Annuler ou modifier un rendez-vous

**Scénario** : SC-02 — **Fonctionnalité** : EF-05

```mermaid
sequenceDiagram
    actor P as Patient
    participant FE as Frontend Angular
    participant API as API NestJS
    participant DB as PostgreSQL

    P->>FE: Ouvre la fiche du rendez-vous
    FE->>API: GET /appointments/{id}
    API->>DB: SELECT appointment
    DB-->>API: Détails du rendez-vous
    API-->>FE: 200 OK
    FE-->>P: Affiche la fiche

    P->>FE: Choisit « Annuler » ou « Modifier »
    FE->>API: PATCH /appointments/{id} {action}
    API->>API: Vérifie JWT + rôle (Guard RBAC)
    API->>DB: SELECT règle de délai (ex. 24 h)
    DB-->>API: startAt du rendez-vous

    alt Délai respecté (> 24 h avant)
        API->>DB: UPDATE statut = CANCELLED / reschedule + libère le slot
        DB-->>API: OK (plage redevient disponible)
        API->>DB: INSERT notifications (parties concernées)
        API-->>FE: 200 OK
        FE-->>P: Confirmation (annulé / replanifié)
    else Délai dépassé
        API-->>FE: 403 Forbidden (délai dépassé)
        FE-->>P: « Contactez la clinique »
        note over API,DB: Seul un administrateur peut forcer<br/>l'annulation avec un motif obligatoire
    end
```

## Explication

Ce diagramme représente l'**annulation et la modification d'un rendez-vous** (SC-02). Après avoir
ouvert la fiche, le patient demande l'annulation ou la replanification. L'API applique alors la
**règle de délai minimum** (ex. 24 h) : si le délai est respecté, le statut passe à `CANCELLED`
ou `RESCHEDULED`, la **plage redevient disponible** et les parties sont notifiées. Si le délai
est dépassé, l'action est refusée (`403 Forbidden`) et seul un **administrateur** peut forcer
l'annulation avec un motif obligatoire — la variante d'escalade du scénario SC-02.

**Lien avec le projet** : ce flux complète le cycle de vie du rendez-vous (EF-05) et libère les
créneaux pour de nouvelles réservations, soutenant l'objectif OM-03 (réduction de la charge
administrative). La gestion fine des statuts s'appuie sur l'énumération `AppointmentStatus` du
[diagramme de classes](../classes/diagramme-classes.md).
