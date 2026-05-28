import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeverageOS - Recruiter Signal Fixer",
  description:
    "Turn public GitHub into a recruiter-facing fix kit: stronger bio, README, repo framing, and social proof in about 90 seconds.",
  openGraph: {
    title: "LeverageOS - Recruiter Signal Fixer",
    description:
      "Turn public GitHub into a recruiter-facing fix kit with evidence-backed profile improvements.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        {children}
      </body>
    </html>
  );
}
