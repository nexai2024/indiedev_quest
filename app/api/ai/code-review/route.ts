import { generateText, Output } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { ARENA_CHALLENGES } from "@/lib/content/arena-challenges";
import { ARENA_HINTS } from "@/lib/content/arena-hints";
import { requireCharacter } from "@/lib/character";

const reviewSchema = z.object({
  passed: z.boolean(),
  score: z.number(),
  summary: z.string(),
  hint: z.string(),
  suggestions: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : "";
    const mode = body.mode === "hint" ? "hint" : "review";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const challenge = ARENA_CHALLENGES.find((entry) => entry.id === challengeId);
    const bankHints = challengeId ? ARENA_HINTS[challengeId] ?? [] : [];

    if (!code.trim()) {
      return NextResponse.json({
        success: false,
        error: "Paste some code first.",
      }, { status: 400 });
    }

    const result = await generateText({
      model: "openai/gpt-5.4",
      output: Output.object({ schema: reviewSchema }),
      prompt: `You are the IndieDev Quest code mentor. You do not grade. Real tests decide pass/fail.

Mode: ${mode}
${mode === "hint" ? "Give the next small hint only. Do not write the full solution." : "Review the code. Point out bugs. Do not paste a complete rewrite. Never say the kata passed — tests do that."}

Challenge: ${challenge?.title || "Custom snippet"}
Description: ${challenge?.description || "General TypeScript"}
Named tests: ${(challenge?.testCases || []).map((test) => test.name).join("; ") || "none"}
Known teaching hints (you may paraphrase one): ${bankHints.join(" | ") || "none"}

Code:
${code.slice(0, 6000)}

score is a coaching confidence 0-100, not a grade. passed=false unless the implementation is obviously complete. hint must be one short coaching sentence. suggestions: 2-4 bullets. summary: 1-2 sentences.`,
    });

    const review = result.output;
    return NextResponse.json({
      success: true,
      review,
      message: review.summary,
    });
  } catch (error) {
    console.error("AI code review error:", error);
    return NextResponse.json({
      success: false,
      error: "AI review is unavailable. Check TODO comments and the test names, then run tests again.",
    }, { status: 500 });
  }
}
