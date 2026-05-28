// ============================================================
// LeverageOS - Recruiter Simulation Agent
// Simulates how a senior recruiter perceives the profile
// ============================================================

import { getOpenAI } from "../openai";
import { streamingModel } from "../models";
import { ProfileData } from "../types";
import { buildProfileSummary } from "../github";

const SYSTEM_PROMPT = `You are Marcus Chen, a Senior Technical Recruiter at a top-tier tech company with 9 years of experience.
You review 50+ GitHub profiles every week when sourcing candidates.

You are honest, direct, and ruthlessly efficient. You have 45 seconds to evaluate a profile before deciding whether to continue.

Your job is to write your UNFILTERED internal monologue as you review this profile.
Write exactly 3 paragraphs:

Paragraph 1: Your immediate first impression
Paragraph 2: Your technical assessment
Paragraph 3: Your decision and reasoning

Rules:
- Be brutally honest but constructive
- Reference specific things from their profile
- Do not be generic
- Write in first person as Marcus
- Keep each paragraph to 3-4 sentences max`;

export function buildFallbackRecruiterNarrative(profileData: ProfileData): string {
  const { profile, activity, profileEvidence, targetRole } = profileData;
  const topRepo = profileEvidence.topRepos[0];
  const strongestLanguage = profileEvidence.strongestLanguages[0] ?? "their stack";

  const firstParagraph = [
    `I can tell there is real technical work behind ${profile.name ?? profile.username}, but the first impression still undersells it.`,
    profile.hasReadme
      ? "The profile README helps, but the narrative still needs to land faster."
      : "The missing profile README hurts immediately because I have no fast narrative anchor.",
    profile.bio
      ? `The bio gives me some context, but it does not point sharply enough at ${targetRole ?? "the role they want"}.`
      : "The empty or thin bio makes the profile feel unfinished in the first few seconds.",
  ].join(" ");

  const secondParagraph = [
    `The strongest signal I see is ${strongestLanguage}${topRepo ? ` and especially ${topRepo.name}` : ""}.`,
    activity.totalStars > 0
      ? `${activity.totalStars} total stars tells me there is at least some external validation here.`
      : "There is not much visible external validation yet, so I am forced to infer quality from scattered repo details.",
    `The biggest packaging issue is that ${profileEvidence.descriptionCoverage.summary.toLowerCase()} while ${profileEvidence.topicsCoverage.summary.toLowerCase()}.`,
  ].join(" ");

  const thirdParagraph = [
    activity.longestGapDays > 60
      ? "I would hesitate to reach out right now because the profile reads colder than it probably is."
      : "I could justify a reach-out if the role fits, but the profile still makes me work too hard.",
    "A tighter bio, cleaner repo descriptions, and a stronger pinned-story setup would change my confidence quickly.",
    "There is likely more substance here than the profile currently communicates.",
  ].join(" ");

  return [firstParagraph, secondParagraph, thirdParagraph].join("\n\n");
}

export async function runRecruiterSimulation(
  profileData: ProfileData,
  onChunk: (text: string) => void
): Promise<string> {
  const profileSummary = buildProfileSummary(profileData);

  const stream = await getOpenAI().chat.completions.create({
    model: streamingModel(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Review this candidate's GitHub profile and give me your honest recruiter perspective:

${profileSummary}`,
      },
    ],
    stream: true,
    max_tokens: 500,
    temperature: 0.85,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }

  return fullText;
}
