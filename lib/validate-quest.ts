import { generateText, Output } from "ai";
import { z } from "zod";
import {
  getQuestById,
  getQuestProofSpec,
  getHostCoverage,
  matchExpectedHost,
  type HostCoverage,
  type QuestProofSpec,
} from "@/lib/content/quest-proof-spec";

export type ProofItemResult = {
  url: string;
  passed: boolean;
  reason: string;
  httpStatus?: number;
  title?: string;
  directoryName?: string;
};

export type QuestValidationReport = {
  summary: string;
  requiredCount: number;
  submittedCount: number;
  passedCount: number;
  inspectCount?: number;
  aiUsed: boolean;
  items: ProofItemResult[];
  allPassed: boolean;
  foundHosts?: string[];
  missingHosts?: string[];
  unrecognizedHosts?: string[];
  repeatedHosts?: string[];
  needsGithubOAuth?: boolean;
  githubAuthenticated?: boolean;
};

function coverageFields(coverage: HostCoverage | null): Pick<
  QuestValidationReport,
  "foundHosts" | "missingHosts" | "unrecognizedHosts" | "repeatedHosts"
> {
  if (!coverage) return {};
  return {
    foundHosts: coverage.foundHosts,
    missingHosts: coverage.missingHosts,
    unrecognizedHosts: coverage.unrecognizedHosts,
    repeatedHosts: coverage.repeatedHosts,
  };
}

function coverageSummary(coverage: HostCoverage | null): string {
  if (!coverage) return "";
  const parts: string[] = [];
  if (coverage.foundHosts.length > 0) parts.push(`Found: ${coverage.foundHosts.join(", ")}.`);
  if (coverage.missingHosts.length > 0) parts.push(`Still needed: ${coverage.missingHosts.join(", ")}.`);
  if (coverage.repeatedHosts.length > 0) parts.push(`Repeated: ${coverage.repeatedHosts.join(", ")}.`);
  if (coverage.unrecognizedHosts.length > 0) {
    parts.push(`Unrecognized hosts: ${coverage.unrecognizedHosts.join(", ")}.`);
  }
  return parts.join(" ");
}

function withCoverage(
  report: QuestValidationReport,
  coverage: HostCoverage | null
): QuestValidationReport {
  if (!coverage) return report;
  const extra = coverageSummary(coverage);
  return {
    ...report,
    ...coverageFields(coverage),
    summary: extra ? `${report.summary} ${extra}` : report.summary,
  };
}

const aiItemSchema = z.object({
  url: z.string(),
  passed: z.boolean(),
  reason: z.string(),
  matchedCount: z.number(),
});

const aiReportSchema = z.object({
  items: z.array(aiItemSchema),
  allPassed: z.boolean(),
  summary: z.string(),
});

export function normalizeProofUrl(value: string): string {
  let url = value.trim().replace(/^<|>$/g, "").replace(/^['"]+|['"]+$/g, "");
  url = url.replace(/[.,);]+$/g, "");
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "github.com" || host === "gist.github.com") {
      parsed.hostname = host;
      parsed.pathname = parsed.pathname.replace(/\.git\/?$/i, "").replace(/\/+$/, "") || "/";
      parsed.hash = "";
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    // keep cleaned string
  }
  return url;
}

export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "github.com") return null;
    const parts = parsed.pathname.replace(/^\//, "").split("/").filter(Boolean);
    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/i, "");
    if (!owner || !repo) return null;
    const reserved = new Set([
      "settings",
      "orgs",
      "marketplace",
      "topics",
      "features",
      "notifications",
      "new",
      "login",
      "search",
      "explore",
    ]);
    if (reserved.has(owner.toLowerCase())) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

