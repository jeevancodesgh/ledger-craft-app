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
