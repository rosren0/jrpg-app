# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A vanilla JS JRPG-style productivity app — no build step, no bundler, no framework. Open `index.html` directly in a browser or serve it statically (GitHub Pages).

## Running locally

```bash
# Any static file server works, e.g.:
python3 -m http.server 8080
# then open http://localhost:8080
```

There are no build, lint, or test commands.

## Architecture

All state lives in `App.state` (defined in `app.js`). The app is a single-page router: `App.navigate(view)` swaps the main content area by calling `render()` on the matching view module.

**State shape** (from `App.defaultState()`):
```
{ player, skills[], inventory[], finances.entries[], logs[], missions[] }
```

**Persistence** (`utils/storage.js`): every `App.save()` call writes to both `localStorage` and Supabase (if authenticated). On load, Supabase is the source of truth; `localStorage` is the offline/unauthenticated fallback.

**Auth** (`utils/auth.js` + `utils/supabase-config.js`): Google OAuth via Supabase. If Supabase isn't configured or the SDK is absent, the app silently falls back to offline mode (no login required).

**Views** (`views/*.js`): each file exports a module with a `render()` function that returns an HTML string injected into the DOM. Views call `App.save()` after mutations.

**Utilities:**
- `utils/xp.js` — XP/level math; `XP.calc(totalXP)`, `XP.add(skill, amount)`
- `utils/ai.js` — DeepSeek API (`deepseek-chat`); API key stored in `localStorage` under `jrpg-deepseek-key`
- `utils/notifications.js` — daily reminder via Web Notifications + `setInterval`
- `utils/export.js` — data export helpers
- `utils/icons.js` — SVG icon strings

## Supabase setup

Credentials are hardcoded in `utils/supabase-config.js`. The `user_data` table uses `user_id` as the conflict key for upserts. When deploying to a new domain, add that origin to **Supabase → Authentication → URL Configuration → Redirect URLs**.

## Service worker

`sw.js` caches the app shell for offline use. Increment the cache version string in `sw.js` whenever static assets change, otherwise users will get stale files.
