// ============================================================
// LeverageOS — GitHub API Client
// ============================================================

import {
  GitHubProfile,
  GitHubRepo,
  GitHubActivity,
  ProfileData,
} from "./types";

const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "LeverageOS/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch(path: string) {
  // next.revalidate is silently ignored inside Route Handlers in Next.js 15+
  // GitHub data is always fetched fresh per analysis run — correct behaviour
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) throw new Error(`GitHub user not found`);
  if (res.status === 403) throw new Error(`GitHub API rate limit exceeded`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function fetchGitHubData(
  username: string,
  selfDescription: string,
  linkedinUrl?: string
): Promise<ProfileData> {
  // Parallel fetches for speed
  const [userRaw, reposRaw, eventsRaw] = await Promise.allSettled([
    githubFetch(`/users/${username}`),
    githubFetch(`/users/${username}/repos?sort=updated&per_page=30`),
    githubFetch(`/users/${username}/events/public?per_page=50`),
  ]);

  if (userRaw.status === "rejected") {
    throw new Error(userRaw.reason?.message ?? "Failed to fetch GitHub profile");
  }

  const user = userRaw.value;
  const repos: GitHubRepo[] = [];

  if (reposRaw.status === "fulfilled") {
    const rawRepos = reposRaw.value as Record<string, unknown>[];
    for (const r of rawRepos) {
      if (r.fork) continue; // Skip forks for now
      repos.push({
        name: String(r.name ?? ""),
        description: r.description ? String(r.description) : null,
        language: r.language ? String(r.language) : null,
        stars: Number(r.stargazers_count ?? 0),
        forks: Number(r.forks_count ?? 0),
        topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
        updatedAt: String(r.updated_at ?? ""),
        isForked: Boolean(r.fork),
        hasDescription: !!r.description,
        hasTopics: Array.isArray(r.topics) && (r.topics as string[]).length > 0,
        url: String(r.html_url ?? ""),
      });
    }
  }

  // Calculate activity metrics
  const activity = calculateActivity(
    eventsRaw.status === "fulfilled" ? eventsRaw.value : [],
    repos
  );

  // Check if user has a profile README
  const hasReadme = await checkProfileReadme(username);

  const profile: GitHubProfile = {
    username,
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

  return {
    profile,
    repos,
    activity,
    selfDescription,
    linkedinUrl,
  };
}

async function checkProfileReadme(username: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${username}/${username}/readme`,
      {
        headers: getHeaders(),
        cache: "no-store",
      }
    );
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
  const topRepos = [...repos]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] ?? 0) + 1;
    }
    totalStars += repo.stars;
  }

  const primaryLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([lang]) => lang);

  // Calculate commit frequency from events
  const pushEvents = Array.isArray(events)
    ? events.filter((e) => e.type === "PushEvent")
    : [];
  const lastCommitDate =
    pushEvents.length > 0
      ? String(pushEvents[0].created_at ?? "")
      : null;

  let commitFrequency: GitHubActivity["commitFrequency"] = "inactive";
  let longestGapDays = 365;

  if (pushEvents.length > 0) {
    const dates = pushEvents
      .map((e) => new Date(String(e.created_at ?? "")).getTime())
      .filter((d) => !isNaN(d))
      .sort((a, b) => b - a);

    if (dates.length > 0) {
      const daysSinceLast = (Date.now() - dates[0]) / 86400000;
      if (daysSinceLast < 3) commitFrequency = "daily";
      else if (daysSinceLast < 14) commitFrequency = "weekly";
      else if (daysSinceLast < 60) commitFrequency = "monthly";
      else commitFrequency = "inactive";

      // Estimate longest gap
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

// Build a human-readable profile summary for LLM context
export function buildProfileSummary(data: ProfileData): string {
  const { profile, repos, activity, selfDescription } = data;

  const reposWithDesc = repos.filter((r) => r.hasDescription).length;
  const reposWithTopics = repos.filter((r) => r.hasTopics).length;

  return `
GitHub Profile Summary:
- Username: ${profile.username}
- Name: ${profile.name ?? "Not set"}
- Bio: ${profile.bio ?? "Not set"}
- Followers: ${profile.followers} | Following: ${profile.following}
- Public Repos: ${profile.publicRepos} (showing ${repos.length} non-forked)
- Profile README: ${profile.hasReadme ? "YES" : "NO — MISSING"}
- Account created: ${profile.createdAt}

Repository Analysis:
- Total repos analyzed: ${repos.length}
- Repos WITH descriptions: ${reposWithDesc}/${repos.length}
- Repos WITH topics/tags: ${reposWithTopics}/${repos.length}
- Primary languages: ${activity.primaryLanguages.join(", ") || "None detected"}
- Total stars: ${activity.totalStars}
- Last commit: ${activity.lastCommitDate ?? "Unknown"}
- Commit frequency: ${activity.commitFrequency}
- Days since last activity: ~${activity.longestGapDays}

Top Repositories:
${activity.topRepos
  .slice(0, 5)
  .map(
    (r) =>
      `  - ${r.name} (${r.language ?? "No language"}, ⭐${r.stars}): ${
        r.description ?? "NO DESCRIPTION"
      }${r.hasTopics ? ` [tags: ${r.topics.slice(0, 3).join(", ")}]` : " [NO TAGS]"}`
  )
  .join("\n")}

Self-description (what they told us):
"${selfDescription}"

LinkedIn provided: ${data.linkedinUrl ? "Yes" : "No"}
`.trim();
}
