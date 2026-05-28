"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AGENT_ORDER, AgentName, Job } from "@/lib/types";
import { Nav } from "@/components/Nav";

const AGENT_ICONS: Record<AgentName, string> = {
  "Profile Ingestion": "01",
  "Recruiter Simulation": "02",
  "Visibility Gap Analysis": "03",
  "Fix Kit Generation": "04",
  "Reputation Scoring": "05",
  "Opportunity Scout": "06",
};

const AGENT_DESCRIPTIONS: Record<AgentName, string> = {
  "Profile Ingestion": "Collecting public GitHub signals and evidence",
  "Recruiter Simulation": "Simulating a fast recruiter read",
  "Visibility Gap Analysis": "Finding the biggest perception blockers",
  "Fix Kit Generation": "Writing fixes you can apply right away",
  "Reputation Scoring": "Scoring the profile after the audit",
  "Opportunity Scout": "Searching live web for matching opportunities",
};

export default function AnalyzingPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const streamRef = useRef("");
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/stream/${jobId}`);

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
          if (
            recruiterAgent?.streamText &&
            recruiterAgent.streamText !== streamRef.current
          ) {
            streamRef.current = recruiterAgent.streamText;
            setStreamText(recruiterAgent.streamText);
            setTimeout(() => {
              streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
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
        // Ignore parse errors from malformed SSE payloads.
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
    ? AGENT_ORDER.filter((agent) => job.agents[agent]?.status === "complete").length
    : 0;
  const progress = (completedCount / AGENT_ORDER.length) * 100;
  const isComplete = job?.status === "complete";
  const isJobError = job?.status === "error";
  const recruiterStatus = job?.agents["Recruiter Simulation"]?.status;

  return (
    <main className="min-h-screen flex flex-col">
      <Nav subtitle="Step 2 of 3 - Analysis" />

      <div className="flex flex-1 px-5 py-10">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
          <div className="fade-up">
            <div className="flex items-center gap-2.5 mb-2">
              {isComplete ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(6,214,160,0.15)" }}
                >
                  <span className="text-xs" style={{ color: "var(--green)" }}>
                    v
                  </span>
                </div>
              ) : isJobError ? (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,77,109,0.15)" }}
                >
                  <span className="text-xs" style={{ color: "var(--red)" }}>!</span>
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--accent-dim)" }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ background: "var(--accent)" }}
                  />
                </div>
              )}
              <span
                className="text-xs font-mono font-semibold uppercase tracking-widest"
                style={{ color: isComplete ? "var(--green)" : isJobError ? "var(--red)" : "var(--accent)" }}
              >
                {isComplete ? "Complete" : isJobError ? "Failed" : "Running"}
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold"
              style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
            >
              {isComplete
                ? "Fix kit ready. Redirecting..."
                : isJobError
                ? "Analysis stopped early"
                : "Auditing your recruiter signal..."}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-dim)" }}>
              {isComplete
                ? "All 6 agents are complete."
                : isJobError
                ? "One agent hit an unrecoverable error. See the details below."
                : "The recruiter view streams live while the rest of the fix kit is being built."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="flex justify-between text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                {completedCount} of {AGENT_ORDER.length} agents complete
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="rounded-full h-2 overflow-hidden"
              style={{ background: "var(--surface-3)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: isComplete
                    ? "var(--green)"
                    : "linear-gradient(90deg, var(--accent), var(--blue))",
                  boxShadow: `0 0 12px ${
                    isComplete ? "var(--green)" : "var(--accent-glow)"
                  }`,
                }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex flex-col gap-2">
              {AGENT_ORDER.map((agentName) => {
                const agent = job?.agents[agentName];
                const status = agent?.status ?? "pending";
                const isRunning = status === "running";
                const isDone = status === "complete";
                const isError = status === "error";

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
                          ? "var(--accent)"
                          : isDone
                          ? "var(--border-hover)"
                          : isError
                          ? "rgba(255,77,109,0.4)"
                          : "var(--border)"
                      }`,
                      opacity: status === "pending" ? 0.55 : 1,
                      boxShadow: isRunning ? "0 0 16px var(--accent-glow)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold"
                        style={{
                          background: isDone
                            ? "rgba(6,214,160,0.12)"
                            : isRunning
                            ? "var(--accent-dim)"
                            : isError
                            ? "rgba(255,77,109,0.1)"
                            : "var(--surface-3)",
                          border: `1px solid ${
                            isDone
                              ? "rgba(6,214,160,0.3)"
                              : isRunning
                              ? "var(--accent-glow)"
                              : "transparent"
                          }`,
                          color: isDone
                            ? "var(--green)"
                            : isRunning
                            ? "var(--accent)"
                            : "var(--text-muted)",
                        }}
                      >
                        {isDone ? "v" : AGENT_ICONS[agentName]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-bold truncate"
                          style={{
                            color:
                              isDone || isRunning ? "var(--text)" : "var(--text-muted)",
                          }}
                        >
                          {agentName}
                        </p>
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: isError ? "var(--red)" : "var(--text-muted)" }}
                          title={isError ? (agent?.message ?? "Error") : undefined}
                        >
                          {isDone
                            ? "Complete"
                            : isRunning
                            ? agent?.message ?? AGENT_DESCRIPTIONS[agentName]
                            : isError
                            ? (agent?.message ?? "Error")
                            : AGENT_DESCRIPTIONS[agentName]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="md:col-span-3 rounded-xl flex flex-col overflow-hidden"
              style={{
                background: "var(--surface)",
                border: `1px solid ${
                  recruiterStatus === "running" ? "var(--accent)" : "var(--border)"
                }`,
                minHeight: "300px",
                transition: "border-color 0.3s",
                boxShadow:
                  recruiterStatus === "running" ? "0 0 20px var(--accent-glow)" : "none",
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  M
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: "var(--text)" }}>
                    Marcus Chen - Senior Technical Recruiter
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Live first-pass assessment
                  </p>
                </div>
                {recruiterStatus === "running" && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "var(--accent)" }}
                    />
                    <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                      live
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 p-5 overflow-y-auto" style={{ maxHeight: "360px" }}>
                {streamText ? (
                  <>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {streamText}
                      {recruiterStatus === "running" && <span className="cursor-blink" />}
                    </p>
                    <div ref={streamEndRef} />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-8">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-muted)",
                        opacity: 0.5,
                      }}
                    >
                      02
                    </div>
                    <div className="text-center">
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text-dim)" }}
                      >
                        Recruiter assessment
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        streams here in real time
                      </p>
                    </div>
                    <div className="w-full max-w-[220px] flex flex-col gap-2 mt-2">
                      {[95, 80, 90, 70, 85].map((width, index) => (
                        <div
                          key={index}
                          className="h-2 rounded-full shimmer"
                          style={{ width: `${width}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div
              className="px-5 py-4 rounded-xl text-sm flex items-start gap-3"
              style={{
                background: "rgba(255,77,109,0.08)",
                border: "1px solid rgba(255,77,109,0.3)",
                color: "var(--red)",
              }}
            >
              <span className="shrink-0 mt-0.5">!</span>
              <div>
                <strong>Analysis failed:</strong> {error}{" "}
                <Link href="/analyze" className="underline font-semibold">
                  Try again -&gt;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
