# 🚀 LeverageOS

**AI-powered recruiter signal fixer for developers.**  
Paste a GitHub username, add a little context, and get a recruiter-style audit, a ready-to-use fix kit, and matched opportunities in about 90 seconds.

---

## ✨ What It Does

Strong developers often look weaker than they are because their public GitHub does not explain their value clearly enough.  
LeverageOS turns public GitHub proof into a recruiter-friendly output:

- clearer GitHub bio
- stronger profile README
- better repo descriptions
- pinned repo strategy
- LinkedIn/X copy
- resume bullets
- recruiter-style perception score
- action plan

---

## 🧠 The 6-Agent Flow

| # | Agent | Role |
|---|---|---|
| 1 | **Profile Ingestion** | Collects GitHub profile, repos, README state, activity, and evidence |
| 2 | **Recruiter Simulation** | Produces a recruiter-style first impression |
| 3 | **Visibility Gap Analysis** | Finds the main public positioning mistakes |
| 4 | **Fix Kit Generation** | Writes practical assets the user can copy and apply |
| 5 | **Reputation Scoring** | Scores technical credibility, clarity, consistency, discoverability, and completeness |
| 6 | **Opportunity Scout** | Finds opportunity matches with fallback behavior |

---

## 💡 Why It’s Useful

LeverageOS is built for developers who:

- have real projects
- have public GitHub activity
- are not getting enough recruiter interest
- need practical output, not generic advice

Instead of telling users to “improve your profile,” it gives them the exact copy and structure to use.

---

## 🛠 Key Features

- ⚡ **Fast pipeline** with live SSE progress updates
- 🧾 **Fix Now Kit** with copy-ready assets
- 📊 **Recruiter perception score** shown at the start of the final report
- 🧭 **Cleaner final report** with easier-to-scan sections
- 🔁 **24h result cache** for repeat analyses
- 🛡 **Rate-limited and validated API** for safer public use
- 📄 **One-click README apply** to GitHub profile repo
- 🌐 **Render-ready deployment setup**

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| AI | OpenAI SDK with OpenAI-compatible provider support |
| Primary provider | Groq via `OPENAI_BASE_URL` |
| Data source | GitHub REST API |
| Animations | Framer Motion |
| Runtime | Node.js |

---

## 🧪 Local Setup

### 1. Install

```bash
npm install
```

### 2. Configure env

Create `.env.local` from `.env.example`.

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

## 🧰 Phase 1 Hardening

Phase 1 focused on making the app deployable and safer for public use.

Included:

- in-memory result caching with `?fresh=1` bypass
- in-memory IP rate limiting on `/api/analyze`
- strict request validation
- GitHub username validation before fetches
- health check endpoint
- Render deploy config
- safer env documentation

---

## 🚢 Deploying To Render

This project is configured for a **single long-running Render web service**.

### Render settings

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/api/health`

### Required env vars

- `OPENAI_API_KEY`

### Recommended env vars

- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `GITHUB_TOKEN`
- `USE_WEB_SEARCH`

---

## 📁 Important Files

```text
src/
|-- app/
|   |-- analyze/page.tsx
|   |-- analyzing/[jobId]/page.tsx
|   |-- report/[reportId]/page.tsx
|   `-- api/
|       |-- analyze/route.ts
|       |-- health/route.ts
|       |-- report/[reportId]/route.ts
|       |-- stream/[jobId]/route.ts
|       `-- apply/readme/route.ts
|-- components/
|   |-- FixKitSection.tsx
|   |-- OpportunitySection.tsx
|   `-- CopyButton.tsx
`-- lib/
    |-- orchestrator.ts
    |-- github.ts
    |-- env.ts
    |-- jobStore.ts
    |-- resultCache.ts
    |-- rateLimit.ts
    |-- validation.ts
    `-- agents/
```

---

## ⚠️ Current Limitations

- single-instance architecture for now
- in-memory store means restart clears active state
- without `GITHUB_TOKEN`, GitHub rate limits are much lower
- opportunity search still relies on current fallback behavior unless further upgraded

---

## 📚 Extra Project Docs

For hackathon/submission context, see:

- [PHASE1_STATUS.md](/E:/HACKATHON/leverageos/PHASE1_STATUS.md)
- [PROJECT_DOCUMENTATION.md](/E:/HACKATHON/leverageos/PROJECT_DOCUMENTATION.md)

---

## 📄 License

MIT
