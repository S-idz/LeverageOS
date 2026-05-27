import { VisibilityGap } from "@/lib/types";

const config: Record<
  VisibilityGap["impact"],
  { label: string; bg: string; color: string }
> = {
  critical: { label: "CRITICAL", bg: "rgba(255,77,109,0.15)", color: "var(--red)" },
  high:     { label: "HIGH",     bg: "rgba(255,140,66,0.15)",  color: "var(--orange)" },
  medium:   { label: "MEDIUM",   bg: "rgba(255,209,102,0.15)", color: "var(--yellow)" },
  low:      { label: "LOW",      bg: "rgba(6,214,160,0.15)",   color: "var(--green)" },
};

export function ImpactBadge({ impact }: { impact: VisibilityGap["impact"] }) {
  const c = config[impact];
  return (
    <span
      className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}
