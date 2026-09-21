import { clerkClient } from "@clerk/nextjs/server";

export type GithubAuthStatus = {
  connected: boolean;
  hasRepoAccess: boolean;
  login: string | null;
  scopes: string[];
};

function splitScopes(scopes: string[] | undefined): string[] {
  if (!scopes?.length) return [];
  return scopes.flatMap((scope) => scope.split(/[,\s]+/)).filter(Boolean);
}

export function tokenHasRepoAccess(scopes: string[] | undefined): boolean {
  return splitScopes(scopes).includes("repo");
}

export async function getGithubAccessToken(userId: string): Promise<{ token: string; scopes: string[] } | null> {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(userId, "github");
    const entry = response.data[0];
    if (!entry?.token) return null;
    return { token: entry.token, scopes: splitScopes(entry.scopes) };
  } catch (error) {
    console.error("GitHub OAuth token lookup failed:", error);
    return null;
  }
}

export async function getGithubAuthStatus(userId: string): Promise<GithubAuthStatus> {
  const access = await getGithubAccessToken(userId);
  if (!access) {
    return { connected: false, hasRepoAccess: false, login: null, scopes: [] };
  }

  let login: string | null = null;
  try {
    const me = await fetch("https://api.github.com/user", {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${access.token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "IndieDevQuest",
      },
    });
    if (me.ok) {
      const data = (await me.json()) as { login?: string };
      login = typeof data.login === "string" ? data.login : null;
    }
  } catch {
    // Keep Clerk token state even if GitHub /user is down.
  }

  return {
    connected: true,
    hasRepoAccess: tokenHasRepoAccess(access.scopes),
    login,
    scopes: access.scopes,
  };
}
