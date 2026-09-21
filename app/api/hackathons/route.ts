import { db } from "@/config/db";
import { hackathonEntriesTable, hackathonsTable } from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { EDUCATION_SPONSORS, getEducationSponsor, parseCashPrizeUsd } from "@/lib/content/education-sponsors";
import { grantBadge, grantHeroLoot } from "@/lib/hero-loot";
import {
  canAwardPhase,
  canJoinPhase,
  canSubmitPhase,
  hackathonPhase,
  isHackathonTheme,
  isLiveProjectUrl,
  makeHackathonSlug,
  parseDurationHours,
  type HackathonPhase,
} from "@/lib/hackathon";
import { clerkDisplayName } from "@/lib/user-profile";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type HackathonRow = typeof hackathonsTable.$inferSelect;
type EntryRow = typeof hackathonEntriesTable.$inferSelect;

function serializeHackathon(
  row: HackathonRow,
  entries: EntryRow[],
  viewerEmail: string | null,
  now: number
) {
  const phase: HackathonPhase = hackathonPhase(row, now);
  const mine = viewerEmail ? entries.find((entry) => entry.userId === viewerEmail) ?? null : null;
  return {
    ...row,
    phase,
    entryCount: entries.length,
    submissionCount: entries.filter((entry) => entry.status === "SUBMITTED" || entry.status === "WINNER").length,
    isHost: Boolean(viewerEmail && row.hostId === viewerEmail),
    myEntry: mine,
    entries: entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.userName,
      status: entry.status,
      projectTitle: entry.projectTitle,
      projectUrl: entry.projectUrl,
      repoUrl: entry.repoUrl,
      submittedAt: entry.submittedAt,
    })),
  };
}

