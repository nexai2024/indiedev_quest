"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Flame, Shield, Coins, Sparkles, Crown } from "lucide-react";
import axios from "axios";

export default function LeaderboardsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get("/api/leaderboards");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-game mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> LEADERBOARDS & SEASONAL LEAGUES
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            GUILD HALL LEADERBOARD
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            {data?.season || "Season 1"} — {data?.endsInDays || 12} days remaining in current league.
          </p>
        </div>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
        <div className="space-y-3 font-mono text-sm">
          {data?.leaderboard?.map((u: any, idx: number) => (
            <div key={u.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-neutral-800 text-gray-400'}`}>
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {u.name} {idx === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <div className="text-xs text-gray-400">{u.characterClass} • Level {u.level}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 font-bold">
                <span className="text-yellow-400">{u.xp} XP</span>
                <span className="text-amber-500">{u.gold} Gold</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
