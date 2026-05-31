export class MissingEnvironmentVariableError extends Error {
  constructor(name: string) {
    super(`${name} is not set. Add it to .env.local (see .env.example).`);
    this.name = "MissingEnvironmentVariableError";
  }
}

export class InvalidProviderKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProviderKeyError";
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new MissingEnvironmentVariableError(name);
  }
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

// Validate provider config before a job starts so the user gets one clear,
// actionable error instead of every agent silently falling back.
export function assertProviderConfig(): void {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const base = process.env.OPENAI_BASE_URL?.trim() ?? "";

  if (!apiKey) {
    throw new MissingEnvironmentVariableError("OPENAI_API_KEY");
  }

  const isGroq = base.length > 0 && !base.includes("api.openai.com");
  if (isGroq && !apiKey.startsWith("gsk_")) {
    throw new InvalidProviderKeyError(
      `OPENAI_API_KEY is configured for Groq (OPENAI_BASE_URL=${base}) but the key does not start with "gsk_". ` +
        `All LLM calls would return 401 and the report would silently degrade to deterministic fallbacks. ` +
        `Fix the key in .env.local before re-running.`
    );
  }
}
