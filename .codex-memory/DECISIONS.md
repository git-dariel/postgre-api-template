# Decisions

## 2026-10-26 — Use layered feature architecture

**Context:** The template needs clear separation between HTTP handling, business rules, and persistence.

**Outcome:** Users requests flow through routes, controllers, services, and repositories. Prisma calls remain in the repository layer.

## 2026-10-26 — Verify PostgreSQL before serving requests

**Context:** Starting the HTTP listener with an unavailable database would expose an unhealthy API.

**Outcome:** `src/server.ts` calls `verifyDatabaseConnection()` before `app.listen()` and aborts startup on failure.

## 2026-10-26 — Keep implementation truth in the repository

**Context:** Cross-project Obsidian notes can become stale or lack application-specific context.

**Outcome:** Project facts and decisions live in `.codex-memory/`; the personal vault contains only a concise project index and reusable knowledge. Current code and requirements override memory when they conflict.

## 2026-10-26 — Sanitize users at the service boundary

**Context:** Prisma user records contain password hashes that must never reach HTTP responses.

**Outcome:** The user service hashes new passwords with bcrypt and converts repository records to a `PublicUser` shape before returning them. Repositories retain responsibility for complete persistence records.
