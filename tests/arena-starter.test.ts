import { describe, expect, it } from "vitest";
import { looksUnsolved, toStarterCode } from "../lib/arena-starter";
import { runArenaTests } from "../lib/arena-runner";
import { ARENA_CHALLENGES } from "../lib/content/arena-challenges";
import { testsForChallenge } from "../lib/arena-tests";
import { labChallengeIdForQuest } from "../lib/content/coding-quests";

describe("arena starter stubs", () => {
  it("strips full solutions down to a TODO class or function", () => {
    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === "arena_14");
    expect(challenge).toBeTruthy();
    const starter = toStarterCode(challenge!);
    expect(starter).toMatch(/export class RateLimiter/);
    expect(starter).toMatch(/TODO/);
    expect(starter).not.toMatch(/allow\(/);
    expect(looksUnsolved(starter, starter)).toBe(true);
  });

  it("stubs every top-level class in a multi-class kata", () => {
    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === "arena_13");
    const starter = toStarterCode(challenge!);
    expect(starter).toMatch(/export class TrieNode/);
    expect(starter).toMatch(/export class Trie/);
  });

  it("rejects unchanged or empty submissions", () => {
    const starter = "export function paginate() {\n  throw new Error(\"TODO\");\n}\n";
    expect(looksUnsolved("", starter)).toBe(true);
    expect(looksUnsolved(starter, starter)).toBe(true);
    expect(
      looksUnsolved(
        "export function paginate(items, cursor, limit) { return { page: items.slice(0, limit), nextCursor: null }; }",
        starter
      )
    ).toBe(false);
  });

  it("links coding quests to arena challenge ids", () => {
    expect(labChallengeIdForQuest("side_rate_limit")).toBe("arena_14");
    expect(labChallengeIdForQuest("main_ship_mvp")).toBeNull();
  });
});

describe("deterministic arena runner", () => {
  it("fails the rate-limiter stub and passes the catalog solution", async () => {
    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === "arena_14")!;
    const failed = await runArenaTests("arena_14", toStarterCode(challenge));
    expect(failed.passed).toBe(false);
    const passed = await runArenaTests("arena_14", challenge.initialCode);
    expect(passed.passed).toBe(true);
    expect(passed.results.every((result) => result.passed)).toBe(true);
  });

  it("runs debounce tests instantly with fake timers", async () => {
    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === "arena_5")!;
    const started = Date.now();
    const report = await runArenaTests("arena_5", challenge.initialCode);
    expect(report.passed).toBe(true);
    expect(Date.now() - started).toBeLessThan(80);
  });

  it("executes every catalog solution against its tests", async () => {
    const failures: string[] = [];
    const started = Date.now();
    for (const challenge of ARENA_CHALLENGES) {
      const tests = testsForChallenge(challenge.id);
      expect(tests.length).toBeGreaterThan(0);
      const report = await runArenaTests(challenge.id, challenge.initialCode);
      if (!report.passed) {
        failures.push(`${challenge.id}: ${report.logs.join(" | ")}`);
      }
    }
    expect(failures).toEqual([]);
    expect(Date.now() - started).toBeLessThan(500);
  }, 20000);
});

describe("isolated kata worker", () => {
  it("kills an infinite loop without waiting for real timers", async () => {
    const { runArenaTestsInNodeWorker } = await import("../lib/run-arena-tests-node");
    const started = Date.now();
    const report = await runArenaTestsInNodeWorker(
      "arena_3",
      "export function twoSum() { while (true) {} }"
    );
    expect(report.passed).toBe(false);
    expect(report.logs.join(" ")).toMatch(/timed out|infinite loop|Worker/i);
    expect(Date.now() - started).toBeLessThan(6000);
  }, 10000);
});
