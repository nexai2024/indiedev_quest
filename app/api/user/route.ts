import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { ensureStarterQuest } from "@/lib/accept-quest";
import {
  clerkDisplayName,
  clerkEmail,
  clerkUsername,
  emptyUserProfile,
  hasCompletedOnboarding,
  withOnboardingFlag,
} from "@/lib/user-profile";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function attachStarterQuest<T extends { email?: string | null; characterClass?: string | null }>(row: T) {
  if (hasCompletedOnboarding(row) && row.email && row.characterClass) {
    try {
      await ensureStarterQuest(row.email, row.characterClass);
    } catch (error) {
      console.error("Failed to ensure starter quest:", error);
    }
  }
  return withOnboardingFlag({ ...row, persisted: true });
}

export async function POST() {
  const user = await currentUser();
  const email = user ? clerkEmail(user) : null;

  if (!user || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = emptyUserProfile(user, true);

  try {
    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingUsers.length === 0) {
      const result = await db
        .insert(usersTable)
        .values({
          name: identity.name,
          email,
          username: identity.username,
          role: "NOVICE",
          characterClass: "",
          primaryGoal: "",
          level: 1,
          xp: 0,
          gold: 0,
          talentPoints: 0,
          partyId: null,
          avatarUrl: identity.avatarUrl,
        })
        .returning();

      return NextResponse.json(await attachStarterQuest(result[0]!));
    }

    const existing = existingUsers[0];
    const nextName = clerkDisplayName(user);
    const nextUsername = clerkUsername(user);
    const nextAvatar = user.imageUrl || existing.avatarUrl;

    if (
      existing.name !== nextName ||
      existing.username !== nextUsername ||
      existing.avatarUrl !== nextAvatar
    ) {
      const updated = await db
        .update(usersTable)
        .set({
          name: nextName,
          username: nextUsername,
          avatarUrl: nextAvatar,
        })
        .where(eq(usersTable.email, email))
        .returning();

      return NextResponse.json(await attachStarterQuest(updated[0]!));
    }

    return NextResponse.json(await attachStarterQuest(existing));
  } catch (error) {
    console.error("User POST route error:", error);
    return NextResponse.json(emptyUserProfile(user, false));
  }
}

export async function GET() {
  return POST();
}
