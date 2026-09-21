import { db } from "@/config/db";
import {
  mentorProfilesTable,
  mentorSlotsTable,
  mentorVouchesTable,
  mentorshipsTable,
  userQuestsTable,
  usersTable,
} from "@/config/schema";
import { requireCharacter } from "@/lib/character";
import { getGithubAuthStatus } from "@/lib/github-oauth";
import { isLiveProjectUrl } from "@/lib/hackathon";
import { adjustGold, grantBadge } from "@/lib/hero-loot";
import {
  applicationEligibility,
  asyncSessionPrice,
  averageRating,
  canReleaseEscrow,
  canVouch,
  isGuildStaff,
  MENTOR_SPECIALTIES,
  nextMentorRole,
  parseSpecialties,
  parseStaffEmails,
  sessionRoomUrl,
  slotsOverlap,
  splitGuildPayout,
  VOUCHES_TO_APPROVE,
} from "@/lib/mentorship";
import {
  createAccountLink,
  createConnectAccount,
  createMentorCheckout,
  retrieveCheckoutSession,
  retrieveConnectAccount,
  stripeConfigured,
  transferToMentor,
} from "@/lib/stripe-connect";
import { clerkDisplayName } from "@/lib/user-profile";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type ProfileRow = typeof mentorProfilesTable.$inferSelect;
type SessionRow = typeof mentorshipsTable.$inferSelect;
type SlotRow = typeof mentorSlotsTable.$inferSelect;

function staffList() {
  return parseStaffEmails(process.env.GUILD_MASTER_EMAILS);
}

function asUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function completedQuestCount(email: string) {
  const rows = await db.select().from(userQuestsTable).where(eq(userQuestsTable.userId, email));
  return rows.filter((row) => row.status === "COMPLETED").length;
}

function publicMentor(row: ProfileRow, extras?: { openSlots?: number; vouchCount?: number }) {
  return {
    userId: row.userId,
    name: row.name,
    status: row.status,
    bio: row.bio,
    headline: row.headline,
    specialties: asStringArray(row.specialties),
    hourlyRateGold: row.hourlyRateGold,
    hourlyRateUsdCents: row.hourlyRateUsdCents,
    githubLogin: row.githubLogin,
    githubUrl: row.githubUrl,
    proofUrls: asUrls(row.proofUrls),
    rating: averageRating(row.ratingSum || 0, row.ratingCount || 0),
    ratingCount: row.ratingCount || 0,
    sessionsCompleted: row.sessionsCompleted || 0,
    connectReady: Boolean(row.stripeConnectId),
    openSlots: extras?.openSlots ?? 0,
    vouchCount: extras?.vouchCount ?? 0,
  };
}

async function loadProfile(userId: string) {
  const rows = await db.select().from(mentorProfilesTable).where(eq(mentorProfilesTable.userId, userId)).limit(1);
  return rows[0] ?? null;
}

async function approveApplicant(row: ProfileRow, reviewedBy: string) {
  await db
    .update(mentorProfilesTable)
    .set({ status: "APPROVED", reviewedBy, reviewedAt: new Date(), rejectReason: null })
    .where(eq(mentorProfilesTable.id, row.id));
  const heroes = await db.select().from(usersTable).where(eq(usersTable.email, row.userId)).limit(1);
  const hero = heroes[0];
  if (hero) {
    await db
      .update(usersTable)
      .set({ role: nextMentorRole(hero.role) })
      .where(eq(usersTable.email, row.userId));
  }
  await grantBadge(row.userId, "Guild Mentor", "🧙");
}

function serializeSession(row: SessionRow, viewerEmail: string) {
  return {
    ...row,
    roomUrl: row.sessionKind === "LIVE" ? sessionRoomUrl(row.id) : null,
    isMentor: row.mentorId === viewerEmail,
    isMentee: row.menteeId === viewerEmail,
  };
}

