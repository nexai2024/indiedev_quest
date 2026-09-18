"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Volume2, VolumeX, MessageSquare, Terminal, Send, Radio } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Message {
  id: number;
  user: string;
  role: string;
  message: string;
  time: string;
}

export default function TavernPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [terminalCmd, setTerminalCmd] = useState("");
  const [sseConnected, setSseConnected] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "indiedev.quest RPG Terminal v1.0 initialized.",
    "Type '/quest', '/stats', '/cast-spell', '/party', or '/gold'..."
  ]);
  const [soundPlaying, setSoundPlaying] = useState(false);

  useEffect(() => {
    fetchTavernMessages();

    // Initialize Real-time Server-Sent Events (SSE) Stream
    const eventSource = new EventSource("/api/tavern/stream");
    eventSource.onopen = () => setSseConnected(true);
    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "TAVERN_PING") {
          fetchTavernMessages();
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchTavernMessages = async () => {
    try {
      const res = await axios.get("/api/tavern");
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const msg = newMessage;
    setNewMessage("");

    try {
      const res = await axios.post("/api/tavern", { message: msg });
      if (res.data.store) {
        setMessages(res.data.store);
      }
      toast.success("Message posted to Guild Tavern!");
    } catch (err) {
      toast.error("Failed to post message");
    }
  };

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCmd.trim()) return;
    const inputCmd = terminalCmd;
    setTerminalCmd("");
    setTerminalHistory((prev) => [...prev, `$ ${inputCmd}`]);

    try {
      const res = await axios.post("/api/tavern", { command: inputCmd });
      setTerminalHistory((prev) => [...prev, res.data.output]);
    } catch (err) {
      setTerminalHistory((prev) => [...prev, "Command execution failed"]);
    }
  };

  const toggleSoundscape = () => {
    setSoundPlaying(!soundPlaying);
    toast.info(!soundPlaying ? "🔊 Lo-Fi RPG Tavern Ambient Soundscape Enabled!" : "🔇 Audio Muted.");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-8 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-game mb-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" /> NET NEW FEATURE 3: REAL-TIME SSE TAVERN & RPG CLI TERMINAL
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide text-white">
            THE TAVERN & TERMINAL
          </h1>
          <p className="text-gray-400 mt-1 font-game text-xl">
            Live cohort chat stream (SSE Status: {sseConnected ? "ONLINE ⚡" : "CONNECTING..."}), lo-fi soundscapes, and CLI macros.
          </p>
        </div>

        <Button
          variant={soundPlaying ? "pixel" : "outline"}
          className="font-game text-2xl py-6 px-6"
          onClick={toggleSoundscape}
        >
          {soundPlaying ? <Volume2 className="mr-2 w-5 h-5 text-yellow-400" /> : <VolumeX className="mr-2 w-5 h-5" />}
          {soundPlaying ? "LO-FI SOUNDSCAPE ON 🎵" : "ENABLE TAVERN SOUNDSCAPE"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Guild Party Chat Stream */}
        <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col justify-between h-[520px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="font-game text-2xl text-amber-400 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> LIVE GUILD CHAT STREAM
              </h3>
              <Badge variant="pixel" className="text-xs">THE CODE ALCHEMISTS</Badge>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {messages.map((m) => (
                <div key={m.id} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-yellow-400">{m.user}</span>
                    <span className="text-gray-500">{m.time}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-neutral-800">
            <Input
              placeholder="Post a message to your guild cohort..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-neutral-950 border-neutral-800 text-white"
            />
            <Button variant="pixel" className="font-game text-xl px-5" onClick={handleSendMessage}>
              <Send className="w-4 h-4 text-yellow-400" />
            </Button>
          </div>
        </Card>

        {/* Right: Retro RPG CLI Terminal */}
        <Card className="bg-neutral-900 border-2 border-yellow-500/30 p-6 flex flex-col justify-between h-[520px]">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="font-game text-2xl text-yellow-400 flex items-center gap-2">
                <Terminal className="w-5 h-5" /> RETRO RPG CLI TERMINAL
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-gray-400">bash / zsh</Badge>
            </div>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-xs text-green-400 h-[360px] overflow-y-auto space-y-2">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className={line.startsWith("$") ? "text-yellow-400 font-bold" : "text-green-400 whitespace-pre-wrap"}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunCommand} className="flex gap-2 pt-3 border-t border-neutral-800">
            <Input
              placeholder="Type /quest, /stats, /cast-spell, /party, /gold..."
              value={terminalCmd}
              onChange={(e) => setTerminalCmd(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-green-400 font-mono text-xs"
            />
            <Button type="submit" variant="pixel" className="font-game text-xl px-5">
              EXECUTE
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
