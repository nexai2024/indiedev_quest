import path from "node:path";
import { pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import type { ArenaRunReport } from "./arena-runner";
import { KATA_WALL_TIMEOUT_MS, runArenaTests, timeoutReport } from "./arena-runner";

function workerPath() {
  return path.join(process.cwd(), "lib/arena-node-worker.ts");
}

export function runArenaTestsInNodeWorker(challengeId: string, source: string): Promise<ArenaRunReport> {
  return new Promise((resolve) => {
    let settled = false;
    let worker: Worker;
    try {
      worker = new Worker(pathToFileURL(workerPath()), {
        workerData: { challengeId, source },
      });
    } catch (error) {
      void runArenaTests(challengeId, source).then(resolve, (failed) => {
        resolve(timeoutReport(failed instanceof Error ? failed.message : "Failed to start kata worker."));
      });
      return;
    }

    const finish = (report: ArenaRunReport) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(report);
    };

    const timer = setTimeout(() => {
      finish(timeoutReport("Kata timed out in the worker. Check for an infinite loop."));
    }, KATA_WALL_TIMEOUT_MS);

    worker.on("message", (report: ArenaRunReport) => {
      finish(report);
    });
    worker.on("error", (error) => {
      finish(timeoutReport(error.message || "Worker crashed while running tests."));
    });
    worker.on("exit", (code) => {
      if (!settled && code !== 0) {
        finish(timeoutReport(`Worker exited with code ${code}.`));
      }
    });
  });
}
