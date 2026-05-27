import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeverageOS — Reputation Intelligence",
  description:
    "See exactly how recruiters perceive your GitHub profile. Get your Reputation Score in 90 seconds.",
  openGraph: {
    title: "LeverageOS — Reputation Intelligence",
    description: "See exactly how recruiters perceive your GitHub profile.",
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
