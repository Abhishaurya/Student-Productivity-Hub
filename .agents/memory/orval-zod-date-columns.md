---
name: Orval zod date coercion vs drizzle date columns
description: Mismatch between orval-generated zod date coercion (produces JS Date) and drizzle day-only date columns (expect string), and how to bridge it.
---

When an OpenAPI schema field is `type: string, format: date` or `format: date-time`, orval's zod codegen emits `zod.coerce.date()`, so parsing a request body/params with the generated zod schema yields a JS `Date` object.

Drizzle's `date(...)` column type (day-only, e.g. `YYYY-MM-DD`) can be configured with `{ mode: "string" }`, in which case its insert/update value type is `string`, not `Date`. Passing a `Date` straight through causes a TS2769 type error at the `db.insert(...).values(...)` / `.set(...)` call site.

**Why:** the OpenAPI/zod layer and the DB layer independently chose different native representations for calendar dates; nothing in the generated code bridges them automatically.

**How to apply:** in the Express route handler, after `safeParse`, convert the coerced `Date` to a `YYYY-MM-DD` string (`date.toISOString().slice(0, 10)`) before passing it into the drizzle insert/update call. For optional fields, guard with a ternary so `undefined` stays `undefined` rather than becoming `"undefined"` or crashing on `.toISOString()`.
