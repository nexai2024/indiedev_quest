"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Sparkles, Award, Lock, CheckCircle2, Shield, Zap, Bot, Coins } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface SkillNode {
  id: string;
  tree: string;
  title: string;
  desc: string;
  cost: number;
  req: string | null;
}

export default function SkillTreePage() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(2);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillTree();
  }, []);

  const fetchSkillTree = async () => {
    try {
      const res = await axios.get("/api/skill-tree");
      setNodes(res.data.nodes || []);
      setUnlockedIds(res.data.unlockedIds || []);
      setTalentPoints(res.data.talentPoints ?? 2);
      setLevel(res.data.level ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockNode = async (node: SkillNode) => {
    if (unlockedIds.includes(node.id)) {
      toast.info("Skill node already unlocked!");
      return;
    }
    if (node.req && !unlockedIds.includes(node.req)) {
      toast.error(`Prerequisite node required: Unlock prerequisite skill first!`);
      return;
    }
    if (talentPoints < node.cost) {
      toast.error("Insufficient Talent Points! Level up by completing quests.");
      return;
    }

    try {
      const res = await axios.post("/api/skill-tree", { skillId: node.id });
      if (res.data.success) {
        toast.success(`✨ UNLOCKED TALENT: ${node.title}! ${node.desc}`);
        fetchSkillTree();
      } else {
        toast.error(res.data.message || "Failed to unlock");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unlock transaction failed");
    }
  };

  const trees = ["Frontend Arcana", "Backend Alchemy", "AI Sorcery", "Monetization Bard"];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/40 p-8 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-game mb-2">
            <GitBranch className="w-4 h-4 text-emerald-400" /> NET NEW FEATURE 4: DEVELOPER SKILL TREE & TALENT MATRIX
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            TALENT SKILL TREE
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Spend earned Talent Points to unlock passive perks, profile titles, and marketplace discounts.
          </p>
        </div>

        <div className="bg-neutral-900 p-4 rounded-xl border border-emerald-500/40 font-mono text-center shrink-0">
          <div className="text-xs text-gray-400">AVAILABLE TALENT POINTS</div>
          <div className="text-3xl font-bold text-emerald-400 font-game">{talentPoints} PTS</div>
          <div className="text-xs text-yellow-400 mt-0.5">Hero Level: {level}</div>
        </div>
      </div>

      {/* Skill Trees Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {trees.map((treeName) => {
          const treeNodes = nodes.filter((n) => n.tree === treeName);
          return (
            <Card key={treeName} className="bg-neutral-900 border-2 border-neutral-800 p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <h3 className="font-game text-2xl text-yellow-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" /> {treeName.toUpperCase()}
                </h3>
                <Badge variant="pixel" className="text-xs">
                  {treeNodes.filter((n) => unlockedIds.includes(n.id)).length} / {treeNodes.length} UNLOCKED
                </Badge>
              </div>

              <div className="space-y-4">
                {treeNodes.map((node) => {
                  const isUnlocked = unlockedIds.includes(node.id);
                  const isReqMet = !node.req || unlockedIds.includes(node.req);

                  return (
                    <div
                      key={node.id}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                        isUnlocked
                          ? "bg-emerald-950/20 border-emerald-500/60"
                          : isReqMet
                          ? "bg-neutral-950 border-yellow-500/40 hover:border-yellow-400 cursor-pointer"
                          : "bg-neutral-950/50 border-neutral-800 opacity-60"
                      }`}
                      onClick={() => !isUnlocked && isReqMet && handleUnlockNode(node)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-game text-xl text-white font-bold">{node.title}</span>
                          {isUnlocked ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                              UNLOCKED ✓
                            </Badge>
                          ) : !isReqMet ? (
                            <Badge className="bg-neutral-800 text-gray-500 text-xs font-mono">
                              LOCKED 🔒
                            </Badge>
                          ) : (
                            <Badge variant="pixel" className="text-xs">
                              COST: {node.cost} PT
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 font-mono">{node.desc}</p>
                      </div>

                      <div>
                        {isUnlocked ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : isReqMet ? (
                          <Button variant="pixel" size="sm" className="font-game text-lg">
                            UNLOCK
                          </Button>
                        ) : (
                          <Lock className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
