# LeverageOS

**AI-powered developer reputation intelligence.**  
Paste a GitHub username, get a recruiter-grade audit, a ready-to-paste fix kit, and live matched opportunities in under 60 seconds.

---

## What it does

Most developers are invisible to recruiters, not because their work is weak, but because their profile does not communicate it. LeverageOS runs a six-agent analysis pipeline against any GitHub profile and surfaces exactly what is costing you interviews, with copy-paste fixes for every gap it finds.

### The six-agent pipeline

| # | Agent | Output |
|---|-------|--------|
| 1 | **Profile Ingestion** | Fetches GitHub profile, repos, pinned items, activity, and language signals |
| 2 | **Recruiter Simulation** | Streams a realistic recruiter's first-impression assessment |
| 3 | **Visibility Gap Analysis** | Identifies missing signals across profile, content, activity, and discoverability |
| 4 | **Fix Kit Generation** | Produces ready-to-paste GitHub bio, profile README, repo descriptions, LinkedIn headline and about, cold outreach DM, resume bullets, and a 30-day action plan |
| 5 | **Reputation Scoring** | Scores overall credibility plus five sub-dimensions on a 0-100 scale |
| 6 | **Opportunity Scout** | Matches live jobs, hackathons, open-source projects, and grants to the developer's stack and experience level |

Results stream live to the UI as each agent completes, with no page refresh required.

---

## Key features

- **Streaming pipeline UI**: real-time agent progress via SSE, with typewriter effect on the recruiter narrative
- **Fix Kit**: every gap produces a ready-to-use content block, not generic advice
- **Opportunity matching**: uses the OpenAI Responses API with `web_search_preview` when available, then falls back gracefully
- **24h result cache**: repeated analyses for the same username and role can resolve immediately without re-running the full pipeline
- **Abuse protection**: `/api/analyze` is rate limited per IP and validates payloads server-side
- **Fallback resilience**: every agent has a deterministic fallback so the pipeline never hard-fails
- **Report permalinks**: each analysis gets a stable `/report/[id]` URL for sharing
- **One-click README apply**: `/api/apply/readme` can push the generated profile README directly

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI | OpenAI SDK with OpenAI or Groq-compatible endpoints |
| Data | GitHub REST API v3 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Runtime | Node.js on a single long-running host |

---

## Getting started

### Prerequisites

- Node.js 20.9+
- An OpenAI-compatible API key
- A GitHub personal access token (optional, raises public GitHub rate limits)

### 1. Clone and install

```bash
git clone https://github.com/S-idz/LeverageOS.git
cd LeverageOS
npm install
```

### 2. Configure environment

Create `.env.local` in the project root using `.env.example` as a template:

```env
OPENAI_API_KEY=your-provider-api-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
GITHUB_TOKEN=github_pat_your_token_here
USE_WEB_SEARCH=true
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to use

1. Enter a GitHub username.
2. Write a short description of what the developer builds.
3. Optionally specify a target role.
4. Watch the six agents run in real time.
5. Review scores, recruiter narrative, visibility gaps, and fix kit on the report page.
6. Copy any fix directly into your profiles.

To bypass the 24-hour result cache for a forced rerun, call the analyze endpoint with `?fresh=1`.

---

## Project structure

```text
src/
|-- app/
|   |-- page.tsx                    # Landing / input form
|   |-- analyze/page.tsx            # Submission handler
|   |-- analyzing/[jobId]/page.tsx  # Live pipeline progress
|   |-- report/[reportId]/page.tsx  # Final analysis report
|   `-- api/
|       |-- analyze/route.ts        # Starts the pipeline job
|       |-- health/route.ts         # Render health check
|       |-- stream/[jobId]/route.ts # SSE stream endpoint
|       |-- report/[reportId]/      # Fetches completed result
|       `-- apply/readme/route.ts   # Updates GitHub profile README
|-- components/
|   |-- FixKitSection.tsx           # Fix kit display + copy buttons
|   `-- OpportunitySection.tsx      # Matched opportunities cards
`-- lib/
    |-- orchestrator.ts             # Pipeline sequencer
    |-- github.ts                   # GitHub API client
    |-- jobStore.ts                 # In-memory job state
    |-- resultCache.ts              # 24h completed-analysis cache
    |-- rateLimit.ts                # Sliding-window IP limiter
    |-- validation.ts               # Shared request and username validation
    |-- openai.ts                   # Lazy OpenAI client init
    |-- models.ts                   # Model config helpers
    |-- env.ts                      # Validated env vars
    |-- types.ts                    # Shared TypeScript types
    `-- agents/
        |-- recruiter.ts            # Recruiter simulation agent
        |-- gaps.ts                 # Visibility gap analysis agent
        |-- content.ts              # Fix kit generation agent
        |-- scoring.ts              # Reputation scoring agent
        `-- opportunities.ts        # Opportunity scout agent
```

---

## Scoring dimensions

| Dimension | What it measures |
|-----------|------------------|
| **Overall** | Composite recruiter-readiness score |
| **Technical Credibility** | Stars, repo quality, language depth, activity recency |
| **Communication Clarity** | Bio, README, repo descriptions, narrative coherence |
| **Consistency** | Commit frequency, project completeness, follow-through signals |
| **Discoverability** | Topics, pinned repos, searchability, LinkedIn and web presence |
| **Profile Completeness** | All required fields filled, profile README present |

---

## Deploying to Render (free tier)

This repo includes `render.yaml` for a single long-running Node service, which matches the current SSE and in-memory architecture.

1. Push the repo to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Set the environment variables from `.env.example` in the Render dashboard.
4. Keep the included commands:
   - Build: `npm install && npm run build`
   - Start: `npm run start`
5. Use `/api/health` as the health check path.

Notes:

- `next start` in Next.js 16 honors Render's `PORT` environment variable, so no custom server is required.
- The included job store, result cache, and rate limiter are all in-memory and assume a single instance.
- If you later move to multiple instances, replace the store, limiter, and cache with Redis or another shared backend.

---

## Limitations

- **Single-instance assumption**: the in-memory job store, result cache, and rate limiter are designed for one long-running Node host such as Render free tier.
- **In-memory persistence**: jobs and cached results are lost on server restart.
- **Rate limits**: without a `GITHUB_TOKEN`, the GitHub API allows only 60 unauthenticated requests per hour.
- **Web search**: `web_search_preview` requires OpenAI Responses API access. If unavailable, the opportunity scout falls back to model knowledge.

---

## License

MIT
