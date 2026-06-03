# Diagramme entité-association (MCD / ERD) — Base PostgreSQL

```mermaid
erDiagram
    USER ||--o{ NOTIFICATION : reçoit
    USER ||--o{ AUDIT_LOG : génère
    CLINIC ||--o{ USER : rattache
    CLINIC ||--o{ SPECIALTY : propose
    CLINIC ||--o{ DOCTOR_SPECIALTY : "offre via"
    USER ||--o{ AVAILABILITY : "définit (médecin)"
    USER ||--o{ DOCTOR_SPECIALTY : "possède (médecin)"
    SPECIALTY ||--o{ DOCTOR_SPECIALTY : classe
    AVAILABILITY ||--o{ APPOINTMENT_SLOT : génère
    USER ||--o{ APPOINTMENT_SLOT : "offre (médecin)"
    APPOINTMENT_SLOT ||--o| APPOINTMENT : occupe
    USER ||--o{ APPOINTMENT : "réserve (patient)"
    APPOINTMENT ||--o{ NOTIFICATION : déclenche

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum role
        uuid clinic_id FK
        bool is_active
        int failed_login_attempts
        timestamp locked_until
        timestamp created_at
    }
    CLINIC {
        uuid id PK
        string name
        string address
        time opening_hour
        time closing_hour
        bool is_active
    }
    SPECIALTY {
        uuid id PK
        uuid clinic_id FK
        string name
        string description
    }
    DOCTOR_SPECIALTY {
        uuid doctor_id FK
        uuid specialty_id FK
    }
    AVAILABILITY {
        uuid id PK
        uuid doctor_id FK
        enum recurrence_type
        int weekday
        time start_time
        time end_time
        date valid_from
        date valid_to
    }
    APPOINTMENT_SLOT {
        uuid id PK
        uuid availability_id FK
        uuid doctor_id FK
        timestamp start_at
        timestamp end_at
        bool is_booked
    }
    APPOINTMENT {
        uuid id PK
        uuid slot_id FK "unique"
        uuid patient_id FK
        uuid doctor_id FK
        enum status
        string reason
        string cancellation_reason
        timestamp created_at
    }
    NOTIFICATION {
        uuid id PK
        uuid user_id FK
        uuid appointment_id FK
        enum type
        string message
        bool is_read
        timestamp created_at
    }
    AUDIT_LOG {
        uuid id PK
        uuid actor_id FK
        string action
        jsonb metadata
        timestamp created_at
    }
```

## Explication

Ce diagramme entité-association traduit le [diagramme de classes](../classes/diagramme-classes.md)
en **modèle relationnel** prêt pour PostgreSQL (objectif OP-04, 3ᵉ forme normale). Quelques
choix de conception notables :

- **Cloisonnement multi-cliniques** : la colonne `clinic_id` sur `USER` et `SPECIALTY` porte la
  séparation logique des données entre cliniques (OM-05), filtrée systématiquement côté API.
- **Relation many-to-many** : `DOCTOR_SPECIALTY` est une table d'association entre médecins et
  spécialités, conforme à la normalisation.
- **Unicité de réservation** : la clé étrangère `slot_id` sur `APPOINTMENT` est marquée **unique
  (UK)** : un créneau ne peut être lié qu'à un seul rendez-vous actif, ce qui empêche toute
  double réservation au niveau du stockage (OM-04, ENF-PERF-05).
- **Index** : des index sont prévus sur les colonnes de recherche fréquente (`clinic_id`,
  `doctor_id`, `start_at`) pour respecter les exigences de performance (ENF-PERF-01 à 03).

**Lien avec le projet** : ce modèle est la cible des migrations versionnées de l'ORM
(TypeORM/Prisma) en Phase 2. Il complète les livrables UML attendus (LIV-06) et constitue le
support du livrable LIV-03 (schéma PostgreSQL versionné).
