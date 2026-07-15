---
name: Browser apps can't enforce OS-level app/website blocking
description: What to build instead when a user asks for "block distracting apps" (Regain/Opal-style) features in a browser web app.
---

A web app cannot block other native apps or browser tabs at the OS level — there is no API for it from a normal browser context. When a user asks for app-blocking / distraction-blocking features (e.g. "block Instagram/TikTok during study time"), don't overpromise a real block.

**Why:** No browser API can terminate or hide other applications or enforce a system-wide block; that requires a native OS extension/agent outside a web app's sandbox.

**How to apply:** Reframe as an in-app accountability system instead:
- A user-managed "blocklist" of named distractions (just labels/categories, not enforced blocking).
- A focus-lock signal during timed sessions using the Page Visibility API (`document.hidden` / `visibilitychange`) to detect when the user tabs away or backgrounds the browser — this only detects, it cannot prevent.
- A distraction-free streak/stats tracker computed from session history (e.g. consecutive sessions with zero detected tab-switches).
Set this expectation with the user up front before building, so they don't expect literal OS-level blocking.
