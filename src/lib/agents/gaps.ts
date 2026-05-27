// ============================================================
// LeverageOS — Visibility Gap Analysis Agent
// Hybrid: rules-based detection + LLM explanation
// ============================================================

import { getOpenAI } from "../openai";
import { ProfileData, VisibilityGap } from "../types";
import { buildProfileSummary } from "../github";
import { v4 as uuidv4 } from "uuid";

// ---- Rules Engine ----
// Fast, reliable, deterministic detection
function detectRuleBasedGaps(data: ProfileData): VisibilityGap[] {
  const gaps: VisibilityGap[] = [];
  const { profile, repos, activity } = data;

  // G1: No profile README
  if (!profile.hasReadme) {
    gaps.push({
      id: uuidv4(),
      title: "No GitHub Profile README",
      description: `Your profile has no README.md. This is the first thing recruiters see when they visit your GitHub — it's your digital handshake. Without it, your profile looks abandoned.`,
      impact: "critical",
      fixTimeMinutes: 15,
      category: "profile",
      recruiterImpact:
        "80% of recruiters immediately look for a profile README. Missing it signals low effort.",
    });
  }

  // G2: No/empty bio
  if (!profile.bio || profile.bio.trim().length < 20) {
    gaps.push({
      id: uuidv4(),
      title: "Missing or Thin GitHub Bio",
      description: `Your bio is ${
        profile.bio ? "too short to be useful" : "completely empty"
      }. Your bio is 160 characters of prime real estate recruiters read in 5 seconds.`,
      impact: "high",
      fixTimeMinutes: 5,
      category: "profile",
      recruiterImpact:
        "Recruiters scan bio for role, stack, and personality. Empty bio = invisible candidate.",
    });
  }

  // G3: Repos missing descriptions
  const reposWithoutDesc = repos.filter((r) => !r.hasDescription).length;
  const repoDescRatio = repos.length > 0 ? reposWithoutDesc / repos.length : 1;
  if (repoDescRatio > 0.5 && repos.length > 2) {
    gaps.push({
      id: uuidv4(),
      title: `${reposWithoutDesc}/${repos.length} Repos Have No Description`,
      description: `More than half your repositories have no description. Recruiters cannot determine project quality without reading code — they won't. These repos are invisible to screening.`,
      impact: repoDescRatio > 0.75 ? "critical" : "high",
      fixTimeMinutes: 20,
      category: "content",
      recruiterImpact:
        "Recruiters skip repos with no description. Each undescribed repo is a missed signal.",
    });
  }

  // G4: Low activity / inactive
  if (
    activity.commitFrequency === "inactive" ||
    activity.longestGapDays > 90
  ) {
    gaps.push({
      id: uuidv4(),
      title: `Profile Appears Inactive (${activity.longestGapDays}+ days)`,
      description: `Your last commit was ${activity.longestGapDays}+ days ago. Recruiters interpret inactivity as disengagement — even if you've been busy with private work or coursework.`,
      impact: "high",
      fixTimeMinutes: 30,
      category: "activity",
      recruiterImpact:
        "Active GitHub profiles get 3x more recruiter outreach. Gaps without explanation hurt.",
    });
  }

  // G5: No topics/tags on repos
  const reposWithTopics = repos.filter((r) => r.hasTopics).length;
  if (reposWithTopics === 0 && repos.length > 2) {
    gaps.push({
      id: uuidv4(),
      title: "No Repository Topics/Tags",
      description: `None of your repositories have topics. GitHub uses topics for discovery. Without them, your repos don't appear in technology-specific searches recruiters run.`,
      impact: "medium",
      fixTimeMinutes: 15,
      category: "discoverability",
      recruiterImpact:
        "GitHub topics drive organic discovery. Missing topics = invisible in search.",
    });
  }

  // G6: Low follower count for experience level
  if (profile.followers < 5 && profile.publicRepos > 5) {
    gaps.push({
      id: uuidv4(),
      title: "No Community Presence",
      description: `You have ${profile.publicRepos} repos but only ${profile.followers} followers. This signals you're building in isolation — no community engagement, no professional network on GitHub.`,
      impact: "medium",
      fixTimeMinutes: 60,
      category: "discoverability",
      recruiterImpact:
        "Community engagement signals seniority and professional maturity.",
    });
  }

  // G7: No blog/website linked
  if (!profile.blog || profile.blog.trim() === "") {
    gaps.push({
      id: uuidv4(),
      title: "No Portfolio/Website Linked",
      description: `Your profile has no website or portfolio link. Candidates with a linked portfolio get significantly more recruiter clicks — it shows you care about presentation.`,
      impact: "medium",
      fixTimeMinutes: 60,
      category: "profile",
      recruiterImpact:
        "Portfolio link = 2x profile engagement from recruiters.",
    });
  }

  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return gaps
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);
}

// ---- LLM-Enhanced Gap: Strategic Narrative ----
async function generateStrategicInsight(
  profileData: ProfileData,
  rulesGaps: VisibilityGap[],
  recruiterNarrative: string
): Promise<VisibilityGap | null> {
  try {
    const summary = buildProfileSummary(profileData);
    const gapTitles = rulesGaps.map((g) => g.title).join(", ");

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a career visibility strategist. Based on a GitHub profile analysis and recruiter feedback, identify ONE strategic gap that the rules engine may have missed.

Focus on: narrative coherence, positioning clarity, technical specialization signals, or opportunity alignment.

Return ONLY a JSON object with this structure:
{
  "title": "short gap title",
  "description": "2-3 sentence specific description referencing their actual profile",
  "impact": "high" or "medium",
  "fixTimeMinutes": number,
  "category": "profile" or "content" or "communication",
  "recruiterImpact": "one sentence on recruiter impact"
}`,
        },
        {
          role: "user",
          content: `Profile:\n${summary}\n\nRecruiter said:\n${recruiterNarrative}\n\nAlready detected gaps: ${gapTitles}\n\nWhat ONE additional strategic gap do you see?`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let raw: Partial<VisibilityGap> = {};
    try {
      raw = JSON.parse(content) as Partial<VisibilityGap>;
    } catch {
      return null;
    }

    if (!raw.title) return null;

    return {
      id: uuidv4(),
      title: raw.title,
      description: raw.description ?? "",
      impact: (raw.impact as VisibilityGap["impact"]) ?? "medium",
      fixTimeMinutes: raw.fixTimeMinutes ?? 30,
      category: (raw.category as VisibilityGap["category"]) ?? "profile",
      recruiterImpact: raw.recruiterImpact ?? "",
    };
  } catch {
    return null;
  }
}

export async function runVisibilityGapAnalysis(
  profileData: ProfileData,
  recruiterNarrative: string
): Promise<VisibilityGap[]> {
  const rulesGaps = detectRuleBasedGaps(profileData);

  // Add one LLM-powered strategic gap
  const strategicGap = await generateStrategicInsight(
    profileData,
    rulesGaps,
    recruiterNarrative
  );

  if (strategicGap) {
    rulesGaps.push(strategicGap);
  }

  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return rulesGaps
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);
}
