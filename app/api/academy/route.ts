import { db } from "@/config/db";
import { userAcademyProgressTable } from "@/config/schema";
import { gradeQuiz } from "@/lib/academy-quiz";
import { requireCharacter } from "@/lib/character";
import {
  ACADEMY_COURSES,
  allChaptersComplete,
  findChapter,
  flattenChapters,
  getAcademyCourse,
  isChapterUnlocked,
  publicCourse,
} from "@/lib/content/academy-courses";
import { grantBadge, grantHeroLoot } from "@/lib/hero-loot";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type ProgressRow = typeof userAcademyProgressTable.$inferSelect;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

function asStarMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const next: Record<string, number> = {};
  for (const [key, stars] of Object.entries(value as Record<string, unknown>)) {
    const amount = Number(stars);
    if (Number.isFinite(amount)) next[key] = amount;
  }
  return next;
}

function serializeProgress(row: ProgressRow | null) {
  return {
    completedChapterIds: asStringArray(row?.completedChapterIds),
    chapterStars: asStarMap(row?.chapterStars),
    xpEarned: row?.xpEarned || 0,
    finalPercent: row?.finalPercent || 0,
    finalPassed: Boolean(row?.finalPassed),
    completedAt: row?.completedAt ?? null,
  };
}

async function loadProgress(email: string, courseId: string) {
  const rows = await db
    .select()
    .from(userAcademyProgressTable)
    .where(and(eq(userAcademyProgressTable.userId, email), eq(userAcademyProgressTable.courseId, courseId)))
    .limit(1);
  return rows[0] ?? null;
}

async function saveProgress(email: string, courseId: string, patch: Partial<ProgressRow>) {
  const existing = await loadProgress(email, courseId);
  if (!existing) {
    const inserted = await db
      .insert(userAcademyProgressTable)
      .values({
        userId: email,
        courseId,
        completedChapterIds: asStringArray(patch.completedChapterIds) ,
        chapterStars: asStarMap(patch.chapterStars),
        xpEarned: patch.xpEarned ?? 0,
        finalPercent: patch.finalPercent ?? 0,
        finalPassed: patch.finalPassed ?? false,
        completedAt: patch.completedAt ?? null,
      })
      .returning();
    return inserted[0]!;
  }

  const updated = await db
    .update(userAcademyProgressTable)
    .set(patch)
    .where(eq(userAcademyProgressTable.id, existing.id))
    .returning();
  return updated[0]!;
}

export async function GET(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const courseId = req.nextUrl.searchParams.get("courseId");
    const allProgress = await db
      .select()
      .from(userAcademyProgressTable)
      .where(eq(userAcademyProgressTable.userId, email));
    const byCourse = new Map(allProgress.map((row) => [row.courseId, row]));

    if (courseId) {
      const course = getAcademyCourse(courseId);
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      return NextResponse.json({
        course: publicCourse(course),
        progress: serializeProgress(byCourse.get(courseId) ?? null),
      });
    }

    return NextResponse.json({
      courses: ACADEMY_COURSES.map((course) => {
        const progress = serializeProgress(byCourse.get(course.courseId) ?? null);
        const total = flattenChapters(course).length;
        return {
          ...publicCourse(course),
          progress,
          chaptersDone: progress.completedChapterIds.length,
          chaptersTotal: total,
        };
      }),
    });
  } catch (error) {
    console.error("GET academy error:", error);
    return NextResponse.json({ courses: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const course = getAcademyCourse(courseId);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const existing = await loadProgress(email, courseId);
    const progress = serializeProgress(existing);

    if (body.action === "CHAPTER_QUIZ") {
      const chapterId = typeof body.chapterId === "string" ? body.chapterId : "";
      const chapter = findChapter(course, chapterId);
      if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      if (!isChapterUnlocked(course, progress.completedChapterIds, chapterId)) {
        return NextResponse.json({ error: "Clear the previous chapter first." }, { status: 400 });
      }

      const grade = gradeQuiz(chapter.quiz.questions, body.answers);
      if ("error" in grade) {
        return NextResponse.json({ error: grade.error }, { status: 400 });
      }
      if (!grade.passed) {
        return NextResponse.json({ success: false, grade, progress });
      }

      const already = progress.completedChapterIds.includes(chapterId);
      const completedChapterIds = already
        ? progress.completedChapterIds
        : [...progress.completedChapterIds, chapterId];
      const chapterStars = {
        ...progress.chapterStars,
        [chapterId]: Math.max(progress.chapterStars[chapterId] || 0, grade.stars),
      };
      const xpGain = already ? 0 : chapter.xp;
      const loot = xpGain > 0 ? await grantHeroLoot(email, xpGain, 0) : { xp: 0, gold: 0 };
      const saved = await saveProgress(email, courseId, {
        completedChapterIds,
        chapterStars,
        xpEarned: progress.xpEarned + xpGain,
      });

      return NextResponse.json({
        success: true,
        grade,
        loot,
        firstClear: !already,
        progress: serializeProgress(saved),
      });
    }

    if (body.action === "FINAL_QUIZ") {
      if (!allChaptersComplete(course, progress.completedChapterIds)) {
        return NextResponse.json({ error: "Finish every chapter before the guild exam." }, { status: 400 });
      }

      const grade = gradeQuiz(course.finalQuiz.questions, body.answers);
      if ("error" in grade) {
        return NextResponse.json({ error: grade.error }, { status: 400 });
      }
      if (!grade.passed) {
        const saved = await saveProgress(email, courseId, {
          completedChapterIds: progress.completedChapterIds,
          chapterStars: progress.chapterStars,
          xpEarned: progress.xpEarned,
          finalPercent: Math.max(progress.finalPercent, grade.percent),
          finalPassed: false,
        });
        return NextResponse.json({ success: false, grade, progress: serializeProgress(saved) });
      }

      const already = progress.finalPassed;
      const xpGain = already ? 0 : course.xpReward;
      const goldGain = already ? 0 : course.goldReward;
      const loot = already ? { xp: 0, gold: 0 } : await grantHeroLoot(email, xpGain, goldGain);
      if (!already) {
        await grantBadge(email, `${course.title} Graduate`, "📜");
      }
      const saved = await saveProgress(email, courseId, {
        completedChapterIds: progress.completedChapterIds,
        chapterStars: progress.chapterStars,
        xpEarned: progress.xpEarned + xpGain,
        finalPercent: Math.max(progress.finalPercent, grade.percent),
        finalPassed: true,
        completedAt: existing?.completedAt ?? new Date(),
      });

      return NextResponse.json({
        success: true,
        grade,
        loot,
        firstClear: !already,
        progress: serializeProgress(saved),
      });
    }

    return NextResponse.json({ error: "Unknown academy action" }, { status: 400 });
  } catch (error) {
    console.error("POST academy error:", error);
    return NextResponse.json({ error: "Academy action failed" }, { status: 500 });
  }
}
