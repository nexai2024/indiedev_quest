import { loadCharacter } from "@/lib/character";
import { hasCompletedOnboarding } from "@/lib/user-profile";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Hero from "./_components/Hero";

export default async function Home() {
  const user = await currentUser();
  if (user) {
    const profile = await loadCharacter(user);
    if (!hasCompletedOnboarding(profile)) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Hero />
    </div>
  );
}
