// ============================================================
// LeverageOS - Provider-aware model routing
// Detects whether OPENAI_BASE_URL points to Groq (or similar
// OpenAI-compatible provider) and returns the right model ID.
// The Responses API (web_search, o4-mini) is only available on
// the real OpenAI endpoint — we fall back to chat.completions
// for all other providers.
// ============================================================

function isGroqEndpoint(): boolean {
  const base = process.env.OPENAI_BASE_URL ?? "";
  return base.length > 0 && !base.includes("api.openai.com");
}

/**
 * Returns the best available chat completion model for the
 * current provider. Use for all non-streaming LLM calls.
 */
export function chatModel(): string {
  return isGroqEndpoint() ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
}

/**
 * Returns the best streaming-capable model.
 */
export function streamingModel(): string {
  return isGroqEndpoint() ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
}

/**
 * Returns true only when the OpenAI Responses API
 * (client.responses.create, web_search_preview) is available.
 * Groq and most OpenAI-compatible providers do NOT support it.
 */
export function supportsResponsesApi(): boolean {
  return !isGroqEndpoint();
}
