import { questionBank } from "@/lib/data/questions";
import type { LearningLanguage } from "@/lib/courseContent";

export function getLocalFallbackQuestionBank(concept: string, language: LearningLanguage) {
  return questionBank.filter((entry) => entry.concept === concept && entry.language === language);
}
