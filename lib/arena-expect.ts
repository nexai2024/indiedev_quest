export class ArenaAssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArenaAssertionError";
  }
}

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export type ArenaExpect = {
  toBe: (expected: unknown) => void;
  toEqual: (expected: unknown) => void;
  toBeCloseTo: (expected: number, digits?: number) => void;
  toBeTruthy: () => void;
  toBeFalsy: () => void;
  toBeUndefined: () => void;
  toContain: (item: unknown) => void;
  toBeGreaterThanOrEqual: (expected: number) => void;
};

export function expect(actual: unknown): ArenaExpect {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new ArenaAssertionError(`Expected ${serialize(actual)} to be ${serialize(expected)}`);
      }
    },
    toEqual(expected) {
      if (serialize(actual) !== serialize(expected)) {
        throw new ArenaAssertionError(`Expected ${serialize(actual)} to equal ${serialize(expected)}`);
      }
    },
    toBeCloseTo(expected, digits = 5) {
      if (typeof actual !== "number" || Number.isNaN(actual)) {
        throw new ArenaAssertionError(`Expected a number close to ${expected}, got ${serialize(actual)}`);
      }
      const factor = 10 ** digits;
      if (Math.round(actual * factor) !== Math.round(expected * factor)) {
        throw new ArenaAssertionError(`Expected ${actual} to be close to ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new ArenaAssertionError(`Expected ${serialize(actual)} to be truthy`);
    },
    toBeFalsy() {
      if (actual) throw new ArenaAssertionError(`Expected ${serialize(actual)} to be falsy`);
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new ArenaAssertionError(`Expected undefined, got ${serialize(actual)}`);
      }
    },
    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.some((entry) => serialize(entry) === serialize(item) || Object.is(entry, item))) {
          throw new ArenaAssertionError(`Expected ${serialize(actual)} to contain ${serialize(item)}`);
        }
        return;
      }
      if (typeof actual === "string" && typeof item === "string") {
        if (!actual.includes(item)) {
          throw new ArenaAssertionError(`Expected "${actual}" to contain "${item}"`);
        }
        return;
      }
      throw new ArenaAssertionError("toContain() needs an array or string");
    },
    toBeGreaterThanOrEqual(expected) {
      if (typeof actual !== "number" || actual < expected) {
        throw new ArenaAssertionError(`Expected ${serialize(actual)} >= ${expected}`);
      }
    },
  };
}

export function getExport<T>(api: Record<string, unknown>, name: string): T {
  const value = api[name];
  if (value === undefined) {
    throw new ArenaAssertionError(`Missing export \`${name}\`. Add \`export\` to your class or function.`);
  }
  return value as T;
}
