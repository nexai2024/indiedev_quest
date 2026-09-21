import { db } from "@/config/db";
import { submissionsTable, userQuestsTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { completeUserQuest } from "@/lib/complete-quest";
import { getQuestProofSpec } from "@/lib/content/quest-proof-spec";
import { getGithubAccessToken } from "@/lib/github-oauth";
import { parseProofUrls, validateQuestProof } from "@/lib/validate-quest";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const submissions = await db
      .select()
      .from(submissionsTable)
      .orderBy(desc(submissionsTable.createdAt));

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET submissions error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const questId = typeof body.questId === "string" ? body.questId : "";
    const questTitle = typeof body.questTitle === "string" ? body.questTitle : "Quest Submission";
    const notesInput = typeof body.notes === "string" ? body.notes : "";
    const spec = getQuestProofSpec(questId);
    const urls = parseProofUrls(body.proofUrls ?? body.proofUrl, notesInput);

    if (!questId) {
      return NextResponse.json({ error: "questId is required" }, { status: 400 });
    }

    if (spec.kind === "code_kata") {
      return NextResponse.json(
        {
          error: `This quest is solved in the Code Lab, not by pasting URLs. Open /arena?quest=${questId}`,
          labUrl: `/arena?quest=${questId}`,
          proofSpec: spec,
        },
        { status: 400 }
      );
    }

    if (urls.length !== spec.count) {
      const report = await validateQuestProof({
        questId,
        proofUrls: urls,
        notes: notesInput,
      });
      const missing = report.missingHosts?.length ? ` Still needed: ${report.missingHosts.join(", ")}.` : "";
      return NextResponse.json(
        {
          error: `This quest requires ${spec.count} ${spec.itemLabel.toLowerCase()}${spec.count === 1 ? "" : "s"}.${missing}`,
          proofSpec: spec,
          submittedCount: urls.length,
          validation: report,
        },
        { status: 400 }
      );
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Builder";
    const github = await getGithubAccessToken(user.id);
    const report = await validateQuestProof({
      questId,
      proofUrls: urls,
      notes: notesInput,
      githubToken: github?.token,
    });

    const validationStatus = report.allPassed ? "PASSED" : "FAILED";

    const values = {
      userId: userEmail,
      userName,
      questId,
      questTitle: questTitle || spec.itemLabel,
      proofUrl: urls[0] || "",
      proofUrls: urls,
      notes: notesInput,
      isApproved: report.allPassed,
      reviewNotes: report.summary,
      validationStatus,
      validationReport: report,
    };

    let submission;
    try {
      const inserted = await db.insert(submissionsTable).values(values).returning();
      submission = inserted[0];
    } catch (error) {
      console.error("Submission insert with validation columns failed, retrying compact row:", error);
      const inserted = await db
        .insert(submissionsTable)
        .values({
          userId: userEmail,
          userName,
          questTitle,
          proofUrl: urls.join("\n").slice(0, 1990),
          notes: `${notesInput}\n\nPROOF_URLS:${JSON.stringify(urls)}\nVALIDATION:${JSON.stringify(report)}`,
          isApproved: report.allPassed,
          reviewNotes: report.summary,
        })
        .returning();
      submission = inserted[0];
    }

    let rewards: { xpReward: number; goldReward: number } | null = null;
    if (report.allPassed) {
      rewards = await completeUserQuest({ userEmail, questId });
    } else {
      await db
        .update(userQuestsTable)
        .set({ status: "IN_PROGRESS" })
        .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, questId)));
    }

    return NextResponse.json({
      success: report.allPassed,
      submission,
      validation: report,
      proofSpec: spec,
      rewards,
      message: report.allPassed
        ? `AI validated all ${spec.count} deliverables.`
        : report.summary,
    });
  } catch (error) {
    console.error("POST submission error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
