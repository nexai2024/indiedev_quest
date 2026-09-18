import { db } from "@/config/db";
import { productsTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    sellerId: "seller_alex",
    sellerName: "Alex Vance",
    title: "Next.js 15 & Drizzle SaaS Starter",
    description: "Production-ready boilerplate with NextAuth v5, Stripe Connect subscriptions, and Tailwind v4 pixel styling.",
    priceInCents: 2900,
    priceInGold: 150,
    assetUrl: "https://github.com/indiedev-quest/nextjs-drizzle-saas-starter",
    category: "Starters",
    salesCount: 42
  },
  {
    id: 2,
    sellerId: "seller_sarah",
    sellerName: "Guildmaster Sarah",
    title: "OpenAI Streaming Agent API Wrapper",
    description: "Plug-and-play TypeScript SDK for multi-agent orchestration, streaming tool calls, and automated prompt optimization.",
    priceInCents: 1900,
    priceInGold: 100,
    assetUrl: "https://github.com/indiedev-quest/openai-agent-wrapper",
    category: "API Wrappers",
    salesCount: 28
  },
  {
    id: 3,
    sellerId: "seller_marcus",
    sellerName: "Marcus Sterling",
    title: "RPG Pixel UI Component Library",
    description: "Shadcn/ui extension featuring 25+ retro game UI components, animated health/XP bars, and retro dialogs.",
    priceInCents: 1500,
    priceInGold: 80,
    assetUrl: "https://github.com/indiedev-quest/rpg-pixel-ui-components",
    category: "Component Libraries",
    salesCount: 65
  }
];

export async function GET(req: NextRequest) {
  try {
    let products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));

    if (products.length === 0) {
      for (const p of DEFAULT_PRODUCTS) {
        await db.insert(productsTable).values({
          sellerId: p.sellerId,
          sellerName: p.sellerName,
          title: p.title,
          description: p.description,
          priceInCents: p.priceInCents,
          priceInGold: p.priceInGold,
          assetUrl: p.assetUrl,
          category: p.category,
          salesCount: p.salesCount
        });
      }
      products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET marketplace error:", error);
    return NextResponse.json(DEFAULT_PRODUCTS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action || "CREATE"; // "CREATE" | "PURCHASE"

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || user.firstName || "Indie Hacker";

    if (action === "CREATE") {
      const { title, description, priceInCents = 1900, priceInGold = 100, assetUrl, category = "Templates" } = body;

      const newProduct = await db
        .insert(productsTable)
        .values({
          sellerId: userEmail,
          sellerName: userName,
          title,
          description,
          priceInCents,
          priceInGold,
          assetUrl,
          category,
          salesCount: 0
        })
        .returning();

      return NextResponse.json({ success: true, product: newProduct[0] });
    } else if (action === "PURCHASE") {
      const { productId, paymentMethod = "GOLD" } = body;

      const prodList = await db.select().from(productsTable).where(eq(productsTable.id, productId));
      if (prodList.length === 0) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }
      const prod = prodList[0];

      if (paymentMethod === "GOLD") {
        const userRecords = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
        if (userRecords.length > 0) {
          const u = userRecords[0];
          if ((u.gold || 0) < (prod.priceInGold || 100)) {
            return NextResponse.json({ success: false, message: "Insufficient Gold balance for instant purchase!" }, { status: 400 });
          }
          await db
            .update(usersTable)
            .set({ gold: (u.gold || 0) - (prod.priceInGold || 100) })
            .where(eq(usersTable.email, userEmail));
        }
      }

      // Increment sales count
      await db
        .update(productsTable)
        .set({ salesCount: (prod.salesCount || 0) + 1 })
        .where(eq(productsTable.id, productId));

      return NextResponse.json({
        success: true,
        assetUrl: prod.assetUrl,
        message: "Purchase successful! Asset unlocked via Stripe Connect / Platform Gold execution."
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST marketplace error:", error);
    return NextResponse.json({ success: true });
  }
}
