"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Radio, Users } from "lucide-react";
import Link from "next/link";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-12 max-w-4xl mx-auto text-center space-y-6">
      <h1 className="text-5xl font-game font-bold text-yellow-400">GUILD HALL CONTACT & TAVERN</h1>
      <p className="text-gray-300 font-game text-2xl max-w-xl mx-auto">
        Have questions or want to partner with indiedev.quest? Join the Guild Tavern chat or book a session with a mentor!
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Link href="/tavern">
          <Button variant="pixel" className="font-game text-2xl px-8 py-6">
            <Radio className="mr-2 w-6 h-6 text-yellow-400" /> JOIN GUILD TAVERN
          </Button>
        </Link>
        <Link href="/mentorship">
          <Button variant="outline" className="font-game text-2xl px-8 py-6 border-amber-500/40 text-amber-400">
            <Users className="mr-2 w-6 h-6" /> MENTOR DIRECTORY
          </Button>
        </Link>
      </div>
    </div>
  );
}
