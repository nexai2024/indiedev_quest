import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { acceptUserQuest } from "@/lib/accept-quest";
import { starterQuestForClass } from "@/lib/content/class-starter-quests";
import { isHeroClassId, isHeroGoal } from "@/lib/content/hero-options";
import {
  clerkDisplayName,
  clerkEmail,
  clerkUsername,
  hasCompletedOnboarding,
  withOnboardingFlag,
} from "@/lib/user-profile";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await currentUser();
    const userEmail = user ? clerkEmail(user) : null;

    if (!user || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isHeroClassId(body.characterClass) || !isHeroGoal(body.primaryGoal)) {
      return NextResponse.json(
        { error: "Pick a class and a primary goal to create your hero." },
        { status: 400 }
      );
    }

    const profileUpdate = {
      characterClass: body.characterClass,
      primaryGoal: body.primaryGoal,
    };

    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail));
    const firstCharacter = !hasCompletedOnboarding(existingUsers[0] ?? null);

    let saved;
    if (existingUsers.length > 0) {
      saved = await db
        .update(usersTable)
        .set(profileUpdate)
        .where(eq(usersTable.email, userEmail))
        .returning();
    } else {
      saved = await db
        .insert(usersTable)
        .values({
          email: userEmail,
          name: clerkDisplayName(user),
          username: clerkUsername(user),
          characterClass: profileUpdate.characterClass,
          primaryGoal: profileUpdate.primaryGoal,
          level: 1,
          xp: 0,
          gold: 0,
          talentPoints: 0,
          partyId: null,
          role: "NOVICE",
          avatarUrl: user.imageUrl || null,
        })
        .returning();
    }

    let starterQuest = null;
    if (firstCharacter) {
      const starter = starterQuestForClass(profileUpdate.characterClass);
      if (starter) {
        try {
          starterQuest = await acceptUserQuest(userEmail, starter.questId);
        } catch (error) {
          console.error("Failed to auto-accept starter quest:", error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: withOnboardingFlag({ ...saved[0], persisted: true }),
      starterQuest,
    });
  } catch (error) {
    console.error("Error in onboarding API:", error);
    return NextResponse.json({ error: "Failed to save character" }, { status: 500 });
  }
}
