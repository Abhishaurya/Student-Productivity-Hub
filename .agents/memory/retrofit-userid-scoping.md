---
name: Retrofitting per-user auth onto a single-user Drizzle schema
description: Checklist of everything that must change together when adding a userId column to previously global tables, so nothing is left unscoped.
---

Adding real auth (e.g. Clerk) to an app that was built single-user (no `userId` anywhere) touches more than the schema — missing any one of these leaves a data leak or a broken build:

**Why:** `userId` needs to be excluded from client-facing insert schemas (server sets it from the auth session, never trusts the client), but every aggregate/summary route that used to scan the whole table now must filter by the current user too, and seed/dev scripts must supply a value for the new not-null column or they stop typechecking/running.

**How to apply**, when adding `userId` to existing tables:
1. Add the column to each table, and add it to every route's WHERE/AND clauses (select, update, delete) — not just the obvious CRUD ones.
2. Omit `userId` from each table's insert-validation schema (client can't set it); set it server-side from the auth middleware's `req.userId` on every insert.
3. Re-audit any "summary"/"stats"/"dashboard" aggregate endpoints that read across multiple tables globally — these are the easiest to miss since they don't look like per-row CRUD.
4. Update seed scripts to pass a constant demo user id on every seeded row, or they'll fail the new not-null constraint.
5. If no default is set on the new not-null column and dev data predates it, a plain schema push will fail — use a force-push accepting dev data loss, or backfill first.
