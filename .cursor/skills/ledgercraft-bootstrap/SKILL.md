---
name: ledgercraft-bootstrap
description: Start-here operating instructions for LedgerCraft reconstruction. Use at the beginning of any session, when verifying W1, continuing W2+, launching specialist agents, or when the user mentions reconstruction, Hono, verify, pnpm workspace, or lost database.
---

# LedgerCraft bootstrap

Read this before writing code. Then follow the named skill for the wave you are on.

## You are here (2026-09-07)

| Fact | Detail |
| --- | --- |
| Live `public` schema | Empty. `auth.users` = 0. Storage empty. Data gone. |
| Identity cutover | Skip UUID preservation. No users to import. |
| W0 | Done (skills, rules, docs). |
| W1 | **Verified.** `pnpm verify:w1` is green (contracts, health/RLS, typecheck). Migrator needs `CREATE` on the database so Drizzle can create the `drizzle` schema. |
| W2 | **Verified.** `pnpm verify:w2` green. Compatibility product schema on `55432`. |
| W3 | **Verified (2026-09-05).** `pnpm verify:w3` green. Better Auth email/password, `/api/me` binds org. Clients stay on Supabase Auth. |
| W4 | **Verified (2026-09-07).** `pnpm verify:w4` green. Customers CRUD via Hono. Web invoices still `supabase-js`. |
| Git | `origin/mobile-app` = W1 (`fd62f9a`). Local `mobile-app` has W2 (`33cf075`), W3 (`b758b32`), and W4 customers in the working tree. |
| Clients | Still `supabase-js` → hosted Supabase for invoices and Auth. Customer CRUD is Hono when `VITE_CUSTOMERS_API=true`. |

## Pickup

1. Read `AGENTS.md` § Reconstruction agents (what shipped, W5 invoices, `accounts` name clash).
2. If this clone does not contain `api/src/modules/customers/`, W4 is missing — do not start W5.
3. Commit/push if origin is behind and the user asks.

## First command

```bash
pnpm install
pnpm db:up
pnpm verify:w4
```

If `pnpm-lock.yaml` changes, commit it. Next wave is W5 (invoices). Dev smoke:

```bash
pnpm dev:api          # 127.0.0.1:3001
pnpm dev              # Vite :8080, proxies /api
curl -s localhost:8080/api/healthz
curl -s localhost:8080/api/me
```

## Env and ports

See `.env.example`.

| Name | Value |
| --- | --- |
| Postgres host port | **55432** (container 5432). Avoids other stacks on 5432. |
| `DATABASE_URL` | `postgres://ledgercraft_app:app@127.0.0.1:55432/ledgercraft` |
| `DATABASE_MIGRATE_URL` | `postgres://ledgercraft_migrator:migrator@127.0.0.1:55432/ledgercraft` |
| `DATABASE_ADMIN_URL` | `postgres://postgres:postgres@127.0.0.1:55432/ledgercraft` (local only) |
| `API_PORT` | `3001` |

API process uses the **app** role. Migrations and test seed use the **migrator** role. Never connect the API as superuser, `BYPASSRLS`, or table owner.

## Layout (do not move yet)

```text
src/                     web (Vite). Stays here until W9.
mobile/                  Expo. Not in the pnpm workspace yet.
api/                     Hono + Drizzle + tests
packages/contracts/      Zod DTOs only
docker/postgres/init/    roles
api/drizzle/             0000 probe + 0001 compatibility + 0002 identity
TARGET_ARCHITECTURE.md   end-state spec
AGENTS.md                this project’s agent guide
.cursor/skills/          procedures
.cursor/rules/           always-on gates
```

Do not move `src/` → `apps/web` or `mobile/` → `apps/mobile` until every protected path uses Hono.

## Skill index (read the one that matches the work)

| Skill | When |
| --- | --- |
| `ledgercraft-architecture` | Any API, DB, auth, storage, email, AI |
| `ledgercraft-tdd` | Implementing or testing a slice |
| `ledgercraft-schema-rebuild` | Tables, Drizzle, RLS, compatibility schema |
| `ledgercraft-vertical-slice` | Cutting over one domain to Hono |
| `ledgercraft-agent-roster` | Launching Task subagents |
| `ledgercraft-knowledge-sync` | End of a wave or when docs drift |

## Agent roster (short)

Parent chat = Orchestrator. Task `generalPurpose` + prompt in `ledgercraft-agent-roster`.

| Next wave | Launch |
| --- | --- |
| Finish W1/W2/W3/W4 | Done (`pnpm verify:w4`) |
| W5 | Contracts → Verification (failing tests) → API → Web → Mobile |

## Hard no

- Replay `supabase/migrations` or `migrations/*.sql` in order
- `api/vendor` or unpkg vendoring
- New client `supabase.from`, Storage SDK, Edge Function, `VITE_OPENAI_*`
- Better Auth + Supabase sessions both authorizing data
- UI redesign + TanStack Router + `apps/` move + data cutover in one change
- Mock Drizzle in SQL/RLS/transaction tests
- Start W5 without W4 customers routes and a working `/api/me` session bind
- Commit unless the user asked

## After any change

Run `ledgercraft-knowledge-sync`. Write present-tense facts in `TARGET_ARCHITECTURE.md` and `AGENTS.md`.
