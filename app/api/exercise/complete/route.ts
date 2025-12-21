import { db } from "@/config/db";
import { CompleteExerciseTable, EnrolledCourseTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Next.js 15/16 requires the second argument to have params as a Promise
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<any> } 
) {
  // Even if you don't use params, the build validator expects this structure
  await params; 

  try {
    const { courseId, chapterId, exerciseId, xpEarned } = await req.json();
    const user = await currentUser();

    // Guard: Ensure user is logged in
    if (!user || !user.primaryEmailAddress?.emailAddress) {
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