import { db } from "@/config/db";
import { userSkillsTable, usersTable, userBadgesTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { SKILL_NODES } from "@/lib/content/skill-nodes";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    const userRecords = userEmail ? await db.select().from(usersTable).where(eq(usersTable.email, userEmail)) : [];
    const u = userRecords[0];

    const unlocked = userEmail ? await db.select().from(userSkillsTable).where(eq(userSkillsTable.userId, userEmail)) : [];
    const unlockedIds = unlocked.map((s) => s.skillId);

    return NextResponse.json({
      nodes: SKILL_NODES,
      unlockedIds,
      talentPoints: u?.talentPoints ?? 0,
      level: u?.level ?? 1
    });
  } catch (error) {
    console.error("GET skill tree error:", error);
    return NextResponse.json({
      nodes: SKILL_NODES,
      unlockedIds: [],
      talentPoints: 0,
      level: 1
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

    const { skillId } = await req.json();
    const userEmail = user.primaryEmailAddress.emailAddress;
    const skillObj = SKILL_NODES.find((s) => s.id === skillId);
    if (!skillObj) {
      return NextResponse.json({ success: false, message: "Unknown skill node." }, { status: 400 });
    }

    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (userRecords.length > 0) {
      const u = userRecords[0];
      if ((u.talentPoints || 0) < skillObj.cost) {
        return NextResponse.json({ success: false, message: "No Talent Points available! Level up by completing quests." }, { status: 400 });
      }

      await db
        .update(usersTable)
        .set({ talentPoints: (u.talentPoints || 0) - skillObj.cost })
        .where(eq(usersTable.email, userEmail));

      await db.insert(userSkillsTable).values({
        userId: userEmail,
        skillId
      });

      await db.insert(userBadgesTable).values({
        userId: userEmail,
        badgeName: skillObj.title,
        badgeIcon: "✨"
      });

      return NextResponse.json({ success: true, skillId });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("POST skill tree error:", error);
    return NextResponse.json({ error: "Failed to unlock skill" }, { status: 500 });
  }
}
