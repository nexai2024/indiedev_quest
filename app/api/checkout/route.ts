import { db } from "@/config/db";
import { productsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { productId, type = "PRODUCT_PURCHASE" } = await req.json();
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Builder";

    if (type === "PRODUCT_PURCHASE") {
      const prodList = await db.select().from(productsTable).where(eq(productsTable.id, productId));
      if (prodList.length === 0) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }

      const prod = prodList[0];
      const checkoutUrl = prod.assetUrl || "https://indiedev.quest/vault";

      // Simulate Stripe Connect session generation
      const mockStripeSession = {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        amount_total: prod.priceInCents || 1900,
        currency: "usd",
        customer_email: userEmail,
        payment_status: "paid",
        url: checkoutUrl,
        metadata: {
          productId: prod.id,
          sellerId: prod.sellerId,
          buyerEmail: userEmail
        }
      };

      // Increment sales count in DB
      await db
        .update(productsTable)
        .set({ salesCount: (prod.salesCount || 0) + 1 })
        .where(eq(productsTable.id, productId));

      return NextResponse.json({
        success: true,
        session: mockStripeSession,
        url: checkoutUrl,
        message: "Stripe Connect Checkout session created successfully."
      });
    }

    if (type === "PRO_SUBSCRIPTION") {
      // Upgrade user subscription tier
      await db
        .update(usersTable)
        .set({ subscription: "pro" })
        .where(eq(usersTable.email, userEmail));

      return NextResponse.json({
        success: true,
        message: "Subscription upgraded to PRO Guild Membership!"
      });
    }

    return NextResponse.json({ success: false, message: "Invalid checkout type" }, { status: 400 });
  } catch (error) {
    console.error("Checkout POST route error:", error);
    return NextResponse.json(
      { success: false, message: "Checkout failed", error: String(error) },
      { status: 500 }
    );
  }
}
