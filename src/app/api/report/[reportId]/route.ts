// ============================================================
// GET /api/report/[reportId]
// Returns a completed analysis result by report ID
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await context.params;

  // Find the job that produced this report
  for (const job of jobStore.values()) {
    if (job.result?.id === reportId) {
      return NextResponse.json(job.result);
    }
  }

  return NextResponse.json({ error: "Report not found" }, { status: 404 });
}