export function githubNotFoundReason(
  url: string,
  status: number,
  opts?: { authenticated?: boolean }
): string | null {
  if (status !== 404) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("github")) return null;
  } catch {
    return null;
  }
  if (opts?.authenticated) {
    return "GitHub still returned 404 with your connected account. Check the URL, or add this GitHub user as a collaborator.";
  }
  return "GitHub returned 404. Private repos look exactly like missing URLs until you connect GitHub (repo access) or make the repository public.";
}

export function parseProofUrls(input: unknown, notes?: string): string[] {
  const collected: string[] = [];

  const push = (value: string) => {
    const trimmed = normalizeProofUrl(value);
    if (trimmed) collected.push(trimmed);
  };

  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value === "string") push(value);
    }
  } else if (typeof input === "string") {
    input.split(/[\n,]+/).forEach(push);
  }

  if (notes) {
    const found = notes.match(/https?:\/\/[^\s,]+/g) || [];
    found.forEach(push);
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const url of collected) {
    const key = url.replace(/\/+$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(url);
  }
  return unique;
}

const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i;

function isHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (PRIVATE_HOST.test(url.hostname) || url.hostname.endsWith(".local")) return null;
    return url;
  } catch {
    return null;
  }
}

function stripHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (titleMatch?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
  return { title, text };
}

const BROWSER_UA =
  "Mozilla/5.0 (compatible; IndieDevQuest/1.0; +https://indiedev.quest) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchPage(
  url: string,
  githubToken?: string
): Promise<{
  ok: boolean;
  status: number;
  host: string;
  title: string;
  text: string;
  url: string;
  error?: string;
}> {
  const parsed = isHttpUrl(url);
  if (!parsed) {
    return { ok: false, status: 0, host: "", title: "", text: "", url, error: "URL must be public http(s)" };
  }

  const githubRepo = parseGithubRepo(parsed.toString());
  if (githubRepo) {
    const apiPage = await fetchGithubRepo(parsed, githubRepo, githubToken);
    if (apiPage) return apiPage;
  }

  try {
    const response = await fetch(parsed.toString(), {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    const raw = await response.text();
    const { title, text } = stripHtml(raw);
    let host = parsed.hostname.replace(/^www\./, "");
    try {
      host = new URL(response.url || parsed.toString()).hostname.replace(/^www\./, "");
    } catch {
      // keep parsed host
    }

    if (response.status === 404 && host.includes("github")) {
      return {
        ok: false,
        status: 404,
        host,
        title,
        text,
        url,
        error: githubNotFoundReason(url, 404, { authenticated: Boolean(githubToken) }) || "GitHub returned 404.",
      };
    }

    return {
      ok: response.ok || (response.status >= 200 && response.status < 400),
      status: response.status,
      host,
      title,
      text,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      host: parsed.hostname.replace(/^www\./, ""),
      title: "",
      text: "",
      url,
      error: error instanceof Error ? error.message : "Fetch failed",
    };
  }
}

async function fetchGithubRepo(
  parsed: URL,
  repo: { owner: string; repo: string },
  githubToken?: string
): Promise<{
  ok: boolean;
  status: number;
  host: string;
  title: string;
  text: string;
  url: string;
  error?: string;
} | null> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "IndieDevQuest",
      Accept: "application/vnd.github+json",
    };
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    const api = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers,
    });
    if (api.status === 404) {
      return {
        ok: false,
        status: 404,
        host: "github.com",
        title: "",
        text: "",
        url: parsed.toString(),
        error:
          githubNotFoundReason(parsed.toString(), 404, { authenticated: Boolean(githubToken) }) ||
          "GitHub returned 404.",
      };
    }
    if (!api.ok) return null;
    const data = (await api.json()) as {
      full_name?: string;
      description?: string;
      html_url?: string;
      private?: boolean;
    };
    const name = data.full_name || `${repo.owner}/${repo.repo}`;
    const visibility = data.private ? "private" : "public";
    return {
      ok: true,
      status: 200,
      host: "github.com",
      title: data.private ? `Private repo: ${name}` : name,
      text: data.description || `${visibility} GitHub repository ${name}`,
      url: data.html_url || parsed.toString(),
    };
  } catch {
    return null;
  }
}

