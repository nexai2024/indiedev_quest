"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ConnectGitHub from "@/components/ConnectGitHub";
import { MENTOR_SPECIALTIES } from "@/lib/mentorship";
import { Calendar, Coins, GitBranch, Shield, Star, Video } from "lucide-react";

type MentorCard = {
  userId: string;
  name: string;
  status: string;
  bio: string;
  headline: string | null;
  specialties: string[];
  hourlyRateGold: number;
  hourlyRateUsdCents: number;
  githubLogin: string | null;
  githubUrl: string | null;
  proofUrls: string[];
  rating: number;
  ratingCount: number;
  sessionsCompleted: number;
  connectReady: boolean;
  openSlots: number;
  vouchCount: number;
  alreadyVouched?: boolean;
  vouches?: { voucherName: string | null; note: string | null }[];
};

type Slot = { id: number; mentorUserId: string; startsAt: string; endsAt: string; status: string; sessionId?: number | null };

type Session = {
  id: number;
  mentorId: string;
  mentorName: string | null;
  menteeId: string;
  menteeName: string | null;
  topic: string;
  status: string;
  sessionKind: string;
  paymentKind: string;
  costInGold: number;
  cashUsdCents: number;
  mentorPayoutGold: number;
  mentorPayoutUsdCents: number;
  guildCutGold: number;
  guildCutUsdCents: number;
  escrowStatus: string;
  scheduledAt: string | null;
  projectUrl: string | null;
  question: string | null;
  mentorRecap: string | null;
  menteeRating: number | null;
  menteeCompleted: boolean;
  mentorCompleted: boolean;
  roomUrl: string | null;
  isMentor: boolean;
  isMentee: boolean;
};

