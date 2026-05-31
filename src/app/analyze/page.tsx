"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";

const WHAT_YOU_GET = [
  {
    icon: "01",
    label: "Fix Now Kit",
    detail: "GitHub bio, README, repo descriptions, and pinned repo plan",
  },
  {
    icon: "02",
    label: "Recruiter View",
    detail: "A blunt recruiter-style read of how your profile currently lands",
  },
  {
    icon: "03",
    label: "Visibility Gaps",
    detail: "Top blockers with evidence and likely recruiter impact",
  },
  {
    icon: "04",
    label: "Social Proof Copy",
    detail: "LinkedIn headline, About, post, and X thread grounded in your repos",
  },
  {
    icon: "05",
    label: "30-Day Plan",
    detail: "Small follow-through actions so the cleanup compounds",
  },
  {
    icon: "06",
    label: "Live Opportunities",
    detail: "Jobs, hackathons, OSS issues, and grants matched to your stack",
  },
];

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-semibold" style={{ color: "var(--text)" }}>
      {children}
      {required && (
        <span className="ml-1" style={{ color: "var(--accent)" }}>
          *
        </span>
      )}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
      {children}
    </p>
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
  background: "var(--surface-2)",
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
  const [targetRole, setTargetRole] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    githubUsername.trim().length > 0 && selfDescription.trim().length > 10;

  function loadDemoProfile() {
    setGithubUsername("octocat");
    setSelfDescription(
      "I work on developer tooling and shipped a handful of small open-source projects. I want to be seen as a pragmatic engineer who can take an idea from prototype to production."
    );
    setTargetRole("Full-Stack Engineer");
    setError("");
  }

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
          selfDescription: selfDescription.trim(),
          targetRole: targetRole.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Analysis failed");
      }

      const { jobId } = (await res.json()) as { jobId: string };
      router.push(`/analyzing/${jobId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Check your GitHub username and try again."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Nav subtitle="Step 1 of 3" />

      <div className="flex flex-1 px-5 py-12 md:py-16 gap-10 max-w-5xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <div className="mb-8 fade-up">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid var(--accent-glow)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Public GitHub + your context only
            </div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold mb-3"
              style={{ color: "var(--text)", letterSpacing: "-0.025em" }}
            >
              Turn your GitHub into a stronger recruiter signal
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
              We analyze your public GitHub profile plus the context you type below. No LinkedIn scraping, no private repo access, no account needed.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-8 fade-up fade-up-1">
            {["Enter details", "6 agents run", "Apply fixes"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="w-8 h-px" style={{ background: "var(--border)" }} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i === 0 ? "var(--accent)" : "var(--surface-2)",
                      color: i === 0 ? "#07090d" : "var(--text-muted)",
                      border: i === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: i === 0 ? "var(--text)" : "var(--text-muted)" }}
                  >
                    {step}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-6 fade-up fade-up-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex justify-end -mb-2">
                <button
                  type="button"
                  onClick={loadDemoProfile}
                  className="text-xs font-mono px-3 py-1.5 rounded-full transition-all cursor-pointer hover:opacity-80"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Try with example profile →
                </button>
              </div>

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
                <Hint>Public GitHub profiles only</Hint>
              </Field>

              <Field>
                <Label required>What are you best known for technically?</Label>
                <textarea
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  placeholder="e.g. Shipped ML tooling in Python, built full-stack product features, and want to be seen as an engineer who can ship practical systems."
                  required
                  rows={4}
                  style={{ ...FIELD_STYLE, resize: "none" }}
                  {...FOCUS_HANDLERS}
                />
                <div className="flex items-center justify-between">
                  <Hint>1-3 sentences. This calibrates the role/narrative you want the AI to optimize for.</Hint>
                  <span
                    className="text-xs font-mono"
                    style={{
                      color:
                        selfDescription.length > 10
                          ? "var(--accent)"
                          : "var(--text-muted)",
                    }}
                  >
                    {selfDescription.length} chars
                  </span>
                </div>
              </Field>

              <Field>
                <Label>Target Role</Label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer, ML Engineer, Founding Engineer"
                  style={FIELD_STYLE}
                  {...FOCUS_HANDLERS}
                />
                <Hint>Optional. Helps the fixer package your profile for a more specific outcome.</Hint>
              </Field>

              <div style={{ borderTop: "1px solid var(--border)" }} />

              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5"
                  style={{
                    background: "rgba(255,77,109,0.08)",
                    border: "1px solid rgba(255,77,109,0.25)",
                    color: "var(--red)",
                  }}
                >
                  <span className="shrink-0 mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background:
                    canSubmit && !loading ? "var(--accent)" : "var(--surface-2)",
                  color:
                    canSubmit && !loading ? "#07090d" : "var(--text-muted)",
                  boxShadow:
                    canSubmit && !loading ? "0 0 20px var(--accent-glow)" : "none",
                  border:
                    canSubmit && !loading ? "none" : "1px solid var(--border)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Launching 6 agents...
                  </span>
                ) : (
                  "Analyze and build my fix kit ->"
                )}
              </button>
            </form>
          </div>

          <p
            className="text-xs text-center mt-4 fade-up fade-up-3"
            style={{ color: "var(--text-muted)" }}
          >
            Public GitHub only - user-provided context only - about 90 seconds
          </p>
        </div>

        <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0 pt-2 fade-up">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <p
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                What you get
              </p>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {WHAT_YOU_GET.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 px-3 py-3 rounded-lg"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span
                    className="text-xs shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold"
                    style={{ background: "var(--surface-3)", color: "var(--accent)" }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl px-5 py-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--accent)" }}
              />
              <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                Evidence-backed fix flow
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              The app uses public GitHub data plus your own positioning context to build fixes you can apply immediately. It does not inspect private repos or scrape LinkedIn.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
