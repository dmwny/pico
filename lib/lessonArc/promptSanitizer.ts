import type { LessonArcQuestion } from "@/lib/lessonArc/types";

export function sanitizeLessonArcQuestion(question: LessonArcQuestion): LessonArcQuestion {
  if (question.type !== "true_false") {
    return question;
  }

  const legacyMetaPrompt = question.prompt.match(/^True or False:\s*The correct answer is\s+(.+?)[.?!]?\s*$/i);
  if (!legacyMetaPrompt) {
    return question;
  }

  const statement = legacyMetaPrompt[1]?.trim();
  if (!statement) {
    return question;
  }

  return {
    ...question,
    prompt: `True or False: For this question, the correct answer is ${JSON.stringify(statement)}.`,
  };
}

export function sanitizeLessonArcQuestions(questions: LessonArcQuestion[]) {
  return questions.map(sanitizeLessonArcQuestion);
}
