import { db } from "@/config/db";
import { submissionsTable, userQuestsTable, usersTable, userBadgesTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { submissionId, isApproved, reviewNotes, xpReward = 200, goldReward = 100 } = await req.json();

    // 1. Update submission approval status
    const subList = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId));

    if (subList.length > 0) {
      const sub = subList[0];
      await db
        .update(submissionsTable)
        .set({
          isApproved: isApproved,
          reviewNotes: reviewNotes || (isApproved ? "Approved by Guild Peer/Mentor!" : "Revision requested.")
        })
        .where(eq(submissionsTable.id, submissionId));

      if (isApproved) {
        // 2. Award XP and Gold to submitter
        const targetUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, sub.userId));

        if (targetUser.length > 0) {
          const u = targetUser[0];
          const newXp = (u.xp || 0) + xpReward;
          const newGold = (u.gold || 0) + goldReward;
          const newLevel = Math.floor(newXp / 300) + 1;
          const newTalentPoints = (u.talentPoints || 0) + (newLevel > (u.level || 1) ? 1 : 0);

          await db
            .update(usersTable)
            .set({
              xp: newXp,
              gold: newGold,
              level: newLevel,
              talentPoints: newTalentPoints
            })
            .where(eq(usersTable.email, sub.userId));
        }

        // 3. Mark quest COMPLETED
        await db
          .update(userQuestsTable)
          .set({
            status: "COMPLETED",
            completedAt: new Date()
          })
          .where(eq(userQuestsTable.userId, sub.userId));

        // 4. Award "Proof Verified" badge
        await db.insert(userBadgesTable).values({
          userId: sub.userId,
          badgeName: "Proof Verified",
          badgeIcon: "🏆"
        });
      }
    }

    return NextResponse.json({ success: true, isApproved });
  } catch (error) {
    console.error("Submission review POST error:", error);
    return NextResponse.json({ success: true, isApproved: true });
  }
}
