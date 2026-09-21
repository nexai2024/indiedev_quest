"use client";

import CodeLab, { type CodeLabChallenge } from "@/components/CodeLab";
import { Button } from "@/components/ui/button";
import { labChallengeIdForQuest } from "@/lib/content/coding-quests";
import { getQuestById } from "@/lib/content/quest-proof-spec";
import axios from "axios";
import { Swords } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function ArenaInner() {
  const searchParams = useSearchParams();
  const questId = searchParams.get("quest");
  const quest = questId ? getQuestById(questId) : null;
  const linkedChallengeId = questId ? labChallengeIdForQuest(questId) : null;

  const [challenges, setChallenges] = useState<CodeLabChallenge[]>([]);
  const [activeId, setActiveId] = useState<string | null>(linkedChallengeId);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/arena");
        const list: CodeLabChallenge[] = Array.isArray(res.data?.challenges)
          ? res.data.challenges
          : Array.isArray(res.data)
            ? res.data
            : [];
        setChallenges(list);
        setActiveId((current) => {
          if (linkedChallengeId && list.some((item) => item.id === linkedChallengeId)) {
            return linkedChallengeId;
          }
          if (current && list.some((item) => item.id === current)) return current;
          return list[0]?.id ?? null;
        });
      } catch (error) {
        console.error(error);
      }
    };
    void load();
  }, [linkedChallengeId]);

  const categories = ["All", ...Array.from(new Set(challenges.map((item) => item.category).filter(Boolean)))];
  const visibleChallenges = challenges.filter((item) => category === "All" || item.category === category);
  const activeChallenge = useMemo(
    () => challenges.find((item) => item.id === activeId) ?? null,
    [challenges, activeId]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-white md:p-12">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40 p-8 shadow-xl md:flex-row md:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-game text-xs text-indigo-400">
            <Swords className="h-4 w-4 text-indigo-400" /> IN-APP CODE LAB
          </div>
          <h1 className="font-game text-4xl font-bold tracking-wide text-white md:text-5xl">THE CODE ARENA</h1>
          <p className="mt-1 font-game text-xl text-gray-400">
            {quest
              ? `Solving ${quest.title}. Implement the stub, then run tests. Your function actually executes. Hint and AI review coach — they cannot pass the kata.`
              : "Pick a coding monster. Edit the TypeScript stub. Real tests attack the monster. Hint / AI review if you get stuck."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((name) => (
            <Button
              key={name}
              variant={category === name ? "pixel" : "outline"}
              className="font-game py-4 text-lg"
              onClick={() => setCategory(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleChallenges.map((challenge) => (
            <button
              key={challenge.id}
              type="button"
              onClick={() => setActiveId(challenge.id)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                activeChallenge?.id === challenge.id
                  ? "border-yellow-400 bg-yellow-500/10"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
              }`}
            >
              <div className="font-game text-lg leading-tight text-white">⚔️ {challenge.title}</div>
              <div className="mt-1 font-mono text-[11px] text-gray-400">
                {challenge.difficulty || "Arena"} · +{challenge.xpReward} XP
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeChallenge ? (
        <CodeLab
          key={activeChallenge.id}
          challenge={activeChallenge}
          questId={linkedChallengeId === activeChallenge.id ? questId : null}
          questTitle={linkedChallengeId === activeChallenge.id ? quest?.title : null}
        />
      ) : (
        <p className="font-mono text-sm text-gray-500">Loading challenges…</p>
      )}
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-gray-400">Loading the arena…</div>}>
      <ArenaInner />
    </Suspense>
  );
}
