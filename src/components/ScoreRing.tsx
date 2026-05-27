"use client";

import { useEffect, useState, useRef } from "react";

function tierLabel(score: number) {
  if (score >= 75) return { text: "Strong", color: "var(--green)" };
  if (score >= 55) return { text: "Moderate", color: "var(--yellow)" };
  if (score >= 35) return { text: "Weak", color: "var(--orange)" };
  return { text: "Critical", color: "var(--red)" };
}

export function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeW = 9;
  const radius = (size - strokeW * 2 - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayed, setDisplayed] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    let start: number | null = null;
    const duration = 1600;

    function step(timestamp: number) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  const offset = circumference - (displayed / 100) * circumference;
  const color = score >= 70 ? "var(--green)" : score >= 45 ? "var(--yellow)" : "var(--red)";
  const tier = tierLabel(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeW}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.04s linear",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      {/* Center text */}
      <div className="text-center z-10 pointer-events-none">
        <div
          className="font-bold leading-none"
          style={{ color, fontSize: size * 0.24 }}
        >
          {displayed}
        </div>
        <div
          className="font-mono"
          style={{ color: "var(--text-muted)", fontSize: size * 0.1 }}
        >
          / 100
        </div>
        <div
          className="font-semibold mt-1"
          style={{ color: tier.color, fontSize: size * 0.1 }}
        >
          {tier.text}
        </div>
      </div>
    </div>
  );
}
