export type ClerkIdentity = {
  fullName?: string | null;
  firstName?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export type UserProfile = {
  id?: number;
  email: string;
  name: string;
  username: string;
  role: string;
  characterClass: string;
  primaryGoal: string;
  level: number;
  xp: number;
  gold: number;
  talentPoints: number;
  partyId: number | null;
  avatarUrl: string | null;
  persisted: boolean;
  onboarded: boolean;
};

export function clerkEmail(user: ClerkIdentity): string | null {
  return user.primaryEmailAddress?.emailAddress ?? null;
}

export function clerkDisplayName(user: ClerkIdentity): string {
  const email = clerkEmail(user);
  const fromEmail = email?.split("@")[0];
  return (
    user.fullName?.trim() ||
    user.firstName?.trim() ||
    user.username?.trim() ||
    fromEmail ||
    "Adventurer"
  );
}

export function clerkUsername(user: ClerkIdentity): string {
  const email = clerkEmail(user);
  return user.username?.trim() || email?.split("@")[0] || "adventurer";
}

export function emptyUserProfile(user: ClerkIdentity, persisted = false): UserProfile {
  return {
    email: clerkEmail(user) ?? "",
    name: clerkDisplayName(user),
    username: clerkUsername(user),
    role: "NOVICE",
    characterClass: "",
    primaryGoal: "",
    level: 1,
    xp: 0,
    gold: 0,
    talentPoints: 0,
    partyId: null,
    avatarUrl: user.imageUrl || null,
    persisted,
    onboarded: false,
  };
}

export function hasCompletedOnboarding(user?: {
  characterClass?: string | null;
  primaryGoal?: string | null;
} | null): boolean {
  return Boolean(user?.characterClass?.trim() && user?.primaryGoal?.trim());
}

export function withOnboardingFlag<T extends { characterClass?: string | null; primaryGoal?: string | null }>(
  user: T
): T & { onboarded: boolean } {
  return { ...user, onboarded: hasCompletedOnboarding(user) };
}
