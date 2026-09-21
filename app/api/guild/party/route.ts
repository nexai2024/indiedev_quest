import { db } from "@/config/db";
import { partiesTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecords = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail));
    const userObj = userRecords[0];
    const partyId = userObj?.partyId;

    if (!partyId) {
      return NextResponse.json({
        party: null,
        members: [],
        mentor: null,
      });
    }

    const parties = await db
      .select()
      .from(partiesTable)
      .where(eq(partiesTable.id, partyId));
    const party = parties[0] ?? null;

    const members = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        characterClass: usersTable.characterClass,
        level: usersTable.level,
        role: usersTable.role,
        xp: usersTable.xp,
        gold: usersTable.gold,
      })
      .from(usersTable)
      .where(eq(usersTable.partyId, partyId));

    return NextResponse.json({
      party,
      members,
      mentor: party?.mentorName
        ? {
            name: party.mentorName,
            title: "Guild Mentor",
            avatar: party.avatar,
            bio: null,
          }
        : null,
    });
  } catch (error) {
    console.error("Guild party GET error:", error);
    return NextResponse.json({
      party: null,
      members: [],
      mentor: null,
    });
  }
}
