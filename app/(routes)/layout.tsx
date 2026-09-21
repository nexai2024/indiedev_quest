import { loadCharacter } from "@/lib/character";
import { hasCompletedOnboarding } from "@/lib/user-profile";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function GuildLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const profile = await loadCharacter(user);
  if (!hasCompletedOnboarding(profile)) {
    redirect("/onboarding");
  }

  return children;
}
