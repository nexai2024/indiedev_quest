"use client";

import { UserDetailContext } from "@/context/UserDetailContext";
import { xpProgress } from "@/lib/progression";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect } from "react";

type HudUser = {
  name?: string | null;
  level?: number | null;
  xp?: number | null;
  gold?: number | null;
  avatarUrl?: string | null;
};

export default function PlayerHud() {
  const { user, isSignedIn } = useUser();
  const { userDetail, setUserDetail } = useContext(UserDetailContext) as {
    userDetail?: HudUser;
    setUserDetail: (value: HudUser) => void;
  };
  const pathname = usePathname();

  useEffect(() => {
    if (!isSignedIn) return;
    axios
      .get("/api/user")
      .then((res) => setUserDetail(res.data))
      .catch(() => {});
  }, [isSignedIn, pathname, setUserDetail]);

  if (!isSignedIn || !user) return null;

  const xp = userDetail?.xp ?? 0;
  const gold = userDetail?.gold ?? 0;
  const progress = xpProgress(xp);
  const level = userDetail?.level ?? progress.level;
  const name = userDetail?.name || user.fullName || user.firstName || "Hero";
  const imageUrl = user.imageUrl || userDetail?.avatarUrl || "";
  const initial = name.trim().charAt(0).toUpperCase() || "H";

  return (
    <Link
      href="/settings"
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-yellow-500/30 bg-neutral-900/90 px-2 py-1.5 pr-3 hover:border-yellow-400/70"
      title={`${progress.xpIntoLevel}/${300} XP to level ${level + 1}`}
    >
      {imageUrl ? (
        // Clerk hosted avatars are arbitrary domains; img avoids next/image remote config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="size-9 shrink-0 rounded-full border border-yellow-500/40 object-cover"
        />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/20 font-game text-lg text-yellow-300">
          {initial}
        </div>
      )}
      <div className="min-w-0 hidden sm:block">
        <div className="flex items-center gap-2 font-mono text-[11px] leading-none">
          <span className="text-yellow-400 font-bold">LV {level}</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Coins className="size-3" />
            {gold}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full bg-yellow-400" style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-gray-400">
          <Sparkles className="size-3 text-yellow-400" />
          {progress.xpIntoLevel}/300 XP
        </div>
      </div>
      <div className="flex flex-col items-end font-mono text-[11px] sm:hidden">
        <span className="text-yellow-400 font-bold">LV {level}</span>
        <span className="text-amber-300">{gold}g</span>
      </div>
    </Link>
  );
}
