"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  /** "sm" = inline chip, "md" = pill button (default), "lg" = full CTA */
  size?: "sm" | "md" | "lg";
}

export function CopyButton({ text, label = "Copy", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const base =
    "font-medium transition-all duration-200 active:scale-95 cursor-pointer select-none";

  if (size === "lg") {
    return (
      <button
        onClick={copy}
        className={`${base} px-6 py-3 rounded-xl text-sm`}
        style={{
          background: copied ? "var(--accent-dim)" : "var(--accent)",
          color: copied ? "var(--accent)" : "#07090d",
          border: copied ? "1px solid var(--accent-glow)" : "1px solid transparent",
          transform: copied ? "scale(1)" : undefined,
        }}
      >
        {copied ? "✓  Copied to clipboard!" : label}
      </button>
    );
  }

  if (size === "md") {
    return (
      <button
        onClick={copy}
        className={`${base} px-4 py-2 rounded-lg text-sm`}
        style={{
          background: copied ? "var(--accent-dim)" : "var(--surface-2)",
          color: copied ? "var(--accent)" : "var(--text)",
          border: `1px solid ${copied ? "var(--accent-glow)" : "var(--border)"}`,
        }}
      >
        {copied ? "✓ Copied" : label}
      </button>
    );
  }

  // sm — default inline chip
  return (
    <button
      onClick={copy}
      className={`${base} px-2.5 py-1 rounded text-xs`}
      style={{
        background: copied ? "var(--accent-dim)" : "var(--surface-3)",
        color: copied ? "var(--accent)" : "var(--text-muted)",
        border: `1px solid ${copied ? "var(--accent-glow)" : "var(--border)"}`,
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
