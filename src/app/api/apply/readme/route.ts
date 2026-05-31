// ============================================================
// POST /api/apply/readme
// Pushes the generated GitHub Profile README directly to the
// user's GitHub profile repo via the GitHub Contents API.
// The token is used only for this request and never stored.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import { assertValidGitHubUsername } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ApplyReadmeRequest {
  reportId: string;
  githubToken: string;
}

interface GitHubContentsResponse {
  sha?: string;
  content?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: Partial<ApplyReadmeRequest>;
  try {
    body = (await req.json()) as Partial<ApplyReadmeRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { reportId, githubToken } = body;

  if (!reportId || !githubToken) {
    return NextResponse.json({ error: "reportId and githubToken are required" }, { status: 400 });
  }

  // Find the report in the job store
  let readmeContent: string | null = null;
  let username: string | null = null;

  for (const job of jobStore.values()) {
    if (job.result?.id === reportId) {
      readmeContent = job.result.fixKit.githubProfileReadme.content;
      username = job.result.githubUsername;
      break;
    }
  }

  if (!readmeContent || !username) {
    return NextResponse.json({ error: "Report not found or expired" }, { status: 404 });
  }

  const safeUsername = assertValidGitHubUsername(username);

  const headers: HeadersInit = {
    Authorization: `token ${githubToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "LeverageOS/1.0",
  };

  // Check if README already exists (need SHA for update)
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${safeUsername}/${safeUsername}/contents/README.md`,
      { headers }
    );
    if (checkRes.ok) {
      const existing = (await checkRes.json()) as GitHubContentsResponse;
      existingSha = existing.sha;
    }
  } catch {
    // File doesn't exist — create it fresh
  }

  const encodedContent = Buffer.from(readmeContent, "utf-8").toString("base64");

  const putBody: Record<string, unknown> = {
    message: "Update profile README via LeverageOS",
    content: encodedContent,
  };
  if (existingSha) {
    putBody.sha = existingSha;
  }

  const putRes = await fetch(
    `https://api.github.com/repos/${safeUsername}/${safeUsername}/contents/README.md`,
    { method: "PUT", headers, body: JSON.stringify(putBody) }
  );

  if (!putRes.ok) {
    const errBody = (await putRes.json()) as { message?: string };
    return NextResponse.json(
      { error: errBody.message ?? "GitHub API error", status: putRes.status },
      { status: putRes.status === 404 ? 422 : putRes.status }
    );
  }

  return NextResponse.json({
    success: true,
    url: `https://github.com/${safeUsername}`,
    message: existingSha ? "README updated" : "README created",
  });
}
