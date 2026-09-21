import type { ArenaRunReport } from "./arena-runner";
import { KATA_WALL_TIMEOUT_MS, timeoutReport } from "./arena-runner";

export async function runArenaTestsInWorker(challengeId: string, source: string): Promise<ArenaRunReport> {
  if (typeof Worker === "undefined") {
    const { runArenaTests } = await import("./arena-runner");
    return runArenaTests(challengeId, source);
  }

  return new Promise((resolve) => {
    let settled = false;
    const worker = new Worker(new URL("./arena-worker.ts", import.meta.url), { type: "module" });

    const finish = (report: ArenaRunReport) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(report);
    };

    const timer = setTimeout(() => {
      finish(timeoutReport("Kata timed out in the worker. Check for an infinite loop."));
    }, KATA_WALL_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<ArenaRunReport>) => {
      finish(event.data);
    };
    worker.onerror = (event) => {
      finish(timeoutReport(event.message || "Worker crashed while running tests."));
    };
    worker.postMessage({ challengeId, source });
  });
}
