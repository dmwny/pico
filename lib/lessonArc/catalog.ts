import { getCourseSections, normalizeLanguage, type LearningLanguage } from "@/lib/courseContent";
import { PYTHON_FOR_LOOPS_SEED } from "@/lib/lessonArc/seeds/pythonForLoops";
import {
  LESSON_TYPE_PLAN,
  type LessonArcLessonIndex,
  type LessonArcNodeDescriptor,
  type LessonArcQuestion,
  type LessonArcQuestionType,
} from "@/lib/lessonArc/types";

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededSort<T>(items: T[], seed: string) {
  const base = hashSeed(seed);
  return [...items].sort((left, right) => {
    const leftScore = hashSeed(`${base}:${JSON.stringify(left)}`);
    const rightScore = hashSeed(`${base}:${JSON.stringify(right)}`);
    return leftScore - rightScore;
  });
}

function reorderWithoutAdjacentTypeRepeats(questions: LessonArcQuestion[], seed: string) {
  const grouped = new Map<LessonArcQuestionType, LessonArcQuestion[]>();

  for (const question of seededSort(questions, `${seed}:grouped`)) {
    const bucket = grouped.get(question.type) ?? [];
    bucket.push(question);
    grouped.set(question.type, bucket);
  }

  const remainingTypes = Array.from(grouped.keys());
  const ordered: LessonArcQuestion[] = [];

  while (remainingTypes.length > 0) {
    remainingTypes.sort((left, right) => {
      const leftCount = grouped.get(left)?.length ?? 0;
      const rightCount = grouped.get(right)?.length ?? 0;
      if (leftCount !== rightCount) return rightCount - leftCount;
      return hashSeed(`${seed}:${left}`) - hashSeed(`${seed}:${right}`);
    });

    const previousType = ordered.at(-1)?.type;
    const nextType = remainingTypes.find((type) => type !== previousType) ?? remainingTypes[0];
    const nextQuestion = grouped.get(nextType)?.shift();
    if (nextQuestion) {
      ordered.push(nextQuestion);
    }

    if ((grouped.get(nextType)?.length ?? 0) === 0) {
      const index = remainingTypes.indexOf(nextType);
      if (index >= 0) remainingTypes.splice(index, 1);
    }
  }

  return ordered;
}

function resolveSeedBank(node: LessonArcNodeDescriptor) {
  if (node.language === "python" && node.conceptSlug === "for-loops") {
    return PYTHON_FOR_LOOPS_SEED;
  }

  return null;
}

export function resolveNodeDescriptor(
  language: string | null | undefined,
  unitId: string | number,
  lessonId: string | number,
): LessonArcNodeDescriptor {
  const normalizedLanguage = normalizeLanguage(language);
  const numericUnitId = Number(unitId);
  const numericLessonId = Number(lessonId);
  const unit = getCourseSections(normalizedLanguage)
    .flatMap((section) => section.units)
    .find((entry) => entry.id === numericUnitId);
  const lesson = unit?.lessons.find((entry) => entry.id === numericLessonId);

  const unitTitle = unit?.title ?? `Unit ${numericUnitId}`;
  const lessonTitle = lesson?.title ?? `Lesson ${numericLessonId}`;
  const concept = lesson?.concept ?? unit?.lessons[0]?.concept ?? lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const conceptSlug = concept;

  return {
    nodeId: `${numericUnitId}-${numericLessonId}`,
    unitId: numericUnitId,
    lessonId: numericLessonId,
    language: normalizedLanguage,
    unitTitle,
    lessonTitle,
    concept,
    conceptSlug,
  };
}

function ensureMinimumTypeVariety(
  questions: LessonArcQuestion[],
  allowedTypes: LessonArcQuestionType[],
  count: number,
  seed: string,
) {
  const perType = new Map<LessonArcQuestionType, LessonArcQuestion[]>();

  allowedTypes.forEach((type) => {
    perType.set(
      type,
      seededSort(questions.filter((question) => question.type === type), `${seed}:${type}`),
    );
  });

  const chosen: LessonArcQuestion[] = [];
  const typeCursor = new Map<LessonArcQuestionType, number>();

  allowedTypes.forEach((type) => {
    typeCursor.set(type, 0);
  });

  const varietyTypes = allowedTypes.slice(0, Math.min(3, allowedTypes.length));
  varietyTypes.forEach((type) => {
    const list = perType.get(type) ?? [];
    if (list[0]) {
      chosen.push(list[0]);
      typeCursor.set(type, 1);
    }
  });

  const pool = seededSort(questions, `${seed}:pool`);
  for (const question of pool) {
    if (chosen.length >= count) break;
    if (chosen.some((entry) => entry.id === question.id)) continue;
    chosen.push(question);
  }

  return chosen.slice(0, count);
}

