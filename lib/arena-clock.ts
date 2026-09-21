export type ArenaClock = {
  now: () => number;
  wait: (ms: number) => Promise<void>;
  untilSettled: <T>(promise: Promise<T>, maxMs: number) => Promise<T>;
};

type Timer = {
  id: number;
  due: number;
  fn: () => void;
};

export class FakeClock implements ArenaClock {
  nowMs = 0;
  private nextId = 1;
  private timers: Timer[] = [];

  now = () => this.nowMs;

  setTimeout = (fn: (...args: unknown[]) => void, ms = 0, ...args: unknown[]) => {
    const id = this.nextId++;
    this.timers.push({
      id,
      due: this.nowMs + Math.max(0, Number(ms) || 0),
      fn: () => fn(...args),
    });
    return id;
  };

  clearTimeout = (id?: number) => {
    if (id === undefined) return;
    this.timers = this.timers.filter((timer) => timer.id !== id);
  };

  hasTimers() {
    return this.timers.length > 0;
  }

  nextDue() {
    if (this.timers.length === 0) return undefined;
    this.timers.sort((left, right) => left.due - right.due || left.id - right.id);
    return this.timers[0]?.due;
  }

  advanceToNextTimer() {
    if (this.timers.length === 0) return false;
    this.timers.sort((left, right) => left.due - right.due || left.id - right.id);
    const next = this.timers.shift()!;
    this.nowMs = Math.max(this.nowMs, next.due);
    next.fn();
    return true;
  }

  async wait(ms: number) {
    const target = this.nowMs + Math.max(0, ms);
    while (this.nowMs < target) {
      const due = this.nextDue();
      if (due !== undefined && due <= target) {
        this.advanceToNextTimer();
        await Promise.resolve();
      } else {
        this.nowMs = target;
      }
    }
  }

  async untilSettled<T>(promise: Promise<T>, maxMs: number): Promise<T> {
    let done = false;
    void Promise.resolve(promise).finally(() => {
      done = true;
    });
    const target = this.nowMs + Math.max(0, maxMs);
    while (!done) {
      await Promise.resolve();
      if (done) break;
      const due = this.nextDue();
      if (due !== undefined && due <= target) {
        this.advanceToNextTimer();
      }
    }
    return promise;
  }
}

export async function pumpUntilSettled(
  work: () => void | Promise<void>,
  _clock: FakeClock,
  wallTimeoutMs: number
) {
  let settled = false;
  let failure: unknown;
  void Promise.resolve()
    .then(work)
    .then(() => {
      settled = true;
    })
    .catch((error) => {
      settled = true;
      failure = error;
    });

  const started = Date.now();
  while (!settled && Date.now() - started < wallTimeoutMs) {
    await Promise.resolve();
  }

  if (!settled) {
    throw new Error(`Test timed out after ${wallTimeoutMs}ms`);
  }
  if (failure) throw failure;
}
