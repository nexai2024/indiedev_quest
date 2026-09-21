import { isHeroClassId, type HeroClassId } from "@/lib/content/hero-options";
import { QUEST_CATALOG, type QuestCatalogItem } from "@/lib/content/quest-catalog";

export const CLASS_STARTER_QUEST_IDS: Record<HeroClassId, string> = {
  "Frontend Specialist": "side_dark_mode",
  "Full-Stack Artisan": "side_nextauth_drizzle",
  "AI Builder": "ai_streaming_ui",
  "Systems Engineer": "ops_ci_green",
};

export function starterQuestForClass(characterClass: string): QuestCatalogItem | null {
  if (!isHeroClassId(characterClass)) return null;
  const questId = CLASS_STARTER_QUEST_IDS[characterClass];
  return QUEST_CATALOG.find((quest) => quest.questId === questId) ?? null;
}