function heuristicPass(spec: QuestProofSpec, page: Awaited<ReturnType<typeof fetchPage>>): { passed: boolean; reason: string } {
  if (!page.ok) {
    return { passed: false, reason: page.error || `URL did not load (HTTP ${page.status || 0}).` };
  }

  const blob = `${page.title} ${page.text} ${page.host}`.toLowerCase();
  const notesHosts = ["docs.google.com", "drive.google.com", "notion.so", "notion.site", "dropbox.com", "evernote.com"];
  if (notesHosts.some((host) => page.host.includes(host))) {
    return { passed: false, reason: "Submit the live repo or deployment URL, not a notes doc." };
  }

  const isAppShell = page.status >= 200 && page.status < 400 && (Boolean(page.title) || page.text.length > 0 || spec.kind === "live_site");

  if (page.text.length < 40 && spec.kind !== "video" && spec.kind !== "live_site" && spec.kind !== "url") {
    if (!isAppShell) {
      return { passed: false, reason: "Page loaded but had almost no readable content." };
    }
  }

  if (spec.kind === "directory_listing") {
    const hints = ["listing", "directory", "alternative", "product hunt", "betalist", "indie hackers", "there's an ai", "tool", "submit"];
    if (!hints.some((hint) => blob.includes(hint))) {
      return {
        passed: false,
        reason: "Page does not look like a public directory listing. Submit the listing URL, not a notes doc.",
      };
    }
  }
  if (spec.kind === "github" && !page.host.includes("github")) {
    return { passed: false, reason: "Expected a GitHub repository, PR, or Actions URL." };
  }
  if (spec.kind === "video") {
    const videoHosts = ["loom.com", "youtube.com", "youtu.be", "mux.com", "vimeo.com"];
    if (!videoHosts.some((host) => page.host.includes(host)) && !blob.includes("video")) {
      return { passed: false, reason: "Expected a Loom, YouTube, Mux, or similar demo video URL." };
    }
  }
  if (spec.expectedHosts?.length) {
    const match = matchExpectedHost(page.url, spec.expectedHosts);
    if (!match) {
      return {
        passed: false,
        reason: `Unrecognized host. Need a listing on ${spec.expectedHosts.map((entry) => entry.name).join(", ")}.`,
      };
    }
  }
  return { passed: true, reason: page.title ? `Loaded: ${page.title}` : "Live URL loaded." };
}

async function aiJudge(params: {
  spec: QuestProofSpec;
  questTitle: string;
  questDescription: string;
  pages: Array<{ url: string; host: string; status: number; title: string; text: string; heuristicReason: string }>;
}): Promise<z.infer<typeof aiReportSchema> | null> {
  try {
    const result = await generateText({
      model: "openai/gpt-5.4",
      output: Output.object({ schema: aiReportSchema }),
      prompt: `You validate indie-hacker quest proof. Be fair, not nitpicky.

Pass a URL when it loads and is itself the deliverable. Fail Google Docs, Notion notes, screenshot albums, or writeups that only claim the work was done.

For live_site / Ship-an-MVP style quests: pass a public GitHub repository or PR, and pass a live deployment (Vercel, Netlify, Cloudflare, Railway, or a custom domain). A JS app shell with little text still counts if HTTP 200 and the host is a real deployment or GitHub. A private GitHub repo that loaded via the submitter's GitHub OAuth token is valid.

Quest: ${params.questTitle}
Description: ${params.questDescription}
Required deliverable count: ${params.spec.count}
Kind: ${params.spec.kind}
Item label: ${params.spec.itemLabel}
Criteria: ${params.spec.criteria}
${params.spec.inspectCount ? `Also count in-page matches. Need at least ${params.spec.inspectCount}. Set matchedCount to the number you found.` : "Set matchedCount to 0 if you are not counting in-page matches."}
${params.spec.distinctHosts ? "The two (or more) URLs should be different sites, e.g. GitHub + a live deploy." : ""}
${params.spec.expectedHosts?.length ? `Named directories to cover: ${params.spec.expectedHosts.map((h) => h.name).join(", ")}.` : ""}

Fetched pages:
${params.pages
  .map(
    (page, index) => `ITEM ${index + 1}
URL: ${page.url}
HOST: ${page.host}
HTTP: ${page.status}
TITLE: ${page.title}
HEURISTIC: ${page.heuristicReason}
CONTENT: ${page.text.slice(0, 1800)}`
  )
  .join("\n\n")}

Return one items[] entry per submitted URL, same order. matchedCount must be a number on every item. passed=true if that URL is a valid deliverable. allPassed=true only if every item passed.`,
    });
    return result.output;
  } catch (error) {
    console.error("Quest AI validation error:", error);
    return null;
  }
}

