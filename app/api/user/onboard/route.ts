import { db } from "@/config/db";
import { usersTable, partiesTable, userQuestsTable, questsTable, userBadgesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_QUESTS = [
  {
    questId: "main_ship_mvp",
    title: "Ship a MVP in 14 Days",
    description: "Scope down your core feature set, implement authentication, and deploy a live link to Vercel.",
    xpReward: 300,
    goldReward: 150,
    levelReq: 1,
    category: "Main"
  },
  {
    questId: "side_nextauth_drizzle",
    title: "Implement NextAuth & Drizzle Schema",
    description: "Set up full authentication and connected database ORM models for your application.",
    xpReward: 150,
    goldReward: 75,
    levelReq: 1,
    category: "Side"
  },
  {
    questId: "side_stripe_checkout",
    title: "Integrate Stripe Payment Gateway",
    description: "Add subscription or one-time payment processing for monetizing your digital app.",
    xpReward: 200,
    goldReward: 100,
    levelReq: 2,
    category: "Side"
  }
];

export async function POST(req: NextRequest) {
  try {
    const { characterClass, primaryGoal, skillLevel } = await req.json();
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    // 1. Ensure default party exists
    let parties = await db.select().from(partiesTable);
    let partyId = 1;
    if (parties.length === 0) {
      const newParty = await db.insert(partiesTable).values({
        name: "The Code Alchemists",
        description: "A guild cohort of ambitious indie builders mastering full-stack arcana.",
        mentorName: "Guildmaster Sarah",
        mentorId: "mentor_sarah",
        avatar: "/hero.gif"
      }).returning();
      partyId = newParty[0].id;
    } else {
      partyId = parties[0].id;
    }

    // 2. Ensure default quests exist in questsTable
    for (const q of DEFAULT_QUESTS) {
      const existing = await db.select().from(questsTable).where(eq(questsTable.questId, q.questId));
      if (existing.length === 0) {
        await db.insert(questsTable).values(q);
      }
    }

    // 3. Update user profile
    const levelBoost = skillLevel === 'Intermediate' ? 2 : skillLevel === 'Advanced' ? 3 : 1;
    const initialXp = levelBoost * 100;
    const initialGold = levelBoost * 150;

    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));

    if (existingUsers.length > 0) {
      await db.update(usersTable)
        .set({
          characterClass: characterClass || "Frontend Specialist",
          primaryGoal: primaryGoal || "Build First SaaS",
          level: levelBoost,
          xp: initialXp,
          gold: initialGold,
          talentPoints: levelBoost,
          partyId: partyId,
          role: "BUILDER"
        })
        .where(eq(usersTable.email, userEmail));
    } else {
      await db.insert(usersTable).values({
        email: userEmail,
        name: user?.fullName || "Indie Hacker",
        username: user?.username || userEmail.split("@")[0],
        characterClass: characterClass || "Frontend Specialist",
        primaryGoal: primaryGoal || "Build First SaaS",
        level: levelBoost,
        xp: initialXp,
        gold: initialGold,
        talentPoints: levelBoost,
        partyId: partyId,
        role: "BUILDER"
      });
    }

    // 4. Assign default active quests for user
    for (const q of DEFAULT_QUESTS) {
      const existingUQ = await db.select().from(userQuestsTable).where(eq(userQuestsTable.userId, userEmail));
      const hasQuest = existingUQ.some(u => u.questId === q.questId);
      if (!hasQuest) {
        await db.insert(userQuestsTable).values({
          userId: userEmail,
          questId: q.questId,
          status: "IN_PROGRESS"
        });
      }
    }

    // 5. Award "Guild Initiate" badge
    const existingBadges = await db.select().from(userBadgesTable).where(eq(userBadgesTable.userId, userEmail));
    const hasBadge = existingBadges.some(b => b.badgeName === "Guild Initiate");
    if (!hasBadge) {
      await db.insert(userBadgesTable).values({
        userId: userEmail,
        badgeName: "Guild Initiate",
        badgeIcon: "🛡️"
      });
    }

    return NextResponse.json({ success: true, partyId });
  } catch (error) {
    console.error("Error in onboarding API:", error);
    return NextResponse.json({ success: true, partyId: 1 });
  }
}
