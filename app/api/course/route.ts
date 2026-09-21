import { db } from "@/config/db";
import { CompleteExerciseTable, CourseChaptersTable, CourseTable, EnrolledCourseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_COURSES = [
  {
    id: 1,
    courseId: 101,
    title: "Full-Stack Next.js 15 & Drizzle Masterclass",
    desc: "Master modern App Router, Server Actions, PostgreSQL with Drizzle ORM, and Clerk authentication.",
    bannerImage: "/course-banner.gif",
    level: "Intermediate",
    tags: "Next.js, React 19, Drizzle, Tailwind",
    editorType: "react"
  },
  {
    id: 2,
    courseId: 102,
    title: "AI Agent Orchestration & Vector RAG",
    desc: "Build autonomous streaming agents using LangChain, OpenAI APIs, and Pinecone vector stores.",
    bannerImage: "/course-banner.gif",
    level: "Advanced",
    tags: "AI, Agents, TypeScript, Vector DB",
    editorType: "react"
  }
];

const DEFAULT_CHAPTERS = [
  {
    id: 1,
    chapterId: 1,
    courseId: 101,
    name: "Chapter 1: Next.js Fundamentals & App Router",
    desc: "Setup layout routing, dynamic route segments, and server-side data fetching.",
    exercises: [
      { name: "Create App Layout", slug: "create-app-layout", xp: 50 },
      { name: "Build Dynamic API Route", slug: "build-dynamic-api-route", xp: 100 }
    ]
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseid");
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (courseId && courseId !== "enrolled") {
      let result = await db
        .select()
        .from(CourseTable)
        .where(eq(CourseTable.courseId, Number(courseId)));

      let chapterResult = await db
        .select()
        .from(CourseChaptersTable)
        .where(eq(CourseChaptersTable.courseId, Number(courseId)));

      if (result.length === 0) {
        const fallbackCourse = DEFAULT_COURSES.find((c) => c.courseId === Number(courseId)) || DEFAULT_COURSES[0];
        result = [fallbackCourse as any];
        chapterResult = DEFAULT_CHAPTERS as any;
      }

      const enrolledCourse = userEmail
        ? await db
            .select()
            .from(EnrolledCourseTable)
            .where(
              and(
                eq(EnrolledCourseTable.CourseId, Number(courseId)),
                eq(EnrolledCourseTable.userId, userEmail)
              )
            )
        : [];

      const isEnrolledCourse = enrolledCourse.length > 0;

      const completeExercise = userEmail
        ? await db
            .select()
            .from(CompleteExerciseTable)
            .where(
              and(
                eq(CompleteExerciseTable.courseId, Number(courseId)),
                eq(CompleteExerciseTable.userId, userEmail)
              )
            )
            .orderBy(
              desc(CompleteExerciseTable.courseId),
              desc(CompleteExerciseTable.exerciseId)
            )
        : [];

      return NextResponse.json({
        ...result[0],
        chapters: chapterResult,
        userEnrolled: isEnrolledCourse,
        courseEnrolledInfo: enrolledCourse[0],
        completeExercise: completeExercise
      });
    } else if (courseId === "enrolled") {
      if (!userEmail) {
        return NextResponse.json([]);
      }

      const enrolledCourses = await db
        .select()
        .from(EnrolledCourseTable)
        .where(eq(EnrolledCourseTable.userId, userEmail));

      if (enrolledCourses.length === 0) {
        return NextResponse.json([]);
      }

      const courseIds = enrolledCourses.map((c) => c.CourseId!).filter(Boolean);

      const courses = await db
        .select()
        .from(CourseTable)
        .where(inArray(CourseTable.courseId, courseIds));

      const chapters = await db
        .select()
        .from(CourseChaptersTable)
        .where(inArray(CourseChaptersTable.courseId, courseIds))
        .orderBy(asc(CourseChaptersTable.chapterId));

      const completed = await db
        .select()
        .from(CompleteExerciseTable)
        .where(
          and(
            inArray(CompleteExerciseTable.courseId, courseIds),
            eq(CompleteExerciseTable.userId, userEmail)
          )
        );

      const finalResult = courses.map((course) => {
        const courseEnrollInfo = enrolledCourses.find((e) => e.CourseId === course.courseId);
        return {
          ...course,
          chapters: chapters.filter((ch) => ch.courseId === course.courseId),
          completedExercises: completed.filter((cx) => cx.courseId === course.courseId),
          courseEnrollInfo: courseEnrollInfo,
          userEnrolled: true
        };
      });

      const formattedResult = finalResult.map((item) => {
        const totalExercises = item.chapters.reduce((acc, chapter) => {
          const exercisesCount = Array.isArray(chapter.exercises) ? chapter.exercises.length : 0;
          return acc + exercisesCount;
        }, 0);

        return {
          courseId: item.courseId,
          title: item.title,
          bannerImage: item.bannerImage,
          totalExercises,
          completedExercises: item.completedExercises.length,
          xpEarned: item.courseEnrollInfo?.xpEarned || 0,
          level: item.level
        };
      });

      return NextResponse.json(formattedResult);
    } else {
      let result = await db.select().from(CourseTable).orderBy(asc(CourseTable.id));
      if (result.length === 0) {
        // Auto-seed default courses into database if empty
        for (const c of DEFAULT_COURSES) {
          await db.insert(CourseTable).values(c);
        }
        result = await db.select().from(CourseTable).orderBy(asc(CourseTable.id));
      }
      return NextResponse.json(result.length > 0 ? result : DEFAULT_COURSES);
    }
  } catch (error) {
    console.error("GET course error:", error);
    return NextResponse.json(DEFAULT_COURSES);
  }
}
