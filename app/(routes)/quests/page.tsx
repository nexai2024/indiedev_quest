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
import { Shield, Sparkles, CheckCircle2, Clock, Upload, Coins, Award, ArrowUpRight, Flame, Code } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getHostCoverage, matchExpectedHost, catalogQuestBoard } from "@/lib/content/quest-proof-spec";
import { isCodingQuest } from "@/lib/content/coding-quests";
import { pinActiveQuests } from "@/lib/content/quest-board";
import { applyQuestLog, upsertQuestLog } from "@/lib/quest-log";
import ConnectGitHub from "@/components/ConnectGitHub";

interface ExpectedHost {
  name: string;
  hosts: string[];
  example: string;
}

interface ProofSpec {
  count: number;
  inspectCount?: number;
  kind: string;
  itemLabel: string;
  distinctHosts: boolean;
  criteria: string;
  expectedHosts?: ExpectedHost[];
  labChallengeId?: string;
}

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
  proofSpec?: ProofSpec;
  userStatus: "AVAILABLE" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED";
}

interface ValidationItem {
  url: string;
  passed: boolean;
  reason: string;
  directoryName?: string;
}

interface ValidationReport {
  summary: string;
  items: ValidationItem[];
  allPassed: boolean;
  foundHosts?: string[];
  missingHosts?: string[];
  unrecognizedHosts?: string[];
  repeatedHosts?: string[];
  needsGithubOAuth?: boolean;
  githubAuthenticated?: boolean;
}

