// ============================================================
// POST /api/analyze
// Starts the analysis pipeline, returns jobId
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { startAnalysis } from "@/lib/orchestrator";
import { MissingEnvironmentVariableError, getRequiredEnv } from "@/lib/env";
import { AnalyzeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    getRequiredEnv("OPENAI_API_KEY");

    const body = (await req.json()) as Partial<AnalyzeRequest>;
    const { githubUsername, selfDescription, targetRole } = body;

    if (!githubUsername || typeof githubUsername !== "string") {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    if (!selfDescription || typeof selfDescription !== "string") {
      return NextResponse.json(
        { error: "Self description is required" },
        { status: 400 }
      );
    }

    const cleanUsername = githubUsername
      .trim()
      .replace(/^@/, "")
      .replace(/https?:\/\/github\.com\//i, "");

    const jobId = await startAnalysis({
      githubUsername: cleanUsername,
      selfDescription: selfDescription.trim(),
      targetRole: targetRole?.trim(),
    });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Analyze error:", err);

    if (err instanceof MissingEnvironmentVariableError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    );
  }
}
