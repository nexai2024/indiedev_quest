import { FakeClock, pumpUntilSettled } from "./arena-clock";
import { transform } from "sucrase";
import { testsForChallenge } from "./arena-tests";

export type ArenaTestResult = {
  name: string;
  passed: boolean;
  reason: string;
};

export type ArenaRunReport = {
  passed: boolean;
  results: ArenaTestResult[];
  logs: string[];
};

export const KATA_WALL_TIMEOUT_MS = 4000;
const TEST_TIMEOUT_MS = 800;

export function ensureExports(source: string): string {
  return source
    .replace(/(^|\n)(\s*)(?!export\s)class\s+/g, "$1$2export class ")
    .replace(/(^|\n)(\s*)(?!export\s)async\s+function\s+/g, "$1$2export async function ")
    .replace(/(^|\n)(\s*)(?!export\s)function\s+/g, "$1$2export function ");
}

export function transpileKata(source: string): string {
  const exported = ensureExports(source);
  return transform(exported, {
    transforms: ["typescript", "imports"],
    disableESTransforms: true,
  }).code;
}

function getBuffer(): unknown {
  if (typeof Buffer !== "undefined") return Buffer;
  return {
    from(data: string, enc?: string) {
      if (enc !== "base64") return { toString: () => String(data) };
      const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      const binary = typeof atob === "function" ? atob(padded) : "";
      return { toString: () => binary };
    },
  };
}

function fakeDate(clock: FakeClock) {
  const NativeDate = Date;
  const Wrapped = function DateCtor(this: Date, ...args: unknown[]) {
    if (!(this instanceof DateCtor)) {
      return NativeDate();
    }
    if (args.length === 0) {
      return new NativeDate(clock.now());
    }
    return new NativeDate(...(args as [number]));
  } as unknown as DateConstructor;
  Wrapped.now = () => clock.now();
  Wrapped.parse = NativeDate.parse;
  Wrapped.UTC = NativeDate.UTC;
  return Wrapped;
}

export function loadKataExports(js: string, clock: FakeClock): Record<string, unknown> {
  const module = { exports: {} as Record<string, unknown> };
  const fn = new Function(
    "module",
    "exports",
    "console",
    "Buffer",
    "setTimeout",
    "clearTimeout",
    "Date",
    "URLSearchParams",
    "URL",
    `${js}\nreturn module.exports;`
  );
  const exported = fn(
    module,
    module.exports,
    { log() {}, warn() {}, error() {} },
    getBuffer(),
    clock.setTimeout,
    clock.clearTimeout,
    fakeDate(clock),
    URLSearchParams,
    URL
  ) as Record<string, unknown>;
  return exported && typeof exported === "object" ? exported : module.exports;
}

export function timeoutReport(message: string): ArenaRunReport {
  return {
    passed: false,
    results: [],
    logs: [message],
  };
}

export function formatReport(results: ArenaTestResult[]): ArenaRunReport {
  const passed = results.length > 0 && results.every((result) => result.passed);
  const logs = results.map(
    (result) => `${result.name}: ${result.passed ? "PASSED ✓" : "FAILED ✕"} — ${result.reason}`
  );
  logs.push(passed ? "All tests passed." : "Some tests failed. Hint/AI review can coach, not grade.");
  return { passed, results, logs };
}

export async function runTestsAgainstExports(
  challengeId: string,
  api: Record<string, unknown>,
  clock = new FakeClock()
): Promise<ArenaRunReport> {
  const tests = testsForChallenge(challengeId);
  if (tests.length === 0) {
    return {
      passed: false,
      results: [],
      logs: [`No executable tests registered for ${challengeId}.`],
    };
  }

  const results: ArenaTestResult[] = [];
  for (const test of tests) {
    try {
      await pumpUntilSettled(() => test.run(api, clock), clock, TEST_TIMEOUT_MS);
      results.push({ name: test.name, passed: true, reason: "ok" });
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatReport(results);
}

export async function runArenaTests(challengeId: string, source: string): Promise<ArenaRunReport> {
  const clock = new FakeClock();
  let api: Record<string, unknown>;
  try {
    api = loadKataExports(transpileKata(source), clock);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      passed: false,
      results: [],
      logs: [`Compile/runtime error: ${reason}`],
    };
  }
  return runTestsAgainstExports(challengeId, api, clock);
}
