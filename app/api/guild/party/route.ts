import { db } from "@/config/db";
import { partiesTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({
        id: 1,
        name: "The Code Alchemists",
        description: "A guild cohort of ambitious indie builders mastering full-stack arcana.",
        mentorName: "Guildmaster Sarah",
        mentorId: "mentor_sarah",
        avatar: "/hero.gif",
        createdAt: new Date(),
        members: []
      });
    }

    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    const userObj = userRecords[0];

    const partyId = userObj?.partyId || 1;
    const parties = await db.select().from(partiesTable).where(eq(partiesTable.id, partyId));

    let party = parties[0];
    if (!party) {
      party = {
        id: 1,
        name: "The Code Alchemists",
        description: "A guild cohort of ambitious indie builders mastering full-stack arcana.",
        mentorName: "Guildmaster Sarah",
        mentorId: "mentor_sarah",
        avatar: "/hero.gif",
        createdAt: new Date()
      };
    }

    // Cohort party members
    const members = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      characterClass: usersTable.characterClass,
      level: usersTable.level,
      role: usersTable.role,
      xp: usersTable.xp,
      gold: usersTable.gold
    }).from(usersTable);

    const partyMembers = members.length > 0 ? members : [
      { id: 1, name: "Sarah (Mentor)", email: "sarah@guild.quest", characterClass: "Full-Stack Artisan", level: 12, role: "MENTOR", xp: 5400, gold: 1200 },
      { id: 2, name: "David K.", email: "david@indiedev.quest", characterClass: "Frontend Specialist", level: 3, role: "BUILDER", xp: 450, gold: 300 },
      { id: 3, name: "Elena R.", email: "elena@indiedev.quest", characterClass: "AI Builder", level: 2, role: "BUILDER", xp: 280, gold: 200 },
      { id: 4, name: "You", email: userEmail, characterClass: userObj?.characterClass || "Full-Stack Artisan", level: userObj?.level || 1, role: "BUILDER", xp: userObj?.xp || 100, gold: userObj?.gold || 150 }
    ];

    return NextResponse.json({
      party,
      members: partyMembers,
      mentor: {
        name: party.mentorName || "Guildmaster Sarah",
        title: "Senior Full-Stack Mentor & SaaS Founder",
        avatar: "/hero.gif",
        bio: "Shipped 4 successful micro-SaaS products. Here to review code, unblock architecture, and accelerate your quest!"
      }
    });
  } catch (error) {
    console.error("Guild party GET error:", error);
    return NextResponse.json({
      party: {
        id: 1,
        name: "The Code Alchemists",
        description: "A guild cohort of ambitious indie builders mastering full-stack arcana.",
        mentorName: "Guildmaster Sarah",
        avatar: "/hero.gif"
      },
      members: [
        { id: 1, name: "Sarah (Mentor)", characterClass: "Full-Stack Artisan", level: 12, role: "MENTOR" },
        { id: 2, name: "David K.", characterClass: "Frontend Specialist", level: 3, role: "BUILDER" },
        { id: 3, name: "Elena R.", characterClass: "AI Builder", level: 2, role: "BUILDER" }
      ],
      mentor: {
        name: "Guildmaster Sarah",
        title: "Senior Full-Stack Mentor & SaaS Founder",
        avatar: "/hero.gif"
      }
    });
  }
}
