"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Swords, ShieldAlert, Coins, Crosshair, Users, Activity, Bug, Flame, Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

type AttackType = "SPELL" | "DEBUG" | "CRITICAL" | "ULTIMATE";

interface RaidInfo {
  id: number;
  bossName: string;
  description: string;
  maxHp: number;
  currentHp: number;
  goldReward: number;
  xpReward: number;
  status: string;
  slug?: string;
  level?: number;
  weakness?: string;
  phases?: string[];
  attackHints?: Record<AttackType, string>;
}

interface Contribution {
  id: number;
  raidId?: number;
  userName: string;
  damage: number;
  createdAt: string;
}

interface AttackMeta {
  label: string;
  damage: number;
  description: string;
}

const DEFAULT_ATTACKS: Record<AttackType, AttackMeta> = {
  SPELL: { label: "Class Spell", damage: 150, description: "A reliable code strike." },
  DEBUG: { label: "Debug Volley", damage: 180, description: "Bonus vs bug-type bosses." },
  CRITICAL: { label: "Critical Refactor", damage: 250, description: "High damage, high swagger." },
  ULTIMATE: { label: "Ship Ultimate", damage: 400, description: "Heavy hit when the raid is almost over." },
};

const ATTACK_ICONS: Record<AttackType, React.ReactNode> = {
  SPELL: <Sparkles className="w-4 h-4" />,
  DEBUG: <Bug className="w-4 h-4" />,
  CRITICAL: <Flame className="w-4 h-4" />,
  ULTIMATE: <Swords className="w-4 h-4" />,
};

function phaseIndex(raid: RaidInfo): number {
  const phases = raid.phases?.length ? raid.phases : ["Engage", "Break armor", "Finish"];
  const ratio = (raid.currentHp || 0) / Math.max(raid.maxHp || 1, 1);
  if (ratio > 0.66) return 0;
  if (ratio > 0.33) return Math.min(1, phases.length - 1);
  return phases.length - 1;
}

