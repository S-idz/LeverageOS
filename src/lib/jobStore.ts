// ============================================================
// LeverageOS — In-Memory Job Store
// Global singleton that persists across hot reloads in dev
// ============================================================

import { Job, AgentName, AGENT_ORDER } from "./types";

function createInitialAgents(): Job["agents"] {
  const agents: Partial<Job["agents"]> = {};
  for (const name of AGENT_ORDER) {
    agents[name] = {
      agent: name,
      status: "pending",
      message: "Waiting...",
    };
  }
  return agents as Job["agents"];
}

declare global {
  // eslint-disable-next-line no-var
  var __jobStore: Map<string, Job> | undefined;
  // eslint-disable-next-line no-var
  var __jobListeners: Map<string, Array<(job: Job) => void>> | undefined;
}

export const jobStore: Map<string, Job> =
  global.__jobStore ?? (global.__jobStore = new Map());

export const jobListeners: Map<string, Array<(job: Job) => void>> =
  global.__jobListeners ?? (global.__jobListeners = new Map());

export function createJob(id: string): Job {
  const job: Job = {
    id,
    status: "queued",
    agents: createInitialAgents(),
    currentStreamText: "",
    createdAt: Date.now(),
  };
  jobStore.set(id, job);
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const job = jobStore.get(id);
  if (!job) return null;
  const updated = { ...job, ...updates };
  jobStore.set(id, updated);
  // Notify all listeners
  const listeners = jobListeners.get(id) ?? [];
  for (const listener of listeners) {
    listener(updated);
  }
  return updated;
}

export function updateAgent(
  jobId: string,
  agentName: AgentName,
  update: Partial<Job["agents"][AgentName]>
): Job | null {
  const job = jobStore.get(jobId);
  if (!job) return null;
  const updatedJob = {
    ...job,
    agents: {
      ...job.agents,
      [agentName]: {
        ...job.agents[agentName],
        ...update,
      },
    },
  };
  jobStore.set(jobId, updatedJob);
  const listeners = jobListeners.get(jobId) ?? [];
  for (const listener of listeners) {
    listener(updatedJob);
  }
  return updatedJob;
}

export function subscribeToJob(
  jobId: string,
  listener: (job: Job) => void
): () => void {
  const existing = jobListeners.get(jobId) ?? [];
  jobListeners.set(jobId, [...existing, listener]);
  return () => {
    const current = jobListeners.get(jobId) ?? [];
    jobListeners.set(
      jobId,
      current.filter((l) => l !== listener)
    );
  };
}

export function getJob(id: string): Job | undefined {
  return jobStore.get(id);
}

// Clean up old jobs (older than 1 hour)
export function cleanupJobs(): void {
  const oneHourAgo = Date.now() - 3_600_000;
  for (const [id, job] of jobStore.entries()) {
    if (job.createdAt < oneHourAgo) {
      jobStore.delete(id);
      jobListeners.delete(id);
    }
  }
}

// Auto-cleanup every 10 minutes — guard prevents duplicate intervals on hot reload
declare global {
  // eslint-disable-next-line no-var
  var __cleanupInterval: ReturnType<typeof setInterval> | undefined;
}
if (!global.__cleanupInterval) {
  global.__cleanupInterval = setInterval(cleanupJobs, 600_000);
}
