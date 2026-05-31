"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnalysisResult, PerceptionScores } from "@/lib/types";
import { Nav } from "@/components/Nav";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { ImpactBadge } from "@/components/ImpactBadge";
import { CopyButton } from "@/components/CopyButton";
import { FixKitSection } from "@/components/FixKitSection";
import { OpportunitySection } from "@/components/OpportunitySection";

const SUBSCORES: { label: string; key: keyof PerceptionScores }[] = [
  { label: "Technical Credibility", key: "technicalCredibility" },
  { label: "Communication Clarity", key: "communicationClarity" },
  { label: "Consistency", key: "consistency" },
  { label: "Discoverability", key: "discoverability" },
  { label: "Profile Completeness", key: "profileCompleteness" },
];

function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 70) {
    return { text: "Strong profile - minor gaps remain", color: "var(--green)" };
  }
  if (score >= 55) {
    return {
      text: "Moderate - high leverage fixes available",
      color: "var(--yellow)",
    };
  }
  if (score >= 40) {
    return {
      text: "Below average - packaging is holding you back",
      color: "var(--orange)",
    };
  }
  return {
    text: "Critical - most recruiters will skip this profile",
    color: "var(--red)",
  };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-extrabold mb-5"
      style={{ color: "var(--text)", letterSpacing: "-0.015em" }}
    >
      {children}
    </h2>
  );
}

function AccordionSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <summary
        className="cursor-pointer px-5 py-4"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        <p className="text-sm font-bold">{title}</p>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </summary>
      <div className="p-5">{children}</div>
    </details>
  );
}

