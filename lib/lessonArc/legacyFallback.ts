import { QUESTION_BANK, type LessonData, type Question as LegacyQuestion } from "@/app/api/lesson/questionBank";
import { JAVASCRIPT_QUESTION_BANK } from "@/app/api/lesson/javascriptQuestionBank";
import { getGeneratedLessonData } from "@/app/api/lesson/generatedQuestionBank";
import type {
  LessonArcLessonIndex,
  LessonArcNodeDescriptor,
  LessonArcQuestion,
  LessonArcQuestionType,
} from "@/lib/lessonArc/types";

function buildCode(codeLines?: string[]) {
  return codeLines?.join("\n");
}

function buildCorrectIndex(options: string[] | undefined, answer: string | string[]) {
  if (!options || Array.isArray(answer)) return undefined;
  const index = options.findIndex((option) => option === answer);
  return index >= 0 ? index : undefined;
}

function toTitleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function trimTrailingPunctuation(value: string) {
  return value.trim().replace(/[.?!:;]+$/g, "");
}

function quotePromptValue(value: string) {
  return JSON.stringify(value);
}

function buildLegacyTrueFalseVariant(params: {
  buildPrompt: (statement: string) => string;
  options?: string[];
  correctAnswer: string;
  seed: string;
}) {
  const distractors = seededSort(
    (params.options ?? []).filter((option) => option !== params.correctAnswer),
    `${params.seed}:distractors`,
  );
  const useFalseStatement = distractors.length > 0 && hashSeed(`${params.seed}:truthiness`) % 2 === 1;
  const statement = useFalseStatement ? distractors[0] : params.correctAnswer;

  return {
    prompt: params.buildPrompt(statement),
    correctIndex: useFalseStatement ? 1 : 0,
    correctAnswer: useFalseStatement ? "false" : "true",
  } as const;
}

function transformLegacyQuestion(
  question: LegacyQuestion,
  node: LessonArcNodeDescriptor,
  lessonNumber: number,
  index: number,
): LessonArcQuestion[] {
  const difficulty = (lessonNumber <= 2 ? lessonNumber : Math.min(5, Math.ceil(lessonNumber / 2))) as 1 | 2 | 3 | 4 | 5;
  const baseId = `${node.nodeId}:legacy:${lessonNumber}:${index}`;
  const code = buildCode(question.codeLines);
  const options = question.options ?? question.tiles ?? undefined;
  const correctIndex = buildCorrectIndex(options, question.answer);
  const correctAnswer = Array.isArray(question.answer) ? question.answer.join(" ") : question.answer;
  const transformed: LessonArcQuestion[] = [];

  if (question.type === "multiple_choice") {
    transformed.push({
      id: `${baseId}:mc`,
      type: "mc_concept",
      concept: node.concept,
      difficulty,
      prompt: question.instruction,
      options: question.options ?? [],
      correctIndex: buildCorrectIndex(question.options, question.answer),
      correctAnswer,
      explanation: question.explanation,
    });

    if (typeof question.answer === "string") {
      const trueFalseVariant = buildLegacyTrueFalseVariant({
        buildPrompt: (statement) => (
          `True or False: For the question ${quotePromptValue(trimTrailingPunctuation(question.instruction))}, the correct answer is ${quotePromptValue(statement)}.`
        ),
        options: question.options,
        correctAnswer: question.answer,
        seed: `${baseId}:mc:true-false`,
      });
      transformed.push({
        id: `${baseId}:tf`,
        type: "true_false",
        concept: node.concept,
        difficulty,
        prompt: trueFalseVariant.prompt,
        options: ["True", "False"],
        correctIndex: trueFalseVariant.correctIndex,
        correctAnswer: trueFalseVariant.correctAnswer,
        explanation: question.explanation,
      });
    }
  } else if (question.type === "output") {
    transformed.push({
      id: `${baseId}:output`,
      type: "mc_output",
      concept: node.concept,
      difficulty,
      prompt: question.instruction,
      code,
      options: question.options ?? [],
      correctIndex: buildCorrectIndex(question.options, question.answer),
      correctAnswer,
      explanation: question.explanation,
    });

    if (typeof question.answer === "string") {
      const trueFalseVariant = buildLegacyTrueFalseVariant({
        buildPrompt: (statement) => `True or False: This code prints ${quotePromptValue(statement)}.`,
        options: question.options,
        correctAnswer: question.answer,
        seed: `${baseId}:output:true-false`,
      });
      transformed.push({
        id: `${baseId}:tf`,
        type: "true_false",
        concept: node.concept,
        difficulty,
        prompt: trueFalseVariant.prompt,
        code,
        options: ["True", "False"],
        correctIndex: trueFalseVariant.correctIndex,
        correctAnswer: trueFalseVariant.correctAnswer,
        explanation: question.explanation,
      });
    }
  } else if (question.type === "fill") {
    transformed.push({
      id: `${baseId}:fill-select`,
      type: "fill_select",
      concept: node.concept,
      difficulty,
      prompt: question.instruction,
      code,
      options: options ?? [],
      correctIndex,
      correctAnswer,
      correctBlanks: Array.isArray(question.answer) ? question.answer : undefined,
      explanation: question.explanation,
    });

    if (typeof correctAnswer === "string") {
      transformed.push({
        id: `${baseId}:fill-type`,
        type: "fill_type",
        concept: node.concept,
        difficulty: Math.min(5, difficulty + 1) as 1 | 2 | 3 | 4 | 5,
        prompt: question.instruction,
        code,
        correctAnswer,
        explanation: question.explanation,
      });
    }
  } else if (question.type === "arrange") {
    transformed.push({
      id: `${baseId}:word-bank`,
      type: "word_bank",
      concept: node.concept,
      difficulty,
      prompt: question.instruction,
      tokens: question.tiles ?? [],
      correctTokens: Array.isArray(question.answer) ? question.answer : [question.answer],
      correctAnswer,
      explanation: question.explanation,
    });

    transformed.push({
      id: `${baseId}:fill-select`,
      type: "fill_select",
      concept: node.concept,
      difficulty,
      prompt: question.instruction,
      code,
      options: question.tiles ?? [],
      correctIndex,
      correctAnswer,
      correctBlanks: Array.isArray(question.answer) ? question.answer : undefined,
      explanation: question.explanation,
    });
  }

  return transformed;
}

