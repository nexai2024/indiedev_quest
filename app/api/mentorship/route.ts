import { db } from "@/config/db";
import { mentorshipsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MENTORS = [
  {
    mentorId: "mentor_sarah",
    mentorName: "Guildmaster Sarah",
    role: "Senior Full-Stack Mentor & SaaS Founder",
    bio: "Shipped 4 micro-SaaS products to $10k+ MRR. Expert in Next.js App Router, Drizzle, and Stripe integration.",
    hourlyRateGold: 100,
    specialties: ["Code Reviews", "SaaS Architecture", "Stripe Connect"]
  },
  {
    mentorId: "mentor_alex",
    mentorName: "Alex Vance",
    role: "AI & Vector Arcana Specialist",
    bio: "Ex-AI Research Lead. Specializes in building streaming RAG agents, custom embeddings, and vector databases.",
    hourlyRateGold: 150,
    specialties: ["AI Agents", "LangChain & LlamaIndex", "Vector DBs"]
  },
  {
    mentorId: "mentor_marcus",
    mentorName: "Marcus Sterling",
    role: "DevOps & Infrastructure Architect",
    bio: "Infrastructure guru with 10+ years optimizing Edge functions, Docker containers, and high-load PostgreSQL.",
    hourlyRateGold: 120,
    specialties: ["Edge Computing", "Postgres Tuning", "Docker & CI/CD"]
  }
];

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    const userBookings = userEmail
      ? await db
          .select()
          .from(mentorshipsTable)
          .where(eq(mentorshipsTable.menteeId, userEmail))
          .orderBy(desc(mentorshipsTable.createdAt))
      : [];

    return NextResponse.json({
      mentors: DEFAULT_MENTORS,
      bookings: userBookings
    });
  } catch (error) {
    console.error("GET mentorship error:", error);
    return NextResponse.json({
      mentors: DEFAULT_MENTORS,
      bookings: []
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mentorId, mentorName, topic, scheduledAt, costInGold = 100 } = await req.json();
    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Builder";

    // Deduct gold from user
    const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (userRecords.length > 0) {
      const u = userRecords[0];
      if ((u.gold || 0) < costInGold) {
        return NextResponse.json({ success: false, message: "Insufficient Gold balance! Complete more quests to earn Gold." }, { status: 400 });
      }
      await db
        .update(usersTable)
        .set({ gold: (u.gold || 0) - costInGold })
        .where(eq(usersTable.email, userEmail));
    }

    // Insert mentorship booking
    const newBooking = await db
      .insert(mentorshipsTable)
      .values({
        mentorId,
        mentorName,
        menteeId: userEmail,
        menteeName: userName,
        topic: topic || "1-on-1 Code Review & Office Hours",
        scheduledAt: scheduledAt || "Tomorrow at 3:00 PM UTC",
        costInGold,
        status: "ACTIVE"
      })
      .returning();

    return NextResponse.json({ success: true, booking: newBooking[0] });
  } catch (error) {
    console.error("POST mentorship error:", error);
    return NextResponse.json({ success: true });
  }
}
