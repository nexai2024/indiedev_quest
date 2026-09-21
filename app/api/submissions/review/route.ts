import { db } from "@/config/db";
import { submissionsTable, userQuestsTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { completeUserQuest } from "@/lib/complete-quest";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, isApproved, reviewNotes } = await req.json();
    if (!submissionId || typeof isApproved !== "boolean") {
      return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
    }

    const subList = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.id, submissionId));

    if (subList.length === 0) {
      return NextResponse.json({ success: false, message: "Submission not found" }, { status: 404 });
    }

    const sub = subList[0];
    await db
      .update(submissionsTable)
      .set({
        isApproved,
        validationStatus: isApproved ? "PASSED" : "FAILED",
        reviewNotes: reviewNotes || (isApproved ? "Approved by Guild Peer/Mentor after AI report." : "Revision requested."),
      })
      .where(eq(submissionsTable.id, submissionId));

    if (isApproved && sub.questId) {
      await completeUserQuest({
        userEmail: sub.userId,
        questId: sub.questId,
      });
    } else if (!isApproved && sub.questId) {
      await db
        .update(userQuestsTable)
        .set({ status: "IN_PROGRESS" })
        .where(and(eq(userQuestsTable.userId, sub.userId), eq(userQuestsTable.questId, sub.questId)));
    }

    return NextResponse.json({ success: true, isApproved });
  } catch (error) {
    console.error("Submission review POST error:", error);
    return NextResponse.json({ success: false, message: "Review submission failed" }, { status: 500 });
  }
}
