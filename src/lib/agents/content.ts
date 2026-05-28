// ============================================================
// LeverageOS - Fix Kit Generation Agent
// Generates copy-ready profile fixes grounded in GitHub evidence
// ============================================================

import { getOpenAI } from "../openai";
import { chatModel } from "../models";
import {
  ActionPlanStep,
  FixItem,
  FixKit,
  PinnedRepoChoice,
  ProfileData,
  RepoDescriptionFix,
  VisibilityGap,
} from "../types";
import { buildProfileSummary } from "../github";

interface ProfileAssetsPayload {
  githubBio?: string;
  githubProfileReadme?: string;
  linkedinHeadline?: string;
  linkedinAbout?: string;
  why?: string;
}

interface RepoAssetsPayload {
  repoDescriptions?: Array<{ repoName?: string; description?: string; why?: string }>;
  pinnedRepoStrategy?: Array<{ repoName?: string; rationale?: string }>;
  why?: string;
}

interface SocialAssetsPayload {
  xThread?: string;
  linkedinPost?: string;
  actionPlan?: Array<{ title?: string; detail?: string }>;
  why?: string;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeItem(content: string, why: string, evidence: string[]): FixItem {
  return {
    content: content.trim(),
    why: why.trim(),
    evidence: evidence.filter(Boolean).slice(0, 3),
  };
}

function fallbackGithubBio(profileData: ProfileData): FixItem {
  const { selfDescription, targetRole, profileEvidence } = profileData;
  const strongestLanguage = profileEvidence.strongestLanguages[0] ?? "software";
  return normalizeItem(
    `${targetRole ? `${targetRole} ` : ""}builder focused on ${strongestLanguage}, shipping public projects and turning technical work into clear proof.`,
    "Your GitHub bio should state the work you do and the signal you want recruiters to remember in five seconds.",
    [profileEvidence.summary, ...profileEvidence.proofPoints.slice(0, 2), selfDescription]
  );
}

function fallbackGithubReadme(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): FixItem {
  const { profile, profileEvidence, selfDescription, targetRole } = profileData;
  const topRepos = profileEvidence.topRepos.slice(0, 3);
  const lines = [
    `# ${profile.name ?? profile.username}`,
    "",
    `${targetRole ? `${targetRole} ` : ""}developer focused on ${profileEvidence.strongestLanguages.join(", ") || "shipping useful software"}. ${selfDescription}`,
    "",
    "## What I build",
    ...profileEvidence.proofPoints.slice(0, 3).map((point) => `- ${point}`),
    "",
    "## Featured work",
    ...topRepos.map(
      (repo) =>
        `- **${repo.name}**: ${repo.description ?? "A project that demonstrates hands-on engineering work and practical execution."}`
    ),
    "",
    "## Current focus",
    `- Improving visibility around ${targetRole ?? "my technical strengths"} and shipping clearer public proof.`,
  ];

  return normalizeItem(
    lines.join("\n").trim(),
    "A recruiter needs one fast landing page that explains who you are, what you build, and where to click first.",
    [
      profileEvidence.summary,
      gaps[0]?.title ? `Top gap: ${gaps[0].title}` : "",
      ...profileEvidence.proofPoints.slice(0, 2),
    ]
  );
}

function fallbackRepoDescriptions(profileData: ProfileData): RepoDescriptionFix[] {
  const { profileEvidence } = profileData;
  const sharedEvidence = [
    profileEvidence.descriptionCoverage.summary,
    ...profileEvidence.proofPoints.slice(0, 2),
  ];

  return profileEvidence.topRepos.slice(0, 3).map((repo) => ({
    repoName: repo.name,
    description:
      repo.description?.trim() ||
      `Production-style ${repo.language ?? "software"} project demonstrating practical implementation, clear scope, and real technical execution.`,
    why: "The repo needs a one-line summary that tells recruiters what it is, why it matters, and why they should click.",
    evidence: sharedEvidence,
  }));
}

function fallbackPinnedRepoStrategy(profileData: ProfileData): FixKit["pinnedRepoStrategy"] {
  const order: PinnedRepoChoice[] = profileData.profileEvidence.topRepos.slice(0, 3).map((repo, index) => ({
    repoName: repo.name,
    rationale:
      index === 0
        ? "Lead with the clearest proof-of-skill project."
        : index === 1
        ? "Follow with a repo that shows range or depth."
        : "Use the third slot to round out your story with another practical build.",
  }));

  return {
    order,
    why: "Pinned repos should tell a deliberate story instead of reflecting whatever was updated most recently.",
    evidence: [
      profileData.profileEvidence.summary,
      ...profileData.profileEvidence.proofPoints.slice(0, 2),
    ],
  };
}

function fallbackLinkedinHeadline(profileData: ProfileData): FixItem {
  const { targetRole, profileEvidence } = profileData;
  const strongestLanguage = profileEvidence.strongestLanguages[0] ?? "software";
  return normalizeItem(
    `${targetRole ?? "Software builder"} | ${strongestLanguage} projects | Public proof on GitHub`,
    "Your headline should make role, specialty, and credibility visible without needing a click.",
    [profileEvidence.summary, ...profileEvidence.proofPoints.slice(0, 2)]
  );
}

function fallbackLinkedinAbout(profileData: ProfileData): FixItem {
  const { selfDescription, targetRole, profileEvidence } = profileData;
  return normalizeItem(
    `I build in public around ${profileEvidence.strongestLanguages.join(", ") || "software systems"} and care about making technical work legible. ${selfDescription} Right now I am focused on ${targetRole ?? "roles where strong public proof matters"} and on packaging my GitHub work so recruiters can understand impact faster.`,
    "Your About section should turn raw experience into a clear narrative with technical focus and intent.",
    [profileEvidence.summary, ...profileEvidence.proofPoints.slice(0, 2)]
  );
}

function fallbackXThread(profileData: ProfileData): FixItem {
  const repo = profileData.profileEvidence.topRepos[0];
  const language = profileData.profileEvidence.strongestLanguages[0] ?? "software";

  return normalizeItem(
    [
      `1/ One thing I am getting better at: turning ${language} work into public proof instead of letting it stay buried in repos.`,
      `2/ My strongest visible project right now is ${repo?.name ?? "my top GitHub repo"}.`,
      "3/ The lesson: strong code is not enough if the repo does not explain what it does, why it matters, and where to look first.",
      "4/ I am tightening my profile narrative, repo descriptions, and pinned repos so the technical story lands faster.",
      "5/ If you are also building in public, what changed the way recruiters or peers responded to your work?",
    ].join("\n"),
    "The thread should turn one concrete proof point into a credible build-in-public story.",
    [profileData.profileEvidence.summary, ...profileData.profileEvidence.proofPoints.slice(0, 2)]
  );
}

function fallbackLinkedinPost(profileData: ProfileData): FixItem {
  const repo = profileData.profileEvidence.topRepos[0];

  return normalizeItem(
    [
      "The gap between doing strong technical work and being seen for it is bigger than most developers expect.",
      "",
      `Looking at my own GitHub profile through a recruiter lens made that obvious. A project like ${repo?.name ?? "my strongest repo"} can say a lot about how I build, but only if the profile makes that signal obvious fast.`,
      "",
      "That means better repo descriptions, sharper pinned repos, and a README that explains what matters before someone has to read code.",
      "",
      "Strong work deserves strong framing. What changed your visibility the most once you started treating your profile like a product?",
    ].join("\n"),
    "The post should sound like a real takeaway from your profile audit, not generic career advice.",
    [profileData.profileEvidence.summary, ...profileData.profileEvidence.proofPoints.slice(0, 2)]
  );
}

function fallbackActionPlan(profileData: ProfileData): FixKit["thirtyDayActionPlan"] {
  const steps: ActionPlanStep[] = [
    {
      title: "Rewrite profile bio",
      detail: "Replace the current bio with a role-forward version that names your strongest stack and the work you want to be known for.",
    },
    {
      title: "Ship profile README",
      detail: "Publish a one-screen README covering who you are, featured work, and the best starting points on your GitHub.",
    },
    {
      title: "Fix top repo descriptions",
      detail: "Update descriptions for the three highest-signal repos so each one explains the project and its value in one line.",
    },
    {
      title: "Reorder pinned repos",
      detail: "Pin the repos that best tell your technical story instead of defaulting to the most recent or most familiar ones.",
    },
    {
      title: "Publish one social proof post",
      detail: "Use the LinkedIn post or X thread to connect one visible repo to the broader technical story you want recruiters to remember.",
    },
  ];

  return {
    steps,
    why: "A short sequence of small visibility improvements compounds faster than waiting for one perfect portfolio rewrite.",
    evidence: [
      profileData.profileEvidence.summary,
      ...profileData.profileEvidence.proofPoints.slice(0, 2),
    ],
  };
}

async function generateProfileAssets(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): Promise<{
  githubBio: FixItem;
  githubProfileReadme: FixItem;
  linkedinHeadline: FixItem;
  linkedinAbout: FixItem;
}> {
  const summary = buildProfileSummary(profileData);
  const response = await getOpenAI().chat.completions.create({
    model: chatModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate recruiter-facing profile fixes for developers.
Return JSON only with keys:
{
  "githubBio": "max 160 chars",
  "githubProfileReadme": "raw markdown only",
  "linkedinHeadline": "single line headline",
  "linkedinAbout": "120-220 words",
  "why": "one sentence on the overall fix strategy"
}

Every output must be specific to the developer's GitHub evidence and target role. Do not sound templated.`,
      },
      {
        role: "user",
        content: `${summary}

Top gaps:
${gaps.map((gap) => `- ${gap.title}: ${gap.description}`).join("\n")}

Create profile fixes that directly improve recruiter comprehension.`,
      },
    ],
    max_tokens: 1200,
    temperature: 0.7,
  });

  const parsed = safeJsonParse<ProfileAssetsPayload>(
    response.choices[0]?.message?.content ?? "{}"
  );
  const why =
    parsed?.why ??
    "These assets make your role, strengths, and strongest proof points legible in the first recruiter scan.";
  const evidence = [
    profileData.profileEvidence.summary,
    ...profileData.profileEvidence.proofPoints.slice(0, 2),
  ];

  return {
    githubBio: normalizeItem(parsed?.githubBio ?? fallbackGithubBio(profileData).content, why, evidence),
    githubProfileReadme: normalizeItem(
      parsed?.githubProfileReadme ?? fallbackGithubReadme(profileData, gaps).content,
      why,
      evidence
    ),
    linkedinHeadline: normalizeItem(
      parsed?.linkedinHeadline ?? fallbackLinkedinHeadline(profileData).content,
      why,
      evidence
    ),
    linkedinAbout: normalizeItem(
      parsed?.linkedinAbout ?? fallbackLinkedinAbout(profileData).content,
      why,
      evidence
    ),
  };
}

