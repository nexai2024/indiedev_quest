import { db } from "@/config/db";
import { userSkillsTable } from "@/config/schema";
import { ARENA_HINTS } from "@/lib/content/arena-hints";
import { SKILL_NODES, type CombatEffect } from "@/lib/content/skill-nodes";
import { raidDamage, type RaidAttackType } from "@/lib/content/raid-bosses";
import { eq } from "drizzle-orm";

export type TalentEffects = Required<CombatEffect>;

export const EMPTY_TALENTS: TalentEffects = {
  arenaHints: 0,
  raidDamageFlat: 0,
  raidDamagePercent: 0,
  raidCritChance: 0,
  goldPercent: 0,
  goldFlat: 0,
  xpPercent: 0,
  marketplaceCashback: 0,
};

export function stackTalentEffects(unlockedIds: string[]): TalentEffects {
  const stacked = { ...EMPTY_TALENTS };
  const unlocked = new Set(unlockedIds);

  for (const node of SKILL_NODES) {
    if (!unlocked.has(node.id)) continue;
    stacked.arenaHints += node.effect.arenaHints ?? 0;
    stacked.raidDamageFlat += node.effect.raidDamageFlat ?? 0;
    stacked.raidDamagePercent += node.effect.raidDamagePercent ?? 0;
    stacked.raidCritChance += node.effect.raidCritChance ?? 0;
    stacked.goldPercent += node.effect.goldPercent ?? 0;
    stacked.goldFlat += node.effect.goldFlat ?? 0;
    stacked.xpPercent += node.effect.xpPercent ?? 0;
    stacked.marketplaceCashback += node.effect.marketplaceCashback ?? 0;
  }

  return stacked;
}

export function summarizeTalents(effects: TalentEffects): string[] {
  const lines: string[] = [];
  if (effects.arenaHints > 0) lines.push(`${effects.arenaHints} arena hint line${effects.arenaHints === 1 ? "" : "s"}`);
  if (effects.raidDamageFlat > 0) lines.push(`+${effects.raidDamageFlat} raid damage`);
  if (effects.raidDamagePercent > 0) lines.push(`+${effects.raidDamagePercent}% raid damage`);
  if (effects.raidCritChance > 0) lines.push(`${effects.raidCritChance}% raid crit chance`);
  if (effects.goldPercent > 0) lines.push(`+${effects.goldPercent}% gold drops`);
  if (effects.goldFlat > 0) lines.push(`+${effects.goldFlat} gold per payout`);
  if (effects.xpPercent > 0) lines.push(`+${effects.xpPercent}% combat XP`);
  if (effects.marketplaceCashback > 0) lines.push(`${effects.marketplaceCashback}% marketplace cashback`);
  return lines;
}

export function applyGold(base: number, effects: TalentEffects): number {
  return Math.max(0, Math.round(base * (1 + effects.goldPercent / 100) + effects.goldFlat));
}

export function applyXp(base: number, effects: TalentEffects): number {
  return Math.max(0, Math.round(base * (1 + effects.xpPercent / 100)));
}

export function previewRaidDamage(
  attackType: RaidAttackType,
  effects: TalentEffects,
  weaknessBonus = false
): number {
  const base = raidDamage(attackType, weaknessBonus);
  return Math.round((base + effects.raidDamageFlat) * (1 + effects.raidDamagePercent / 100));
}

export function resolveRaidAttack(
  attackType: RaidAttackType,
  effects: TalentEffects,
  weaknessBonus = false,
  rng: () => number = Math.random
): { damage: number; crit: boolean; base: number } {
  const base = raidDamage(attackType, weaknessBonus);
  let damage = previewRaidDamage(attackType, effects, weaknessBonus);
  const crit = effects.raidCritChance > 0 && rng() < effects.raidCritChance / 100;
  if (crit) damage = Math.round(damage * 1.5);
  return { damage, crit, base };
}

export function hintsForChallenge(challengeId: string, effects: TalentEffects): string[] {
  if (effects.arenaHints <= 0) return [];
  const bank = ARENA_HINTS[challengeId] ?? [];
  return bank.slice(0, effects.arenaHints);
}

export function talentPayload(effects: TalentEffects) {
  return {
    ...effects,
    summary: summarizeTalents(effects),
  };
}

export async function loadTalentEffects(userEmail: string | null | undefined): Promise<TalentEffects> {
  if (!userEmail) return EMPTY_TALENTS;
  try {
    const rows = await db.select().from(userSkillsTable).where(eq(userSkillsTable.userId, userEmail));
    return stackTalentEffects(rows.map((row) => row.skillId));
  } catch (error) {
    console.error("loadTalentEffects error:", error);
    return EMPTY_TALENTS;
  }
}
