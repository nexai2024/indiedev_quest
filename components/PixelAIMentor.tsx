"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Sparkles, X, MessageSquare, Send, ChevronUp, Flame } from "lucide-react";
import axios from "axios";

export default function PixelAIMentor() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; text: string }>>([
    {
      role: "ai",
      text: "Greetings, Adventurer! I am Pixel, your AI Quest Navigator. Ask me how to unblock your current quest, review your proof-of-work code, or break down main milestones!"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!prompt.trim()) return;
    const userQuery = prompt;
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: userQuery }]);
    setLoading(true);

    setTimeout(() => {
      let aiReply = "To ship 'Ship a MVP in 14 Days', scope down your core user value into 1 primary flow. Setup Clerk authentication and Next.js App Router server actions for state!";
      if (userQuery.toLowerCase().includes("auth") || userQuery.toLowerCase().includes("nextauth")) {
        aiReply = "For NextAuth / Clerk integration: Ensure middleware protects dynamic routes and use Server Actions for fast ORM mutations. Check your Drizzle schema models!";
      } else if (userQuery.toLowerCase().includes("stripe") || userQuery.toLowerCase().includes("money")) {
        aiReply = "To monetize with Stripe Connect: Setup webhook listeners for 'checkout.session.completed' and route platform fees automatically in the Guild Marketplace!";
      } else if (userQuery.toLowerCase().includes("boss") || userQuery.toLowerCase().includes("raid")) {
        aiReply = "Boss Raids require co-op guild damage! Submit your proof URL in the /raids section or cast a Class Spell to drain the Boss HP!";
      }
      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="pixel"
          className="rounded-full shadow-2xl p-4 flex items-center gap-2 border-2 border-yellow-400 bg-neutral-900 text-yellow-400 hover:scale-105 transition-all"
        >
          <Bot className="w-6 h-6 text-yellow-400 animate-bounce" />
          <span className="font-game text-2xl">PIXEL AI MENTOR</span>
        </Button>
      ) : (
        <Card className="w-80 sm:w-96 bg-neutral-900 border-2 border-yellow-400 text-white shadow-2xl rounded-2xl flex flex-col h-[480px]">
          <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-400 text-yellow-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="font-game text-xl text-yellow-400">PIXEL AI COMPANION</CardTitle>
                <div className="text-[10px] font-mono text-gray-400">NET NEW FEATURE 5</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg leading-relaxed ${
                  m.role === "ai"
                    ? "bg-yellow-950/20 border border-yellow-500/30 text-yellow-100"
                    : "bg-indigo-950/30 border border-indigo-500/30 text-indigo-100 ml-4"
                }`}
              >
                <div className="font-bold mb-1 flex items-center gap-1 text-[11px] text-yellow-400">
                  {m.role === "ai" ? <Sparkles className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  {m.role === "ai" ? "Pixel AI Mentor" : "You"}
                </div>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-yellow-400 animate-pulse">Pixel AI is thinking...</div>}
          </CardContent>

          <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex gap-2 rounded-b-2xl">
            <Input
              placeholder="Ask Pixel for quest advice..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              className="bg-neutral-900 border-neutral-800 text-white font-mono text-xs"
            />
            <Button variant="pixel" className="font-game text-lg px-4" onClick={handleAskAI}>
              <Send className="w-4 h-4 text-yellow-400" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
