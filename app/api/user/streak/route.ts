import { NextResponse } from "next/server";
import { requireCharacter } from "@/lib/character";

export async function GET() {
  return NextResponse.json({
    currentStreakDays: 0,
    longestStreakDays: 0,
    xpMultiplier: 1,
    lastActiveDate: null,
  });
}

export async function POST() {
  const authed = await requireCharacter();
  if (!authed.ok) return authed.error;

  return NextResponse.json({
    success: true,
    currentStreakDays: 1,
    xpBonusGranted: 0,
    message: "Daily streak started.",
  });
}
