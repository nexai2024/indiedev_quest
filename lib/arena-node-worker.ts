import { register } from "node:module";
import { parentPort, workerData } from "node:worker_threads";

register(new URL("./arena-ts-resolve.mjs", import.meta.url));

const { runArenaTests, timeoutReport } = await import("./arena-runner.ts");

const payload = workerData;

runArenaTests(payload.challengeId, payload.source)
  .then((report) => parentPort?.postMessage(report))
  .catch((error) => {
    parentPort?.postMessage(
      timeoutReport(error instanceof Error ? error.message : "Node worker failed to run tests.")
    );
  });
