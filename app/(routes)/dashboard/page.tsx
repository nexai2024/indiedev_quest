"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Award, Users, ShoppingBag, Swords, GitBranch, Radio, Sparkles, Coins, Crosshair, ArrowRight, Code, Trophy, BookOpen } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { clerkDisplayName } from "@/lib/user-profile";
import { isCodingQuest } from "@/lib/content/coding-quests";

type DashboardProfile = {
  name?: string | null;
  characterClass?: string | null;
  primaryGoal?: string | null;
  level?: number | null;
  xp?: number | null;
  gold?: number | null;
  talentPoints?: number | null;
};

type PartyInfo = {
  party?: { name?: string | null } | null;
};

type ActiveQuest = {
  questId: string;
  title: string;
  description: string;
  xpReward?: number;
  goldReward?: number;
  userStatus: string;
};

export default function Dashboard() {
  const { user } = useUser();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [activeQuest, setActiveQuest] = useState<ActiveQuest | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userRes = await axios.get("/api/user");
      setProfile(userRes.data);

      const partyRes = await axios.get("/api/guild/party");
      setPartyInfo(partyRes.data);

      const questRes = await axios.get("/api/quests");
      const quests = Array.isArray(questRes.data) ? questRes.data : [];
      const inProgress = quests.find((quest: ActiveQuest) => quest.userStatus === "IN_PROGRESS") ?? null;
      setActiveQuest(inProgress);
    } catch (err) {
      console.error(err);
    }
  };

  const heroName = profile?.name || (user ? clerkDisplayName(user) : "Adventurer");
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const gold = profile?.gold ?? 0;
  const talentPoints = profile?.talentPoints ?? 0;
  const characterClass = profile?.characterClass || "Unassigned";
  const primaryGoal = profile?.primaryGoal || "Set a goal";
  const partyName = partyInfo?.party?.name || "No party yet";
  const xpPercentage = Math.min(100, Math.round(((xp % 300) / 300) * 100));

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-3xl border-2 border-yellow-500/30 shadow-[0_0_25px_var(--brand-glow)] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pixel" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-sm">
                🛡️ {characterClass}
              </Badge>
              <Badge className="bg-neutral-800 text-amber-400 font-mono text-xs border-neutral-700">
                Goal: {primaryGoal}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
              HERO HALL: {heroName.toUpperCase()}
            </h1>
          </div>

          <Link href="/onboarding">
            <Button variant="outline" className="font-game text-xl border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
              ALIGN CLASS / GOAL ⚙️
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">HERO LEVEL</div>
            <div className="text-3xl font-bold text-yellow-400 font-game">LEVEL {level}</div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">GOLD CURRENCY</div>
            <div className="text-3xl font-bold text-amber-400 font-game flex items-center gap-1.5">
              <Coins className="w-6 h-6 text-amber-400" /> {gold}
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">TALENT POINTS</div>
            <div className="text-3xl font-bold text-emerald-400 font-game flex items-center gap-1.5">
              <GitBranch className="w-6 h-6 text-emerald-400" /> {talentPoints} PTS
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">GUILD COHORT</div>
            <div className="text-2xl font-bold text-white font-game truncate">
              {partyName}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> EXPERIENCE (XP) TO LEVEL {level + 1}
            </span>
            <span className="text-white font-bold">{xp} XP ({xpPercentage}%)</span>
          </div>
          <Progress value={xpPercentage} className="h-3.5 bg-neutral-900 border border-yellow-500/20" />
        </div>
      </div>

      {activeQuest && (
        <Card className="bg-neutral-900 border-2 border-yellow-500/40 p-6 md:p-8 space-y-4 shadow-[0_0_20px_var(--brand-glow)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <Badge variant="pixel" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                ACTIVE QUEST
              </Badge>
              <h2 className="text-3xl font-game font-bold text-white">{activeQuest.title}</h2>
              <p className="text-sm text-gray-300">{activeQuest.description}</p>
              <p className="text-xs font-mono text-amber-400">
                +{activeQuest.xpReward ?? 0} XP · +{activeQuest.goldReward ?? 0} Gold
              </p>
            </div>
            <Button asChild variant="pixel" className="font-game text-xl px-6 py-5">
              <Link
                href={
                  isCodingQuest(activeQuest.questId)
                    ? `/arena?quest=${activeQuest.questId}`
                    : "/quests"
                }
              >
                {isCodingQuest(activeQuest.questId) ? (
                  <>
                    <Code className="mr-2 w-5 h-5 text-neutral-950" /> OPEN CODE LAB
                  </>
                ) : (
                  <>
                    CONTINUE QUEST <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/quests">
          <Card className="bg-neutral-900 border-2 border-neutral-800 hover:border-yellow-400 transition-all cursor-pointer h-full p-6 space-y-3 shadow-lg">
            <div className="p-3 bg-yellow-500/10 w-fit rounded-xl border border-yellow-400/30 text-yellow-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-game text-2xl text-white">QUEST LOG</h3>
            <p className="text-xs text-gray-400">
              {activeQuest ? `In progress: ${activeQuest.title}` : "Accept a quest to start earning XP and gold."}
            </p>
          </Card>
        </Link>

        <Link href="/vault">
          <Card className="bg-neutral-900 border-2 border-neutral-800 hover:border-indigo-400 transition-all cursor-pointer h-full p-6 space-y-3 shadow-lg">
            <div className="p-3 bg-indigo-500/10 w-fit rounded-xl border border-indigo-400/30 text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-game text-2xl text-white">PROOF VAULT</h3>
            <p className="text-xs text-gray-400">Showcase PRs, Loom videos, and live project links.</p>
          </Card>
        </Link>

        <Link href="/mentorship">
          <Card className="bg-neutral-900 border-2 border-neutral-800 hover:border-amber-400 transition-all cursor-pointer h-full p-6 space-y-3 shadow-lg">
            <div className="p-3 bg-amber-500/10 w-fit rounded-xl border border-amber-400/30 text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-game text-2xl text-white">MENTORSHIP</h3>
            <p className="text-xs text-gray-400">Apply with shipped quests. Vetted mentors take escrowed gold or cash.</p>
          </Card>
        </Link>

        <Link href="/marketplace">
          <Card className="bg-neutral-900 border-2 border-neutral-800 hover:border-purple-400 transition-all cursor-pointer h-full p-6 space-y-3 shadow-lg">
            <div className="p-3 bg-purple-500/10 w-fit rounded-xl border border-purple-400/30 text-purple-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-game text-2xl text-white">MARKETPLACE</h3>
            <p className="text-xs text-gray-400">Trade micro-starters, templates, and component libraries.</p>
          </Card>
        </Link>
      </div>

      <Card className="bg-neutral-900 border-2 border-red-500/30 p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="pixel" className="bg-red-500/20 text-red-400 border-red-500/30">GUILD ARENAS</Badge>
            <h2 className="text-3xl font-game font-bold text-white mt-1">EXPANDED GUILD MODULES</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/raids">
            <div className="p-4 rounded-xl bg-neutral-950 border border-red-500/40 hover:bg-neutral-900 hover:border-red-400 transition-all space-y-2">
              <div className="text-red-400 font-bold flex items-center gap-1.5 font-game text-xl">
                <Crosshair className="w-5 h-5" /> 1. Boss Raids
              </div>
              <p className="text-xs text-gray-400">Co-op timed guild raids against Bug Overlords.</p>
            </div>
          </Link>

          <Link href="/arena">
            <div className="p-4 rounded-xl bg-neutral-950 border border-indigo-500/40 hover:bg-neutral-900 hover:border-indigo-400 transition-all space-y-2">
              <div className="text-indigo-400 font-bold flex items-center gap-1.5 font-game text-xl">
                <Swords className="w-5 h-5" /> 2. Code Arena
              </div>
              <p className="text-xs text-gray-400">In-browser interactive coding battle sandbox.</p>
            </div>
          </Link>

          <Link href="/tavern">
            <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/40 hover:bg-neutral-900 hover:border-amber-400 transition-all space-y-2">
              <div className="text-amber-400 font-bold flex items-center gap-1.5 font-game text-xl">
                <Radio className="w-5 h-5" /> 3. Tavern & CLI
              </div>
              <p className="text-xs text-gray-400">Lo-fi audio soundscapes & retro CLI terminal.</p>
            </div>
          </Link>

          <Link href="/skill-tree">
            <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/40 hover:bg-neutral-900 hover:border-emerald-400 transition-all space-y-2">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-game text-xl">
                <GitBranch className="w-5 h-5" /> 4. Skill Tree
              </div>
              <p className="text-xs text-gray-400">Spend Talent Points on node perks & titles.</p>
            </div>
          </Link>

          <Link href="/hackathons">
            <div className="p-4 rounded-xl bg-neutral-950 border border-yellow-500/40 hover:bg-neutral-900 hover:border-yellow-400 transition-all space-y-2">
              <div className="text-yellow-400 font-bold flex items-center gap-1.5 font-game text-xl">
                <Trophy className="w-5 h-5" /> 5. Hackathons
              </div>
              <p className="text-xs text-gray-400">Sponsored ship sprints with cash purses from education partners.</p>
            </div>
          </Link>

          <Link href="/courses">
            <div className="p-4 rounded-xl bg-neutral-950 border border-indigo-500/40 hover:bg-neutral-900 hover:border-indigo-400 transition-all space-y-2">
              <div className="text-indigo-300 font-bold flex items-center gap-1.5 font-game text-xl">
                <BookOpen className="w-5 h-5" /> 6. Academy
              </div>
              <p className="text-xs text-gray-400">Micro-courses with chapter quizzes and a guild exam.</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
