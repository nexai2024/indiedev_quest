import { describe, expect, it } from "vitest";
import {
  canAwardPhase,
  canJoinPhase,
  canSubmitPhase,
  hackathonPhase,
  isHackathonTheme,
  isLiveProjectUrl,
  makeHackathonSlug,
  parseDurationHours,
} from "../lib/hackathon";

describe("guild hackathons", () => {
  const event = {
    startsAt: 1_000,
    endsAt: 2_000,
    status: "OPEN",
    winnerId: null as string | null,
  };

  it("moves from upcoming to live to judging to completed", () => {
    expect(hackathonPhase(event, 500)).toBe("UPCOMING");
    expect(hackathonPhase(event, 1_000)).toBe("LIVE");
    expect(hackathonPhase(event, 2_000)).toBe("LIVE");
    expect(hackathonPhase(event, 2_001)).toBe("JUDGING");
    expect(hackathonPhase({ ...event, winnerId: "hero@guild.dev" }, 1_500)).toBe("COMPLETED");
    expect(hackathonPhase({ ...event, status: "COMPLETED" }, 1_500)).toBe("COMPLETED");
  });

  it("gates join, submit, and award by phase", () => {
    expect(canJoinPhase("UPCOMING")).toBe(true);
    expect(canJoinPhase("LIVE")).toBe(true);
    expect(canJoinPhase("JUDGING")).toBe(false);
    expect(canSubmitPhase("LIVE")).toBe(true);
    expect(canSubmitPhase("UPCOMING")).toBe(false);
    expect(canAwardPhase("JUDGING")).toBe(true);
    expect(canAwardPhase("COMPLETED")).toBe(false);
  });

  it("accepts catalog themes, durations, slugs, and live URLs", () => {
    expect(isHackathonTheme("Ship an MVP")).toBe(true);
    expect(isHackathonTheme("whatever")).toBe(false);
    expect(parseDurationHours(24)).toBe(24);
    expect(parseDurationHours(99)).toBe(48);
    expect(makeHackathonSlug("Ship Weekend!!", "abc")).toBe("ship-weekend-abc");
    expect(isLiveProjectUrl("https://my-mvp.vercel.app")).toBe(true);
    expect(isLiveProjectUrl("ftp://nope")).toBe(false);
  });
});
