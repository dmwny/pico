import { resolveQuestionType, type LessonArcBaseQuestionType, type LessonArcQuestion } from "@/lib/lessonArc/types";

const SHUFFLED_OPTION_TYPES = new Set<LessonArcBaseQuestionType>([
  "mc_concept",
  "mc_output",
  "true_false",
]);

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function createSeededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string) {
  const random = createSeededRandom(seed);
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function isTrueFalseOptionTrue(option: string) {
  return option.trim().toLowerCase() === "true";
}

export function shuffleQuestionOptions(question: LessonArcQuestion): LessonArcQuestion {
  if (
    !SHUFFLED_OPTION_TYPES.has(resolveQuestionType(question.type))
    || !question.options?.length
    || typeof question.correctIndex !== "number"
    || question.correctIndex < 0
    || question.correctIndex >= question.options.length
  ) {
    return question;
  }

  const shuffled = seededShuffle(
    question.options.map((option, index) => ({ option, index })),
    `${question.id}:${question.type}:options`,
  );
  const remappedCorrectIndex = shuffled.findIndex(({ index }) => index === question.correctIndex);

  return {
    ...question,
    options: shuffled.map(({ option }) => option),
    correctIndex: remappedCorrectIndex >= 0 ? remappedCorrectIndex : question.correctIndex,
  };
}

export function shuffleQuestionsForDelivery(questions: LessonArcQuestion[]) {
  return questions.map((question) => shuffleQuestionOptions(question));
}
