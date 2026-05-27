// ============================================================
// LeverageOS — Content Generation Agent
// 3 parallel content pieces: LinkedIn, X Thread, GitHub README
// ============================================================

import { openai } from "../openai";
import { ProfileData, VisibilityGap, GeneratedContent } from "../types";
import { buildProfileSummary } from "../github";

function stripCodeFences(text: string): string {
  // LLMs sometimes wrap markdown in ```markdown ... ``` despite instructions
  return text
    .replace(/^```(?:markdown|md)?\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

async function generateLinkedInPost(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): Promise<string> {
  const summary = buildProfileSummary(profileData);
  const topGap = gaps[0];

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You write high-performing LinkedIn posts for developers.
Your posts:
- Start with a bold 1-line hook (no "I am excited to share" or corporate fluff)
- Tell a specific technical story from the developer's work
- Show expertise without bragging
- End with 1 engaging question or insight
- Use light formatting (line breaks, no excessive emojis)
- Sound like a real developer talking to other developers
- 150-250 words max
- Include 3-5 relevant hashtags at the end

Do NOT start with "I" as the first word.`,
      },
      {
        role: "user",
        content: `Write a LinkedIn post for this developer. Make it feel authentic and specific to their work.

${summary}

Key strength to highlight: their ${profileData.activity.primaryLanguages[0] ?? "technical"} work
Address the visibility gap: ${topGap?.title ?? "lack of online presence"}

The post should help them become more visible to recruiters and the tech community.`,
      },
    ],
    max_tokens: 400,
    temperature: 0.85,
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
}

async function generateXThread(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): Promise<string> {
  const summary = buildProfileSummary(profileData);

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You write viral X/Twitter threads for developers building in public.
Each tweet is numbered (1/, 2/, etc.)
Thread structure:
1/ Hook tweet — bold claim or interesting fact from their work
2/ The problem they solved or what they built
3/ The technical insight or key learning
4/ Concrete results or what makes it useful
5/ CTA — what they're working on next, invite engagement

Rules:
- Each tweet max 260 characters
- No corporate language
- Sound like a builder sharing real work
- Be specific (use their actual project/language names)
- Hook must make someone stop scrolling
- 5 tweets total`,
      },
      {
        role: "user",
        content: `Write a 5-tweet thread for this developer to share on X/Twitter:

${summary}

Focus on their most impressive project or their technical specialty in ${
          profileData.activity.primaryLanguages[0] ?? "software development"
        }.`,
      },
    ],
    max_tokens: 500,
    temperature: 0.9,
  });

  // Suppress unused parameter warning — gaps used for context in future
  void gaps;

  return res.choices[0]?.message?.content?.trim() ?? "";
}

async function generateGitHubReadme(
  profileData: ProfileData
): Promise<string> {
  const { profile, activity } = profileData;

  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You write GitHub profile READMEs that make recruiters pay attention.
A great GitHub profile README:
- Opens with a 1-2 sentence punchy intro (who they are, what they build)
- Shows primary tech stack clearly
- Highlights 2-3 most impressive projects with a brief what/why
- Shows current focus or what they're learning
- Includes contact/links
- Uses minimal but effective markdown (headers, bullet points, badges if relevant)
- Feels like a developer wrote it, not a template
- 200-350 words max

Output raw markdown ONLY. Absolutely NO code fences (no backticks) wrapping the output.`,
      },
      {
        role: "user",
        content: `Write a GitHub profile README for this developer:

Name: ${profile.name ?? profile.username}
Username: ${profile.username}
Current bio: ${profile.bio ?? "None"}
Primary languages: ${activity.primaryLanguages.join(", ")}
Total stars: ${activity.totalStars}
Followers: ${profile.followers}
Self-description: "${profileData.selfDescription}"

Top projects:
${activity.topRepos
  .slice(0, 3)
  .map(
    (r) =>
      `- ${r.name} (${r.language ?? "unknown"}): ${
        r.description ?? "no description"
      }`
  )
  .join("\n")}

Make it specific to them. Do not use generic templates. Output raw markdown with NO wrapping code fences.`,
      },
    ],
    max_tokens: 600,
    temperature: 0.8,
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  return stripCodeFences(raw);
}

export async function runContentGeneration(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): Promise<GeneratedContent> {
  // Use allSettled so one failure doesn't kill the other two pieces
  const [linkedinResult, xResult, readmeResult] = await Promise.allSettled([
    generateLinkedInPost(profileData, gaps),
    generateXThread(profileData, gaps),
    generateGitHubReadme(profileData),
  ]);

  return {
    linkedinPost:
      linkedinResult.status === "fulfilled"
        ? linkedinResult.value
        : "LinkedIn post generation failed. Please run the analysis again.",
    xThread:
      xResult.status === "fulfilled"
        ? xResult.value
        : "X thread generation failed. Please run the analysis again.",
    githubReadme:
      readmeResult.status === "fulfilled"
        ? readmeResult.value
        : "# GitHub README\n\nREADME generation failed. Please run the analysis again.",
  };
}
