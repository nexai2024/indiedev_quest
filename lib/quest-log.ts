export type QuestLogStatus = "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED";

export type QuestLogEntry = {
  questId: string;
  status: QuestLogStatus;
};

const STORAGE_KEY = "indiedev-quest-log";

export function readQuestLog(): QuestLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is QuestLogEntry => {
      if (!entry || typeof entry !== "object") return false;
      const questId = (entry as QuestLogEntry).questId;
      const status = (entry as QuestLogEntry).status;
      return (
        typeof questId === "string" &&
        (status === "IN_PROGRESS" || status === "UNDER_REVIEW" || status === "COMPLETED")
      );
    });
  } catch {
    return [];
  }
}

export function upsertQuestLog(questId: string, status: QuestLogStatus): QuestLogEntry[] {
  const next = readQuestLog().filter((entry) => entry.questId !== questId);
  next.push({ questId, status });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

const STATUS_RANK: Record<string, number> = {
  AVAILABLE: 0,
  IN_PROGRESS: 1,
  UNDER_REVIEW: 2,
  COMPLETED: 3,
};

export function applyQuestLog<T extends { questId: string; userStatus: string }>(quests: T[]): T[] {
  const log = new Map(readQuestLog().map((entry) => [entry.questId, entry.status]));
  return quests.map((quest) => {
    const local = log.get(quest.questId);
    if (!local) return quest;
    if ((STATUS_RANK[quest.userStatus] ?? 0) >= (STATUS_RANK[local] ?? 0)) return quest;
    return { ...quest, userStatus: local };
  });
}