async function releaseIfReady(session: SessionRow) {
  if (session.escrowStatus !== "HELD") return { released: false as const, session };
  if (
    !canReleaseEscrow({
      menteeCompleted: Boolean(session.menteeCompleted),
      mentorCompleted: Boolean(session.mentorCompleted),
      mentorRecap: session.mentorRecap || "",
      menteeRating: session.menteeRating ?? null,
    })
  ) {
    return { released: false as const, session };
  }

  if (session.paymentKind === "CASH") {
    if (!session.cashPaid) {
      return { released: false as const, session };
    }
    const profile = await loadProfile(session.mentorId);
    if (!profile?.stripeConnectId) {
      throw new Error("Mentor Stripe Connect is not ready for cash payout.");
    }
    const transfer = await transferToMentor({
      amountCents: session.mentorPayoutUsdCents || 0,
      destination: profile.stripeConnectId,
      mentorshipId: session.id,
    });
    const updated = await db
      .update(mentorshipsTable)
      .set({
        escrowStatus: "RELEASED",
        status: "COMPLETED",
        stripeTransferId: transfer.id,
      })
      .where(eq(mentorshipsTable.id, session.id))
      .returning();
    await finishMentorStats(session);
    return { released: true as const, session: updated[0]! };
  }

  const payout = await adjustGold(session.mentorId, session.mentorPayoutGold || 0);
  if (!payout.ok) throw new Error(payout.error);
  const updated = await db
    .update(mentorshipsTable)
    .set({ escrowStatus: "RELEASED", status: "COMPLETED" })
    .where(eq(mentorshipsTable.id, session.id))
    .returning();
  await finishMentorStats(session);
  return { released: true as const, session: updated[0]! };
}

async function finishMentorStats(session: SessionRow) {
  const profile = await loadProfile(session.mentorId);
  if (!profile) return;
  const rating = session.menteeRating || 0;
  await db
    .update(mentorProfilesTable)
    .set({
      sessionsCompleted: (profile.sessionsCompleted || 0) + 1,
      ratingSum: (profile.ratingSum || 0) + rating,
      ratingCount: (profile.ratingCount || 0) + (rating > 0 ? 1 : 0),
    })
    .where(eq(mentorProfilesTable.id, profile.id));
}

