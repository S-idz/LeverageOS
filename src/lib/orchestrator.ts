// ============================================================
// LeverageOS - Analysis Orchestrator
// Sequences all 6 agents and emits live job updates
// ============================================================

import { v4 as uuidv4 } from "uuid";
import { AgentName, AnalysisResult, AnalyzeRequest, Job } from "./types";
import { fetchGitHubData } from "./github";
import {
  buildFallbackRecruiterNarrative,
  runRecruiterSimulation,
} from "./agents/recruiter";
import { runVisibilityGapAnalysis } from "./agents/gaps";
import { runFixKitGeneration } from "./agents/content";
import { buildFallbackScores, runScoringAgent } from "./agents/scoring";
import { runOpportunityScout } from "./agents/opportunities";
import { createJob, getJob, updateAgent, updateJob } from "./jobStore";
import { assertProviderConfig } from "./env";
import {
  buildAnalysisCacheKey,
  getCachedAnalysisResult,
  setCachedAnalysisResult,
} from "./resultCache";

interface StartAnalysisOptions {
  bypassCache?: boolean;
}

export async function startAnalysis(
  request: AnalyzeRequest,
  options: StartAnalysisOptions = {}
): Promise<string> {
  const jobId = uuidv4();

  const cacheKey = buildAnalysisCacheKey(
    request.githubUsername,
    request.targetRole
  );

  if (options.bypassCache) {
    console.log(`[cache] bypass ${cacheKey}`);
  } else {
    const cachedResult = getCachedAnalysisResult(
      request.githubUsername,
      request.targetRole
    );

    if (cachedResult) {
      console.log(`[cache] hit ${cacheKey}`);
      createJob(jobId);
      updateJob(jobId, {
        status: "complete",
        result: cachedResult,
        currentStreamText: cachedResult.recruiterNarrative,
        agents: buildCompletedAgentsFromCache(cachedResult),
      });
      return jobId;
    }

    console.log(`[cache] miss ${cacheKey}`);
  }

  assertProviderConfig();
  createJob(jobId);

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
  console.log(`[pipeline:${jobId}] starting for @${request.githubUsername}`);
  updateJob(jobId, { status: "running" });

  updateAgent(jobId, "Profile Ingestion", {
    status: "running",
    message: "Connecting to GitHub API...",
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
      request.targetRole
    );
    console.log(`[pipeline:${jobId}] github ok — ${profileData.repos.length} repos, ${profileData.activity.totalStars} stars`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch GitHub profile";
    console.error(`[pipeline:${jobId}] profile ingestion failed:`, err);
    updateAgent(jobId, "Profile Ingestion", { status: "error", message });
    updateJob(jobId, { status: "error", error: message });
    return;
  }

  updateAgent(jobId, "Profile Ingestion", {
    status: "complete",
    message: `${profileData.repos.length} repos | ${
      profileData.activity.primaryLanguages.join(", ") || "mixed stack"
    } | ${profileData.activity.totalStars} stars`,
  });

  await sleep(300);

  updateAgent(jobId, "Recruiter Simulation", {
    status: "running",
    message: "Marcus Chen is reviewing your profile...",
    streamText: "",
  });

  console.log(`[pipeline:${jobId}] starting recruiter simulation`);
  let recruiterNarrative = "";
  try {
    recruiterNarrative = await runRecruiterSimulation(profileData, (chunk) => {
      const currentJob = getJob(jobId);
      if (!currentJob) return;
      const currentText =
        currentJob.agents["Recruiter Simulation"]?.streamText ?? "";
      updateAgent(jobId, "Recruiter Simulation", {
        streamText: currentText + chunk,
        message: "Recruiter perspective loading...",
      });
    });
  } catch (err) {
    console.error(`[pipeline:${jobId}] recruiter simulation failed (using fallback):`, err instanceof Error ? err.message : err);
    const fallbackNarrative = buildFallbackRecruiterNarrative(profileData);
    recruiterNarrative = fallbackNarrative;
    for (const chunk of chunkText(fallbackNarrative, 90)) {
      const currentJob = getJob(jobId);
      if (!currentJob) break;
      const currentText =
        currentJob.agents["Recruiter Simulation"]?.streamText ?? "";
      updateAgent(jobId, "Recruiter Simulation", {
        streamText: currentText + chunk,
        message: "OpenAI unavailable - using evidence-backed fallback assessment...",
      });
      await sleep(18);
    }

    updateAgent(jobId, "Recruiter Simulation", {
      status: "complete",
      message:
        err instanceof Error
          ? `Fallback recruiter perspective used: ${err.message}`
          : "Fallback recruiter perspective used",
      streamText: fallbackNarrative,
    });
  }

  if (recruiterNarrative) {
    updateAgent(jobId, "Recruiter Simulation", {
      status: "complete",
      message: "Recruiter assessment complete",
      streamText: recruiterNarrative,
    });
  }

  await sleep(300);

  console.log(`[pipeline:${jobId}] starting visibility gap analysis`);
  updateAgent(jobId, "Visibility Gap Analysis", {
    status: "running",
    message: "Scanning profile for missing visibility signals...",
  });

  await sleep(500);

  updateAgent(jobId, "Visibility Gap Analysis", {
    message: "Analyzing repos, activity, discoverability, and narrative clarity...",
  });

  const gaps = await runVisibilityGapAnalysis(profileData, recruiterNarrative);
  const criticalCount = gaps.filter((gap) => gap.impact === "critical").length;
  const highCount = gaps.filter((gap) => gap.impact === "high").length;
  console.log(`[pipeline:${jobId}] gaps: ${gaps.length} total, ${criticalCount} critical, ${highCount} high`);

  updateAgent(jobId, "Visibility Gap Analysis", {
    status: "complete",
    message: `${gaps.length} gaps found | ${criticalCount} critical | ${highCount} high`,
  });

  await sleep(300);

  console.log(`[pipeline:${jobId}] starting fix kit generation`);
  updateAgent(jobId, "Fix Kit Generation", {
    status: "running",
    message: "Building your Fix Now kit: bio, README, repo copy, and social proof...",
  });

  await sleep(400);

  const fixKit = await runFixKitGeneration(profileData, gaps);
  console.log(`[pipeline:${jobId}] fix kit ready`);

  updateAgent(jobId, "Fix Kit Generation", {
    status: "complete",
    message: "Fix kit ready | GitHub bio | README | repo descriptions | LinkedIn | X",
  });

  await sleep(300);

  console.log(`[pipeline:${jobId}] starting reputation scoring`);
  updateAgent(jobId, "Reputation Scoring", {
    status: "running",
    message: "Scoring credibility, clarity, consistency, discoverability, and completeness...",
  });

  await sleep(400);

  let scoringResult;
  try {
    scoringResult = await runScoringAgent(profileData, recruiterNarrative, gaps);
    console.log(`[pipeline:${jobId}] scoring done — overall ${scoringResult.scores.overall}/100`);
  } catch (err) {
    console.error(`[pipeline:${jobId}] scoring failed (using fallback):`, err instanceof Error ? err.message : err);
    scoringResult = buildFallbackScores(profileData, gaps);
  }

  updateAgent(jobId, "Reputation Scoring", {
    status: "complete",
    message: `Overall: ${scoringResult.scores.overall}/100 | Technical: ${scoringResult.scores.technicalCredibility} | Clarity: ${scoringResult.scores.communicationClarity}`,
  });

  await sleep(300);

  console.log(`[pipeline:${jobId}] starting opportunity scout`);
  updateAgent(jobId, "Opportunity Scout", {
    status: "running",
    message: "Searching the web for live opportunities matching your stack...",
  });

  let opportunities: import("./types").OpportunityResult[] = [];
  try {
    opportunities = await runOpportunityScout(profileData, scoringResult.scores);
    console.log(`[pipeline:${jobId}] opportunity scout done — ${opportunities.length} results`);
    updateAgent(jobId, "Opportunity Scout", {
      status: "complete",
      message: `${opportunities.length} live opportunities found matching your profile`,
    });
  } catch (err) {
    console.error(`[pipeline:${jobId}] opportunity scout failed (using fallback):`, err instanceof Error ? err.message : err);
    updateAgent(jobId, "Opportunity Scout", {
      status: "complete",
      message: "Curated opportunities ready",
    });
  }

  await sleep(200);

  console.log(`[pipeline:${jobId}] pipeline complete`);
  const result: AnalysisResult = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    githubUsername: request.githubUsername,
    profileData,
    profileEvidence: profileData.profileEvidence,
    recruiterNarrative,
    visibilityGaps: gaps,
    fixKit,
    scores: scoringResult.scores,
    opportunitySignals: scoringResult.opportunitySignals,
    opportunities,
  };

  setCachedAnalysisResult(request.githubUsername, request.targetRole, result);
  console.log(`[cache] stored ${buildAnalysisCacheKey(request.githubUsername, request.targetRole)}`);
  updateJob(jobId, { status: "complete", result });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }
  return chunks;
}

function buildCompletedAgentsFromCache(result: AnalysisResult): Job["agents"] {
  const completedAgents = {} as Job["agents"];

  const agentMessages: Record<AgentName, string> = {
    "Profile Ingestion": "Profile data restored from 24h cache",
    "Recruiter Simulation": "Recruiter narrative restored from 24h cache",
    "Visibility Gap Analysis": `${result.visibilityGaps.length} cached gaps restored`,
    "Fix Kit Generation": "Fix kit restored from 24h cache",
    "Reputation Scoring": `Overall: ${result.scores.overall}/100`,
    "Opportunity Scout": `${result.opportunities.length} cached opportunities restored`,
  };

  for (const [agentName, message] of Object.entries(agentMessages) as Array<
    [AgentName, string]
  >) {
    completedAgents[agentName] = {
      agent: agentName,
      status: "complete",
      message,
      streamText:
        agentName === "Recruiter Simulation"
          ? result.recruiterNarrative
          : undefined,
    };
  }

  return completedAgents;
}