function getLegacyLessonData(node: LessonArcNodeDescriptor, lessonNumber: number): LessonData | null {
  const unitId = String(node.unitId);
  const lessonId = String(lessonNumber);
  const language = node.language;
  const hardcodedBank = language === "python" ? QUESTION_BANK : language === "javascript" ? JAVASCRIPT_QUESTION_BANK : null;
  const hardcoded = hardcodedBank?.[unitId]?.[lessonId] ?? null;
  if (hardcoded) return hardcoded;
  return getGeneratedLessonData(language, unitId, lessonId);
}

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

function reorderWithoutAdjacentTypeRepeats(questions: LessonArcQuestion[], seed: string) {
  const grouped = new Map<LessonArcQuestionType, LessonArcQuestion[]>();
  for (const question of seededSort(questions, `${seed}:groups`)) {
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
    if (nextQuestion) ordered.push(nextQuestion);
    if ((grouped.get(nextType)?.length ?? 0) === 0) {
      const index = remainingTypes.indexOf(nextType);
      if (index >= 0) remainingTypes.splice(index, 1);
    }
  }

  return ordered;
}

const LEGACY_FALLBACK_PLAN: Record<LessonArcLessonIndex, { count: number; preferredTypes: LessonArcQuestionType[] }> = {
  0: { count: 6, preferredTypes: ["mc_concept", "fill_select", "true_false", "mc_output"] },
  1: { count: 7, preferredTypes: ["mc_output", "true_false", "fill_select", "mc_concept", "match_pairs"] },
  2: { count: 8, preferredTypes: ["word_bank", "fill_select", "mc_output", "true_false", "mc_concept"] },
  3: { count: 8, preferredTypes: ["fill_type", "mc_output", "true_false", "mc_concept", "word_bank"] },
  4: { count: 10, preferredTypes: ["fill_type", "mc_output", "word_bank", "true_false", "mc_concept"] },
};

function selectLegacyFallbackQuestions(
  bank: LessonArcQuestion[],
  lessonIndex: LessonArcLessonIndex,
  seed: string,
) {
  const { count, preferredTypes } = LEGACY_FALLBACK_PLAN[lessonIndex];
  const ranked = seededSort(bank, `${seed}:ranked`).sort((left, right) => {
    const leftRank = preferredTypes.indexOf(left.type);
    const rightRank = preferredTypes.indexOf(right.type);
    const normalizedLeft = leftRank === -1 ? preferredTypes.length : leftRank;
    const normalizedRight = rightRank === -1 ? preferredTypes.length : rightRank;
    if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
    return left.difficulty - right.difficulty;
  });

  const chosen: LessonArcQuestion[] = [];
  const seen = new Set<string>();
  for (const type of preferredTypes.slice(0, 3)) {
    const candidate = ranked.find((question) => question.type === type && !seen.has(question.id));
    if (candidate) {
      chosen.push(candidate);
      seen.add(candidate.id);
    }
  }

  for (const question of ranked) {
    if (chosen.length >= count) break;
    if (seen.has(question.id)) continue;
    chosen.push(question);
    seen.add(question.id);
  }

  return reorderWithoutAdjacentTypeRepeats(chosen.slice(0, count), `${seed}:ordered`);
}

export function getLegacyFallbackQuestions(
  node: LessonArcNodeDescriptor,
  lessonIndex: LessonArcLessonIndex,
): LessonArcQuestion[] | null {
  const transformed: LessonArcQuestion[] = [];

  for (let lessonNumber = 1; lessonNumber <= 6; lessonNumber += 1) {
    const data = getLegacyLessonData(node, lessonNumber);
    if (!data) continue;
    data.questions.forEach((question, index) => {
      transformed.push(...transformLegacyQuestion(question, node, lessonNumber, index));
    });
  }

  if (transformed.length === 0) {
    return null;
  }

  return selectLegacyFallbackQuestions(transformed, lessonIndex, `${node.nodeId}:${node.concept}:${lessonIndex}:${toTitleCase(node.lessonTitle)}`);
}
