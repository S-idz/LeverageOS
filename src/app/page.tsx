import Link from "next/link";
import { Nav } from "@/components/Nav";

/* ── Static data ─────────────────────────────────────────── */
const STATS = [
  { value: "90s",  label: "full analysis" },
  { value: "5",    label: "AI agents" },
  { value: "47K+", label: "devs analyzed" },
];

const PAINS = [
  {
    icon: "◈",
    title: "You've shipped real projects.",
    sub: "Nobody knows.",
    detail: "11 of 14 repos have no description. A recruiter spends 45 seconds on your profile and moves on — without reading a single line of code.",
  },
  {
    icon: "◉",
    title: "You have 200+ commits.",
    sub: "It looks like zero.",
    detail: "No profile README. No bio. No activity narrative. Your GitHub says nothing about who you are or what you can build.",
  },
  {
    icon: "◎",
    title: "You're applying everywhere.",
    sub: "Getting nothing back.",
    detail: "The internet rewards visibility and storytelling — not raw skill. You're technically strong and completely invisible.",
  },
];

const AGENTS = [
  {
    n: "01", icon: "◈",
    title: "Profile Ingestion",
    desc: "Fetches repos, commit activity, README state, bio, and language signals from GitHub's public API.",
  },
  {
    n: "02", icon: "◉",
    title: "Recruiter Simulation",
    desc: "A simulated senior recruiter reviews your profile and streams their unfiltered, honest assessment.",
  },
  {
    n: "03", icon: "◎",
    title: "Visibility Gap Analysis",
    desc: "Hybrid rules-engine + LLM identifies your top 5 missing signals with impact ratings and fix times.",
  },
  {
    n: "04", icon: "◆",
    title: "Content Generation",
    desc: "Writes a LinkedIn post, X thread, and GitHub README tailored to your exact profile — in parallel.",
  },
  {
    n: "05", icon: "◐",
    title: "Reputation Scoring",
    desc: "Scores 5 dimensions: Technical Credibility, Communication, Consistency, Discoverability, Completeness.",
  },
];

