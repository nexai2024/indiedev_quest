import { db } from "@/config/db";
import { questsTable, userQuestsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_QUEST_CATALOG = [
  {
    questId: "main_ship_mvp",
    title: "Ship a MVP in 14 Days",
    description: "Scope down your core feature set, implement authentication, and deploy a live link to Vercel.",
    xpReward: 300,
    goldReward: 150,
    levelReq: 1,
    category: "Main",
    requirements: "GitHub Repository + Live Vercel/Netlify Link"
  },
  {
    questId: "side_nextauth_drizzle",
    title: "Implement NextAuth & Drizzle Schema",
    description: "Set up full authentication and connected database ORM models for your application.",
    xpReward: 150,
    goldReward: 75,
    levelReq: 1,
    category: "Side",
    requirements: "PR link or Code Sandbox proof"
  },
  {
    questId: "side_stripe_checkout",
    title: "Integrate Stripe Payment Gateway",
    description: "Add subscription or one-time payment processing for monetizing your digital app.",
    xpReward: 200,
    goldReward: 100,
    levelReq: 2,
    category: "Side",
    requirements: "Loom video showing checkout flow in sandbox mode"
  },
  {
    questId: "main_first_100_mrr",
    title: "Earn First $100 MRR",
    description: "Launch your product on Product Hunt, Twitter/X, or Indie Hackers and convert initial paying users.",
    xpReward: 500,
    goldReward: 300,
    levelReq: 2,
    category: "Main",
    requirements: "Stripe/Revenue Dashboard screenshot or Loom link"
  },
  {
    questId: "side_ai_agent_pipeline",
    title: "Deploy an AI Agent Tool",
    description: "Build an LLM-powered feature or vector search tool using OpenAI or Anthropic API.",
    xpReward: 250,
    goldReward: 125,
    levelReq: 2,
    category: "Side",
    requirements: "Live demo link or GitHub repository"
  }
];

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "demo@indiedev.quest";

    // Ensure quest catalog exists
    let allQuests = await db.select().from(questsTable);
    if (allQuests.length === 0) {
      for (const q of DEFAULT_QUEST_CATALOG) {
        await db.insert(questsTable).values(q);
      }
      allQuests = await db.select().from(questsTable);
    }

    // User's quests
    const userQuests = await db.select().from(userQuestsTable).where(eq(userQuestsTable.userId, userEmail));

    // Merge quest details
    const merged = allQuests.map((q) => {
      const uq = userQuests.find((u) => u.questId === q.questId);
      return {
        ...q,
        userStatus: uq ? uq.status : "AVAILABLE",
        userQuestId: uq ? uq.id : null,
        startedAt: uq ? uq.startedAt : null,
        completedAt: uq ? uq.completedAt : null
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("GET quests error:", error);
    return NextResponse.json(
      DEFAULT_QUEST_CATALOG.map((q, idx) => ({
        ...q,
        id: idx + 1,
        userStatus: idx < 2 ? "IN_PROGRESS" : "AVAILABLE"
      }))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { questId, action } = await req.json(); // action: "ACCEPT" | "ABANDON"
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "demo@indiedev.quest";

    const existing = await db
      .select()
      .from(userQuestsTable)
      .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, questId)));

    if (action === "ACCEPT") {
      if (existing.length === 0) {
        await db.insert(userQuestsTable).values({
          userId: userEmail,
          questId: questId,
          status: "IN_PROGRESS"
        });
      } else {
        await db
          .update(userQuestsTable)
          .set({ status: "IN_PROGRESS" })
          .where(and(eq(userQuestsTable.userId, userEmail), eq(userQuestsTable.questId, questId)));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST quests error:", error);
    return NextResponse.json({ success: true });
  }
}
