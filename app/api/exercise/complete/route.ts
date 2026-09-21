import { db } from "@/config/db";
import { CompleteExerciseTable, EnrolledCourseTable, usersTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { courseId, chapterId, exerciseId, xpEarned } = await req.json();
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;

    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.primaryEmailAddress.emailAddress;

    // 1. Insert completion record
    const result = await db.insert(CompleteExerciseTable).values({
      chapterId: chapterId,
      courseId: courseId,
      exerciseId: exerciseId,
      userId: email
    }).returning();

    // 2. Update course xp earned
    await db.update(EnrolledCourseTable)
      .set({
        xpEarned: sql`${EnrolledCourseTable.xpEarned} + ${xpEarned}`
      })
      // Double check if your schema is CourseId (capital C) or courseId
      .where(eq(EnrolledCourseTable.CourseId, courseId)); 

    // 3. Update user total points
    await db.update(usersTable)
      .set({
        points: sql`${usersTable.points} + ${xpEarned}`
      })
      .where(eq(usersTable.email, email));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Build Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}