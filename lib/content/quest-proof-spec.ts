import { QUEST_CATALOG } from "@/lib/content/quest-catalog";

export type ProofKind =
  | "url"
  | "directory_listing"
  | "social_post"
  | "video"
  | "github"
  | "live_site"
  | "document"
  | "changelog_entry"
  | "newsletter"
  | "interview"
  | "test_file"
  | "code_kata";

export type ExpectedHost = {
  name: string;
  hosts: string[];
  example: string;
};

export type QuestProofSpec = {
  count: number;
  inspectCount?: number;
  kind: ProofKind;
  itemLabel: string;
  distinctHosts: boolean;
  criteria: string;
  expectedHosts?: ExpectedHost[];
  labChallengeId?: string;
};

export const DIRECTORY_HOSTS: ExpectedHost[] = [
  {
    name: "Product Hunt",
    hosts: ["producthunt.com"],
    example: "https://www.producthunt.com/posts/your-product",
  },
  {
    name: "AlternativeTo",
    hosts: ["alternativeto.net"],
    example: "https://alternativeto.net/software/your-product/",
  },
  {
    name: "BetaList",
    hosts: ["betalist.com"],
    example: "https://betalist.com/startups/your-product",
  },
  {
    name: "There's An AI For That",
    hosts: ["theresanaiforthat.com"],
    example: "https://theresanaiforthat.com/ai/your-product/",
  },
  {
    name: "Indie Hackers",
    hosts: ["indiehackers.com"],
    example: "https://www.indiehackers.com/product/your-product",
  },
];

export type HostCoverage = {
  foundHosts: string[];
  missingHosts: string[];
  unrecognizedHosts: string[];
  repeatedHosts: string[];
};

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function matchExpectedHost(url: string, expected: ExpectedHost[] = []): ExpectedHost | null {
  const host = hostnameOf(url);
  if (!host) return null;
  return (
    expected.find((entry) => entry.hosts.some((fragment) => host === fragment || host.endsWith(`.${fragment}`))) ??
    null
  );
}

export function getHostCoverage(urls: string[], expected: ExpectedHost[] = []): HostCoverage {
  const found: string[] = [];
  const unrecognized: string[] = [];
  const seenNames = new Map<string, number>();

  for (const url of urls) {
    const match = matchExpectedHost(url, expected);
    if (!match) {
      const host = hostnameOf(url);
      if (host) unrecognized.push(host);
      continue;
    }
    found.push(match.name);
    seenNames.set(match.name, (seenNames.get(match.name) || 0) + 1);
  }

  const uniqueFound = [...new Set(found)];
  return {
    foundHosts: uniqueFound,
    missingHosts: expected.map((entry) => entry.name).filter((name) => !uniqueFound.includes(name)),
    unrecognizedHosts: [...new Set(unrecognized)],
    repeatedHosts: [...seenNames.entries()].filter(([, count]) => count > 1).map(([name]) => name),
  };
}

const DEFAULT_SPEC: QuestProofSpec = {
  count: 1,
  kind: "url",
  itemLabel: "Proof URL",
  distinctHosts: false,
  criteria: "A live public URL that matches the quest requirements.",
};

