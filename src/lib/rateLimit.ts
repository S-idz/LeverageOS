const ANALYZE_RATE_LIMIT = {
  limit: 5,
  windowMs: 10 * 60 * 1_000,
};

const UNKNOWN_IP = "unknown-client";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __analyzeRateLimitStore: Map<string, number[]> | undefined;
  // eslint-disable-next-line no-var
  var __analyzeRateLimitCleanupInterval:
    | ReturnType<typeof setInterval>
    | undefined;
}

const rateLimitStore: Map<string, number[]> =
  global.__analyzeRateLimitStore ?? (global.__analyzeRateLimitStore = new Map());

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return UNKNOWN_IP;
  }

  return forwardedFor.split(",")[0]?.trim() || UNKNOWN_IP;
}

export function takeAnalyzeRateLimitSlot(ip: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - ANALYZE_RATE_LIMIT.windowMs;
  const activeTimestamps = (rateLimitStore.get(ip) ?? []).filter(
    (timestamp) => timestamp > windowStart
  );

  if (activeTimestamps.length >= ANALYZE_RATE_LIMIT.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(
        (activeTimestamps[0] + ANALYZE_RATE_LIMIT.windowMs - now) / 1_000
      )
    );

    rateLimitStore.set(ip, activeTimestamps);
    return {
      allowed: false,
      limit: ANALYZE_RATE_LIMIT.limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(ip, activeTimestamps);

  return {
    allowed: true,
    limit: ANALYZE_RATE_LIMIT.limit,
    remaining: Math.max(ANALYZE_RATE_LIMIT.limit - activeTimestamps.length, 0),
    retryAfterSeconds: 0,
  };
}

function cleanupRateLimitStore(): void {
  const windowStart = Date.now() - ANALYZE_RATE_LIMIT.windowMs;

  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const activeTimestamps = timestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    if (activeTimestamps.length === 0) {
      rateLimitStore.delete(ip);
      continue;
    }

    if (activeTimestamps.length !== timestamps.length) {
      rateLimitStore.set(ip, activeTimestamps);
    }
  }
}

if (!global.__analyzeRateLimitCleanupInterval) {
  global.__analyzeRateLimitCleanupInterval = setInterval(
    cleanupRateLimitStore,
    60_000
  );
}
