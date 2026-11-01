# AMS — Assignment Management System

Assignment Management System (AMS) is a Google Classroom–style POC for SWD392 Group 1. Teachers and experts run subject classes with join codes, stream posts, and classwork; students join free or paid classes, pay tuition (VNPay / SePay / VietQR sandbox), submit work, and receive grades. Admins manage accounts, roles, and audit logs.

## Table of contents

- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Related docs](#related-docs)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Local development (without Docker app containers)](#local-development-without-docker-app-containers)
- [Demo accounts](#demo-accounts)
- [Payment sandboxes](#payment-sandboxes)
- [Architecture](#architecture)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing notes](#contributing-notes)

## Key features

- Six-character class join codes (find/join like Google Classroom)
- Free classes enroll as `ACTIVE`; paid classes stay `PENDING_PAYMENT` until payment succeeds
- Class workspace: Stream (posts + materials), Assignments (submit → grade), People, Settings (rename, room, archive)
- Payments: SePay (primary live/demo gateway with IPN), VNPay Sandbox, VietQR sandbox confirm
- Roles: `ADMIN`, `EXPERT`, `TEACHER`, `STUDENT` with JWT auth
- Flyway-managed PostgreSQL schema (V1–V8) and seed data for demos

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Language (API) | Java 21 |
| API framework | Spring Boot 3.2 |
| Persistence | Spring Data JPA, Hibernate, Flyway |
| Database | PostgreSQL 16 |
| Security | Spring Security + JWT (stateless) |
| API docs | SpringDoc OpenAPI (Swagger UI) |
| File storage | Local disk (`/api/files/**`) + Cloudinary for images |
| Payments | SePay, VNPay Sandbox, VietQR confirm |
| Frontend | Next.js 14 (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui (Radix) |
| Client data | TanStack Query v5, Zustand (auth), React Hook Form + Zod |
| Local orchestration | Docker Compose |
| Typical deploy | Frontend → Vercel; Backend + Postgres → Render (or similar) |

## Related docs

Do not duplicate secrets or long SePay runbooks here.

| Doc | Purpose |
| --- | ------- |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Health check, seed inventory, flow matrix, known GAPs |
| [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md) | Local SePay IPN via cloudflared/ngrok + portal config |
| [`.env.example`](.env.example) | Backend / Compose env template (placeholders only) |
| [`ams-frontend/.env.local.example`](ams-frontend/.env.local.example) | Frontend public env template |

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2) for the one-command stack
- For non-Docker backend/frontend work:
  - Java 21+
  - Maven Wrapper (`ams-backend/mvnw` / `mvnw.cmd`) — no global Maven required
  - Node.js 20+ and npm
  - PostgreSQL 16 (or use only the Compose `postgres` service on host port **5433**)
- Optional: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) or ngrok for SePay IPN (see [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md))

## Quick start (Docker)

This starts Postgres, Spring Boot, and Next.js together.

```bash
git clone https://github.com/xukki241/SWD_AMS_G1.git
cd SWD_AMS_G1

# Create a local env file (gitignored). Fill SePay / Cloudinary / VNPay as needed.
cp .env.example .env

docker compose up --build
```

When healthy:

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api-docs |
| Postgres (host) | `localhost:5433` → container `5432` (`ams_db` / `ams_user` / `ams_password`) |

Compose notes:

- Backend receives `DB_URL=jdbc:postgresql://postgres:5432/ams_db` inside the network (not the host port).
- Frontend build/runtime uses `NEXT_PUBLIC_API_URL=http://localhost:8080/api` so the **browser** talks to the published backend port.
- Secrets should come from your local `.env`. Do not commit `.env`. Compose may still ship demo defaults for some payment vars; override them in `.env` for real merchant credentials.
- Flyway runs on **backend startup** (`V1`–`V8`). Seeds load with the API — not a separate seed container. `V2` inserts the base demo dataset; `V8` idempotently syncs join codes, 50k fees, assignment topics, and the `student1` PENDING_PAYMENT path on `SWD392-G1801`.
- A **fresh Postgres volume** gets the full demo via Flyway. An existing volume only applies migrations not yet in `flyway_schema_history` (e.g. V8 once).

Stop / reset:

```bash
docker compose down
# Full DB resync (destructive — wipes volume, then Flyway V1–V8 reseeds on next up):
docker compose down -v
docker compose up --build
```

## Local development (without Docker app containers)

You can run only Postgres in Docker and develop API/UI on the host.

### 1. Database

```bash
docker compose up -d postgres
```

Host connection:

```text
jdbc:postgresql://localhost:5433/ams_db
username: ams_user
password: ams_password
```

### 2. Backend

```bash
cp .env.example .env
# Edit .env — for host JVM + Compose Postgres set:
#   DB_URL=jdbc:postgresql://localhost:5433/ams_db

cd ams-backend
# Windows
.\mvnw.cmd spring-boot:run
# macOS / Linux
./mvnw spring-boot:run
```

Spring Boot reads `DB_*`, `JWT_*`, `CLOUDINARY_*`, `VNPAY_*`, `SEPAY_*`, `FILE_STORAGE_*`, and `PORT` from the environment / `.env` (depending how you inject them). Defaults also exist in `ams-backend/src/main/resources/application.yml`.

Swagger: http://localhost:8080/swagger-ui.html

### 3. Frontend

```bash
cd ams-frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

`NEXT_PUBLIC_API_URL` must point at the API base including `/api` (Axios `baseURL`).

### 4. Optional SePay IPN tunnel

Browser return URLs can stay on `localhost`. IPN cannot. Follow [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md).

## Demo accounts

Seeded in Flyway `V2` (password is public demo data). **Password for all accounts:** `Password@123`

| Role | Usernames |
| ---- | --------- |
| Admin | `admin` |
| Experts | `expert1`, `expert2` |
| Teachers | `teacher1`, `teacher2`, `teacher3` |
| Students | `student1` … `student12` (`student11` is `SUSPENDED` for demo) |

Useful join codes (see [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for fees and teachers):

| Class | Join code | Notes |
| ----- | --------- | ----- |
| SWD392-G1701 | `K7Q2M9` | Primary teacher1 class |
| SWD392-G1702 | `Q2M9K7` | |
| SWD392-G1801 | `B7X4NP` | `student1` often `PENDING_PAYMENT` (~50k VND) |
| PRJ301-G1703 | `M4T8ZD` | Free |
| PRJ301-G1704 | `X9R3VC` | Free |
| DBI202-G1705 | `P6H2WS` | Paid |
| MAE101-G1806 | `Z5J7QB` | Paid |
| DBI202-G1807 | `T8N4LM` | Paid |

Suggested golden-path logins:

- Teacher: `teacher1` / `Password@123` → `/teacher`
- Student: `student1` / `Password@123` → `/student` (join / pay / submit)
- Admin: `admin` / `Password@123` → `/admin`
- Expert: `expert1` / `Password@123` → `/expert`

## Payment sandboxes

### VNPay Sandbox test card

| Field | Value |
| ----- | ----- |
| Bank | NCB |
| Card number | `9704198526191432198` |
| Name | `NGUYEN VAN A` |
| Issue date | `07/15` |
| OTP | `123456` |

### SePay

Configure merchant id, secret, and public IPN URL via `.env` + SePay portal. Step-by-step: [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md). Do not paste live secrets into git.

### VietQR

UI “I have transferred” sandbox confirm path — no real bank money moves; demo only.

## Architecture

### High-level

```text
┌─────────────────────┐     HTTPS / JSON      ┌──────────────────────┐
│  Next.js 14 (TS)    │ ───────────────────▶  │  Spring Boot 3.2     │
│  ams-frontend       │ ◀───────────────────  │  ams-backend         │
│  :3000              │     JWT Bearer         │  :8080 /api          │
└─────────────────────┘                        └──────────┬───────────┘
                                                          │ JPA + Flyway
                                               ┌──────────▼───────────┐
                                               │  PostgreSQL 16       │
                                               └──────────────────────┘

External: Cloudinary (assets) · SePay / VNPay / VietQR (payments)
```

### Repository layout

```text
SWD_AMS_G1/
├── ams-backend/                 Spring Boot API
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ams/
│       │   ├── config/          Security, CORS, OpenAPI-related beans
│       │   ├── controller/      REST controllers under /api/**
│       │   ├── dto/
│       │   ├── entity/          JPA entities
│       │   ├── exception/
│       │   ├── repository/
│       │   ├── security/        JWT filter + token provider
│       │   └── service/
│       └── resources/
│           ├── application.yml
│           └── db/migration/    Flyway V1–V8
├── ams-frontend/                Next.js App Router UI
│   ├── Dockerfile
│   ├── e2e/                     Playwright specs
│   ├── playwright.config.ts
│   └── src/
│       ├── app/                 Routes (auth, dashboards, class workspace, payment returns)
│       ├── components/          classroom/ + layout/ + ui/
│       ├── lib/                 axios, constants, utils
│       ├── services/            API client modules
│       ├── stores/              Zustand auth store
│       └── types/
├── docs/
│   ├── PROJECT_STATUS.md
│   └── SEPAY_SETUP.md
├── docker-compose.yml
├── .env.example
└── README.md
```

### Request lifecycle

1. Browser hits Next.js (`ams-frontend`). Protected dashboards read JWT from the auth store and attach `Authorization: Bearer …` via Axios (`src/lib/axios.ts`).
2. API request reaches Spring Security (`SecurityConfig`): public auth, public class catalog, payment IPN/return, Swagger, and `/api/files/**`; everything else requires a valid JWT (`JwtAuthenticationFilter`).
3. Controllers delegate to services; JPA repositories talk to PostgreSQL. Schema is validated (`ddl-auto: validate`) against Flyway history.
4. JSON responses update TanStack Query caches; role home routes (`/admin`, `/teacher`, `/student`, `/expert`) and `/classes/[id]` render classroom UX.

### Auth model

- Login: `POST /api/auth/login` → JWT (24h default in `application.yml`).
- Register: `POST /api/auth/register`.
- Passwords stored with BCrypt.
- Method security (`@EnableMethodSecurity`) gates role-sensitive operations on services/controllers.
- CORS allows `localhost:3000` / `3001`, `https://*.vercel.app`, and `https://g1-ams-swd.com`.

### Classroom / registration flow

```text
Teacher/Expert creates class
        → join_code + capacity + registration_fee (+ optional room)
Student finds class (GET /api/subject-classes/public) and joins
        → fee == 0  → ACTIVE
        → fee  > 0  → PENDING_PAYMENT
Student pays (SePay / VNPay / VietQR confirm)
        → IPN or return handler marks payment SUCCESS
        → registration activated (idempotent)
Student submits assignment → teacher evaluates
```

### API surface (controllers)

| Prefix | Responsibility |
| ------ | -------------- |
| `/api/auth` | Login, register |
| `/api/users` | User CRUD / role assignment (admin) |
| `/api/subjects` | Subject catalog / create |
| `/api/subject-classes` | Classes, public catalog, my classes, patch, archive, remove student |
| `/api/registrations` | My regs, class roster, register, join-by-code |
| `/api/classes/{classId}/posts` | Stream posts (multipart) |
| `/api/assignments` | Classwork CRUD, overview, allocate |
| `/api/assignment-templates` | Expert templates |
| `/api/submissions` | Multipart submit, list, delete |
| `/api/evaluations` | Grade + feedback |
| `/api/payment` | VNPay / SePay create, IPN, return, VietQR confirm, my txns |
| `/api/dashboard/{role}` | Role KPI payloads |
| `/api/audit-logs` | Audit trail |
| `/api/files/{*path}` | Served local uploads |

### Frontend routes

| Route | Role / purpose |
| ----- | -------------- |
| `/login`, `/register` | Auth |
| `/admin` | Users, classes overview, audit |
| `/teacher`, `/expert`, `/student` | Role dashboards |
| `/classes` | Class list |
| `/classes/[id]` | Stream / classwork / people |
| `/classes/[id]/assignments/[assignmentId]` | Assignment detail / your work |
| `/classes/[id]/settings` | Teacher settings + archive |
| `/payment/return` | VNPay browser return |
| `/payment/sepay-return` | SePay browser return |

### Database schema (domains)

Flyway:

| Version | Purpose |
| ------- | ------- |
| V1 | Core schema |
| V2 | Seed users/roles/subjects/classes/assignments/payments |
| V3 | Join code, capacity, fee, `class_posts`, max score |
| V4 | Lower demo registration fee (~50_000 VND default) |
| V5 | Assignment `topic` |
| V6 | Class `room` |
| V7 | Class `status` `ACTIVE` / `ARCHIVED` |
| V8 | Idempotent demo sync (join codes, 50k fees, topics, `student1` PENDING on G1801) |

Core tables (simplified):

```text
roles, users, user_roles
system_configurations, audit_logs
subjects, subject_classes, class_posts
assignment_templates, assignments, assignment_classes
class_registrations, payment_transactions
submissions, assignment_evaluations
```

Identity statuses: `ACTIVE` | `INACTIVE` | `SUSPENDED`.  
Registration statuses: `PENDING_PAYMENT` | `ACTIVE` | `CANCELLED`.  
Payment statuses: `PENDING` | `SUCCESS` | `FAILED` | `REFUNDED`.

## Environment variables

### Root / backend (see `.env.example`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DB_URL` | Yes | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | Yes | DB credentials |
| `JWT_SECRET` | Yes | HMAC secret (≥256-bit recommended) |
| `PORT` | No | Server port (default `8080`) |
| `CLOUDINARY_*` | For Cloudinary uploads | Cloud name, API key, secret |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` | For VNPay | Sandbox merchant credentials |
| `VNPAY_RETURN_URL` / `VNPAY_IPN_URL` | For VNPay | Browser return + IPN |
| `SEPAY_ENV` | For SePay | e.g. `production` |
| `SEPAY_MERCHANT_ID` / `SEPAY_SECRET_KEY` | For SePay | From SePay portal — **do not commit** |
| `SEPAY_SUCCESS_URL` / `SEPAY_ERROR_URL` / `SEPAY_CANCEL_URL` | For SePay | Frontend return URLs |
| `SEPAY_IPN_URL` | For SePay IPN | Public HTTPS IPN endpoint |
| `FILE_STORAGE_PATH` / `FILE_STORAGE_BASE_URL` | No | Local upload root + public base URL |

### Frontend (`ams-frontend/.env.local`)

| Variable | Description | Local example |
| -------- | ----------- | ------------- |
| `NEXT_PUBLIC_API_URL` | Axios base URL (must include `/api`) | `http://localhost:8080/api` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud for client widgets | your cloud name |

Never commit `.env`, `.env.local`, or `.env.production` with live SePay secrets. Keep placeholders in `.env.example` only.

## Available scripts

### Docker (repo root)

| Command | Description |
| ------- | ----------- |
| `docker compose up --build` | Build and run full stack |
| `docker compose up -d postgres` | DB only |
| `docker compose logs -f backend` | Tail API logs |
| `docker compose down` | Stop containers |
| `docker compose down -v` | Stop and delete volumes |

### Backend (`ams-backend`)

| Command | Description |
| ------- | ----------- |
| `./mvnw spring-boot:run` | Run API |
| `./mvnw -DskipTests package` | Build JAR to `target/` |
| `./mvnw test` | Unit/integration tests (if present) |

### Frontend (`ams-frontend`)

| Command | Description |
| ------- | ----------- |
| `npm install` | Install deps |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run test:e2e` | Playwright e2e |

## Testing

### Frontend typecheck / build

```bash
cd ams-frontend
npx tsc --noEmit
npm run build
```

### Playwright

```bash
cd ams-frontend
npx playwright install   # first time
npm run test:e2e
```

Config: `ams-frontend/playwright.config.ts`. Specs under `ams-frontend/e2e/`. Reports are gitignored (`playwright-report/`, `test-results/`).

### Backend

```bash
cd ams-backend
./mvnw test
```

Manual API checks: Swagger UI or curl against `/api/auth/login` then authenticated routes.

### Demo checklist

Use [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) flow matrix (login × role, create class, join, pay, submit, archive).

## Deployment

### Frontend → Vercel

1. Import `https://github.com/xukki241/SWD_AMS_G1` (or your fork).
2. Root directory: `ams-frontend`.
3. Build: `npm run build`; output: Next.js default.
4. Env:
   - `NEXT_PUBLIC_API_URL=https://<your-backend-host>/api`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...`
5. Ensure backend CORS includes your Vercel domain (`https://*.vercel.app` is already allowed; add custom domains in `CorsConfig` if needed).

### Backend → Render (or similar Linux PaaS)

Render constraints: bind `0.0.0.0:$PORT`, ephemeral filesystem (use Postgres + object storage; local `storage/` is not durable across restarts), case-sensitive paths.

1. New Web Service from the repo; root directory `ams-backend`.
2. Build: `./mvnw -DskipTests package`
3. Start: `java -jar target/ams-backend-0.0.1-SNAPSHOT.jar` (confirm JAR name under `target/` after build)
4. Attach managed Postgres; set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
5. Set `PORT` from the platform, `JWT_SECRET`, payment, and Cloudinary vars from a **secret store** — not from committed files.
6. Point SePay IPN at `https://<backend>/api/payment/sepay-ipn` with matching `SEPAY_SECRET_KEY`.
7. Set VNPay/SePay return URLs to the production frontend origins.

### Docker images

```bash
# Backend
docker build -t ams-backend ./ams-backend

# Frontend (pass public API URL at build time if needed)
docker build -t ams-frontend ./ams-frontend
```

Production should not rely on Compose demo defaults for merchant secrets.

## Troubleshooting

### Backend cannot connect to Postgres

- Compose stack: backend must use host `postgres`, not `localhost`.
- Host JVM + Compose DB: use `localhost:5433`.
- Check health: `docker compose ps` and `pg_isready` inside `ams-postgres`.

### Flyway / schema errors

- `ddl-auto: validate` means the DB must match migrations. Do not hand-edit schema out of band.
- Fresh demo DB (full Flyway reseed V1–V8): `docker compose down -v && docker compose up --build`.

### Frontend calls wrong API / CORS errors

- Confirm `NEXT_PUBLIC_API_URL` ends with `/api`.
- Rebuild frontend after changing `NEXT_PUBLIC_*` (inlined at build time).
- Add production origin to `CorsConfig` if not covered.

### SePay payment succeeds but class stays `PENDING_PAYMENT`

- IPN URL must be public HTTPS and registered in SePay portal.
- Header `X-Secret-Key` must match `SEPAY_SECRET_KEY`.
- Tunnel hostnames change on restart — update portal + `.env`. See [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md).

### JWT / 401 on every request

- Login again; token may be expired (24h).
- Ensure `Authorization: Bearer <token>` is sent; clear broken localStorage auth state.

### File upload / stream materials missing after restart

- Local disk under `ams-backend/storage/` (or Compose volume `ams_storage`) is for demos. Prefer Cloudinary / durable object storage in production (Render filesystem is ephemeral).

### Port already in use

- Frontend `3000`, backend `8080`, Postgres host `5433`. Stop conflicting processes or change mappings in `docker-compose.yml` / `PORT`.

## Contributing notes

- Prefer small, reversible changes; do not break auth, payment, or API contracts without an explicit migration plan.
- Keep secrets out of git (`.gitignore` covers `.env*`, `.tools/`, Playwright reports, DB dumps, IDE junk).
- Document durable status in `docs/PROJECT_STATUS.md` rather than burying it only in chat history.
- License / academic use: SWD392 Group 1 coursework POC unless otherwise stated by the team.
