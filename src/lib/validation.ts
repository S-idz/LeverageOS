import { AnalyzeRequest } from "./types";

export const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

const GITHUB_URL_PREFIX_REGEX = /^https?:\/\/(?:www\.)?github\.com\//i;

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export function normalizeGitHubUsername(value: string): string {
  const trimmed = value.trim();
  const withoutAt = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const withoutUrl = withoutAt.replace(GITHUB_URL_PREFIX_REGEX, "");
  return withoutUrl.split(/[/?#]/, 1)[0]?.trim() ?? "";
}

export function assertValidGitHubUsername(value: string): string {
  const normalized = normalizeGitHubUsername(value);

  if (!normalized) {
    throw new RequestValidationError("GitHub username is required");
  }

  if (!GITHUB_USERNAME_REGEX.test(normalized)) {
    throw new RequestValidationError(
      "GitHub username must be 1-39 characters and contain only letters, numbers, or hyphens"
    );
  }

  return normalized;
}

export function validateAnalyzeRequest(
  body: Partial<AnalyzeRequest>
): AnalyzeRequest {
  if (!body.githubUsername || typeof body.githubUsername !== "string") {
    throw new RequestValidationError("GitHub username is required");
  }

  if (!body.selfDescription || typeof body.selfDescription !== "string") {
    throw new RequestValidationError("Self description is required");
  }

  const githubUsername = assertValidGitHubUsername(body.githubUsername);
  const selfDescription = body.selfDescription.trim();

  if (selfDescription.length < 10 || selfDescription.length > 2_000) {
    throw new RequestValidationError(
      "Self description must be between 10 and 2000 characters"
    );
  }

  if (
    body.targetRole !== undefined &&
    body.targetRole !== null &&
    typeof body.targetRole !== "string"
  ) {
    throw new RequestValidationError(
      "Target role must be a string when provided"
    );
  }

  const targetRole = body.targetRole?.trim() || undefined;
  if (targetRole && targetRole.length > 120) {
    throw new RequestValidationError(
      "Target role must be 120 characters or fewer"
    );
  }

  return {
    githubUsername,
    selfDescription,
    targetRole,
  };
}
