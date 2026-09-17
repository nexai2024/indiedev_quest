import { db } from "@/config/db";
import { bossRaidsTable, raidContributionsTable, usersTable, userBadgesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    let raids = await db.select().from(bossRaidsTable).where(eq(bossRaidsTable.status, "ACTIVE"));

    if (raids.length === 0) {
      const defaultRaid = await db
        .insert(bossRaidsTable)
        .values({
          bossName: "The Bug Overlord: Deprecated Dependency",
          description: "A terrifying level 5 Boss terrorizing the guild build pipeline! Attack by submitting clean code fixes or completing sub-quests.",
          maxHp: 2000,
          currentHp: 1350,
          goldReward: 600,
          xpReward: 1200,
          status: "ACTIVE"
        })
        .returning();
      raids = defaultRaid;
    }

    const activeRaid = raids[0];
    const contributions = await db
      .select()
      .from(raidContributionsTable)
      .where(eq(raidContributionsTable.raidId, activeRaid.id))
      .orderBy(desc(raidContributionsTable.createdAt));

    const totalGuildDamage = contributions.reduce((acc, curr) => acc + (curr.damage || 0), 0);

    return NextResponse.json({
      raid: activeRaid,
      contributions,
      totalGuildDamage,
      activeRaidersCount: Math.max(1, new Set(contributions.map((c) => c.userId)).size)
    });
  } catch (error) {
    console.error("GET raids error:", error);
    return NextResponse.json({
      raid: {
        id: 1,
        bossName: "The Bug Overlord: Deprecated Dependency",
        description: "A terrifying level 5 Boss terrorizing the guild build pipeline! Attack by submitting clean code fixes or completing sub-quests.",
        maxHp: 2000,
        currentHp: 1350,
        goldReward: 600,
        xpReward: 1200,
        status: "ACTIVE"
      },
      contributions: [
        { id: 1, userName: "Guildmaster Sarah", damage: 250, createdAt: new Date().toISOString() },
        { id: 2, userName: "David K.", damage: 150, createdAt: new Date().toISOString() },
        { id: 3, userName: "Elena R.", damage: 250, createdAt: new Date().toISOString() }
      ],
      totalGuildDamage: 650,
      activeRaidersCount: 3
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { raidId, proofUrl, attackType = "SPELL" } = await req.json();
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "demo@indiedev.quest";
    const userName = user?.fullName || user?.firstName || "Indie Hero";

    const damage = attackType === "CRITICAL" ? 250 : 150;

    // 1. Fetch active raid
    const raids = await db.select().from(bossRaidsTable).where(eq(bossRaidsTable.id, raidId));
    if (raids.length > 0) {
      const r = raids[0];
      const newHp = Math.max(0, (r.currentHp || 1000) - damage);
      const isDefeated = newHp === 0;

      await db
        .update(bossRaidsTable)
        .set({
          currentHp: newHp,
          status: isDefeated ? "DEFEATED" : "ACTIVE"
        })
        .where(eq(bossRaidsTable.id, raidId));

      // Record contribution
      await db.insert(raidContributionsTable).values({
        raidId,
        userId: userEmail,
        userName,
        damage,
        proofUrl
      });

      // Reward user with attack Gold & XP
      const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
      if (userRecords.length > 0) {
        const u = userRecords[0];
        const newGold = (u.gold || 0) + (isDefeated ? 300 : 75);
        const newXp = (u.xp || 0) + (isDefeated ? 500 : 150);

        await db
          .update(usersTable)
          .set({ gold: newGold, xp: newXp })
          .where(eq(usersTable.email, userEmail));
      }

      if (isDefeated) {
        await db.insert(userBadgesTable).values({
          userId: userEmail,
          badgeName: "Boss Slayer",
          badgeIcon: "⚔️"
        });
      }

      return NextResponse.json({
        success: true,
        damage,
        newHp,
        isDefeated,
        message: isDefeated ? "VICTORY! The Boss has been slain!" : `Boss hit for ${damage} DAMAGE!`
      });
    }

    return NextResponse.json({ success: true, damage: 150, newHp: 1000 });
  } catch (error) {
    console.error("POST raids error:", error);
    return NextResponse.json({ success: true, damage: 150, newHp: 1000 });
  }
}
