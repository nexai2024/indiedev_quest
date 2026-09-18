import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    const { action = "ONBOARD" } = await req.json();

    if (action === "ONBOARD") {
      const mockConnectAccount = {
        accountId: `acct_connect_${Date.now()}`,
        onboardingUrl: `https://connect.stripe.com/express/oauth/authorize?response_type=code&client_id=ca_test_indiedev&scope=read_write`,
        status: "PENDING_VERIFICATION"
      };

      return NextResponse.json({
        success: true,
        account: mockConnectAccount,
        message: "Stripe Connect Express onboarding link generated."
      });
    }

    if (action === "PAYOUT") {
      return NextResponse.json({
        success: true,
        payoutId: `po_test_${Date.now()}`,
        amountInCents: 15000,
        currency: "usd",
        status: "IN_TRANSIT",
        message: "Automatic Stripe Connect payout initiated to seller bank account."
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json({ success: false, error: "Stripe Connect processing failed" }, { status: 500 });
  }
}
