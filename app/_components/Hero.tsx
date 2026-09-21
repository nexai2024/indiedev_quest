"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Sparkles, Flame, Shield, Award, Users, ShoppingBag, Swords, GitBranch, ArrowRight, Zap, Target } from "lucide-react";

function Hero() {
  return (
    <div className="w-full relative min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background Hero Graphic */}
      <Image
        src="/hero.gif"
        alt="indiedev.quest background"
        width={1400}
        height={1400}
        className="w-full h-full object-cover absolute inset-0 opacity-25 pointer-events-none filter saturate-150"
      />

      {/* Radial Gradient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full text-center space-y-8 mt-8">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 font-game text-xl shadow-lg shadow-yellow-500/10">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" /> WELCOME TO indiedev.quest
        </div>

        <h1
          className="font-bold text-6xl sm:text-7xl md:text-8xl font-game tracking-wider text-yellow-400 leading-none"
          style={{
            textShadow: "4px 4px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 0 20px var(--brand-glow)"
          }}
        >
          THE RPG JOURNEY FOR INDIE HACKERS
        </h1>

        <p className="font-game text-2xl md:text-3xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
          Transform the solo indie hacker grind into an interactive collaborative leveling system. Complete milestone Quests, showcase proof in the Vault, book 1-on-1 Mentors, and trade digital assets!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-5 pt-2">
          <Link href="/onboarding">
            <Button className="font-game text-3xl px-10 py-7 text-yellow-300 shadow-xl shadow-yellow-500/20" variant="pixel">
              <Flame className="mr-2 w-7 h-7 text-yellow-400 animate-bounce" /> CREATE YOUR HERO
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="font-game text-3xl px-10 py-7 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" variant="outline">
              ENTER GUILD HALL 🛡️
            </Button>
          </Link>
        </div>

        {/* Live Platform Stats Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-center font-mono">
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl">
            <div className="text-3xl font-bold text-yellow-400 font-game">1,420+</div>
            <div className="text-xs text-gray-400 mt-1">QUESTS SHIPPED</div>
          </div>
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl">
            <div className="text-3xl font-bold text-amber-400 font-game">$85,000+</div>
            <div className="text-xs text-gray-400 mt-1">MARKETPLACE VOLUME</div>
          </div>
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl">
            <div className="text-3xl font-bold text-indigo-400 font-game">34 ACTIVE</div>
            <div className="text-xs text-gray-400 mt-1">GUILD COHORTS</div>
          </div>
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl">
            <div className="text-3xl font-bold text-emerald-400 font-game">98.4%</div>
            <div className="text-xs text-gray-400 mt-1">MVP LAUNCH RATE</div>
          </div>
        </div>

        {/* RPG Modules Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-left font-mono text-xs">
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-yellow-500/40 transition-all space-y-1">
            <div className="text-yellow-400 font-bold flex items-center gap-1.5 font-game text-lg">
              <Flame className="w-5 h-5" /> Quest Log
            </div>
            <p className="text-gray-400">Main quests for shipping MVPs and MRR milestones.</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-indigo-500/40 transition-all space-y-1">
            <div className="text-indigo-400 font-bold flex items-center gap-1.5 font-game text-lg">
              <Award className="w-5 h-5" /> Proof Vault
            </div>
            <p className="text-gray-400">Showcase PRs, live links, and Loom videos with peer review.</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5 font-game text-lg">
              <Users className="w-5 h-5" /> Mentorship
            </div>
            <p className="text-gray-400">Book 1-on-1 code reviews and pairing with Guildmasters.</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/40 transition-all space-y-1">
            <div className="text-purple-400 font-bold flex items-center gap-1.5 font-game text-lg">
              <ShoppingBag className="w-5 h-5" /> Marketplace
            </div>
            <p className="text-gray-400">Monetize digital assets, starters, and component libraries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
