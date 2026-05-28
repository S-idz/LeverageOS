"use client";

import { CopyButton } from "./CopyButton";
import { FixItem, FixKit, RepoDescriptionFix } from "@/lib/types";

function FixCard({
  title,
  subtitle,
  item,
  copyLabel = "Copy",
  compact = false,
}: {
  title: string;
  subtitle: string;
  item: FixItem;
  copyLabel?: string;
  compact?: boolean;
}) {
  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-start justify-between gap-4 px-5 py-4"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {title}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
        <CopyButton text={item.content} label={copyLabel} size="sm" />
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          {compact ? (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-dim)" }}
            >
              {item.content}
            </p>
          ) : (
            <pre
              className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap m-0"
              style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}
            >
              {item.content}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Why this helps
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
            {item.why}
          </p>
        </div>

        {item.evidence.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.evidence.map((fact, index) => (
              <span
                key={`${title}-${index}`}
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
    </article>
  );
}

function renderRepoDescriptionText(items: RepoDescriptionFix[]): string {
  return items.map((item) => `${item.repoName}: ${item.description}`).join("\n");
}

function renderPinnedStrategyText(fixKit: FixKit): string {
  return fixKit.pinnedRepoStrategy.order
    .map((item, index) => `${index + 1}. ${item.repoName} - ${item.rationale}`)
    .join("\n");
}

function renderActionPlanText(fixKit: FixKit): string {
  return fixKit.thirtyDayActionPlan.steps
    .map((step, index) => `${index + 1}. ${step.title}: ${step.detail}`)
    .join("\n");
}

export function FixKitSection({ fixKit }: { fixKit: FixKit }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <FixCard
          title="GitHub Bio"
          subtitle="Fastest profile clarity win"
          item={fixKit.githubBio}
          compact
        />
        <FixCard
          title="LinkedIn Headline"
          subtitle="Role + specialty in one line"
          item={fixKit.linkedinHeadline}
          compact
        />
        <FixCard
          title="Pinned Repo Strategy"
          subtitle="Tell a better proof story"
          item={{
            content: renderPinnedStrategyText(fixKit),
            why: fixKit.pinnedRepoStrategy.why,
            evidence: fixKit.pinnedRepoStrategy.evidence,
          }}
          copyLabel="Copy order"
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <FixCard
          title="GitHub Profile README"
          subtitle="Your recruiter landing page"
          item={fixKit.githubProfileReadme}
          copyLabel="Copy README"
        />
        <FixCard
          title="LinkedIn About"
          subtitle="Longer professional narrative"
          item={fixKit.linkedinAbout}
          copyLabel="Copy About"
          compact
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <FixCard
          title="LinkedIn Post"
          subtitle="Turn your audit into social proof"
          item={fixKit.linkedinPost}
          copyLabel="Copy post"
          compact
        />
        <FixCard
          title="X Thread"
          subtitle="Five tweets grounded in your real work"
          item={fixKit.xThread}
          copyLabel="Copy thread"
          compact
        />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <FixCard
          title="Resume Bullets"
          subtitle="STAR-format bullets — paste straight into your resume"
          item={fixKit.resumeBullets}
          copyLabel="Copy bullets"
          compact
        />
        <FixCard
          title="Cold Outreach DM"
          subtitle="Send to recruiters on LinkedIn or X — personalize [Name] and [Company]"
          item={fixKit.coldOutreachDm}
          copyLabel="Copy DM"
          compact
        />
      </div>

      <article
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              Repo Description Fixes
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Clean, recruiter-readable summaries for your highest-signal repos
            </p>
          </div>
          <CopyButton
            text={renderRepoDescriptionText(fixKit.repoDescriptions)}
            label="Copy all"
            size="sm"
          />
        </div>

        <div className="p-5 grid gap-3">
          {fixKit.repoDescriptions.map((repo) => (
            <div
              key={repo.repoName}
              className="rounded-xl p-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {repo.repoName}
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                    {repo.description}
                  </p>
                </div>
                <CopyButton text={repo.description} label="Copy" size="sm" />
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                {repo.why}
              </p>
            </div>
          ))}
        </div>
      </article>

      <FixCard
        title="30-Day Action Plan"
        subtitle="Small fixes that compound into better recruiter perception"
        item={{
          content: renderActionPlanText(fixKit),
          why: fixKit.thirtyDayActionPlan.why,
          evidence: fixKit.thirtyDayActionPlan.evidence,
        }}
        copyLabel="Copy plan"
      />
    </div>
  );
}
