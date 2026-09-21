"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { starsLabel } from "@/lib/academy-quiz";
import { ArrowLeft, Lock, Sparkles, Star, Trophy } from "lucide-react";

type PublicQuestion = { prompt: string; choices: string[] };
type PublicQuiz = { title: string; questions: PublicQuestion[] };
type PublicChapter = {
  chapterId: string;
  title: string;
  xp: number;
  lore: string;
  body: string[];
  quiz: PublicQuiz;
};
type PublicModule = {
  moduleId: string;
  title: string;
  blurb: string;
  chapters: PublicChapter[];
};
type PublicCourse = {
  courseId: string;
  title: string;
  tagline: string;
  classHint: string;
  difficulty: string;
  hours: string;
  xpReward: number;
  goldReward: number;
  modules: PublicModule[];
  finalQuiz: PublicQuiz;
};
type ProgressState = {
  completedChapterIds: string[];
  chapterStars: Record<string, number>;
  xpEarned: number;
  finalPercent: number;
  finalPassed: boolean;
};

function flatten(course: PublicCourse): PublicChapter[] {
  return course.modules.flatMap((module) => module.chapters);
}

export default function AcademyCoursePage() {
  const params = useParams();
  const courseId = String(params.courseId ?? "");
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastGrade, setLastGrade] = useState<{
    percent: number;
    passed: boolean;
    stars: number;
    correct: number;
    total: number;
  } | null>(null);

  const chapters = useMemo(() => (course ? flatten(course) : []), [course]);
  const viewingFinal = selectedId === "final";
  const chapter = chapters.find((item) => item.chapterId === selectedId) ?? null;
  const quiz = viewingFinal ? course?.finalQuiz : chapter?.quiz;

  const loadCourse = useCallback(async () => {
    const res = await axios.get(`/api/academy?courseId=${encodeURIComponent(courseId)}`);
    setCourse(res.data.course);
    setProgress(res.data.progress);
    return res.data as { course: PublicCourse; progress: ProgressState };
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    void (async () => {
      try {
        const data = await loadCourse();
        const done = data.progress.completedChapterIds;
        const all = flatten(data.course);
        const nextLocked = all.find((item) => !done.includes(item.chapterId));
        if (data.progress.finalPassed || (nextLocked == null && all.length > 0)) {
          setSelectedId("final");
        } else {
          setSelectedId(nextLocked?.chapterId || all[0]?.chapterId || "");
        }
      } catch (error) {
        console.error(error);
        toast.error("Could not open this course.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, loadCourse]);

  useEffect(() => {
    setAnswers([]);
    setLastGrade(null);
  }, [selectedId]);

  const completed = progress?.completedChapterIds ?? [];
  const allDone = chapters.every((item) => completed.includes(item.chapterId));
  const unlocked = (chapterId: string) => {
    const index = chapters.findIndex((item) => item.chapterId === chapterId);
    if (index <= 0) return index === 0;
    const previous = chapters[index - 1];
    return Boolean(previous && completed.includes(previous.chapterId));
  };

  const submitQuiz = async () => {
    if (!course || !quiz) return;
    setSaving(true);
    try {
      const res = await axios.post("/api/academy", {
        action: viewingFinal ? "FINAL_QUIZ" : "CHAPTER_QUIZ",
        courseId: course.courseId,
        chapterId: viewingFinal ? undefined : chapter?.chapterId,
        answers,
      });
      setLastGrade(res.data.grade);
      if (res.data.progress) setProgress(res.data.progress);
      if (res.data.success) {
        const loot = res.data.loot;
        const lootBit =
          res.data.firstClear && loot?.xp
            ? ` +${loot.xp} XP${loot.gold ? ` +${loot.gold} gold` : ""}`
            : "";
        toast.success(
          viewingFinal
            ? `Guild exam passed.${lootBit}`
            : `Chapter cleared · ${starsLabel(res.data.grade.stars)}.${lootBit}`
        );
        if (!viewingFinal) {
          const next = chapters.find((item) => ! (res.data.progress.completedChapterIds as string[]).includes(item.chapterId));
          if (next) setSelectedId(next.chapterId);
          else setSelectedId("final");
        }
      } else {
        toast.error(`Need 70%. You scored ${res.data.grade.percent}%.`);
      }
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
      toast.error(typeof message === "string" ? message : "Quiz failed to grade.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-12 text-gray-400 font-game text-xl">Opening the lecture hall…</p>;
  }
  if (!course || !progress) {
    return (
      <div className="p-12 space-y-4">
        <p className="text-white font-game text-2xl">That micro-course is not in the catalog.</p>
        <Button asChild variant="pixel" className="font-game">
          <Link href="/courses">Back to academy</Link>
        </Button>
      </div>
    );
  }

  const chapterPercent = chapters.length ? Math.round((completed.length / chapters.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/courses" className="text-xs font-mono text-indigo-300 flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Academy
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{course.difficulty}</Badge>
            <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">{course.classHint}</Badge>
            {progress.finalPassed && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">GRADUATE</Badge>
            )}
          </div>
          <h1 className="text-4xl font-game font-bold">{course.title}</h1>
          <p className="text-sm text-gray-400">{course.tagline}</p>
        </div>
        <div className="text-right font-mono text-xs text-gray-400 space-y-1">
          <div className="flex items-center justify-end gap-1 text-yellow-400">
            <Sparkles className="w-3.5 h-3.5" /> {progress.xpEarned} XP earned
          </div>
          <div>Exam purse: +{course.xpReward} XP / +{course.goldReward} gold</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-gray-500">
          <span>
            {completed.length}/{chapters.length} chapters
          </span>
          <span>{chapterPercent}%</span>
        </div>
        <Progress value={chapterPercent} className="h-2 bg-neutral-900" />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          {course.modules.map((module) => (
            <div key={module.moduleId} className="space-y-2">
              <div>
                <h3 className="font-game text-lg text-indigo-300">{module.title}</h3>
                <p className="text-[11px] text-gray-500">{module.blurb}</p>
              </div>
              {module.chapters.map((item) => {
                const done = completed.includes(item.chapterId);
                const open = unlocked(item.chapterId);
                const stars = progress.chapterStars[item.chapterId] || 0;
                return (
                  <button
                    key={item.chapterId}
                    type="button"
                    disabled={!open}
                    onClick={() => setSelectedId(item.chapterId)}
                    className={`w-full text-left p-3 rounded-xl border text-sm ${
                      selectedId === item.chapterId
                        ? "bg-indigo-950/50 border-indigo-500/50"
                        : open
                          ? "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
                          : "bg-neutral-950 border-neutral-900 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-game text-base">{item.title}</span>
                      {!open ? (
                        <Lock className="w-3.5 h-3.5 text-gray-600" />
                      ) : done ? (
                        <span className="text-yellow-400 text-xs">{"★".repeat(stars) || "✓"}</span>
                      ) : null}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">+{item.xp} XP</div>
                  </button>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            disabled={!allDone}
            onClick={() => setSelectedId("final")}
            className={`w-full text-left p-3 rounded-xl border ${
              viewingFinal
                ? "bg-yellow-950/40 border-yellow-500/50"
                : allDone
                  ? "bg-neutral-900 border-yellow-500/30 hover:border-yellow-400"
                  : "bg-neutral-950 border-neutral-900 opacity-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-game text-base text-yellow-400">Guild exam</span>
              {!allDone ? <Lock className="w-3.5 h-3.5 text-gray-600" /> : <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
            </div>
            <div className="text-[10px] font-mono text-gray-500 mt-1">
              {progress.finalPassed ? `Passed · ${progress.finalPercent}%` : "70% to graduate"}
            </div>
          </button>
        </div>

        <Card className="bg-neutral-900 border-indigo-500/20 p-6 md:p-8 space-y-6">
          {viewingFinal ? (
            <div className="space-y-2">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">FINAL QUIZ</Badge>
              <h2 className="font-game text-3xl">{course.finalQuiz.title}</h2>
              <p className="text-sm text-gray-400">
                Covers every module. 70% to pass, 85% for two stars, 100% for three. First pass pays the exam purse.
              </p>
            </div>
          ) : chapter ? (
            <div className="space-y-4">
              <p className="text-xs font-mono text-indigo-300 uppercase tracking-widest">{chapter.lore}</p>
              <h2 className="font-game text-3xl">{chapter.title}</h2>
              <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                {chapter.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}

          {quiz && (
            <div className="space-y-5 border-t border-neutral-800 pt-6">
              <h3 className="font-game text-2xl text-yellow-400">{quiz.title}</h3>
              {quiz.questions.map((question, questionIndex) => (
                <div key={question.prompt} className="space-y-2">
                  <p className="text-sm font-medium">
                    {questionIndex + 1}. {question.prompt}
                  </p>
                  <div className="grid gap-2">
                    {question.choices.map((choice, choiceIndex) => {
                      const picked = answers[questionIndex] === choiceIndex;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => {
                            setAnswers((current) => {
                              const next = [...current];
                              next[questionIndex] = choiceIndex;
                              return next;
                            });
                          }}
                          className={`text-left text-sm px-3 py-2 rounded-lg border ${
                            picked
                              ? "border-yellow-500/60 bg-yellow-950/40 text-yellow-200"
                              : "border-neutral-800 bg-neutral-950 text-gray-300 hover:border-neutral-600"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {lastGrade && (
                <p className={`text-sm font-mono ${lastGrade.passed ? "text-emerald-300" : "text-red-300"}`}>
                  {lastGrade.correct}/{lastGrade.total} · {lastGrade.percent}% · {starsLabel(lastGrade.stars)}
                  {lastGrade.stars > 0 ? ` ${"★".repeat(lastGrade.stars)}` : ""}
                </p>
              )}
              <Button
                variant="pixel"
                className="font-game text-xl"
                disabled={saving || answers.filter((value) => Number.isInteger(value)).length !== quiz.questions.length}
                onClick={() => void submitQuiz()}
              >
                {saving ? "Grading…" : viewingFinal ? "SUBMIT EXAM" : "SUBMIT CHAPTER QUIZ"}
                <Star className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
