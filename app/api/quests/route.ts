import { db } from "@/config/db";
import { questsTable, userQuestsTable } from "@/config/schema";
import { QUEST_CATALOG } from "@/lib/content/quest-catalog";
import { catalogQuestBoard, withProofSpec } from "@/lib/content/quest-proof-spec";
import { acceptUserQuest } from "@/lib/accept-quest";
import { requireCharacter } from "@/lib/character";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

async function signedInEmail() {
  try {
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress;
  } catch (error) {
    console.error("GET quests auth error:", error);
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const userEmail = await signedInEmail();

  try {
    let allQuests = await db.select().from(questsTable);
    const existingIds = new Set(allQuests.map((q) => q.questId));
    for (const q of QUEST_CATALOG) {
      if (!existingIds.has(q.questId)) {
        await db.insert(questsTable).values(q);
      }
    }
    if (existingIds.size !== QUEST_CATALOG.length) {
      allQuests = await db.select().from(questsTable);
    }

    // User's quests
    const userQuests = userEmail
      ? await db.select().from(userQuestsTable).where(eq(userQuestsTable.userId, userEmail))
      : [];

    const byId = new Map(allQuests.map((quest) => [quest.questId, quest]));
    const merged = QUEST_CATALOG.map((quest, index) => {
      const row = byId.get(quest.questId);
      const uq = userQuests.find((entry) => entry.questId === quest.questId);
      return withProofSpec({
        ...(row ?? { ...quest, id: index + 1 }),
        userStatus: uq ? uq.status : "AVAILABLE",
        userQuestId: uq ? uq.id : null,
        startedAt: uq ? uq.startedAt : null,
        completedAt: uq ? uq.completedAt : null,
      });
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("GET quests error:", error);
    return NextResponse.json(catalogQuestBoard());
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;

    const { questId, action } = await req.json();
    if (typeof questId !== "string" || !questId) {
      return NextResponse.json({ error: "questId is required" }, { status: 400 });
    }
    if (action !== "ACCEPT" && action !== "ABANDON") {
      return NextResponse.json({ error: "Invalid quest action" }, { status: 400 });
    }
    const userEmail = user.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "ACCEPT") {
      const accepted = await acceptUserQuest(userEmail, questId);
      if (!accepted) {
        return NextResponse.json({ error: "Unknown quest" }, { status: 404 });
      }
    } else {
      await db
        .update(userQuestsTable)
        .set({ status: "AVAILABLE" })
        .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, questId)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST quests error:", error);
    return NextResponse.json(
      { error: "Quest log is temporarily unavailable. Your accept was not saved on the server." },
      { status: 503 }
    );
  }
}
