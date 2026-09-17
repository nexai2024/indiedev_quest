"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Shield, Award, Users, ShoppingBag, Swords, GitBranch, Radio, Sparkles, Coins, ArrowRight, CheckCircle2, Crosshair, Crown, Zap, Activity } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [partyInfo, setPartyInfo] = useState<any>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);

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
      setActiveQuests((questRes.data || []).slice(0, 2));
    } catch (err) {
      console.error(err);
    }
  };

  const xpPercentage = profile ? Math.min(100, Math.round(((profile.xp % 300) / 300) * 100)) : 35;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* RPG User Stats Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-3xl border-2 border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pixel" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-sm">
                🛡️ {profile?.characterClass || "Full-Stack Artisan"}
              </Badge>
              <Badge className="bg-neutral-800 text-amber-400 font-mono text-xs border-neutral-700">
                Goal: {profile?.primaryGoal || "Build First SaaS"}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
              HERO HALL: {profile?.name?.toUpperCase() || "ADVENTURER"}
            </h1>
          </div>

          <Link href="/onboarding">
            <Button variant="outline" className="font-game text-xl border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
              ALIGN CLASS / GOAL ⚙️
            </Button>
          </Link>
        </div>

        {/* RPG Stat Counter Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">HERO LEVEL</div>
            <div className="text-3xl font-bold text-yellow-400 font-game">LEVEL {profile?.level || 1}</div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">GOLD CURRENCY</div>
            <div className="text-3xl font-bold text-amber-400 font-game flex items-center gap-1.5">
              <Coins className="w-6 h-6 text-amber-400" /> {profile?.gold || 150}
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">TALENT POINTS</div>
            <div className="text-3xl font-bold text-emerald-400 font-game flex items-center gap-1.5">
              <GitBranch className="w-6 h-6 text-emerald-400" /> {profile?.talentPoints || 1} PTS
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1 shadow-inner">
            <div className="text-xs text-gray-400">GUILD COHORT</div>
            <div className="text-2xl font-bold text-white font-game truncate">
              {partyInfo?.party?.name || "The Code Alchemists"}
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-yellow-400 font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> EXPERIENCE (XP) TO LEVEL {(profile?.level || 1) + 1}
            </span>
            <span className="text-white font-bold">{profile?.xp || 100} XP ({xpPercentage}%)</span>
          </div>
          <Progress value={xpPercentage} className="h-3.5 bg-neutral-900 border border-yellow-500/20" />
        </div>
      </div>

      {/* Main Core Spec Module Shortcuts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/quests">
          <Card className="bg-neutral-900 border-2 border-neutral-800 hover:border-yellow-400 transition-all cursor-pointer h-full p-6 space-y-3 shadow-lg">
            <div className="p-3 bg-yellow-500/10 w-fit rounded-xl border border-yellow-400/30 text-yellow-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-game text-2xl text-white">QUEST LOG</h3>
            <p className="text-xs text-gray-400">Active milestone quests for shipping MVPs and MRR.</p>
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
            <p className="text-xs text-gray-400">Book 1-on-1 code reviews and pairing with Guildmasters.</p>
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

      {/* 5 NET NEW FEATURES LAUNCH PAD */}
      <Card className="bg-neutral-900 border-2 border-red-500/30 p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="pixel" className="bg-red-500/20 text-red-400 border-red-500/30">5 NET NEW RPG ARENAS</Badge>
            <h2 className="text-3xl font-game font-bold text-white mt-1">EXPANDED GUILD MODULES</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
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
        </div>
      </Card>
    </div>
  );
}
