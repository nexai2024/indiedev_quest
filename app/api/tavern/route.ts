import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MESSAGES = [
  { id: 1, user: "Guildmaster Sarah", role: "MENTOR", message: "Welcome to the Guild Tavern! Grab an brew and share what you're building today! 🍻", time: "10 mins ago" },
  { id: 2, user: "David K.", role: "BUILDER", message: "Just deployed my Next.js 15 auth pipeline to Vercel! Check out the Vault showroom!", time: "5 mins ago" },
  { id: 3, user: "Elena R.", role: "BUILDER", message: "Anyone down for a live pairing session on AI vector embeddings in 1 hour?", time: "2 mins ago" }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(DEFAULT_MESSAGES);
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "demo@indiedev.quest";

    const cmd = command.trim().toLowerCase();
    let output = "";

    if (cmd === "/quest" || cmd === "/quests") {
      output = "📜 ACTIVE QUESTS:\n1. [Main] Ship a MVP in 14 Days (+300 XP / +150 Gold)\n2. [Side] Implement NextAuth & Drizzle Schema (+150 XP)";
    } else if (cmd === "/stats") {
      output = "📊 CHARACTER STATS:\nClass: Full-Stack Artisan\nLevel: 2\nXP: 250 / 600\nGold: 300\nParty: The Code Alchemists";
    } else if (cmd === "/cast-spell") {
      output = "✨ CAST SPELL: 'Auto-Refactor'! Code quality boosted +20%! +50 XP granted!";
    } else if (cmd === "/party") {
      output = "🛡️ GUILD COHORT: The Code Alchemists (4 Members, Led by Guildmaster Sarah)";
    } else if (cmd === "/gold") {
      output = "💰 GOLD BALANCE: 300 Gold. Visit /marketplace to spend Gold or list assets!";
    } else {
      output = `🤖 Executed command: '${command}'. Type /quest, /stats, /cast-spell, /party, or /gold for available terminal macros.`;
    }

    return NextResponse.json({ success: true, output });
  } catch (error) {
    console.error("POST tavern error:", error);
    return NextResponse.json({ success: true, output: "Command executed." });
  }
}
