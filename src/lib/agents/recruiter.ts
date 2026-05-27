// ============================================================
// LeverageOS — Recruiter Simulation Agent
// Simulates how a senior recruiter perceives the profile
// ============================================================

import { getOpenAI } from "../openai";
import { ProfileData } from "../types";
import { buildProfileSummary } from "../github";

const SYSTEM_PROMPT = `You are Marcus Chen, a Senior Technical Recruiter at a top-tier tech company with 9 years of experience.
You review 50+ GitHub profiles every week when sourcing candidates.

You are honest, direct, and ruthlessly efficient. You have 45 seconds to evaluate a profile before deciding whether to continue.

Your job is to write your UNFILTERED internal monologue as you review this profile.
Write exactly 3 paragraphs:

Paragraph 1: Your IMMEDIATE first impression (what hits you in the first 10 seconds — profile, bio, readme, overall presence)
Paragraph 2: Your TECHNICAL assessment (repo quality, code activity, skills signal, depth vs. breadth)
Paragraph 3: Your DECISION + reasoning (would you reach out? what specific things made you hesitate? what would make this candidate stronger?)

Rules:
- Be brutally honest but constructive
- Reference SPECIFIC things from their profile (repo names, languages, activity patterns)
- Do NOT be generic — every sentence must be specific to this person
- Write in first person as Marcus
- Use the word "I" naturally throughout
- Don't soften criticism — recruiters aren't kind, they're efficient
- Keep each paragraph to 3-4 sentences max`;

export async function runRecruiterSimulation(
  profileData: ProfileData,
  onChunk: (text: string) => void
): Promise<string> {
  const profileSummary = buildProfileSummary(profileData);

  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Review this candidate's GitHub profile and give me your honest recruiter perspective:\n\n${profileSummary}`,
      },
    ],
    stream: true,
    max_tokens: 600,
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
