import { describe, expect, it } from "vitest";
import {
  applicationEligibility,
  asyncSessionPrice,
  canReleaseEscrow,
  canVouch,
  isGuildStaff,
  nextMentorRole,
  parseStaffEmails,
  sessionRoomUrl,
  slotsOverlap,
  splitGuildPayout,
  VOUCHES_TO_APPROVE,
} from "../lib/mentorship";

describe("mentor track rules", () => {
  it("requires GitHub, shipped quests, bio, specialties, and live proof", () => {
    const base = {
      githubConnected: true,
      completedQuestCount: 2,
      proofUrls: ["https://app.example.com"],
      bio: "I ship Next.js MVPs and review auth, billing, and deploy failures with founders.",
      specialties: ["Full-stack"],
      hourlyRateGold: 100,
      hourlyRateUsdCents: 0,
    };
    expect(applicationEligibility(base).ok).toBe(true);
    expect(applicationEligibility({ ...base, githubConnected: false }).ok).toBe(false);
    expect(applicationEligibility({ ...base, completedQuestCount: 1 }).ok).toBe(false);
    expect(applicationEligibility({ ...base, proofUrls: [] }).ok).toBe(false);
  });

  it("lets peers with shipped quests vouch, blocks self-vouches, and auto-approves at 2", () => {
    expect(VOUCHES_TO_APPROVE).toBe(2);
    expect(canVouch({ voucherEmail: "a@g.dev", applicantEmail: "a@g.dev", voucherCompletedQuests: 9 }).ok).toBe(false);
    expect(canVouch({ voucherEmail: "a@g.dev", applicantEmail: "b@g.dev", voucherCompletedQuests: 1 }).ok).toBe(false);
    expect(canVouch({ voucherEmail: "a@g.dev", applicantEmail: "b@g.dev", voucherCompletedQuests: 2 }).ok).toBe(true);
    expect(canVouch({ voucherEmail: "a@g.dev", applicantEmail: "b@g.dev", voucherCompletedQuests: 0, voucherRole: "MENTOR" }).ok).toBe(true);
  });

  it("treats admin, guild master, and env staff emails as staff", () => {
    expect(parseStaffEmails("Ada@Guild.dev, bob@guild.dev")).toEqual(["ada@guild.dev", "bob@guild.dev"]);
    expect(isGuildStaff("NOVICE", "ada@guild.dev", ["ada@guild.dev"])).toBe(true);
    expect(isGuildStaff("ADMIN", "x@y.dev", [])).toBe(true);
    expect(isGuildStaff("BUILDER", "x@y.dev", [])).toBe(false);
    expect(nextMentorRole("ADMIN")).toBe("ADMIN");
    expect(nextMentorRole("NOVICE")).toBe("MENTOR");
  });

  it("splits a 15% guild cut and prices async reviews cheaper", () => {
    expect(splitGuildPayout(100)).toEqual({ mentor: 85, guild: 15 });
    expect(splitGuildPayout(1)).toEqual({ mentor: 1, guild: 0 });
    expect(asyncSessionPrice(100)).toBe(60);
    expect(asyncSessionPrice(50)).toBe(40);
  });

  it("releases escrow only after recap plus mentee rating", () => {
    expect(
      canReleaseEscrow({ menteeCompleted: true, mentorCompleted: true, mentorRecap: "Shipped the webhook path and a failing test together.", menteeRating: 5 })
    ).toBe(true);
    expect(
      canReleaseEscrow({ menteeCompleted: true, mentorCompleted: true, mentorRecap: "too short", menteeRating: 5 })
    ).toBe(false);
    expect(
      canReleaseEscrow({ menteeCompleted: false, mentorCompleted: true, mentorRecap: "Shipped the webhook path and a failing test together.", menteeRating: 5 })
    ).toBe(false);
  });

  it("detects overlapping slots and builds a live room URL", () => {
    expect(slotsOverlap({ startsAt: 1, endsAt: 5 }, { startsAt: 4, endsAt: 8 })).toBe(true);
    expect(slotsOverlap({ startsAt: 1, endsAt: 5 }, { startsAt: 5, endsAt: 8 })).toBe(false);
    expect(sessionRoomUrl(12)).toBe("https://meet.jit.si/indiedevquest-session-12");
  });
});
