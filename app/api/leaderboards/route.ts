import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topXpUsers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        characterClass: usersTable.characterClass,
        level: usersTable.level,
        xp: usersTable.xp,
        gold: usersTable.gold
      })
      .from(usersTable)
      .orderBy(desc(usersTable.xp))
      .limit(10);

    return NextResponse.json({
      season: "Season 1: Dawn of the Indie Guild",
      endsInDays: 12,
      leaderboard: topXpUsers,
    });
  } catch (error) {
    console.error("GET leaderboards error:", error);
    return NextResponse.json({
      season: "Season 1: Dawn of the Indie Guild",
      endsInDays: 12,
      leaderboard: []
    });
  }
}