function formatSlot(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function usd(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function MentorshipPage() {
  return (
    <Suspense fallback={<p className="p-12 text-gray-400 font-game text-xl">Opening the mentor hall…</p>}>
      <MentorshipBoard />
    </Suspense>
  );
}

function MentorshipBoard() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<{
    gold: number;
    isStaff: boolean;
    isMentor: boolean;
    completedQuestCount: number;
    github: { connected: boolean; login: string | null };
    role: string;
  } | null>(null);
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [applications, setApplications] = useState<MentorCard[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [connect, setConnect] = useState<{ payoutsEnabled?: boolean } | null>(null);
  const [specialty, setSpecialty] = useState("All");
  const [profile, setProfile] = useState<MentorCard | null>(null);

  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [pickedSpecs, setPickedSpecs] = useState<string[]>(["Indie shipping"]);
  const [proofs, setProofs] = useState("https://");
  const [goldRate, setGoldRate] = useState(100);
  const [usdRate, setUsdRate] = useState(0);

  const [bookMentor, setBookMentor] = useState<MentorCard | null>(null);
  const [bookKind, setBookKind] = useState<"LIVE" | "ASYNC">("LIVE");
  const [payKind, setPayKind] = useState<"GOLD" | "CASH">("GOLD");
  const [topic, setTopic] = useState("Code review on my live MVP");
  const [slotId, setSlotId] = useState<number | null>(null);
  const [projectUrl, setProjectUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [recap, setRecap] = useState("");
  const [rating, setRating] = useState(5);

  const filteredMentors = useMemo(
    () => (specialty === "All" ? mentors : mentors.filter((mentor) => mentor.specialties.includes(specialty))),
    [mentors, specialty]
  );

  const load = async () => {
    const res = await axios.get("/api/mentorship");
    setMe(res.data.me);
    setMentors(res.data.mentors || []);
    setApplications(res.data.applications || []);
    setSlots(res.data.slots || []);
    setMySlots(res.data.mySlots || []);
    setSessions(res.data.sessions || []);
    setStripeConfigured(Boolean(res.data.stripeConfigured));
    setConnect(res.data.connect);
    setProfile(res.data.profile);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (error) {
        console.error(error);
        toast.error("Could not load mentorship.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (searchParams.get("cash") === "success" && checkout) {
      void (async () => {
        try {
          await axios.post("/api/mentorship", { action: "CONFIRM_CASH", checkoutId: checkout });
          toast.success("Cash escrow is held.");
          await load();
        } catch (error) {
          const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
          toast.error(typeof message === "string" ? message : "Could not confirm cash payment.");
        }
      })();
    }
  }, [searchParams]);

  const run = async (payload: Record<string, unknown>, ok: string) => {
    setSaving(true);
    try {
      const res = await axios.post("/api/mentorship", payload);
      if (typeof res.data.checkoutUrl === "string") {
        window.location.assign(res.data.checkoutUrl);
        return;
      }
      if (typeof res.data.url === "string" && payload.action === "CONNECT_ONBOARD") {
        window.location.assign(res.data.url);
        return;
      }
      toast.success(typeof res.data.message === "string" ? res.data.message : ok);
      setBookMentor(null);
      await load();
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
      toast.error(typeof message === "string" ? message : "Mentorship action failed.");
    } finally {
      setSaving(false);
    }
  };

  const mentorSlots = (mentorId: string) => slots.filter((slot) => slot.mentorUserId === mentorId);

  if (loading) {
    return <p className="p-12 text-gray-400 font-game text-xl">Opening the mentor hall…</p>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 space-y-3">
        <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 font-game">GUILD MENTOR TRACK</Badge>
        <h1 className="text-4xl md:text-5xl font-game font-bold">SHIPPED MENTORS ONLY</h1>
        <p className="text-gray-400 font-game text-xl max-w-3xl">
          Apply with GitHub + completed quests. Peers vouch or staff approve. Sessions escrow gold or cash (15% guild cut), then pay the mentor when both sides close.
        </p>
        <p className="text-xs font-mono text-amber-300">
          Your gold: {me?.gold ?? 0} · Quests shipped: {me?.completedQuestCount ?? 0} · GitHub:{" "}
          {me?.github.connected ? `@${me.github.login || "connected"}` : "not connected"}
        </p>
      </div>

      <Tabs defaultValue="board">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg flex flex-wrap h-auto">
          <TabsTrigger value="board">BOARD</TabsTrigger>
          <TabsTrigger value="apply">APPLY</TabsTrigger>
          <TabsTrigger value="vetting">VETTING ({applications.length})</TabsTrigger>
          <TabsTrigger value="sessions">SESSIONS ({sessions.length})</TabsTrigger>
          {(me?.isMentor || profile) && <TabsTrigger value="desk">MENTOR DESK</TabsTrigger>}
        </TabsList>

        <TabsContent value="board" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={specialty === "All" ? "pixel" : "outline"} className="font-game" onClick={() => setSpecialty("All")}>
              All
            </Button>
            {MENTOR_SPECIALTIES.map((item) => (
              <Button key={item} type="button" variant={specialty === item ? "pixel" : "outline"} className="font-game" onClick={() => setSpecialty(item)}>
                {item}
              </Button>
            ))}
          </div>
          {filteredMentors.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 p-8 text-gray-400 font-game text-xl">
              No approved mentors yet. Ship quests, apply, and get vouched.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.userId} className="bg-neutral-900 border-neutral-800 flex flex-col">
                  <CardHeader className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <CardTitle className="font-game text-2xl">{mentor.name}</CardTitle>
                      <Badge variant="pixel" className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" /> {mentor.hourlyRateGold}
                      </Badge>
                    </div>
                    <CardDescription>{mentor.headline || mentor.specialties.join(" · ")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-300">
                    <p>{mentor.bio}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.specialties.map((spec) => (
                        <span key={spec} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono">
                          {spec}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-mono text-amber-300">
                      {mentor.ratingCount ? `${mentor.rating}★ (${mentor.ratingCount})` : "No ratings yet"} · {mentor.openSlots} open slots
                      {mentor.hourlyRateUsdCents ? ` · cash ${usd(mentor.hourlyRateUsdCents)}` : ""}
                    </p>
                    {mentor.githubUrl && (
                      <a href={mentor.githubUrl} className="text-xs text-indigo-300 underline flex items-center gap-1" target="_blank" rel="noreferrer">
                        <GitBranch className="w-3 h-3" /> @{mentor.githubLogin}
                      </a>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="pixel" className="font-game flex-1" onClick={() => { setBookMentor(mentor); setBookKind("LIVE"); setSlotId(mentorSlots(mentor.userId)[0]?.id ?? null); }}>
                      BOOK LIVE
                    </Button>
                    <Button variant="outline" className="font-game flex-1" onClick={() => { setBookMentor(mentor); setBookKind("ASYNC"); }}>
                      ASYNC REVIEW
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="apply" className="mt-6 space-y-4 max-w-2xl">
          <ConnectGitHub redirectTo="/mentorship?github=connected" />
          <p className="text-sm text-gray-400">
            Need {2} completed quests and a connected GitHub. You have {me?.completedQuestCount ?? 0}.
          </p>
          <Input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Headline (optional)" className="bg-neutral-950 border-neutral-700" />
          <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="What you will help builders ship…" className="bg-neutral-950 border-neutral-700 min-h-32" />
          <div className="flex flex-wrap gap-2">
            {MENTOR_SPECIALTIES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={pickedSpecs.includes(item) ? "pixel" : "outline"}
                className="font-game text-sm"
                onClick={() =>
                  setPickedSpecs((current) =>
                    current.includes(item) ? current.filter((spec) => spec !== item) : [...current, item].slice(0, 4)
                  )
                }
              >
                {item}
              </Button>
            ))}
          </div>
          <Textarea
            value={proofs}
            onChange={(event) => setProofs(event.target.value)}
            placeholder="Live proof URLs, one per line"
            className="bg-neutral-950 border-neutral-700"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-mono text-gray-400">
              Gold / session
              <Input type="number" value={goldRate} onChange={(event) => setGoldRate(Number(event.target.value))} className="mt-1 bg-neutral-950 border-neutral-700" />
            </label>
            <label className="text-xs font-mono text-gray-400">
              Cash cents (0 = gold only)
              <Input type="number" value={usdRate} onChange={(event) => setUsdRate(Number(event.target.value))} className="mt-1 bg-neutral-950 border-neutral-700" />
            </label>
          </div>
          <Button
            variant="pixel"
            className="font-game text-xl"
            disabled={saving}
            onClick={() =>
              run(
                {
                  action: "APPLY",
                  bio,
                  headline,
                  specialties: pickedSpecs,
                  proofUrls: proofs.split(/\s+/).map((item) => item.trim()).filter(Boolean),
                  hourlyRateGold: goldRate,
                  hourlyRateUsdCents: usdRate,
                },
                "Application submitted."
              )
            }
          >
            SUBMIT APPLICATION
          </Button>
        </TabsContent>

        <TabsContent value="vetting" className="mt-6 space-y-4">
          {applications.length === 0 ? (
            <p className="text-gray-400 font-game">No open applications.</p>
          ) : (
            applications.map((app) => (
              <Card key={app.userId} className="bg-neutral-900 border-amber-500/20 p-6 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-game text-2xl">{app.name}</h3>
                    <p className="text-xs font-mono text-amber-300">{app.status} · {app.vouchCount} vouches / 2</p>
                  </div>
                  {app.githubUrl && (
                    <a href={app.githubUrl} className="text-sm text-indigo-300 underline" target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-300">{app.bio}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {app.proofUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="text-yellow-400 underline break-all">
                      {url}
                    </a>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!app.alreadyVouched && (
                    <Button variant="pixel" className="font-game" disabled={saving} onClick={() => run({ action: "VOUCH", applicantId: app.userId }, "Vouch recorded.")}>
                      VOUCH
                    </Button>
                  )}
                  {me?.isStaff && (
                    <>
                      <Button variant="outline" className="font-game border-emerald-500/40 text-emerald-300" disabled={saving} onClick={() => run({ action: "REVIEW_APPLICATION", applicantId: app.userId, decision: "APPROVE" }, "Approved.")}>
                        <Shield className="w-4 h-4 mr-1" /> STAFF APPROVE
                      </Button>
                      <Button variant="outline" className="font-game border-red-500/40 text-red-300" disabled={saving} onClick={() => run({ action: "REVIEW_APPLICATION", applicantId: app.userId, decision: "REJECT" }, "Rejected.")}>
                        REJECT
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6 space-y-4">
          {sessions.length === 0 ? (
            <p className="text-gray-400 font-game">No sessions yet.</p>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="bg-neutral-900 border-neutral-800 p-6 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <Badge variant="pixel">{session.escrowStatus}</Badge>
                    <h3 className="font-game text-2xl mt-1">{session.topic}</h3>
                    <p className="text-xs text-gray-400">
                      {session.sessionKind} · {session.paymentKind} · {session.isMentor ? `Mentee ${session.menteeName}` : session.mentorName}
                    </p>
                  </div>
                  {session.roomUrl && session.sessionKind === "LIVE" && session.escrowStatus === "HELD" && (
                    <Button asChild variant="outline" className="font-game">
                      <a href={session.roomUrl} target="_blank" rel="noreferrer">
                        <Video className="w-4 h-4 mr-1" /> JOIN ROOM
                      </a>
                    </Button>
                  )}
                </div>
                {session.projectUrl && (
                  <a href={session.projectUrl} className="text-sm text-yellow-400 underline break-all" target="_blank" rel="noreferrer">
                    {session.projectUrl}
                  </a>
                )}
                {session.question && <p className="text-sm text-gray-300">{session.question}</p>}
                {session.mentorRecap && <p className="text-sm text-emerald-200">Recap: {session.mentorRecap}</p>}
                {session.escrowStatus === "HELD" && session.isMentor && !session.mentorCompleted && (
                  <div className="space-y-2">
                    <Textarea value={recap} onChange={(event) => setRecap(event.target.value)} placeholder="Session recap (required to release escrow)" className="bg-neutral-950 border-neutral-700" />
                    <Button variant="pixel" className="font-game" disabled={saving} onClick={() => run({ action: "MENTOR_COMPLETE", sessionId: session.id, recap, rating: 5 }, "Recap saved.")}>
                      SUBMIT RECAP
                    </Button>
                  </div>
                )}
                {session.escrowStatus === "HELD" && session.isMentee && !session.menteeCompleted && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono">Rate</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className={star <= rating ? "text-yellow-400" : "text-gray-600"}>
                        <Star className="w-4 h-4" />
                      </button>
                    ))}
                    <Button variant="pixel" className="font-game" disabled={saving} onClick={() => run({ action: "MENTEE_COMPLETE", sessionId: session.id, rating }, "Rated.")}>
                      RATE & CLOSE
                    </Button>
                  </div>
                )}
                {session.escrowStatus === "HELD" && (
                  <Button variant="outline" className="font-game text-sm" disabled={saving} onClick={() => run({ action: "CANCEL", sessionId: session.id }, "Cancelled.")}>
                    CANCEL / REFUND
                  </Button>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="desk" className="mt-6 space-y-6 max-w-2xl">
          <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-3">
            <h3 className="font-game text-2xl">Stripe Connect</h3>
            <p className="text-sm text-gray-400">
              {stripeConfigured
                ? connect?.payoutsEnabled
                  ? "Payouts enabled. Cash sessions can pay you minus the 15% guild cut."
                  : "Finish Connect onboarding to take cash. Gold escrow works without it."
                : "Stripe is not configured on this deploy. Gold escrow still pays you."}
            </p>
            {stripeConfigured && profile?.status === "APPROVED" && (
              <Button variant="pixel" className="font-game" disabled={saving} onClick={() => run({ action: "CONNECT_ONBOARD" }, "Opening Stripe.")}>
                {connect?.payoutsEnabled ? "UPDATE CONNECT" : "OPEN STRIPE CONNECT"}
              </Button>
            )}
          </Card>
          <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-3">
            <h3 className="font-game text-2xl">Availability</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <Input type="datetime-local" value={slotStart} onChange={(event) => setSlotStart(event.target.value)} className="bg-neutral-950 border-neutral-700" />
              <Input type="datetime-local" value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} className="bg-neutral-950 border-neutral-700" />
            </div>
            <Button
              variant="pixel"
              className="font-game"
              disabled={saving}
              onClick={() =>
                run(
                  { action: "ADD_SLOT", startsAt: slotStart ? new Date(slotStart).toISOString() : "", endsAt: slotEnd ? new Date(slotEnd).toISOString() : "" },
                  "Slot posted."
                )
              }
            >
              <Calendar className="w-4 h-4 mr-1" /> POST SLOT
            </Button>
            {mySlots.map((slot) => (
              <div key={slot.id} className="flex justify-between text-sm border border-neutral-800 rounded-lg p-2">
                <span>
                  {formatSlot(slot.startsAt)} → {formatSlot(slot.endsAt)} · {slot.status}
                </span>
                {slot.status === "OPEN" && (
                  <button type="button" className="text-red-300" onClick={() => run({ action: "CANCEL_SLOT", slotId: slot.id }, "Slot cancelled.")}>
                    cancel
                  </button>
                )}
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!bookMentor} onOpenChange={(open) => !open && setBookMentor(null)}>
        <DialogContent className="bg-neutral-900 border-2 border-amber-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-amber-400">
              {bookKind === "ASYNC" ? "Async review" : "Book a live slot"}
            </DialogTitle>
            <DialogDescription>
              {bookMentor?.name} · gold escrow {bookKind === "ASYNC" ? "(60% of hourly, min 40)" : `(${bookMentor?.hourlyRateGold})`} · guild cut 15%
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={topic} onChange={(event) => setTopic(event.target.value)} className="bg-neutral-950 border-neutral-700" />
            {bookKind === "LIVE" && (
              <div className="space-y-2">
                {bookMentor && mentorSlots(bookMentor.userId).length === 0 ? (
                  <p className="text-sm text-gray-400">No open slots. Use async review instead.</p>
                ) : (
                  mentorSlots(bookMentor?.userId || "").map((slot) => (
                    <Button key={slot.id} type="button" variant={slotId === slot.id ? "pixel" : "outline"} className="font-game w-full" onClick={() => setSlotId(slot.id)}>
                      {formatSlot(slot.startsAt)} → {formatSlot(slot.endsAt)}
                    </Button>
                  ))
                )}
              </div>
            )}
            {bookKind === "ASYNC" && (
              <>
                <Input value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://your-demo.vercel.app" className="bg-neutral-950 border-neutral-700" />
                <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should they review?" className="bg-neutral-950 border-neutral-700" />
              </>
            )}
            <div className="flex gap-2">
              <Button type="button" variant={payKind === "GOLD" ? "pixel" : "outline"} className="font-game flex-1" onClick={() => setPayKind("GOLD")}>
                GOLD
              </Button>
              <Button
                type="button"
                variant={payKind === "CASH" ? "pixel" : "outline"}
                className="font-game flex-1"
                disabled={!bookMentor?.hourlyRateUsdCents || !stripeConfigured}
                onClick={() => setPayKind("CASH")}
              >
                CASH
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="font-game" onClick={() => setBookMentor(null)}>
              Cancel
            </Button>
            <Button
              variant="pixel"
              className="font-game"
              disabled={saving || !bookMentor}
              onClick={() =>
                bookMentor &&
                run(
                  {
                    action: bookKind === "ASYNC" ? "BOOK_ASYNC" : "BOOK_LIVE",
                    mentorId: bookMentor.userId,
                    paymentKind: payKind,
                    topic,
                    slotId,
                    projectUrl,
                    question,
                  },
                  "Booked."
                )
              }
            >
              HOLD ESCROW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
