import { db } from "@/config/db";
import { userQuestsTable, usersTable, submissionsTable, userBadgesTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
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

    const userEmail = payload.pusher?.email || payload.head_commit?.author?.email || payload.pull_request?.user?.email || "demo@indiedev.quest";

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

    // 1. Create proof submission automatically from GitHub Push or PR
    const newSubmission = await db
      .insert(submissionsTable)
      .values({
        userId: userEmail,
        userName: sender,
        questTitle: `GitHub ${event === 'pull_request' ? 'PR' : 'Push'} Auto-Validation (${targetQuestId})`,
        proofUrl: repoUrl,
        notes: `Automated GitHub Event [${event}]: "${commitMsg || 'Code change'}"`,
        isApproved: true,
        reviewNotes: "Automated verification by GitHub Webhook Engine"
      })
      .returning();

    // 2. Mark quest as COMPLETED for user
    const userQuests = await db
      .select()
      .from(userQuestsTable)
      .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, targetQuestId)));

    if (userQuests.length > 0) {
      await db
        .update(userQuestsTable)
        .set({ status: "COMPLETED", completedAt: new Date() })
        .where(eq(userQuestsTable.id, userQuests[0].id));
    } else {
      await db.insert(userQuestsTable).values({
        userId: userEmail,
        questId: targetQuestId,
        status: "COMPLETED",
        completedAt: new Date()
      });
    }

    // 3. Award XP & Gold to user
    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (userRecords.length > 0) {
      const u = userRecords[0];
      const xpReward = 200;
      const goldReward = 100;
      const newXp = (u.xp || 0) + xpReward;
      const newGold = (u.gold || 0) + goldReward;
      const newLevel = Math.floor(newXp / 300) + 1;

      await db
        .update(usersTable)
        .set({
          xp: newXp,
          gold: newGold,
          level: newLevel
        })
        .where(eq(usersTable.email, userEmail));
    }

    // 4. Grant "GitHub Automator" badge
    await db.insert(userBadgesTable).values({
      userId: userEmail,
      badgeName: "GitHub Automator",
      badgeIcon: "⚡"
    });

    return NextResponse.json({
      success: true,
      event,
      questId: targetQuestId,
      submission: newSubmission[0],
      message: `GitHub ${event} webhook processed and quest auto-validated!`
    });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process GitHub webhook" },
      { status: 500 }
    );
  }
}