async function generateRepoAssets(profileData: ProfileData): Promise<{
  repoDescriptions: RepoDescriptionFix[];
  pinnedRepoStrategy: FixKit["pinnedRepoStrategy"];
}> {
  const summary = buildProfileSummary(profileData);
  const response = await getOpenAI().chat.completions.create({
    model: chatModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You improve GitHub profile packaging for developers.
Return JSON only with keys:
{
  "repoDescriptions": [
    { "repoName": "name", "description": "one-line repo description", "why": "why this phrasing works" }
  ],
  "pinnedRepoStrategy": [
    { "repoName": "name", "rationale": "why this should appear in this order" }
  ],
  "why": "overall strategy sentence"
}

Write up to 3 repo descriptions and up to 3 pinned repo choices.`,
      },
      {
        role: "user",
        content: `${summary}

Rewrite the top repos so a recruiter can understand them without opening code. Then recommend the best pinned-repo order.`,
      },
    ],
    max_tokens: 900,
    temperature: 0.65,
  });

  const parsed = safeJsonParse<RepoAssetsPayload>(
    response.choices[0]?.message?.content ?? "{}"
  );
  const evidence = [
    profileData.profileEvidence.summary,
    ...profileData.profileEvidence.proofPoints.slice(0, 2),
  ];
  const fallbackDescriptions = fallbackRepoDescriptions(profileData);
  const fallbackPinned = fallbackPinnedRepoStrategy(profileData);

  const repoDescriptions = Array.isArray(parsed?.repoDescriptions)
    ? parsed.repoDescriptions
        .map((item, index) => {
          const fallback = fallbackDescriptions[index];
          if (!fallback) return null;
          return {
            repoName: item.repoName?.trim() || fallback.repoName,
            description: item.description?.trim() || fallback.description,
            why:
              item.why?.trim() ||
              "The description needs to tell a recruiter what the repo does and why it matters at a glance.",
            evidence,
          } satisfies RepoDescriptionFix;
        })
        .filter((item): item is RepoDescriptionFix => Boolean(item))
        .slice(0, 3)
    : fallbackDescriptions;

  const pinnedOrder = Array.isArray(parsed?.pinnedRepoStrategy)
    ? parsed.pinnedRepoStrategy
        .map((item, index) => {
          const fallback = fallbackPinned.order[index];
          if (!fallback) return null;
          return {
            repoName: item.repoName?.trim() || fallback.repoName,
            rationale: item.rationale?.trim() || fallback.rationale,
          } satisfies PinnedRepoChoice;
        })
        .filter((item): item is PinnedRepoChoice => Boolean(item))
        .slice(0, 3)
    : fallbackPinned.order;

  return {
    repoDescriptions: repoDescriptions.length > 0 ? repoDescriptions : fallbackDescriptions,
    pinnedRepoStrategy: {
      order: pinnedOrder.length > 0 ? pinnedOrder : fallbackPinned.order,
      why:
        parsed?.why?.trim() ||
        "The pinned row should act like a recruiter landing page for your best work.",
      evidence,
    },
  };
}

async function generateSocialAssets(
  profileData: ProfileData
): Promise<{
  xThread: FixItem;
  linkedinPost: FixItem;
  thirtyDayActionPlan: FixKit["thirtyDayActionPlan"];
}> {
  const summary = buildProfileSummary(profileData);
  const response = await getOpenAI().chat.completions.create({
    model: chatModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You create credible visibility assets for developers.
Return JSON only with keys:
{
  "xThread": "5 tweets total, numbered 1/..5/",
  "linkedinPost": "150-220 words",
  "actionPlan": [
    { "title": "short step", "detail": "one or two sentences" }
  ],
  "why": "one sentence on why these assets help"
}

Every output must sound like a real developer, grounded in the provided GitHub evidence.`,
      },
      {
        role: "user",
        content: `${summary}

Create one LinkedIn post, one 5-tweet X thread, and a realistic 30-day visibility action plan.`,
      },
    ],
    max_tokens: 1200,
    temperature: 0.8,
  });

  const parsed = safeJsonParse<SocialAssetsPayload>(
    response.choices[0]?.message?.content ?? "{}"
  );
  const why =
    parsed?.why?.trim() ||
    "These assets turn your strongest GitHub proof into repeated, recruiter-visible signals.";
  const evidence = [
    profileData.profileEvidence.summary,
    ...profileData.profileEvidence.proofPoints.slice(0, 2),
  ];
  const fallbackPlan = fallbackActionPlan(profileData);

  return {
    xThread: normalizeItem(parsed?.xThread ?? fallbackXThread(profileData).content, why, evidence),
    linkedinPost: normalizeItem(
      parsed?.linkedinPost ?? fallbackLinkedinPost(profileData).content,
      why,
      evidence
    ),
    thirtyDayActionPlan: {
      steps: Array.isArray(parsed?.actionPlan)
        ? parsed.actionPlan
            .map((step, index) => {
              const fallback = fallbackPlan.steps[index];
              if (!fallback) return null;
              return {
                title: step.title?.trim() || fallback.title,
                detail: step.detail?.trim() || fallback.detail,
              } satisfies ActionPlanStep;
            })
            .filter((step): step is ActionPlanStep => Boolean(step))
            .slice(0, 5)
        : fallbackPlan.steps,
      why,
      evidence,
    },
  };
}

