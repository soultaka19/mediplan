# Diagramme de séquence 3 — Authentification (connexion JWT)

**Fonctionnalité** : EF-01 — **Sécurité** : §3.3 (OWASP, JWT, RBAC)

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant FE as Frontend Angular
    participant API as API NestJS
    participant DB as PostgreSQL

    U->>FE: Saisit email + mot de passe
    FE->>API: POST /auth/login {email, password}
    API->>DB: SELECT user WHERE email = …
    DB-->>API: Utilisateur (passwordHash, isActive, failedAttempts)

    alt Compte verrouillé
        API-->>FE: 423 Locked
        FE-->>U: « Compte temporairement verrouillé »
    else Identifiants valides
        API->>API: Vérifie le hash (Argon2id)
        API->>API: Génère access token (courte durée) + refresh token
        API->>DB: Enregistre le refresh token + AuditLog (connexion)
        API-->>FE: 200 OK {accessToken, refreshToken}
        FE->>FE: Stocke les jetons + active l'intercepteur HTTP
        FE-->>U: Redirige vers le tableau de bord du rôle
    else Identifiants invalides
        API->>DB: UPDATE failedLoginAttempts + 1
        API->>DB: INSERT AuditLog (échec)
        API-->>FE: 401 Unauthorized
        FE-->>U: « Identifiants incorrects »
    end

    note over FE,API: Requêtes suivantes : Authorization: Bearer accessToken<br/>→ Guard RBAC vérifie le rôle sur chaque endpoint protégé
```

## Explication

Ce diagramme décrit le **processus d'authentification** (EF-01) et la mise en place de la
sécurité par jetons. L'API vérifie le mot de passe via un **hachage Argon2id** (jamais en clair),
puis émet un **access token à courte durée de vie** et un **refresh token** conformément aux
recommandations OWASP du §3.3. Trois cas sont modélisés : compte verrouillé (`423`),
authentification réussie (génération des jetons + journalisation), et échec (incrément du
compteur de tentatives, qui déclenche le verrouillage après N essais — EF-01).

Une fois connecté, le frontend joint le jeton à chaque requête (`Authorization: Bearer`), et un
**Guard RBAC** côté NestJS vérifie le rôle sur chaque endpoint protégé (EF-09). Toute action
sensible est tracée dans `AuditLog`.

**Lien avec le projet** : l'authentification est un prérequis **Must** de toutes les autres
fonctionnalités et le socle de la stratégie de sécurité (objectifs OM-06, OP-03). C'est l'une des
premières Epics développées en Phase 2.
