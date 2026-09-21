export const HERO_CLASS_IDS = [
  "Frontend Specialist",
  "Full-Stack Artisan",
  "AI Builder",
  "Systems Engineer",
] as const;

export const HERO_GOALS = [
  "Ship First MVP in 14 Days",
  "Earn First $100 MRR",
  "Master Next.js & Modern AI Stack",
  "Monetize Micro-Digital Assets",
] as const;

export type HeroClassId = (typeof HERO_CLASS_IDS)[number];
export type HeroGoal = (typeof HERO_GOALS)[number];

export function isHeroClassId(value: unknown): value is HeroClassId {
  return typeof value === "string" && (HERO_CLASS_IDS as readonly string[]).includes(value);
}

export function isHeroGoal(value: unknown): value is HeroGoal {
  return typeof value === "string" && (HERO_GOALS as readonly string[]).includes(value);
}
