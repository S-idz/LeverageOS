# Phase 1 Status

This note was added so the current Codex work survives even if the app chat history does not.

## Scope

Phase 1 target:

- deployable on Render free tier
- abuse-safe public `POST /api/analyze`
- 24h result caching
- strict server-side validation
- health check
- deploy docs and env template

## Implemented

### 1. Result caching

Added 24-hour in-memory completed-result cache keyed by:

```text
${githubUsername.toLowerCase()}::${targetRole ?? ""}
```

Files:

- `src/lib/resultCache.ts`
- `src/lib/orchestrator.ts`

Behavior:

- cache hit returns a job immediately in `complete` state
- cache bypass supported with `?fresh=1`
- cache logs use `[cache]`

### 2. Rate limiting

Added lightweight in-memory sliding-window IP limiter.

Files:

- `src/lib/rateLimit.ts`
- `src/app/api/analyze/route.ts`

Behavior:

- max 5 analyze requests per IP per 10 minutes
- reads IP from `x-forwarded-for`
- returns `429` with JSON error and `Retry-After`

### 3. Input validation

Added shared validation for analyze requests and GitHub usernames.

Files:

- `src/lib/validation.ts`
- `src/app/api/analyze/route.ts`
- `src/lib/github.ts`
- `src/app/api/apply/readme/route.ts`

Behavior:

- username regex:

```text
/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/
```

- `selfDescription` must be 10..2000 chars
- `targetRole` max 120 chars
- bad payloads return `400`
- username is validated before GitHub fetches

### 4. Health check

Added:

- `src/app/api/health/route.ts`

Response shape:

```json
{
  "status": "ok",
  "provider": true,
  "model": true,
  "hasGithubToken": false
}
```

Note:

- booleans only
- no secret values are leaked

### 5. Deploy config and docs

Added or updated:

- `.env.example`
- `render.yaml`
- `README.md`
- `.gitignore`

Behavior:

- `.env.example` now documents:
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL`
  - `OPENAI_MODEL`
  - `GITHUB_TOKEN`
  - `USE_WEB_SEARCH`
- `.gitignore` explicitly allows `.env.example` to be tracked
- `render.yaml` uses:
  - build: `npm install && npm run build`
  - start: `npm run start`
  - health check: `/api/health`

## Existing Phase-1-related edits already present in workspace

These files already had relevant uncommitted changes and were preserved:

- `src/lib/env.ts`
- `src/lib/jobStore.ts`
- `src/lib/orchestrator.ts`
- `src/lib/github.ts`

They include:

- provider config validation
- better GitHub token/rate-limit messaging
- 24h retention for completed jobs in the in-memory job store

## Verification

Production build was run successfully:

```bash
npm run build
```

Result:

- Next.js 16 build passed
- TypeScript passed
- dynamic routes include:
  - `/api/analyze`
  - `/api/health`
  - `/api/report/[reportId]`
  - `/api/stream/[jobId]`

## Current modified files

At the time of writing, the workspace includes these uncommitted changes:

- `.gitignore`
- `README.md`
- `src/app/analyze/page.tsx`
- `src/app/api/analyze/route.ts`
- `src/app/api/apply/readme/route.ts`
- `src/app/report/[reportId]/page.tsx`
- `src/lib/env.ts`
- `src/lib/github.ts`
- `src/lib/jobStore.ts`
- `src/lib/orchestrator.ts`
- `.env.example`
- `render.yaml`
- `src/app/api/health/route.ts`
- `src/lib/rateLimit.ts`
- `src/lib/resultCache.ts`
- `src/lib/validation.ts`

## Important limitation

This Phase 1 implementation is designed for a single long-running host.

If the app later moves to multi-instance hosting, replace these in-memory pieces with Redis or another shared backend:

- job store
- result cache
- rate limiter
