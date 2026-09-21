export const ARENA_HINTS: Record<string, string[]> = {
  arena_1: [
    "On get(), delete then re-insert so Map insertion order tracks recency.",
    "Evict with cache.keys().next().value — the oldest inserted key is LRU.",
    "put() must refresh an existing key before checking capacity.",
  ],
  arena_2: [
    "Dot product and both L2 norms share a single loop.",
    "Return 0 if either vector is all zeros to avoid divide-by-zero.",
    "Identical vectors should land at 1 after the square roots.",
  ],
  arena_3: [
    "Store value → index in a Map as you walk the array.",
    "Look up target - nums[i] before inserting the current value.",
    "Return the stored index and i as soon as the complement exists.",
  ],
  arena_4: [
    "Two strings are anagrams if their sorted character arrays match.",
    "A 26-slot count array works if you only have lowercase letters.",
    "Early-return false when lengths differ.",
  ],
  arena_5: [
    "Keep one timer; clear it on every call before scheduling again.",
    "The returned function should close over timer and wait.",
    "Use setTimeout, not a busy loop.",
  ],
  arena_6: [
    "Recurse only when both values are plain objects.",
    "Arrays and dates should overwrite, not merge by index.",
    "Never mutate the source objects — clone as you go.",
  ],
  arena_7: [
    "new URL() parses protocol, host, pathname, and search.",
    "URLSearchParams is the reliable query parser.",
    "Guard against invalid strings with try/catch.",
  ],
  arena_8: [
    "Lowercase, strip non-alphanumerics, then collapse whitespace to '-'.",
    "Trim leading/trailing hyphens after the replace chain.",
    "Multiple spaces should become a single hyphen.",
  ],
  arena_9: [
    "Keep lo/hi inclusive and mid = lo + ((hi - lo) >> 1).",
    "If nums[mid] < target, search the right half.",
    "Return -1 when lo passes hi.",
  ],
  arena_10: [
    "Sort by start time, then extend the last merged interval.",
    "Push a new interval only when current.start > last.end.",
    "Mutate the last item in the result array, not the input.",
  ],
  arena_11: [
    "A min-heap of size k, or a frequency map plus sort, both work.",
    "Count first, then pick the k keys with the highest counts.",
    "Ties can be broken by any stable order.",
  ],
  arena_12: [
    "Push opening brackets; pop only when the closer matches.",
    "A Map of closer → opener keeps the check tiny.",
    "The stack must be empty at the end.",
  ],
  arena_13: [
    "Each node holds children: Map<char, Node> and a boolean end.",
    "insert walks/creates nodes; search requires end === true.",
    "startsWith is the same walk without needing end.",
  ],
  arena_14: [
    "Store timestamps per key and drop ones older than the window.",
    "Allow the request when the remaining count is under the limit.",
    "Use a sliding window, not a fixed bucket reset, for fairness.",
  ],
  arena_15: [
    "If the key is already in the processed set, return the stored result.",
    "Write the key before awaiting work so parallel calls collide safely.",
    "A Map<string, result> is enough for a single-process lock.",
  ],
  arena_16: [
    "Cursor should be an opaque encoded id, not a page number.",
    "Query WHERE id > cursor ORDER BY id LIMIT n.",
    "hasMore is true when you fetched limit + 1 rows.",
  ],
  arena_17: [
    "Split the token on '.' and base64url-decode the payload.",
    "Never trust exp/sub without a signature check in production.",
    "JSON.parse the payload after decoding bytes to utf-8.",
  ],
  arena_18: [
    "Never concatenate user strings into SQL.",
    "Parameterized queries: db.execute(sql`... ${value}`).",
    "Reject quotes, comments, and UNION in any leftover sanitizer.",
  ],
  arena_19: [
    "Retry only on 429/5xx with exponential backoff + jitter.",
    "Cap attempts; do not retry 400-level client errors.",
    "AbortSignal lets you stop the loop from outside.",
  ],
  arena_20: [
    "Append events; never update the past.",
    "Fold events into state with a pure reducer.",
    "The stream is the source of truth, the snapshot is a cache.",
  ],
  arena_21: [
    "Replace {{variable}} tokens from a params object.",
    "Leave unknown tokens in place or throw — pick one and test it.",
    "Escape injected values if the prompt hits a privileged tool.",
  ],
  arena_22: [
    "Split on a max token/char budget, overlapping the edges.",
    "Prefer paragraph boundaries over mid-sentence cuts.",
    "Return { text, index } so retrieval can cite the chunk.",
  ],
  arena_23: [
    "Estimate tokens as ceil(chars / 4) if you lack a tokenizer.",
    "Drop oldest messages until the budget fits.",
    "Always keep the system prompt.",
  ],
  arena_24: [
    "Walk the schema types: object, array, string, number, boolean.",
    "required[] must all be present on objects.",
    "Return the first path that fails, not a generic false.",
  ],
  arena_25: [
    "Match the user intent to a tool name, then map args.",
    "Unknown intents should return a fallback tool or null.",
    "Validate args against the tool's parameter schema.",
  ],
  arena_26: [
    "IDs beat classes beat elements; inline wins unless !important.",
    "Equal specificity: the later rule in the stylesheet wins.",
    "Count (inline, ids, classes, tags) as a 4-tuple.",
  ],
  arena_27: [
    "Sift-down after pop; sift-up after push.",
    "Parent is Math.floor((i - 1) / 2); children are 2i+1 and 2i+2.",
    "Min-heap: parent <= both children after every mutation.",
  ],
};
