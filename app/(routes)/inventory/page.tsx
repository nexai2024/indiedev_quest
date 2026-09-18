"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Shield, Zap } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/inventory").then((res) => setItems(res.data));
  }, []);

  const handleEquip = (name: string) => {
    toast.success(`Equipped cosmetic item: "${name}"!`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 shadow-xl">
        <h1 className="text-4xl font-game font-bold text-yellow-400">HERO INVENTORY & COSMETIC GEAR</h1>
        <p className="text-gray-300 font-game text-xl">Equip unlocked retro crowns, theme palettes, and aura effects!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
            <Badge variant="pixel" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
              {item.rarity} {item.type}
            </Badge>
            <h3 className="text-xl font-game font-bold">{item.name}</h3>
            <Button variant="pixel" className="w-full font-game text-xl" onClick={() => handleEquip(item.name)}>
              {item.equipped ? "EQUIPPED ✓" : "EQUIP GEAR"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
