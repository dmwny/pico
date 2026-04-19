import type { LearningLanguage, LessonNodeType } from "@/lib/courseContent";

export type LessonArcBaseQuestionType =
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
  | "debug"
  // --- new types ---
  | "code_diff"
  | "trace_steps"
  | "build_regex"
  | "build_query"
  | "output_to_code"
  | "code_order"
  | "slider_predict"
  | "flowchart"
  | "find_token";

export type CreativeQuestionModeId =
  | "glitch-fix"
  | "one-character-save"
  | "production-panic"
  | "ghost-bug"
  | "time-bomb-bug"
  | "invisible-bug"
  | "ai-mistake-fix"
  | "bug-by-deletion-only"
  | "multi-bug-combo-chain"
  | "wrong-variable-trap"
  | "infinite-loop-alarm"
  | "silent-failure-bug"
  | "swapped-operator-bug"
  | "broken-condition-order"
  | "function-never-called"
  | "mutation-disaster"
  | "shadow-clone-bug"
  | "missing-return-path"
  | "off-by-one-maze"
  | "edge-case-guardian"
  | "drag-to-build-function"
  | "timeline-execution"
  | "loop-builder"
  | "broken-story-mode"
  | "nested-chaos"
  | "reverse-engineering-order"
  | "speed-reorder"
  | "lock-in-slots"
  | "partial-order-known"
  | "hidden-line-missing"
  | "multi-path-order"
  | "dependency-order"
  | "visual-stack-builder"
  | "function-call-flow"
  | "async-order-guess"
  | "condition-priority-order"
  | "loop-condition-combo"
  | "broken-algorithm-rebuild"
  | "code-collapse-mode"
  | "one-line-trap"
  | "fill-the-blank-classic"
  | "multi-blank-puzzle"
  | "predict-output"
  | "output-with-animation"
  | "type-exact-output"
  | "close-enough-mode"
  | "pattern-output"
  | "function-completion"
  | "fill-only-keywords"
  | "fill-only-operators"
  | "code-translation"
  | "reverse-output"
  | "error-message-guess"
  | "debug-explanation"
  | "predict-final-variable"
  | "multi-step-execution"
  | "conditional-output-tree"
  | "trick-output"
  | "boolean-logic-fill"
  | "hidden-rule-pattern"
  | "which-is-faster"
  | "memory-challenge"
  | "edge-case-finder"
  | "true-false-code-facts"
  | "minimal-fix-strategy"
  | "code-smell-detector"
  | "optimize-this-code"
  | "code-golf"
  | "multi-step-debug"
  | "dependency-puzzle"
  | "predict-next-iteration"
  | "state-machine-puzzle"
  | "loop-simulation"
  | "conditional-maze"
  | "hidden-constraint-puzzle"
  | "fake-vs-real-code"
  | "spot-redundant-code"
  | "replace-with-built-in"
  | "performance-trap"
  | "bug-ranking"
  | "boss-fight"
  | "code-escape-room"
  | "glitch-world"
  | "ai-battle"
  | "combo-system"
  | "power-ups"
  | "code-defense"
  | "live-debugger-mode"
  | "dark-mode-puzzle"
  | "random-event"
  | "theme-based-levels"
  | "upgrade-tree"
  | "daily-challenge"
  | "ranked-mode"
  | "replay-mode"
  | "code-replay-visualization"
  | "multiplayer-race"
  | "hidden-easter-egg-questions"
  | "dynamic-difficulty"
  | "explain-like-youre-teaching";

export type LessonArcQuestionType = LessonArcBaseQuestionType | CreativeQuestionModeId;

