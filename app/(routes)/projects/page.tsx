"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Award, Sparkles } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-12 max-w-5xl mx-auto text-center space-y-6">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-game text-xl">
        <Sparkles className="w-5 h-5" /> GUILD SHOWROOM & PROJECTS
      </div>
      <h1 className="text-5xl font-game font-bold text-yellow-400">PROJECT VAULT & SHOWROOM</h1>
      <p className="text-gray-300 font-game text-2xl max-w-2xl mx-auto">
        Explore all verified proof-of-work project submissions shipped by guild developers.
      </p>
      <Link href="/vault">
        <Button variant="pixel" className="font-game text-2xl px-8 py-6">
          <Award className="mr-2 w-6 h-6 text-yellow-400" /> ENTER THE PROOF VAULT
        </Button>
      </Link>
    </div>
  );
}
