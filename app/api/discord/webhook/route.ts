import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { event, title, description, user, url } = await req.json();

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

    const embed = {
      title: `🎮 indiedev.quest: ${title || "Guild Activity Update"}`,
      description: description || "A new RPG milestone was achieved in the Guild!",
      color: event === "RAID_VICTORY" ? 0xef4444 : event === "LEVEL_UP" ? 0xeab308 : 0x6366f1,
      fields: [
        { name: "Indie Builder", value: user || "Anonymous Hero", inline: true },
        { name: "Event Type", value: event || "GUILD_QUEST", inline: true }
      ],
      url: url || "https://indiedev.quest/vault",
      timestamp: new Date().toISOString()
    };

    if (discordWebhookUrl) {
      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] })
      });
    }

    return NextResponse.json({
      success: true,
      embed,
      message: "Discord sync payload dispatched successfully."
    });
  } catch (error) {
    console.error("Discord sync error:", error);
    return NextResponse.json({ success: false, error: "Discord webhook notification failed" }, { status: 500 });
  }
}
