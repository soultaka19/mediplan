# Diagramme de classes — Domaine MediPlan

```mermaid
classDiagram
    direction LR

    class User {
        +UUID id
        +string email
        +string passwordHash
        +string firstName
        +string lastName
        +Role role
        +bool isActive
        +int failedLoginAttempts
        +datetime lockedUntil
        +datetime createdAt
        +login()
        +logout()
        +resetPassword()
    }

    class Role {
        <<enumeration>>
        PATIENT
        DOCTOR
        CLINIC_ADMIN
        SUPER_ADMIN
    }

    class Patient {
        +string phone
        +date birthDate
        +bookAppointment()
        +cancelAppointment()
    }

    class Doctor {
        +string licenseNumber
        +manageAvailability()
        +updateAppointmentStatus()
    }

    class ClinicAdmin {
        +manageUsers()
        +viewStatistics()
    }

    class SuperAdmin {
        +configureClinic()
        +assignRoles()
    }

    class Clinic {
        +UUID id
        +string name
        +string address
        +Time openingHour
        +Time closingHour
        +bool isActive
        +activate()
        +deactivate()
    }

    class Specialty {
        +UUID id
        +string name
        +string description
    }

    class Availability {
        +UUID id
        +RecurrenceType type
        +int weekday
        +Time startTime
        +Time endTime
        +date validFrom
        +date validTo
        +generateSlots()
    }

    class AppointmentSlot {
        +UUID id
        +datetime startAt
        +datetime endAt
        +bool isBooked
    }

    class Appointment {
        +UUID id
        +AppointmentStatus status
        +string reason
        +string cancellationReason
        +datetime createdAt
        +confirm()
        +cancel()
        +reschedule()
    }

    class AppointmentStatus {
        <<enumeration>>
        RESERVED
        ARRIVED
        IN_CONSULTATION
        DONE
        ABSENT
        CANCELLED
    }

    class Notification {
        +UUID id
        +NotificationType type
        +string message
        +bool isRead
        +datetime createdAt
        +markAsRead()
    }

    class AuditLog {
        +UUID id
        +string action
        +UUID actorId
        +datetime timestamp
        +json metadata
    }

    User <|-- Patient
    User <|-- Doctor
    User <|-- ClinicAdmin
    User <|-- SuperAdmin
    User --> Role

    Clinic "1" o-- "0..*" Doctor : emploie
    Clinic "1" o-- "0..*" ClinicAdmin : gère
    Clinic "1" o-- "0..*" Specialty : propose
    Doctor "0..*" --> "1..*" Specialty : possède

    Doctor "1" o-- "0..*" Availability : définit
    Availability "1" --> "0..*" AppointmentSlot : génère
    Doctor "1" --> "0..*" AppointmentSlot : offre

    Patient "1" --> "0..*" Appointment : réserve
    AppointmentSlot "1" --> "0..1" Appointment : occupe
    Appointment --> AppointmentStatus
    Doctor "1" --> "0..*" Appointment : assure

    Appointment "1" --> "0..*" Notification : déclenche
    User "1" --> "0..*" Notification : reçoit
    User "1" --> "0..*" AuditLog : trace
```

## Explication

Ce diagramme de classes modélise le **domaine métier** de MediPlan et constitue la base du schéma
relationnel PostgreSQL (objectif OP-04, 3ᵉ forme normale).

- **Héritage des rôles** : la classe abstraite `User` centralise l'identité et l'authentification
  (email, hash du mot de passe, verrouillage). Les quatre rôles (`Patient`, `Doctor`,
  `ClinicAdmin`, `SuperAdmin`) en héritent, ce qui reflète le modèle RBAC (EF-09). L'énumération
  `Role` matérialise le contrôle d'accès.
- **Organisation des cliniques** : une `Clinic` agrège ses médecins, administrateurs et
  spécialités. Le rattachement à une clinique porte le cloisonnement des données (`clinic_id`,
  objectif OM-05).
- **Disponibilités et créneaux** : un `Doctor` définit des `Availability` (récurrentes ou
  ponctuelles) qui **génèrent** des `AppointmentSlot` réservables — c'est le module à risque R-02.
- **Rendez-vous** : un `Appointment` occupe **au plus un** `AppointmentSlot` (relation 0..1
  garantissant l'unicité, donc l'absence de double réservation — OM-04, ENF-PERF-05). Son cycle
  de vie est porté par l'énumération `AppointmentStatus` (réservé → arrivé → en consultation →
  terminé / absent / annulé), utilisée par le flux clinique du jour (EF-06).
- **Notifications et audit** : `Notification` matérialise les notifications internes (EF-07) et
  `AuditLog` la journalisation des actions sensibles exigée par la sécurité (§3.3).

**Lien avec le projet** : ce diagramme guide directement la conception des entités TypeORM/Prisma
et des migrations PostgreSQL (Phase 2). La contrainte d'unicité `AppointmentSlot → Appointment`
sera traduite en contrainte d'unicité en base, pilier de la fiabilité des réservations.
