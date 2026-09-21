import { db } from "@/config/db";
import { usersTable, userBadgesTable } from "@/config/schema";
import { looksUnsolved, toStarterCode } from "@/lib/arena-starter";
import { runArenaTestsInNodeWorker } from "@/lib/run-arena-tests-node";
import { ARENA_CHALLENGES } from "@/lib/content/arena-challenges";
import { testsForChallenge } from "@/lib/arena-tests";
import { labChallengeIdForQuest } from "@/lib/content/coding-quests";
import { requireCharacter } from "@/lib/character";
import { completeUserQuest } from "@/lib/complete-quest";
import { applyGold, applyXp, hintsForChallenge, loadTalentEffects, talentPayload } from "@/lib/talent";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const effects = await loadTalentEffects(user.primaryEmailAddress?.emailAddress);

  const challenges = ARENA_CHALLENGES.map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    difficulty: challenge.difficulty,
    initialCode: toStarterCode(challenge),
    testCases: testsForChallenge(challenge.id).map((test) => ({ name: test.name, expected: "Pass" })),
    xpReward: applyXp(challenge.xpReward, effects),
    goldReward: applyGold(challenge.goldReward, effects),
    hints: hintsForChallenge(challenge.id, effects),
  }));

  return NextResponse.json({
    challenges,
    talents: talentPayload(effects),
  });
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
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const questId = typeof body.questId === "string" ? body.questId : "";
    const source = typeof body.code === "string" ? body.code : "";
    const userEmail = user.primaryEmailAddress.emailAddress;
    const effects = await loadTalentEffects(userEmail);

    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return NextResponse.json({ success: false, logs: ["Unknown challenge."] }, { status: 400 });
    }

    const starter = toStarterCode(challenge);
    if (looksUnsolved(source, starter)) {
      return NextResponse.json({
        success: false,
        logs: ["Tests did not run: the code still looks like the starter or contains TODO."],
        hint: "Delete TODO and write a real implementation, then attack again.",
      });
    }

    if (questId && labChallengeIdForQuest(questId) !== challenge.id) {
      return NextResponse.json({ success: false, logs: ["This challenge does not match that quest."] }, { status: 400 });
    }

    const report = await runArenaTestsInNodeWorker(challenge.id, source);
    const logs = [...report.logs];

    if (!report.passed) {
      return NextResponse.json({
        success: false,
        logs,
        results: report.results,
        xpAwarded: 0,
        goldAwarded: 0,
        talents: talentPayload(effects),
      });
    }

    let xpAwarded = applyXp(challenge.xpReward, effects);
    let goldAwarded = applyGold(challenge.goldReward, effects);
    let questCompleted = false;

    if (questId && labChallengeIdForQuest(questId) === challenge.id) {
      const rewards = await completeUserQuest({ userEmail, questId });
      xpAwarded = rewards.xpReward;
      goldAwarded = rewards.goldReward;
      questCompleted = rewards.xpReward > 0 || rewards.goldReward > 0;
    } else {
      const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
      if (userRecords.length > 0) {
        const row = userRecords[0]!;
        await db
          .update(usersTable)
          .set({
            xp: (row.xp || 0) + xpAwarded,
            gold: (row.gold || 0) + goldAwarded,
          })
          .where(eq(usersTable.email, userEmail));
      }
      await db.insert(userBadgesTable).values({
        userId: userEmail,
        badgeName: "Arena Gladiator",
        badgeIcon: "🏟️",
      });
    }

    logs.push(`Enemy defeated. +${xpAwarded} XP / +${goldAwarded} Gold.`);
    if (questCompleted) logs.push("Quest marked complete.");

    return NextResponse.json({
      success: true,
      logs,
      results: report.results,
      hint: "",
      xpAwarded,
      goldAwarded,
      questCompleted,
      talents: talentPayload(effects),
    });
  } catch (error) {
    console.error("POST arena error:", error);
    return NextResponse.json({ success: false, logs: ["Arena run failed. Try again."] }, { status: 500 });
  }
}
