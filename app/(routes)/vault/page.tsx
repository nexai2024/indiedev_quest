"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Sparkles, CheckCircle2, Clock, ExternalLink, ThumbsUp, Award, Coins, Flame, UserCheck, Play } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface SubmissionItem {
  id: number;
  userId: string;
  userName: string;
  questTitle: string;
  proofUrl: string;
  notes?: string;
  isApproved: boolean;
  reviewNotes?: string;
  createdAt: string;
}

export default function VaultPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get("/api/submissions");
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async (isApproved: boolean) => {
    if (!selectedSub) return;
    setReviewing(true);
    try {
      await axios.post("/api/submissions/review", {
        submissionId: selectedSub.id,
        isApproved,
        reviewNotes
      });
      toast.success(isApproved ? "Submission Approved! Rewards & Badges granted!" : "Feedback sent to developer.");
      setSelectedSub(null);
      setReviewNotes("");
      fetchSubmissions();
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setReviewing(false);
    }
  };

  const filteredSubs = submissions.filter((s) => {
    if (filter === "approved") return s.isApproved;
    if (filter === "pending") return !s.isApproved;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40 p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-game mb-2">
            <Award className="w-4 h-4 text-indigo-400" /> PROOF-OF-WORK VAULT & SHOWROOM
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            THE GUILD VAULT
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Showcase completed projects, validate peer submissions, and earn platform gold & badges.
          </p>
        </div>
        <Button variant="pixel" className="font-game text-2xl px-6 py-6" onClick={() => (window.location.href = "/quests")}>
          <Flame className="mr-2 w-5 h-5 text-yellow-400" /> GO TO QUEST BOARD
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg gap-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">
            ALL SUBMISSIONS
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            VERIFIED SHOWROOM ✓
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            PENDING REVIEWS ⏳
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Submissions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubs.map((sub) => (
          <Card
            key={sub.id}
            className={`bg-neutral-900 border-2 transition-all flex flex-col justify-between ${
              sub.isApproved ? "border-emerald-500/40 bg-emerald-950/10" : "border-amber-500/40 bg-amber-950/10"
            }`}
          >
            <CardHeader className="space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant={sub.isApproved ? "pixel" : "outline"}>
                  {sub.isApproved ? "VERIFIED PROOF ✓" : "UNDER REVIEW ⏳"}
                </Badge>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> {sub.userName || "Indie Builder"}
                </div>
              </div>
              <CardTitle className="font-game text-2xl text-white">{sub.questTitle}</CardTitle>
              <CardDescription className="text-gray-300 text-sm italic">
                "{sub.notes || "No additional developer notes provided."}"
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <a
                href={sub.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/40 text-xs font-mono transition-all truncate"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{sub.proofUrl}</span>
              </a>

              {sub.reviewNotes && (
                <div className="bg-neutral-950/80 p-3 rounded border border-neutral-800 text-xs font-mono space-y-1">
                  <div className="text-yellow-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Mentor Feedback:
                  </div>
                  <div className="text-gray-300">{sub.reviewNotes}</div>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              {!sub.isApproved ? (
                <Button
                  variant="pixel"
                  className="w-full font-game text-xl py-5"
                  onClick={() => setSelectedSub(sub)}
                >
                  <ThumbsUp className="mr-2 w-5 h-5 text-yellow-400" /> REVIEW & VALIDATE PROOF
                </Button>
              ) : (
                <Button disabled className="w-full font-game text-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="mr-2 w-5 h-5" /> REWARDS DISTRIBUTED
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* PEER / MENTOR REVIEW DIALOG */}
      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="bg-neutral-900 border-2 border-yellow-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-yellow-400 flex items-center gap-2">
              <UserCheck className="w-6 h-6" /> GUILD PROOF VALIDATION
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Reviewing submission by <span className="text-white font-bold">{selectedSub?.userName}</span> for{" "}
              <span className="text-yellow-400 font-bold">{selectedSub?.questTitle}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2">
              <div className="text-xs font-mono text-gray-400">Proof URL:</div>
              <a
                href={selectedSub?.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline text-sm font-mono flex items-center gap-1"
              >
                {selectedSub?.proofUrl} <ExternalLink className="w-4 h-4" />
              </a>
              <div className="text-xs font-mono text-gray-400 mt-2">Notes:</div>
              <p className="text-sm text-gray-300">{selectedSub?.notes || "None"}</p>
            </div>

            <div>
              <label className="text-xs font-mono text-yellow-400 uppercase block mb-1">
                Peer / Mentor Feedback Notes
              </label>
              <Textarea
                placeholder="Great work! The authentication pipeline and UI look crisp..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white h-24"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="font-game text-lg border-red-500/40 text-red-400 hover:bg-red-500/10"
              onClick={() => handleReviewSubmission(false)}
              disabled={reviewing}
            >
              Request Revisions
            </Button>
            <Button
              variant="pixel"
              className="font-game text-2xl px-6"
              onClick={() => handleReviewSubmission(true)}
              disabled={reviewing}
            >
              APPROVE & AWARD XP/GOLD 🏆
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
