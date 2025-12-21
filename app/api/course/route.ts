import { db } from "@/config/db";
import { CompleteExerciseTable, CourseChaptersTable, CourseTable, EnrolledCourseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest){
    const  {searchParams}=new URL(req.url);
    const courseId=searchParams.get('courseid')
    const user=await currentUser();

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if(!userEmail){
        return NextResponse.json({error : "User not authenicated"})
    }

    if(courseId && courseId!=='enrolled'){
        const result=await db.select().from(CourseTable)
        //@ts-ignore
        .where(eq(CourseTable.courseId,courseId));

        const chapterResult=await db.select().from(CourseChaptersTable)
        //@ts-ignore
        .where(eq(CourseChaptersTable.courseId,courseId));

        const enrolledCourse= await db.select().from(EnrolledCourseTable)
              //@ts-ignore
              .where(and(eq(EnrolledCourseTable?.CourseId,courseId),eq(EnrolledCourseTable.userId,user?.primaryEmailAddress?.emailAddress)))


        const isEnrolledCourse=enrolledCourse?.length>0?true:false

        const completeExercise=await db.select().from(CompleteExerciseTable)
        //@ts-ignore
                        .where(and(eq(CompleteExerciseTable.courseId, courseId),eq(CompleteExerciseTable.userId, user?.primaryEmailAddress?.emailAddress)
        ))
        .orderBy(desc(CompleteExerciseTable?.courseId),
        desc(CompleteExerciseTable?.exerciseId))


        return NextResponse.json(
            {
                ...result[0],
                chapters:chapterResult,
                userEnrolled: isEnrolledCourse,
                courseEnrolledInfo:enrolledCourse[0],
                completeExercise: completeExercise

            }
        );
    }



    else if(courseId=='enrolled'){
        // 1 Fetch all enrolled courses for the user
        const enrolledCourses = await db
    .select()
    .from(EnrolledCourseTable)
    .where(eq(EnrolledCourseTable.userId, userEmail));

if (enrolledCourses.length === 0) {
    return NextResponse.json([]);
}

// Extract courseIds
const courseIds = enrolledCourses.map(c => c.CourseId);

// 2 Fetch all course details in one go
const courses = await db
    .select()
    .from(CourseTable)
    //@ts-ignore
    // CourseTable uses lowercase 'courseId', so this line is correct
    .where(inArray(CourseTable.courseId, courseIds));

// 3 Fetch chapters for all courses
const chapters = await db
    .select()
    .from(CourseChaptersTable)
    //@ts-ignore
    .where(inArray(CourseChaptersTable.courseId, courseIds))
    .orderBy(asc(CourseChaptersTable.chapterId));

// 4 Fetch completed exercises for all courses
const completed = await db
    .select()
    .from(CompleteExerciseTable)
    //@ts-ignore
    .where(and(inArray(CompleteExerciseTable.courseId, courseIds), 
        eq(CompleteExerciseTable.userId, userEmail)
    ))
    .orderBy(
        desc(CompleteExerciseTable.courseId),
        desc(CompleteExerciseTable.exerciseId)
    );

const finalResult = courses.map(course => {
    // Compare 'CourseId' (from enrolled) with 'courseId' (from course table)
    const courseEnrollInfo = enrolledCourses.find(e => e.CourseId === course.courseId);

    return {
        ...course,
        chapters: chapters.filter(ch => ch.courseId === course.courseId),
        completedExercises: completed.filter(cx => cx.courseId === course.courseId),
        courseEnrollInfo: courseEnrollInfo,
        userEnrolled: true
    };
});

// ⭐ Format output
const formattedResult = finalResult.map(item => {
    // Count total exercises by summing exercises arrays in all chapters
    const totalExercises = item.chapters.reduce((acc, chapter) => {
        // If exercises is stored as JSON/array
        const exercisesCount = Array.isArray(chapter.exercises) ? chapter.exercises.length : 0;
        return acc + exercisesCount;
    }, 0);

    const completedExercises = item.completedExercises.length;

    return {
    courseId: item.courseId,
    title: item.title,
    bannerImage: item?.bannerImage,
    totalExercises,
    completedExercises,
    xpEarned: item.courseEnrollInfo?.xpEarned || 0, // Ensure this matches your schema
    level: item.level
};
});
return NextResponse.json(formattedResult);
    }




    else{
        const result=await db.select().from(CourseTable).orderBy(asc(CourseTable.id));

        return NextResponse.json(result);
    }
}