import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    currentStreakDays: 7,
    longestStreakDays: 14,
    xpMultiplier: 1.25,
    lastActiveDate: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      currentStreakDays: 8,
      xpBonusGranted: 100,
      message: "Daily streak updated! 1.25x XP multiplier active!"
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update streak" }, { status: 500 });
  }
}
