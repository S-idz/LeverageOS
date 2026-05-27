import type { ReactNode } from "react";
import Link from "next/link";

interface NavProps {
  subtitle?: string;
  right?: ReactNode;
}

export function Nav({ subtitle, right }: NavProps) {
  return (
    <nav
      className="flex items-center justify-between px-5 sm:px-8 h-14 border-b shrink-0 sticky top-0 z-50 backdrop-blur-md"
      style={{
        borderColor: "var(--border)",
        background: "rgba(7,9,13,0.85)",
      }}
    >
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs transition-transform group-hover:scale-105"
          style={{ background: "var(--accent)", color: "#07090d" }}
        >
          L
        </div>
        <span
          className="text-sm font-semibold tracking-wide"
          style={{ color: "var(--text)" }}
        >
          LeverageOS
        </span>
        <span
          className="hidden sm:inline text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          beta
        </span>
      </Link>

      {/* Center */}
      {subtitle && (
        <span
          className="hidden md:block text-xs font-mono absolute left-1/2 -translate-x-1/2"
          style={{ color: "var(--text-muted)" }}
        >
          {subtitle}
        </span>
      )}

      {/* Right */}
      <div className="flex items-center gap-3">
        {right ?? (
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid var(--accent-glow)",
            }}
          >
            live
          </span>
        )}
      </div>
    </nav>
  );
}
