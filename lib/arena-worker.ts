/// <reference lib="webworker" />

import { runArenaTests, timeoutReport } from "./arena-runner";

export type ArenaWorkerRequest = {
  challengeId: string;
  source: string;
};

self.onmessage = async (event: MessageEvent<ArenaWorkerRequest>) => {
  try {
    const { challengeId, source } = event.data;
    const report = await runArenaTests(challengeId, source);
    self.postMessage(report);
  } catch (error) {
    self.postMessage(
      timeoutReport(error instanceof Error ? error.message : "Worker failed to run tests.")
    );
  }
};
