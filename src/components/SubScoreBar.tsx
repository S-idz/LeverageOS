"use client";

import { useEffect, useState } from "react";

export function SubScoreBar({
  label,
  score,
  delay = 0,
}: {
  label: string;
  score: number;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth(score);
      // Count up the number
      let start: number | null = null;
      const duration = 900;
      function step(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 2);
        setDisplayed(Math.round(eased * score));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  const color =
    score >= 70
      ? "var(--green)"
      : score >= 45
      ? "var(--yellow)"
      : score >= 25
      ? "var(--orange)"
      : "var(--red)";

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-dim)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-mono font-bold tabular-nums"
          style={{ color }}
        >
          {displayed}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--surface-3)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            boxShadow: `0 0 6px ${color}44`,
            transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}
