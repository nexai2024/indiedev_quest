import { describe, expect, it } from "vitest";
import { starterQuestForClass } from "../lib/content/class-starter-quests";
import { hasCompletedOnboarding } from "../lib/user-profile";
import { isHeroClassId, isHeroGoal } from "../lib/content/hero-options";

describe("required character onboarding", () => {
  it("rejects a Clerk-only profile with empty class or goal", () => {
    expect(hasCompletedOnboarding(null)).toBe(false);
    expect(hasCompletedOnboarding({ characterClass: "", primaryGoal: "" })).toBe(false);
    expect(hasCompletedOnboarding({ characterClass: "AI Builder", primaryGoal: "" })).toBe(false);
    expect(hasCompletedOnboarding({ characterClass: "AI Builder", primaryGoal: "Earn First $100 MRR" })).toBe(true);
  });

  it("only accepts catalog class and goal ids", () => {
    expect(isHeroClassId("Guest Dev")).toBe(false);
    expect(isHeroClassId("Full-Stack Artisan")).toBe(true);
    expect(isHeroGoal("whatever")).toBe(false);
    expect(isHeroGoal("Ship First MVP in 14 Days")).toBe(true);
  });

  it("maps each class to a level-1 starter quest", () => {
    expect(starterQuestForClass("Frontend Specialist")?.questId).toBe("side_dark_mode");
    expect(starterQuestForClass("Full-Stack Artisan")?.questId).toBe("side_nextauth_drizzle");
    expect(starterQuestForClass("AI Builder")?.questId).toBe("ai_streaming_ui");
    expect(starterQuestForClass("Systems Engineer")?.questId).toBe("ops_ci_green");
    expect(starterQuestForClass("Guest Dev")).toBeNull();
    expect(starterQuestForClass("Frontend Specialist")?.levelReq).toBe(1);
  });
});
