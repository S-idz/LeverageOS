"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
      {children}
      {required && (
        <span className="ml-1" style={{ color: "var(--accent)" }}>*</span>
      )}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{children}</p>
  );
}

const FOCUS_HANDLERS = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px var(--accent-dim)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  },
};

const FIELD_STYLE: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export default function AnalyzePage() {
  const router = useRouter();
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = githubUsername.trim().length > 0 && selfDescription.trim().length > 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: githubUsername.trim(),
          linkedinUrl: linkedinUrl.trim() || undefined,
          selfDescription: selfDescription.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Analysis failed");
      }

      const { jobId } = (await res.json()) as { jobId: string };
      router.push(`/analyzing/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Check your GitHub username and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Nav subtitle="Step 1 of 3" />

      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-10 fade-up">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full mb-4"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid var(--accent-glow)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Reputation Intelligence
            </div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
            >
              Analyze your profile
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Two fields. 90 seconds. See exactly how a recruiter perceives you.
            </p>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-6 fade-up fade-up-1"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* GitHub username */}
              <Field>
                <Label required>GitHub Username</Label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono select-none pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  >
                    github.com/
                  </span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value.replace(/\s/g, ""))}
                    placeholder="torvalds"
                    autoFocus
                    required
                    autoComplete="off"
                    spellCheck={false}
                    style={{ ...FIELD_STYLE, paddingLeft: "6.5rem" }}
                    {...FOCUS_HANDLERS}
                  />
                </div>
                <Hint>Only public GitHub profiles · no auth required</Hint>
              </Field>

              {/* Self description */}
              <Field>
                <Label required>What are you best known for technically?</Label>
                <textarea
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  placeholder="e.g. CS junior at Georgia Tech building ML systems. 3 deployed NLP projects, strong Python background."
                  required
                  rows={3}
                  style={{ ...FIELD_STYLE, resize: "none" }}
                  {...FOCUS_HANDLERS}
                />
                <Hint>1–3 sentences · helps the AI calibrate your positioning</Hint>
              </Field>

              {/* LinkedIn — optional, collapsed */}
              <Field>
                <Label>
                  LinkedIn URL{" "}
                  <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    — optional
                  </span>
                </Label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  style={FIELD_STYLE}
                  {...FOCUS_HANDLERS}
                />
              </Field>

              {/* Divider */}
              <div style={{ borderTop: "1px solid var(--border)" }} />

              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,77,109,0.1)",
                    border: "1px solid rgba(255,77,109,0.25)",
                    color: "var(--red)",
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: canSubmit && !loading ? "var(--accent)" : "var(--surface-2)",
                  color: canSubmit && !loading ? "#07090d" : "var(--text-muted)",
                  boxShadow: canSubmit && !loading ? "0 0 16px var(--accent-glow)" : "none",
                  transform: "translateZ(0)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Launching 5 agents...
                  </span>
                ) : (
                  "Analyze My Profile →"
                )}
              </button>
            </form>
          </div>

          {/* Trust line */}
          <p
            className="text-xs text-center mt-4 fade-up fade-up-2"
            style={{ color: "var(--text-muted)" }}
          >
            Free · No account · ~90 seconds · Public repos only
          </p>
        </div>
      </div>
    </main>
  );
}
