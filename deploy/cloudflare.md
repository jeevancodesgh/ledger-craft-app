# Cloudflare deploy (Hono + Pages)

Production shape: Pages (Vite SPA) on `easybizinvoice.com`, same-origin `/api/*` via Pages Function proxy to a Node Hono **container**. Postgres is Neon (or any Postgres) through a connection string. Do not use D1.

## Same origin

`BETTER_AUTH_URL` must be the Pages origin so Better Auth cookies are `SameSite=Lax` on `/`.

Set Pages env `API_ORIGIN` to the container origin (no trailing slash). `functions/api/[[path]].ts` forwards `/api/*`.

## API container

```bash
docker build -t ledgercraft-api .
docker run --rm -p 3001:3001 \
  -e API_HOST=0.0.0.0 \
  -e DATABASE_URL=postgres://ledgercraft_app:... \
  -e BETTER_AUTH_URL=https://easybizinvoice.com \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_TRUSTED_ORIGINS=https://easybizinvoice.com \
  ledgercraft-api
```

Migrations are a CI job, never container boot:

```bash
DATABASE_MIGRATE_URL=postgres://ledgercraft_migrator:... pnpm --filter @ledgercraft/api db:migrate
```

Hyperdrive, if used, must be **transaction** pooling. RLS uses `set_config(..., true)` inside `withOrganisationTx`. Session-mode pooling can leak tenants.

## Go-live gate

Do not cut DNS until protected clients have no `supabase.from` for the domains you ship. W5 (idempotency + share tokens) is required for invoices. Expenses/payments/bank are still supabase-js until W6–W8.
