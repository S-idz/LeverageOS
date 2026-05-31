import { AnalysisResult } from "./types";

const RESULT_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const RESULT_CACHE_MAX_ENTRIES = 100;

interface CachedAnalysisResult {
  result: AnalysisResult;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __analysisResultCache:
    | Map<string, CachedAnalysisResult>
    | undefined;
  // eslint-disable-next-line no-var
  var __analysisResultCacheCleanupInterval:
    | ReturnType<typeof setInterval>
    | undefined;
}

const resultCache: Map<string, CachedAnalysisResult> =
  global.__analysisResultCache ?? (global.__analysisResultCache = new Map());

export function buildAnalysisCacheKey(
  githubUsername: string,
  targetRole?: string
): string {
  return `${githubUsername.trim().toLowerCase()}::${targetRole?.trim() ?? ""}`;
}

export function getCachedAnalysisResult(
  githubUsername: string,
  targetRole?: string
): AnalysisResult | null {
  const cacheKey = buildAnalysisCacheKey(githubUsername, targetRole);
  const cached = resultCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    resultCache.delete(cacheKey);
    return null;
  }

  resultCache.delete(cacheKey);
  resultCache.set(cacheKey, cached);

  return cached.result;
}

export function setCachedAnalysisResult(
  githubUsername: string,
  targetRole: string | undefined,
  result: AnalysisResult
): void {
  const cacheKey = buildAnalysisCacheKey(githubUsername, targetRole);

  resultCache.delete(cacheKey);
  resultCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + RESULT_CACHE_TTL_MS,
  });

  while (resultCache.size > RESULT_CACHE_MAX_ENTRIES) {
    const oldestKey = resultCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    resultCache.delete(oldestKey);
  }
}

function cleanupResultCache(): void {
  const now = Date.now();

  for (const [cacheKey, cached] of resultCache.entries()) {
    if (cached.expiresAt <= now) {
      resultCache.delete(cacheKey);
    }
  }
}

if (!global.__analysisResultCacheCleanupInterval) {
  global.__analysisResultCacheCleanupInterval = setInterval(
    cleanupResultCache,
    600_000
  );
}
