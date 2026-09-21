import { db } from "@/config/db";
import { submissionsTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = req.headers.get("x-github-event") || "push";
    const githubSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers.get("x-hub-signature-256");

    if (!githubSecret) {
      return NextResponse.json({ error: "GitHub webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing GitHub signature header" }, { status: 401 });
    }

    const hmac = crypto.createHmac("sha256", githubSecret);
    const digest = "sha256=" + hmac.update(rawBody).digest("hex");

    const sigBuf = Buffer.from(signature);
    const digestBuf = Buffer.from(digest);

    if (sigBuf.length !== digestBuf.length || !crypto.timingSafeEqual(sigBuf, digestBuf)) {
      return NextResponse.json({ error: "Invalid GitHub webhook signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }

    const sender = payload.sender?.login || "github-builder";
    const repoUrl = payload.repository?.html_url || "https://github.com/indiedev-quest/app";

    // Support both push commits and pull_request actions
    let commitMsg = payload.head_commit?.message || payload.commits?.[0]?.message;
    if (event === "pull_request") {
      commitMsg = `PR #${payload.number}: ${payload.pull_request?.title || "Pull Request Submitted"}`;
    }

    const userEmail = payload.pusher?.email || payload.head_commit?.author?.email || payload.pull_request?.user?.email;

    if (!userEmail || !repoUrl) {
      return NextResponse.json({ error: "Missing user email or repo URL in webhook payload" }, { status: 400 });
    }

    // Auto-detect matching quest from commit message or PR title
    let targetQuestId = "main_ship_mvp";
    if (commitMsg && (commitMsg.toLowerCase().includes("auth") || commitMsg.toLowerCase().includes("drizzle"))) {
      targetQuestId = "side_nextauth_drizzle";
    } else if (commitMsg && (commitMsg.toLowerCase().includes("stripe") || commitMsg.toLowerCase().includes("pay"))) {
      targetQuestId = "side_stripe_checkout";
    }

    // 1. Create proof submission from GitHub Push or PR — do not auto-complete
    // counted quests. Run the same AI deliverable validator on the repo URL.
    const { validateQuestProof } = await import("@/lib/validate-quest");
    const report = await validateQuestProof({
      questId: targetQuestId,
      proofUrls: [repoUrl],
      notes: commitMsg || "",
    });

    const newSubmission = await db
      .insert(submissionsTable)
      .values({
        userId: userEmail,
        userName: sender,
        questId: targetQuestId,
        questTitle: `GitHub ${event === "pull_request" ? "PR" : "Push"} (${targetQuestId})`,
        proofUrl: repoUrl,
        proofUrls: [repoUrl],
        notes: `Automated GitHub Event [${event}]: "${commitMsg || "Code change"}"`,
        isApproved: report.allPassed,
        reviewNotes: report.summary,
        validationStatus: report.allPassed ? "PASSED" : "FAILED",
        validationReport: report,
      })
      .returning();

    if (report.allPassed) {
      const { completeUserQuest } = await import("@/lib/complete-quest");
      await completeUserQuest({ userEmail, questId: targetQuestId });
    }

    return NextResponse.json({
      success: true,
      event,
      questId: targetQuestId,
      validated: report.allPassed,
      validation: report,
      submission: newSubmission[0],
      message: report.allPassed
        ? `GitHub ${event} proof passed AI validation.`
        : `GitHub ${event} recorded; AI did not auto-complete this quest.`,
    });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process GitHub webhook" },
      { status: 500 }
    );
  }
}
