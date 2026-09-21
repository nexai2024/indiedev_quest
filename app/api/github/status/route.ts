import { getGithubAuthStatus } from "@/lib/github-oauth";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getGithubAuthStatus(userId);
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
