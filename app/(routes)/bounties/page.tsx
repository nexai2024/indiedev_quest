"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Target, Award } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/bounties").then((res) => setBounties(res.data));
  }, []);

  const handleClaim = (title: string) => {
    toast.success(`Claimed bounty: "${title}"! Check your Quest Log.`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 shadow-xl">
        <h1 className="text-4xl font-game font-bold text-yellow-400">GUILD BOUNTY BOARD</h1>
        <p className="text-gray-300 font-game text-xl">Post micro-SaaS feature bounties and earn Gold & Cash!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {bounties.map((b) => (
          <Card key={b.id} className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <Badge variant="pixel">{b.category}</Badge>
              <span className="text-xs text-yellow-400 font-mono font-bold">{b.rewardGold} Gold (${b.rewardUsd})</span>
            </div>
            <h3 className="text-xl font-game font-bold">{b.title}</h3>
            <p className="text-xs text-gray-400">Posted by {b.postedBy}</p>
            <Button variant="pixel" className="w-full font-game text-xl" onClick={() => handleClaim(b.title)}>
              CLAIM BOUNTY
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
