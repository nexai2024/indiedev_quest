import { describe, expect, it } from "vitest";
import { gradeQuiz, starsLabel } from "../lib/academy-quiz";
import {
  ACADEMY_COURSES,
  allChaptersComplete,
  flattenChapters,
  isChapterUnlocked,
  publicCourse,
} from "../lib/content/academy-courses";
import { EDUCATION_SPONSORS, getEducationSponsor, parseCashPrizeUsd } from "../lib/content/education-sponsors";

describe("education sponsors", () => {
  it("lists known education partners and clamps cash purses", () => {
    expect(EDUCATION_SPONSORS.length).toBeGreaterThanOrEqual(6);
    expect(getEducationSponsor("github-education")?.name).toBe("GitHub Education");
    expect(getEducationSponsor("vercel")?.defaultPrizeUsd).toBe(2000);
    expect(getEducationSponsor("not-a-partner")).toBeNull();
    expect(parseCashPrizeUsd(2500)).toBe(2500);
    expect(parseCashPrizeUsd(-10)).toBe(0);
    expect(parseCashPrizeUsd(999999)).toBe(50_000);
    expect(parseCashPrizeUsd("nope", 1500)).toBe(1500);
  });
});

describe("guild academy", () => {
  it("keeps every course in the micro-course shape", () => {
    expect(ACADEMY_COURSES.length).toBeGreaterThanOrEqual(2);
    for (const course of ACADEMY_COURSES) {
      expect(course.modules.length).toBeGreaterThanOrEqual(2);
      expect(course.modules.length).toBeLessThanOrEqual(4);
      for (const module of course.modules) {
        expect(module.chapters.length).toBeGreaterThanOrEqual(3);
        expect(module.chapters.length).toBeLessThanOrEqual(4);
        for (const chapter of module.chapters) {
          expect(chapter.quiz.questions.length).toBeGreaterThanOrEqual(3);
          expect(chapter.quiz.questions.every((question) => question.choices.length >= 2)).toBe(true);
        }
      }
      expect(course.finalQuiz.questions.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("unlocks chapters in order and requires all clears for the exam", () => {
    const course = ACADEMY_COURSES[0]!;
    const chapters = flattenChapters(course);
    expect(isChapterUnlocked(course, [], chapters[0]!.chapterId)).toBe(true);
    expect(isChapterUnlocked(course, [], chapters[1]!.chapterId)).toBe(false);
    expect(isChapterUnlocked(course, [chapters[0]!.chapterId], chapters[1]!.chapterId)).toBe(true);
    expect(allChaptersComplete(course, [])).toBe(false);
    expect(allChaptersComplete(course, chapters.map((chapter) => chapter.chapterId))).toBe(true);
  });

  it("strips answer indexes from the public catalog", () => {
    const published = publicCourse(ACADEMY_COURSES[0]!);
    expect("answerIndex" in published.finalQuiz.questions[0]!).toBe(false);
    expect(published.modules[0]!.chapters[0]!.quiz.questions[0]).not.toHaveProperty("answerIndex");
  });

  it("grades quizzes with a 70% pass and star tiers", () => {
    const questions = ACADEMY_COURSES[0]!.finalQuiz.questions;
    const perfect = questions.map((question) => question.answerIndex);
    const perfectGrade = gradeQuiz(questions, perfect);
    expect(perfectGrade).toMatchObject({ passed: true, percent: 100, stars: 3 });
    expect(starsLabel(3)).toBe("Perfect");

    const twoOfThree = gradeQuiz(questions.slice(0, 3), [1, 1, 0]);
    expect(twoOfThree).toMatchObject({ passed: true, correct: 2, stars: 1 });

    const failGrade = gradeQuiz(questions, questions.map(() => 0));
    expect(failGrade).toMatchObject({ passed: false, stars: 0 });

    const short = gradeQuiz(questions, [1]);
    expect(short).toEqual({ error: "Answer every question." });
  });
});
