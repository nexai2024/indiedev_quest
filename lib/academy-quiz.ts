import type { QuizQuestion } from "@/lib/content/academy-courses";

export type QuizGrade = {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  stars: number;
};

export function gradeQuiz(questions: QuizQuestion[], answers: unknown): QuizGrade | { error: string } {
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return { error: "Answer every question." };
  }

  let correct = 0;
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    if (!question) return { error: "Quiz is incomplete." };
    if (answers[index] === question.answerIndex) correct += 1;
  }

  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  const needed = Math.max(1, Math.round(total * 0.7));
  const passed = correct >= needed;
  const stars = percent === 100 ? 3 : percent >= 85 ? 2 : passed ? 1 : 0;
  return { correct, total, percent, passed, stars };
}

export function starsLabel(stars: number): string {
  if (stars <= 0) return "Failed";
  if (stars === 1) return "Pass";
  if (stars === 2) return "Great";
  return "Perfect";
}
