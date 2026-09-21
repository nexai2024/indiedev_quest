"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HACKATHON_DURATION_HOURS,
  HACKATHON_THEMES,
  type HackathonPhase,
} from "@/lib/hackathon";
import { Calendar, Coins, Crown, DollarSign, Flag, Sparkles, Trophy, Users } from "lucide-react";

type EducationSponsor = {
  id: string;
  name: string;
  url: string;
  blurb: string;
  defaultPrizeUsd: number;
  perk: string;
};

type HackathonEntry = {
  id: number;
  userId: string;
  userName: string | null;
  status: string;
  projectTitle: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  submittedAt: string | null;
};

type HackathonCard = {
  id: number;
  slug: string;
  title: string;
  theme: string;
  description: string;
  hostId: string;
  hostName: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  winnerId: string | null;
  winnerName: string | null;
  xpReward: number;
  goldReward: number;
  sponsorId: string | null;
  sponsorName: string | null;
  sponsorUrl: string | null;
  prizeCashUsd: number | null;
  phase: HackathonPhase;
  entryCount: number;
  submissionCount: number;
  isHost: boolean;
  myEntry: HackathonEntry | null;
  entries: HackathonEntry[];
};

const PHASE_STYLE: Record<HackathonPhase, string> = {
  UPCOMING: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  LIVE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  JUDGING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function durationLabel(hours: number) {
  if (hours === 24) return "24 hours";
  if (hours === 48) return "48 hours";
  return "7 days";
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<HackathonCard[]>([]);
  const [sponsors, setSponsors] = useState<EducationSponsor[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hostOpen, setHostOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<(typeof HACKATHON_THEMES)[number]>("Ship an MVP");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(48);
  const [sponsorId, setSponsorId] = useState("");
  const [prizeCashUsd, setPrizeCashUsd] = useState(0);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const selected = hackathons.find((event) => event.id === selectedId) ?? hackathons[0] ?? null;

  const submittedEntries = useMemo(
    () => (selected?.entries ?? []).filter((entry) => entry.status === "SUBMITTED" || entry.status === "WINNER"),
    [selected]
  );

  useEffect(() => {
    void loadHackathons();
  }, []);

  const loadHackathons = async (keepId?: number | null) => {
    try {
      const res = await axios.get("/api/hackathons");
      const list: HackathonCard[] = Array.isArray(res.data.hackathons) ? res.data.hackathons : [];
      setSponsors(Array.isArray(res.data.sponsors) ? res.data.sponsors : []);
      setHackathons(list);
      setSelectedId((current) => {
        const preferred = keepId ?? current;
        if (preferred && list.some((event) => event.id === preferred)) return preferred;
        return list[0]?.id ?? null;
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not load hackathons.");
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (payload: Record<string, unknown>, success: string) => {
    setSaving(true);
    try {
      const res = await axios.post("/api/hackathons", payload);
      const serverMessage = typeof res.data?.message === "string" ? res.data.message : success;
      toast.success(serverMessage);
      await loadHackathons(typeof payload.hackathonId === "number" ? payload.hackathonId : selected?.id ?? null);
      setHostOpen(false);
      setSubmitOpen(false);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
      toast.error(typeof message === "string" ? message : "Hackathon action failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await axios.post("/api/hackathons", {
        action: "CREATE",
        title,
        theme,
        description,
        durationHours,
        sponsorId: sponsorId || "none",
        prizeCashUsd: sponsorId ? prizeCashUsd : 0,
      });
      toast.success(
        sponsorId
          ? "Sponsored hackathon is live. Cash purse is recorded for partner payout."
          : "Hackathon is live on the guild board."
      );
      setTitle("");
      setDescription("");
      setSponsorId("");
      setPrizeCashUsd(0);
      setHostOpen(false);
      await loadHackathons(res.data?.hackathon?.id ?? null);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
      toast.error(typeof message === "string" ? message : "Hackathon action failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-3xl border-2 border-yellow-500/30 shadow-[0_0_25px_var(--brand-glow)] space-y-4">
        <Badge variant="pixel" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
          GUILD HACKATHONS
        </Badge>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-game font-bold text-yellow-400">HOST A SHIP SPRINT</h1>
            <p className="text-gray-300 font-game text-xl">
              Timed building events with optional education-partner cash purses. Host one, join one, submit a live URL, then the host crowns a winner.
            </p>
          </div>
          <Button variant="pixel" className="font-game text-2xl px-6 py-6" onClick={() => setHostOpen(true)}>
            <Flag className="mr-2 w-5 h-5" /> HOST HACKATHON
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 font-game text-xl">Loading the board…</p>
      ) : hackathons.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-800 p-8 space-y-3">
          <h2 className="font-game text-3xl text-white">No sprints posted yet</h2>
          <p className="text-gray-400 text-sm">Be the first host. Pick a theme, open a window, and the guild will ship against the clock.</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            {hackathons.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(event.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === event.id
                    ? "bg-yellow-950/30 border-yellow-500/50"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-game text-xl text-white truncate">{event.title}</span>
                  <Badge className={PHASE_STYLE[event.phase]}>{event.phase}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">{event.theme}</p>
                {(event.prizeCashUsd || 0) > 0 && event.sponsorName && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1">
                    ${event.prizeCashUsd} · {event.sponsorName}
                  </p>
                )}
                <p className="text-[11px] font-mono text-amber-400 mt-2">
                  {event.entryCount} builders · {event.submissionCount} shipped
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="bg-neutral-900 border-yellow-500/20 p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={PHASE_STYLE[selected.phase]}>{selected.phase}</Badge>
                    <Badge variant="outline">{selected.theme}</Badge>
                  </div>
                  <h2 className="text-3xl font-game font-bold">{selected.title}</h2>
                  <p className="text-sm text-gray-300">{selected.description}</p>
                </div>
                <div className="text-right font-mono text-xs text-gray-400 space-y-1">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatWhen(selected.startsAt)} → {formatWhen(selected.endsAt)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-yellow-400">
                    <Sparkles className="w-3.5 h-3.5" /> +{selected.xpReward} XP
                    <Coins className="w-3.5 h-3.5 ml-2" /> +{selected.goldReward} Gold
                  </div>
                  {(selected.prizeCashUsd || 0) > 0 && selected.sponsorName && (
                    <div className="flex items-center justify-end gap-1 text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" /> ${selected.prizeCashUsd} cash
                      {selected.sponsorUrl ? (
                        <a href={selected.sponsorUrl} target="_blank" rel="noreferrer" className="underline">
                          {selected.sponsorName}
                        </a>
                      ) : (
                        <span>{selected.sponsorName}</span>
                      )}
                    </div>
                  )}
                  <div>Host: {selected.hostName || "Guild host"}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!selected.myEntry && (selected.phase === "UPCOMING" || selected.phase === "LIVE") && (
                  <Button
                    variant="pixel"
                    className="font-game text-xl"
                    disabled={saving}
                    onClick={() => runAction({ action: "JOIN", hackathonId: selected.id }, "You joined the sprint.")}
                  >
                    <Users className="mr-2 w-4 h-4" /> JOIN SPRINT
                  </Button>
                )}
                {selected.myEntry && selected.phase === "LIVE" && (
                  <Button variant="pixel" className="font-game text-xl" onClick={() => setSubmitOpen(true)}>
                    <Trophy className="mr-2 w-4 h-4" />
                    {selected.myEntry.status === "SUBMITTED" || selected.myEntry.status === "WINNER"
                      ? "UPDATE SUBMISSION"
                      : "SUBMIT BUILD"}
                  </Button>
                )}
                {selected.isHost && selected.phase === "LIVE" && (
                  <Button
                    variant="outline"
                    className="font-game text-xl border-yellow-500/40 text-yellow-400"
                    disabled={saving}
                    onClick={() => runAction({ action: "CLOSE", hackathonId: selected.id }, "Submissions are closed. Time to judge.")}
                  >
                    CLOSE SUBMISSIONS
                  </Button>
                )}
              </div>

              {selected.winnerName && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-game text-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" /> Champion: {selected.winnerName}
                  </div>
                  {(selected.prizeCashUsd || 0) > 0 && selected.sponsorName && (
                    <p className="text-sm font-sans font-normal text-emerald-200/80">
                      ${selected.prizeCashUsd} cash purse from {selected.sponsorName}. Payout is coordinated with the partner — this board records the prize, it does not move bank funds.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-game text-2xl text-yellow-400">Shipped builds</h3>
                {submittedEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No live URLs yet. Join and ship while the clock is running.</p>
                ) : (
                  submittedEntries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-game text-xl text-white">{entry.projectTitle || "Untitled build"}</div>
                          <div className="text-xs text-gray-400">{entry.userName}</div>
                        </div>
                        {entry.status === "WINNER" && <Badge className={PHASE_STYLE.COMPLETED}>WINNER</Badge>}
                      </div>
                      {entry.projectUrl && (
                        <a href={entry.projectUrl} target="_blank" rel="noreferrer" className="text-sm text-yellow-400 underline break-all">
                          {entry.projectUrl}
                        </a>
                      )}
                      {selected.isHost && selected.phase !== "COMPLETED" && entry.status === "SUBMITTED" && (
                        <Button
                          variant="pixel"
                          className="font-game text-lg"
                          disabled={saving}
                          onClick={() =>
                            runAction(
                              { action: "AWARD", hackathonId: selected.id, winnerId: entry.userId },
                              `${entry.userName || "Builder"} takes the crown.`
                            )
                          }
                        >
                          <Crown className="mr-2 w-4 h-4" /> CROWN WINNER
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      <Dialog open={hostOpen} onOpenChange={setHostOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-yellow-400 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-yellow-400">Host a hackathon</DialogTitle>
            <DialogDescription className="text-gray-300">
              Starts now. Attach an education partner if they are putting real cash on the purse. Builders join, ship a live URL, and you pick the winner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Weekend MVP Gauntlet"
              className="bg-neutral-950 border-neutral-700 text-white"
            />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ship a usable slice. Live demo required."
              className="bg-neutral-950 border-neutral-700 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              {HACKATHON_THEMES.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={theme === option ? "pixel" : "outline"}
                  className="font-game text-base h-auto py-3 whitespace-normal"
                  onClick={() => setTheme(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {HACKATHON_DURATION_HOURS.map((hours) => (
                <Button
                  key={hours}
                  type="button"
                  variant={durationHours === hours ? "pixel" : "outline"}
                  className="font-game text-lg flex-1"
                  onClick={() => setDurationHours(hours)}
                >
                  {durationLabel(hours)}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-gray-400">Education partner (optional cash prize)</p>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                <Button
                  type="button"
                  variant={!sponsorId ? "pixel" : "outline"}
                  className="font-game text-base h-auto py-3"
                  onClick={() => {
                    setSponsorId("");
                    setPrizeCashUsd(0);
                  }}
                >
                  No sponsor
                </Button>
                {sponsors.map((sponsor) => (
                  <Button
                    key={sponsor.id}
                    type="button"
                    variant={sponsorId === sponsor.id ? "pixel" : "outline"}
                    className="font-game text-base h-auto py-3 whitespace-normal"
                    onClick={() => {
                      setSponsorId(sponsor.id);
                      setPrizeCashUsd(sponsor.defaultPrizeUsd);
                    }}
                  >
                    {sponsor.name}
                  </Button>
                ))}
              </div>
              {sponsorId && (
                <div className="space-y-2 p-3 rounded-xl bg-neutral-950 border border-emerald-500/20">
                  <p className="text-xs text-gray-400">
                    {sponsors.find((sponsor) => sponsor.id === sponsorId)?.blurb} Perk:{" "}
                    {sponsors.find((sponsor) => sponsor.id === sponsorId)?.perk}
                  </p>
                  <label className="text-xs font-mono text-emerald-300 block">
                    Cash purse (USD)
                    <Input
                      type="number"
                      min={100}
                      max={50000}
                      value={prizeCashUsd || ""}
                      onChange={(event) => setPrizeCashUsd(Number(event.target.value))}
                      className="mt-1 bg-neutral-900 border-neutral-700 text-white"
                    />
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Recorded on the event. You still coordinate the real payout with the partner — the guild does not auto-transfer cash.
                  </p>
                </div>
              )}
            </div>
            <Button variant="pixel" className="w-full font-game text-2xl py-6" disabled={saving} onClick={handleCreate}>
              OPEN THE SPRINT
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="bg-neutral-900 border-2 border-yellow-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-yellow-400">Submit your build</DialogTitle>
            <DialogDescription className="text-gray-300">
              A live URL is the proof. Repo is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
              placeholder="Project name"
              className="bg-neutral-950 border-neutral-700 text-white"
            />
            <Input
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
              placeholder="https://your-demo.vercel.app"
              className="bg-neutral-950 border-neutral-700 text-white"
            />
            <Input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/you/repo (optional)"
              className="bg-neutral-950 border-neutral-700 text-white"
            />
            <Button
              variant="pixel"
              className="w-full font-game text-2xl py-6"
              disabled={saving || !selected}
              onClick={() =>
                selected &&
                runAction(
                  {
                    action: "SUBMIT",
                    hackathonId: selected.id,
                    projectTitle,
                    projectUrl,
                    repoUrl,
                  },
                  "Build submitted. The host can crown a winner when time is up."
                )
              }
            >
              LOCK IN SUBMISSION
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
