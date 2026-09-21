import { db } from "@/config/db";
import { bossRaidsTable, raidContributionsTable, usersTable, userBadgesTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { RAID_ATTACKS, RAID_BOSSES, raidDamage, type RaidAttackType } from "@/lib/content/raid-bosses";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function isAttackType(value: unknown): value is RaidAttackType {
  return value === "SPELL" || value === "CRITICAL" || value === "DEBUG" || value === "ULTIMATE";
}

function mergeRaid(
  row: typeof bossRaidsTable.$inferSelect,
) {
  const meta = RAID_BOSSES.find((boss) => boss.bossName === row.bossName);
  return {
    ...row,
    slug: meta?.slug ?? `raid-${row.id}`,
    level: meta?.level ?? 1,
    weakness: meta?.weakness ?? "Clean code",
    phases: meta?.phases ?? ["Engage", "Break armor", "Finish"],
    attackHints: meta?.attackHints ?? {
      SPELL: "Cast a class spell",
      DEBUG: "Reproduce then patch",
      CRITICAL: "Refactor the hot path",
      ULTIMATE: "Ship the fix",
    },
  };
}

export async function GET() {
  try {
    let stored = await db.select().from(bossRaidsTable);
    const names = new Set(stored.map((raid) => raid.bossName));

    for (const boss of RAID_BOSSES) {
      if (!names.has(boss.bossName)) {
        const inserted = await db
          .insert(bossRaidsTable)
          .values({
            bossName: boss.bossName,
            description: boss.description,
            maxHp: boss.maxHp,
            currentHp: boss.maxHp,
            goldReward: boss.goldReward,
            xpReward: boss.xpReward,
            status: "ACTIVE",
          })
          .returning();
        stored = [...stored, ...inserted];
      }
    }

    const contributions = await db
      .select()
      .from(raidContributionsTable)
      .orderBy(desc(raidContributionsTable.createdAt));

    return NextResponse.json({
      raids: stored.map(mergeRaid),
      contributions,
      attacks: RAID_ATTACKS,
    });
  } catch (error) {
    console.error("GET raids error:", error);
    return NextResponse.json({
      raids: RAID_BOSSES.map((boss, index) => ({
        id: index + 1,
        bossName: boss.bossName,
        description: boss.description,
        maxHp: boss.maxHp,
        currentHp: boss.maxHp,
        goldReward: boss.goldReward,
        xpReward: boss.xpReward,
        status: "ACTIVE",
        slug: boss.slug,
        level: boss.level,
        weakness: boss.weakness,
        phases: boss.phases,
        attackHints: boss.attackHints,
      })),
      contributions: [],
      attacks: RAID_ATTACKS,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const raidId = body.raidId;
    const proofUrl = body.proofUrl;
    const attackType: RaidAttackType = isAttackType(body.attackType) ? body.attackType : "SPELL";
    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Builder";

    const raids = await db.select().from(bossRaidsTable).where(eq(bossRaidsTable.id, raidId));
    if (raids.length === 0) {
      return NextResponse.json({ error: "Raid not found" }, { status: 404 });
    }

    const r = raids[0];
    const meta = RAID_BOSSES.find((boss) => boss.bossName === r.bossName);
    const weaknessBonus = Boolean(proofUrl) || attackType === "DEBUG";
    const damage = raidDamage(attackType, weaknessBonus);
    const newHp = Math.max(0, (r.currentHp || 1000) - damage);
    const isDefeated = newHp === 0;

    await db
      .update(bossRaidsTable)
      .set({
        currentHp: newHp,
        status: isDefeated ? "DEFEATED" : "ACTIVE",
      })
      .where(eq(bossRaidsTable.id, raidId));

    await db.insert(raidContributionsTable).values({
      raidId,
      userId: userEmail,
      userName,
      damage,
      proofUrl,
    });

    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (userRecords.length > 0) {
      const u = userRecords[0];
      await db
        .update(usersTable)
        .set({
          gold: (u.gold || 0) + (isDefeated ? 300 : 75),
          xp: (u.xp || 0) + (isDefeated ? 500 : 150),
        })
        .where(eq(usersTable.email, userEmail));
    }

    if (isDefeated) {
      await db.insert(userBadgesTable).values({
        userId: userEmail,
        badgeName: `${r.bossName} Slayer`,
        badgeIcon: "⚔️",
      });
    }

    return NextResponse.json({
      success: true,
      damage,
      newHp,
      isDefeated,
      attackType,
      hint: meta?.attackHints[attackType],
      message: isDefeated
        ? `VICTORY! ${r.bossName} has been slain!`
        : `${RAID_ATTACKS[attackType].label} hit for ${damage} DAMAGE!`,
    });
  } catch (error) {
    console.error("POST raids error:", error);
    return NextResponse.json({ error: "Failed to attack raid" }, { status: 500 });
  }
}
