// ============================================================
// POST /api/analyze
// Starts the analysis pipeline, returns jobId
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { startAnalysis } from "@/lib/orchestrator";
import {
  InvalidProviderKeyError,
  MissingEnvironmentVariableError,
} from "@/lib/env";
import { AnalyzeRequest } from "@/lib/types";
import {
  RequestValidationError,
  validateAnalyzeRequest,
} from "@/lib/validation";
import { getClientIp, takeAnalyzeRateLimitSlot } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);
    const rateLimit = takeAnalyzeRateLimitSlot(clientIp);
    if (!rateLimit.allowed) {
      console.warn(
        `[rate-limit] blocked analyze request from ${clientIp} (${rateLimit.limit} per 10m)`
      );
      return NextResponse.json(
        {
          error:
            "Too many analysis requests from this IP. Please wait a few minutes and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 8_192) {
      return NextResponse.json(
        { error: "Request body is too large" },
        { status: 400 }
      );
    }

    let body: Partial<AnalyzeRequest>;
    try {
      body = (await req.json()) as Partial<AnalyzeRequest>;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const validatedRequest = validateAnalyzeRequest(body);
    const bypassCache = req.nextUrl.searchParams.get("fresh") === "1";

    const jobId = await startAnalysis(validatedRequest, { bypassCache });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Analyze error:", err);

    if (err instanceof RequestValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof MissingEnvironmentVariableError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    if (err instanceof InvalidProviderKeyError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    );
  }
}
