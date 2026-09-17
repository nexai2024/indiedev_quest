import { db } from "@/config/db";
import { usersTable, partiesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({
        id: 1,
        email: "demo@indiedev.quest",
        name: "Adventurer",
        username: "indiedev",
        role: "BUILDER",
        characterClass: "Full-Stack Artisan",
        primaryGoal: "Build First SaaS",
        level: 1,
        xp: 150,
        gold: 250,
        talentPoints: 2,
        partyId: 1
      });
    }

    const email = user.primaryEmailAddress.emailAddress;
    const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (existingUsers.length <= 0) {
      // Ensure default party exists
      let partyList = await db.select().from(partiesTable);
      let partyId = 1;
      if (partyList.length === 0) {
        const defaultParty = await db.insert(partiesTable).values({
          name: "The Code Alchemists",
          description: "A guild cohort of ambitious indie builders mastering full-stack arcana.",
          mentorName: "Guildmaster Sarah",
          mentorId: "mentor_sarah",
          avatar: "/hero.gif"
        }).returning();
        partyId = defaultParty[0].id;
      } else {
        partyId = partyList[0].id;
      }

      const newUser = {
        name: user.fullName || user.firstName || "Indie Hacker",
        email: email,
        username: user.username || email.split("@")[0],
        role: "NOVICE",
        characterClass: "Frontend Specialist",
        primaryGoal: "Build First SaaS",
        level: 1,
        xp: 100,
        gold: 150,
        talentPoints: 1,
        partyId: partyId,
        avatarUrl: user.imageUrl || "/public/badge.png"
      };

      const result = await db.insert(usersTable).values(newUser).returning();
      return NextResponse.json(result[0]);
    }

    return NextResponse.json(existingUsers[0]);
  } catch (error) {
    console.error("User POST route error:", error);
    return NextResponse.json({
      id: 1,
      email: "guest@indiedev.quest",
      name: "Guest Dev",
      username: "guest_dev",
      role: "BUILDER",
      characterClass: "Full-Stack Artisan",
      primaryGoal: "Build First SaaS",
      level: 2,
      xp: 250,
      gold: 300,
      talentPoints: 2,
      partyId: 1
    });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
