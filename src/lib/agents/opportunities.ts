// ============================================================
// LeverageOS - Opportunity Scout Agent
// Uses OpenAI Responses API with web_search_preview to find
// live opportunities matched to the user's profile.
// ============================================================

import { getOpenAI } from "../openai";
import { chatModel, supportsResponsesApi } from "../models";
import { OpportunityResult, PerceptionScores, ProfileData } from "../types";

// Web search requires the real OpenAI Responses API endpoint
const USE_WEB_SEARCH = process.env.USE_WEB_SEARCH !== "false" && supportsResponsesApi();

const FALLBACK_OPPORTUNITIES: OpportunityResult[] = [
  {
    title: "MLH Fellowship — Open Source Contributor Program",
    url: "https://fellowship.mlh.io",
    type: "grant",
    why: "Paid 12-week fellowship for developers contributing to open source. Strong match for developers with public GitHub repos.",
  },
  {
    title: "Open Source Contributions on GitHub Explore",
    url: "https://github.com/explore",
    type: "oss",
    why: "Browse repos tagged 'good-first-issue' in your primary stack to build collaboration history and visibility.",
  },
];

function buildPrompt(profileData: ProfileData, scores: PerceptionScores): string {
  const { activity, profileEvidence, targetRole, selfDescription } = profileData;
  const stack = profileEvidence.strongestLanguages.slice(0, 3).join(", ") || "software";
  const experience =
    activity.totalStars > 50
      ? "intermediate to senior"
      : activity.totalStars > 10
      ? "junior to mid-level"
      : "early career";

  return `You are an opportunity intelligence agent for a developer. Search the web and find 3-5 real, currently active opportunities that match this developer's profile.

Developer profile:
- Primary stack: ${stack}
- Experience level signal: ${experience} (${activity.totalStars} total stars, ${activity.topRepos.length} notable repos)
- What they do: ${selfDescription}
- Target role: ${targetRole ?? "software engineering"}
- Visibility score: ${scores.overall}/100 (room to improve)

Find opportunities from these categories (mix as appropriate):
1. Job postings at companies actively hiring ${stack} engineers at ${experience} level
2. Open hackathons on devpost.com or similar that match their stack
3. Open-source projects on GitHub with 'good-first-issue' or 'help-wanted' tags in ${stack}
4. Grants, fellowships, or accelerator programs for developers

Return ONLY a JSON array (no other text) with 3-5 entries:
[
  {
    "title": "opportunity title",
    "url": "real verified URL",
    "type": "job" | "hackathon" | "oss" | "grant",
    "why": "one sentence explaining why this matches this specific developer",
    "deadline": "optional deadline string like 'closes June 30' or omit if ongoing"
  }
]`;
}

export async function runOpportunityScout(
  profileData: ProfileData,
  scores: PerceptionScores
): Promise<OpportunityResult[]> {
  if (!USE_WEB_SEARCH) {
    return runOpportunityScoutFallback(profileData, scores);
  }

  try {
    const prompt = buildPrompt(profileData, scores);

    const response = await getOpenAI().responses.create({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" as const }],
      input: prompt,
    });

    type MessageItem = { type: "message"; content: { type: string; text?: string }[] };
    const outputText = (response.output as { type: string }[])
      .filter((item): item is MessageItem => item.type === "message" && "content" in item)
      .flatMap((item) => item.content.filter((c) => c.type === "output_text"))
      .map((c) => c.text ?? "")
      .join("");

    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const parsed = JSON.parse(jsonMatch[0]) as unknown[];
    const results: OpportunityResult[] = parsed
      .filter(
        (item): item is OpportunityResult =>
          typeof item === "object" &&
          item !== null &&
          "title" in item &&
          "url" in item &&
          "type" in item &&
          "why" in item
      )
      .slice(0, 5);

    return results.length >= 2 ? results : FALLBACK_OPPORTUNITIES;
  } catch {
    return runOpportunityScoutFallback(profileData, scores);
  }
}

async function runOpportunityScoutFallback(
  profileData: ProfileData,
  scores: PerceptionScores
): Promise<OpportunityResult[]> {
  try {
    const prompt = buildPrompt(profileData, scores);

    const response = await getOpenAI().chat.completions.create({
      model: chatModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an opportunity matching agent. Return a JSON object with an 'opportunities' array of matching career opportunities for the developer.",
        },
        {
          role: "user",
          content:
            prompt +
            "\n\nReturn as: { \"opportunities\": [...] } — draw from your training knowledge of well-known programs, companies, and communities in the developer's stack.",
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const raw = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    ) as { opportunities?: unknown[] };

    const items = Array.isArray(raw.opportunities) ? raw.opportunities : [];
    const results: OpportunityResult[] = items
      .filter(
        (item): item is OpportunityResult =>
          typeof item === "object" &&
          item !== null &&
          "title" in item &&
          "url" in item &&
          "type" in item &&
          "why" in item
      )
      .slice(0, 5);

    return results.length >= 2 ? results : FALLBACK_OPPORTUNITIES;
  } catch {
    return FALLBACK_OPPORTUNITIES;
  }
}
