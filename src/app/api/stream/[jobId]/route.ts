// ============================================================
// GET /api/stream/[jobId]
// Server-Sent Events stream for real-time job updates
// ============================================================

import { NextRequest } from "next/server";
import { getJob, subscribeToJob } from "@/lib/jobStore";
import { Job } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encode(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  // Closure variables shared between start() and cancel()
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const currentJob = getJob(jobId);
      if (!currentJob) {
        controller.enqueue(
          encode({ type: "error", data: { message: "Job not found" } })
        );
        controller.close();
        return;
      }

      // Send initial state immediately
      controller.enqueue(encode({ type: "job_update", data: currentJob }));

      // If already terminal, close immediately
      if (
        currentJob.status === "complete" ||
        currentJob.status === "error"
      ) {
        controller.close();
        return;
      }

      // Subscribe to live updates
      const unsubscribe = subscribeToJob(jobId, (job: Job) => {
        try {
          controller.enqueue(encode({ type: "job_update", data: job }));
          if (job.status === "complete" || job.status === "error") {
            unsubscribe();
            clearTimeout(timeout);
            controller.close();
          }
        } catch {
          // Controller already closed (client disconnected)
          unsubscribe();
          clearTimeout(timeout);
        }
      });

      // Safety timeout: close after 3 minutes
      const timeout = setTimeout(() => {
        unsubscribe();
        try {
          controller.enqueue(
            encode({ type: "error", data: { message: "Analysis timeout" } })
          );
          controller.close();
        } catch {
          // already closed
        }
      }, 180_000);

      // Wire up the cancel handler so cleanup runs on client disconnect
      cleanup = () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    },

    // Called when the client disconnects — this IS invoked by the Streams spec
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
