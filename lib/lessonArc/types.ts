import type { LearningLanguage, LessonNodeType } from "@/lib/courseContent";

export type LessonArcQuestionType =
  | "mc_concept"
  | "mc_output"
  | "word_bank"
  | "arrange"
  | "fill_type"
  | "fill_select"
  | "spot_bug"
  | "predict_type"
  | "match_pairs"
  | "true_false"
  | "complete_fn"
  | "debug";

export type LessonArcDifficulty = 1 | 2 | 3 | 4 | 5;
export type LessonArcLessonIndex = 0 | 1 | 2 | 3 | 4;
export type LessonArcNodeStatus = "not_started" | "in_progress" | "completed";

export type LessonArcQuestion = {
  id: string;
  type: LessonArcQuestionType;
  concept: string;
  difficulty: LessonArcDifficulty;
  prompt: string;
  code?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  correctBlanks?: string[];
  pairs?: { left: string; right: string }[];
  tokens?: string[];
  correctTokens?: string[];
  lines?: string[];
  correctOrder?: number[];
  bugLine?: number;
  testCases?: { input: string; expected: string }[];
  explanation: string;
  hint?: string;
  xpBonus?: number;
};

export type LessonArcNodeDescriptor = {
  nodeId: string;
  unitId: number;
  lessonId: number;
  language: LearningLanguage;
  nodeType: LessonNodeType;
  unitTitle: string;
  lessonTitle: string;
  concept: string;
  conceptSlug: string;
};

export type LessonArcNodeProgress = {
  nodeId: string;
  unitId: number;
  lessonId: number;
  concept: string;
  lessonIndex: LessonArcLessonIndex;
  questionIndex: number;
  hearts: number;
  xpEarned: number;
  totalArcXpEarned: number;
  completedLessonIndices: LessonArcLessonIndex[];
  status: LessonArcNodeStatus;
  updatedAt: string;
};

export type LessonArcProgressMap = Record<string, LessonArcNodeProgress>;

export type LessonArcSession = {
  nodeId: string;
  unitId: number;
  lessonId: number;
  language: LearningLanguage;
  concept: string;
  mode: "progress" | "review";
  lessonIndex: LessonArcLessonIndex;
  questionIndex: number;
  hearts: number;
  xpEarned: number;
  correctCount: number;
  wrongCount: number;
  perfectLesson: boolean;
  questions: LessonArcQuestion[];
  questionOrder: string[];
  completedQuestionIds: string[];
  usedHintQuestionIds: string[];
  freeHintUsed: boolean;
  startedAt: string;
  questionStartedAt: string;
  updatedAt: string;
};

export type LessonArcPayload = {
  node: LessonArcNodeDescriptor;
  lessonIndex: LessonArcLessonIndex;
  title: string;
  subtitle: string;
  questions: LessonArcQuestion[];
  source?: "supabase" | "local-arc-bank" | "legacy-fallback";
};

export type QuestionAttemptAnswer = {
  optionIndex?: number;
  optionValue?: string;
  fillSelectValues?: string[];
  tokens?: string[];
  arrangedLines?: string[];
  textValue?: string;
  selectedPairs?: { left: string; right: string }[];
  booleanValue?: boolean;
  chosenVersion?: "A" | "B";
  codeValue?: string;
};

export type LessonCodeRunResult = {
  ok: boolean;
  passed: boolean;
  output: string;
  tests: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
  error?: string;
};

export type QuestionEvaluation = {
  correct: boolean;
  normalizedAnswer: string;
  displayCorrectAnswer: string;
  explanation: string;
  xpAwarded: number;
  speedBonusAwarded: number;
  wrongHighlights?: string[];
  correctHighlights?: string[];
  pairResults?: Array<{ left: string; right: string; correct: boolean }>;
  selectedVersion?: "A" | "B";
  runResult?: LessonCodeRunResult | null;
};

export type LessonAdvanceResult =
  | {
      kind: "retry_question";
      session: LessonArcSession;
      nodeProgress: LessonArcNodeProgress;
      evaluation: QuestionEvaluation;
    }
  | {
      kind: "next_question";
      session: LessonArcSession;
      nodeProgress: LessonArcNodeProgress;
      evaluation: QuestionEvaluation;
    }
  | {
      kind: "lesson_complete";
      session: LessonArcSession;
      nodeProgress: LessonArcNodeProgress;
      evaluation: QuestionEvaluation;
      perfectBonusXp: number;
      lessonPassed: boolean;
    }
  | {
      kind: "lesson_failed";
      session: LessonArcSession;
      nodeProgress: LessonArcNodeProgress;
      evaluation: QuestionEvaluation;
    };

export type LessonHintResult = {
  session: LessonArcSession;
  consumedHeart: boolean;
  consumedFreeHint: boolean;
  failedLesson: boolean;
};

export type QuestionTypePlan = {
  difficulty: LessonArcDifficulty;
  count: number;
  allowedTypes: LessonArcQuestionType[];
};

export const TEACHING_LESSON_PLAN: Record<LessonArcLessonIndex, QuestionTypePlan> = {
  0: { difficulty: 1, count: 15, allowedTypes: ["mc_concept", "true_false"] },
  1: { difficulty: 1, count: 15, allowedTypes: ["mc_output", "fill_select", "true_false"] },
  2: { difficulty: 2, count: 15, allowedTypes: ["word_bank", "arrange", "fill_select"] },
  3: { difficulty: 2, count: 12, allowedTypes: ["fill_type", "predict_type"] },
  4: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "mc_output", "true_false", "spot_bug"] },
};

export const PRACTICE_LESSON_PLAN: Record<LessonArcLessonIndex, QuestionTypePlan> = {
  0: { difficulty: 2, count: 10, allowedTypes: ["spot_bug", "fill_type"] },
  1: { difficulty: 2, count: 10, allowedTypes: ["predict_type", "word_bank"] },
  2: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "spot_bug"] },
  3: { difficulty: 3, count: 10, allowedTypes: ["mc_output", "arrange"] },
  4: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "spot_bug", "predict_type", "mc_output"] },
};

export function getLessonTypePlan(nodeType: LessonNodeType, lessonIndex: LessonArcLessonIndex): QuestionTypePlan {
  return nodeType === "teaching"
    ? TEACHING_LESSON_PLAN[lessonIndex]
    : PRACTICE_LESSON_PLAN[lessonIndex];
}

export const BASE_QUESTION_XP = 10;
export const PERFECT_LESSON_BONUS_XP = 25;
export const SPEED_BONUS_XP = 1;
export const DEFAULT_HEARTS = 5;

export const QUESTION_TYPE_XP_BONUS: Partial<Record<LessonArcQuestionType, number>> = {
  predict_type: 2,
  spot_bug: 2,
  complete_fn: 5,
  debug: 5,
};
