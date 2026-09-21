import { db } from "@/config/db";
import { EnrolledCourseTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();
    const result = await db.insert(EnrolledCourseTable).values({
        CourseId: courseId ?? 0,
        userId: user.primaryEmailAddress.emailAddress,
        xpEarned: 0,
    }).returning();

    return NextResponse.json(result);
}