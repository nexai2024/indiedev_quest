import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

let tavernMessagesStore = [
  { id: 1, user: "Guildmaster Sarah", role: "MENTOR", message: "Welcome to the Guild Tavern! Grab a brew and share what you're building today! 🍻", time: "10 mins ago" },
  { id: 2, user: "David K.", role: "BUILDER", message: "Just deployed my Next.js 15 auth pipeline to Vercel! Check out the Vault showroom!", time: "5 mins ago" },
  { id: 3, user: "Elena R.", role: "BUILDER", message: "Anyone down for a live pairing session on AI vector embeddings in 1 hour?", time: "2 mins ago" }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(tavernMessagesStore);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Post a new real-time Tavern chat message
    if (body.message) {
      const user = await currentUser();
      const userName = user?.fullName || user?.firstName || body.user || "Indie Hero";
      const userRole = body.role || "BUILDER";

      const newMsg = {
        id: Date.now(),
        user: userName,
        role: userRole,
        message: body.message,
        time: "Just now"
      };

      tavernMessagesStore.push(newMsg);
      if (tavernMessagesStore.length > 50) {
        tavernMessagesStore = tavernMessagesStore.slice(-50);
      }

      return NextResponse.json({ success: true, message: newMsg, store: tavernMessagesStore });
    }

    // 2. Execute CLI Macro Command
    if (body.command) {
      const command = body.command;
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST tavern error:", error);
    return NextResponse.json({ success: true, output: "Command executed." });
  }
}
