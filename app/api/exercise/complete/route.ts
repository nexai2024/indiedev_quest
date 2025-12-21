import { db } from "@/config/db";
import { CompleteExerciseTable, EnrolledCourseTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export  async function POST(req:NextResponse) {
    const {courseId, chapterId, exerciseId, xpEarned}=await req.json();
    const user = await currentUser();

    const result=await db.insert(CompleteExerciseTable).values({
        chapterId:chapterId,
        courseId:courseId,
        exerciseId:exerciseId,
        userId:user?.primaryEmailAddress?.emailAddress
    }).returning()

    // update course xp earned
    await db.update(EnrolledCourseTable).set({
        xpEarned: sql`${EnrolledCourseTable.xpEarned} +${xpEarned}`
        // @ts-ignore
    }).where(eq (EnrolledCourseTable?.CourseId, courseId));

    // update user xp earned
    await db.update(usersTable).set({
        points:  sql`${usersTable.points} +${xpEarned}`
        // @ts-ignore
    }).where(eq(usersTable.email,user?.primaryEmailAddress?.emailAddress));

    return NextResponse.json(result);
    
}