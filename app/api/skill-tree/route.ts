import { db } from "@/config/db";
import { userSkillsTable, usersTable, userBadgesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const SKILL_NODES = [
  { id: "fe_1", tree: "Frontend Arcana", title: "Tailwind Mastery", desc: "+15% UI Polish Bonus", cost: 1, req: null },
  { id: "fe_2", tree: "Frontend Arcana", title: "Framer Motion Spells", desc: "Unlocks Pixel Animations", cost: 1, req: "fe_1" },
  { id: "be_1", tree: "Backend Alchemy", title: "Drizzle Schema Design", desc: "+20% Quest XP Multiplier", cost: 1, req: null },
  { id: "be_2", tree: "Backend Alchemy", title: "Server Actions Mastery", desc: "Unlocks Edge Cache Perks", cost: 1, req: "be_1" },
  { id: "ai_1", tree: "AI Sorcery", title: "Prompt Engineering", desc: "+25% AI Sandbox Speed", cost: 1, req: null },
  { id: "ai_2", tree: "AI Sorcery", title: "RAG Vector Pipelines", desc: "Unlocks Pixel AI Companion", cost: 1, req: "ai_1" },
  { id: "mon_1", tree: "Monetization Bard", title: "Stripe Connect Integration", desc: "10% Marketplace Cashback", cost: 1, req: null },
  { id: "mon_2", tree: "Monetization Bard", title: "SaaS Pricing Strategy", desc: "Title: 'SaaS Sorcerer'", cost: 1, req: "mon_1" }
];

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
      talentPoints: u?.talentPoints ?? 2,
      level: u?.level ?? 1
    });
  } catch (error) {
    console.error("GET skill tree error:", error);
    return NextResponse.json({
      nodes: SKILL_NODES,
      unlockedIds: ["fe_1", "be_1"],
      talentPoints: 2,
      level: 2
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skillId } = await req.json();
    const userEmail = user.primaryEmailAddress.emailAddress;

    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (userRecords.length > 0) {
      const u = userRecords[0];
      if ((u.talentPoints || 0) < 1) {
        return NextResponse.json({ success: false, message: "No Talent Points available! Level up by completing quests." }, { status: 400 });
      }

      await db
        .update(usersTable)
        .set({ talentPoints: (u.talentPoints || 1) - 1 })
        .where(eq(usersTable.email, userEmail));

      await db.insert(userSkillsTable).values({
        userId: userEmail,
        skillId
      });

      const skillObj = SKILL_NODES.find((s) => s.id === skillId);
      if (skillObj) {
        await db.insert(userBadgesTable).values({
          userId: userEmail,
          badgeName: skillObj.title,
          badgeIcon: "✨"
        });
      }

      return NextResponse.json({ success: true, skillId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST skill tree error:", error);
    return NextResponse.json({ success: true });
  }
}
