import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CircleDot,
  Eye,
  FilePenLine,
  GitBranch,
  MessageSquareText,
  Radar,
  Wrench,
  Zap,
} from "lucide-react";
import { Nav } from "@/components/Nav";

const STATS = [
  { value: "90s", label: "average fix-kit time" },
  { value: "6", label: "autonomous agents" },
  { value: "11+", label: "copy-ready outputs" },
];

const PAINS = [
  {
    num: "01",
    title: "You shipped real work.",
    punch: "The profile still whispers.",
    detail:
      "Without a README, repo descriptions, and a clear signal hierarchy, strong projects look smaller than they are.",
    color: "var(--red)",
  },
  {
    num: "02",
    title: "You have technical proof.",
    punch: "It is badly packaged.",
    detail:
      "Recruiters scan for clarity, role fit, and obvious proof. They do not reverse-engineer your GitHub to find it.",
    color: "var(--orange)",
  },
  {
    num: "03",
    title: "You need more visibility.",
    punch: "Not more generic advice.",
    detail:
      "The fastest path is turning the work you already shipped into better profile copy, better repo framing, and better social proof.",
    color: "var(--yellow)",
  },
];

const AGENTS = [
  {
    n: "01",
    title: "Profile Ingestion",
    desc: "Collects public GitHub evidence: repos, activity, README state, bio quality, language mix, and proof points.",
    Icon: GitBranch,
  },
  {
    n: "02",
    title: "Recruiter Simulation",
    desc: "Reads your profile like a recruiter and tells you what lands fast, what confuses them, and what gets skipped.",
    Icon: Eye,
    active: true,
  },
  {
    n: "03",
    title: "Gap Analysis",
    desc: "Ranks the biggest blockers by severity, effort, and recruiter impact.",
    Icon: Radar,
  },
  {
    n: "04",
    title: "Fix Kit Generation",
    desc: "Builds the exact copy and positioning assets you can apply right away.",
    Icon: Wrench,
  },
  {
    n: "05",
    title: "Reputation Scoring",
    desc: "Scores technical credibility, communication, consistency, discoverability, and completeness.",
    Icon: BarChart3,
  },
  {
    n: "06",
    title: "Opportunity Scout",
    desc: "Searches the live web via OpenAI Responses API to find matching jobs, hackathons, grants, and open-source projects.",
    Icon: Radar,
  },
];

