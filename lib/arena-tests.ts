import { expect, getExport } from "./arena-expect";
import type { ArenaClock } from "./arena-clock";

export type ArenaUnitTest = {
  name: string;
  run: (api: Record<string, unknown>, clock: ArenaClock) => void | Promise<void>;
};

type Ctor<T> = new (...args: never[]) => T;

export const ARENA_UNIT_TESTS: Record<string, ArenaUnitTest[]> = {
  arena_1: [
    {
      name: "Store & get values",
      run: (api) => {
        const LRUCache = getExport<Ctor<{ get: (key: number) => number; put: (key: number, value: number) => void }>>(
          api,
          "LRUCache"
        );
        const cache = new LRUCache(2 as never);
        cache.put(1, 1);
        cache.put(2, 2);
        expect(cache.get(1)).toBe(1);
        expect(cache.get(2)).toBe(2);
      },
    },
    {
      name: "Evict least recently used",
      run: (api) => {
        const LRUCache = getExport<Ctor<{ get: (key: number) => number; put: (key: number, value: number) => void }>>(
          api,
          "LRUCache"
        );
        const cache = new LRUCache(2 as never);
        cache.put(1, 1);
        cache.put(2, 2);
        expect(cache.get(1)).toBe(1);
        cache.put(3, 3);
        expect(cache.get(2)).toBe(-1);
        expect(cache.get(3)).toBe(3);
      },
    },
  ],
  arena_2: [
    {
      name: "Orthogonal vectors = 0",
      run: (api) => {
        const cosineSimilarity = getExport<(a: number[], b: number[]) => number>(api, "cosineSimilarity");
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
      },
    },
    {
      name: "Identical vectors = 1",
      run: (api) => {
        const cosineSimilarity = getExport<(a: number[], b: number[]) => number>(api, "cosineSimilarity");
        expect(cosineSimilarity([2, 2], [2, 2])).toBeCloseTo(1);
      },
    },
  ],
  arena_3: [
    {
      name: "Finds a unique pair",
      run: (api) => {
        const twoSum = getExport<(nums: number[], target: number) => [number, number]>(api, "twoSum");
        expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
      },
    },
    {
      name: "Handles negatives",
      run: (api) => {
        const twoSum = getExport<(nums: number[], target: number) => [number, number]>(api, "twoSum");
        expect(twoSum([-3, 4, 3, 90], 0)).toEqual([0, 2]);
      },
    },
  ],
  arena_4: [
    {
      name: "Groups eat/tea/ate",
      run: (api) => {
        const groupAnagrams = getExport<(words: string[]) => string[][]>(api, "groupAnagrams");
        const groups = groupAnagrams(["eat", "tea", "tan", "ate"]).map((group) => [...group].sort());
        const eat = groups.find((group) => group.includes("eat"));
        expect(eat).toEqual(["ate", "eat", "tea"]);
      },
    },
    {
      name: "Keeps unique words alone",
      run: (api) => {
        const groupAnagrams = getExport<(words: string[]) => string[][]>(api, "groupAnagrams");
        const groups = groupAnagrams(["eat", "tea", "bat"]);
        const bat = groups.find((group) => group.includes("bat"));
        expect(bat).toEqual(["bat"]);
      },
    },
  ],
  arena_5: [
    {
      name: "Collapses rapid calls",
      run: async (api, clock) => {
        const debounce = getExport<(fn: (...args: unknown[]) => void, wait: number) => (...args: unknown[]) => void>(
          api,
          "debounce"
        );
        let count = 0;
        const fn = debounce(() => {
          count += 1;
        }, 25);
        fn();
        fn();
        fn();
        await clock.wait(8);
        expect(count).toBe(0);
      },
    },
    {
      name: "Fires after wait",
      run: async (api, clock) => {
        const debounce = getExport<(fn: (...args: unknown[]) => void, wait: number) => (...args: unknown[]) => void>(
          api,
          "debounce"
        );
        let count = 0;
        const fn = debounce(() => {
          count += 1;
        }, 20);
        fn();
        fn();
        await clock.wait(45);
        expect(count).toBe(1);
      },
    },
  ],
  arena_6: [
    {
      name: "Nested keys merge",
      run: (api) => {
        const deepMerge = getExport<
          (a: Record<string, unknown>, b: Record<string, unknown>) => Record<string, unknown>
        >(api, "deepMerge");
        const merged = deepMerge({ a: 1, nest: { x: 1, y: 1 } }, { nest: { y: 2, z: 3 } });
        expect(merged).toEqual({ a: 1, nest: { x: 1, y: 2, z: 3 } });
      },
    },
    {
      name: "Does not mutate inputs",
      run: (api) => {
        const deepMerge = getExport<
          (a: Record<string, unknown>, b: Record<string, unknown>) => Record<string, unknown>
        >(api, "deepMerge");
        const left = { nest: { x: 1 } };
        const right = { nest: { y: 2 } };
        deepMerge(left, right);
        expect(left).toEqual({ nest: { x: 1 } });
        expect(right).toEqual({ nest: { y: 2 } });
      },
    },
  ],
  arena_7: [
    {
      name: "Parses a=b&c=d",
      run: (api) => {
        const parseQuery = getExport<(search: string) => Record<string, string>>(api, "parseQuery");
        expect(parseQuery("a=b&c=d")).toEqual({ a: "b", c: "d" });
      },
    },
    {
      name: "Handles leading ?",
      run: (api) => {
        const parseQuery = getExport<(search: string) => Record<string, string>>(api, "parseQuery");
        expect(parseQuery("?q=arena")).toEqual({ q: "arena" });
      },
    },
  ],
  arena_8: [
    {
      name: "Hello World -> hello-world",
      run: (api) => {
        const slugify = getExport<(title: string) => string>(api, "slugify");
        expect(slugify("Hello World")).toBe("hello-world");
      },
    },
    {
      name: "Strips punctuation",
      run: (api) => {
        const slugify = getExport<(title: string) => string>(api, "slugify");
        expect(slugify("Hello, World!")).toBe("hello-world");
      },
    },
  ],
  arena_9: [
    {
      name: "Finds existing value",
      run: (api) => {
        const binarySearch = getExport<(nums: number[], target: number) => number>(api, "binarySearch");
        expect(binarySearch([1, 3, 5, 7], 5)).toBe(2);
      },
    },
    {
      name: "Returns -1 when missing",
      run: (api) => {
        const binarySearch = getExport<(nums: number[], target: number) => number>(api, "binarySearch");
        expect(binarySearch([1, 3, 5, 7], 2)).toBe(-1);
      },
    },
  ],
  arena_10: [
    {
      name: "Merges overlapping ranges",
      run: (api) => {
        const mergeIntervals = getExport<(intervals: number[][]) => number[][]>(api, "mergeIntervals");
        expect(mergeIntervals([[1, 3], [2, 6], [8, 10]])).toEqual([[1, 6], [8, 10]]);
      },
    },
    {
      name: "Keeps disjoint ranges",
      run: (api) => {
        const mergeIntervals = getExport<(intervals: number[][]) => number[][]>(api, "mergeIntervals");
        expect(mergeIntervals([[1, 2], [4, 5]])).toEqual([[1, 2], [4, 5]]);
      },
    },
  ],
  arena_11: [
    {
      name: "Returns k keys",
      run: (api) => {
        const topKFrequent = getExport<(nums: number[], k: number) => number[]>(api, "topKFrequent");
        const result = topKFrequent([1, 1, 1, 2, 2, 3], 2);
        expect(result.length).toBe(2);
        expect(result).toContain(1);
        expect(result).toContain(2);
      },
    },
    {
      name: "Breaks ties stably enough",
      run: (api) => {
        const topKFrequent = getExport<(nums: number[], k: number) => number[]>(api, "topKFrequent");
        const result = topKFrequent([4, 4, 5, 5, 6], 2);
        expect(result.length).toBe(2);
        expect(result.includes(6)).toBeFalsy();
      },
    },
  ],
  arena_12: [
    {
      name: "()[]{} is valid",
      run: (api) => {
        const isValid = getExport<(s: string) => boolean>(api, "isValid");
        expect(isValid("()[]{}")).toBe(true);
      },
    },
    {
      name: "(] is invalid",
      run: (api) => {
        const isValid = getExport<(s: string) => boolean>(api, "isValid");
        expect(isValid("(]")).toBe(false);
      },
    },
  ],
  arena_13: [
    {
      name: "Finds inserted words",
      run: (api) => {
        const Trie = getExport<Ctor<{ insert: (word: string) => void; search: (word: string) => boolean }>>(api, "Trie");
        const trie = new Trie();
        trie.insert("apple");
        expect(trie.search("apple")).toBe(true);
      },
    },
    {
      name: "Rejects prefixes that are not words",
      run: (api) => {
        const Trie = getExport<Ctor<{ insert: (word: string) => void; search: (word: string) => boolean }>>(api, "Trie");
        const trie = new Trie();
        trie.insert("apple");
        expect(trie.search("app")).toBe(false);
      },
    },
  ],
  arena_14: [
    {
      name: "Allows under the limit",
      run: (api) => {
        const RateLimiter = getExport<
          Ctor<{ allow: (key: string, now?: number) => boolean }>
        >(api, "RateLimiter");
        const limiter = new RateLimiter(2 as never, 1000 as never);
        expect(limiter.allow("ip", 0)).toBe(true);
        expect(limiter.allow("ip", 10)).toBe(true);
      },
    },
    {
      name: "Blocks over the limit",
      run: (api) => {
        const RateLimiter = getExport<
          Ctor<{ allow: (key: string, now?: number) => boolean }>
        >(api, "RateLimiter");
        const limiter = new RateLimiter(2 as never, 1000 as never);
        limiter.allow("ip", 0);
        limiter.allow("ip", 10);
        expect(limiter.allow("ip", 20)).toBe(false);
        expect(limiter.allow("ip", 2000)).toBe(true);
      },
    },
  ],
  arena_15: [
    {
      name: "Runs fn once per key",
      run: (api) => {
        const IdempotencyStore = getExport<Ctor<{ once: <T>(key: string, fn: () => T) => T }>>(api, "IdempotencyStore");
        const store = new IdempotencyStore();
        let calls = 0;
        store.once("charge", () => {
          calls += 1;
          return 42;
        });
        store.once("charge", () => {
          calls += 1;
          return 99;
        });
        expect(calls).toBe(1);
      },
    },
    {
      name: "Returns cached result",
      run: (api) => {
        const IdempotencyStore = getExport<Ctor<{ once: <T>(key: string, fn: () => T) => T }>>(api, "IdempotencyStore");
        const store = new IdempotencyStore();
        store.once("charge", () => 42);
        expect(store.once("charge", () => 99)).toBe(42);
      },
    },
  ],
  arena_16: [
    {
      name: "First page has no cursor",
      run: (api) => {
        const paginate = getExport<
          (
            items: Array<{ id: string }>,
            cursor: string | null,
            limit: number
          ) => { page: Array<{ id: string }>; nextCursor: string | null }
        >(api, "paginate");
        const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
        const first = paginate(items, null, 2);
        expect(first.page.map((item) => item.id)).toEqual(["a", "b"]);
        expect(first.nextCursor).toBe("b");
      },
    },
    {
      name: "Second page continues",
      run: (api) => {
        const paginate = getExport<
          (
            items: Array<{ id: string }>,
            cursor: string | null,
            limit: number
          ) => { page: Array<{ id: string }>; nextCursor: string | null }
        >(api, "paginate");
        const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
        const second = paginate(items, "b", 2);
        expect(second.page.map((item) => item.id)).toEqual(["c"]);
        expect(second.nextCursor).toBe("c");
      },
    },
  ],
  arena_17: [
    {
      name: "Reads sub claim",
      run: (api) => {
        const decodeJwtPayload = getExport<(token: string) => Record<string, unknown>>(api, "decodeJwtPayload");
        const payload = btoa(JSON.stringify({ sub: "hero" }))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/g, "");
        expect(decodeJwtPayload(`hdr.${payload}.sig`).sub).toBe("hero");
      },
    },
    {
      name: "Handles missing payload",
      run: (api) => {
        const decodeJwtPayload = getExport<(token: string) => Record<string, unknown>>(api, "decodeJwtPayload");
        expect(decodeJwtPayload("onlyonepart")).toEqual({});
      },
    },
  ],
  arena_18: [
    {
      name: "Uses a placeholder",
      run: (api) => {
        const buildUserQuery = getExport<(email: string) => { sql: string; params: unknown[] }>(api, "buildUserQuery");
        const query = buildUserQuery("a@b.com");
        expect(query.sql.includes("$1") || query.sql.includes("?")).toBe(true);
        expect(query.sql.toLowerCase().includes("a@b.com")).toBe(false);
      },
    },
    {
      name: "Passes email as param",
      run: (api) => {
        const buildUserQuery = getExport<(email: string) => { sql: string; params: unknown[] }>(api, "buildUserQuery");
        expect(buildUserQuery("a@b.com").params).toEqual(["a@b.com"]);
      },
    },
  ],
  arena_19: [
    {
      name: "Returns on first success",
      run: async (api) => {
        const withRetry = getExport<(fn: () => Promise<number>, attempts?: number) => Promise<number>>(api, "withRetry");
        let calls = 0;
        const value = await withRetry(async () => {
          calls += 1;
          return 7;
        }, 3);
        expect(value).toBe(7);
        expect(calls).toBe(1);
      },
    },
    {
      name: "Retries on failure",
      run: async (api, clock) => {
        const withRetry = getExport<(fn: () => Promise<number>, attempts?: number) => Promise<number>>(api, "withRetry");
        let calls = 0;
        const pending = withRetry(async () => {
          calls += 1;
          if (calls < 2) throw new Error("fail");
          return 9;
        }, 3);
        const value = await clock.untilSettled(pending, 80);
        expect(value).toBe(9);
        expect(calls).toBe(2);
      },
    },
  ],
  arena_20: [
    {
      name: "Deposits add",
      run: (api) => {
        const balance = getExport<(events: Array<{ type: "deposit" | "withdraw"; amount: number }>) => number>(
          api,
          "balance"
        );
        expect(balance([{ type: "deposit", amount: 10 }, { type: "deposit", amount: 5 }])).toBe(15);
      },
    },
    {
      name: "Withdrawals subtract",
      run: (api) => {
        const balance = getExport<(events: Array<{ type: "deposit" | "withdraw"; amount: number }>) => number>(
          api,
          "balance"
        );
        expect(balance([{ type: "deposit", amount: 10 }, { type: "withdraw", amount: 4 }])).toBe(6);
      },
    },
  ],
  arena_21: [
    {
      name: "Replaces known vars",
      run: (api) => {
        const renderPrompt = getExport<(template: string, vars: Record<string, string>) => string>(api, "renderPrompt");
        expect(renderPrompt("hi {{name}}", { name: "nex" })).toBe("hi nex");
      },
    },
    {
      name: "Unknown vars become empty",
      run: (api) => {
        const renderPrompt = getExport<(template: string, vars: Record<string, string>) => string>(api, "renderPrompt");
        expect(renderPrompt("hi {{name}}", {})).toBe("hi ");
      },
    },
  ],
  arena_22: [
    {
      name: "Respects size",
      run: (api) => {
        const chunkText = getExport<(text: string, size: number, overlap: number) => string[]>(api, "chunkText");
        const chunks = chunkText("abcdefghij", 4, 1);
        expect(chunks[0]).toBe("abcd");
        expect(chunks.every((chunk) => chunk.length <= 4)).toBe(true);
      },
    },
    {
      name: "Creates overlap",
      run: (api) => {
        const chunkText = getExport<(text: string, size: number, overlap: number) => string[]>(api, "chunkText");
        const chunks = chunkText("abcdefghij", 4, 1);
        expect(chunks.length).toBeGreaterThanOrEqual(2);
        expect(chunks[1]!.startsWith(chunks[0]!.slice(-1))).toBe(true);
      },
    },
  ],
  arena_23: [
    {
      name: "Keeps newest first",
      run: (api) => {
        const fitBudget = getExport<(messages: string[], maxTokens: number) => string[]>(api, "fitBudget");
        const fitted = fitBudget(["old-message-here", "new"], 2);
        expect(fitted[fitted.length - 1]).toBe("new");
      },
    },
    {
      name: "Stays under budget",
      run: (api) => {
        const fitBudget = getExport<(messages: string[], maxTokens: number) => string[]>(api, "fitBudget");
        const messages = ["aaaa", "bbbb", "cccc"];
        const fitted = fitBudget(messages, 2);
        const tokens = fitted.reduce((sum, message) => sum + Math.ceil(message.length / 4), 0);
        expect(tokens).toBeGreaterThanOrEqual(0);
        expect(tokens <= 2).toBe(true);
      },
    },
  ],
  arena_24: [
    {
      name: "Passes complete objects",
      run: (api) => {
        const validate = getExport<(obj: Record<string, unknown>, required: string[]) => boolean>(api, "validate");
        expect(validate({ name: "nex", role: "mage" }, ["name", "role"])).toBe(true);
      },
    },
    {
      name: "Fails missing fields",
      run: (api) => {
        const validate = getExport<(obj: Record<string, unknown>, required: string[]) => boolean>(api, "validate");
        expect(validate({ name: "nex" }, ["name", "role"])).toBe(false);
      },
    },
  ],
  arena_25: [
    {
      name: "Routes search intents",
      run: (api) => {
        const routeTool = getExport<(intent: string) => string>(api, "routeTool");
        expect(routeTool("find the docs")).toBe("search");
        expect(routeTool("schedule a meeting")).toBe("calendar");
        expect(routeTool("send email to Jane")).toBe("email");
      },
    },
    {
      name: "Returns none when unsure",
      run: (api) => {
        const routeTool = getExport<(intent: string) => string>(api, "routeTool");
        expect(routeTool("hello there")).toBe("none");
      },
    },
  ],
  arena_26: [
    {
      name: "#app .btn scores 110+",
      run: (api) => {
        const specificity = getExport<(selector: string) => number>(api, "specificity");
        expect(specificity("#app .btn")).toBeGreaterThanOrEqual(110);
      },
    },
    {
      name: "Plain tag is 1",
      run: (api) => {
        const specificity = getExport<(selector: string) => number>(api, "specificity");
        expect(specificity("div")).toBe(1);
      },
    },
  ],
  arena_27: [
    {
      name: "Pops smallest first",
      run: (api) => {
        const MinHeap = getExport<Ctor<{ push: (n: number) => void; pop: () => number | undefined }>>(api, "MinHeap");
        const heap = new MinHeap();
        heap.push(5);
        heap.push(1);
        heap.push(3);
        expect(heap.pop()).toBe(1);
        expect(heap.pop()).toBe(3);
        expect(heap.pop()).toBe(5);
      },
    },
    {
      name: "Handles empty pop",
      run: (api) => {
        const MinHeap = getExport<Ctor<{ push: (n: number) => void; pop: () => number | undefined }>>(api, "MinHeap");
        const heap = new MinHeap();
        expect(heap.pop()).toBeUndefined();
      },
    },
  ],
};

export function testsForChallenge(challengeId: string): ArenaUnitTest[] {
  return ARENA_UNIT_TESTS[challengeId] ?? [];
}

export function arenaTestFile(challengeId: string): string {
  const tests = testsForChallenge(challengeId);
  const lines = [
    "// These cases actually run against your exports when you hit RUN TESTS.",
    "// The editor copy is documentation — the runner uses the canonical suite.",
    'import { describe, expect, it } from "vitest";',
    'import * as kata from "./index";',
    "",
    `describe(${JSON.stringify(challengeId)}, () => {`,
    ...tests.flatMap((test) => [
      `  it(${JSON.stringify(test.name)}, async () => {`,
      "    // implemented in the IndieDev Quest runner",
      "    expect(typeof kata).toBe(\"object\");",
      "  });",
    ]),
    "});",
    "",
  ];
  return lines.join("\n");
}