function PushReadmeButton({ reportId }: { reportId: string }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  async function handlePush() {
    if (!token.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/apply/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, githubToken: token }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        url?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Failed to push README");
      } else {
        setStatus("success");
        setProfileUrl(data.url ?? "");
        setMessage(data.message ?? "README published");
      }
    } catch {
      setStatus("error");
      setMessage("Network error - check your token and try again");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: "rgba(6,214,160,0.08)",
          border: "1px solid rgba(6,214,160,0.25)",
        }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
          {message} - your profile README is live
        </p>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{
            background: "rgba(6,214,160,0.15)",
            color: "var(--green)",
            border: "1px solid rgba(6,214,160,0.3)",
          }}
        >
          View on GitHub -&gt;
        </a>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5 mt-4"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>
        Push README directly to GitHub
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Paste a Personal Access Token with repo scope. It is sent directly to GitHub and never stored.
      </p>
      <div className="flex gap-2 flex-wrap">
        <input
          type="password"
          placeholder="ghp_your_token_here"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            outline: "none",
          }}
        />
        <button
          onClick={() => void handlePush()}
          disabled={!token.trim() || status === "loading"}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid var(--accent-glow)",
          }}
        >
          {status === "loading" ? "Pushing..." : "Push README"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "var(--red)" }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) throw new Error("Report not found");
        const data = (await res.json()) as AnalysisResult;
        setResult(data);
        setTimeout(() => setShowScore(true), 200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      }
    }
    void loadReport();
  }, [reportId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-4"
            style={{ background: "rgba(255,77,109,0.1)", color: "var(--red)" }}
          >
            x
          </div>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--red)" }}>
            {error}
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent-glow)",
            }}
          >
            Run a new analysis -&gt;
          </Link>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--accent)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading report...
          </p>
        </div>
      </main>
    );
  }

  const {
    scores,
    recruiterNarrative,
    visibilityGaps,
    fixKit,
    opportunitySignals,
    opportunities,
    githubUsername,
    profileEvidence,
  } = result;

  const criticalCount = visibilityGaps.filter((g) => g.impact === "critical").length;
  const highCount = visibilityGaps.filter((g) => g.impact === "high").length;
  const urgentCount = criticalCount + highCount;
  const potentialReach = Math.max(2, Math.min(8, Math.round((100 - scores.overall) / 12)));
  const topGap = visibilityGaps[0];

  const label = scoreLabel(scores.overall);
  const impactMap = [
    {
      title: "Communication Clarity",
      detail: "GitHub bio, README, and repo descriptions make your work legible faster.",
      evidence: fixKit.githubBio.content,
    },
    {
      title: "Discoverability",
      detail: "Pinned repo strategy and headline upgrades improve what recruiters see first.",
      evidence: fixKit.linkedinHeadline.content,
    },
    {
      title: "Consistency",
      detail: "The 30-day plan turns a one-time cleanup into repeatable visible proof.",
      evidence: fixKit.thirtyDayActionPlan.steps[0]?.title ?? "Keep showing up",
    },
  ];

  const shareText = `My GitHub recruiter perception score: ${scores.overall}/100

I used LeverageOS to turn my public GitHub profile into a recruiter-facing fix kit.

Try it: leverageos.vercel.app`;

  return (
    <main className="min-h-screen flex flex-col">
      <Nav
        subtitle={`@${githubUsername}`}
        right={
          <Link
            href="/analyze"
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--surface-2)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            New Analysis
          </Link>
        }
      />

      <div className="flex-1 px-5 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div
            className="rounded-2xl p-5 fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-mono uppercase tracking-widest mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Your impact snapshot
            </p>
            <div className="flex flex-wrap gap-4">
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-help"
                style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)" }}
                title="Median pipeline run is about 90 seconds end-to-end versus roughly 4 hours to write these assets manually."
              >
                <span className="text-lg font-extrabold" style={{ color: "var(--green)" }}>
                  90s
                </span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  vs ~4 hours manually
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-help"
                style={{
                  background: urgentCount > 2 ? "rgba(255,149,51,0.08)" : "rgba(251,191,36,0.08)",
                  border: `1px solid ${urgentCount > 2 ? "rgba(255,149,51,0.2)" : "rgba(251,191,36,0.2)"}`,
                }}
                title={`${criticalCount} critical and ${highCount} high-impact gaps detected.`}
              >
                <span
                  className="text-lg font-extrabold"
                  style={{ color: urgentCount > 2 ? "var(--orange)" : "var(--yellow, #fbbf24)" }}
                >
                  {urgentCount}
                </span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  high-priority fixes
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-help"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
                title={`Estimated from the gap between your current score (${scores.overall}/100) and a stronger public profile.`}
              >
                <span className="text-lg font-extrabold" style={{ color: "var(--blue)" }}>
                  +{potentialReach}x
                </span>
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                  estimated reach if fixed
                </span>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden fade-up"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <div
              className="px-6 pt-6 pb-5"
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Fix Now Report - @{githubUsername}
                  </p>
                  <h1
                    className="text-xl font-extrabold"
                    style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
                  >
                    Built from public GitHub data plus your own positioning context
                  </h1>
                </div>
                <div
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${label.color} 12%, transparent)`,
                    color: label.color,
                    border: `1px solid color-mix(in srgb, ${label.color} 30%, transparent)`,
                  }}
                >
                  {label.text}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {profileEvidence.proofPoints.slice(0, 4).map((point, index) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden fade-up"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            <div
              className="px-6 pt-6 pb-5"
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Start here
                  </p>
                  <h2
                    className="text-xl font-extrabold"
                    style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
                  >
                    Your score and quickest next move
                  </h2>
                </div>
                <div
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${label.color} 12%, transparent)`,
                    color: label.color,
                    border: `1px solid color-mix(in srgb, ${label.color} 30%, transparent)`,
                  }}
                >
                  {label.text}
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-2 shrink-0 mx-auto lg:mx-0">
                {showScore && <ScoreRing score={scores.overall} size={156} />}
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Overall score
                </p>
              </div>

              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Biggest blocker
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "var(--text)" }}>
                      {topGap?.title ?? "No urgent blocker detected"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Best first move
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "var(--text)" }}>
                      Open the Fix Now Kit and apply the GitHub items first.
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      Reach upside
                    </p>
                    <p className="text-sm mt-2 font-semibold" style={{ color: "var(--text)" }}>
                      About +{potentialReach}x if the top fixes are applied.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5 w-full">
                  {SUBSCORES.map((scoreItem, index) => (
                    <SubScoreBar
                      key={scoreItem.key}
                      label={scoreItem.label}
                      score={scores[scoreItem.key] as number}
                      delay={showScore ? index * 100 : 9999}
                    />
                  ))}
                </div>
              </div>
            </div>

            {opportunitySignals.length > 0 && (
              <div className="px-6 pb-5 pt-0 flex flex-wrap gap-2">
                {opportunitySignals.map((signal, index) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-glow)",
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="fade-up">
            <SectionHeading>Fix Now Kit</SectionHeading>
            <p className="text-sm mb-5 -mt-3" style={{ color: "var(--text-dim)" }}>
              Start here. These are the highest-leverage assets to copy, apply, and publish first.
            </p>
            <FixKitSection fixKit={fixKit} />
            <PushReadmeButton reportId={reportId} />
          </div>

          <div className="fade-up flex flex-col gap-4">
            <AccordionSection
              title="What Changes If You Apply This"
              subtitle="A short view of the payoff before the deeper details"
            >
              <div className="grid md:grid-cols-3 gap-4">
                {impactMap.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl p-5"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {item.title}
                    </p>
                    <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                      {item.detail}
                    </p>
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      Example fix: {item.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection
              title="Recruiter Read"
              subtitle="The full simulated recruiter perspective"
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  M
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    Marcus Chen
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Senior Technical Recruiter - AI simulation
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-4"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div
                  className="text-sm leading-relaxed space-y-3"
                  style={{ color: "var(--text-dim)" }}
                >
                  {recruiterNarrative
                    .split("\n\n")
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Top Visibility Gaps"
              subtitle="Open this when you want the full detailed analysis"
            >
              <div className="flex flex-col gap-3">
                {visibilityGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-xl overflow-hidden card-hover"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="flex flex-col gap-3 p-5"
                      style={{
                        borderLeft: `3px solid ${
                          gap.impact === "critical"
                            ? "var(--red)"
                            : gap.impact === "high"
                            ? "var(--orange)"
                            : gap.impact === "medium"
                            ? "var(--yellow)"
                            : "var(--green)"
                        }`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ImpactBadge impact={gap.impact} />
                          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                            {gap.title}
                          </span>
                        </div>
                        <span
                          className="text-xs shrink-0 font-mono px-2 py-0.5 rounded"
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          ~{gap.fixTimeMinutes}min fix
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
                        {gap.description}
                      </p>
                      <p
                        className="text-xs px-3 py-2 rounded-lg"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        Recruiter impact: {gap.recruiterImpact}
                      </p>
                      {gap.evidence.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {gap.evidence.map((fact, index) => (
                            <span
                              key={index}
                              className="text-xs px-3 py-1 rounded-full"
                              style={{
                                background: "var(--surface-2)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {fact}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {opportunities && opportunities.length > 0 && (
              <AccordionSection
                title="Live Opportunities Matching Your Profile"
                subtitle="Open this for matching jobs, hackathons, grants, and OSS options"
              >
                <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>
                  Found via live web search and matched to your stack and experience level.
                </p>
                <OpportunitySection opportunities={opportunities} />
              </AccordionSection>
            )}
          </div>

          <div
            className="rounded-2xl overflow-hidden fade-up"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="px-6 py-8 text-center relative overflow-hidden"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0,212,170,0.07) 0%, transparent 65%)",
                }}
              />
              <p
                className="text-2xl font-extrabold mb-2 relative"
                style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
              >
                Your score: <span className="text-gradient">{scores.overall}/100</span>
              </p>
              <p className="text-sm mb-6 relative" style={{ color: "var(--text-dim)" }}>
                Share the score, then apply the fix kit above to make the next pass stronger.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                <CopyButton text={shareText} label="Copy Share Text" size="lg" />
                <Link
                  href="/analyze"
                  className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Analyze Another Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
