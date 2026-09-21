const STRIPE_API = "https://api.stripe.com/v1";

export function stripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? key : null;
}

export function stripeConfigured(): boolean {
  return Boolean(stripeSecretKey());
}

type StripeObject = Record<string, unknown>;

async function stripeForm(path: string, params: Record<string, string>): Promise<StripeObject> {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  const body = new URLSearchParams(params);
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await response.json()) as StripeObject & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(json.error?.message || `Stripe ${path} failed`);
  }
  return json;
}

async function stripeGet(path: string): Promise<StripeObject> {
  const key = stripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const json = (await response.json()) as StripeObject & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(json.error?.message || `Stripe GET ${path} failed`);
  }
  return json;
}

export async function createConnectAccount(email: string) {
  const account = await stripeForm("/accounts", {
    type: "express",
    email,
    "capabilities[card_payments][requested]": "true",
    "capabilities[transfers][requested]": "true",
    "metadata[guild]": "indiedev.quest",
  });
  return String(account.id);
}

export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  const link = await stripeForm("/account_links", {
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return String(link.url);
}

export async function retrieveConnectAccount(accountId: string) {
  const account = await stripeGet(`/accounts/${accountId}`);
  return {
    id: String(account.id),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
}

export async function createMentorCheckout(args: {
  amountCents: number;
  customerEmail: string;
  mentorshipId: number;
  mentorUserId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripeForm("/checkout/sessions", {
    mode: "payment",
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    customer_email: args.customerEmail,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(args.amountCents),
    "line_items[0][price_data][product_data][name]": "IndieDev Quest mentorship",
    "metadata[mentorshipId]": String(args.mentorshipId),
    "metadata[mentorUserId]": args.mentorUserId,
    "payment_intent_data[metadata][mentorshipId]": String(args.mentorshipId),
  });
  return {
    id: String(session.id),
    url: typeof session.url === "string" ? session.url : null,
    paymentIntent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object" && "id" in session.payment_intent
          ? String((session.payment_intent as { id: string }).id)
          : null,
  };
}

export async function retrieveCheckoutSession(sessionId: string) {
  const session = await stripeGet(`/checkout/sessions/${sessionId}`);
  const metadata =
    session.metadata && typeof session.metadata === "object" ? (session.metadata as Record<string, string>) : {};
  return {
    id: String(session.id),
    paid: session.payment_status === "paid",
    mentorshipId: Number(metadata.mentorshipId || 0),
    paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
  };
}

export async function transferToMentor(args: {
  amountCents: number;
  destination: string;
  mentorshipId: number;
}) {
  if (args.amountCents <= 0) {
    return { id: "skip_zero", amount: 0 };
  }
  const transfer = await stripeForm("/transfers", {
    amount: String(args.amountCents),
    currency: "usd",
    destination: args.destination,
    "metadata[mentorshipId]": String(args.mentorshipId),
  });
  return { id: String(transfer.id), amount: args.amountCents };
}
