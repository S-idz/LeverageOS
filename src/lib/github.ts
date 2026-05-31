// ============================================================
// LeverageOS - GitHub API Client
// ============================================================

import {
  CoverageMetric,
  GitHubActivity,
  GitHubProfile,
  GitHubRepo,
  ProfileData,
  ProfileEvidence,
} from "./types";
import { getOptionalEnv } from "./env";
import { assertValidGitHubUsername } from "./validation";

const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "LeverageOS/1.0",
  };

  const githubToken = getOptionalEnv("GITHUB_TOKEN");
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function githubFetch(path: string, withAuth = true): Promise<any> {
  const headers = withAuth ? getHeaders() : {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "LeverageOS/1.0",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${GITHUB_API}${path}`, {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("GitHub API request timed out after 30s");
    }
    console.error(`[github] fetch error for ${path}:`, err);
    throw new Error(`GitHub API unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
  clearTimeout(timeout);

  if (res.status === 401 && withAuth) {
    // Token is invalid or expired — retry without auth (60 req/hr anonymous limit)
    console.warn("[github] Token rejected (401) — retrying without auth");
    return githubFetch(path, false);
  }

  if (res.status === 404) throw new Error("GitHub user not found. Check the username and try again.");
  if (res.status === 403) {
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const resetEpoch = res.headers.get("X-RateLimit-Reset");
    const resetAt = resetEpoch ? new Date(Number(resetEpoch) * 1000).toLocaleTimeString() : "soon";
    const hasToken = Boolean(getOptionalEnv("GITHUB_TOKEN"));
    if (remaining === "0") {
      throw new Error(
        hasToken
          ? `GitHub API rate limit exceeded for the configured GITHUB_TOKEN (resets at ${resetAt}).`
          : `GitHub API rate limit exceeded (resets at ${resetAt}). You are running unauthenticated — add GITHUB_TOKEN to .env.local to raise the limit from 60/hr to 5000/hr.`
      );
    }
    throw new Error(
      hasToken
        ? "GitHub API access forbidden. The GITHUB_TOKEN in .env.local may be invalid or expired."
        : "GitHub API access forbidden. Add GITHUB_TOKEN to .env.local."
    );
  }
  if (!res.ok) {
    console.error(`[github] unexpected status ${res.status} for ${path}`);
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchGitHubData(
  username: string,
  selfDescription: string,
  targetRole?: string
): Promise<ProfileData> {
  const safeUsername = assertValidGitHubUsername(username);

  console.log(`[github] fetching profile for @${safeUsername}`);
  const [userRaw, reposRaw, eventsRaw] = await Promise.allSettled([
    githubFetch(`/users/${safeUsername}`),
    githubFetch(`/users/${safeUsername}/repos?sort=updated&per_page=30`),
    githubFetch(`/users/${safeUsername}/events/public?per_page=50`),
  ]);

  if (userRaw.status === "rejected") {
    const reason = userRaw.reason instanceof Error ? userRaw.reason.message : "Failed to fetch GitHub profile";
    console.error(`[github] user fetch failed for @${safeUsername}:`, reason);
    throw new Error(reason);
  }

  const user = userRaw.value;
  const repos: GitHubRepo[] = [];

  if (reposRaw.status === "fulfilled") {
    const rawRepos = reposRaw.value as Record<string, unknown>[];
    for (const repo of rawRepos) {
      if (Boolean(repo.fork)) continue;
      repos.push({
        name: String(repo.name ?? ""),
        description: repo.description ? String(repo.description) : null,
        language: repo.language ? String(repo.language) : null,
        stars: Number(repo.stargazers_count ?? 0),
        forks: Number(repo.forks_count ?? 0),
        topics: Array.isArray(repo.topics) ? (repo.topics as string[]) : [],
        updatedAt: String(repo.updated_at ?? ""),
        isForked: Boolean(repo.fork),
        hasDescription: Boolean(repo.description),
        hasTopics: Array.isArray(repo.topics) && (repo.topics as string[]).length > 0,
        url: String(repo.html_url ?? ""),
      });
    }
  }

  const activity = calculateActivity(
    eventsRaw.status === "fulfilled" ? eventsRaw.value : [],
    repos
  );
  const hasReadme = await checkProfileReadme(safeUsername);

  const profile: GitHubProfile = {
    username: safeUsername,
    name: user.name ?? null,
    bio: user.bio ?? null,
    company: user.company ?? null,
    location: user.location ?? null,
    email: user.email ?? null,
    blog: user.blog ?? null,
    followers: Number(user.followers ?? 0),
    following: Number(user.following ?? 0),
    publicRepos: Number(user.public_repos ?? 0),
    createdAt: String(user.created_at ?? ""),
    avatarUrl: String(user.avatar_url ?? ""),
    hasReadme,
  };

  const profileEvidence = buildProfileEvidence(profile, repos, activity);

  return {
    profile,
    repos,
    activity,
    selfDescription,
    targetRole,
    profileEvidence,
  };
}

async function checkProfileReadme(username: string): Promise<boolean> {
  const safeUsername = assertValidGitHubUsername(username);

  try {
    const res = await fetch(`${GITHUB_API}/repos/${safeUsername}/${safeUsername}/readme`, {
      headers: getHeaders(),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function calculateActivity(
  events: Record<string, unknown>[],
  repos: GitHubRepo[]
): GitHubActivity {
  const langCount: Record<string, number> = {};
  let totalStars = 0;
  const topRepos = [...repos].sort((a, b) => b.stars - a.stars).slice(0, 6);

  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] ?? 0) + 1;
    }
    totalStars += repo.stars;
  }

  const primaryLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([language]) => language);

  const pushEvents = Array.isArray(events)
    ? events.filter((event) => event.type === "PushEvent")
    : [];
  const lastCommitDate =
    pushEvents.length > 0 ? String(pushEvents[0].created_at ?? "") : null;

  let commitFrequency: GitHubActivity["commitFrequency"] = "inactive";
  let longestGapDays = 365;

  if (pushEvents.length > 0) {
    const dates = pushEvents
      .map((event) => new Date(String(event.created_at ?? "")).getTime())
      .filter((date) => !Number.isNaN(date))
      .sort((a, b) => b - a);

    if (dates.length > 0) {
      const daysSinceLast = (Date.now() - dates[0]) / 86400000;
      if (daysSinceLast < 3) commitFrequency = "daily";
      else if (daysSinceLast < 14) commitFrequency = "weekly";
      else if (daysSinceLast < 60) commitFrequency = "monthly";
      else commitFrequency = "inactive";

      longestGapDays = Math.round(daysSinceLast);
    }
  }

  return {
    lastCommitDate,
    commitFrequency,
    longestGapDays,
    primaryLanguages,
    totalStars,
    pinnedRepos: topRepos.slice(0, 3),
    topRepos,
  };
}

function buildCoverage(covered: number, total: number, label: string): CoverageMetric {
  const ratio = total > 0 ? covered / total : 0;
  return {
    covered,
    total,
    ratio,
    summary:
      total > 0
        ? `${covered}/${total} ${label} (${Math.round(ratio * 100)}%)`
        : `0/${total} ${label}`,
  };
}

function buildProfileEvidence(
  profile: GitHubProfile,
  repos: GitHubRepo[],
  activity: GitHubActivity
): ProfileEvidence {
  const descriptionCoverage = buildCoverage(
    repos.filter((repo) => repo.hasDescription).length,
    repos.length,
    "repos have descriptions"
  );
  const topicsCoverage = buildCoverage(
    repos.filter((repo) => repo.hasTopics).length,
    repos.length,
    "repos have topics"
  );

  const bioQuality: ProfileEvidence["bioQuality"] =
    !profile.bio || profile.bio.trim().length === 0
      ? "missing"
      : profile.bio.trim().length < 20
      ? "thin"
      : "strong";

  const proofPoints: string[] = [];
  if (profile.hasReadme) {
    proofPoints.push("You already have a profile README to build on.");
  }
  if (activity.totalStars > 0) {
    proofPoints.push(`Your public repositories have ${activity.totalStars} combined stars.`);
  }
  if (activity.topRepos[0]) {
    proofPoints.push(
      `${activity.topRepos[0].name} is your strongest proof repo with ${activity.topRepos[0].stars} stars.`
    );
  }
  if (activity.primaryLanguages.length > 0) {
    proofPoints.push(
      `Your clearest technical signal is ${activity.primaryLanguages.slice(0, 3).join(", ")}.`
    );
  }
  if (activity.lastCommitDate) {
    proofPoints.push(
      activity.longestGapDays < 14
        ? "Your recent public activity signals that you are actively shipping."
        : `Your last visible GitHub activity was about ${activity.longestGapDays} days ago.`
    );
  }
  if (descriptionCoverage.covered > 0) {
    proofPoints.push(`${descriptionCoverage.summary}.`);
  }
  if (topicsCoverage.covered > 0) {
    proofPoints.push(`${topicsCoverage.summary}.`);
  }

  const activityLabel =
    activity.commitFrequency === "daily"
      ? "very active"
      : activity.commitFrequency === "weekly"
      ? "active"
      : activity.commitFrequency === "monthly"
      ? "inconsistently active"
      : "inactive";

  const summary = [
    profile.hasReadme ? "Profile README present" : "Profile README missing",
    profile.bio ? `Bio ${bioQuality}` : "Bio missing",
    descriptionCoverage.summary,
    topicsCoverage.summary,
    activity.primaryLanguages.length > 0
      ? `Primary languages: ${activity.primaryLanguages.join(", ")}`
      : "Primary languages unclear",
  ].join(" | ");

  return {
    strongestLanguages: activity.primaryLanguages,
    topRepos: activity.topRepos.slice(0, 3).map((repo) => ({
      name: repo.name,
      language: repo.language,
      stars: repo.stars,
      description: repo.description,
      url: repo.url,
    })),
    activityRecencyDays: activity.lastCommitDate ? activity.longestGapDays : null,
    activityLabel,
    hasProfileReadme: profile.hasReadme,
    bioQuality,
    descriptionCoverage,
    topicsCoverage,
    proofPoints: proofPoints.slice(0, 6),
    summary,
  };
}

export function buildProfileSummary(data: ProfileData): string {
  const { profile, repos, activity, selfDescription, targetRole, profileEvidence } = data;

  return `
GitHub Profile Summary:
- Username: ${profile.username}
- Name: ${profile.name ?? "Not set"}
- Bio: ${profile.bio ?? "Not set"}
- Followers: ${profile.followers} | Following: ${profile.following}
- Public Repos: ${profile.publicRepos} (showing ${repos.length} non-forked)
- Profile README: ${profile.hasReadme ? "YES" : "NO - MISSING"}
- Account created: ${profile.createdAt}
- Target role: ${targetRole ?? "Not provided"}

Repository Analysis:
- Total repos analyzed: ${repos.length}
- Repos WITH descriptions: ${profileEvidence.descriptionCoverage.covered}/${repos.length}
- Repos WITH topics/tags: ${profileEvidence.topicsCoverage.covered}/${repos.length}
- Primary languages: ${activity.primaryLanguages.join(", ") || "None detected"}
- Total stars: ${activity.totalStars}
- Last commit: ${activity.lastCommitDate ?? "Unknown"}
- Commit frequency: ${activity.commitFrequency}
- Days since last activity: ~${activity.longestGapDays}
- Evidence summary: ${profileEvidence.summary}

Top Repositories:
${activity.topRepos
  .slice(0, 5)
  .map(
    (repo) =>
      `  - ${repo.name} (${repo.language ?? "No language"}, ${repo.stars} stars): ${
        repo.description ?? "NO DESCRIPTION"
      }${repo.hasTopics ? ` [tags: ${repo.topics.slice(0, 3).join(", ")}]` : " [NO TAGS]"}`
  )
  .join("\n")}

Proof points:
${profileEvidence.proofPoints.map((point) => `- ${point}`).join("\n")}

Self-description (what they told us):
"${selfDescription}"
`.trim();
}
