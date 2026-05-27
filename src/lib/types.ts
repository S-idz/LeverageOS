// ============================================================
// LeverageOS — Core Types
// ============================================================

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  blog: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  avatarUrl: string;
  hasReadme: boolean;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
  isForked: boolean;
  hasDescription: boolean;
  hasTopics: boolean;
  url: string;
}

export interface GitHubActivity {
  lastCommitDate: string | null;
  commitFrequency: "daily" | "weekly" | "monthly" | "inactive";
  longestGapDays: number;
  primaryLanguages: string[];
  totalStars: number;
  pinnedRepos: GitHubRepo[];
  topRepos: GitHubRepo[];
}

export interface ProfileData {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  activity: GitHubActivity;
  selfDescription: string;
  linkedinUrl?: string;
}

export interface VisibilityGap {
  id: string;
  title: string;
  description: string;
  impact: "critical" | "high" | "medium" | "low";
  fixTimeMinutes: number;
  category: "profile" | "content" | "activity" | "communication" | "discoverability";
  recruiterImpact: string;
}

export interface GeneratedContent {
  linkedinPost: string;
  xThread: string;
  githubReadme: string;
}

export interface PerceptionScores {
  overall: number;
  technicalCredibility: number;
  communicationClarity: number;
  consistency: number;
  discoverability: number;
  profileCompleteness: number;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  githubUsername: string;
  profileData: ProfileData;
  recruiterNarrative: string;
  visibilityGaps: VisibilityGap[];
  generatedContent: GeneratedContent;
  scores: PerceptionScores;
  opportunitySignals: string[];
}

// ============================================================
// Job / Streaming Types
// ============================================================

export type AgentName =
  | "Profile Ingestion"
  | "Recruiter Simulation"
  | "Visibility Gap Analysis"
  | "Content Generation"
  | "Reputation Scoring";

export type AgentStatus = "pending" | "running" | "complete" | "error";

export interface AgentUpdate {
  agent: AgentName;
  status: AgentStatus;
  message: string;
  streamText?: string;
}

export interface Job {
  id: string;
  status: "queued" | "running" | "complete" | "error";
  agents: Record<AgentName, AgentUpdate>;
  currentStreamText: string;
  result?: AnalysisResult;
  error?: string;
  createdAt: number;
}

export const AGENT_ORDER: AgentName[] = [
  "Profile Ingestion",
  "Recruiter Simulation",
  "Visibility Gap Analysis",
  "Content Generation",
  "Reputation Scoring",
];

// ============================================================
// API Types
// ============================================================

export interface AnalyzeRequest {
  githubUsername: string;
  linkedinUrl?: string;
  selfDescription: string;
}

export interface AnalyzeResponse {
  jobId: string;
}

// Events emitted by GET /api/stream/[jobId] and consumed by the analyzing page.
export type SSEEvent =
  | { type: "job_update"; data: Job }
  | { type: "error"; data: { message: string } };
