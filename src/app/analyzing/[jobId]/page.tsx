"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Job, AGENT_ORDER, AgentName } from "@/lib/types";
import { Nav } from "@/components/Nav";

const AGENT_ICONS: Record<AgentName, string> = {
  "Profile Ingestion": "◈",
  "Recruiter Simulation": "◉",
  "Visibility Gap Analysis": "◎",
  "Content Generation": "◆",
  "Reputation Scoring": "◐",
};

const AGENT_DESCRIPTIONS: Record<AgentName, string> = {
  "Profile Ingestion": "Connecting to GitHub API",
  "Recruiter Simulation": "Simulating recruiter perspective",
  "Visibility Gap Analysis": "Scanning for missing signals",
  "Content Generation": "Writing platform-specific content",
  "Reputation Scoring": "Calculating 5-dimension score",
};

export default function AnalyzingPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const streamRef = useRef<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/stream/${jobId}`);
    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string) as {
          type: string;
          data: unknown;
        };

        if (parsed.type === "job_update") {
          const updatedJob = parsed.data as Job;
          setJob(updatedJob);

          const recruiterAgent = updatedJob.agents["Recruiter Simulation"];
          if (recruiterAgent?.streamText && recruiterAgent.streamText !== streamRef.current) {
            streamRef.current = recruiterAgent.streamText;
            setStreamText(recruiterAgent.streamText);
          }

          if (updatedJob.status === "complete" && updatedJob.result) {
            es.close();
            setTimeout(() => {
              router.push(`/report/${updatedJob.result!.id}`);
            }, 800);
          }

          if (updatedJob.status === "error") {
            es.close();
            setError(updatedJob.error ?? "Analysis failed");
          }
        }

        if (parsed.type === "error") {
          es.close();
          setError((parsed.data as { message: string }).message);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setError("Connection lost. Please try again.");
    };

    return () => {
      es.close();
    };
  }, [jobId, router]);

  const completedCount = job
    ? AGENT_ORDER.filter((a) => job.agents[a]?.status === "complete").length
    : 0;
  const progress = (completedCount / AGENT_ORDER.length) * 100;
  const isComplete = job?.status === "complete";
  const recruiterStatus = job?.agents["Recruiter Simulation"]?.status;

  return (
    <main className="min-h-screen flex flex-col">
      <Nav subtitle="Step 2 of 3 — Analysis" />

      <div className="flex flex-1 items-start justify-center px-5 py-10">
        <div className="w-full max-w-3xl flex flex-col gap-6">

          {/* ── Status header ─────────────────────────── */}
          <div className="fade-up">
            <div className="flex items-center gap-2 mb-2">
              {isComplete ? (
                <span className="text-sm" style={{ color: "var(--accent)" }}>✓</span>
              ) : (
                <span
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                {isComplete ? "Complete" : "Running"}
              </span>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
            >
              {isComplete
                ? "Report ready. Redirecting..."
                : "Analyzing your reputation..."}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
              {isComplete
                ? "5 agents complete."
                : "5 agents running in sequence. Watch the recruiter perspective stream live."}
            </p>
          </div>

          {/* ── Progress bar ──────────────────────────── */}
          <div
            className="rounded-full h-1 overflow-hidden"
            style={{ background: "var(--surface-3)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: isComplete ? "var(--green)" : "var(--accent)",
                boxShadow: `0 0 10px ${isComplete ? "var(--green)" : "var(--accent-glow)"}`,
              }}
            />
          </div>

          {/* ── Two-column layout ─────────────────────── */}
          <div className="grid md:grid-cols-5 gap-4">

            {/* Agent list — narrower column */}
            <div className="md:col-span-2 flex flex-col gap-2">
              {AGENT_ORDER.map((agentName) => {
                const agent = job?.agents[agentName];
                const status = agent?.status ?? "pending";
                const isRunning = status === "running";
                const isDone = status === "complete";

                return (
                  <div
                    key={agentName}
                    className="rounded-xl px-4 py-3 transition-all duration-300"
                    style={{
                      background: isRunning
                        ? "var(--accent-dim)"
                        : isDone
                        ? "var(--surface-2)"
                        : "var(--surface)",
                      border: `1px solid ${
                        isRunning
                          ? "var(--accent-glow)"
                          : isDone
                          ? "var(--border-hover)"
                          : "var(--border)"
                      }`,
                      opacity: status === "pending" ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Status icon */}
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{
                          background: isDone
                            ? "rgba(6,214,160,0.15)"
                            : isRunning
                            ? "var(--accent-dim)"
                            : "var(--surface-3)",
                        }}
                      >
                        {isDone ? (
                          <span className="text-xs" style={{ color: "var(--green)" }}>✓</span>
                        ) : isRunning ? (
                          <span
                            className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin"
                            style={{ color: "var(--accent)" }}
                          />
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {AGENT_ICONS[agentName]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: isDone || isRunning ? "var(--text)" : "var(--text-muted)" }}
                        >
                          {agentName}
                        </p>
                        {(isDone || isRunning) && (
                          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {agent?.message ?? AGENT_DESCRIPTIONS[agentName]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recruiter stream — wider column */}
            <div
              className="md:col-span-3 rounded-xl flex flex-col overflow-hidden"
              style={{
                background: "var(--surface)",
                border: `1px solid ${
                  recruiterStatus === "running" ? "var(--accent-glow)" : "var(--border)"
                }`,
                minHeight: "280px",
                transition: "border-color 0.3s",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  M
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                    Marcus Chen · Sr. Technical Recruiter
                  </p>
                </div>
                {recruiterStatus === "running" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                {recruiterStatus === "complete" && (
                  <span className="text-xs" style={{ color: "var(--green)" }}>✓ done</span>
                )}
              </div>

              {/* Stream content */}
              <div className="flex-1 p-4 overflow-y-auto">
                {streamText ? (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {streamText}
                    {recruiterStatus === "running" && (
                      <span className="cursor-blink" />
                    )}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-8">
                    <div
                      className="text-3xl"
                      style={{ color: "var(--text-muted)", opacity: 0.4 }}
                    >
                      ◉
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        Recruiter assessment
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                        streams here in real time
                      </p>
                    </div>
                    {/* Skeleton placeholder bars */}
                    <div className="w-full max-w-[200px] flex flex-col gap-2 mt-2">
                      {[90, 75, 85, 65].map((w, i) => (
                        <div
                          key={i}
                          className="h-2 rounded shimmer"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Error banner ──────────────────────────── */}
          {error && (
            <div
              className="px-5 py-4 rounded-xl text-sm"
              style={{
                background: "rgba(255,77,109,0.08)",
                border: "1px solid rgba(255,77,109,0.25)",
                color: "var(--red)",
              }}
            >
              <strong>Analysis failed:</strong> {error}
              {"  "}
              <Link href="/analyze" className="underline font-semibold">
                Try again →
              </Link>
            </div>
          )}

          {/* ── Complete banner ───────────────────────── */}
          {isComplete && (
            <div
              className="px-5 py-4 rounded-xl text-sm flex items-center gap-3 scale-in"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-glow)",
                color: "var(--accent)",
              }}
            >
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              All 5 agents complete. Loading your Reputation Intelligence Report...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