export const QUESTION_TYPE_LABELS: Record<LessonArcQuestionType, string> = {
  "mc_concept": "Concept Check",
  "mc_output": "Output Check",
  "word_bank": "Word Bank",
  "arrange": "Arrange",
  "fill_type": "Fill",
  "fill_select": "Select Fill",
  "spot_bug": "Spot Bug",
  "predict_type": "Predict",
  "match_pairs": "Match",
  "true_false": "True / False",
  "complete_fn": "Complete Function",
  "debug": "Debug",
  "code_diff": "Code Diff",
  "trace_steps": "Trace Steps",
  "build_regex": "Build Regex",
  "build_query": "Build Query",
  "output_to_code": "Output To Code",
  "code_order": "Code Order",
  "slider_predict": "Slider Predict",
  "flowchart": "Flowchart",
  "find_token": "Find Token",
  "glitch-fix": "Glitch Fix",
  "one-character-save": "One Character Save",
  "production-panic": "Production Panic",
  "ghost-bug": "Ghost Bug",
  "time-bomb-bug": "Time Bomb Bug",
  "invisible-bug": "Invisible Bug",
  "ai-mistake-fix": "AI Mistake Fix",
  "bug-by-deletion-only": "Bug By Deletion",
  "multi-bug-combo-chain": "Combo Chain",
  "wrong-variable-trap": "Wrong Variable Trap",
  "infinite-loop-alarm": "Infinite Loop Alarm",
  "silent-failure-bug": "Silent Failure",
  "swapped-operator-bug": "Swapped Operator",
  "broken-condition-order": "Broken Condition Order",
  "function-never-called": "Function Never Called",
  "mutation-disaster": "Mutation Disaster",
  "shadow-clone-bug": "Shadow Clone Bug",
  "missing-return-path": "Missing Return Path",
  "off-by-one-maze": "Off-By-One Maze",
  "edge-case-guardian": "Edge Case Guardian",
  "drag-to-build-function": "Drag To Build",
  "timeline-execution": "Timeline Execution",
  "loop-builder": "Loop Builder",
  "broken-story-mode": "Broken Story",
  "nested-chaos": "Nested Chaos",
  "reverse-engineering-order": "Reverse Engineer",
  "speed-reorder": "Speed Reorder",
  "lock-in-slots": "Lock-In Slots",
  "partial-order-known": "Partial Order",
  "hidden-line-missing": "Hidden Line",
  "multi-path-order": "Multi-Path Order",
  "dependency-order": "Dependency Order",
  "visual-stack-builder": "Visual Stack",
  "function-call-flow": "Function Flow",
  "async-order-guess": "Async Order",
  "condition-priority-order": "Condition Priority",
  "loop-condition-combo": "Loop Combo",
  "broken-algorithm-rebuild": "Algorithm Rebuild",
  "code-collapse-mode": "Code Collapse",
  "one-line-trap": "One Line Trap",
  "fill-the-blank-classic": "Classic Fill",
  "multi-blank-puzzle": "Multi-Blank",
  "predict-output": "Predict Output",
  "output-with-animation": "Animated Output",
  "type-exact-output": "Exact Output",
  "close-enough-mode": "Close Enough",
  "pattern-output": "Pattern Output",
  "function-completion": "Function Completion",
  "fill-only-keywords": "Keywords Only",
  "fill-only-operators": "Operators Only",
  "code-translation": "Code Translation",
  "reverse-output": "Reverse Output",
  "error-message-guess": "Error Guess",
  "debug-explanation": "Debug Explanation",
  "predict-final-variable": "Final Variable",
  "multi-step-execution": "Multi-Step Execution",
  "conditional-output-tree": "Conditional Tree",
  "trick-output": "Trick Output",
  "boolean-logic-fill": "Boolean Logic",
  "hidden-rule-pattern": "Hidden Rule",
  "which-is-faster": "Which Is Faster",
  "memory-challenge": "Memory Challenge",
  "edge-case-finder": "Edge Case Finder",
  "true-false-code-facts": "Code Facts",
  "minimal-fix-strategy": "Minimal Fix",
  "code-smell-detector": "Code Smell",
  "optimize-this-code": "Optimize",
  "code-golf": "Code Golf",
  "multi-step-debug": "Multi-Step Debug",
  "dependency-puzzle": "Dependency Puzzle",
  "predict-next-iteration": "Next Iteration",
  "state-machine-puzzle": "State Machine",
  "loop-simulation": "Loop Simulation",
  "conditional-maze": "Conditional Maze",
  "hidden-constraint-puzzle": "Constraint Puzzle",
  "fake-vs-real-code": "Fake Vs Real",
  "spot-redundant-code": "Spot Redundant",
  "replace-with-built-in": "Use Built-In",
  "performance-trap": "Performance Trap",
  "bug-ranking": "Bug Ranking",
  "boss-fight": "Boss Fight",
  "code-escape-room": "Escape Room",
  "glitch-world": "Glitch World",
  "ai-battle": "AI Battle",
  "combo-system": "Combo System",
  "power-ups": "Power-Ups",
  "code-defense": "Code Defense",
  "live-debugger-mode": "Live Debugger",
  "dark-mode-puzzle": "Dark Mode",
  "random-event": "Random Event",
  "theme-based-levels": "Theme Level",
  "upgrade-tree": "Upgrade Tree",
  "daily-challenge": "Daily Challenge",
  "ranked-mode": "Ranked Mode",
  "replay-mode": "Replay Mode",
  "code-replay-visualization": "Code Replay",
  "multiplayer-race": "Multiplayer Race",
  "hidden-easter-egg-questions": "Easter Egg",
  "dynamic-difficulty": "Dynamic Difficulty",
  "explain-like-youre-teaching": "Teach It Back",
};

