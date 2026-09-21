import { requireCharacter } from "@/lib/character";
import { createAccountLink, createConnectAccount, retrieveConnectAccount, stripeConfigured } from "@/lib/stripe-connect";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { mentorProfilesTable, usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!stripeConfigured()) {
      return NextResponse.json({ configured: false, payoutsEnabled: false });
    }
    const profiles = await db.select().from(mentorProfilesTable).where(eq(mentorProfilesTable.userId, email)).limit(1);
    const accountId = profiles[0]?.stripeConnectId;
    if (!accountId) return NextResponse.json({ configured: true, connected: false, payoutsEnabled: false });
    const account = await retrieveConnectAccount(accountId);
    return NextResponse.json({ configured: true, connected: true, ...account });
  } catch (error) {
    console.error("GET stripe connect error:", error);
    return NextResponse.json({ configured: stripeConfigured(), error: "Could not load Connect status." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await requireCharacter();
    if (!authed.ok) return authed.error;
    const email = authed.user.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!stripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured. Gold mentorship still pays mentors." }, { status: 400 });
    }

    const profiles = await db.select().from(mentorProfilesTable).where(eq(mentorProfilesTable.userId, email)).limit(1);
    const profile = profiles[0];
    if (!profile || profile.status !== "APPROVED") {
      return NextResponse.json({ error: "Only approved mentors can open Connect." }, { status: 403 });
    }

    const accountId = profile.stripeConnectId || (await createConnectAccount(email));
    if (!profile.stripeConnectId) {
      await db.update(mentorProfilesTable).set({ stripeConnectId: accountId }).where(eq(mentorProfilesTable.id, profile.id));
      await db.update(usersTable).set({ stripeConnectId: accountId }).where(eq(usersTable.email, email));
    }

    const origin = req.nextUrl.origin;
    const url = await createAccountLink(accountId, `${origin}/mentorship?connect=return`, `${origin}/mentorship?connect=refresh`);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    const message = error instanceof Error ? error.message : "Stripe Connect processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
