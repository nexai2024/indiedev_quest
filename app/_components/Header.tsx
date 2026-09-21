"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Flame, Shield, Award, Users, ShoppingBag, Swords, GitBranch, Radio, Sparkles, Crown, Trophy, BookOpen } from "lucide-react";
import ColorSchemePicker from "@/components/ColorSchemePicker";
import PlayerHud from "@/components/PlayerHud";

function Header({ onboarded = false }: { onboarded?: boolean }) {
  const path = usePathname();

  const NAV_ITEMS = [
    { label: "Quests", href: "/quests", icon: Flame, color: "text-yellow-400" },
    { label: "Vault", href: "/vault", icon: Award, color: "text-indigo-400" },
    { label: "Mentors", href: "/mentorship", icon: Users, color: "text-amber-400" },
    { label: "Market", href: "/marketplace", icon: ShoppingBag, color: "text-purple-400" },
    { label: "Arena", href: "/arena", icon: Swords, color: "text-red-400" },
    { label: "Raids", href: "/raids", icon: Shield, color: "text-red-500" },
    { label: "Hacks", href: "/hackathons", icon: Trophy, color: "text-amber-400" },
    { label: "Learn", href: "/courses", icon: BookOpen, color: "text-indigo-300" },
    { label: "Skills", href: "/skill-tree", icon: GitBranch, color: "text-emerald-400" },
    { label: "Tavern", href: "/tavern", icon: Radio, color: "text-amber-300" }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/80 border-b border-yellow-500/20 shadow-lg shadow-black/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Brand Logo */}
        <Link href={onboarded ? "/" : "/onboarding"} className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-700 shadow-md shadow-yellow-500/20 group-hover:scale-110 transition-transform">
            <Crown className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <h1 className="font-bold text-3xl font-game tracking-wider text-yellow-400 drop-shadow-[0_2px_8px_var(--brand-glow)]">
              indiedev.quest
            </h1>
            <div className="text-[10px] font-mono text-gray-400 -mt-1 tracking-widest uppercase">
              RPG Indie Hacker Guild
            </div>
          </div>
        </Link>

        {/* Navigation Bar */}
        {onboarded && (
          <Show when="signed-in">
            <nav className="flex flex-wrap justify-center gap-1.5 md:gap-3 items-center font-game text-lg bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      path === item.href || path.startsWith(`${item.href}/`)
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
          </Show>
        )}

        {/* Auth CTA */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ColorSchemePicker />
          <Show when="signed-out">
            <SignInButton>
              <Button variant="outline" className="font-game text-xl px-5 py-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="pixel" className="font-game text-xl px-5 py-2">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            {onboarded ? (
              <Link href="/dashboard">
                <Button variant="pixel" className="font-game text-xl px-5 py-2 shadow-yellow-500/20">
                  <Sparkles className="mr-1.5 w-4 h-4 text-neutral-950" /> Guild Hall
                </Button>
              </Link>
            ) : (
              <Link href="/onboarding">
                <Button variant="pixel" className="font-game text-xl px-5 py-2 shadow-yellow-500/20">
                  <Sparkles className="mr-1.5 w-4 h-4 text-neutral-950" /> Create Hero
                </Button>
              </Link>
            )}
            {onboarded && <PlayerHud />}
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}

export default Header;
