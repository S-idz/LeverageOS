// ============================================================
// LeverageOS - Core Types
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

export interface CoverageMetric {
  covered: number;
  total: number;
  ratio: number;
  summary: string;
}

export interface EvidenceRepo {
  name: string;
  language: string | null;
  stars: number;
  description: string | null;
  url: string;
}

export interface ProfileEvidence {
  strongestLanguages: string[];
  topRepos: EvidenceRepo[];
  activityRecencyDays: number | null;
  activityLabel: string;
  hasProfileReadme: boolean;
  bioQuality: "strong" | "thin" | "missing";
  descriptionCoverage: CoverageMetric;
  topicsCoverage: CoverageMetric;
  proofPoints: string[];
  summary: string;
}

export interface ProfileData {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  activity: GitHubActivity;
  selfDescription: string;
  targetRole?: string;
  profileEvidence: ProfileEvidence;
}

export interface VisibilityGap {
  id: string;
  title: string;
  description: string;
  impact: "critical" | "high" | "medium" | "low";
  fixTimeMinutes: number;
  category:
    | "profile"
    | "content"
    | "activity"
    | "communication"
    | "discoverability";
  recruiterImpact: string;
  evidence: string[];
}

export interface FixItem {
  content: string;
  why: string;
  evidence: string[];
}

export interface RepoDescriptionFix {
  repoName: string;
  description: string;
  why: string;
  evidence: string[];
}

export interface PinnedRepoChoice {
  repoName: string;
  rationale: string;
}

export interface PinnedRepoStrategy {
  order: PinnedRepoChoice[];
  why: string;
  evidence: string[];
}

export interface ActionPlanStep {
  title: string;
  detail: string;
}

export interface ThirtyDayActionPlan {
  steps: ActionPlanStep[];
  why: string;
  evidence: string[];
}

export interface FixKit {
  githubBio: FixItem;
  githubProfileReadme: FixItem;
  repoDescriptions: RepoDescriptionFix[];
  pinnedRepoStrategy: PinnedRepoStrategy;
  linkedinHeadline: FixItem;
  linkedinAbout: FixItem;
  xThread: FixItem;
  linkedinPost: FixItem;
  resumeBullets: FixItem;
  coldOutreachDm: FixItem;
  thirtyDayActionPlan: ThirtyDayActionPlan;
}

export interface OpportunityResult {
  title: string;
  url: string;
  type: "job" | "hackathon" | "oss" | "grant";
  why: string;
  deadline?: string;
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
  profileEvidence: ProfileEvidence;
  recruiterNarrative: string;
  visibilityGaps: VisibilityGap[];
  fixKit: FixKit;
  scores: PerceptionScores;
  opportunitySignals: string[];
  opportunities: OpportunityResult[];
}

// ============================================================
// Job / Streaming Types
// ============================================================

export type AgentName =
  | "Profile Ingestion"
  | "Recruiter Simulation"
  | "Visibility Gap Analysis"
  | "Fix Kit Generation"
  | "Reputation Scoring"
  | "Opportunity Scout";

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
  "Fix Kit Generation",
  "Reputation Scoring",
  "Opportunity Scout",
];

// ============================================================
// API Types
// ============================================================

export interface AnalyzeRequest {
  githubUsername: string;
  selfDescription: string;
  targetRole?: string;
}

export interface AnalyzeResponse {
  jobId: string;
}

export type SSEEvent =
  | { type: "job_update"; data: Job }
  | { type: "error"; data: { message: string } };
