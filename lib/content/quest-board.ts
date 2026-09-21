export function pinRank(status: string): number {
  if (status === "IN_PROGRESS") return 0;
  if (status === "UNDER_REVIEW") return 1;
  if (status === "COMPLETED") return 3;
  return 2;
}

export function pinActiveQuests<T extends { userStatus: string }>(quests: T[]): T[] {
  return [...quests].sort((a, b) => pinRank(a.userStatus) - pinRank(b.userStatus));
}
