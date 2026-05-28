// ============================================================
// LeverageOS - Visibility Gap Analysis Agent
// Hybrid: rules-based detection + LLM explanation
// ============================================================

import { getOpenAI } from "../openai";
import { chatModel } from "../models";
import { ProfileData, VisibilityGap } from "../types";
import { buildProfileSummary } from "../github";
import { v4 as uuidv4 } from "uuid";

function detectRuleBasedGaps(data: ProfileData): VisibilityGap[] {
  const gaps: VisibilityGap[] = [];
  const { profile, repos, activity, profileEvidence } = data;

  if (!profile.hasReadme) {
    gaps.push({
      id: uuidv4(),
      title: "No GitHub Profile README",
      description:
        "Your profile has no README.md. This is the first thing recruiters see when they visit your GitHub, and without it your profile looks unfinished.",
      impact: "critical",
      fixTimeMinutes: 15,
      category: "profile",
      recruiterImpact:
        "Recruiters immediately look for a profile README. Missing it signals low effort.",
      evidence: [
        "GitHub profile README is currently missing.",
        profileEvidence.summary,
      ],
    });
  }

  if (!profile.bio || profile.bio.trim().length < 20) {
    gaps.push({
      id: uuidv4(),
      title: "Missing or Thin GitHub Bio",
      description: `Your bio is ${
        profile.bio ? "too short to be useful" : "completely empty"
      }. This is prime profile real estate and should tell recruiters what you do in seconds.`,
      impact: "high",
      fixTimeMinutes: 5,
      category: "profile",
      recruiterImpact:
        "Recruiters scan bio for role, stack, and positioning. Empty bio means weak first-pass clarity.",
      evidence: [
        profile.bio
          ? `Current bio length is ${profile.bio.trim().length} characters.`
          : "GitHub bio is currently empty.",
        profileEvidence.summary,
      ],
    });
  }

  const reposWithoutDesc = repos.filter((repo) => !repo.hasDescription).length;
  const repoDescRatio = repos.length > 0 ? reposWithoutDesc / repos.length : 1;
  if (repoDescRatio > 0.5 && repos.length > 2) {
    gaps.push({
      id: uuidv4(),
      title: `${reposWithoutDesc}/${repos.length} Repos Have No Description`,
      description:
        "More than half your repositories have no description. Recruiters will not read source code to understand project quality, so these repos lose most of their signaling power.",
      impact: repoDescRatio > 0.75 ? "critical" : "high",
      fixTimeMinutes: 20,
      category: "content",
      recruiterImpact:
        "Each repo without a description is a missed chance to communicate scope and usefulness.",
      evidence: [
        profileEvidence.descriptionCoverage.summary,
        "Recruiters should not need to inspect source code to understand what a project is.",
      ],
    });
  }

  if (activity.commitFrequency === "inactive" || activity.longestGapDays > 90) {
    gaps.push({
      id: uuidv4(),
      title: `Profile Appears Inactive (${activity.longestGapDays}+ days)`,
      description:
        "Your visible GitHub activity looks stale. Even if you have been shipping privately, the public signal currently reads as low momentum.",
      impact: "high",
      fixTimeMinutes: 30,
      category: "activity",
      recruiterImpact:
        "Long unexplained activity gaps make recruiters question current engagement and sharpness.",
      evidence: [
        `Last visible GitHub activity was about ${activity.longestGapDays} days ago.`,
        `Commit frequency currently reads as ${activity.commitFrequency}.`,
      ],
    });
  }

  const reposWithTopics = repos.filter((repo) => repo.hasTopics).length;
  if (reposWithTopics === 0 && repos.length > 2) {
    gaps.push({
      id: uuidv4(),
      title: "No Repository Topics/Tags",
      description:
        "None of your repositories have topics. That makes them much harder to discover through technology-specific search and filtering.",
      impact: "medium",
      fixTimeMinutes: 15,
      category: "discoverability",
      recruiterImpact:
        "Topics improve GitHub discoverability and make it easier to map repos to a specific stack.",
      evidence: [
        profileEvidence.topicsCoverage.summary,
        "GitHub search and recruiter filters rely on tags/topics for fast discovery.",
      ],
    });
  }

  if (profile.followers < 5 && profile.publicRepos > 5) {
    gaps.push({
      id: uuidv4(),
      title: "No Community Presence",
      description:
        "You have visible output but almost no social proof around it. The profile reads isolated rather than connected to a broader builder community.",
      impact: "medium",
      fixTimeMinutes: 60,
      category: "discoverability",
      recruiterImpact:
        "Community engagement acts as a proxy for visibility, maturity, and peer validation.",
      evidence: [
        `${profile.publicRepos} public repos but only ${profile.followers} followers.`,
        "There is little visible audience pull or community signal around the profile yet.",
      ],
    });
  }

  if (!profile.blog || profile.blog.trim() === "") {
    gaps.push({
      id: uuidv4(),
      title: "No Portfolio/Website Linked",
      description:
        "Your profile has no website or portfolio link, so there is no second destination for recruiters to validate polish, context, or professional narrative.",
      impact: "medium",
      fixTimeMinutes: 60,
      category: "profile",
      recruiterImpact:
        "A strong second destination increases trust and gives recruiters another surface to evaluate you quickly.",
      evidence: [
        "GitHub profile does not currently link to a website or portfolio.",
        "Recruiters have no second destination to validate narrative and polish.",
      ],
    });
  }

  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return gaps
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);
}

async function generateStrategicInsight(
  profileData: ProfileData,
  rulesGaps: VisibilityGap[],
  recruiterNarrative: string
): Promise<VisibilityGap | null> {
  try {
    const summary = buildProfileSummary(profileData);
    const gapTitles = rulesGaps.map((gap) => gap.title).join(", ");

    const response = await getOpenAI().chat.completions.create({
      model: chatModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a career visibility strategist.
Based on a GitHub profile analysis and recruiter feedback, identify exactly one additional strategic gap the rules engine may have missed.

Return JSON only:
{
  "title": "short gap title",
  "description": "2-3 sentence specific description",
  "impact": "high" or "medium",
  "fixTimeMinutes": number,
  "category": "profile" or "content" or "communication",
  "recruiterImpact": "one sentence on recruiter impact",
  "evidence": ["fact 1", "fact 2"]
}`,
        },
        {
          role: "user",
          content: `Profile:
${summary}

Recruiter said:
${recruiterNarrative}

Already detected gaps: ${gapTitles}

What one additional strategic gap do you see?`,
        },
      ],
      max_tokens: 320,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const raw = JSON.parse(content) as Partial<VisibilityGap>;

    if (!raw.title) return null;

    return {
      id: uuidv4(),
      title: raw.title,
      description: raw.description ?? "",
      impact: (raw.impact as VisibilityGap["impact"]) ?? "medium",
      fixTimeMinutes: raw.fixTimeMinutes ?? 30,
      category: (raw.category as VisibilityGap["category"]) ?? "profile",
      recruiterImpact: raw.recruiterImpact ?? "",
      evidence: Array.isArray(raw.evidence)
        ? raw.evidence.filter((item): item is string => typeof item === "string").slice(0, 3)
        : profileData.profileEvidence.proofPoints.slice(0, 2),
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
