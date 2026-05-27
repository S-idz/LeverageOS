// ============================================================
// LeverageOS — Shared OpenAI Client Singleton
// Lazily created on first use, survives hot reloads in dev.
// Lazy init is required so `next build` page-data collection
// can import agent modules without an API key present.
// ============================================================

import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var __openaiClient: OpenAI | undefined;
}

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return (
    global.__openaiClient ??
    (global.__openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }))
  );
}
