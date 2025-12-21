import { db } from "@/config/db";
import { CompleteExerciseTable, CourseChaptersTable, CourseTable, ExerciseTable } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { courseId, chapterId, exerciseId } = await req.json();

    const courseInfo=await db.select().from(CourseTable).where(eq(CourseTable.courseId,courseId));

    // 1. Fetch Chapter Data
    // We wrap courseId and chapterId in Number() to convert "1" (string) to 1 (number)
    const courseResult = await db.select().from(CourseChaptersTable)
        .where(and(
            eq(CourseChaptersTable.courseId, Number(courseId)), 
            eq(CourseChaptersTable.chapterId, Number(chapterId))
        ));

    // 2. Fetch Exercise Data
    const exerciseResult = await db.select().from(ExerciseTable)
        .where(and(
            // FIX IS HERE: Changed CourseChaptersTable to ExerciseTable
            eq(ExerciseTable.courseId, Number(courseId)),
            // We do NOT convert exerciseId to Number because it is a slug (string)
            eq(ExerciseTable.exerciseId, exerciseId) 
        ));

    const completedExercise=await db.select().from(CompleteExerciseTable)
            .where(and(eq(CompleteExerciseTable?.courseId,courseId),eq(CompleteExerciseTable?.chapterId,chapterId)))

    return NextResponse.json({
        ...courseResult[0],
        exerciseData: exerciseResult[0],
        completedExercise: completedExercise,
        editorType:courseInfo[0]?.editorType
    })
}