"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Swords, ShieldAlert, Coins, Crosshair, Users, Activity } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface RaidInfo {
  id: number;
  bossName: string;
  description: string;
  maxHp: number;
  currentHp: number;
  goldReward: number;
  xpReward: number;
  status: string;
}

interface Contribution {
  id: number;
  userName: string;
  damage: number;
  createdAt: string;
}

export default function RaidsPage() {
  const [raid, setRaid] = useState<RaidInfo | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [totalGuildDamage, setTotalGuildDamage] = useState(0);
  const [activeRaidersCount, setActiveRaidersCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAttackOpen, setIsAttackOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [attacking, setAttacking] = useState(false);

  useEffect(() => {
    fetchRaidData();
    const interval = setInterval(() => {
      fetchRaidData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRaidData = async () => {
    try {
      const res = await axios.get("/api/raids");
      setRaid(res.data.raid);
      setContributions(res.data.contributions || []);
      setTotalGuildDamage(res.data.totalGuildDamage || 0);
      setActiveRaidersCount(res.data.activeRaidersCount || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttackBoss = async (attackType: "SPELL" | "CRITICAL") => {
    if (!raid) return;
    setAttacking(true);
    try {
      const res = await axios.post("/api/raids", {
        raidId: raid.id,
        proofUrl,
        attackType
      });

      if (res.data.success) {
        toast.success(`⚔️ ${res.data.message || `Hit for -${res.data.damage} HP!`}`);
        setIsAttackOpen(false);
        setProofUrl("");
        fetchRaidData();
      }
    } catch (err) {
      toast.error("Raid attack failed");
    } finally {
      setAttacking(false);
    }
  };

  const hpPercentage = raid ? Math.max(0, Math.round((raid.currentHp / raid.maxHp) * 100)) : 100;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 p-8 rounded-2xl border border-red-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-game mb-2">
            <Swords className="w-4 h-4 text-red-400 animate-pulse" /> NET NEW FEATURE 1: REAL-TIME CO-OP GUILD BOSS RAIDS
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            INTERACTIVE BOSS RAID
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Team up with your Guild Cohort in live real-time damage streams to defeat timed Bosses!
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs bg-neutral-900 p-3 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Users className="w-4 h-4" /> {activeRaidersCount} ACTIVE RAIDERS
          </div>
          <div className="text-gray-500">|</div>
          <div className="text-yellow-400 font-bold">
            ⚡ {totalGuildDamage} TOTAL GUILD DAMAGE
          </div>
        </div>
      </div>

      {/* Main Boss Card */}
      {raid && (
        <Card className="bg-neutral-900 border-2 border-red-500/40 p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-red-500">
            <ShieldAlert className="w-64 h-64" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <Badge variant="pixel" className="bg-red-500/20 text-red-400 border-red-500/40 text-sm">
                  {raid.status === "ACTIVE" ? "ACTIVE BOSS RAID ⚔️" : "BOSS DEFEATED 🏆"}
                </Badge>
                <div className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                  <Coins className="w-4 h-4" /> Shared Raid Bounty: {raid.goldReward} Gold / {raid.xpReward} XP
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-game font-bold text-red-400 tracking-wide">
                {raid.bossName}
              </h2>

              <p className="text-gray-300 text-sm leading-relaxed">{raid.description}</p>

              {/* Boss HP Bar */}
              <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Activity className="w-4 h-4" /> BOSS HEALTH POINTS (HP)
                  </span>
                  <span className="text-white font-bold">
                    {raid.currentHp} / {raid.maxHp} HP ({hpPercentage}%)
                  </span>
                </div>
                <Progress value={hpPercentage} className="h-4 bg-neutral-900 border border-red-500/30" />
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              <Button
                variant="pixel"
                className="font-game text-2xl py-7 px-8 text-yellow-300 border-red-500 shadow-red-900/50"
                onClick={() => setIsAttackOpen(true)}
                disabled={raid.status !== "ACTIVE"}
              >
                <Crosshair className="mr-2 w-6 h-6 text-red-400" /> ATTACK BOSS (-150 HP)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Combat Activity Log */}
      <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
        <h3 className="font-game text-2xl text-yellow-400 flex items-center gap-2">
          <Activity className="w-5 h-5" /> REAL-TIME BATTLE DAMAGE STREAM
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
          {contributions.map((c) => (
            <div key={c.id} className="p-3 bg-neutral-950 rounded border border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <Users className="w-4 h-4 text-red-400" />
                <span className="font-bold text-yellow-400">{c.userName}</span> cast Code Strike!
              </div>
              <div className="text-red-400 font-bold text-sm">-{c.damage} HP</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ATTACK MODAL */}
      <Dialog open={isAttackOpen} onOpenChange={setIsAttackOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-red-500 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-red-400 flex items-center gap-2">
              <Crosshair className="w-6 h-6" /> EXECUTE RAID ATTACK
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Submit code snippet, PR link, or execute a Class Spell to deal damage to <span className="text-red-400 font-bold">{raid?.bossName}</span>!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-mono text-red-400 uppercase block mb-1">
                Proof of Bug Fix / Code Strike URL (Optional)
              </label>
              <Input
                placeholder="https://github.com/yourusername/bug-fix-pr"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="pixel"
                className="font-game text-xl py-6"
                onClick={() => handleAttackBoss("SPELL")}
                disabled={attacking}
              >
                CLASS SPELL (-150 HP)
              </Button>
              <Button
                variant="outline"
                className="font-game text-xl py-6 border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => handleAttackBoss("CRITICAL")}
                disabled={attacking}
              >
                CRITICAL STRIKE (-250 HP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