export const QUESTION_TYPE_BASE_MAP: Partial<Record<CreativeQuestionModeId, LessonArcBaseQuestionType>> = {
  "glitch-fix": "spot_bug",
  "one-character-save": "spot_bug",
  "production-panic": "debug",
  "ghost-bug": "spot_bug",
  "time-bomb-bug": "debug",
  "invisible-bug": "spot_bug",
  "ai-mistake-fix": "debug",
  "bug-by-deletion-only": "code_diff",
  "multi-bug-combo-chain": "debug",
  "wrong-variable-trap": "spot_bug",
  "infinite-loop-alarm": "debug",
  "silent-failure-bug": "debug",
  "swapped-operator-bug": "spot_bug",
  "broken-condition-order": "debug",
  "function-never-called": "spot_bug",
  "mutation-disaster": "debug",
  "shadow-clone-bug": "spot_bug",
  "missing-return-path": "debug",
  "off-by-one-maze": "spot_bug",
  "edge-case-guardian": "debug",
  "drag-to-build-function": "arrange",
  "timeline-execution": "arrange",
  "loop-builder": "code_order",
  "broken-story-mode": "arrange",
  "nested-chaos": "flowchart",
  "reverse-engineering-order": "code_order",
  "speed-reorder": "arrange",
  "lock-in-slots": "arrange",
  "partial-order-known": "code_order",
  "hidden-line-missing": "arrange",
  "multi-path-order": "flowchart",
  "dependency-order": "code_order",
  "visual-stack-builder": "flowchart",
  "function-call-flow": "arrange",
  "async-order-guess": "arrange",
  "condition-priority-order": "code_order",
  "loop-condition-combo": "arrange",
  "broken-algorithm-rebuild": "code_order",
  "code-collapse-mode": "flowchart",
  "one-line-trap": "arrange",
  "fill-the-blank-classic": "fill_type",
  "multi-blank-puzzle": "fill_select",
  "predict-output": "predict_type",
  "output-with-animation": "mc_output",
  "type-exact-output": "predict_type",
  "close-enough-mode": "predict_type",
  "pattern-output": "predict_type",
  "function-completion": "complete_fn",
  "fill-only-keywords": "word_bank",
  "fill-only-operators": "fill_type",
  "code-translation": "word_bank",
  "reverse-output": "output_to_code",
  "error-message-guess": "mc_output",
  "debug-explanation": "mc_concept",
  "predict-final-variable": "predict_type",
  "multi-step-execution": "trace_steps",
  "conditional-output-tree": "trace_steps",
  "trick-output": "mc_output",
  "boolean-logic-fill": "fill_type",
  "hidden-rule-pattern": "predict_type",
  "which-is-faster": "mc_concept",
  "memory-challenge": "trace_steps",
  "edge-case-finder": "mc_concept",
  "true-false-code-facts": "true_false",
  "minimal-fix-strategy": "code_diff",
  "code-smell-detector": "mc_concept",
  "optimize-this-code": "code_diff",
  "code-golf": "build_query",
  "multi-step-debug": "debug",
  "dependency-puzzle": "trace_steps",
  "predict-next-iteration": "trace_steps",
  "state-machine-puzzle": "flowchart",
  "loop-simulation": "trace_steps",
  "conditional-maze": "flowchart",
  "hidden-constraint-puzzle": "mc_concept",
  "fake-vs-real-code": "code_diff",
  "spot-redundant-code": "find_token",
  "replace-with-built-in": "code_diff",
  "performance-trap": "mc_concept",
  "bug-ranking": "mc_concept",
  "boss-fight": "debug",
  "code-escape-room": "flowchart",
  "glitch-world": "spot_bug",
  "ai-battle": "code_diff",
  "combo-system": "trace_steps",
  "power-ups": "fill_select",
  "code-defense": "debug",
  "live-debugger-mode": "trace_steps",
  "dark-mode-puzzle": "mc_output",
  "random-event": "spot_bug",
  "theme-based-levels": "mc_concept",
  "upgrade-tree": "flowchart",
  "daily-challenge": "mc_output",
  "ranked-mode": "code_diff",
  "replay-mode": "trace_steps",
  "code-replay-visualization": "trace_steps",
  "multiplayer-race": "code_order",
  "hidden-easter-egg-questions": "mc_concept",
  "dynamic-difficulty": "slider_predict",
  "explain-like-youre-teaching": "mc_concept",
};

