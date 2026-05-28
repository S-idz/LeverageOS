// ============================================================
// LeverageOS - Shared OpenAI Client Singleton
// Lazily created on first use, survives hot reloads in dev.
// ============================================================

import OpenAI from "openai";
import { getRequiredEnv } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __openaiClient: OpenAI | undefined;
}

export function getOpenAI(): OpenAI {
  return (
    global.__openaiClient ??
    (global.__openaiClient = new OpenAI({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
      baseURL: process.env.OPENAI_BASE_URL ?? undefined,
    }))

  );
}