/* ── Mock score preview (static, no JS needed) ────────────── */
const PREVIEW_BARS = [
  { label: "Technical Credibility", score: 71, color: "var(--green)" },
  { label: "Communication Clarity", score: 28, color: "var(--red)" },
  { label: "Consistency",           score: 55, color: "var(--yellow)" },
  { label: "Discoverability",       score: 19, color: "var(--red)" },
  { label: "Profile Completeness",  score: 62, color: "var(--yellow)" },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Nav subtitle="Reputation Intelligence" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 py-28 text-center overflow-hidden dot-grid hero-glow">

        {/* Ambient blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,212,170,0.06) 0%, transparent 65%)",
          }}
        />

        {/* Live badge */}
        <div
          className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono mb-8 fade-up"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid var(--accent-glow)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          5 Autonomous Agents · Real-Time Intelligence
        </div>

        {/* Headline */}
        <h1
          className="relative text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl mb-6 fade-up fade-up-1"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          Find out how recruiters
          <br />
          <span className="text-gradient">actually see you.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="relative text-base md:text-lg max-w-lg mb-10 leading-relaxed fade-up fade-up-2"
          style={{ color: "var(--text-dim)" }}
        >
          Paste your GitHub username. 90 seconds later, you have your{" "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            Reputation Intelligence Report
          </span>{" "}
          — recruiter perception, visibility gaps, ready-to-post content.
        </p>

        {/* CTA group */}
        <div className="relative flex flex-col sm:flex-row items-center gap-3 mb-14 fade-up fade-up-3">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-100"
            style={{
              background: "var(--accent)",
              color: "#07090d",
              boxShadow: "0 0 24px var(--accent-glow)",
            }}
          >
            Analyze My Profile
            <span style={{ fontSize: "1.1em" }}>→</span>
          </Link>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Free · No account · 90 seconds
          </span>
        </div>

        {/* Stats row */}
        <div className="relative flex items-center gap-10 fade-up fade-up-4">
          {STATS.map((s, i) => (
            <div key={s.label} className="text-center">
              {i > 0 && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 hidden sm:block"
                  style={{ background: "var(--border)" }}
                />
              )}
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Preview card ─────────────────────────────────── */}
      <section
        className="border-t border-b px-6 py-16"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-center text-xs uppercase tracking-widest font-mono mb-10"
            style={{ color: "var(--text-muted)" }}
          >
            Example output
          </p>

          <div
            className="rounded-2xl p-6 glow-card"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  Reputation Intelligence Report · @alexdev
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Recruiter Perception Score
                </p>
              </div>
              {/* Big score badge */}
              <div
                className="flex items-baseline gap-1"
                style={{ color: "var(--yellow)" }}
              >
                <span className="text-4xl font-bold">43</span>
                <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>

            {/* Bars */}
            <div className="flex flex-col gap-3 mb-5">
              {PREVIEW_BARS.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {bar.label}
                    </span>
                    <span className="text-xs font-mono font-bold" style={{ color: bar.color }}>
                      {bar.score}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${bar.score}%`, background: bar.color, boxShadow: `0 0 6px ${bar.color}44` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recruiter quote excerpt */}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  M
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
                  Marcus Chen · Sr. Technical Recruiter
                </span>
              </div>
              <p className="text-xs leading-relaxed italic" style={{ color: "var(--text-muted)" }}>
                &ldquo;Strong commit history, but 11 of 14 repositories have no description. I can&apos;t tell which projects are production-quality and which are tutorials. Without that context, I&apos;m spending extra time I don&apos;t have — and I&apos;ll move on.&rdquo;
              </p>
            </div>

            {/* CTA overlay */}
            <div className="text-center mt-5">
              <Link
                href="/analyze"
                className="text-sm font-semibold transition-all hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                See yours → free analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain points ──────────────────────────────────── */}
      <section className="border-b px-6 py-20" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <p
            className="text-center text-xs uppercase tracking-widest font-mono mb-12"
            style={{ color: "var(--text-muted)" }}
          >
            The invisible problem
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {PAINS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl p-6 card-hover"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="text-2xl mb-4" style={{ color: "var(--accent)" }}>
                  {p.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                  {p.title}
                </h3>
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--text-dim)" }}
                >
                  {p.sub}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent pipeline ───────────────────────────────── */}
      <section
        className="border-b px-6 py-20"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="max-w-2xl mx-auto">
          <p
            className="text-center text-xs uppercase tracking-widest font-mono mb-12"
            style={{ color: "var(--text-muted)" }}
          >
            5-agent autonomous pipeline
          </p>

          <div className="relative flex flex-col gap-0">
            {/* Connector line */}
            <div
              className="absolute left-[22px] top-6 bottom-6 w-px"
              style={{ background: "var(--border)" }}
            />

            {AGENTS.map((a, i) => (
              <div key={a.n} className="flex gap-4 items-start py-4 relative">
                {/* Node */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 z-10 font-bold text-sm"
                  style={{
                    background: i === 1 ? "var(--accent-dim)" : "var(--surface-2)",
                    border: `1px solid ${i === 1 ? "var(--accent-glow)" : "var(--border)"}`,
                    color: i === 1 ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 pt-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {a.n}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {a.title} Agent
                    </span>
                    {i === 1 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                      >
                        streaming
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {a.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base transition-all hover:scale-[1.03]"
              style={{
                background: "var(--accent)",
                color: "#07090d",
                boxShadow: "0 0 20px var(--accent-glow)",
              }}
            >
              Run the pipeline on my profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        className="px-8 py-5 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent)", color: "#07090d" }}
          >
            L
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            LeverageOS
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Reputation Intelligence · Autonomous AI · Hackathon build
        </p>
      </footer>
    </main>
  );
}
