"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Sparkles, Star } from "lucide-react";

type AcademyCard = {
  courseId: string;
  title: string;
  tagline: string;
  classHint: string;
  difficulty: string;
  hours: string;
  xpReward: number;
  goldReward: number;
  moduleCount: number;
  chapterCount: number;
  chaptersDone: number;
  chaptersTotal: number;
  progress: {
    finalPassed: boolean;
    xpEarned: number;
  };
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<AcademyCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await axios.get("/api/academy");
        setCourses(Array.isArray(res.data.courses) ? res.data.courses : []);
      } catch (error) {
        console.error(error);
        toast.error("Could not load the academy.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40 p-8 rounded-3xl border-2 border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)] space-y-4">
        <Badge variant="pixel" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
          GUILD ACADEMY
        </Badge>
        <h1 className="text-4xl md:text-5xl font-game font-bold text-indigo-300">MICRO-COURSES</h1>
        <p className="text-gray-300 font-game text-xl max-w-3xl">
          Short tracks: 2–4 modules, 3–4 chapters each. Pass the chapter quiz (70%) to unlock the next door.
          Clear every chapter, then sit the guild exam for XP, gold, and a graduate badge.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400 font-game text-xl">Unrolling the scrolls…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const percent = course.chaptersTotal
              ? Math.round((course.chaptersDone / course.chaptersTotal) * 100)
              : 0;
            return (
              <Card key={course.courseId} className="bg-neutral-900 border-neutral-800 p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{course.difficulty}</Badge>
                  <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">{course.classHint}</Badge>
                  {course.progress.finalPassed && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">GRADUATE</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className="font-game text-3xl text-white">{course.title}</h2>
                  <p className="text-sm text-gray-400">{course.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {course.moduleCount} modules · {course.chapterCount} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {course.hours}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Sparkles className="w-3.5 h-3.5" /> +{course.xpReward} XP exam
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>
                      {course.chaptersDone}/{course.chaptersTotal} chapters
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2 bg-neutral-950" />
                </div>
                <Button asChild variant="pixel" className="font-game text-xl w-full">
                  <Link href={`/courses/${course.courseId}`}>
                    {course.chaptersDone > 0 ? "CONTINUE" : "ENTER COURSE"}
                    {course.progress.finalPassed ? (
                      <Star className="ml-2 w-4 h-4" />
                    ) : null}
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
