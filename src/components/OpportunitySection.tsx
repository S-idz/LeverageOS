"use client";

import { OpportunityResult } from "@/lib/types";

const TYPE_CONFIG: Record<
  OpportunityResult["type"],
  { label: string; color: string; bg: string; border: string }
> = {
  job: {
    label: "Job",
    color: "var(--blue)",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.3)",
  },
  hackathon: {
    label: "Hackathon",
    color: "var(--purple, #a78bfa)",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.3)",
  },
  oss: {
    label: "Open Source",
    color: "var(--green)",
    bg: "rgba(6,214,160,0.1)",
    border: "rgba(6,214,160,0.3)",
  },
  grant: {
    label: "Grant / Fellowship",
    color: "var(--yellow, #fbbf24)",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.3)",
  },
};

export function OpportunitySection({
  opportunities,
}: {
  opportunities: OpportunityResult[];
}) {
  if (!opportunities.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {opportunities.map((opp, index) => {
        const cfg = TYPE_CONFIG[opp.type];
        return (
          <div
            key={index}
            className="rounded-xl overflow-hidden card-hover"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold hover:underline flex items-center gap-1"
                    style={{ color: "var(--text)" }}
                  >
                    {opp.title}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "var(--text-muted)", flexShrink: 0 }}
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
                {opp.deadline && (
                  <span
                    className="text-xs shrink-0 font-mono px-2 py-0.5 rounded"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {opp.deadline}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
                {opp.why}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