export function resolveQuestionType(type: LessonArcQuestionType): LessonArcBaseQuestionType {
  return QUESTION_TYPE_BASE_MAP[type as CreativeQuestionModeId] ?? type as LessonArcBaseQuestionType;
}

export function getQuestionTypeLabel(type: LessonArcQuestionType) {
  return QUESTION_TYPE_LABELS[type] ?? QUESTION_TYPE_LABELS[resolveQuestionType(type)];
}

export type LessonArcDifficulty = 1 | 2 | 3 | 4 | 5;
export type LessonArcLessonIndex = 0 | 1 | 2 | 3 | 4;
export type LessonArcNodeStatus = "not_started" | "in_progress" | "completed";

export type TraceStep = {
  line: number;
  prompt: string;
  expected: string;
  variables?: Record<string, string>;
};

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
  // --- new fields ---
  codeVersions?: { id: "A" | "B"; code: string; label?: string }[];
  traceSteps?: TraceStep[];
  examples?: { input: string; matches: boolean }[];
  numericMin?: number;
  numericMax?: number;
  numericStep?: number;
  numericTarget?: number;
  flowBlocks?: string[];
  correctFlowOrder?: number[];
  wrongTokenIndex?: number;
  // ---
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
  // --- new ---
  numericValue?: number;
  tokenIndex?: number;
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
  allowedTypes: LessonArcBaseQuestionType[];
};

export const TEACHING_LESSON_PLAN: Record<LessonArcLessonIndex, QuestionTypePlan> = {
  0: { difficulty: 1, count: 15, allowedTypes: ["mc_concept", "true_false", "mc_output"] },
  1: { difficulty: 1, count: 15, allowedTypes: ["mc_output", "fill_select", "true_false", "arrange"] },
  2: { difficulty: 2, count: 15, allowedTypes: ["word_bank", "arrange", "fill_select", "code_order"] },
  3: { difficulty: 2, count: 12, allowedTypes: ["fill_type", "predict_type", "trace_steps", "code_diff"] },
  4: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "mc_output", "spot_bug", "code_order", "trace_steps", "debug"] },
};

export const PRACTICE_LESSON_PLAN: Record<LessonArcLessonIndex, QuestionTypePlan> = {
  0: { difficulty: 2, count: 10, allowedTypes: ["spot_bug", "fill_type", "code_diff"] },
  1: { difficulty: 2, count: 10, allowedTypes: ["predict_type", "word_bank", "arrange"] },
  2: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "spot_bug", "trace_steps", "code_order"] },
  3: { difficulty: 3, count: 10, allowedTypes: ["mc_output", "arrange", "code_order", "debug"] },
  4: { difficulty: 3, count: 10, allowedTypes: ["fill_type", "spot_bug", "predict_type", "mc_output", "trace_steps", "debug"] },
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

export const QUESTION_TYPE_XP_BONUS: Partial<Record<LessonArcBaseQuestionType, number>> = {
  predict_type: 2,
  spot_bug: 2,
  complete_fn: 5,
  debug: 5,
};
