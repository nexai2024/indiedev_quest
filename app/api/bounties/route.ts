import { NextRequest, NextResponse } from "next/server";
import { requireCharacter } from "@/lib/character";

const DEFAULT_BOUNTIES = [
  {
    id: 1,
    title: "Build Stripe Connect Webhook Handler",
    rewardGold: 300,
    rewardUsd: 100,
    status: "OPEN",
    category: "Fullstack",
    postedBy: "Guildmaster Sarah"
  },
  {
    id: 2,
    title: "Create Retro Pixel UI Switch Component",
    rewardGold: 150,
    rewardUsd: 50,
    status: "OPEN",
    category: "Frontend",
    postedBy: "David K."
  }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(DEFAULT_BOUNTIES);
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;

    const body = await req.json();
    const newBounty = {
      id: Date.now(),
      title: body.title || "Custom Guild Bounty",
      rewardGold: body.rewardGold || 200,
      rewardUsd: body.rewardUsd || 75,
      status: "OPEN",
      category: body.category || "General",
      postedBy: body.postedBy || "Indie Hero"
    };

    return NextResponse.json({ success: true, bounty: newBounty });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create bounty" }, { status: 500 });
  }
}
