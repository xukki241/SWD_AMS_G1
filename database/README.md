# Database scripts (AMS)

Hand-in / grading SQL for PostgreSQL 16. Equivalent to Flyway `V1`–`V11` in `ams-backend/src/main/resources/db/migration/`.

| File | Purpose |
| ---- | ------- |
| `01_create_schema.sql` | CREATE TABLE / INDEX (final schema) |
| `02_insert_data.sql` | Demo roles, users, courses, enrollments, payments, submissions (exclusive roles) |
| `03_exclusive_roles_cleanup.sql` | Optional: strip dual STUDENT+TEACHER leftovers on old DBs |

**Role rules:** Student = join only. Teacher = create/manage only. Never both.

**Demo password:** `Password@123`  
**Accounts:** `admin`, `teacher1`, `student1`, …

## Recommended: Docker + Flyway (do not double-apply)

```bash
docker compose down -v
docker compose up --build
```

Backend runs Flyway on startup (`V1`…`V12`) and seeds the same demo data. Use the files above for code review / pgAdmin, not on the same empty DB as Flyway.

After pulling role fixes, always rebuild frontend/backend images (`--build`) and prefer `-v` once so V12 exclusive-role cleanup applies. Then **log out / log in** (or wait for session refresh) so JWT no longer carries a stale TEACHER grant on student accounts.

## Manual apply (empty database only)

```bash
# Postgres from Compose only
docker compose up -d postgres

# Wait until healthy, then:
Get-Content database/01_create_schema.sql, database/02_insert_data.sql |
  docker compose exec -T postgres psql -U ams_user -d ams_db
```

If you applied SQL manually and then start the API, either wipe the volume and let Flyway own schema, or baseline Flyway at version `11` so it does not re-run `V1`.

## Host connection

| Setting | Value |
| ------- | ----- |
| Host | `localhost` |
| Port | `5433` |
| Database | `ams_db` |
| User | `ams_user` |
| Password | `ams_password` |