export async function GET() {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = isGuildStaff(authed.profile.role, email, staffList());
    const questsDone = await completedQuestCount(email);
    const github = await getGithubAuthStatus(authed.user.id);
    const profile = await loadProfile(email);

    const profiles = await db.select().from(mentorProfilesTable).orderBy(desc(mentorProfilesTable.createdAt));
    const vouches = await db.select().from(mentorVouchesTable);
    const slots = await db.select().from(mentorSlotsTable);
    const sessions = await db
      .select()
      .from(mentorshipsTable)
      .where(eq(mentorshipsTable.menteeId, email));
    const mentoring = await db
      .select()
      .from(mentorshipsTable)
      .where(eq(mentorshipsTable.mentorId, email));

    const vouchCount = new Map<string, number>();
    const vouchersByApplicant = new Map<string, typeof vouches>();
    for (const vouch of vouches) {
      vouchCount.set(vouch.applicantId, (vouchCount.get(vouch.applicantId) || 0) + 1);
      const list = vouchersByApplicant.get(vouch.applicantId) ?? [];
      list.push(vouch);
      vouchersByApplicant.set(vouch.applicantId, list);
    }

    const now = Date.now();
    const openSlotCount = new Map<string, number>();
    const openSlots = slots.filter((slot) => slot.status === "OPEN" && new Date(slot.startsAt).getTime() > now);
    for (const slot of openSlots) {
      openSlotCount.set(slot.mentorUserId, (openSlotCount.get(slot.mentorUserId) || 0) + 1);
    }

    const approved = profiles
      .filter((row) => row.status === "APPROVED")
      .map((row) => publicMentor(row, { openSlots: openSlotCount.get(row.userId) || 0, vouchCount: vouchCount.get(row.userId) || 0 }));

    const vetting = profiles
      .filter((row) => row.status === "VETTING" || (staff && row.status === "REJECTED"))
      .map((row) => ({
        ...publicMentor(row, { vouchCount: vouchCount.get(row.userId) || 0 }),
        vouches: (vouchersByApplicant.get(row.userId) ?? []).map((vouch) => ({
          voucherId: vouch.voucherId,
          voucherName: vouch.voucherName,
          note: vouch.note,
        })),
        alreadyVouched: (vouchersByApplicant.get(row.userId) ?? []).some((vouch) => vouch.voucherId === email),
      }));

    const mySessions = [...sessions, ...mentoring]
      .filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index)
      .sort((a, b) => Number(b.id) - Number(a.id))
      .map((row) => serializeSession(row, email));

    let connect = null;
    if (profile?.stripeConnectId && stripeConfigured()) {
      try {
        connect = await retrieveConnectAccount(profile.stripeConnectId);
      } catch {
        connect = { id: profile.stripeConnectId, payoutsEnabled: false, detailsSubmitted: false };
      }
    }

    return NextResponse.json({
      specialties: MENTOR_SPECIALTIES,
      stripeConfigured: stripeConfigured(),
      me: {
        email,
        role: authed.profile.role,
        name: authed.profile.name,
        gold: authed.profile.gold || 0,
        isStaff: staff,
        isMentor: profile?.status === "APPROVED" || authed.profile.role === "MENTOR",
        completedQuestCount: questsDone,
        github,
      },
      profile: profile
        ? { ...publicMentor(profile, { openSlots: openSlotCount.get(email) || 0, vouchCount: vouchCount.get(email) || 0 }), stripeConnectId: profile.stripeConnectId }
        : null,
      connect,
      mentors: approved,
      applications: vetting,
      slots: openSlots.map((slot) => ({
        id: slot.id,
        mentorUserId: slot.mentorUserId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: slot.status,
      })),
      mySlots: slots
        .filter((slot) => slot.mentorUserId === email)
        .map((slot) => ({
          id: slot.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: slot.status,
          sessionId: slot.sessionId,
        })),
      sessions: mySessions,
    });
  } catch (error) {
    console.error("GET mentorship error:", error);
    return NextResponse.json({ error: "Could not load mentorship." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const user = authed.user;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const action = typeof body.action === "string" ? body.action : "";
    const staff = isGuildStaff(authed.profile.role, email, staffList());
    const displayName = clerkDisplayName(user);
    const origin = req.nextUrl.origin;

    if (action === "APPLY") {
      const github = await getGithubAuthStatus(user.id);
      const questsDone = await completedQuestCount(email);
      const bio = typeof body.bio === "string" ? body.bio.trim() : "";
      const headline = typeof body.headline === "string" ? body.headline.trim().slice(0, 200) : "";
      const specialties = parseSpecialties(body.specialties);
      const proofUrls = (Array.isArray(body.proofUrls) ? body.proofUrls : [])
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(isLiveProjectUrl)
        .slice(0, 3);
      const hourlyRateGold = Math.round(Number(body.hourlyRateGold) || 100);
      const hourlyRateUsdCents = Math.round(Number(body.hourlyRateUsdCents) || 0);
      const check = applicationEligibility({
        githubConnected: github.connected,
        completedQuestCount: questsDone,
        proofUrls,
        bio,
        specialties,
        hourlyRateGold,
        hourlyRateUsdCents,
      });
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

      const existing = await loadProfile(email);
      if (existing?.status === "APPROVED") {
        return NextResponse.json({ error: "You are already a guild mentor." }, { status: 400 });
      }
      if (existing?.status === "VETTING") {
        return NextResponse.json({ error: "Your application is already in vetting." }, { status: 400 });
      }

      const payload = {
        userId: email,
        name: displayName,
        status: "VETTING" as const,
        bio,
        headline: headline || null,
        specialties,
        hourlyRateGold,
        hourlyRateUsdCents,
        githubLogin: github.login,
        githubUrl: github.login ? `https://github.com/${github.login}` : null,
        proofUrls,
        rejectReason: null,
      };

      if (existing) {
        await db.update(mentorProfilesTable).set(payload).where(eq(mentorProfilesTable.id, existing.id));
      } else {
        await db.insert(mentorProfilesTable).values(payload);
      }
      return NextResponse.json({ success: true, message: "Application submitted. Peers and guild staff will vet you." });
    }

    if (action === "VOUCH") {
      const applicantId = typeof body.applicantId === "string" ? body.applicantId : "";
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
      const applicant = await loadProfile(applicantId);
      if (!applicant || applicant.status !== "VETTING") {
        return NextResponse.json({ error: "That application is not open for vouches." }, { status: 404 });
      }
      const questsDone = await completedQuestCount(email);
      const allowed = canVouch({
        voucherEmail: email,
        applicantEmail: applicantId,
        voucherRole: authed.profile.role,
        voucherCompletedQuests: questsDone,
        staff,
      });
      if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 403 });

      const existing = await db
        .select()
        .from(mentorVouchesTable)
        .where(and(eq(mentorVouchesTable.applicantId, applicantId), eq(mentorVouchesTable.voucherId, email)))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(mentorVouchesTable).values({
          applicantId,
          voucherId: email,
          voucherName: displayName,
          note: note || null,
        });
      }
      const all = await db.select().from(mentorVouchesTable).where(eq(mentorVouchesTable.applicantId, applicantId));
      if (all.length >= VOUCHES_TO_APPROVE) {
        await approveApplicant(applicant, email);
        return NextResponse.json({ success: true, approved: true, message: "Peer vouches reached. They are now a guild mentor." });
      }
      return NextResponse.json({
        success: true,
        approved: false,
        vouches: all.length,
        needed: VOUCHES_TO_APPROVE,
      });
    }

    if (action === "REVIEW_APPLICATION") {
      if (!staff) return NextResponse.json({ error: "Guild staff only." }, { status: 403 });
      const applicantId = typeof body.applicantId === "string" ? body.applicantId : "";
      const decision = body.decision === "REJECT" ? "REJECT" : "APPROVE";
      const applicant = await loadProfile(applicantId);
      if (!applicant) return NextResponse.json({ error: "Application not found." }, { status: 404 });
      if (decision === "APPROVE") {
        await approveApplicant(applicant, email);
        return NextResponse.json({ success: true, message: "Mentor approved." });
      }
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "Not enough shipped proof.";
      await db
        .update(mentorProfilesTable)
        .set({ status: "REJECTED", rejectReason: reason, reviewedBy: email, reviewedAt: new Date() })
        .where(eq(mentorProfilesTable.id, applicant.id));
      return NextResponse.json({ success: true, message: "Application rejected." });
    }

    if (action === "CONNECT_ONBOARD") {
      const profile = await loadProfile(email);
      if (!profile || profile.status !== "APPROVED") {
        return NextResponse.json({ error: "Only approved mentors can connect payouts." }, { status: 403 });
      }
      if (!stripeConfigured()) {
        return NextResponse.json({ error: "Stripe is not configured on this guild yet. Gold sessions still pay out." }, { status: 400 });
      }
      const accountId = profile.stripeConnectId || (await createConnectAccount(email));
      if (!profile.stripeConnectId) {
        await db.update(mentorProfilesTable).set({ stripeConnectId: accountId }).where(eq(mentorProfilesTable.id, profile.id));
        await db.update(usersTable).set({ stripeConnectId: accountId }).where(eq(usersTable.email, email));
      }
      const url = await createAccountLink(
        accountId,
        `${origin}/mentorship?connect=return`,
        `${origin}/mentorship?connect=refresh`
      );
      return NextResponse.json({ success: true, url });
    }

    if (action === "ADD_SLOT") {
      const profile = await loadProfile(email);
      if (!profile || profile.status !== "APPROVED") {
        return NextResponse.json({ error: "Only approved mentors can post slots." }, { status: 403 });
      }
      const startsAt = new Date(body.startsAt);
      const endsAt = new Date(body.endsAt);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) {
        return NextResponse.json({ error: "Give a real start and end time." }, { status: 400 });
      }
      if (startsAt.getTime() < Date.now() - 60_000) {
        return NextResponse.json({ error: "Slots must start in the future." }, { status: 400 });
      }
      const duration = endsAt.getTime() - startsAt.getTime();
      if (duration < 20 * 60_000 || duration > 3 * 60 * 60_000) {
        return NextResponse.json({ error: "Slots must be 20–180 minutes." }, { status: 400 });
      }
      const existing = await db.select().from(mentorSlotsTable).where(eq(mentorSlotsTable.mentorUserId, email));
      const overlaps = existing.some(
        (slot) =>
          slot.status !== "CANCELLED" &&
          slotsOverlap(
            { startsAt: startsAt.getTime(), endsAt: endsAt.getTime() },
            { startsAt: new Date(slot.startsAt).getTime(), endsAt: new Date(slot.endsAt).getTime() }
          )
      );
      if (overlaps) return NextResponse.json({ error: "That window overlaps another slot." }, { status: 400 });
      const created = await db.insert(mentorSlotsTable).values({ mentorUserId: email, startsAt, endsAt, status: "OPEN" }).returning();
      return NextResponse.json({ success: true, slot: created[0] });
    }

    if (action === "CANCEL_SLOT") {
      const slotId = Number(body.slotId);
      const rows = await db.select().from(mentorSlotsTable).where(eq(mentorSlotsTable.id, slotId)).limit(1);
      const slot = rows[0];
      if (!slot || slot.mentorUserId !== email) return NextResponse.json({ error: "Slot not found." }, { status: 404 });
      if (slot.status === "BOOKED") return NextResponse.json({ error: "That slot is already booked." }, { status: 400 });
      await db.update(mentorSlotsTable).set({ status: "CANCELLED" }).where(eq(mentorSlotsTable.id, slotId));
      return NextResponse.json({ success: true });
    }

    if (action === "BOOK_LIVE" || action === "BOOK_ASYNC") {
      const mentorId = typeof body.mentorId === "string" ? body.mentorId : "";
      const paymentKind = body.paymentKind === "CASH" ? "CASH" : "GOLD";
      const topic = typeof body.topic === "string" ? body.topic.trim() : "";
      if (mentorId === email) return NextResponse.json({ error: "You cannot book yourself." }, { status: 400 });
      const mentor = await loadProfile(mentorId);
      if (!mentor || mentor.status !== "APPROVED") {
        return NextResponse.json({ error: "That mentor is not on the board." }, { status: 404 });
      }
      if (topic.length < 8 || topic.length > 200) {
        return NextResponse.json({ error: "Describe the session goal (8–200 characters)." }, { status: 400 });
      }

      const asyncTicket = action === "BOOK_ASYNC";
      let slot: SlotRow | null = null;
      if (!asyncTicket) {
        const slotId = Number(body.slotId);
        const slotRows = await db.select().from(mentorSlotsTable).where(eq(mentorSlotsTable.id, slotId)).limit(1);
        slot = slotRows[0] ?? null;
        if (!slot || slot.mentorUserId !== mentorId || slot.status !== "OPEN") {
          return NextResponse.json({ error: "Pick an open slot from that mentor." }, { status: 400 });
        }
      } else {
        const projectUrl = typeof body.projectUrl === "string" ? body.projectUrl.trim() : "";
        const question = typeof body.question === "string" ? body.question.trim() : "";
        if (!isLiveProjectUrl(projectUrl)) {
          return NextResponse.json({ error: "Async reviews need a live http(s) URL." }, { status: 400 });
        }
        if (question.length < 20 || question.length > 800) {
          return NextResponse.json({ error: "Write a 20–800 character review brief." }, { status: 400 });
        }
      }

      const goldPrice = asyncTicket ? asyncSessionPrice(mentor.hourlyRateGold) : mentor.hourlyRateGold;
      const cashPrice = asyncTicket ? asyncSessionPrice(mentor.hourlyRateUsdCents, 900) : mentor.hourlyRateUsdCents;
      if (paymentKind === "CASH") {
        if (!cashPrice) return NextResponse.json({ error: "This mentor takes gold only." }, { status: 400 });
        if (!stripeConfigured()) return NextResponse.json({ error: "Cash bookings need Stripe configured." }, { status: 400 });
        if (!mentor.stripeConnectId) {
          return NextResponse.json({ error: "This mentor has not finished Stripe Connect yet. Book with gold." }, { status: 400 });
        }
      }

      const splitGold = splitGuildPayout(goldPrice);
      const splitCash = splitGuildPayout(cashPrice);
      const projectUrl = typeof body.projectUrl === "string" ? body.projectUrl.trim() : "";
      const question = typeof body.question === "string" ? body.question.trim() : "";

      if (paymentKind === "GOLD") {
        const debit = await adjustGold(email, -goldPrice);
        if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });
      }

      const created = await db
        .insert(mentorshipsTable)
        .values({
          mentorId,
          mentorName: mentor.name,
          menteeId: email,
          menteeName: displayName,
          topic,
          status: paymentKind === "CASH" ? "PENDING" : "ACTIVE",
          costInGold: paymentKind === "GOLD" ? goldPrice : 0,
          scheduledAt: slot ? new Date(slot.startsAt).toISOString() : "async-review",
          sessionKind: asyncTicket ? "ASYNC" : "LIVE",
          paymentKind,
          slotId: slot?.id ?? null,
          projectUrl: asyncTicket ? projectUrl : projectUrl || null,
          question: asyncTicket ? question : null,
          escrowStatus: "HELD",
          guildCutGold: paymentKind === "GOLD" ? splitGold.guild : 0,
          mentorPayoutGold: paymentKind === "GOLD" ? splitGold.mentor : 0,
          cashUsdCents: paymentKind === "CASH" ? cashPrice : 0,
          guildCutUsdCents: paymentKind === "CASH" ? splitCash.guild : 0,
          mentorPayoutUsdCents: paymentKind === "CASH" ? splitCash.mentor : 0,
          cashPaid: false,
        })
        .returning();
      const session = created[0]!;

      if (slot) {
        await db.update(mentorSlotsTable).set({ status: "BOOKED", sessionId: session.id }).where(eq(mentorSlotsTable.id, slot.id));
      }

      if (paymentKind === "CASH") {
        const checkout = await createMentorCheckout({
          amountCents: cashPrice,
          customerEmail: email,
          mentorshipId: session.id,
          mentorUserId: mentorId,
          successUrl: `${origin}/mentorship?cash=success&checkout={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/mentorship?cash=cancel`,
        });
        await db.update(mentorshipsTable).set({ stripeCheckoutId: checkout.id }).where(eq(mentorshipsTable.id, session.id));
        return NextResponse.json({ success: true, checkoutUrl: checkout.url, sessionId: session.id });
      }

      return NextResponse.json({
        success: true,
        session: serializeSession(session, email),
        message: asyncTicket ? "Async review is in escrow. The mentor writes the recap, you rate, gold releases." : "Slot booked. Gold is in escrow until you both complete.",
      });
    }

    if (action === "CONFIRM_CASH") {
      const checkoutId = typeof body.checkoutId === "string" ? body.checkoutId : "";
      if (!checkoutId) return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
      const checkout = await retrieveCheckoutSession(checkoutId);
      if (!checkout.paid) return NextResponse.json({ error: "Payment is not complete yet." }, { status: 400 });
      const rows = await db.select().from(mentorshipsTable).where(eq(mentorshipsTable.id, checkout.mentorshipId)).limit(1);
      const session = rows[0];
      if (!session || session.menteeId !== email) return NextResponse.json({ error: "Session not found." }, { status: 404 });
      await db
        .update(mentorshipsTable)
        .set({ cashPaid: true, status: "ACTIVE", stripeCheckoutId: checkoutId })
        .where(eq(mentorshipsTable.id, session.id));
      return NextResponse.json({ success: true, message: "Cash escrow is held. Complete the session to pay the mentor." });
    }

    if (action === "MENTOR_COMPLETE") {
      const sessionId = Number(body.sessionId);
      const recap = typeof body.recap === "string" ? body.recap.trim() : "";
      const rating = Math.round(Number(body.rating) || 0);
      if (recap.length < 20) return NextResponse.json({ error: "Write a recap of at least 20 characters." }, { status: 400 });
      const rows = await db.select().from(mentorshipsTable).where(eq(mentorshipsTable.id, sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.mentorId !== email) return NextResponse.json({ error: "Not your session." }, { status: 403 });
      if (session.escrowStatus !== "HELD") return NextResponse.json({ error: "Escrow is already closed." }, { status: 400 });
      if (session.paymentKind === "CASH" && !session.cashPaid) {
        return NextResponse.json({ error: "Mentee has not paid cash yet." }, { status: 400 });
      }
      const patched = await db
        .update(mentorshipsTable)
        .set({
          mentorRecap: recap,
          mentorCompleted: true,
          mentorRating: rating >= 1 && rating <= 5 ? rating : session.mentorRating,
        })
        .where(eq(mentorshipsTable.id, sessionId))
        .returning();
      const released = await releaseIfReady(patched[0]!);
      return NextResponse.json({
        success: true,
        released: released.released,
        message: released.released ? "Both sides done. Payout sent to the mentor minus the guild cut." : "Recap saved. Waiting on the mentee rating.",
      });
    }

    if (action === "MENTEE_COMPLETE") {
      const sessionId = Number(body.sessionId);
      const rating = Math.round(Number(body.rating));
      if (rating < 1 || rating > 5) return NextResponse.json({ error: "Rate 1–5 stars." }, { status: 400 });
      const rows = await db.select().from(mentorshipsTable).where(eq(mentorshipsTable.id, sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.menteeId !== email) return NextResponse.json({ error: "Not your session." }, { status: 403 });
      if (session.escrowStatus !== "HELD") return NextResponse.json({ error: "Escrow is already closed." }, { status: 400 });
      const patched = await db
        .update(mentorshipsTable)
        .set({ menteeRating: rating, menteeCompleted: true })
        .where(eq(mentorshipsTable.id, sessionId))
        .returning();
      const released = await releaseIfReady(patched[0]!);
      return NextResponse.json({
        success: true,
        released: released.released,
        message: released.released ? "Rated. Escrow released to the mentor." : "Rating saved. Waiting on the mentor recap.",
      });
    }

    if (action === "CANCEL") {
      const sessionId = Number(body.sessionId);
      const rows = await db.select().from(mentorshipsTable).where(eq(mentorshipsTable.id, sessionId)).limit(1);
      const session = rows[0];
      if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
      const involved = session.mentorId === email || session.menteeId === email || staff;
      if (!involved) return NextResponse.json({ error: "Not your session." }, { status: 403 });
      if (session.escrowStatus !== "HELD") return NextResponse.json({ error: "Already closed." }, { status: 400 });
      if (session.mentorCompleted && session.menteeCompleted) {
        return NextResponse.json({ error: "Both already completed. Escrow will release." }, { status: 400 });
      }
      if (session.paymentKind === "GOLD" && (session.costInGold || 0) > 0) {
        const refund = await adjustGold(session.menteeId, session.costInGold || 0);
        if (!refund.ok) return NextResponse.json({ error: refund.error }, { status: 400 });
      }
      await db
        .update(mentorshipsTable)
        .set({ status: "CANCELLED", escrowStatus: "REFUNDED" })
        .where(eq(mentorshipsTable.id, sessionId));
      if (session.slotId) {
        await db.update(mentorSlotsTable).set({ status: "OPEN", sessionId: null }).where(eq(mentorSlotsTable.id, session.slotId));
      }
      return NextResponse.json({
        success: true,
        message: session.paymentKind === "CASH" ? "Cancelled. Cash refunds are handled in Stripe if the payment posted." : "Cancelled. Gold returned to the mentee.",
      });
    }

    return NextResponse.json({ error: "Unknown mentorship action" }, { status: 400 });
  } catch (error) {
    console.error("POST mentorship error:", error);
    const message = error instanceof Error ? error.message : "Mentorship action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