export default function RaidsPage() {
  const [raids, setRaids] = useState<RaidInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [attacks, setAttacks] = useState<Record<AttackType, AttackMeta>>(DEFAULT_ATTACKS);
  const [sseConnected, setSseConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAttackOpen, setIsAttackOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [pendingAttack, setPendingAttack] = useState<AttackType>("SPELL");
  const [attacking, setAttacking] = useState(false);

  const raid = raids.find((r) => r.id === selectedId) ?? raids[0] ?? null;
  const raidContributions = useMemo(
    () => contributions.filter((c) => raid && (c.raidId == null || c.raidId === raid.id)),
    [contributions, raid]
  );
  const totalGuildDamage = raidContributions.reduce((sum, c) => sum + (c.damage || 0), 0);
  const activeRaidersCount = new Set(raidContributions.map((c) => c.userName)).size || 1;

  useEffect(() => {
    fetchRaidData();

    const eventSource = new EventSource("/api/raids/stream");
    eventSource.onopen = () => setSseConnected(true);
    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "RAID_STATUS") {
          fetchRaidData();
        }
      } catch (err) {
        console.error("Raid SSE parse error", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchRaidData = async () => {
    try {
      const res = await axios.get("/api/raids");
      const list: RaidInfo[] = Array.isArray(res.data.raids)
        ? res.data.raids
        : res.data.raid
          ? [res.data.raid]
          : [];
      setRaids(list);
      setContributions(res.data.contributions || []);
      if (res.data.attacks) setAttacks(res.data.attacks);
      setSelectedId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        const active = list.find((item) => item.status === "ACTIVE");
        return active?.id ?? list[0]?.id ?? null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAttack = (attackType: AttackType) => {
    setPendingAttack(attackType);
    setIsAttackOpen(true);
  };

  const handleAttackBoss = async (attackType: AttackType) => {
    if (!raid) return;
    setAttacking(true);
    try {
      const res = await axios.post("/api/raids", {
        raidId: raid.id,
        proofUrl,
        attackType,
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
  const currentPhase = raid ? phaseIndex(raid) : 0;
  const phases = raid?.phases?.length ? raid.phases : ["Engage", "Break armor", "Finish"];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-red-950/40 p-8 rounded-2xl border border-red-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-game mb-2">
            <Swords className="w-4 h-4 text-red-400 animate-pulse" /> INTERACTIVE GUILD RAID ROSTER
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            INTERACTIVE BOSS RAID
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            {raids.length} bosses in the dungeon. Stream: {sseConnected ? "LIVE ⚡" : "CONNECTING..."}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs bg-neutral-900 p-3 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Users className="w-4 h-4" /> {activeRaidersCount} RAIDERS ON TARGET
          </div>
          <div className="text-gray-500">|</div>
          <div className="text-yellow-400 font-bold">⚡ {totalGuildDamage} TARGET DAMAGE</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
        {raids.map((boss) => {
          const pct = Math.max(0, Math.round((boss.currentHp / boss.maxHp) * 100));
          const selected = raid?.id === boss.id;
          return (
            <button
              key={boss.id}
              type="button"
              onClick={() => setSelectedId(boss.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected ? "border-red-400 bg-red-500/10" : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-game text-lg text-white leading-tight">{boss.bossName}</span>
                <Badge className="font-mono text-[10px] shrink-0">
                  {boss.status === "ACTIVE" ? `LV ${boss.level ?? "?"}` : "SLAIN"}
                </Badge>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>{boss.weakness || "Unknown weakness"}</span>
                  <span className="text-red-400">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2 bg-neutral-950" />
              </div>
            </button>
          );
        })}
      </div>

      {raid && (
        <Card className="bg-neutral-900 border-2 border-red-500/40 p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-red-500">
            <ShieldAlert className="w-64 h-64" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10">
            <div className="space-y-4 max-w-2xl w-full">
              <div className="flex flex-wrap items-center gap-3">
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
              <p className="text-xs font-mono text-yellow-400">Weakness: {raid.weakness || "Clean code"}</p>

              <div className="grid sm:grid-cols-3 gap-2">
                {phases.map((phase, index) => (
                  <div
                    key={phase}
                    className={`p-3 rounded-lg border text-xs font-mono ${
                      index === currentPhase
                        ? "border-red-400 bg-red-500/15 text-white"
                        : index < currentPhase
                          ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                          : "border-neutral-800 bg-neutral-950 text-gray-500"
                    }`}
                  >
                    <div className="uppercase tracking-wide mb-1">
                      {index === currentPhase ? "CURRENT PHASE" : index < currentPhase ? "CLEARED" : "LOCKED"}
                    </div>
                    {phase}
                  </div>
                ))}
              </div>

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

            <div className="grid grid-cols-2 gap-3 w-full lg:w-80 shrink-0">
              {(Object.keys(attacks) as AttackType[]).map((type) => (
                <Button
                  key={type}
                  variant={type === "ULTIMATE" ? "pixel" : "outline"}
                  className="font-game text-lg py-7 flex flex-col h-auto"
                  onClick={() => openAttack(type)}
                  disabled={raid.status !== "ACTIVE"}
                >
                  <span className="flex items-center gap-1">
                    {ATTACK_ICONS[type]} {attacks[type].label}
                  </span>
                  <span className="text-[10px] font-mono text-red-300">-{attacks[type].damage} HP</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!loading && raids.length === 0 && (
        <Card className="bg-neutral-900 border-neutral-800 p-8 text-center text-gray-400 font-game text-xl">
          No raid bosses in the dungeon yet.
        </Card>
      )}

      <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
        <h3 className="font-game text-2xl text-yellow-400 flex items-center gap-2">
          <Activity className="w-5 h-5" /> REAL-TIME BATTLE DAMAGE STREAM
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
          {raidContributions.length === 0 ? (
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-gray-500">
              No strikes on this boss yet. Open an attack and land the first hit.
            </div>
          ) : (
            raidContributions.map((c) => (
              <div key={c.id} className="p-3 bg-neutral-950 rounded border border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white">
                  <Users className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-yellow-400">{c.userName}</span> struck the boss!
                </div>
                <div className="text-red-400 font-bold text-sm">-{c.damage} HP</div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={isAttackOpen} onOpenChange={setIsAttackOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-red-500 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-red-400 flex items-center gap-2">
              <Crosshair className="w-6 h-6" /> {attacks[pendingAttack].label.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              {attacks[pendingAttack].description} Target:{" "}
              <span className="text-red-400 font-bold">{raid?.bossName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <p className="text-xs font-mono text-yellow-400 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              Hint: {raid?.attackHints?.[pendingAttack] || "Hit the weakness with a clean patch."}
            </p>
            <div>
              <label className="text-xs font-mono text-red-400 uppercase block mb-1">
                Proof of Bug Fix / Code Strike URL (Optional — +15% vs weakness)
              </label>
              <Input
                placeholder="https://github.com/yourusername/bug-fix-pr"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <Button
              variant="pixel"
              className="w-full font-game text-xl py-6"
              onClick={() => handleAttackBoss(pendingAttack)}
              disabled={attacking}
            >
              <Crosshair className="mr-2 w-5 h-5 text-red-400" />{" "}
              {attacking ? "CASTING..." : `DEAL -${attacks[pendingAttack].damage} HP`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