function fallbackResumeBullets(profileData: ProfileData): FixItem {
  const { profileEvidence, targetRole } = profileData;
  const bullets = profileEvidence.topRepos.slice(0, 4).map((repo, index) => {
    const lang = repo.language ?? "software";
    const stars = repo.stars > 0 ? ` (${repo.stars} GitHub stars)` : "";
    if (index === 0) {
      return `• Built ${repo.name} — a ${lang} project demonstrating end-to-end technical execution${stars}`;
    }
    return `• Developed ${repo.name} in ${lang}, applying ${repo.description ? repo.description.slice(0, 60) : "practical engineering skills"} with real-world scope`;
  });

  if (bullets.length < 2) {
    bullets.push(`• Maintained ${profileEvidence.strongestLanguages[0] ?? "multiple"}-stack projects with consistent public commit history`);
  }

  return normalizeItem(
    bullets.join("\n"),
    "STAR-format bullets translate GitHub work into language hiring managers recognize on a resume.",
    [profileEvidence.summary, ...profileEvidence.proofPoints.slice(0, 2)]
  );
}

function fallbackColdOutreachDm(profileData: ProfileData): FixItem {
  const { profileEvidence, targetRole, profile } = profileData;
  const topRepo = profileEvidence.topRepos[0];

  return normalizeItem(
    `Hi [Name] — I noticed [Company] is building in ${profileEvidence.strongestLanguages[0] ?? "this space"}. I recently shipped ${topRepo?.name ?? "a few open-source projects"} in that stack and have been following your team's work closely. ${targetRole ? `I'm targeting ${targetRole} roles` : "I'm actively looking for engineering roles"} where I can contribute quickly. Would you have 15 minutes to connect?`,
    "A personalized cold DM that references specific work gets 3x more replies than generic outreach.",
    [profileEvidence.summary, ...profileEvidence.proofPoints.slice(0, 2)]
  );
}