const OUTCOMES = [
  {
    Icon: FilePenLine,
    label: "Fix Now Kit",
    sub: "Bio, README, repo descriptions, pinned plan",
  },
  {
    Icon: Eye,
    label: "Recruiter Read",
    sub: "A fast, blunt profile assessment",
  },
  {
    Icon: CircleDot,
    label: "Perception Score",
    sub: "5-dimension recruiter view",
  },
  {
    Icon: MessageSquareText,
    label: "Social Proof Copy",
    sub: "LinkedIn post, X thread, and more",
  },
  {
    Icon: FilePenLine,
    label: "Resume Bullets",
    sub: "STAR-format bullets ready to paste",
  },
  {
    Icon: MessageSquareText,
    label: "Cold Outreach DM",
    sub: "Personalized recruiter message template",
  },
  {
    Icon: Radar,
    label: "Live Opportunities",
    sub: "Jobs, hackathons, grants — found in real time",
  },
  {
    Icon: BookOpen,
    label: "30-Day Plan",
    sub: "Small actions that compound into better visibility",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <Nav subtitle="Reputation Fixer" />

      <section className="hero-shell">
        <div className="page-shell hero-grid">
          <div className="hero-copy fade-up">
            <div className="eyebrow">
              <Zap size={14} />
              6 autonomous agents · OpenAI Responses API · live web search
            </div>

            <h1>Stop letting strong work look weak at recruiter speed.</h1>

            <p className="hero-lede">
              Paste your GitHub username, add a little context, and get a recruiter read plus the exact fixes to apply: better bio, better README, better repo framing, and better social proof.
            </p>

            <div className="hero-actions">
              <Link href="/analyze" className="button-primary">
                Build my fix kit
                <ArrowRight size={18} />
              </Link>
              <span>Public GitHub only. No account. No LinkedIn scraping.</span>
            </div>

            <div className="stats-row" aria-label="Product stats">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-preview fade-up fade-up-2">
            <div className="preview-header">
              <div>
                <p>Example fix kit</p>
                <h2>@alexdev</h2>
              </div>
              <div className="score-pill">
                <strong>43</strong>
                <span>/100</span>
              </div>
            </div>

            <div className="preview-body">
              {[
                { label: "GitHub Bio", score: 100, color: "var(--accent)" },
                { label: "README Rewrite", score: 100, color: "var(--blue)" },
                { label: "Repo Descriptions", score: 100, color: "var(--yellow)" },
                { label: "Pinned Repo Plan", score: 100, color: "var(--green)" },
                { label: "30-Day Actions", score: 100, color: "var(--orange)" },
              ].map((bar) => (
                <div className="score-row" key={bar.label}>
                  <div>
                    <span>{bar.label}</span>
                    <strong style={{ color: bar.color }}>ready</strong>
                  </div>
                  <div className="score-track">
                    <span
                      style={{
                        width: `${bar.score}%`,
                        background: bar.color,
                        boxShadow: `0 0 16px ${bar.color}55`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="quote-card">
              <div className="avatar">M</div>
              <div>
                <strong>Marcus Chen</strong>
                <span>Senior technical recruiter</span>
                <p>
                  "There is real work here, but the profile still makes me do too much interpretation. The fixes are obvious once you package the proof better."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="page-shell">
          <div className="section-heading">
            <p>What you get</p>
            <h2>Not just a score. A fix kit you can apply today.</h2>
          </div>

          <div className="outcome-grid">
            {OUTCOMES.map(({ Icon, label, sub }) => (
              <div className="outcome-card" key={label}>
                <Icon size={22} />
                <strong>{label}</strong>
                <span>{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band section-muted">
        <div className="page-shell">
          <div className="section-heading align-left">
            <p>The invisible problem</p>
            <h2>Strong engineering work still loses if the profile packaging is weak.</h2>
          </div>

          <div className="pain-grid">
            {PAINS.map((pain) => (
              <article className="pain-card" key={pain.num}>
                <span style={{ color: pain.color }}>{pain.num}</span>
                <h3>{pain.title}</h3>
                <strong style={{ color: pain.color }}>{pain.punch}</strong>
                <p>{pain.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="page-shell pipeline-layout">
          <div className="section-heading align-left">
            <p>How it works</p>
            <h2>One pipeline turns raw GitHub evidence into clearer recruiter signal.</h2>
          </div>

          <div className="pipeline-list">
            {AGENTS.map(({ Icon, n, title, desc, active }) => (
              <div className={active ? "agent-step active" : "agent-step"} key={n}>
                <div className="agent-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="agent-title">
                    <span>{n}</span>
                    <h3>{title}</h3>
                    {active && <em>streaming</em>}
                  </div>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band section-muted">
        <div className="page-shell">
          <div className="section-heading align-left">
            <p>Built for one type of person</p>
            <h2>The developer who ships real work but gets zero recruiter responses.</h2>
          </div>

          <div className="pain-grid">
            <article className="pain-card">
              <span style={{ color: "var(--accent)" }}>Who</span>
              <h3>Developer, 1–5 years experience</h3>
              <strong style={{ color: "var(--accent)" }}>Actively job searching or freelancing</strong>
              <p>Has 3–20 public GitHub repos, strong technical output, but profile packaging is losing them opportunities they deserve.</p>
            </article>
            <article className="pain-card">
              <span style={{ color: "var(--blue)" }}>Problem</span>
              <h3>4+ hours to do this manually</h3>
              <strong style={{ color: "var(--blue)" }}>Most developers skip it entirely</strong>
              <p>Writing a README, bio, repo descriptions, LinkedIn post, and X thread from scratch takes a full workday — so it never gets done.</p>
            </article>
            <article className="pain-card">
              <span style={{ color: "var(--green)" }}>What they get</span>
              <h3>All of it in 90 seconds</h3>
              <strong style={{ color: "var(--green)" }}>Zero writing. One click to publish.</strong>
              <p>6 agents run, the README pushes directly to GitHub, and live opportunities surface — all with no human steps in between.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="page-shell">
          <div className="cta-panel">
            <BadgeCheck size={28} />
            <h2>Your stronger profile is one pass away.</h2>
            <p>
              Get the recruiter read, apply the fixes, and walk away with better profile copy and clearer public proof.
            </p>
            <Link href="/analyze" className="button-primary">
              Start free analysis
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell">
          <span>LeverageOS</span>
          <span>Reputation fixer for developers</span>
        </div>
      </footer>
    </main>
  );
}
