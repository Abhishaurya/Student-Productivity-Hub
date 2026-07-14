---
name: User-provided OpenAI key path
description: Fallback path for AI features when Replit's managed OpenAI AI Integration is unavailable/declined.
---

Replit's managed AI Integrations proxy for OpenAI can be unavailable (e.g. account status `awaiting_account_upgrade`) or the user may decline the upgrade prompt. Per instructions, do not retry `setupReplitAIIntegrations` in that case.

**Why:** the proxy path requires an account-level entitlement that not all users have or want to enable; forcing a retry just re-surfaces the same blocked state.

**How to apply:** request the user's own key via the environment-secrets flow (`OPENAI_API_KEY`), then use the `openai` npm SDK directly server-side (`new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`) instead of importing the `@workspace/integrations-openai-ai-server`-style proxy package. Wrap calls in try/catch and surface upstream errors (e.g. 429 quota) as a clean JSON 502 response rather than letting the raw SDK error/stack leak to the client.
