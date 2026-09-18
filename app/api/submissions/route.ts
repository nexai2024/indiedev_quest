import { db } from "@/config/db";
import { submissionsTable, userQuestsTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const submissions = await db
      .select()
      .from(submissionsTable)
      .orderBy(desc(submissionsTable.createdAt));

    if (submissions.length === 0) {
      return NextResponse.json([
        {
          id: 1,
          userId: "david@indiedev.quest",
          userName: "David K.",
          questTitle: "Ship a MVP in 14 Days",
          proofUrl: "https://github.com/davidk/saas-starter-mvp",
          notes: "Built a micro-SaaS starter with Next.js 15, Drizzle, and Stripe Checkout! Fully deployed on Vercel.",
          isApproved: true,
          reviewNotes: "Outstanding execution! Loved the responsive Tailwind UI and clean Drizzle models.",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: "elena@indiedev.quest",
          userName: "Elena R.",
          questTitle: "Deploy an AI Agent Tool",
          proofUrl: "https://loom.com/share/demo-ai-agent",
          notes: "Autonomous prompt optimizer agent using LangChain and OpenAI API with real-time streaming.",
          isApproved: true,
          reviewNotes: "Super impressive Loom video walkthrough! Agent speed is blazing fast.",
          createdAt: new Date().toISOString()
        }
      ]);
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET submissions error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  let proofUrlInput = "";
  let notesInput = "";
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const questId = body.questId;
    const questTitle = body.questTitle;
    proofUrlInput = body.proofUrl || "";
    notesInput = body.notes || "";

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Builder";

    const newSubmission = await db
      .insert(submissionsTable)
      .values({
        userId: userEmail,
        userName: userName,
        questTitle: questTitle || "Quest Submission",
        proofUrl: proofUrlInput,
        notes: notesInput,
        isApproved: false
      })
      .returning();

    if (questId) {
      await db
        .update(userQuestsTable)
        .set({ status: "UNDER_REVIEW" })
        .where(eq(userQuestsTable.questId, questId));
    }

    return NextResponse.json(newSubmission[0]);
  } catch (error) {
    console.error("POST submission error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
