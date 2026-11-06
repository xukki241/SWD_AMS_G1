# AMS — Assignment Management System

Assignment Management System (AMS) is a course-based learning platform POC for SWD392 Group 1. Teachers build the course catalog with modules, lessons and AI-drafted outlines; students enroll in free or paid courses, pay tuition (VNPay / SePay / PayOS / VietQR sandbox), submit work, and receive grades. Admins manage accounts, roles, and audit logs.

## Table of contents

- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Related docs](#related-docs)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Local development (without Docker app containers)](#local-development-without-docker-app-containers)
- [Demo accounts](#demo-accounts)
- [Course management](#course-management)
- [Payment sandboxes](#payment-sandboxes)
- [Architecture](#architecture)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing notes](#contributing-notes)

## Key features

- Course management (rubric #2): teacher-owned catalog with search/filter/pagination, thumbnail upload, module/lesson curriculum (drag-and-drop reorder), and Gemini-drafted outlines reviewed before saving
- Enroll Course with Payment (rubric #4): free courses enroll as `ACTIVE`; paid courses stay `PENDING_PAYMENT` until payment succeeds
- Assignments per course: submit → grade flow with student work-state overview
- Payments: SePay and PayOS (hosted checkout + webhook/IPN), VNPay Sandbox, VietQR sandbox confirm
- Roles: `ADMIN`, `TEACHER`, `STUDENT` with JWT auth
- Flyway-managed PostgreSQL schema (V1–V3) and seed data for demos

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
| Payments | SePay, PayOS, VNPay Sandbox, VietQR confirm |
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
| [docs/PAYOS_SETUP.md](docs/PAYOS_SETUP.md) | PayOS payment channel, env vars and webhook setup |
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
- Flyway runs on **backend startup** (`V1`–`V2`). Seeds load with the API — not a separate seed container. `V1` creates the full course-centric schema (identity, categories/courses/modules/lessons, course_enrollments, assignments, submissions, payments, evaluations, audit); `V2` inserts the demo dataset: 6 courses, 23 users, 19 enrollments, payments (including the `student17` PENDING_PAYMENT retry path on `CRS-SCRUM2`), submissions and graded evaluations.
- A **fresh Postgres volume** gets the full demo via Flyway. The schema was rewritten (legacy class tables removed) — an existing volume must be wiped once before running the new migrations.

Stop / reset:

```bash
docker compose down
# Full DB resync (destructive — wipes volume, then Flyway V1–V3 reseeds on next up):
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

Spring Boot reads `DB_*`, `JWT_*`, `CLOUDINARY_*`, `VNPAY_*`, `SEPAY_*`, `PAYOS_*`, `GEMINI_*`, `FILE_STORAGE_*`, and `PORT` from the environment / `.env` (depending how you inject them). Defaults also exist in `ams-backend/src/main/resources/application.yml`.

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
| Teachers | `teacher1`, `teacher2`, `teacher3`, `expert1`, `expert2` (legacy accounts migrated to teacher) |
| Students | `student1` … `student17` (`student11` is `SUSPENDED` for demo) |

Demo course catalog (see [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for the full matrix):

| Course | Code | Instructor | Price | Notes |
| ------ | ---- | ---------- | ----- | ----- |
| Agile Software Development with Scrum | `CRS-SWD01` | teacher1 | Free | Primary demo course with assignments |
| Scrum in Practice: Team Projects | `CRS-SCRUM2` | teacher1 | 50.000₫ | `student17` is `PENDING_PAYMENT` (golden payment path) |
| Spring MVC Web Applications | `CRS-SPRMVC` | teacher2 | Free | |
| Java Servlet Fundamentals | `CRS-SRVLT1` | teacher2 | Free | |
| Database Systems with SQL | `CRS-DBSQL1` | teacher3 | 120.000₫ | Paid, graded ERD + SQL assignments |
| Linear Algebra for Engineers | `CRS-LINALG` | teacher3 | Free | `DRAFT` (invisible in catalog) |

Suggested golden-path logins:

- Teacher: `teacher1` / `Password@123` → `/teacher`
- Student: `student1` / `Password@123` → `/student` (enroll / pay / submit)
- Admin: `admin` / `Password@123` → `/admin`

## Course management

Teachers (and admins) build the course catalog and its curriculum. Students enroll from the course details page.

| Screen | Route | Purpose |
| ------ | ----- | ------- |
| List | `/courses` | Search by title/code, filter by category and status, paginate, delete |
| Add / Edit | `/courses/new`, `/courses/[id]/edit` | Course fields, pricing, publishing, thumbnail upload |
| Details | `/courses/[id]` | Read-only summary, outcomes, prerequisites, curriculum metrics |
| Manage content | `/courses/[id]/content` | Modules + lessons, drag-and-drop reorder, AI outline dialog |

Access rules:

- `TEACHER` and `ADMIN` only (`401` when anonymous, `403` for other roles).
- Only the course owner or an `ADMIN` may update, delete, or change content (`403` otherwise).
- Admins creating a course become its instructor.

Behaviour worth knowing:

- **Course code** is normalized to uppercase and must be unique. A duplicate returns `409` with `Course code already exists`, shown inline on the code field.
- **Thumbnail**: PNG/JPG only, max 5MB, 1280×720 recommended. Validated in the browser for instant feedback and again on the server.
- **Curriculum**: `Module` (not "Section") groups lessons. `orderIndex` starts at 0 and stays contiguous per parent; reordering sends the full module/lesson payload in one transaction.
- **Delete** is a soft delete (`deleted` flag). Courses that already have any enrollment are blocked — the API returns `400` with a readable message instead of orphaning students. Because the unique index only covers active courses, a deleted course's code can be reused.
- **AI outline**: Gemini drafts modules and lessons, but nothing is persisted until you press **Accept**. Failures (timeout after 30s, unusable JSON, quota) leave the existing curriculum untouched and offer a retry.

### Gemini setup

The API key is read from the `GEMINI_API_KEY` environment variable — it is never hardcoded and never sent to the browser.

```bash
# .env (repo root, gitignored)
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.0-flash        # optional
GEMINI_TIMEOUT_SECONDS=30            # optional
```

`docker compose up` passes these through to the backend container. For a host JVM, export them before `./mvnw spring-boot:run`.

Without a key the rest of the feature works; only `POST /api/courses/{id}/ai/outline` fails, returning `502` with a readable message that the dialog shows with a retry button.

Try it: log in as `teacher1` / `Password@123` → **Courses** in the sidebar → open a course → **Manage content**.

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

### PayOS

Create a payment channel at [my.payos.vn](https://my.payos.vn) for `PAYOS_CLIENT_ID`, `PAYOS_API_KEY` and `PAYOS_CHECKSUM_KEY`. Webhook: `POST /api/payment/payos-webhook` (public HTTPS); return: `/payment/payos-return`. Setup details: [docs/PAYOS_SETUP.md](docs/PAYOS_SETUP.md).

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
│           └── db/migration/    Flyway V1–V3
├── ams-frontend/                Next.js App Router UI
│   ├── Dockerfile
│   ├── e2e/                     Playwright specs
│   ├── playwright.config.ts
│   └── src/
│       ├── app/                 Routes (auth, dashboards, course screens, payment returns)
│       ├── components/          classroom/ + courses/ + layout/ + ui/
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
2. API request reaches Spring Security (`SecurityConfig`): public auth, payment IPN/return, Swagger, and `/api/files/**`; everything else requires a valid JWT (`JwtAuthenticationFilter`).
3. Controllers delegate to services; JPA repositories talk to PostgreSQL. Schema is validated (`ddl-auto: validate`) against Flyway history.
4. JSON responses update TanStack Query caches; role home routes (`/admin`, `/teacher`, `/student`) and `/courses/[id]` render the course UX.

### Auth model

- Login: `POST /api/auth/login` → JWT (24h default in `application.yml`).
- Register: `POST /api/auth/register`.
- Passwords stored with BCrypt.
- Method security (`@EnableMethodSecurity`) gates role-sensitive operations on services/controllers.
- CORS allows `localhost:3000` / `3001`, `https://*.vercel.app`, and `https://g1-ams-swd.com`.

### Enroll / payment flow

```text
Teacher builds a course (catalog + curriculum) and publishes it
Student opens a PUBLISHED course and enrolls (POST /api/courses/{id}/enroll)
        → course free  → ACTIVE
        → course paid  → PENDING_PAYMENT
Student pays (SePay / VNPay / VietQR confirm)
        → IPN or return handler marks payment SUCCESS
        → enrollment activated (idempotent)
Student submits assignment → instructor evaluates
```

### API surface (controllers)

| Prefix | Responsibility |
| ------ | -------------- |
| `/api/auth` | Login, register |
| `/api/users` | User CRUD / role assignment (admin) |
| `/api/subjects` | Subject catalog / create |
| `/api/categories` | Course categories (teacher/admin) |
| `/api/courses` | Course list/search/filter, CRUD (JSON or multipart + thumbnail), soft delete |
| `/api/public/courses` | Public read-only catalog (PUBLISHED, non-deleted only; no JWT required) |
| `/api/courses/{id}/content` | Curriculum tree, module/lesson CRUD, reorder (`PATCH …/content/reorder`) |
| `/api/modules/{id}`, `/api/lessons/{id}` | Rename/delete module, add/edit/delete lesson |
| `/api/courses/{id}/ai` | Gemini outline draft + `…/outline/accept` |
| `/api/courses/{id}/enroll`, `/api/enrollments` | Enroll, my enrollments, roster, cancel |
| `/api/assignments` | Course assignment CRUD, `GET /course/{courseId}`, student overview |
| `/api/assignment-templates` | Reusable templates (teacher/admin) |
| `/api/submissions` | Multipart submit, list, unsubmit |
| `/api/evaluations` | Grade + feedback |
| `/api/payment` | VNPay / SePay course create, IPN, return, VietQR confirm, my txns |
| `/api/dashboard/{role}` | Role KPI payloads |
| `/api/audit-logs` | Audit trail |
| `/api/files/{*path}` | Served local uploads |

### Frontend routes

| Route | Role / purpose |
| ----- | -------------- |
| `/login`, `/register` | Auth |
| `/` | Public landing with published courses |
| `/admin` | Users, courses overview, audit |
| `/teacher`, `/student` | Role dashboards |
| `/courses` | Course catalog / management list |
| `/courses/new` | Create course |
| `/courses/[id]` | Course details + enroll |
| `/courses/[id]/edit` | Edit course |
| `/courses/[id]/content` | Modules, lessons, reorder, AI outline |
| `/payment/return` | VNPay browser return |
| `/payment/sepay-return` | SePay browser return |

### Database schema (domains)

Flyway:

| Version | Purpose |
| ------- | ------- |
| V1 | Full course-centric schema: identity, categories/courses/modules/lessons, course_enrollments, assignments, submissions, evaluations, payments, audit |
| V2 | Demo dataset: users, courses + curriculum, enrollments, payments, submissions, evaluations |

Core tables (simplified):

```text
roles, users, user_roles
system_configurations, audit_logs
subjects, assignment_templates
categories, courses, modules, lessons
course_enrollments, payment_transactions
assignments, submissions, assignment_evaluations
```

Identity statuses: `ACTIVE` | `INACTIVE` | `SUSPENDED`.  
Enrollment statuses: `PENDING_PAYMENT` | `ACTIVE` | `CANCELLED` | `COMPLETED`.  
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
| `GEMINI_API_KEY` | For AI outlines | Google AI Studio key — never commit it |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash` |
| `GEMINI_BASE_URL` | No | Default `https://generativelanguage.googleapis.com` |
| `GEMINI_TIMEOUT_SECONDS` | No | Default `30` |
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

Course-management unit tests (`CourseServiceTest`, `CourseContentServiceTest`, `AIServiceTest`) mock the Gemini client, so no API key or network access is required. If the host JDK is older than 21, run them in the build image instead:

```bash
docker run --rm -v "$PWD:/app" -w /app maven:3.9.6-eclipse-temurin-21-alpine mvn test
```

Manual API checks: Swagger UI or curl against `/api/auth/login` then authenticated routes.

### Demo checklist

Use [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) flow matrix (login × role, create course, enroll, pay, submit).

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
- Fresh demo DB (full Flyway reseed V1–V4): `docker compose down -v && docker compose up --build`.

### Frontend calls wrong API / CORS errors

- Confirm `NEXT_PUBLIC_API_URL` ends with `/api`.
- Rebuild frontend after changing `NEXT_PUBLIC_*` (inlined at build time).
- Add production origin to `CorsConfig` if not covered.

### SePay payment succeeds but enrollment stays `PENDING_PAYMENT`

- IPN URL must be public HTTPS and registered in SePay portal.
- Header `X-Secret-Key` must match `SEPAY_SECRET_KEY`.
- Tunnel hostnames change on restart — update portal + `.env`. See [docs/SEPAY_SETUP.md](docs/SEPAY_SETUP.md).

### JWT / 401 on every request

- Login again; token may be expired (24h).
- Ensure `Authorization: Bearer <token>` is sent; clear broken localStorage auth state.

### File upload / stream materials missing after restart

- Local disk under `ams-backend/storage/` (or Compose volume `ams_storage`) is for demos. Prefer Cloudinary / durable object storage in production (Render filesystem is ephemeral).

### Course management errors

- **`502` on `POST /api/courses/{id}/ai/outline`** — check `GEMINI_API_KEY` is set for the backend process/container and the model name is valid. The response message distinguishes missing key, quota, timeout, and unusable JSON.
- **`409 Course code already exists`** — codes are unique and stored uppercase; pick another code or edit the existing course.
- **`400` when deleting a course** — the course has enrollments. Enrollment is outside this feature; remove the guard only with a migration plan.
- **`403` on save/delete** — only the owning teacher or an admin may modify a course.

### Port already in use

- Frontend `3000`, backend `8080`, Postgres host `5433`. Stop conflicting processes or change mappings in `docker-compose.yml` / `PORT`.

## Contributing notes

- Prefer small, reversible changes; do not break auth, payment, or API contracts without an explicit migration plan.
- Keep secrets out of git (`.gitignore` covers `.env*`, `.tools/`, Playwright reports, DB dumps, IDE junk).
- Document durable status in `docs/PROJECT_STATUS.md` rather than burying it only in chat history.
- License / academic use: SWD392 Group 1 coursework POC unless otherwise stated by the team.
