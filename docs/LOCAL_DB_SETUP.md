# Local Database Setup (Postgres 18 + pgvector, no Docker)

The backend needs a local PostgreSQL 18 server with the **pgvector** extension.
Connection target:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devdocs
```

There are two setup pieces. Both touch `C:\Program Files\PostgreSQL\18`, so run them
from an **Administrator** PowerShell.

---

## 1. Password reset + create `devdocs` database

You don't know the `postgres` superuser password. Reset it to `postgres` and create
the app database with the helper script:

```powershell
# In an ELEVATED (Administrator) PowerShell, from the repo root:
powershell -ExecutionPolicy Bypass -File scripts\setup-local-db.ps1
```

It temporarily switches `pg_hba.conf` to `trust`, restarts the service, sets the
password to `postgres`, creates `devdocs`, then restores `pg_hba.conf` and restarts.
At the end it verifies `psql -U postgres` works with the new password.

> Already know the password? Skip the script and just run:
> ```powershell
> $env:PGPASSWORD='<your-password>'
> & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h 127.0.0.1 -c 'CREATE DATABASE devdocs;'
> ```
> and set `DATABASE_URL` accordingly in `.env`.

---

## 2. Install pgvector for Postgres 18

Stock Postgres does not ship pgvector. Pick ONE option:

### Option A — Build from source (official, needs Visual Studio Build Tools)

Requires "Desktop development with C++" (MSVC + nmake). In an **x64 Native Tools
Command Prompt for VS** opened **as Administrator**:

```bat
set "PGROOT=C:\Program Files\PostgreSQL\18"
cd %TEMP%
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

This drops `vector.dll` into `%PGROOT%\lib` and the `vector*` files into
`%PGROOT%\share\extension`.

### Option B — Prebuilt Windows binaries

If you have prebuilt pgvector files matching **PG 18 / x64**, copy:
- `vector.dll` → `C:\Program Files\PostgreSQL\18\lib\`
- `vector.control`, `vector--*.sql` → `C:\Program Files\PostgreSQL\18\share\extension\`

(Copying into Program Files needs Administrator.)

### Option C — Run only Postgres via Docker (fallback)

If installing pgvector natively is painful, run just the database in the official
image while keeping everything else local:

```bash
docker run -d --name devdocs-pg -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=devdocs \
  pgvector/pgvector:pg16
```

(Uses PG16, which already bundles pgvector. `DATABASE_URL` stays the same.)

---

## 3. Verify, then run migrations

After both pieces are done, from the repo root:

```bash
bun --cwd apps/backend run migration:run
```

Then confirm the schema:

```sql
\d document_chunks   -- embedding column should read: vector(1024)
\di idx_chunks_embedding   -- HNSW index present
```
