# MediPlan

**Medical appointment scheduling platform for small and mid-sized clinics.**
Capstone project — Computer Programming, Collège La Cité, Spring 2026.

> 🇫🇷 La version française d'origine (livrables académiques, guide d'utilisation, dossier de conception) est conservée dans [`README.fr.md`](README.fr.md).

**Live application:** https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io
_First request takes 10–15 s: both containers are scaled to zero and need to wake up._

| Role      | Email                        | Password         |
| --------- | ---------------------------- | ---------------- |
| Reception | `admin.demo@mediplan.test`   | `Adm1n!Secret`   |
| Doctor    | `doctor.demo@mediplan.test`  | `Doct0r!Secret`  |
| Patient   | `patient.demo@mediplan.test` | `Pat1ent!Secret` |

Demonstration accounts, **entirely fictional data**. No real patient information is handled by the platform.

## Overview

MediPlan replaces the heterogeneous tools a small clinic typically runs on — phone calls, paper agendas, spreadsheets — with a single shared calendar used by the reception desk, the doctors and the patients themselves. It is a four-role, multi-clinic web application: availabilities generate bookable slots, appointments move through a day-flow workflow, and every query is scoped to the caller's clinic **on the server**, not in the UI.

## Problem

Small clinics coordinate appointments across tools that do not talk to each other. The reception desk holds the authoritative agenda; doctors do not see their own day without asking; patients cannot book anything themselves; and nothing prevents the same slot from being sold twice when two people write at the same time. Cancellations are verbal, so the freed slot is rarely reused, and there is no measurement of no-shows or occupancy.

## Solution

One PostgreSQL-backed application where:

- a doctor's **availability window** automatically materialises into individual slots of a configurable duration;
- the **reception desk** books on behalf of a caller, and a **patient** books the same slots in self-service — both paths go through the _same_ transaction, the _same_ pessimistic lock and the _same_ partial unique index, so the anti-double-booking guarantee does not depend on the channel;
- the **day flow** tracks each appointment through Booked → Arrived → In consultation → Completed, with cancellation requiring a reason (which is what makes the slot reusable);
- **statistics** (volume, no-show rate, occupancy) and a **CSV export** turn the agenda into something a clinic manager can act on.

## Key Features

- Authentication: registration, JWT login, bcrypt hashing (cost 12), account lockout after repeated failures, password reset by single-use hashed token
- Four roles — super administrator, clinic administrator, doctor, patient — with server-enforced clinic scoping
- Doctor availability windows with automatic slot generation
- Reception booking and patient self-service booking, both concurrency-safe
- Day flow with status transitions and mandatory cancellation reason
- Notifications, statistics dashboard (volume, no-show, occupancy), CSV export
- Public clinic directory, dark mode, responsive Angular Material 3 interface
- Idempotent demonstration dataset (`pnpm --filter backend seed:demo`)

## My Role

Team of three (Souleymane Diallo, Zakaria Lahouiri, Larbi Saib). My scope, traced commit by commit in [`docs/presentation/CONTRIBUTIONS.md`](docs/presentation/CONTRIBUTIONS.md): project lead, technical foundation and delivery — Turborepo/pnpm monorepo, Docker Compose, GitHub Actions CI; the whole authentication and authorisation layer (JWT, bcrypt, lockout, password reset, four-role access control with clinic scope); the frontend shell and design system; patient self-service booking; appointment cancellation; the partial unique index that makes cancellation possible without permanently burning the slot; the Azure deployment described entirely in Bicep; and the final integration of my teammates' branches. 72 of the 84 merged commits on `main` are mine. Zakaria delivered availabilities, day flow and notifications; Larbi delivered appointments, the patient entity and statistics.

## Architecture

```
apps/backend    NestJS 11 — modular (auth, user, clinic, availability,
                appointment, notification, statistics, health)
                controller → service → TypeORM repository, DTOs validated
                by class-validator, global exception filter
apps/frontend   Angular 22 standalone + Signals — core / features / shared,
                lazy-loaded routes, Angular Material 3 + Tailwind 4
packages/       shared packages (currently empty)
infra/          Azure infrastructure as Bicep templates
docker/         multi-stage Dockerfiles (backend, frontend + nginx)
```