async function generateResumeBullets(profileData: ProfileData): Promise<FixItem> {
  const summary = buildProfileSummary(profileData);
  const response = await getOpenAI().chat.completions.create({
    model: chatModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write resume bullet points for developers using STAR format.
Each bullet starts with a strong past-tense action verb (Built, Engineered, Designed, Shipped, Developed, Optimized, Implemented, Led).
Use specific numbers and metrics when available.
Return JSON: { "bullets": "bullet1\nbullet2\nbullet3\nbullet4", "why": "one sentence" }`,
      },
      {
        role: "user",
        content: `${summary}\n\nWrite 4-5 resume bullet points that translate this developer's GitHub work into recruiter-readable impact statements.`,
      },
    ],
    max_tokens: 400,
    temperature: 0.6,
  });

  const parsed = safeJsonParse<{ bullets?: string; why?: string }>(
    response.choices[0]?.message?.content ?? "{}"
  );
  const evidence = [profileData.profileEvidence.summary, ...profileData.profileEvidence.proofPoints.slice(0, 2)];

  return normalizeItem(
    parsed?.bullets ?? fallbackResumeBullets(profileData).content,
    parsed?.why ?? "STAR-format bullets translate GitHub work into language hiring managers recognize on a resume.",
    evidence
  );
}

