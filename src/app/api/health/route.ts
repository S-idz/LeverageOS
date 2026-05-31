import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const hasProvider = Boolean(getOptionalEnv("OPENAI_API_KEY"));

  return NextResponse.json({
    status: "ok",
    provider: hasProvider,
    model: Boolean(getOptionalEnv("OPENAI_MODEL") || hasProvider),
    hasGithubToken: Boolean(getOptionalEnv("GITHUB_TOKEN")),
  });
}
