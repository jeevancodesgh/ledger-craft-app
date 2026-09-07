---
name: ledgercraft-agent-roster
description: Defines LedgerCraft specialist agents, ownership boundaries, and Task prompt templates for reconstruction. Use when launching subagents, splitting work across frontend, API, database, auth, or verification, or when the user asks for a multi-agent plan.
---

# Agent roster

Parent session is the Orchestrator. It sequences waves, launches one specialist per concern, and refuses mixed PRs (UI redesign + schema + router move).

Launch specialists with Task `subagent_type: generalPurpose` (explore for inventory-only). Paste the prompt block. Every agent reads `ledgercraft-bootstrap` first, then the listed skills.

## Roster

| Agent | Reads first (after bootstrap) | Owns | Forbidden |
| --- | --- | --- | --- |
| Knowledge Steward | this skill, knowledge-sync, architecture | `TARGET_ARCHITECTURE.md`, `AGENTS.md`, `.cursor/skills`, `.cursor/rules` | Feature code |
| Platform | architecture, tdd | `pnpm-workspace.yaml`, Compose, Vite proxy, `api` bootstrap, CI | Domain SQL, screens |
| Schema | schema-rebuild, tdd, architecture | Drizzle schema, SQL migrations, roles, RLS | React components, Hono routes |
| Contracts | architecture, tdd, vertical-slice | `packages/contracts` Zod only | Drizzle, UI, env |
| API | architecture, tdd, vertical-slice | `api/src/modules/*` | `src/**/*.tsx`, `mobile/**` |
| Auth | architecture, tdd | Better Auth, memberships, Expo/web session config | Invoice math, styling |
| Web | architecture, tdd, vertical-slice, project-guide UI | `src/` Query hooks and UI | Drizzle, mobile native |
| Mobile | architecture, tdd, vertical-slice | `mobile/` | Web router, API SQL |
| Verification | tdd, architecture | Tests only; may add tests in module folders | Shipping implementation without a failing test first |

## Prompt template

```text
You are the <AGENT> specialist for LedgerCraft reconstruction.
    Read and follow: .cursor/skills/ledgercraft-bootstrap/SKILL.md, .cursor/skills/<listed>/SKILL.md, and TARGET_ARCHITECTURE.md.
Wave: <W#>
Goal: <one sentence>
In scope: <paths>
Out of scope: <paths and concerns>
TDD: write/adjust failing tests first; real Postgres for SQL/RLS.
Handoff: list files changed, tests run, blockers, knowledge-sync needed.
Do not commit unless asked.
```

## W4 launch (current wave)

Parent sequences in this order. Do not mix UI redesign.

1. **Contracts** — customer Zod DTOs in `packages/contracts`.
2. **Verification** — failing API tests for list/create/get, org isolation, ownership IDs not from the body.
3. **API** — customers module: route → use case → repository. Bind org via session `set_config`.
4. **Web** then **Mobile** — Query hooks; delete that domain from DataManager. Clients still must not add new `supabase.from`.
5. **Knowledge Steward** — after `pnpm verify:w4` is green.

```text
You are the API specialist for LedgerCraft reconstruction.
Read and follow: .cursor/skills/ledgercraft-bootstrap/SKILL.md, .cursor/skills/ledgercraft-architecture/SKILL.md, .cursor/skills/ledgercraft-tdd/SKILL.md, .cursor/skills/ledgercraft-vertical-slice/SKILL.md, AGENTS.md § Reconstruction agents, and TARGET_ARCHITECTURE.md.
Wave: W4
Goal: Customers CRUD through Hono, scoped to the session organisation.
In scope: packages/contracts customer DTOs, api/src/modules/customers, web Query hook
Out of scope: invoices routes, TanStack Router, apps/ move, cutting clients off Supabase Auth
TDD: write failing tests first; real Postgres for SQL/RLS.
Handoff: list files changed, tests run, blockers, knowledge-sync needed.
Do not commit unless asked.
```

## Parallelism

Safe in parallel: Schema inventory + Platform bootstrap; Contracts + Verification test stubs; Web hooks + Mobile hooks after API is green.

Never parallel: two agents on the same module folder; Schema DDL + API using uncommitted schema; Knowledge Steward while another agent is mid-edit on the same doc.

## Handoff format

```text
Agent:
Wave:
Done:
Tests:
Blocked:
Knowledge updates required:
```
