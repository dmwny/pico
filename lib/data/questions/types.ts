import type { LessonArcQuestion } from "@/lib/lessonArc/types";
import type { LearningLanguage } from "@/lib/courseContent";

export type Question = LessonArcQuestion & {
  language: LearningLanguage;
};
