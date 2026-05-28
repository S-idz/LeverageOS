# LeverageOS

**AI-powered developer reputation intelligence.**  
Paste a GitHub username, get a recruiter-grade audit, a ready-to-paste fix kit, and live matched opportunities — in under 60 seconds.

---

## What it does

Most developers are invisible to recruiters — not because their work is weak, but because their profile doesn't communicate it. LeverageOS runs a six-agent analysis pipeline against any GitHub profile and surfaces exactly what is costing you interviews, with copy-paste fixes for every gap it finds.

### The six-agent pipeline

| # | Agent | Output |
|---|-------|--------|
| 1 | **Profile Ingestion** | Fetches GitHub profile, repos, pinned items, activity, and language signals |
| 2 | **Recruiter Simulation** | Streams a realistic recruiter's first-impression assessment |
| 3 | **Visibility Gap Analysis** | Identifies missing signals across profile, content, activity, and discoverability |
| 4 | **Fix Kit Generation** | Produces ready-to-paste GitHub bio, profile README, repo descriptions, LinkedIn headline & about, cold outreach DM, resume bullets, and a 30-day action plan |
| 5 | **Reputation Scoring** | Scores overall credibility plus five sub-dimensions on a 0–100 scale |
| 6 | **Opportunity Scout** | Matches live jobs, hackathons, open-source projects, and grants to the developer's stack and experience level |

Results stream live to the UI as each agent completes, with no page refresh required.

---

## Key features

- **Streaming pipeline UI** — real-time agent progress via SSE, with typewriter effect on the recruiter narrative
- **Fix Kit** — every gap produces a ready-to-use content block, not generic advice
- **Opportunity matching** — uses the OpenAI Responses API with `web_search_preview` when available, falls back to model knowledge gracefully
- **Fallback resilience** — every agent has a deterministic fallback so the pipeline never hard-fails
- **Report permalinks** — each analysis gets a stable `/report/[id]` URL for sharing
- **One-click README apply** — `/api/apply/readme` endpoint delivers the generated profile README directly

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI | OpenAI GPT-4o / GPT-4o-mini (chat + Responses API) |
| Data | GitHub REST API v3 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Runtime | Node.js (in-memory job store) |

---

## Getting started

### Prerequisites

- Node.js 18+
- An OpenAI API key (`gpt-4o` or `gpt-4o-mini` access)
- A GitHub personal access token (optional, raises rate limits)

### 1. Clone and install

```bash
git clone https://github.com/S-idz/LeverageOS.git
cd LeverageOS
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
# Required
OPENAI_API_KEY=sk-...

# Optional — raises GitHub API rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=ghp_...

# Optional — set to "false" to disable web search (uses model knowledge instead)
USE_WEB_SEARCH=true

# Optional — override the default chat model
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to use

1. Enter a GitHub username
2. Write a one-line description of what the developer builds
3. Optionally specify a target role
4. Watch the six agents run in real time
5. Review scores, recruiter narrative, visibility gaps, and fix kit on the report page
6. Copy any fix directly into your profiles

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Landing / input form
│   ├── analyze/page.tsx            # Submission handler
│   ├── analyzing/[jobId]/page.tsx  # Live pipeline progress
│   ├── report/[reportId]/page.tsx  # Final analysis report
│   └── api/
│       ├── analyze/route.ts        # Starts the pipeline job
│       ├── stream/[jobId]/route.ts # SSE stream endpoint
│       ├── report/[reportId]/      # Fetches completed result
│       └── apply/readme/route.ts   # Returns generated README
├── components/
│   ├── FixKitSection.tsx           # Fix kit display + copy buttons
│   └── OpportunitySection.tsx      # Matched opportunities cards
└── lib/
    ├── orchestrator.ts             # Pipeline sequencer
    ├── github.ts                   # GitHub API client
    ├── jobStore.ts                 # In-memory job state
    ├── openai.ts                   # Lazy OpenAI client init
    ├── models.ts                   # Model config helpers
    ├── env.ts                      # Validated env vars
    ├── types.ts                    # Shared TypeScript types
    └── agents/
        ├── recruiter.ts            # Recruiter simulation agent
        ├── gaps.ts                 # Visibility gap analysis agent
        ├── content.ts              # Fix kit generation agent
        ├── scoring.ts              # Reputation scoring agent
        └── opportunities.ts        # Opportunity scout agent
```

---

## Scoring dimensions

| Dimension | What it measures |
|-----------|-----------------|
| **Overall** | Composite recruiter-readiness score |
| **Technical Credibility** | Stars, repo quality, language depth, activity recency |
| **Communication Clarity** | Bio, README, repo descriptions, narrative coherence |
| **Consistency** | Commit frequency, project completeness, follow-through signals |
| **Discoverability** | Topics, pinned repos, searchability, LinkedIn/web presence |
| **Profile Completeness** | All required fields filled, profile README present |

---

## Limitations

- **In-memory job store** — jobs are lost on server restart. For production, replace `jobStore.ts` with Redis or a database.
- **Rate limits** — without a `GITHUB_TOKEN`, the GitHub API allows 60 unauthenticated requests per hour.
- **Web search** — `web_search_preview` requires OpenAI Responses API access. If unavailable, the opportunity scout falls back to model knowledge.

---

## License

MIT
