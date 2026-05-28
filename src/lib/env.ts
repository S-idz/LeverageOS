export class MissingEnvironmentVariableError extends Error {
  constructor(name: string) {
    super(`${name} is not set. Add it to .env.local (see .env.example).`);
    this.name = "MissingEnvironmentVariableError";
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new MissingEnvironmentVariableError(name);
  }

  // Warn when the key format looks wrong for the configured provider
  if (name === "OPENAI_API_KEY") {
    const base = process.env.OPENAI_BASE_URL ?? "";
    const isGroq = base.length > 0 && !base.includes("api.openai.com");
    if (isGroq && !value.startsWith("gsk_")) {
      console.warn(
        `[env] OPENAI_API_KEY does not start with "gsk_" but OPENAI_BASE_URL points to Groq. ` +
        `Groq API keys should start with "gsk_". API calls will fail with 401 until this is corrected.`
      );
    }
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
