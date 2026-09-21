import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { clerkEmail, hasCompletedOnboarding, type ClerkIdentity } from "@/lib/user-profile";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function loadCharacter(user: ClerkIdentity) {
  const email = clerkEmail(user);
  if (!email) return null;
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function requireCharacter() {
  const user = await currentUser();
  if (!user) {
    return { ok: false as const, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await loadCharacter(user);
  if (!profile || !hasCompletedOnboarding(profile)) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: "Create your hero before entering the guild.", code: "ONBOARDING_REQUIRED" },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user, profile };
}
