"use client";

import ColorSchemePicker from "@/components/ColorSchemePicker";
import ConnectGitHub from "@/components/ConnectGitHub";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserDetailContext } from "@/context/UserDetailContext";
import { XP_PER_LEVEL, xpProgress } from "@/lib/progression";
import { UserProfile, useUser } from "@clerk/nextjs";
import { Coins, GitBranch, Sparkles } from "lucide-react";
import Link from "next/link";
import { useContext } from "react";

type SettingsUser = {
  name?: string | null;
  characterClass?: string | null;
  primaryGoal?: string | null;
  level?: number | null;
  xp?: number | null;
  gold?: number | null;
  talentPoints?: number | null;
};

export default function SettingsPage() {
  const { user } = useUser();
  const { userDetail } = useContext(UserDetailContext) as { userDetail?: SettingsUser };
  const xp = userDetail?.xp ?? 0;
  const progress = xpProgress(xp);
  const level = userDetail?.level ?? progress.level;
  const gold = userDetail?.gold ?? 0;
  const talentPoints = userDetail?.talentPoints ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-white md:p-12">
      <div>
        <h1 className="font-game text-4xl text-yellow-400">Hero settings</h1>
        <p className="mt-1 font-mono text-sm text-gray-400">
          Avatar and account come from Clerk. Gold, XP, and class are your guild character.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5 border-yellow-500/30 bg-neutral-900 p-6">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="size-16 rounded-full border border-yellow-500/40 object-cover" />
            ) : null}
            <div>
              <div className="font-game text-2xl">{userDetail?.name || user?.fullName || "Adventurer"}</div>
              <div className="font-mono text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[10px] text-gray-400">LEVEL</div>
              <div className="font-game text-2xl text-yellow-400">{level}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[10px] text-gray-400">GOLD</div>
              <div className="flex items-center gap-1 font-game text-2xl text-amber-400">
                <Coins className="size-4" />
                {gold}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[10px] text-gray-400">TALENT</div>
              <div className="flex items-center gap-1 font-game text-2xl text-emerald-400">
                <GitBranch className="size-4" />
                {talentPoints}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="flex items-center gap-1 text-yellow-400">
                <Sparkles className="size-3" /> XP to level {level + 1}
              </span>
              <span>
                {progress.xpIntoLevel}/{XP_PER_LEVEL}
              </span>
            </div>
            <Progress value={progress.percent} className="h-3 bg-neutral-950" />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-gray-300 space-y-2">
            <p className="font-game text-lg text-white">How you level up</p>
            <p>
              Complete quests, Arena tests, and raid hits. Those grant XP. Every {XP_PER_LEVEL} XP raises your level by 1 and
              gives 1 talent point.
            </p>
            <p>Gold is separate — spend it in the marketplace. Talent points are spent on the skill tree.</p>
            <p>
              Class: {userDetail?.characterClass || "Unassigned"} · Goal: {userDetail?.primaryGoal || "Not set"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/onboarding">
              <Button variant="outline" className="font-game text-lg">
                Align class / goal
              </Button>
            </Link>
            <Link href="/skill-tree">
              <Button variant="outline" className="font-game text-lg">
                Spend talent
              </Button>
            </Link>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-gray-400">Color scheme</p>
            <ColorSchemePicker />
          </div>

          <ConnectGitHub />
        </Card>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-white">
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