export async function GET() {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress ?? null;
    const now = Date.now();

    const hackathons = await db.select().from(hackathonsTable).orderBy(desc(hackathonsTable.startsAt));
    const entries = await db.select().from(hackathonEntriesTable);
    const byEvent = new Map<number, EntryRow[]>();
    for (const entry of entries) {
      const list = byEvent.get(entry.hackathonId) ?? [];
      list.push(entry);
      byEvent.set(entry.hackathonId, list);
    }

    return NextResponse.json({
      sponsors: EDUCATION_SPONSORS,
      hackathons: hackathons.map((row) => serializeHackathon(row, byEvent.get(row.id) ?? [], email, now)),
    });
  } catch (error) {
    console.error("GET hackathons error:", error);
    return NextResponse.json({ hackathons: [], sponsors: EDUCATION_SPONSORS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = typeof body.action === "string" ? body.action : "CREATE";
    const userName = clerkDisplayName(user);
    const now = Date.now();

    if (action === "CREATE") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      const theme = isHackathonTheme(body.theme) ? body.theme : "";
      if (title.length < 3 || title.length > 80) {
        return NextResponse.json({ error: "Give the hackathon a name (3–80 characters)." }, { status: 400 });
      }
      if (!theme) {
        return NextResponse.json({ error: "Pick a theme from the guild list." }, { status: 400 });
      }
      if (description.length < 10 || description.length > 500) {
        return NextResponse.json({ error: "Describe what builders should ship (10–500 characters)." }, { status: 400 });
      }

      const durationHours = parseDurationHours(body.durationHours);
      const startMs = typeof body.startsAt === "string" ? new Date(body.startsAt).getTime() : now;
      const startsAt = Number.isFinite(startMs) ? new Date(Math.max(startMs, now)) : new Date(now);
      const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
      const xpReward = Math.min(1000, Math.max(50, Number(body.xpReward) || 250));
      const goldReward = Math.min(500, Math.max(25, Number(body.goldReward) || 120));
      const sponsorId =
        typeof body.sponsorId === "string" && body.sponsorId !== "none" ? body.sponsorId.trim() : "";
      const sponsor = getEducationSponsor(sponsorId);
      if (sponsorId && !sponsor) {
        return NextResponse.json({ error: "Pick a listed education partner, or none." }, { status: 400 });
      }
      const prizeCashUsd = sponsor
        ? parseCashPrizeUsd(body.prizeCashUsd, sponsor.defaultPrizeUsd)
        : 0;
      if (sponsor && prizeCashUsd < 100) {
        return NextResponse.json({ error: "Sponsored cash prizes start at $100." }, { status: 400 });
      }

      const created = await db
        .insert(hackathonsTable)
        .values({
          slug: makeHackathonSlug(title),
          title,
          theme,
          description,
          hostId: email,
          hostName: userName,
          startsAt,
          endsAt,
          status: "OPEN",
          xpReward,
          goldReward,
          sponsorId: sponsor?.id ?? null,
          sponsorName: sponsor?.name ?? null,
          sponsorUrl: sponsor?.url ?? null,
          prizeCashUsd,
        })
        .returning();

      return NextResponse.json({ success: true, hackathon: serializeHackathon(created[0]!, [], email, now) });
    }

    const hackathonId = Number(body.hackathonId);
    if (!Number.isInteger(hackathonId) || hackathonId <= 0) {
      return NextResponse.json({ error: "hackathonId is required" }, { status: 400 });
    }

    const found = await db.select().from(hackathonsTable).where(eq(hackathonsTable.id, hackathonId)).limit(1);
    const hackathon = found[0];
    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }
    const phase = hackathonPhase(hackathon, now);

    if (action === "JOIN") {
      if (!canJoinPhase(phase)) {
        return NextResponse.json({ error: "This hackathon is not accepting builders." }, { status: 400 });
      }
      const existing = await db
        .select()
        .from(hackathonEntriesTable)
        .where(and(eq(hackathonEntriesTable.hackathonId, hackathonId), eq(hackathonEntriesTable.userId, email)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(hackathonEntriesTable).values({
          hackathonId,
          userId: email,
          userName,
          status: "JOINED",
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "SUBMIT") {
      if (!canSubmitPhase(phase)) {
        return NextResponse.json({ error: "Submissions are only open while the hackathon is live." }, { status: 400 });
      }
      const projectTitle = typeof body.projectTitle === "string" ? body.projectTitle.trim() : "";
      const projectUrl = typeof body.projectUrl === "string" ? body.projectUrl.trim() : "";
      const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";
      const notes = typeof body.notes === "string" ? body.notes.trim() : "";
      if (projectTitle.length < 2 || projectTitle.length > 80) {
        return NextResponse.json({ error: "Name the project you shipped." }, { status: 400 });
      }
      if (!isLiveProjectUrl(projectUrl)) {
        return NextResponse.json({ error: "Submit a live http(s) URL as proof." }, { status: 400 });
      }
      if (repoUrl && !isLiveProjectUrl(repoUrl)) {
        return NextResponse.json({ error: "Repo URL must be http(s) if provided." }, { status: 400 });
      }

      const existing = await db
        .select()
        .from(hackathonEntriesTable)
        .where(and(eq(hackathonEntriesTable.hackathonId, hackathonId), eq(hackathonEntriesTable.userId, email)))
        .limit(1);

      const payload = {
        userName,
        status: "SUBMITTED",
        projectTitle,
        projectUrl,
        repoUrl: repoUrl || null,
        notes: notes || null,
        submittedAt: new Date(),
      };

      if (existing.length === 0) {
        await db.insert(hackathonEntriesTable).values({
          hackathonId,
          userId: email,
          ...payload,
        });
      } else {
        await db
          .update(hackathonEntriesTable)
          .set(payload)
          .where(eq(hackathonEntriesTable.id, existing[0]!.id));
      }
      return NextResponse.json({ success: true });
    }

    if (action === "CLOSE") {
      if (hackathon.hostId !== email) {
        return NextResponse.json({ error: "Only the host can close submissions." }, { status: 403 });
      }
      if (phase === "COMPLETED") {
        return NextResponse.json({ error: "This hackathon is already finished." }, { status: 400 });
      }
      await db
        .update(hackathonsTable)
        .set({ endsAt: new Date() })
        .where(eq(hackathonsTable.id, hackathonId));
      return NextResponse.json({ success: true });
    }

    if (action === "AWARD") {
      if (hackathon.hostId !== email) {
        return NextResponse.json({ error: "Only the host can crown a winner." }, { status: 403 });
      }
      if (!canAwardPhase(phase)) {
        return NextResponse.json({ error: "Wait until the event is live or in judging." }, { status: 400 });
      }
      const winnerId = typeof body.winnerId === "string" ? body.winnerId : "";
      if (!winnerId) {
        return NextResponse.json({ error: "Pick a submitted builder." }, { status: 400 });
      }
      if (winnerId === email) {
        return NextResponse.json({ error: "Hosts cannot award themselves." }, { status: 400 });
      }
      const winnerRows = await db
        .select()
        .from(hackathonEntriesTable)
        .where(and(eq(hackathonEntriesTable.hackathonId, hackathonId), eq(hackathonEntriesTable.userId, winnerId)))
        .limit(1);
      const winner = winnerRows[0];
      if (!winner || winner.status === "JOINED") {
        return NextResponse.json({ error: "Winner must have submitted a live project." }, { status: 400 });
      }

      await db
        .update(hackathonsTable)
        .set({
          status: "COMPLETED",
          winnerId,
          winnerName: winner.userName,
          endsAt: new Date(hackathon.endsAt).getTime() > now ? new Date() : hackathon.endsAt,
        })
        .where(eq(hackathonsTable.id, hackathonId));

      await db
        .update(hackathonEntriesTable)
        .set({ status: "WINNER" })
        .where(eq(hackathonEntriesTable.id, winner.id));

      await grantHeroLoot(winnerId, hackathon.xpReward || 250, hackathon.goldReward || 120);
      await grantBadge(winnerId, `${hackathon.title} Champion`, "🏆");

      const cash = hackathon.prizeCashUsd || 0;
      const sponsorName = hackathon.sponsorName;
      return NextResponse.json({
        success: true,
        cashPrizeUsd: cash,
        message:
          cash > 0 && sponsorName
            ? `Champion crowned. ${sponsorName} cash purse: $${cash}. Coordinate the payout with the partner.`
            : "Champion crowned.",
      });
    }

    return NextResponse.json({ error: "Unknown hackathon action" }, { status: 400 });
  } catch (error) {
    console.error("POST hackathons error:", error);
    return NextResponse.json({ error: "Hackathon action failed" }, { status: 500 });
  }
}
