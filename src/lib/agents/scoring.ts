// ============================================================
// LeverageOS — Reputation Scoring Agent
// Structured output: 5 dimension scores + opportunity signals
// ============================================================

import { openai } from "../openai";
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

export async function runScoringAgent(
  profileData: ProfileData,
  recruiterNarrative: string,
  gaps: VisibilityGap[]
): Promise<{ scores: PerceptionScores; opportunitySignals: string[] }> {
  const summary = buildProfileSummary(profileData);
  const gapSummary = gaps
    .map((g) => `- [${g.impact.toUpperCase()}] ${g.title}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a reputation scoring system for technical professionals. You score GitHub profiles on 5 dimensions.

Score each dimension from 0-100 based on the profile data and recruiter assessment.

Scoring rubrics:
- technicalCredibility (0-100): repo quality, languages, stars, depth of work, project complexity
- communicationClarity (0-100): bio quality, repo descriptions, README presence, how well they explain their work
- consistency (0-100): commit frequency, activity patterns, no major unexplained gaps
- discoverability (0-100): topics/tags, blog link, followers, README, searchability
- profileCompleteness (0-100): bio, name, email, blog, location, avatar — all filled meaningfully

Also identify 2-3 "opportunity signals" — specific things that make this person attractive or ready for opportunities RIGHT NOW.

Respond with JSON only:
{
  "technicalCredibility": number,
  "communicationClarity": number,
  "consistency": number,
  "discoverability": number,
  "profileCompleteness": number,
  "reasoning": "2-sentence explanation of the overall score",
  "opportunitySignals": ["signal 1", "signal 2", "signal 3"]
}`,
      },
      {
        role: "user",
        content: `Profile:\n${summary}\n\nRecruiter assessment:\n${recruiterNarrative}\n\nDetected gaps:\n${gapSummary}\n\nProvide the reputation scores.`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 400,
    temperature: 0.3,
  });

  let raw: Partial<ScoringOutput> = {};
  try {
    raw = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    ) as Partial<ScoringOutput>;
  } catch {
    console.error(
      "Scoring agent: failed to parse JSON response",
      response.choices[0]?.message?.content
    );
    // Fall through with empty raw — clamp() will apply fallback values
  }

  const clamp = (n: number | undefined, fallback: number) =>
    Math.min(100, Math.max(0, Math.round(n ?? fallback)));

  const scores: PerceptionScores = {
    technicalCredibility: clamp(raw.technicalCredibility, 50),
    communicationClarity: clamp(raw.communicationClarity, 40),
    consistency: clamp(raw.consistency, 45),
    discoverability: clamp(raw.discoverability, 35),
    profileCompleteness: clamp(raw.profileCompleteness, 50),
    overall: 0,
  };

  scores.overall = Math.round(
    scores.technicalCredibility * 0.3 +
      scores.communicationClarity * 0.25 +
      scores.consistency * 0.2 +
      scores.discoverability * 0.15 +
      scores.profileCompleteness * 0.1
  );

  const opportunitySignals: string[] = Array.isArray(raw.opportunitySignals)
    ? (raw.opportunitySignals as string[]).slice(0, 3)
    : ["Strong technical foundation", "Active project development"];

  return { scores, opportunitySignals };
}