async function generateColdOutreachDm(profileData: ProfileData): Promise<FixItem> {
  const summary = buildProfileSummary(profileData);
  const response = await getOpenAI().chat.completions.create({
    model: chatModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write cold outreach DMs for developers to send to recruiters on LinkedIn or X.
Rules:
- Under 150 words
- No "I hope this finds you well" or corporate openers
- Reference one concrete signal from their work
- Ends with a specific, low-friction ask (15-minute call, not a job application)
- Leave [Name] and [Company] as placeholders
Return JSON: { "dm": "message text", "why": "one sentence" }`,
      },
      {
        role: "user",
        content: `${summary}\n\nWrite a cold outreach DM this developer can send to a recruiter or hiring manager.`,
      },
    ],
    max_tokens: 300,
    temperature: 0.75,
  });

  const parsed = safeJsonParse<{ dm?: string; why?: string }>(
    response.choices[0]?.message?.content ?? "{}"
  );
  const evidence = [profileData.profileEvidence.summary, ...profileData.profileEvidence.proofPoints.slice(0, 2)];

  return normalizeItem(
    parsed?.dm ?? fallbackColdOutreachDm(profileData).content,
    parsed?.why ?? "A personalized cold DM that references specific work gets 3x more replies than generic outreach.",
    evidence
  );
}

export async function runFixKitGeneration(
  profileData: ProfileData,
  gaps: VisibilityGap[]
): Promise<FixKit> {
  const [profileAssetsResult, repoAssetsResult, socialAssetsResult, resumeResult, dmResult] =
    await Promise.allSettled([
      generateProfileAssets(profileData, gaps),
      generateRepoAssets(profileData),
      generateSocialAssets(profileData),
      generateResumeBullets(profileData),
      generateColdOutreachDm(profileData),
    ]);

  return {
    githubBio:
      profileAssetsResult.status === "fulfilled"
        ? profileAssetsResult.value.githubBio
        : fallbackGithubBio(profileData),
    githubProfileReadme:
      profileAssetsResult.status === "fulfilled"
        ? profileAssetsResult.value.githubProfileReadme
        : fallbackGithubReadme(profileData, gaps),
    repoDescriptions:
      repoAssetsResult.status === "fulfilled"
        ? repoAssetsResult.value.repoDescriptions
        : fallbackRepoDescriptions(profileData),
    pinnedRepoStrategy:
      repoAssetsResult.status === "fulfilled"
        ? repoAssetsResult.value.pinnedRepoStrategy
        : fallbackPinnedRepoStrategy(profileData),
    linkedinHeadline:
      profileAssetsResult.status === "fulfilled"
        ? profileAssetsResult.value.linkedinHeadline
        : fallbackLinkedinHeadline(profileData),
    linkedinAbout:
      profileAssetsResult.status === "fulfilled"
        ? profileAssetsResult.value.linkedinAbout
        : fallbackLinkedinAbout(profileData),
    xThread:
      socialAssetsResult.status === "fulfilled"
        ? socialAssetsResult.value.xThread
        : fallbackXThread(profileData),
    linkedinPost:
      socialAssetsResult.status === "fulfilled"
        ? socialAssetsResult.value.linkedinPost
        : fallbackLinkedinPost(profileData),
    resumeBullets:
      resumeResult.status === "fulfilled"
        ? resumeResult.value
        : fallbackResumeBullets(profileData),
    coldOutreachDm:
      dmResult.status === "fulfilled"
        ? dmResult.value
        : fallbackColdOutreachDm(profileData),
    thirtyDayActionPlan:
      socialAssetsResult.status === "fulfilled"
        ? socialAssetsResult.value.thirtyDayActionPlan
        : fallbackActionPlan(profileData),
  };
}
