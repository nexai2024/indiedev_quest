"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Sparkles, Calendar, Clock, Coins, Shield, Star, Video, CheckCircle2, Flame, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Mentor {
  mentorId: string;
  mentorName: string;
  role: string;
  bio: string;
  hourlyRateGold: number;
  specialties: string[];
}

interface Booking {
  id: number;
  mentorName: string;
  topic: string;
  scheduledAt: string;
  status: string;
  costInGold: number;
}

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [topic, setTopic] = useState("1-on-1 Code Review & Architecture Guidance");
  const [scheduledAt, setScheduledAt] = useState("Tomorrow at 3:00 PM UTC");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
      const res = await axios.get("/api/mentorship");
      setMentors(res.data.mentors || []);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedMentor) return;
    setBookingLoading(true);
    try {
      const res = await axios.post("/api/mentorship", {
        mentorId: selectedMentor.mentorId,
        mentorName: selectedMentor.mentorName,
        topic,
        scheduledAt,
        costInGold: selectedMentor.hourlyRateGold
      });

      if (res.data.success) {
        toast.success(`Session booked with ${selectedMentor.mentorName}!`);
        setSelectedMentor(null);
        fetchMentorshipData();
      } else {
        toast.error(res.data.message || "Booking failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to book mentorship session");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-game mb-2">
            <Users className="w-4 h-4 text-amber-400" /> GUILD MENTORSHIP BOARD
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            1-ON-1 MENTOR PAIRING
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Book 1-on-1 code reviews, office hours, and pairing sessions with high-ranking Guildmasters using Gold.
          </p>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800 p-1 font-game text-lg gap-2">
          <TabsTrigger value="browse" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            BROWSE MENTORS
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            ACTIVE BOOKINGS ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BROWSE MENTORS */}
        <TabsContent value="browse" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((m) => (
              <Card key={m.mentorId} className="bg-neutral-900 border-2 border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <CardHeader className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-game text-2xl text-white">{m.mentorName}</CardTitle>
                      <div className="text-xs text-amber-400 font-mono font-bold mt-1">{m.role}</div>
                    </div>
                    <Badge variant="pixel" className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {m.hourlyRateGold} Gold
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-300 text-sm leading-relaxed">
                    {m.bio}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {m.specialties.map((spec) => (
                      <span key={spec} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-gray-300">
                        ✨ {spec}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    variant="pixel"
                    className="w-full font-game text-xl py-5"
                    onClick={() => setSelectedMentor(m)}
                  >
                    <Calendar className="mr-2 w-5 h-5 text-yellow-400" /> BOOK 1-ON-1 SESSION
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: ACTIVE BOOKINGS */}
        <TabsContent value="bookings" className="mt-6">
          {bookings.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 p-8 text-center text-gray-400 font-game text-2xl">
              NO ACTIVE SESSIONS BOOKED YET. BROWSE MENTORS ABOVE TO BOOK YOUR FIRST 1-ON-1!
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {bookings.map((b) => (
                <Card key={b.id} className="bg-neutral-900 border-amber-500/30 p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="pixel">{b.status}</Badge>
                      <h3 className="font-game text-2xl text-white mt-1">{b.mentorName}</h3>
                      <p className="text-sm text-gray-300 font-mono mt-0.5">{b.topic}</p>
                    </div>
                    <div className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {b.scheduledAt}
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs font-mono border-t border-neutral-800">
                    <span className="text-gray-400">Cost: {b.costInGold} Gold</span>
                    <Button variant="outline" size="sm" className="font-game text-lg border-amber-500/40 text-amber-400">
                      <Video className="mr-1 w-4 h-4" /> JOIN MEETING ROOM
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* BOOKING DIALOG */}
      <Dialog open={!!selectedMentor} onOpenChange={(open) => !open && setSelectedMentor(null)}>
        <DialogContent className="bg-neutral-900 border-2 border-amber-400 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-game text-3xl text-amber-400 flex items-center gap-2">
              <Calendar className="w-6 h-6" /> SCHEDULE MENTOR SESSION
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-game text-lg">
              Booking with <span className="text-white font-bold">{selectedMentor?.mentorName}</span> ({selectedMentor?.role})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-mono text-amber-400 uppercase block mb-1">
                Session Topic / Goal *
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Code review on NextAuth middleware or Stripe webhooks"
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 uppercase block mb-1">
                Preferred Date & Time Slot *
              </label>
              <Input
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                placeholder="e.g. Tomorrow at 3:00 PM UTC"
                className="bg-neutral-950 border-neutral-800 text-white"
              />
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono flex justify-between items-center">
              <span className="text-gray-400">Session Fee:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1 text-sm">
                <Coins className="w-4 h-4" /> {selectedMentor?.hourlyRateGold} Gold
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="font-game text-lg" onClick={() => setSelectedMentor(null)}>
              Cancel
            </Button>
            <Button
              variant="pixel"
              className="font-game text-2xl px-6"
              onClick={handleBookSession}
              disabled={bookingLoading}
            >
              {bookingLoading ? "CONFIRMING..." : "CONFIRM BOOKING 🚀"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
