"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

type TabId = "linkedin" | "x" | "readme";

const TABS: { id: TabId; label: string; icon: string; hint: string }[] = [
  { id: "linkedin", label: "LinkedIn",      icon: "in", hint: "Professional post · share your work" },
  { id: "x",        label: "X Thread",      icon: "𝕏",  hint: "5-tweet thread · build in public" },
  { id: "readme",   label: "GitHub README", icon: "◈",  hint: "Profile README · paste into GitHub" },
];

interface ContentSectionProps {
  linkedinPost: string;
  xThread: string;
  githubReadme: string;
}

/** Split X thread text into individual tweets by "1/", "2/", etc. */
function parseTweets(raw: string): string[] {
  const lines = raw.split("\n");
  const tweets: string[] = [];
  let current = "";

  for (const line of lines) {
    if (/^\d+\//.test(line.trim()) && current) {
      tweets.push(current.trim());
      current = line;
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current.trim()) tweets.push(current.trim());
  return tweets.length > 1 ? tweets : [raw];
}

export function ContentSection({ linkedinPost, xThread, githubReadme }: ContentSectionProps) {
  const [tab, setTab] = useState<TabId>("linkedin");
  const content: Record<TabId, string> = {
    linkedin: linkedinPost,
    x: xThread,
    readme: githubReadme,
  };

  const currentTab = TABS.find((t) => t.id === tab)!;
  const tweets = tab === "x" ? parseTweets(xThread) : [];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Tab bar */}
      <div
        className="flex items-stretch border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 text-sm font-medium transition-all cursor-pointer"
            style={{
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
              background: "transparent",
            }}
          >
            <span
              className="text-xs px-1 py-0.5 rounded font-mono"
              style={{
                background: tab === t.id ? "var(--accent-dim)" : "var(--surface-3)",
                color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Hint bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {currentTab.hint}
        </span>
        <CopyButton text={content[tab]} label="Copy all" size="sm" />
      </div>

      {/* Content area */}
      <div className="p-5">
        {/* X Thread — rendered as tweet cards */}
        {tab === "x" && tweets.length > 1 ? (
          <div className="flex flex-col gap-3">
            {tweets.map((tweet, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                  >
                    {i + 1}
                  </div>
                  <p
                    className="text-sm leading-relaxed flex-1 whitespace-pre-wrap"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {tweet.replace(/^\d+\/\s*/, "")}
                  </p>
                </div>
                <div className="flex justify-end mt-2">
                  <CopyButton text={tweet} label="Copy tweet" size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === "readme" ? (
          /* README — monospace with subtle line numbers */
          <div
            className="rounded-xl overflow-auto"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              maxHeight: "420px",
            }}
          >
            <pre
              className="p-4 text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono, monospace)" }}
            >
              {githubReadme}
            </pre>
          </div>
        ) : (
          /* LinkedIn — clean prose */
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-dim)" }}
            >
              {linkedinPost}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
