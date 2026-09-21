"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { runArenaTestsInWorker } from "@/lib/run-arena-tests-browser";
import { looksUnsolved } from "@/lib/arena-starter";
import { arenaTestFile } from "@/lib/arena-tests";
import { labChallengeIdForQuest } from "@/lib/content/coding-quests";
import { amethyst } from "@codesandbox/sandpack-themes";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Code, Play, ShieldAlert, Sparkles, Terminal, Bot } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";

export type CodeLabChallenge = {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  initialCode: string;
  testCases: { name: string; expected: string }[];
  xpReward: number;
  goldReward: number;
  hints?: string[];
};

type Props = {
  challenge: CodeLabChallenge;
  questId?: string | null;
  questTitle?: string | null;
};

function SandpackSync({ onCodeChange }: { onCodeChange: (code: string) => void }) {
  const { sandpack } = useSandpack();
  const code = sandpack.files["/index.ts"]?.code ?? "";

  useEffect(() => {
    onCodeChange(code);
  }, [code, onCodeChange]);

  return null;
}

export default function CodeLab({ challenge, questId, questTitle }: Props) {
  const [code, setCode] = useState(challenge.initialCode);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [enemyHp, setEnemyHp] = useState(100);
  const [mentor, setMentor] = useState("");
  const [coaching, setCoaching] = useState(false);
  const testFile = useMemo(() => arenaTestFile(challenge.id), [challenge.id]);

  const onCodeChange = useCallback((next: string) => {
    setCode(next);
  }, []);

  const runAi = async (mode: "hint" | "review") => {
    setCoaching(true);
    try {
      const res = await axios.post("/api/ai/code-review", {
        code,
        challengeId: challenge.id,
        mode,
      });
      const review = res.data.review;
      const text = review
        ? `${review.summary}\n\nHint: ${review.hint}\n${(review.suggestions || []).map((item: string) => `• ${item}`).join("\n")}`
        : res.data.message || "No notes.";
      setMentor(text);
    } catch {
      toast.error("AI mentor is unavailable.");
    } finally {
      setCoaching(false);
    }
  };

  const handleRunCode = async () => {
    setRunning(true);
    setLogs(["Running tests in an isolated worker with fake timers..."]);
    try {
      if (looksUnsolved(code, challenge.initialCode)) {
        setEnemyHp(100);
        setLogs(["Tests did not run: the code still looks like the starter or contains TODO."]);
        toast.error("Implement the stub first.");
        return;
      }

      const report = await runArenaTestsInWorker(challenge.id, code);
      const nextLogs = [...report.logs];
      const failed = report.results.filter((result) => !result.passed).length;
      const total = report.results.length || 1;
      setLogs(nextLogs);
      setEnemyHp(report.passed ? 0 : Math.max(15, Math.round((failed / total) * 100)));

      if (!report.passed) {
        toast.error("Tests failed. Use Hint if you are stuck.");
        return;
      }

      const linkedQuest =
        questId && labChallengeIdForQuest(questId) === challenge.id ? questId : undefined;
      try {
        const res = await axios.post("/api/arena", {
          challengeId: challenge.id,
          code,
          questId: linkedQuest,
        });
        const serverLogs: string[] = res.data.logs || [];
        setLogs([...nextLogs, ...serverLogs.filter((line) => !nextLogs.includes(line))]);
        if (res.data.success) {
          toast.success(`Monster down. +${res.data.xpAwarded} XP / +${res.data.goldAwarded} Gold`);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          nextLogs.push("Tests passed locally. Sign in to collect XP and gold.");
          setLogs(nextLogs);
          toast.error("Sign in to collect loot.");
        } else {
          toast.error("Tests passed locally, but the server could not award loot.");
        }
      }
    } catch {
      toast.error("Failed to run tests");
      setLogs(["Test runner crashed. Check syntax and exports."]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Card className="space-y-4 border-neutral-800 bg-neutral-900 p-6">
          <div className="flex justify-between gap-3">
            <Badge variant="pixel">{challenge.title}</Badge>
            <div className="font-mono text-xs">
              <span className="font-bold text-yellow-400">+{challenge.xpReward} XP</span>
              <span className="ml-2 font-bold text-amber-400">+{challenge.goldReward} Gold</span>
            </div>
          </div>
          {questTitle && (
            <p className="font-mono text-xs text-indigo-300">Quest: {questTitle}. Passing tests completes it.</p>
          )}
          <p className="text-sm leading-relaxed text-gray-300">{challenge.description}</p>
          <ul className="list-disc space-y-1 pl-4 font-mono text-xs text-gray-400">
            {challenge.testCases.map((test) => (
              <li key={test.name}>{test.name}</li>
            ))}
          </ul>
          {!!challenge.hints?.length && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-200">
              Talent hint: {challenge.hints[0]}
            </div>
          )}
          <div>
            <label className="mb-2 flex items-center gap-1 font-mono text-xs uppercase text-indigo-400">
              <Code className="h-4 w-4" /> TypeScript Code Lab
            </label>
            <div className="overflow-hidden rounded-xl border border-neutral-800">
              <SandpackProvider
                key={challenge.id}
                template="vanilla-ts"
                theme={amethyst}
                files={{
                  "/index.ts": challenge.initialCode,
                  "/index.test.ts": {
                    code: testFile,
                    readOnly: true,
                  },
                }}
                options={{
                  visibleFiles: ["/index.ts", "/index.test.ts"],
                  activeFile: "/index.ts",
                  recompileMode: "delayed",
                  recompileDelay: 400,
                }}
              >
                <SandpackSync onCodeChange={onCodeChange} />
                <SandpackLayout className="!rounded-none !border-0">
                  <SandpackCodeEditor
                    showLineNumbers
                    showTabs
                    closableTabs={false}
                    style={{ height: 320 }}
                  />
                </SandpackLayout>
              </SandpackProvider>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="pixel" className="font-game text-xl" onClick={handleRunCode} disabled={running}>
              <Play className="mr-2 h-5 w-5 text-yellow-400" />
              {running ? "RUNNING TESTS..." : "RUN TESTS & ATTACK"}
            </Button>
            <Button variant="outline" className="font-game text-lg" onClick={() => void runAi("hint")} disabled={coaching}>
              <Sparkles className="mr-2 h-4 w-4" /> Hint
            </Button>
            <Button variant="outline" className="font-game text-lg" onClick={() => void runAi("review")} disabled={coaching}>
              <Bot className="mr-2 h-4 w-4" /> AI review
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-4 border-2 border-indigo-500/40 bg-neutral-900 p-6 text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-2 border-indigo-400 bg-indigo-500/10 text-indigo-400">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h3 className="font-game text-3xl text-white">{challenge.title}</h3>
          <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-left">
            <div className="mb-1 flex justify-between font-mono text-xs text-gray-400">
              <span>MONSTER HEALTH</span>
              <span className="font-bold text-indigo-400">{enemyHp} / 100 HP</span>
            </div>
            <Progress value={enemyHp} className="h-3 bg-neutral-900" />
          </div>
        </Card>
        <Card className="space-y-3 border-neutral-800 bg-neutral-900 p-6 font-mono text-xs">
          <div className="flex items-center gap-2 font-game text-sm font-bold text-yellow-400">
            <Terminal className="h-4 w-4" /> Combat console
          </div>
          <div className="h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-gray-300">
            {logs.length === 0 ? (
              <span className="italic text-gray-500">
                Write the export, then run tests. Tests execute your function. Hint/Review only coach.
              </span>
            ) : (
              logs.map((log, index) => (
                <div
                  key={`${index}-${log.slice(0, 24)}`}
                  className={log.includes("PASSED") || log.includes("defeated") || log.includes("All tests passed") ? "font-bold text-green-400" : ""}
                >
                  &gt; {log}
                </div>
              ))
            )}
          </div>
        </Card>
        {mentor && (
          <Card className="space-y-2 whitespace-pre-wrap border-indigo-500/30 bg-neutral-900 p-4 font-mono text-xs text-indigo-100">
            <div className="font-game text-lg text-indigo-300">AI mentor</div>
            {mentor}
          </Card>
        )}
      </div>
    </div>
  );
}
