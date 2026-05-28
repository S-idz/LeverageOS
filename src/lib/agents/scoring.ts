// ============================================================
// LeverageOS - Reputation Scoring Agent
// Structured output: 5 dimension scores + opportunity signals
// ============================================================

import { getOpenAI } from "../openai";
import { chatModel, supportsResponsesApi } from "../models";
import { ProfileData, VisibilityGap, PerceptionScores } from "../types";
import { buildProfileSummary } from "../github";

interface ScoringOutput {
  technicalCredibility: number;
  communicationClarity: number;
  consistency: number;
  discoverability: number;
  profileCompleteness: number;
  reasoning: string;
  opportunitySignals: string[];
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildFallbackScores(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): { scores: PerceptionScores; opportunitySignals: string[] } {
  const { profile, activity, profileEvidence } = profileData;
  const critical = gaps.filter((gap) => gap.impact === "critical").length;
  const high = gaps.filter((gap) => gap.impact === "high").length;

  const technicalCredibility = clampScore(
    42 +
      Math.min(activity.totalStars, 40) * 0.7 +
      Math.min(profileEvidence.topRepos.length, 3) * 6 +
      Math.min(profileEvidence.strongestLanguages.length, 3) * 4
  );
  const communicationClarity = clampScore(
    18 +
      (profileEvidence.hasProfileReadme ? 22 : 0) +
      profileEvidence.descriptionCoverage.ratio * 35 +
      (profileEvidence.bioQuality === "strong"
        ? 15
        : profileEvidence.bioQuality === "thin"
        ? 6
        : 0)
  );
  const consistency = clampScore(
    activity.commitFrequency === "daily"
      ? 84
      : activity.commitFrequency === "weekly"
      ? 72
      : activity.commitFrequency === "monthly"
      ? 56
      : 34
  );
  const discoverability = clampScore(
    20 +
      profileEvidence.topicsCoverage.ratio * 32 +
      (profileEvidence.hasProfileReadme ? 16 : 0) +
      Math.min(profile.followers, 20)
  );
  const profileCompleteness = clampScore(
    28 +
      (profile.bio ? 14 : 0) +
      (profile.name ? 10 : 0) +
      (profile.blog ? 12 : 0) +
      (profile.location ? 8 : 0) +
      (profile.email ? 6 : 0) +
      (profileEvidence.hasProfileReadme ? 18 : 0)
  );

  const scores: PerceptionScores = {
    technicalCredibility,
    communicationClarity: clampScore(communicationClarity - critical * 4),
    consistency: clampScore(consistency - high * 3),
    discoverability: clampScore(discoverability - critical * 5 - high * 2),
    profileCompleteness: clampScore(profileCompleteness - critical * 3),
    overall: 0,
  };

  scores.overall = clampScore(
    scores.technicalCredibility * 0.3 +
      scores.communicationClarity * 0.25 +
      scores.consistency * 0.2 +
      scores.discoverability * 0.15 +
      scores.profileCompleteness * 0.1
  );

  const opportunitySignals =
    profileEvidence.proofPoints.length > 0
      ? profileEvidence.proofPoints.slice(0, 3)
      : [
          "There is real technical work to package more clearly.",
          "A stronger narrative could materially improve recruiter response.",
        ];

  return { scores, opportunitySignals };
}

export async function runScoringAgent(
  profileData: ProfileData,
  recruiterNarrative: string,
  gaps: VisibilityGap[]
): Promise<{ scores: PerceptionScores; opportunitySignals: string[] }> {
  const summary = buildProfileSummary(profileData);
  const gapSummary = gaps
    .map((gap) => `- [${gap.impact.toUpperCase()}] ${gap.title}`)
    .join("\n");

  const systemPrompt = `You are a reputation scoring system for technical professionals.
Score each dimension from 0-100.

Scoring rubrics:
- technicalCredibility: repo quality, stars, depth, complexity
- communicationClarity: bio, descriptions, README, clarity of story
- consistency: visible activity patterns
- discoverability: topics, links, README, followers, searchability
- profileCompleteness: profile fields filled meaningfully

Return ONLY valid JSON with no extra text:
{
  "technicalCredibility": number,
  "communicationClarity": number,
  "consistency": number,
  "discoverability": number,
  "profileCompleteness": number,
  "reasoning": "2 sentence explanation",
  "opportunitySignals": ["signal 1", "signal 2", "signal 3"]
}`;

  const userPrompt = `Profile:
${summary}

Recruiter assessment:
${recruiterNarrative}

Detected gaps:
${gapSummary}`;

  let rawText = "";

  if (supportsResponsesApi()) {
    // OpenAI endpoint: use o4-mini via Responses API for reasoning quality
    const response = await getOpenAI().responses.create({
      model: "o4-mini",
      input: `${systemPrompt}\n\n${userPrompt}`,
    });

    type MessageItem = { type: "message"; content: { type: string; text?: string }[] };
    rawText = (response.output as { type: string }[])
      .filter((item): item is MessageItem => item.type === "message" && "content" in item)
      .flatMap((item) => item.content.filter((c) => c.type === "output_text"))
      .map((c) => c.text ?? "")
      .join("");
  } else {
    // Groq / other OpenAI-compatible provider: fall back to chat.completions
    const response = await getOpenAI().chat.completions.create({
      model: chatModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 420,
      temperature: 0.3,
    });
    rawText = response.choices[0]?.message?.content ?? "{}";
  }

  let raw: Partial<ScoringOutput> = {};
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    raw = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as Partial<ScoringOutput>;
  } catch {
    raw = {};
  }

  const scores: PerceptionScores = {
    technicalCredibility: clampScore(raw.technicalCredibility ?? 50),
    communicationClarity: clampScore(raw.communicationClarity ?? 40),
    consistency: clampScore(raw.consistency ?? 45),
    discoverability: clampScore(raw.discoverability ?? 35),
    profileCompleteness: clampScore(raw.profileCompleteness ?? 50),
    overall: 0,
  };

  scores.overall = clampScore(
    scores.technicalCredibility * 0.3 +
      scores.communicationClarity * 0.25 +
      scores.consistency * 0.2 +
      scores.discoverability * 0.15 +
      scores.profileCompleteness * 0.1
  );

  const opportunitySignals: string[] = Array.isArray(raw.opportunitySignals)
    ? raw.opportunitySignals.filter((item): item is string => typeof item === "string").slice(0, 3)
    : ["Strong technical foundation", "Clear room to improve visibility"];

  return { scores, opportunitySignals };
}
