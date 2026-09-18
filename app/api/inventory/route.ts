import { NextRequest, NextResponse } from "next/server";

const DEFAULT_INVENTORY = [
  { id: 1, name: "Crown of the Guildmaster", type: "HELMET", rarity: "LEGENDARY", equipped: true },
  { id: 2, name: "Aura of Speed", type: "EFFECT", rarity: "EPIC", equipped: true },
  { id: 3, name: "Shadcn Pixel Theme", type: "THEME", rarity: "RARE", equipped: false }
];

export async function GET(req: NextRequest) {
  return NextResponse.json(DEFAULT_INVENTORY);
}

export async function POST(req: NextRequest) {
  try {
    const { itemId } = await req.json();
    return NextResponse.json({ success: true, equippedItemId: itemId, message: "Equipped cosmetic gear!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to equip item" }, { status: 500 });
  }
}
