import { describe, expect, it } from "vitest";
import { DIRECTORY_HOSTS, getHostCoverage, getQuestProofSpec } from "../lib/content/quest-proof-spec";
import { githubNotFoundReason, parseGithubRepo, parseProofUrls } from "../lib/validate-quest";

describe("quest deliverable validation", () => {
  it("requires five distinct directory listing URLs", () => {
    const spec = getQuestProofSpec("mkt_directory_listings");
    expect(spec.count).toBe(5);
    expect(spec.kind).toBe("directory_listing");
    expect(spec.distinctHosts).toBe(true);
    expect(spec.expectedHosts?.map((host) => host.name)).toEqual([
      "Product Hunt",
      "AlternativeTo",
      "BetaList",
      "There's An AI For That",
      "Indie Hackers",
    ]);
  });

  it("requires five interview writeups and three newsletter issues", () => {
    expect(getQuestProofSpec("mkt_customer_interview").count).toBe(5);
    expect(getQuestProofSpec("mkt_newsletter").count).toBe(3);
    expect(getQuestProofSpec("main_public_changelog").count).toBe(4);
  });

  it("parses unique proof URLs from arrays, commas, and notes", () => {
    const urls = parseProofUrls(
      ["https://a.com/1/", "https://a.com/1", "https://b.com/2"],
      "see also https://c.com/3"
    );
    expect(urls).toEqual(["https://a.com/1/", "https://b.com/2", "https://c.com/3"]);
  });

  it("strips GitHub clone suffixes and trailing punctuation", () => {
    const urls = parseProofUrls(
      ["https://github.com/nexai2024/indiedev_quest.git", "https://github.com/nexai2024/indiedev_quest)."]
    );
    expect(urls).toEqual(["https://github.com/nexai2024/indiedev_quest"]);
  });

  it("explains GitHub 404 as private or missing", () => {
    const reason = githubNotFoundReason("https://github.com/nexai2024/secret-app", 404);
    expect(reason).toMatch(/private/i);
    expect(reason).toMatch(/connect GitHub/i);
    expect(githubNotFoundReason("https://example.com/app", 404)).toBeNull();
    expect(githubNotFoundReason("https://github.com/nexai2024/secret-app", 404, { authenticated: true })).toMatch(
      /collaborator/i
    );
  });

  it("parses GitHub owner/repo from page and clone URLs", () => {
    expect(parseGithubRepo("https://github.com/nexai2024/indiedev_quest.git")).toEqual({
      owner: "nexai2024",
      repo: "indiedev_quest",
    });
    expect(parseGithubRepo("https://github.com/topics/nextjs")).toBeNull();
  });

  it("names missing directory hosts after a partial listing submit", () => {
    const coverage = getHostCoverage(
      [
        "https://www.producthunt.com/posts/indie-quest",
        "https://github.com/someone/not-a-directory",
      ],
      DIRECTORY_HOSTS
    );
    expect(coverage.foundHosts).toEqual(["Product Hunt"]);
    expect(coverage.unrecognizedHosts).toEqual(["github.com"]);
    expect(coverage.missingHosts).toEqual([
      "AlternativeTo",
      "BetaList",
      "There's An AI For That",
      "Indie Hackers",
    ]);
  });

  it("flags a repeated Product Hunt listing instead of counting it twice", () => {
    const coverage = getHostCoverage(
      [
        "https://www.producthunt.com/posts/one",
        "https://www.producthunt.com/posts/two",
        "https://alternativeto.net/software/one/",
      ],
      DIRECTORY_HOSTS
    );
    expect(coverage.foundHosts).toEqual(["Product Hunt", "AlternativeTo"]);
    expect(coverage.repeatedHosts).toEqual(["Product Hunt"]);
    expect(coverage.missingHosts).toEqual(["BetaList", "There's An AI For That", "Indie Hackers"]);
  });
});

describe("quest board pinning and local log", () => {
  it("pins in-progress and under-review quests above available ones", async () => {
    const { pinActiveQuests } = await import("../lib/content/quest-board");
    const ordered = pinActiveQuests([
      { userStatus: "AVAILABLE" },
      { userStatus: "COMPLETED" },
      { userStatus: "IN_PROGRESS" },
      { userStatus: "UNDER_REVIEW" },
    ]).map((quest) => quest.userStatus);
    expect(ordered).toEqual(["IN_PROGRESS", "UNDER_REVIEW", "AVAILABLE", "COMPLETED"]);
  });
});

describe("coding quests go through the Code Lab", () => {
  it("maps rate limiter, pagination, and tool-router quests to arena katas", () => {
    expect(getQuestProofSpec("side_rate_limit").kind).toBe("code_kata");
    expect(getQuestProofSpec("side_rate_limit").labChallengeId).toBe("arena_14");
    expect(getQuestProofSpec("side_postgres_indexes").kind).toBe("code_kata");
    expect(getQuestProofSpec("ai_tool_calling").labChallengeId).toBe("arena_25");
  });
});