Production topology — the backend has **no public address**:

```
Internet (HTTPS)
    │
ca-mediplan-frontend   external ingress · nginx + Angular · minReplicas 0
    │  proxies /api/ over the private network
ca-mediplan-backend    internal ingress · NestJS · minReplicas 0
    │  TLS required
PostgreSQL (Neon)      managed, free tier
```

Because the browser only ever sees one origin, no CORS configuration is needed at all.

## Tech Stack

| Layer          | Technology                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| Frontend       | Angular 22 (standalone, Signals), Angular Material 3, Tailwind CSS 4                    |
| Backend        | NestJS 11, TypeORM, Passport JWT, bcrypt, class-validator                               |
| Database       | PostgreSQL — schema driven exclusively by versioned migrations                          |
| Build          | Turborepo + pnpm workspaces                                                             |
| Infrastructure | Azure Container Apps (scale-to-zero), Neon PostgreSQL, GitHub Container Registry, Bicep |
| Quality        | Jest (72 tests), Vitest (133 tests), ESLint, Prettier, GitHub Actions                   |

## Technical Highlights

- **Concurrency-safe booking.** A partial unique index (`uq_appointment_active_slot`, excluding cancelled rows) plus a `pessimistic_write` lock inside the booking transaction. The partial predicate is the point: a plain unique constraint would keep a cancelled slot blocked forever.
- **Server-side tenancy.** Clinic scope comes from the JWT, never from the request body; a patient booking cannot name another patient, and a doctor querying another doctor's appointment gets 404 rather than 403 (no existence leak).
- **Migration-only schema.** `synchronize: false`, `migrationsRun: false`, entities and migrations listed explicitly in `data-source-options.ts` rather than resolved by directory glob — deterministic across ts-node, `dist` and Jest.
- **One connection builder.** `buildDataSourceOptions()` is shared by the NestJS runtime, the migration CLI and the seed script, and accepts either `DATABASE_URL` or separate `DB_*` variables.
- **Infrastructure as code.** No Azure resource is created by hand; `./scripts/deploy.sh --what-if` previews every deployment before it is applied. Running cost is kept at roughly $0/month on a non-renewable student credit through scale-to-zero.

## Challenges & Solutions

**A bug that only existed in production.** Once deployed, every API call returned 404 while everything worked locally. Searching the code, the routes and the configuration found nothing, because the problem was not there. Changing method — looking for what _differed_ between the two environments rather than what was broken — located it in the routing layer: the nginx proxy forwarded the browser's `Host` header, and Azure Container Apps routes on that header, whereas Docker Compose locally does not route that way at all. The fix is one line (`proxy_set_header Host $proxy_host`), the lesson is that a working development environment proves nothing about production. The same shape of problem appeared twice more: Windows line endings preventing a container entrypoint from starting, and clinic opening hours shifted by four hours because the container runs in UTC.

**Cancellation versus uniqueness.** The first anti-double-booking constraint was a plain unique index, which made cancelled slots permanently unbookable. Replacing it with a partial unique index that excludes cancelled rows is what made the cancellation feature possible at all.

## Installation

Prerequisites: **Node.js ≥ 22.22.3 (or ≥ 24.15)** — required by Angular 22 — and **pnpm** (`corepack enable`, otherwise `npm i -g pnpm@11.7.0`). An `.nvmrc` is provided.

```bash
pnpm install
cp .env.example .env    # then fill in the values
```

New to the project? [`CONTRIBUTING.md`](CONTRIBUTING.md) covers prerequisites, tooling, migrations, the Git workflow and troubleshooting in detail.

## Environment Variables

Copy `.env.example` to `.env` (git-ignored) and fill it in. Every variable is documented inline in that file. The essentials:

