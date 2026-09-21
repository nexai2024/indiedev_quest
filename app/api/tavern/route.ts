import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { clerkDisplayName } from "@/lib/user-profile";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

let tavernMessagesStore: Array<{
  id: number;
  user: string;
  role: string;
  message: string;
  time: string;
}> = [];

export async function GET() {
  const authed = await requireCharacter();
  if (!authed.ok) return authed.error;
  return NextResponse.json(tavernMessagesStore);
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    const body = await req.json();

    if (body.message) {
      const newMsg = {
        id: Date.now(),
        user: clerkDisplayName(user),
        role: "BUILDER",
        message: body.message,
        time: "Just now",
      };

      tavernMessagesStore.push(newMsg);
      if (tavernMessagesStore.length > 50) {
        tavernMessagesStore = tavernMessagesStore.slice(-50);
      }

      return NextResponse.json({ success: true, message: newMsg, store: tavernMessagesStore });
    }

    if (body.command) {
      const cmd = String(body.command).trim().toLowerCase();
      let output = "";

      if (cmd === "/quest" || cmd === "/quests") {
        output = "📜 No active quests. Visit /quests to accept one.";
      } else if (cmd === "/stats") {
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
          output = "Not signed in.";
        } else {
          const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
          const u = rows[0];
          if (!u) {
            output = "No character yet. Visit the dashboard to create one.";
          } else {
            output = `📊 CHARACTER STATS:\nName: ${u.name}\nClass: ${u.characterClass || "Unassigned"}\nLevel: ${u.level}\nXP: ${u.xp}\nGold: ${u.gold}`;
          }
        }
      } else if (cmd === "/cast-spell") {
        output = "✨ No spells unlocked yet. Complete quests to earn talent points.";
      } else if (cmd === "/party") {
        output = "🛡️ You are not in a party yet.";
      } else if (cmd === "/gold") {
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
          output = "Not signed in.";
        } else {
          const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
          output = `💰 GOLD BALANCE: ${rows[0]?.gold ?? 0} Gold.`;
        }
      } else {
        output = `🤖 Unknown command: '${body.command}'. Type /quest, /stats, /party, or /gold.`;
      }

      return NextResponse.json({ success: true, output });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST tavern error:", error);
    return NextResponse.json({ error: "Failed to run tavern action" }, { status: 500 });
  }
}
