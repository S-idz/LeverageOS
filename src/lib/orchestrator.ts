// ============================================================
// LeverageOS — Analysis Orchestrator
// Sequences all 5 agents and emits live job updates
// ============================================================

import { v4 as uuidv4 } from "uuid";
import { AnalysisResult, AnalyzeRequest } from "./types";
import { fetchGitHubData } from "./github";
import { runRecruiterSimulation } from "./agents/recruiter";
import { runVisibilityGapAnalysis } from "./agents/gaps";
import { runContentGeneration } from "./agents/content";
import { runScoringAgent } from "./agents/scoring";
import { createJob, updateJob, updateAgent, getJob } from "./jobStore";

export async function startAnalysis(request: AnalyzeRequest): Promise<string> {
  const jobId = uuidv4();
  createJob(jobId);

  // Run in background — do not await
  runPipeline(jobId, request).catch((err) => {
    console.error(`Job ${jobId} pipeline error:`, err);
    updateJob(jobId, {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  });

  return jobId;
}

async function runPipeline(jobId: string, request: AnalyzeRequest): Promise<void> {
  updateJob(jobId, { status: "running" });

  // ── AGENT 1: Profile Ingestion ──────────────────────────
  updateAgent(jobId, "Profile Ingestion", {
    status: "running",
    message: `Connecting to GitHub API...`,
  });

  await sleep(400);

  updateAgent(jobId, "Profile Ingestion", {
    message: `Fetching @${request.githubUsername} profile data...`,
  });

  let profileData;
  try {
    profileData = await fetchGitHubData(
      request.githubUsername,
      request.selfDescription,
      request.linkedinUrl
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch GitHub profile";
    updateAgent(jobId, "Profile Ingestion", { status: "error", message });
    updateJob(jobId, { status: "error", error: message });
    return;
  }

  updateAgent(jobId, "Profile Ingestion", {
    status: "complete",
    message: `${profileData.repos.length} repos · ${profileData.activity.primaryLanguages.join(", ")} · ${profileData.activity.totalStars} stars`,
  });

  await sleep(300);

  // ── AGENT 2: Recruiter Simulation ───────────────────────
  updateAgent(jobId, "Recruiter Simulation", {
    status: "running",
    message: "Marcus Chen is reviewing your profile...",
    streamText: "",
  });

  let recruiterNarrative = "";
  try {
    recruiterNarrative = await runRecruiterSimulation(
      profileData,
      (chunk) => {
        const currentJob = getJob(jobId);
        if (!currentJob) return;
        const currentText = currentJob.agents["Recruiter Simulation"]?.streamText ?? "";
        updateAgent(jobId, "Recruiter Simulation", {
          streamText: currentText + chunk,
          message: "Recruiter perspective loading...",
        });
      }
    );
  } catch (err) {
    updateAgent(jobId, "Recruiter Simulation", {
      status: "error",
      message: "Failed to generate recruiter perspective",
    });
    throw err;
  }

  updateAgent(jobId, "Recruiter Simulation", {
    status: "complete",
    message: "Recruiter assessment complete",
    streamText: recruiterNarrative,
  });

  await sleep(300);

  // ── AGENT 3: Visibility Gap Analysis ────────────────────
  updateAgent(jobId, "Visibility Gap Analysis", {
    status: "running",
    message: "Scanning profile for missing visibility signals...",
  });

  await sleep(500);

  updateAgent(jobId, "Visibility Gap Analysis", {
    message: "Analyzing repos, activity, discoverability, communication...",
  });

  const gaps = await runVisibilityGapAnalysis(profileData, recruiterNarrative);

  const criticalCount = gaps.filter((g) => g.impact === "critical").length;
  const highCount = gaps.filter((g) => g.impact === "high").length;

  updateAgent(jobId, "Visibility Gap Analysis", {
    status: "complete",
    message: `${gaps.length} gaps found · ${criticalCount} critical · ${highCount} high`,
  });

  await sleep(300);

  // ── AGENT 4: Content Generation ─────────────────────────
  updateAgent(jobId, "Content Generation", {
    status: "running",
    message: "Drafting LinkedIn post, X thread, GitHub README in parallel...",
  });

  await sleep(400);

  const generatedContent = await runContentGeneration(profileData, gaps);

  updateAgent(jobId, "Content Generation", {
    status: "complete",
    message: "3 content pieces ready · LinkedIn · X Thread · GitHub README",
  });

  await sleep(300);

  // ── AGENT 5: Reputation Scoring ─────────────────────────
  updateAgent(jobId, "Reputation Scoring", {
    status: "running",
    message: "Scoring across 5 dimensions: credibility, clarity, consistency...",
  });

  await sleep(400);

  const { scores, opportunitySignals } = await runScoringAgent(
    profileData,
    recruiterNarrative,
    gaps
  );

  updateAgent(jobId, "Reputation Scoring", {
    status: "complete",
    message: `Overall: ${scores.overall}/100 · Technical: ${scores.technicalCredibility} · Clarity: ${scores.communicationClarity}`,
  });

  await sleep(300);

  // ── Assemble Result ─────────────────────────────────────
  const result: AnalysisResult = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    githubUsername: request.githubUsername,
    profileData,
    recruiterNarrative,
    visibilityGaps: gaps,
    generatedContent,
    scores,
    opportunitySignals,
  };

  updateJob(jobId, { status: "complete", result });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
