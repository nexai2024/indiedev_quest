import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    cohortName: "The Code Alchemists",
    mvpLaunchRatePercent: 94.2,
    totalQuestsCompleted: 42,
    totalXpEarned: 18400,
    weeklyCommitVelocity: [
      { day: "Mon", commits: 12 },
      { day: "Tue", commits: 18 },
      { day: "Wed", commits: 25 },
      { day: "Thu", commits: 15 },
      { day: "Fri", commits: 30 },
      { day: "Sat", commits: 22 },
      { day: "Sun", commits: 19 }
    ]
  });
}
