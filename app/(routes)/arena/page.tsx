"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Swords, Play, CheckCircle2, ShieldAlert, Sparkles, Coins, Code, Zap, Flame, Terminal } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  testCases: { name: string; expected: string }[];
  xpReward: number;
  goldReward: number;
}

export default function ArenaPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [enemyHp, setEnemyHp] = useState(100);

  useEffect(() => {
    fetchArenaData();
  }, []);

  const fetchArenaData = async () => {
    try {
      const res = await axios.get("/api/arena");
      setChallenges(res.data);
      if (res.data.length > 0) {
        setActiveChallenge(res.data[0]);
        setCode(res.data[0].initialCode);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunCode = async () => {
    if (!activeChallenge) return;
    setRunning(true);
    setLogs(["Compiling TypeScript AST...", "Executing sandbox test runner..."]);
    try {
      const res = await axios.post("/api/arena", {
        challengeId: activeChallenge.id,
        code
      });

      if (res.data.success) {
        setEnemyHp(0);
        setLogs((prev) => [...prev, ...(res.data.logs || ["ALL TESTS PASSED! ✓"])]);
        toast.success(`⚔️ MONSTER DEFEATED! Earned +${activeChallenge.xpReward} XP / +${activeChallenge.goldReward} Gold!`);
      } else {
        setEnemyHp(50);
        setLogs((prev) => [...prev, "❌ Test Failed. Check edge cases and syntax."]);
      }
    } catch (err) {
      toast.error("Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40 p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-game mb-2">
            <Swords className="w-4 h-4 text-indigo-400" /> NET NEW FEATURE 2: IN-BROWSER RPG CODE ARENA
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            THE CODE ARENA
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Battle interactive coding challenges in real-time. Defeat monsters with clean code & earn combat drops.
          </p>
        </div>
      </div>

      {/* Challenge Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {challenges.map((c) => (
          <Button
            key={c.id}
            variant={activeChallenge?.id === c.id ? "pixel" : "outline"}
            className="font-game text-xl py-5 shrink-0"
            onClick={() => {
              setActiveChallenge(c);
              setCode(c.initialCode);
              setEnemyHp(100);
              setLogs([]);
            }}
          >
            ⚔️ {c.title}
          </Button>
        ))}
      </div>

      {activeChallenge && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Challenge Info & Editor */}
          <div className="space-y-4">
            <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="pixel">{activeChallenge.title}</Badge>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-yellow-400 font-bold">+{activeChallenge.xpReward} XP</span>
                  <span className="text-amber-400 font-bold">+{activeChallenge.goldReward} Gold</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{activeChallenge.description}</p>

              <div>
                <label className="text-xs font-mono text-indigo-400 uppercase block mb-2 flex items-center gap-1">
                  <Code className="w-4 h-4" /> TypeScript Code Arena Sandbox
                </label>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-neutral-950 font-mono text-xs text-green-400 h-80 border-neutral-800 focus:border-indigo-500 leading-relaxed p-4"
                />
              </div>

              <Button
                variant="pixel"
                className="w-full font-game text-2xl py-6"
                onClick={handleRunCode}
                disabled={running}
              >
                <Play className="mr-2 w-5 h-5 text-yellow-400" /> {running ? "COMPILING & ATTACKING..." : "RUN TESTS & ATTACK MONSTER ⚔️"}
              </Button>
            </Card>
          </div>

          {/* Right: Enemy Battle Status & Terminal Console */}
          <div className="space-y-4">
            <Card className="bg-neutral-900 border-2 border-indigo-500/40 p-6 space-y-4 text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full border-2 border-indigo-400 flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                <ShieldAlert className="w-10 h-10" />
              </div>

              <h3 className="font-game text-3xl text-white">{activeChallenge.title}</h3>

              <div className="space-y-1 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-left">
                <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                  <span>MONSTER HEALTH</span>
                  <span className="text-indigo-400 font-bold">{enemyHp} / 100 HP</span>
                </div>
                <Progress value={enemyHp} className="h-3 bg-neutral-900" />
              </div>
            </Card>

            {/* Test Console */}
            <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-3 font-mono text-xs">
              <div className="text-yellow-400 font-bold flex items-center gap-2 text-sm font-game">
                <Terminal className="w-4 h-4" /> COMBAT TEST CONSOLE LOGS
              </div>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 h-48 overflow-y-auto space-y-1 text-gray-300">
                {logs.length === 0 ? (
                  <span className="text-gray-500 italic">Ready to run code. Click "RUN TESTS & ATTACK MONSTER" above...</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={log.includes("PASSED") || log.includes("Awarded") ? "text-green-400 font-bold" : "text-gray-300"}>
                      &gt; {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
