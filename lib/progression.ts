export const XP_PER_LEVEL = 300;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  percent: number;
} {
  const safeXp = Math.max(0, xp);
  const level = levelFromXp(safeXp);
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  const percent = Math.min(100, Math.round((xpIntoLevel / XP_PER_LEVEL) * 100));
  return { level, xpIntoLevel, xpToNext, percent };
}
