import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    cohortName: null,
    mvpLaunchRatePercent: 0,
    totalQuestsCompleted: 0,
    totalXpEarned: 0,
    weeklyCommitVelocity: [],
  });
}
