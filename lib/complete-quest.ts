import { db } from "@/config/db";
import { userBadgesTable, userQuestsTable, usersTable } from "@/config/schema";
import { getQuestById } from "@/lib/content/quest-proof-spec";
import { applyGold, applyXp, loadTalentEffects } from "@/lib/talent";
import { and, eq } from "drizzle-orm";

export async function completeUserQuest(params: {
  userEmail: string;
  questId: string;
  xpReward?: number;
  goldReward?: number;
}) {
  const quest = getQuestById(params.questId);
  const effects = await loadTalentEffects(params.userEmail);
  const xpReward = applyXp(params.xpReward ?? quest?.xpReward ?? 100, effects);
  const goldReward = applyGold(params.goldReward ?? quest?.goldReward ?? 50, effects);

  const existing = await db
    .select()
    .from(userQuestsTable)
    .where(and(eq(userQuestsTable.userId, params.userEmail), eq(userQuestsTable.questId, params.questId)));

  if (existing.length > 0) {
    if (existing[0]!.status === "COMPLETED") {
      return { xpReward: 0, goldReward: 0 };
    }
    await db
      .update(userQuestsTable)
      .set({ status: "COMPLETED", completedAt: new Date() })
      .where(eq(userQuestsTable.id, existing[0]!.id));
  } else {
    await db.insert(userQuestsTable).values({
      userId: params.userEmail,
      questId: params.questId,
      status: "COMPLETED",
      completedAt: new Date(),
    });
  }

  const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, params.userEmail));
  if (userRecords.length > 0) {
    const u = userRecords[0]!;
    const newXp = (u.xp || 0) + xpReward;
    const newGold = (u.gold || 0) + goldReward;
    const newLevel = Math.floor(newXp / 300) + 1;
    const newTalentPoints = (u.talentPoints || 0) + (newLevel > (u.level || 1) ? 1 : 0);
    await db
      .update(usersTable)
      .set({
        xp: newXp,
        gold: newGold,
        level: newLevel,
        talentPoints: newTalentPoints,
      })
      .where(eq(usersTable.email, params.userEmail));
  }

  await db.insert(userBadgesTable).values({
    userId: params.userEmail,
    badgeName: "Proof Verified",
    badgeIcon: "🏆",
  });

  return { xpReward, goldReward };
}
