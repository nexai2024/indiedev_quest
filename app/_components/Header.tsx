"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Flame, Shield, Award, Users, ShoppingBag, Swords, GitBranch, Radio, Sparkles, Crown } from "lucide-react";

function Header() {
  const { user } = useUser();
  const path = usePathname();

  const NAV_ITEMS = [
    { label: "Quests", href: "/quests", icon: Flame, color: "text-yellow-400" },
    { label: "Vault", href: "/vault", icon: Award, color: "text-indigo-400" },
    { label: "Mentors", href: "/mentorship", icon: Users, color: "text-amber-400" },
    { label: "Market", href: "/marketplace", icon: ShoppingBag, color: "text-purple-400" },
    { label: "Arena", href: "/arena", icon: Swords, color: "text-red-400" },
    { label: "Raids", href: "/raids", icon: Shield, color: "text-red-500" },
    { label: "Skills", href: "/skill-tree", icon: GitBranch, color: "text-emerald-400" },
    { label: "Tavern", href: "/tavern", icon: Radio, color: "text-amber-300" }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/80 border-b border-yellow-500/20 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-700 shadow-md shadow-yellow-500/20 group-hover:scale-110 transition-transform">
            <Crown className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <h1 className="font-bold text-3xl font-game tracking-wider text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]">
              indiedev.quest
            </h1>
            <div className="text-[10px] font-mono text-gray-400 -mt-1 tracking-widest uppercase">
              RPG Indie Hacker Guild
            </div>
          </div>
        </Link>

        {/* Navigation Bar */}
        <nav className="flex flex-wrap justify-center gap-1.5 md:gap-3 items-center font-game text-lg bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/40 shadow-sm shadow-yellow-500/10"
                    : "text-gray-300 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="pixel" className="font-game text-xl px-5 py-2 shadow-yellow-500/20">
              <Sparkles className="mr-1.5 w-4 h-4 text-neutral-950" /> Guild Hall
            </Button>
          </Link>
          {user && <UserButton />}
        </div>
      </div>
    </header>
  );
}

export default Header;
