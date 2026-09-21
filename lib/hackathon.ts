export const HACKATHON_THEMES = [
  "Ship an MVP",
  "AI-native tool",
  "Indie UI that converts",
  "Infra that stays quiet",
] as const;

export const HACKATHON_DURATION_HOURS = [24, 48, 168] as const;

export type HackathonTheme = (typeof HACKATHON_THEMES)[number];
export type HackathonPhase = "UPCOMING" | "LIVE" | "JUDGING" | "COMPLETED";

export function isHackathonTheme(value: unknown): value is HackathonTheme {
  return typeof value === "string" && (HACKATHON_THEMES as readonly string[]).includes(value);
}

export function parseDurationHours(value: unknown): number {
  const hours = Number(value);
  return (HACKATHON_DURATION_HOURS as readonly number[]).includes(hours) ? hours : 48;
}

export function makeHackathonSlug(title: string, unique = Date.now().toString(36)): string {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 36) || "hackathon";
  return `${base}-${unique}`;
}

export function isLiveProjectUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toMillis(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

export function hackathonPhase(
  hackathon: {
    startsAt: Date | string | number;
    endsAt: Date | string | number;
    status?: string | null;
    winnerId?: string | null;
  },
  now = Date.now()
): HackathonPhase {
  if (hackathon.status === "COMPLETED" || Boolean(hackathon.winnerId?.trim())) {
    return "COMPLETED";
  }
  const start = toMillis(hackathon.startsAt);
  const end = toMillis(hackathon.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "UPCOMING";
  if (now < start) return "UPCOMING";
  if (now <= end) return "LIVE";
  return "JUDGING";
}

export function canJoinPhase(phase: HackathonPhase): boolean {
  return phase === "UPCOMING" || phase === "LIVE";
}

export function canSubmitPhase(phase: HackathonPhase): boolean {
  return phase === "LIVE";
}

export function canAwardPhase(phase: HackathonPhase): boolean {
  return phase === "LIVE" || phase === "JUDGING";
}

export const LARGE_GUILD_SUBMISSIONS = 4;

export function canVotePhase(phase: HackathonPhase): boolean {
  return phase === "JUDGING";
}

export function isLargeGuildHackathon(submissionCount: number): boolean {
  return submissionCount >= LARGE_GUILD_SUBMISSIONS;
}

export function voteQuorum(submissionCount: number): number {
  if (submissionCount <= 0) return 0;
  return Math.min(submissionCount, Math.max(3, Math.ceil(submissionCount / 2)));
}

export function tallyHackathonVotes(candidateUserIds: string[]): {
  counts: Record<string, number>;
  total: number;
  topVotes: number;
  leaderIds: string[];
} {
  const counts: Record<string, number> = {};
  for (const id of candidateUserIds) {
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  const total = candidateUserIds.filter(Boolean).length;
  let topVotes = 0;
  for (const n of Object.values(counts)) {
    if (n > topVotes) topVotes = n;
  }
  const leaderIds = Object.entries(counts)
    .filter(([, n]) => n === topVotes && topVotes > 0)
    .map(([id]) => id)
    .sort();
  return { counts, total, topVotes, leaderIds };
}

export function hostMayAwardFreely(phase: HackathonPhase, submissionCount: number): boolean {
  if (!canAwardPhase(phase)) return false;
  if (phase === "JUDGING" && isLargeGuildHackathon(submissionCount)) return false;
  if (phase === "LIVE" && isLargeGuildHackathon(submissionCount)) return false;
  return true;
}

export function guildVoteReady(submissionCount: number, voteTotal: number): boolean {
  return isLargeGuildHackathon(submissionCount) && voteTotal >= voteQuorum(submissionCount);
}

export function awardCandidateAllowed(args: {
  phase: HackathonPhase;
  submissionCount: number;
  voteTotal: number;
  leaderIds: string[];
  winnerId: string;
}): { ok: true } | { ok: false; error: string } {
  if (!canAwardPhase(args.phase)) {
    return { ok: false, error: "Wait until the event is live or in judging." };
  }
  if (hostMayAwardFreely(args.phase, args.submissionCount)) {
    return { ok: true };
  }
  if (args.phase !== "JUDGING") {
    return { ok: false, error: "Close submissions first. Large sprints go to a guild vote." };
  }
  if (!guildVoteReady(args.submissionCount, args.voteTotal)) {
    return {
      ok: false,
      error: `Need ${voteQuorum(args.submissionCount)} guild votes before crowning a large sprint.`,
    };
  }
  if (args.leaderIds.length === 1) {
    if (args.winnerId !== args.leaderIds[0]) {
      return { ok: false, error: "Large sprints follow the guild vote. Crown the current leader." };
    }
    return { ok: true };
  }
  if (!args.leaderIds.includes(args.winnerId)) {
    return { ok: false, error: "Vote is tied. Crown one of the tied builds." };
  }
  return { ok: true };
}
