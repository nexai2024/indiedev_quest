import { db } from "@/config/db";
import { productsTable, usersTable, userBadgesTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers.get("stripe-signature");

    if (!webhookSecret) {
      return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature header" }, { status: 401 });
    }

    // Verify Stripe signature format: t=timestamp,v1=signature
    const sigItems = signature.split(",").reduce((acc: any, item) => {
      const [k, v] = item.split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    if (!sigItems.t || !sigItems.v1) {
      return NextResponse.json({ error: "Invalid Stripe signature format" }, { status: 401 });
    }

    const signedPayload = `${sigItems.t}.${rawBody}`;
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const expectedSig = hmac.update(signedPayload).digest("hex");

    const sigBuf = Buffer.from(sigItems.v1);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return NextResponse.json({ error: "Stripe signature verification failed" }, { status: 401 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }

    const eventType = event.type || "checkout.session.completed";

    if (eventType === "checkout.session.completed") {
      const session = event.data?.object || {};
      const customerEmail = session.customer_email || session.metadata?.buyerEmail;
      const metadata = session.metadata || {};

      if (customerEmail && metadata.productId) {
        const prodId = Number(metadata.productId);
        const prods = await db.select().from(productsTable).where(eq(productsTable.id, prodId));
        if (prods.length > 0) {
          await db
            .update(productsTable)
            .set({ salesCount: (prods[0].salesCount || 0) + 1 })
            .where(eq(productsTable.id, prodId));
        }
      }

      if (customerEmail && (metadata.type === "PRO_SUBSCRIPTION" || session.mode === "subscription")) {
        await db
          .update(usersTable)
          .set({ subscription: "pro" })
          .where(eq(usersTable.email, customerEmail));

        await db.insert(userBadgesTable).values({
          userId: customerEmail,
          badgeName: "Pro Guildmaster",
          badgeIcon: "👑"
        });
      }

      return NextResponse.json({ received: true, status: "PROCESSED", eventType });
    }

    return NextResponse.json({ received: true, status: "IGNORED", eventType });
  } catch (error) {
    console.error("Stripe Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
