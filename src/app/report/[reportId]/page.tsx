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
import { ContentSection } from "@/components/ContentSection";

const SUBSCORES: { label: string; key: keyof PerceptionScores }[] = [
  { label: "Technical Credibility", key: "technicalCredibility" },
  { label: "Communication Clarity", key: "communicationClarity" },
  { label: "Consistency",           key: "consistency" },
  { label: "Discoverability",       key: "discoverability" },
  { label: "Profile Completeness",  key: "profileCompleteness" },
];

function scoreLabel(score: number): string {
  if (score >= 70) return "Strong profile — minor gaps remain";
  if (score >= 55) return "Moderate visibility — significant gaps";
  if (score >= 40) return "Below average — high risk of being filtered";
  return "Critical — most recruiters will skip this profile";
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
    loadReport();
  }, [reportId]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p style={{ color: "var(--red)" }}>{error}</p>
          <Link
            href="/analyze"
            className="mt-4 inline-block text-sm underline"
            style={{ color: "var(--accent)" }}
          >
            Run a new analysis →
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
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--accent)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading report...
          </p>
        </div>
      </main>
    );
  }

  const { scores, recruiterNarrative, visibilityGaps, generatedContent, opportunitySignals, githubUsername } = result;

  const shareText = `My GitHub recruiter perception score: ${scores.overall}/100\n\nAnalyzed by LeverageOS — an AI reputation intelligence system that shows you exactly how recruiters see you.\n\nTry it: leverageos.vercel.app`;

  return (
    <main className="min-h-screen flex flex-col">
      <Nav
        subtitle={`@${githubUsername}`}
        right={
          <Link
            href="/analyze"
            className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-current"
            style={{ color: "var(--accent)", borderColor: "var(--border)" }}
          >
            New Analysis
          </Link>
        }
      />

      <div className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">

          {/* Score + Subscores */}
          <div
            className="rounded-2xl p-6 fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-xs font-mono uppercase tracking-widest mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Reputation Intelligence Report · @{githubUsername}
            </p>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-3 shrink-0">
                {showScore && <ScoreRing score={scores.overall} size={160} />}
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    Recruiter Perception Score
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {scoreLabel(scores.overall)}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 w-full">
                {SUBSCORES.map((s, i) => (
                  <SubScoreBar
                    key={s.key}
                    label={s.label}
                    score={scores[s.key] as number}
                    delay={showScore ? i * 120 : 9999}
                  />
                ))}
              </div>
            </div>

            {opportunitySignals.length > 0 && (
              <div
                className="mt-5 pt-5 border-t flex flex-wrap gap-2"
                style={{ borderColor: "var(--border)" }}
              >
                {opportunitySignals.map((signal, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-glow)",
                    }}
                  >
                    ✦ {signal}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recruiter Narrative */}
          <div
            className="rounded-2xl p-6 fade-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
              >
                M
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Marcus Chen
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Senior Technical Recruiter · 9 years experience
                </p>
              </div>
            </div>

            <div
              className="text-sm leading-relaxed space-y-3"
              style={{ color: "var(--text-dim)" }}
            >
              {recruiterNarrative.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Visibility Gaps */}
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
              Your Top Visibility Gaps
            </h2>
            <div className="flex flex-col gap-3">
              {visibilityGaps.map((gap, i) => (
                <div
                  key={gap.id}
                  className="rounded-xl p-5 fade-up"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {gap.title}
                      </span>
                      <ImpactBadge impact={gap.impact} />
                    </div>
                    <span className="text-xs shrink-0 font-mono" style={{ color: "var(--text-muted)" }}>
                      ~{gap.fixTimeMinutes}min fix
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--text-dim)" }}>
                    {gap.description}
                  </p>
                  <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                    Recruiter impact: {gap.recruiterImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Content */}
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
              Ready-to-Post Content
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
              AI-generated for your specific profile. Copy and use immediately.
            </p>
            <ContentSection
              linkedinPost={generatedContent.linkedinPost}
              xThread={generatedContent.xThread}
              githubReadme={generatedContent.githubReadme}
            />
          </div>

          {/* Share CTA */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Your score:{" "}
              <span className="text-gradient">{scores.overall}/100</span>
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-dim)" }}>
              Share your score and fix your gaps to improve it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CopyButton text={shareText} label="Copy Share Text" />
              <Link
                href="/analyze"
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: "var(--surface-2)",
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
    </main>
  );
}
