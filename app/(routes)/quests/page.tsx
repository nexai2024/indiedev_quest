"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Sparkles, CheckCircle2, Clock, Upload, Coins, Award, ArrowUpRight, Flame } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface QuestItem {
  id: number;
  questId: string;
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  levelReq: number;
  category: string;
  requirements?: string;
  userStatus: "AVAILABLE" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED";
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuest, setSelectedQuest] = useState<QuestItem | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await axios.get("/api/quests");
      setQuests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (questId: string) => {
    try {
      await axios.post("/api/quests", { questId, action: "ACCEPT" });
      toast.success("Quest Accepted! Added to active Quest Log.");
      fetchQuests();
    } catch (err) {
      toast.error("Failed to accept quest");
    }
  };

  const handleSubmitProof = async () => {
    if (!proofUrl) {
      toast.error("Please enter a valid proof URL (GitHub PR, Loom, or Live demo link)");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/submissions", {
        questId: selectedQuest?.questId,
        questTitle: selectedQuest?.title,
        proofUrl,
        notes
      });
      toast.success("Proof of Work submitted into the Vault! Guild reviewers notified.");
      setIsSubmitOpen(false);
      setProofUrl("");
      setNotes("");
      fetchQuests();
    } catch (err) {
      toast.error("Failed to submit proof");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (activeTab === "all") return true;
    if (activeTab === "main") return q.category.toLowerCase() === "main";
    if (activeTab === "side") return q.category.toLowerCase() === "side";
    if (activeTab === "completed") return q.userStatus === "COMPLETED";
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-yellow-950/30 p-8 rounded-2xl border border-yellow-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-game mb-2">
            <Flame className="w-4 h-4 text-yellow-400" /> QUEST LOG & MILESTONES
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            ACTIVE QUEST BOARD
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Accept structured indie hacker quests, submit proof of work, and level up your stack.
          </p>
        </div>
        <Button variant="pixel" className="font-game text-2xl px-6 py-6" onClick={() => (window.location.href = "/vault")}>
          <Award className="mr-2 w-5 h-5 text-yellow-400" /> VIEW VAULT SHOWROOM
        </Button>
      </div>

      {/* Tabs Filter */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg gap-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            ALL QUESTS
          </TabsTrigger>
          <TabsTrigger value="main" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            MAIN QUESTS
          </TabsTrigger>
          <TabsTrigger value="side" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            SIDE QUESTS
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            COMPLETED
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quest Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuests.map((quest) => {
          const isCompleted = quest.userStatus === "COMPLETED";
          const isUnderReview = quest.userStatus === "UNDER_REVIEW";
          const isInProgress = quest.userStatus === "IN_PROGRESS";

          return (
            <Card
              key={quest.questId}
              className={`bg-neutral-900 border-2 transition-all duration-200 flex flex-col justify-between ${
                isCompleted
                  ? "border-emerald-500/50 bg-emerald-950/10"
                  : isUnderReview
                  ? "border-amber-500/50 bg-amber-950/10"
                  : isInProgress
                  ? "border-yellow-400 shadow-md shadow-yellow-500/5"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="pixel" className="text-xs">
                    {quest.category.toUpperCase()} QUEST
                  </Badge>
                  <Badge
                    className={`font-mono text-xs ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : isUnderReview
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : isInProgress
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-neutral-800 text-gray-400"
                    }`}
                  >
                    {isCompleted ? "COMPLETED ✓" : isUnderReview ? "UNDER REVIEW ⏳" : isInProgress ? "IN PROGRESS ⚡" : "AVAILABLE"}
                  </Badge>
                </div>
                <CardTitle className="font-game text-2xl text-white">{quest.title}</CardTitle>
                <CardDescription className="text-gray-300 text-sm leading-relaxed">
                  {quest.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                    <Sparkles className="w-4 h-4" /> +{quest.xpReward} XP
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Coins className="w-4 h-4" /> +{quest.goldReward} Gold
                  </div>
                  <div className="text-gray-400">Lvl Req: {quest.levelReq}</div>
                </div>

                {quest.requirements && (
                  <div className="text-xs text-gray-400 font-mono italic">
                    📌 Req: {quest.requirements}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2">
                {isCompleted ? (
                  <Button disabled className="w-full font-game text-xl bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="mr-2 w-5 h-5" /> REWARD CLAIMED
                  </Button>
                ) : isUnderReview ? (
                  <Button disabled className="w-full font-game text-xl bg-amber-900/40 text-amber-400 border border-amber-500/30">
                    <Clock className="mr-2 w-5 h-5 animate-spin" /> UNDER PEER REVIEW
                  </Button>
                ) : isInProgress ? (
                  <Button
                    variant="pixel"
                    className="w-full font-game text-xl py-5"
                    onClick={() => {
                      setSelectedQuest(quest);
                      setIsSubmitOpen(true);
                    }}
                  >
                    <Upload className="mr-2 w-5 h-5 text-yellow-400" /> SUBMIT PROOF OF WORK
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full font-game text-xl py-5 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={() => handleAcceptQuest(quest.questId)}
                  >
                    ACCEPT QUEST 🗡️
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* SUBMISSION MODAL */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-yellow-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-yellow-400 flex items-center gap-2">
              <Upload className="w-6 h-6" /> SUBMIT PROOF OF WORK
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Submitting for: <span className="text-white font-bold">{selectedQuest?.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-mono text-yellow-400 uppercase block mb-1">
                Proof URL (GitHub Repo / PR, Loom Video, or Live Link) *
              </label>
              <Input
                placeholder="https://github.com/yourusername/project-repo"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 uppercase block mb-1">
                Notes for Guild Reviewers / Mentors
              </label>
              <Textarea
                placeholder="Describe your architecture choices, key features, or challenges solved..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white h-24"
              />
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono text-gray-400 flex justify-between">
              <div>Pending Rewards on Approval:</div>
              <div className="text-yellow-400 font-bold">
                +{selectedQuest?.xpReward} XP / +{selectedQuest?.goldReward} Gold
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="font-game text-lg" onClick={() => setIsSubmitOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="pixel"
              className="font-game text-2xl px-6"
              onClick={handleSubmitProof}
              disabled={submitting}
            >
              {submitting ? "DEPOSITING..." : "DEPOSIT IN VAULT 🚀"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
