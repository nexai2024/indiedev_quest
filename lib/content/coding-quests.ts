import { ARENA_CHALLENGES } from "@/lib/content/arena-challenges";
import { QUEST_CATALOG } from "@/lib/content/quest-catalog";
import { getQuestProofSpec } from "@/lib/content/quest-proof-spec";

export function labChallengeIdForQuest(questId: string): string | null {
  const spec = getQuestProofSpec(questId);
  return spec.kind === "code_kata" ? spec.labChallengeId ?? null : null;
}

export const CODING_QUEST_CHALLENGES: Record<string, string> = Object.fromEntries(
  QUEST_CATALOG.flatMap((quest) => {
    const challengeId = labChallengeIdForQuest(quest.questId);
    return challengeId ? [[quest.questId, challengeId]] : [];
  })
);

export function questIdsForChallenge(challengeId: string): string[] {
  return Object.entries(CODING_QUEST_CHALLENGES)
    .filter(([, id]) => id === challengeId)
    .map(([questId]) => questId);
}

export function isCodingQuest(questId: string): boolean {
  return Boolean(labChallengeIdForQuest(questId));
}

export function challengeForQuest(questId: string) {
  const challengeId = labChallengeIdForQuest(questId);
  if (!challengeId) return null;
  return ARENA_CHALLENGES.find((challenge) => challenge.id === challengeId) ?? null;
}