export function pickQuestionsForLesson(
  bank: LessonArcQuestion[],
  lessonIndex: LessonArcLessonIndex,
  seed: string,
): LessonArcQuestion[] {
  const { count, allowedTypes } = LESSON_TYPE_PLAN[lessonIndex];
  const targetDifficulty = lessonIndex + 1;
  const exact = bank.filter(
    (question) => question.difficulty === targetDifficulty && allowedTypes.includes(question.type),
  );
  const soft = bank.filter(
    (question) => question.difficulty <= targetDifficulty && allowedTypes.includes(question.type),
  );
  const fallback = bank.filter((question) => allowedTypes.includes(question.type));
  const source = exact.length >= count ? exact : soft.length >= count ? soft : fallback;
  const selected = ensureMinimumTypeVariety(source, allowedTypes, count, seed);

  if (selected.length < count) {
    throw new Error(`Not enough questions available for lesson ${lessonIndex + 1}.`);
  }

  return reorderWithoutAdjacentTypeRepeats(selected, `${seed}:final-order`);
}

export function getSeededLessonQuestions(
  node: LessonArcNodeDescriptor,
  lessonIndex: LessonArcLessonIndex,
): LessonArcQuestion[] | null {
  const bank = resolveSeedBank(node);
  if (!bank) return null;
  return pickQuestionsForLesson(bank, lessonIndex, `${node.nodeId}:${lessonIndex}`);
}

export function getLessonArcTitle(node: LessonArcNodeDescriptor, lessonIndex: LessonArcLessonIndex) {
  const labels = [
    "Lesson 1 · Introduction",
    "Lesson 2 · Recognition",
    "Lesson 3 · Guided Production",
    "Lesson 4 · Independent Production",
    "Lesson 5 · Mastery",
  ] as const;

  return {
    title: `${node.lessonTitle}`,
    subtitle: labels[lessonIndex],
  };
}

export type AiLessonGenerationRequest = {
  node: LessonArcNodeDescriptor;
  lessonIndex: LessonArcLessonIndex;
};

export function buildAiLessonGenerationPrompt({ node, lessonIndex }: AiLessonGenerationRequest) {
  const plan = LESSON_TYPE_PLAN[lessonIndex];
  const lessonNumber = lessonIndex + 1;
  const allowedTypeList = plan.allowedTypes.join(", ");

  return `You are generating a Duolingo-style coding lesson for ${node.language}.
The node concept is "${node.lessonTitle}" inside the unit "${node.unitTitle}".
The lesson must be beginner-safe, syntax-correct, and focused on one concept.

Return ONLY valid JSON with this shape:
{
  "questions": [
    {
      "id": "string",
      "type": "mc_concept | mc_output | word_bank | arrange | fill_type | fill_select | spot_bug | predict_type | match_pairs | true_false | complete_fn | debug",
      "concept": "string",
      "difficulty": ${lessonNumber},
      "prompt": "string",
      "code": "optional string",
      "options": ["optional"],
      "correctIndex": 0,
      "correctAnswer": "optional string",
      "pairs": [{"left":"string","right":"string"}],
      "tokens": ["optional"],
      "correctTokens": ["optional"],
      "lines": ["optional"],
      "correctOrder": [0],
      "bugLine": 0,
      "testCases": [{"input":"string","expected":"string"}],
      "explanation": "string",
      "hint": "optional string",
      "xpBonus": 0
    }
  ]
}

Rules:
- Generate exactly ${plan.count} questions.
- Allowed question types for this lesson: ${allowedTypeList}.
- Use at least 3 distinct question types.
- All code must be runnable in isolation.
- For complete_fn and debug, keep solutions within 1-3 lines of student-authored code.
- Difficulty level ${lessonNumber} must match this lesson phase.
- No duplicate questions.
- Keep the concept tightly focused on ${node.lessonTitle} in ${node.language}.`;
}

export function isPythonLanguage(language: LearningLanguage) {
  return language === "python";
}
