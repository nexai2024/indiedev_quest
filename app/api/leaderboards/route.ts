import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    const leaders = topXpUsers.length > 0 ? topXpUsers : [
      { id: 1, name: "Guildmaster Sarah", characterClass: "Full-Stack Artisan", level: 12, xp: 5400, gold: 1200 },
      { id: 2, name: "David K.", characterClass: "Frontend Specialist", level: 5, xp: 1450, gold: 600 },
      { id: 3, name: "Elena R.", characterClass: "AI Builder", level: 4, xp: 1100, gold: 450 },
      { id: 4, name: "Marcus Sterling", characterClass: "Systems Engineer", level: 3, xp: 850, gold: 300 }
    ];

    return NextResponse.json({
      season: "Season 1: Dawn of the Indie Guild",
      endsInDays: 12,
      leaderboard: leaders
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