export default function QuestsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [quests, setQuests] = useState<QuestItem[]>(() => catalogQuestBoard() as QuestItem[]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedQuest, setSelectedQuest] = useState<QuestItem | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [proofUrls, setProofUrls] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastReport, setLastReport] = useState<ValidationReport | null>(null);

  useEffect(() => {
    setQuests((prev) => applyQuestLog(prev) as QuestItem[]);
    fetchQuests();
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      toast.success("GitHub connected. Resubmit the private repo URL.");
      window.history.replaceState({}, "", "/quests");
    }
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await axios.get("/api/quests", { timeout: 8000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setQuests(applyQuestLog(res.data) as QuestItem[]);
      } else {
        setQuests((prev) => applyQuestLog(prev) as QuestItem[]);
      }
    } catch (err) {
      console.error(err);
      setQuests((prev) => applyQuestLog(prev) as QuestItem[]);
    } finally {
      setLoading(false);
    }
  };

  const markAccepted = (questId: string) => {
    upsertQuestLog(questId, "IN_PROGRESS");
    setQuests((prev) =>
      applyQuestLog(
        prev.map((quest) => (quest.questId === questId ? { ...quest, userStatus: "IN_PROGRESS" as const } : quest))
      ) as QuestItem[]
    );
    setActiveTab("log");
  };

  const handleAcceptQuest = async (questId: string) => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      toast.error("Sign in to accept a quest.");
      openSignIn();
      return;
    }
    try {
      await axios.post("/api/quests", { questId, action: "ACCEPT" });
      toast.success("Quest accepted. Added to your log.");
      markAccepted(questId);
      await fetchQuests();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Sign in to accept a quest.");
        openSignIn();
        return;
      }
      markAccepted(questId);
      toast.success("Quest saved to your log.");
    }
  };

  const handleSubmitProof = async () => {
    const spec = selectedQuest?.proofSpec;
    const needed = spec?.count ?? 1;
    const urls = proofUrls.map((url) => url.trim()).filter(Boolean);
    if (urls.length !== needed) {
      toast.error(`This quest needs ${needed} ${spec?.itemLabel.toLowerCase() || "proof URL"}${needed === 1 ? "" : "s"}.`);
      if (spec?.expectedHosts?.length) {
        const coverage = getHostCoverage(urls, spec.expectedHosts);
        setLastReport({
          summary: `This quest needs ${needed} listings. You submitted ${urls.length}. Still needed: ${coverage.missingHosts.join(", ")}.`,
          items: urls.map((url) => ({
            url,
            passed: false,
            reason: `Need exactly ${needed} unique URLs.`,
            directoryName: matchExpectedHost(url, spec.expectedHosts)?.name,
          })),
          allPassed: false,
          ...coverage,
        });
      }
      return;
    }
    setSubmitting(true);
    setLastReport(null);
    try {
      const res = await axios.post("/api/submissions", {
        questId: selectedQuest?.questId,
        questTitle: selectedQuest?.title,
        proofUrls: urls,
        notes
      });
      const validation = res.data.validation;
      setLastReport(validation);
      if (res.data.success) {
        toast.success(`AI validated all ${needed} deliverables. Rewards granted!`);
        setIsSubmitOpen(false);
        setProofUrls([""]);
        setNotes("");
        fetchQuests();
      } else {
        toast.error(res.data.message || "AI rejected one or more deliverables.");
        fetchQuests();
      }
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      const validation = data && typeof data === "object" && "validation" in data ? data.validation : null;
      if (validation && typeof validation === "object") {
        setLastReport(validation as ValidationReport);
      }
      const message =
        data && typeof data === "object" && "error" in data && data.error
          ? String(data.error)
          : "Failed to submit proof";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmit = (quest: QuestItem) => {
    if (quest.proofSpec?.kind === "code_kata" || isCodingQuest(quest.questId)) {
      if (isSignedIn && quest.userStatus === "AVAILABLE") {
        void handleAcceptQuest(quest.questId);
      }
      window.location.assign(`/arena?quest=${quest.questId}`);
      return;
    }
    const count = quest.proofSpec?.count ?? 1;
    setSelectedQuest(quest);
    setProofUrls(Array.from({ length: count }, () => ""));
    setLastReport(null);
    setIsSubmitOpen(true);
  };

  const logQuests = quests.filter(
    (q) => q.userStatus === "IN_PROGRESS" || q.userStatus === "UNDER_REVIEW"
  );
  const completedQuests = quests.filter((q) => q.userStatus === "COMPLETED");

  const filteredQuests = (() => {
    const next = quests.filter((q) => {
      const category = (q.category || "").toLowerCase();
      if (activeTab === "all") return true;
      if (activeTab === "log") return q.userStatus === "IN_PROGRESS" || q.userStatus === "UNDER_REVIEW";
      if (activeTab === "main") return category === "main";
      if (activeTab === "side") return category === "side";
      if (activeTab === "ai") return category === "ai";
      if (activeTab === "devops") return category === "devops";
      if (activeTab === "marketing") return category === "marketing";
      if (activeTab === "fullstack") return category === "fullstack";
      if (activeTab === "completed") return q.userStatus === "COMPLETED";
      return true;
    });
    return activeTab === "all" ? pinActiveQuests(next) : next;
  })();

  const emptyCopy =
    activeTab === "log"
      ? "Nothing in your log yet. Accept a quest to start shipping."
      : activeTab === "completed"
      ? "No completed quests yet. Open My Log to finish something in progress."
      : "No quests in this tab. Try ALL QUESTS or MY LOG.";

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
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg gap-2 flex-wrap h-auto">
          <TabsTrigger value="all" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            ALL QUESTS
          </TabsTrigger>
          <TabsTrigger value="log" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            MY LOG ({logQuests.length})
          </TabsTrigger>
          <TabsTrigger value="main" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            MAIN
          </TabsTrigger>
          <TabsTrigger value="side" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            SIDE
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            AI
          </TabsTrigger>
          <TabsTrigger value="devops" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            DEVOPS
          </TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            MARKETING
          </TabsTrigger>
          <TabsTrigger value="fullstack" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            FULLSTACK
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            COMPLETED ({completedQuests.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quest Cards Grid */}
      {filteredQuests.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center space-y-4">
          <p className="font-game text-xl text-gray-300">
            {loading ? "Loading quest board…" : emptyCopy}
          </p>
          {!loading && activeTab === "completed" && (
            <Button variant="pixel" className="font-game text-xl" onClick={() => setActiveTab("log")}>
              OPEN MY LOG
            </Button>
          )}
          {!loading && activeTab === "log" && (
            <Button variant="pixel" className="font-game text-xl" onClick={() => setActiveTab("all")}>
              BROWSE ALL QUESTS
            </Button>
          )}
          {!loading && activeTab !== "log" && activeTab !== "completed" && (
            <Button
              variant="outline"
              className="font-game text-xl border-yellow-500/40 text-yellow-400"
              onClick={() => setActiveTab("all")}
            >
              SHOW ALL QUESTS
            </Button>
          )}
        </div>
      ) : (
      <div className="space-y-4">
        {activeTab === "all" && logQuests.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <p className="font-game text-lg text-yellow-400">
              PINNED ACTIVE RUN · {logQuests.length} quest{logQuests.length === 1 ? "" : "s"} at the top
            </p>
            <Button
              variant="outline"
              className="font-game text-lg border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
              onClick={() => setActiveTab("log")}
            >
              OPEN MY LOG
            </Button>
          </div>
        )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuests.map((quest) => {
          const isCompleted = quest.userStatus === "COMPLETED";
          const isUnderReview = quest.userStatus === "UNDER_REVIEW";
          const isInProgress = quest.userStatus === "IN_PROGRESS";
          const isCodeKata = quest.proofSpec?.kind === "code_kata" || isCodingQuest(quest.questId);
          const isPinned = activeTab === "all" && (isInProgress || isUnderReview);

          return (
            <Card
              key={quest.questId}
              className={`bg-neutral-900 border-2 transition-all duration-200 flex flex-col justify-between ${
                isCompleted
                  ? "border-emerald-500/50 bg-emerald-950/10"
                  : isUnderReview
                  ? "border-amber-500/50 bg-amber-950/10"
                  : isInProgress
                  ? "border-yellow-400 shadow-md shadow-yellow-500/20"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPinned && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 font-mono text-[10px]">
                        PINNED
                      </Badge>
                    )}
                    <Badge variant="pixel" className="text-xs">
                      {(quest.category || "Main").toUpperCase()} QUEST
                    </Badge>
                  </div>
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
                {quest.proofSpec && (
                  <div className="text-[11px] font-mono text-indigo-300">
                    {quest.proofSpec.kind === "code_kata"
                      ? "Solved in the in-app Code Lab. Passing tests completes the quest."
                      : `AI checks ${quest.proofSpec.count} ${quest.proofSpec.itemLabel.toLowerCase()}${quest.proofSpec.count === 1 ? "" : "s"}${quest.proofSpec.distinctHosts ? " on different sites" : ""}.`}
                    {quest.proofSpec.expectedHosts?.length
                      ? ` ${quest.proofSpec.expectedHosts.map((host) => host.name).join(" · ")}.`
                      : ""}
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
                ) : isCodeKata ? (
                  <Button asChild variant="pixel" className="w-full font-game text-xl py-5">
                    <Link
                      href={`/arena?quest=${quest.questId}`}
                      onClick={() => {
                        if (isSignedIn && quest.userStatus === "AVAILABLE") {
                          void handleAcceptQuest(quest.questId);
                        }
                      }}
                    >
                      <Code className="mr-2 w-5 h-5 text-yellow-400" /> OPEN CODE LAB
                    </Link>
                  </Button>
                ) : isInProgress ? (
                  <Button
                    variant="pixel"
                    className="w-full font-game text-xl py-5"
                    onClick={() => openSubmit(quest)}
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
      </div>
      )}

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
            <p className="text-xs font-mono text-indigo-300 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              AI will fetch and validate{" "}
              <span className="text-yellow-400 font-bold">
                {selectedQuest?.proofSpec?.count ?? 1} {selectedQuest?.proofSpec?.itemLabel || "proof URL"}
                {(selectedQuest?.proofSpec?.count ?? 1) === 1 ? "" : "s"}
              </span>
              {selectedQuest?.proofSpec?.distinctHosts ? " on different hosts" : ""}.{" "}
              {selectedQuest?.proofSpec?.criteria}
            </p>

            {(selectedQuest?.proofSpec?.kind === "github" ||
              selectedQuest?.proofSpec?.kind === "live_site" ||
              lastReport?.needsGithubOAuth) && <ConnectGitHub />}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {proofUrls.map((url, index) => {
                const slot = selectedQuest?.proofSpec?.expectedHosts?.[index];
                return (
                  <div key={index}>
                    <label className="text-xs font-mono text-yellow-400 uppercase block mb-1">
                      {slot ? `${slot.name} listing *` : `${selectedQuest?.proofSpec?.itemLabel || "Proof URL"} ${proofUrls.length > 1 ? index + 1 : ""} *`}
                    </label>
                    <Input
                      placeholder={slot?.example || "https://"}
                      value={url}
                      onChange={(e) => {
                        const next = [...proofUrls];
                        next[index] = e.target.value;
                        setProofUrls(next);
                      }}
                      className="bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 uppercase block mb-1">
                Notes for Guild Reviewers / Mentors
              </label>
              <Textarea
                placeholder="Product name, extra context, or waitlist counts..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white h-20"
              />
            </div>

            {lastReport && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                <div className={lastReport.allPassed ? "text-emerald-400" : "text-red-400"}>
                  {lastReport.summary}
                </div>
                {!!lastReport.missingHosts?.length && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-amber-400 uppercase">Still needed</span>
                    {lastReport.missingHosts.map((name) => (
                      <span
                        key={name}
                        className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {!!lastReport.foundHosts?.length && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-emerald-400 uppercase">Found</span>
                    {lastReport.foundHosts.map((name) => (
                      <span
                        key={name}
                        className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {!!lastReport.repeatedHosts?.length && (
                  <div className="text-amber-300">Repeated: {lastReport.repeatedHosts.join(", ")}</div>
                )}
                {!!lastReport.unrecognizedHosts?.length && (
                  <div className="text-red-300">Unrecognized: {lastReport.unrecognizedHosts.join(", ")}</div>
                )}
                {lastReport.items.map((item) => (
                  <div key={item.url} className={item.passed ? "text-emerald-300" : "text-red-300"}>
                    {item.passed ? "✓" : "✕"} {item.directoryName ? `${item.directoryName}: ` : ""}
                    {item.url} — {item.reason}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono text-gray-400 flex justify-between">
              <div>Rewards if AI passes every item:</div>
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
              {submitting ? "AI VALIDATING..." : "VALIDATE DELIVERABLES 🚀"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