| Variable                                                                                                                   | Purpose                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` _or_ `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`                                                  | Database connection. `DATABASE_URL` takes precedence and is the form managed hosts hand you.                                                                                          |
| `DB_SSL`                                                                                                                   | `false` locally, **`true`** against any managed database.                                                                                                                             |
| `JWT_SECRET`                                                                                                               | ≥ 32 random characters, different per environment. The backend refuses to start without it — but only its _length_ is checked, so the placeholder in `.env.example` must be replaced. |
| `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_DURATION_MINUTES`, `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Security policy.                                                                                                                                                                      |
| `BACKEND_PORT`, `FRONTEND_PORT`                                                                                            | Local ports.                                                                                                                                                                          |

Cloud-only variables (`RUN_MIGRATIONS_ON_BOOT`, `ALLOW_DEMO_SEED`, `BACKEND_ORIGIN`) are injected as Container Apps secrets, never placed in the local `.env`. No secret is ever committed.

## Running the Project

```bash
pnpm dev      # backend + frontend through Turbo
pnpm build
pnpm lint
pnpm format
```

With Docker (one command, requires Docker Desktop or Engine + Compose v2):

```bash
docker compose up -d --build
```

| Service          | URL                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| Frontend (nginx) | http://localhost:4200                                                  |
| Backend API      | http://localhost:4200/api/v1 (proxied) or http://localhost:3000/api/v1 |
| Backend health   | http://localhost:3000/health                                           |
| PostgreSQL       | localhost:5432                                                         |

Database:

```bash
pnpm --filter backend migration:run    # apply migrations
pnpm --filter backend seed:demo        # demonstration dataset (overwrites it)
```

## Testing

```bash
pnpm test                              # 205 tests: 72 Jest (backend) + 133 Vitest (frontend)
pnpm --filter backend test:e2e         # 8 end-to-end tests, needs a running database
```

The test plan, results and the list of bugs found and fixed are in [`docs/tests/`](docs/tests/).

## Production Build

```bash
pnpm build
```

Backend output in `apps/backend/dist/`, frontend in `apps/frontend/dist/frontend/browser/` — the path the nginx image copies. The frontend production bundle is 819 kB raw / 174 kB transferred, above the 500 kB warning budget (icon font, see _Future Improvements_).

Deployment to Azure:

```bash
./scripts/deploy.sh --what-if   # preview, changes nothing
./scripts/deploy.sh             # re-displays the plan, then asks for confirmation
./scripts/teardown.sh           # remove everything
```

The complete guide — first deployment, troubleshooting, demo accounts — is in [`docs/deployment/azure.md`](docs/deployment/azure.md); cost and SKU choices in [`infra/README.md`](infra/README.md).

## Screenshots

Screen-by-screen walkthrough with screenshots, by role: [`docs/guide-utilisation/`](docs/guide-utilisation/) (French).

## Live Demo

- Application: https://ca-mediplan-frontend.ashytree-9ad5012f.canadacentral.azurecontainerapps.io
- Video walkthrough (4 min 05, French): [`MediPlan-Demo.mp4`](MediPlan-Demo.mp4)

## Future Improvements

Known limitations, stated honestly:

- **JWT in `localStorage`** with no refresh token and no revocation list; a deactivated account keeps access until the token expires (≤ 60 min). Moving to an httpOnly cookie and re-reading the account status on each request are the next security steps.
- **Accessibility:** 8 ESLint errors remain on clickable elements that are not keyboard-focusable; 18 backend lint errors remain, all in test files (typing of test doubles).
- **Formatting debt:** 41 files are not Prettier-compliant. Lint and format are reported by CI without blocking; compilation and tests block.
- **Bundle size:** the Material Symbols icon font alone weighs 3.9 MB and four font families are bundled; subsetting the icon font and keeping a single family would bring the initial bundle back under budget.
- **Migrations on boot** with up to two replicas rely on TypeORM's `migrations` table and its transaction rather than an application-level lock.
- No API documentation is generated (no Swagger/OpenAPI), and there is no request logging or metrics export.

---

Project tracking (epics, user stories, statuses, owners) is kept in Jira, project `MEDIPLAN`. The full account of how the project unfolded, what changed along the way and the retrospective is in the [final report](docs/RAPPORT-FINAL.md) (French).
