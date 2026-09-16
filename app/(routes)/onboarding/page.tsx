"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Shield, Zap, Bot, Cpu, Target, Award, Users, CheckCircle2, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const CLASSES = [
  {
    id: "Frontend Specialist",
    title: "Frontend Specialist",
    icon: Shield,
    color: "from-blue-500 to-indigo-600",
    description: "Master UI arcana, Tailwind CSS, Framer Motion, and high-converting client experiences.",
    perks: "+15% UI Polish Bonus, Unique Theme Customizer"
  },
  {
    id: "Full-Stack Artisan",
    title: "Full-Stack Artisan",
    icon: Zap,
    color: "from-yellow-500 to-amber-600",
    description: "Architect full Next.js apps, Postgres ORM, server actions, and end-to-end features.",
    perks: "+20% Quest XP Multiplier, Full-Stack Starter Kits"
  },
  {
    id: "AI Builder",
    title: "AI Builder",
    icon: Bot,
    color: "from-purple-500 to-pink-600",
    description: "Harness LLMs, vector search, RAG pipelines, and autonomous AI agents.",
    perks: "+25% AI Sandbox Speed, Custom AI Mentor Prompts"
  },
  {
    id: "Systems Engineer",
    title: "Systems Engineer",
    icon: Cpu,
    color: "from-emerald-500 to-teal-600",
    description: "Master Docker, CI/CD pipelines, edge deployments, and high-performance infrastructure.",
    perks: "+15% Platform Credit Cashbacks, Infrastructure Templates"
  }
];

const GOALS = [
  "Ship First MVP in 14 Days",
  "Earn First $100 MRR",
  "Master Next.js & Modern AI Stack",
  "Monetize Micro-Digital Assets"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState("Full-Stack Artisan");
  const [selectedGoal, setSelectedGoal] = useState("Ship First MVP in 14 Days");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [loading, setLoading] = useState(false);

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      await axios.post("/api/user/onboard", {
        characterClass: selectedClass,
        primaryGoal: selectedGoal,
        skillLevel
      });
      toast.success("Character Created & Guild Assigned! Welcome Adventurer!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-game mb-3">
            <Sparkles className="w-4 h-4" /> indiedev.quest Character Creation
          </div>
          <h1 className="text-4xl md:text-5xl font-game font-bold tracking-wide">
            ALIGN YOUR GUILD PATH
          </h1>
          <p className="text-gray-400 mt-2 font-game text-xl">Step {step} of 4: Setup your RPG class and initialize your Quest Log</p>
          <Progress value={(step / 4) * 100} className="mt-4 h-2 bg-neutral-800" />
        </div>

        {/* STEP 1: CLASS SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-game text-yellow-400 text-center">SELECT YOUR CHARACTER CLASS</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {CLASSES.map((cls) => {
                const Icon = cls.icon;
                const isSelected = selectedClass === cls.id;
                return (
                  <Card
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`cursor-pointer border-2 transition-all duration-200 bg-neutral-900 ${
                      isSelected ? "border-yellow-400 bg-yellow-950/20 shadow-lg shadow-yellow-500/10" : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${cls.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="font-game text-2xl">{cls.title}</CardTitle>
                        <Badge variant={isSelected ? "pixel" : "outline"} className="mt-1">
                          {isSelected ? "Selected Class" : "Select"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-300">{cls.description}</p>
                      <div className="text-xs text-yellow-400/90 font-mono bg-neutral-950 p-2 rounded border border-neutral-800">
                        ✨ Perk: {cls.perks}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="pixel" className="font-game text-2xl px-8" onClick={() => setStep(2)}>
                Next: Select Goal <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PRIMARY GOAL */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-game text-yellow-400 text-center">SET YOUR PRIMARY QUEST GOAL</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal;
                return (
                  <Card
                    key={goal}
                    onClick={() => setSelectedGoal(goal)}
                    className={`cursor-pointer border-2 transition-all bg-neutral-900 ${
                      isSelected ? "border-yellow-400 bg-yellow-950/20 shadow-lg" : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                      <Target className={`w-6 h-6 ${isSelected ? "text-yellow-400" : "text-gray-400"}`} />
                      <CardTitle className="font-game text-xl">{goal}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-400">
                        Populates your initial Quest Log with milestone main quests and targeted side quests for {selectedClass}.
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" className="font-game text-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="pixel" className="font-game text-2xl px-8" onClick={() => setStep(3)}>
                Next: Skill Assessment <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SKILL ASSESSMENT */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-game text-yellow-400 text-center">INITIAL SKILL ASSESSMENT</h2>
            <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-6">
              <div>
                <label className="text-sm font-game text-gray-300 block mb-2 text-lg">
                  What is your experience level with full-stack development?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                    <Button
                      key={lvl}
                      type="button"
                      variant={skillLevel === lvl ? "pixel" : "outline"}
                      className="font-game text-xl py-6"
                      onClick={() => setSkillLevel(lvl)}
                    >
                      {lvl}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-sm space-y-2">
                <div className="flex items-center gap-2 text-yellow-400 font-game text-lg">
                  <Award className="w-5 h-5" /> Calculated Baseline Stats:
                </div>
                <div className="grid grid-cols-3 gap-4 text-center font-mono">
                  <div className="bg-neutral-900 p-2 rounded">
                    <div className="text-gray-400 text-xs">Level</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {skillLevel === "Advanced" ? "3" : skillLevel === "Intermediate" ? "2" : "1"}
                    </div>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <div className="text-gray-400 text-xs">Starting Gold</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {skillLevel === "Advanced" ? "450" : skillLevel === "Intermediate" ? "300" : "150"}
                    </div>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <div className="text-gray-400 text-xs">Starting XP</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {skillLevel === "Advanced" ? "300" : skillLevel === "Intermediate" ? "200" : "100"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="outline" className="font-game text-xl" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="pixel" className="font-game text-2xl px-8" onClick={() => setStep(4)}>
                Next: Match Guild Party <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: GUILD MATCHMAKING */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-game text-yellow-400">GUILD COHORT AUTO-MATCHING</h2>
            <Card className="bg-neutral-900 border-yellow-500/30 p-8 space-y-6">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full border-2 border-yellow-400 flex items-center justify-center mx-auto text-yellow-400 animate-pulse">
                <Users className="w-10 h-10" />
              </div>

              <div>
                <Badge variant="pixel" className="text-lg px-4 py-1">COHORT MATCHED</Badge>
                <h3 className="text-3xl font-game font-bold text-white mt-2">The Code Alchemists</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mt-1">
                  You have been matched with 4 peer builders at a similar stage, led by Senior Guildmaster Sarah!
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left font-mono text-xs">
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                  <div className="text-yellow-400 font-bold">Class</div>
                  <div>{selectedClass}</div>
                </div>
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                  <div className="text-yellow-400 font-bold">Primary Goal</div>
                  <div className="truncate">{selectedGoal}</div>
                </div>
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                  <div className="text-yellow-400 font-bold">Mentor</div>
                  <div>Guildmaster Sarah</div>
                </div>
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                  <div className="text-yellow-400 font-bold">Initial Quests</div>
                  <div>3 Active Quests</div>
                </div>
              </div>
            </Card>

            <div className="flex justify-center pt-4">
              <Button
                variant="pixel"
                className="font-game text-3xl px-12 py-6 text-yellow-400"
                onClick={handleFinishOnboarding}
                disabled={loading}
              >
                {loading ? "INITIALIZING QUEST LOG..." : "ENTER THE GUILD HALL 🚀"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