const SPECS: Partial<Record<string, QuestProofSpec>> = {
  main_ship_mvp: {
    count: 2,
    kind: "live_site",
    itemLabel: "Deliverable URL",
    distinctHosts: true,
    criteria: "Submit the GitHub repository URL and the live Vercel/Netlify deployment URL. Both must load.",
  },
  side_nextauth_drizzle: {
    count: 1,
    kind: "github",
    itemLabel: "PR or repository URL",
    distinctHosts: false,
    criteria: "A GitHub PR or repo that shows NextAuth/Clerk plus a Drizzle schema.",
  },
  side_stripe_checkout: {
    count: 1,
    kind: "video",
    itemLabel: "Checkout demo URL",
    distinctHosts: false,
    criteria: "A Loom/YouTube video or live checkout page proving Stripe sandbox checkout.",
  },
  main_first_100_mrr: {
    count: 1,
    kind: "document",
    itemLabel: "Revenue proof URL",
    distinctHosts: false,
    criteria: "A public page, dashboard share, or image that shows at least $100 MRR.",
  },
  side_ai_agent_pipeline: {
    count: 1,
    kind: "live_site",
    itemLabel: "Live demo or repo URL",
    distinctHosts: false,
    criteria: "A working AI agent/demo or GitHub repo with the agent pipeline.",
  },
  main_waitlist_100: {
    count: 1,
    kind: "live_site",
    itemLabel: "Waitlist landing URL",
    distinctHosts: false,
    inspectCount: 1,
    criteria: "A live landing page with email capture. Notes should include the waitlist count.",
  },
  main_public_changelog: {
    count: 4,
    kind: "changelog_entry",
    itemLabel: "Dated changelog entry URL",
    distinctHosts: false,
    criteria: "Four dated weekly changelog posts or permalinks. Each URL must show a dated shipping update.",
  },
  main_first_paying_user: {
    count: 1,
    kind: "document",
    itemLabel: "Receipt or customer proof URL",
    distinctHosts: false,
    criteria: "Anonymized Stripe receipt, invoice, or customer email proof that a stranger paid.",
  },
  main_seo_landing: {
    count: 1,
    kind: "live_site",
    itemLabel: "SEO landing page URL",
    distinctHosts: false,
    criteria: "A public landing page targeting a keyword. Optional Search Console screenshot URL as a second line in notes.",
  },
  main_onboarding_flow: {
    count: 1,
    kind: "video",
    itemLabel: "Onboarding demo URL",
    distinctHosts: false,
    criteria: "A Loom of a fresh signup completing a 3-step onboarding.",
  },
  main_error_tracking: {
    count: 1,
    kind: "live_site",
    itemLabel: "Sentry/project proof URL",
    distinctHosts: false,
    criteria: "A Sentry (or equivalent) project page, docs, or screenshot proving production errors are captured.",
  },
  main_docs_site: {
    count: 1,
    kind: "live_site",
    itemLabel: "Docs site URL",
    distinctHosts: false,
    criteria: "A public documentation site for the product.",
  },
  main_referral_loop: {
    count: 1,
    kind: "live_site",
    itemLabel: "Referral flow URL",
    distinctHosts: false,
    criteria: "A live referral or invite page with a shareable link.",
  },
  main_team_invites: {
    count: 1,
    kind: "live_site",
    itemLabel: "Team invite URL or demo",
    distinctHosts: false,
    criteria: "Proof of team invites: live settings page, Loom, or PR.",
  },
  main_usage_limits: {
    count: 1,
    kind: "github",
    itemLabel: "Usage limits proof URL",
    distinctHosts: false,
    criteria: "PR or live app showing plan/usage limits.",
  },
  side_clerk_webhooks: {
    count: 1,
    kind: "github",
    itemLabel: "Webhook handler URL",
    distinctHosts: false,
    criteria: "PR or repo showing Clerk (or auth) webhook handling.",
  },
  side_resend_email: {
    count: 1,
    kind: "github",
    itemLabel: "Email proof URL",
    distinctHosts: false,
    criteria: "PR, template preview, or live transactional email example.",
  },
  side_postgres_indexes: {
    count: 0,
    kind: "code_kata",
    itemLabel: "In-app kata",
    distinctHosts: false,
    labChallengeId: "arena_16",
    criteria: "Open the Code Lab and implement cursor pagination. Passing tests completes this quest.",
  },
  side_rate_limit: {
    count: 0,
    kind: "code_kata",
    itemLabel: "In-app kata",
    distinctHosts: false,
    labChallengeId: "arena_14",
    criteria: "Open the Code Lab and implement the rate limiter. Passing tests completes this quest.",
  },
  side_file_uploads: {
    count: 1,
    kind: "live_site",
    itemLabel: "Upload demo URL",
    distinctHosts: false,
    criteria: "Live upload flow or PR for file storage.",
  },
  side_dark_mode: {
    count: 1,
    kind: "live_site",
    itemLabel: "Themed live site URL",
    distinctHosts: false,
    criteria: "Live site showing a persisted theme switch.",
  },
  side_e2e_tests: {
    count: 1,
    kind: "github",
    itemLabel: "Playwright PR URL",
    distinctHosts: false,
    inspectCount: 5,
    criteria: "A PR or repo that contains at least 5 Playwright (or equivalent e2e) tests covering signup, a core action, and a failure path.",
  },
  side_storybook: {
    count: 1,
    kind: "live_site",
    itemLabel: "Storybook URL",
    distinctHosts: false,
    inspectCount: 8,
    criteria: "A public Storybook with at least 8 component stories.",
  },
  side_openapi: {
    count: 1,
    kind: "url",
    itemLabel: "OpenAPI spec URL",
    distinctHosts: false,
    criteria: "A public OpenAPI/Swagger JSON/YAML or docs page.",
  },
  side_cron_jobs: {
    count: 1,
    kind: "github",
    itemLabel: "Cron job proof URL",
    distinctHosts: false,
    criteria: "PR or dashboard showing a scheduled production job.",
  },
  ai_rag_chat: {
    count: 1,
    kind: "live_site",
    itemLabel: "RAG chat demo URL",
    distinctHosts: false,
    criteria: "Live RAG chat demo or repo.",
  },
  ai_streaming_ui: {
    count: 1,
    kind: "live_site",
    itemLabel: "Streaming UI URL",
    distinctHosts: false,
    criteria: "Live streaming AI UI or Loom.",
  },
  ai_tool_calling: {
    count: 0,
    kind: "code_kata",
    itemLabel: "In-app kata",
    distinctHosts: false,
    labChallengeId: "arena_25",
    criteria: "Open the Code Lab and implement routeTool so intents map to search, calendar, email, or none.",
  },
  ai_eval_harness: {
    count: 1,
    kind: "github",
    itemLabel: "Eval harness URL",
    distinctHosts: false,
    inspectCount: 20,
    criteria: "Eval report or repo scoring at least 20 prompts.",
  },
  ai_prompt_library: {
    count: 1,
    kind: "live_site",
    itemLabel: "Prompt library URL",
    distinctHosts: false,
    criteria: "Public prompt library or CMS.",
  },
  ai_moderation: {
    count: 1,
    kind: "github",
    itemLabel: "Moderation proof URL",
    distinctHosts: false,
    criteria: "PR or demo of input/output moderation.",
  },
  ai_embeddings_search: {
    count: 1,
    kind: "live_site",
    itemLabel: "Embeddings search URL",
    distinctHosts: false,
    criteria: "Live semantic search or repo.",
  },
  ai_image_pipeline: {
    count: 1,
    kind: "url",
    itemLabel: "Generated image or pipeline URL",
    distinctHosts: false,
    criteria: "Generated image URL plus storage/pipeline proof.",
  },
  ai_voice_agent: {
    count: 1,
    kind: "live_site",
    itemLabel: "Voice agent demo URL",
    distinctHosts: false,
    criteria: "Live or recorded voice agent demo.",
  },
  ai_cost_dashboard: {
    count: 1,
    kind: "live_site",
    itemLabel: "AI cost dashboard URL",
    distinctHosts: false,
    criteria: "Dashboard showing model spend or token usage.",
  },
  ops_ci_green: {
    count: 1,
    kind: "github",
    itemLabel: "Green CI URL",
    distinctHosts: false,
    criteria: "A GitHub Actions (or CI) run that is green on main.",
  },
  ops_preview_deploys: {
    count: 1,
    kind: "github",
    itemLabel: "Preview deploy proof URL",
    distinctHosts: false,
    criteria: "A PR comment or Vercel preview URL proving unique PR deploys.",
  },
  ops_env_split: {
    count: 1,
    kind: "document",
    itemLabel: "Env split proof URL",
    distinctHosts: false,
    criteria: "Docs or screenshot showing separate preview/prod env.",
  },
  ops_uptime_monitor: {
    count: 1,
    kind: "live_site",
    itemLabel: "Uptime monitor URL",
    distinctHosts: false,
    criteria: "Public status page or uptime monitor for the product.",
  },
  ops_log_drain: {
    count: 1,
    kind: "document",
    itemLabel: "Log drain proof URL",
    distinctHosts: false,
    criteria: "Dashboard or docs showing a log drain.",
  },
  ops_backup_restore: {
    count: 1,
    kind: "document",
    itemLabel: "Backup restore proof URL",
    distinctHosts: false,
    criteria: "Restore log or runbook proving a backup restore.",
  },
  ops_dockerize: {
    count: 1,
    kind: "github",
    itemLabel: "Dockerfile / compose URL",
    distinctHosts: false,
    criteria: "Repo with a working Dockerfile or compose file.",
  },
  ops_feature_flags: {
    count: 1,
    kind: "live_site",
    itemLabel: "Feature flag proof URL",
    distinctHosts: false,
    criteria: "Live flags UI or PR for feature flags.",
  },
  ops_load_test: {
    count: 1,
    kind: "document",
    itemLabel: "Load test report URL",
    distinctHosts: false,
    criteria: "k6/Artillery report or CI artifact.",
  },
  ops_security_headers: {
    count: 1,
    kind: "live_site",
    itemLabel: "Security headers URL",
    distinctHosts: false,
    criteria: "Live site or securityheaders.com grade for the product.",
  },
  mkt_launch_tweet: {
    count: 1,
    kind: "social_post",
    itemLabel: "Launch post URL",
    distinctHosts: false,
    criteria: "A public X/LinkedIn/Threads launch post that explains the problem you solve.",
  },
  mkt_indie_hackers: {
    count: 1,
    kind: "social_post",
    itemLabel: "Build log thread URL",
    distinctHosts: false,
    criteria: "A public Indie Hackers (or similar) build log thread.",
  },
  mkt_demo_video: {
    count: 1,
    kind: "video",
    itemLabel: "90-second demo URL",
    distinctHosts: false,
    criteria: "A YouTube, Loom, or Mux video demo of the product.",
  },
  mkt_customer_interview: {
    count: 5,
    kind: "interview",
    itemLabel: "Interview notes URL",
    distinctHosts: false,
    criteria: "Five separate anonymized interview writeups. Each URL must be a distinct interview, not the same doc five times.",
  },
  mkt_pricing_page: {
    count: 1,
    kind: "live_site",
    itemLabel: "Pricing page URL",
    distinctHosts: false,
    criteria: "A live /pricing page with plans and a checkout CTA.",
  },
  mkt_case_study: {
    count: 1,
    kind: "live_site",
    itemLabel: "Case study URL",
    distinctHosts: false,
    criteria: "A published customer case study.",
  },
  mkt_newsletter: {
    count: 3,
    kind: "newsletter",
    itemLabel: "Newsletter issue URL",
    distinctHosts: false,
    criteria: "Three distinct published newsletter issues. Each URL must be a real issue archive, not a signup page repeated three times.",
  },
  mkt_directory_listings: {
    count: 5,
    kind: "directory_listing",
    itemLabel: "Live directory listing URL",
    distinctHosts: true,
    expectedHosts: DIRECTORY_HOSTS,
    criteria:
      "Five live public directory listing pages on five different hosts. Use Product Hunt, AlternativeTo, BetaList, There's An AI For That, and Indie Hackers. Each URL must be the listing itself, not a Google Doc claiming you posted.",
  },
  mkt_affiliate: {
    count: 2,
    kind: "live_site",
    itemLabel: "Affiliate deliverable URL",
    distinctHosts: false,
    criteria: "The affiliate offer page and one example tracked partner link.",
  },
  fs_realtime: {
    count: 1,
    kind: "video",
    itemLabel: "Realtime demo URL",
    distinctHosts: false,
    criteria: "A Loom of two browsers updating live, or a live realtime demo.",
  },
};

export function getQuestProofSpec(questId: string): QuestProofSpec {
  return SPECS[questId] ?? DEFAULT_SPEC;
}

export function getQuestById(questId: string) {
  return QUEST_CATALOG.find((quest) => quest.questId === questId) ?? null;
}

export function withProofSpec<T extends { questId: string }>(quest: T) {
  return { ...quest, proofSpec: getQuestProofSpec(quest.questId) };
}

export function catalogQuestBoard() {
  return QUEST_CATALOG.map((quest, index) =>
    withProofSpec({
      ...quest,
      id: index + 1,
      userStatus: "AVAILABLE" as const,
      userQuestId: null,
      startedAt: null,
      completedAt: null,
    })
  );
}
