export const MENTOR_SPECIALTIES = [
  "Full-stack",
  "Frontend",
  "AI",
  "DevOps",
  "Auth",
  "Payments",
  "Indie shipping",
] as const;

export type MentorSpecialty = (typeof MENTOR_SPECIALTIES)[number];
export type MentorProfileStatus = "VETTING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type SessionKind = "LIVE" | "ASYNC";
export type PaymentKind = "GOLD" | "CASH";
export type EscrowStatus = "HELD" | "RELEASED" | "REFUNDED";

export const MIN_COMPLETED_QUESTS = 2;
export const VOUCHES_TO_APPROVE = 2;
export const GUILD_CUT_BPS = 1500;
export const ASYNC_RATE_BPS = 6000;
export const MIN_ASYNC_GOLD = 40;
export const MIN_HOURLY_GOLD = 50;
export const MAX_HOURLY_GOLD = 500;
export const MIN_HOURLY_USD_CENTS = 1500;
export const MAX_HOURLY_USD_CENTS = 20000;

export function isMentorSpecialty(value: unknown): value is MentorSpecialty {
  return typeof value === "string" && (MENTOR_SPECIALTIES as readonly string[]).includes(value);
}

export function parseSpecialties(value: unknown): MentorSpecialty[] {
  if (!Array.isArray(value)) return [];
  const unique = [...new Set(value.filter(isMentorSpecialty))];
  return unique.slice(0, 4);
}

export function parseStaffEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isGuildStaff(role: string | null | undefined, email: string, staffEmails: string[] = []): boolean {
  if (role === "ADMIN" || role === "GUILD_MASTER") return true;
  return staffEmails.includes(email.trim().toLowerCase());
}

export function canVouch(args: {
  voucherEmail: string;
  applicantEmail: string;
  voucherRole?: string | null;
  voucherCompletedQuests: number;
  staff?: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (args.voucherEmail === args.applicantEmail) {
    return { ok: false, error: "You cannot vouch for yourself." };
  }
  if (args.staff || args.voucherRole === "MENTOR" || args.voucherRole === "ADMIN" || args.voucherRole === "GUILD_MASTER") {
    return { ok: true };
  }
  if (args.voucherCompletedQuests < MIN_COMPLETED_QUESTS) {
    return { ok: false, error: `Vouching requires ${MIN_COMPLETED_QUESTS} completed quests or mentor rank.` };
  }
  return { ok: true };
}

export function applicationEligibility(args: {
  githubConnected: boolean;
  completedQuestCount: number;
  proofUrls: string[];
  bio: string;
  specialties: string[];
  hourlyRateGold: number;
  hourlyRateUsdCents: number;
}): { ok: true } | { ok: false; error: string } {
  if (!args.githubConnected) {
    return { ok: false, error: "Connect GitHub before applying. Mentors prove they ship in public." };
  }
  if (args.completedQuestCount < MIN_COMPLETED_QUESTS) {
    return { ok: false, error: `Ship ${MIN_COMPLETED_QUESTS} quests (live proof) before applying.` };
  }
  if (args.bio.trim().length < 40 || args.bio.trim().length > 500) {
    return { ok: false, error: "Write a bio between 40 and 500 characters." };
  }
  if (args.specialties.length < 1) {
    return { ok: false, error: "Pick at least one specialty." };
  }
  if (args.proofUrls.length < 1 || args.proofUrls.length > 3) {
    return { ok: false, error: "Attach 1–3 live proof URLs (shipped work or GitHub)." };
  }
  if (args.hourlyRateGold < MIN_HOURLY_GOLD || args.hourlyRateGold > MAX_HOURLY_GOLD) {
    return { ok: false, error: `Gold rate must be ${MIN_HOURLY_GOLD}–${MAX_HOURLY_GOLD}.` };
  }
  if (
    args.hourlyRateUsdCents !== 0 &&
    (args.hourlyRateUsdCents < MIN_HOURLY_USD_CENTS || args.hourlyRateUsdCents > MAX_HOURLY_USD_CENTS)
  ) {
    return { ok: false, error: "Cash rate must be $15–$200, or 0 to take gold only." };
  }
  return { ok: true };
}

export function splitGuildPayout(amount: number, cutBps = GUILD_CUT_BPS): { mentor: number; guild: number } {
  const safe = Math.max(0, Math.round(amount));
  const guild = Math.min(safe, Math.round((safe * cutBps) / 10_000));
  return { mentor: safe - guild, guild };
}

export function asyncSessionPrice(hourly: number, floor = MIN_ASYNC_GOLD): number {
  return Math.max(floor, Math.round((hourly * ASYNC_RATE_BPS) / 10_000));
}

export function sessionRoomUrl(sessionId: number): string {
  return `https://meet.jit.si/indiedevquest-session-${sessionId}`;
}

export function slotsOverlap(
  a: { startsAt: number; endsAt: number },
  b: { startsAt: number; endsAt: number }
): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function canReleaseEscrow(args: {
  menteeCompleted: boolean;
  mentorCompleted: boolean;
  mentorRecap: string;
  menteeRating: number | null;
}): boolean {
  return (
    args.menteeCompleted &&
    args.mentorCompleted &&
    args.mentorRecap.trim().length >= 20 &&
    typeof args.menteeRating === "number" &&
    args.menteeRating >= 1 &&
    args.menteeRating <= 5
  );
}

export function averageRating(sum: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

export function nextMentorRole(current: string | null | undefined): string {
  if (current === "ADMIN" || current === "GUILD_MASTER" || current === "MENTOR") {
    return current;
  }
  return "MENTOR";
}
