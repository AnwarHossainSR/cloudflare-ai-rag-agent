# Local Database Setup (Docker Postgres 18 + pgvector)

The backend needs PostgreSQL 18 with the pgvector extension. Use Docker so Windows
does not need manual pgvector DLL installation.

Connection target:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/devdocs
```

Port `5433` avoids conflict with any locally installed Postgres on `5432`.

## 1. Start Postgres + pgAdmin

From the repo root:

```bash
bun run db:up
```

This starts:
- Postgres 18 + pgvector on `localhost:5433`
- pgAdmin at http://localhost:5050

pgAdmin login:
- email: `admin@devdocs.local`
- password: `admin`

In pgAdmin, add server:
- Host: `postgres`
- Port: `5432`
- Database: `devdocs`
- Username: `postgres`
- Password: `postgres`

## 2. Configure `.env`

Set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/devdocs
```

## 3. Run migrations

```bash
bun run migration:run
```

Verify:

```bash
docker compose exec postgres psql -U postgres -d devdocs -c "\dx vector"
docker compose exec postgres psql -U postgres -d devdocs -c "\d document_chunks"
```

## Stop services

```bash
bun run db:down
```
