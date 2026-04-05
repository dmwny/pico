import { getCourseSections, normalizeLanguage, type LearningLanguage, type LessonMeta, type UnitMeta } from "@/lib/courseContent";
import { getLocalFallbackQuestionBank } from "@/lib/data/questionBank";
import { getSeededLessonQuestions, resolveNodeDescriptor } from "@/lib/lessonArc/catalog";
import { getLegacyFallbackQuestions } from "@/lib/lessonArc/legacyFallback";
const UNIT_CHALLENGE_COUNT = 12;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededSort<T>(items: T[], seed: string) {
  return [...items].sort((left, right) => hashSeed(`${seed}:${JSON.stringify(left)}`) - hashSeed(`${seed}:${JSON.stringify(right)}`));
}

export function getUnitMetaForChallenge(language: string | null | undefined, unitId: string | number) {
  const normalizedLanguage = normalizeLanguage(language);
  return getCourseSections(normalizedLanguage)
    .flatMap((section) => section.units)
    .find((unit) => String(unit.id) === String(unitId)) ?? null;
}

export function getRegularArcLessons(unit: UnitMeta) {
  return unit.lessons.filter((lesson) => lesson.kind === "arc");
}

export function isUnitChallengeUnlocked(unit: UnitMeta, completedLessons: string[]) {
  return getRegularArcLessons(unit).every((lesson) => completedLessons.includes(`${unit.id}-${lesson.id}`));
}

function getNodeQuestionPool(language: LearningLanguage, unitId: number, lesson: LessonMeta) {
  const descriptor = resolveNodeDescriptor(language, unitId, lesson.id);
  const local = getLocalFallbackQuestionBank(descriptor.concept, descriptor.language).filter(
    (question) => question.difficulty === 3,
  );
  const seeded = [
    ...(getSeededLessonQuestions(descriptor, 3) ?? []),
    ...(getSeededLessonQuestions(descriptor, 4) ?? []),
  ].filter((question) => question.difficulty === 3);
  const legacy = [
    ...(getLegacyFallbackQuestions(descriptor, 3) ?? []),
    ...(getLegacyFallbackQuestions(descriptor, 4) ?? []),
  ].filter((question) => question.difficulty === 3);

  return [...local, ...seeded, ...legacy].filter(
    (question, index, questions) => questions.findIndex((entry) => entry.id === question.id) === index,
  );
}

export function getUnitChallengeQuestions(language: string | null | undefined, unitId: string | number) {
  const normalizedLanguage = normalizeLanguage(language);
  const unit = getUnitMetaForChallenge(normalizedLanguage, unitId);
  if (!unit) return [];

  const pool = getRegularArcLessons(unit).flatMap((lesson) => getNodeQuestionPool(normalizedLanguage, unit.id, lesson));
  return seededSort(
    pool.filter((question, index, questions) => questions.findIndex((entry) => entry.id === question.id) === index),
    `${normalizedLanguage}:${unit.id}:challenge`,
  ).slice(0, UNIT_CHALLENGE_COUNT);
}

export function getUnitChallengeXpReward(unitId: number) {
  if (unitId >= 10) return 260;
  if (unitId >= 7) return 220;
  if (unitId >= 4) return 180;
  return 140;
}