export async function validateQuestProof(params: {
  questId: string;
  proofUrls: unknown;
  notes?: string;
  githubToken?: string;
}): Promise<QuestValidationReport> {
  const spec = getQuestProofSpec(params.questId);
  const quest = getQuestById(params.questId);
  const urls = parseProofUrls(params.proofUrls, params.notes);
  const coverage = spec.expectedHosts?.length ? getHostCoverage(urls, spec.expectedHosts) : null;
  const githubAuthenticated = Boolean(params.githubToken);
  const submittedGithub = urls.some((url) => Boolean(parseGithubRepo(url)));

  if (spec.kind === "code_kata") {
    return {
      summary: `This quest is solved in the Code Lab (Arena), not by pasting URLs. Open /arena?quest=${params.questId}.`,
      requiredCount: spec.count,
      submittedCount: urls.length,
      passedCount: 0,
      aiUsed: false,
      items: [],
      allPassed: false,
    };
  }

  if (urls.length !== spec.count) {
    return withCoverage(
      {
        summary: `This quest needs ${spec.count} ${spec.itemLabel.toLowerCase()}${spec.count === 1 ? "" : "s"}. You submitted ${urls.length}.`,
        requiredCount: spec.count,
        submittedCount: urls.length,
        passedCount: 0,
        inspectCount: spec.inspectCount,
        aiUsed: false,
        items: urls.map((url) => ({
          url,
          passed: false,
          reason: `Need exactly ${spec.count} unique URLs.`,
          directoryName: matchExpectedHost(url, spec.expectedHosts)?.name,
        })),
        allPassed: false,
      },
      coverage
    );
  }

  const pages = await Promise.all(urls.map((url) => fetchPage(url, params.githubToken)));
  const hosts = pages.map((page) => page.host).filter(Boolean);
  const uniqueHosts = new Set(hosts);

  const heuristicItems: ProofItemResult[] = pages.map((page, index) => {
    const url = urls[index]!;
    const heur = heuristicPass(spec, page);
    return {
      url,
      passed: heur.passed,
      reason: heur.reason,
      httpStatus: page.status,
      title: page.title,
      directoryName: matchExpectedHost(url, spec.expectedHosts)?.name,
    };
  });

  if (coverage && (coverage.missingHosts.length > 0 || coverage.repeatedHosts.length > 0)) {
    return withCoverage(
      {
        summary: coverage.missingHosts.length
          ? `Missing directory listings.`
          : `Repeated directory listings.`,
        requiredCount: spec.count,
        submittedCount: urls.length,
        passedCount: 0,
        inspectCount: spec.inspectCount,
        aiUsed: false,
        items: heuristicItems.map((item) => ({
          ...item,
          passed: false,
          reason: item.directoryName
            ? `${item.directoryName}: ${item.reason}`
            : item.reason,
        })),
        allPassed: false,
      },
      coverage
    );
  }

  if (spec.distinctHosts && uniqueHosts.size < spec.count) {
    const repeated = hosts.filter((host, index) => hosts.indexOf(host) !== index);
    return withCoverage(
      {
        summary: `Need ${spec.count} URLs on ${spec.count} different sites. Repeated: ${[...new Set(repeated)].join(", ") || hosts.join(", ") || "none"}.`,
        requiredCount: spec.count,
        submittedCount: urls.length,
        passedCount: 0,
        inspectCount: spec.inspectCount,
        aiUsed: false,
        items: heuristicItems.map((item, index) => {
          const host = hosts[index];
          const isRepeat = Boolean(host && hosts.filter((entry) => entry === host).length > 1);
          return {
            ...item,
            passed: false,
            reason: isRepeat ? `${item.reason} This host was used more than once.` : item.reason,
          };
        }),
        allPassed: false,
      },
      coverage
    );
  }

  const ai = await aiJudge({
    spec,
    questTitle: quest?.title || params.questId,
    questDescription: quest?.description || spec.criteria,
    pages: pages.map((page, index) => ({
      url: urls[index]!,
      host: page.host,
      status: page.status,
      title: page.title,
      text: page.text || page.error || "",
      heuristicReason: heuristicItems[index]!.reason,
    })),
  });

  if (!ai) {
    const passedCount = heuristicItems.filter((item) => item.passed).length;
    const allPassed = passedCount === spec.count;
    const needsGithubOAuth =
      submittedGithub &&
      !githubAuthenticated &&
      heuristicItems.some((item) => !item.passed && /GitHub returned 404/i.test(item.reason));
    return withCoverage(
      {
        summary: allPassed
          ? `All ${spec.count} URLs loaded and match the quest. AI review was unavailable, so they were accepted on live-page checks.`
          : `${passedCount}/${spec.count} URLs loaded. Fix the failing links and resubmit.`,
        requiredCount: spec.count,
        submittedCount: urls.length,
        passedCount,
        inspectCount: spec.inspectCount,
        aiUsed: false,
        items: heuristicItems,
        allPassed,
        needsGithubOAuth,
        githubAuthenticated,
      },
      coverage
    );
  }

  const items: ProofItemResult[] = urls.map((url, index) => {
    const aiItem = ai.items[index];
    const heur = heuristicItems[index]!;
    const fetchOk = typeof heur.httpStatus === "number" && heur.httpStatus > 0 && heur.httpStatus < 400;
    const namedOk = !spec.expectedHosts?.length || Boolean(heur.directoryName);
    const liveKind = spec.kind === "live_site" || spec.kind === "url" || spec.kind === "github";
    const passed =
      fetchOk &&
      namedOk &&
      (heur.passed && liveKind ? true : aiItem ? Boolean(aiItem.passed) : heur.passed);
    return {
      url,
      passed,
      reason: passed ? heur.reason : aiItem?.reason || heur.reason,
      httpStatus: heur.httpStatus,
      title: heur.title,
      directoryName: heur.directoryName,
    };
  });

  const passedCount = items.filter((item) => item.passed).length;
  const namedHostsOk =
    !coverage || (coverage.missingHosts.length === 0 && coverage.repeatedHosts.length === 0);
  const allPassed = passedCount === spec.count && namedHostsOk;
  const needsGithubOAuth =
    submittedGithub &&
    !githubAuthenticated &&
    items.some((item) => !item.passed && /GitHub returned 404/i.test(item.reason));

  return withCoverage(
    {
      summary: allPassed
        ? ai.summary || `All ${spec.count} deliverables passed AI validation.`
        : ai.summary || `${passedCount}/${spec.count} deliverables passed.`,
      requiredCount: spec.count,
      submittedCount: urls.length,
      passedCount,
      inspectCount: spec.inspectCount,
      aiUsed: true,
      items,
      allPassed,
      needsGithubOAuth,
      githubAuthenticated,
    },
    coverage
  );
}
