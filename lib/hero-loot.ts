import { db } from "@/config/db";
import { userBadgesTable, usersTable } from "@/config/schema";
import { and, eq } from "drizzle-orm";

export async function adjustGold(email: string, delta: number): Promise<{ ok: true; gold: number } | { ok: false; error: string }> {
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const hero = rows[0];
  if (!hero) return { ok: false, error: "Hero not found." };
  const next = (hero.gold || 0) + delta;
  if (next < 0) return { ok: false, error: "Insufficient Gold. Complete quests or refunds first." };
  await db.update(usersTable).set({ gold: next }).where(eq(usersTable.email, email));
  return { ok: true, gold: next };
}

export async function grantHeroLoot(email: string, xp: number, gold: number) {
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const hero = rows[0];
  if (!hero) return { xp: 0, gold: 0, level: 1 };

  const newXp = (hero.xp || 0) + xp;
  const newLevel = Math.floor(newXp / 300) + 1;
  const talentBump = newLevel > (hero.level || 1) ? 1 : 0;
  await db
    .update(usersTable)
    .set({
      xp: newXp,
      gold: (hero.gold || 0) + gold,
      level: newLevel,
      talentPoints: (hero.talentPoints || 0) + talentBump,
    })
    .where(eq(usersTable.email, email));

  return { xp, gold, level: newLevel };
}

export async function grantBadge(email: string, badgeName: string, badgeIcon: string) {
  const existing = await db
    .select({ id: userBadgesTable.id })
    .from(userBadgesTable)
    .where(and(eq(userBadgesTable.userId, email), eq(userBadgesTable.badgeName, badgeName)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(userBadgesTable).values({
    userId: email,
    badgeName,
    badgeIcon,
  });
}
