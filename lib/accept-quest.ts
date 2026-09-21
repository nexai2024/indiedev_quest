import { db } from "@/config/db";
import { questsTable, userQuestsTable } from "@/config/schema";
import { starterQuestForClass } from "@/lib/content/class-starter-quests";
import { QUEST_CATALOG } from "@/lib/content/quest-catalog";
import { and, eq } from "drizzle-orm";

const ACTIVE_STATUSES = new Set(["IN_PROGRESS", "UNDER_REVIEW", "COMPLETED"]);

export async function acceptUserQuest(userEmail: string, questId: string) {
  const quest = QUEST_CATALOG.find((entry) => entry.questId === questId);
  if (!quest) return null;

  const catalogRows = await db.select().from(questsTable).where(eq(questsTable.questId, questId)).limit(1);
  if (catalogRows.length === 0) {
    await db.insert(questsTable).values(quest);
  }

  const existing = await db
    .select()
    .from(userQuestsTable)
    .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, questId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userQuestsTable).values({
      userId: userEmail,
      questId,
      status: "IN_PROGRESS",
    });
    return quest;
  }

  const current = existing[0]?.status ?? "AVAILABLE";
  if (!ACTIVE_STATUSES.has(current)) {
    await db
      .update(userQuestsTable)
      .set({ status: "IN_PROGRESS" })
      .where(eq(userQuestsTable.id, existing[0]!.id));
  }

  return quest;
}

export async function ensureStarterQuest(userEmail: string, characterClass: string) {
  const starter = starterQuestForClass(characterClass);
  if (!starter) return null;

  const rows = await db.select().from(userQuestsTable).where(eq(userQuestsTable.userId, userEmail));
  if (rows.length > 0) return null;

  return acceptUserQuest(userEmail, starter.questId);
}
