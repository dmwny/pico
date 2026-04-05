import {
  BASE_QUESTION_XP,
  DEFAULT_HEARTS,
  PERFECT_LESSON_BONUS_XP,
  QUESTION_TYPE_XP_BONUS,
  SPEED_BONUS_XP,
  type LessonAdvanceResult,
  type LessonArcLessonIndex,
  type LessonArcNodeDescriptor,
  type LessonArcNodeProgress,
  type LessonArcProgressMap,
  type LessonArcQuestion,
  type LessonArcSession,
  type LessonHintResult,
  type LessonCodeRunResult,
  type QuestionAttemptAnswer,
  type QuestionEvaluation,
} from "@/lib/lessonArc/types";

function nowIso() {
  return new Date().toISOString();
}

function clampLessonIndex(value: number): LessonArcLessonIndex {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function normalizeTypedCode(value: string) {
  return normalizeLineEndings(value)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function normalizeTextAnswer(value: string) {
  return normalizeLineEndings(value).trim();
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

function uniqueLessonIndices(indices: LessonArcLessonIndex[]) {
  return [...new Set(indices)].sort((left, right) => left - right) as LessonArcLessonIndex[];
}

function fillCodeBlanks(code: string, replacements: string[]) {
  let replacementIndex = 0;
  return code.replace(/_{3,}/g, () => replacements[replacementIndex++] ?? "___");
}

function countCodeBlanks(code: string | undefined) {
  return code?.match(/_{3,}/g)?.length ?? 0;
}

function getFillSelectExpectedBlanks(question: LessonArcQuestion) {
  if (question.correctBlanks?.length) {
    return question.correctBlanks;
  }
  if ((countCodeBlanks(question.code) ?? 0) > 1 && typeof question.correctAnswer === "string") {
    return question.correctAnswer
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof question.correctAnswer === "string") {
    return [question.correctAnswer];
  }
  if (typeof question.correctIndex === "number" && question.options?.[question.correctIndex]) {
    return [question.options[question.correctIndex]];
  }
  return [];
}

function buildDisplayCorrectAnswer(question: LessonArcQuestion) {
  if (question.type === "fill_select") {
    const blanks = getFillSelectExpectedBlanks(question);
    if (question.code && blanks.length > 0) {
      return fillCodeBlanks(question.code, blanks)
        .split("\n")
        .map((line) => line.trim())
        .join(" / ");
    }
    if (blanks.length > 0) {
      return blanks.join(" ");
    }
  }
  if (typeof question.correctAnswer === "string") return question.correctAnswer;
  if (typeof question.correctIndex === "number" && question.options?.[question.correctIndex]) {
    return question.options[question.correctIndex];
  }
  if (question.correctTokens?.length) return question.correctTokens.join(" ");
  if (question.lines?.length) return question.lines.join("\n");
  if (question.pairs?.length) {
    return question.pairs.map((pair) => `${pair.left} -> ${pair.right}`).join(", ");
  }
  return "";
}

function xpForQuestion(question: LessonArcQuestion, elapsedMs: number) {
  const baseBonus = QUESTION_TYPE_XP_BONUS[question.type] ?? question.xpBonus ?? 0;
  const speedBonus = elapsedMs <= 5000 ? SPEED_BONUS_XP : 0;
  return {
    total: BASE_QUESTION_XP + baseBonus + speedBonus,
    speedBonus,
  };
}

export function splitSpotBugVersions(code: string | undefined) {
  if (!code) {
    return { versionA: "", versionB: "" };
  }

  const match = code.match(/### Version A\s*([\s\S]*?)\s*### Version B\s*([\s\S]*)/);
  if (!match) {
    return { versionA: code, versionB: "" };
  }

  return {
    versionA: match[1].trim(),
    versionB: match[2].trim(),
  };
}

function evaluatePairs(question: LessonArcQuestion, answer: QuestionAttemptAnswer) {
  const selectedPairs = answer.selectedPairs ?? [];
  const expectedPairs = question.pairs ?? [];
  const pairResults = selectedPairs.map((pair) => ({
    ...pair,
    correct: expectedPairs.some((expected) => expected.left === pair.left && expected.right === pair.right),
  }));
  const correct = selectedPairs.length === expectedPairs.length && pairResults.every((pair) => pair.correct);
  return {
    correct,
    pairResults,
    normalizedAnswer: selectedPairs.map((pair) => `${pair.left} -> ${pair.right}`).join(", "),
  };
}

export function evaluateQuestionAttempt(
  question: LessonArcQuestion,
  answer: QuestionAttemptAnswer,
  elapsedMs: number,
  language: string,
  runResult: LessonCodeRunResult | null = null,
): QuestionEvaluation {
  const correctDisplay = buildDisplayCorrectAnswer(question);
  let correct = false;
  let normalizedAnswer = "";
  let wrongHighlights: string[] | undefined;
  let correctHighlights: string[] | undefined;
  let pairResults: QuestionEvaluation["pairResults"];
  let selectedVersion: "A" | "B" | undefined;

  switch (question.type) {
    case "mc_concept":
    case "mc_output":
    case "true_false": {
      const optionIndex = typeof answer.optionIndex === "number"
        ? answer.optionIndex
        : question.options?.findIndex((option) => option === answer.optionValue) ?? -1;
      normalizedAnswer = optionIndex >= 0 ? question.options?.[optionIndex] ?? "" : "";
      correct = optionIndex === question.correctIndex;
      break;
    }
    case "fill_select": {
      const expectedBlanks = getFillSelectExpectedBlanks(question).map((value) => normalizeTextAnswer(value));
      const selectedBlanks = (answer.fillSelectValues ?? []).map((value) => normalizeTextAnswer(value));
      if (process.env.NODE_ENV !== "production") {
        console.log("[lesson-arc] fill_select evaluation", {
          questionId: question.id,
          prompt: question.prompt,
          selectedBlanks,
          expectedBlanks,
          code: question.code,
        });
      }
      normalizedAnswer = selectedBlanks.join(" ");
      correct = arraysEqual(selectedBlanks, expectedBlanks);
      if (!correct) {
        wrongHighlights = selectedBlanks
          .map((value, index) => (expectedBlanks[index] === value ? null : String(index)))
          .filter((value): value is string => value !== null);
        correctHighlights = selectedBlanks
          .map((value, index) => (expectedBlanks[index] === value ? String(index) : null))
          .filter((value): value is string => value !== null);
      }
      break;
    }
    case "word_bank": {
      const tokens = answer.tokens ?? [];
      normalizedAnswer = tokens.join(" ");
      const expectedTokens = question.correctTokens ?? [];
      correct = arraysEqual(tokens, expectedTokens);
      if (!correct) {
        wrongHighlights = tokens.filter((token, index) => expectedTokens[index] !== token);
        correctHighlights = tokens.filter((token, index) => expectedTokens[index] === token);
      }
      break;
    }
    case "arrange": {
      const arrangedLines = answer.arrangedLines ?? [];
      normalizedAnswer = arrangedLines.join("\n");
      const expectedLines = question.lines ?? [];
      correct = arraysEqual(arrangedLines, expectedLines);
      if (!correct) {
        wrongHighlights = arrangedLines
          .map((line, index) => (expectedLines[index] === line ? null : line))
          .filter((line): line is string => Boolean(line));
        correctHighlights = arrangedLines
          .map((line, index) => (expectedLines[index] === line ? line : null))
          .filter((line): line is string => Boolean(line));
      }
      break;
    }
    case "fill_type":
    case "predict_type": {
      normalizedAnswer = normalizeTextAnswer(answer.textValue ?? "");
      correct = normalizedAnswer === normalizeTextAnswer(question.correctAnswer ?? "");
      break;
    }
    case "spot_bug": {
      selectedVersion = answer.chosenVersion;
      normalizedAnswer = selectedVersion ?? "";
      const expectedVersion = question.correctIndex === 0 ? "A" : "B";
      correct = selectedVersion === expectedVersion;
      break;
    }
    case "match_pairs": {
      const evaluatedPairs = evaluatePairs(question, answer);
      correct = evaluatedPairs.correct;
      normalizedAnswer = evaluatedPairs.normalizedAnswer;
      pairResults = evaluatedPairs.pairResults;
      break;
    }
    case "complete_fn":
    case "debug": {
      normalizedAnswer = normalizeTypedCode(answer.codeValue ?? "");
      if (language === "python" && runResult) {
        correct = runResult.ok && runResult.passed;
      } else {
        correct = normalizedAnswer === normalizeTypedCode(question.correctAnswer ?? "");
      }
      break;
    }
    default:
      normalizedAnswer = "";
  }

  const xp = correct ? xpForQuestion(question, elapsedMs) : { total: 0, speedBonus: 0 };

  return {
    correct,
    normalizedAnswer,
    displayCorrectAnswer: correctDisplay,
    explanation: question.explanation,
    xpAwarded: xp.total,
    speedBonusAwarded: xp.speedBonus,
    wrongHighlights,
    correctHighlights,
    pairResults,
    selectedVersion,
    runResult,
  };
}

export function createEmptyNodeProgress(node: LessonArcNodeDescriptor): LessonArcNodeProgress {
  return {
    nodeId: node.nodeId,
    unitId: node.unitId,
    lessonId: node.lessonId,
    concept: node.concept,
    lessonIndex: 0,
    questionIndex: 0,
    hearts: DEFAULT_HEARTS,
    xpEarned: 0,
    totalArcXpEarned: 0,
    completedLessonIndices: [],
    status: "not_started",
    updatedAt: nowIso(),
  };
}

export function getNodeProgress(progressMap: LessonArcProgressMap | null | undefined, nodeId: string) {
  return progressMap?.[nodeId] ?? null;
}

export function upsertNodeProgress(progressMap: LessonArcProgressMap | null | undefined, progress: LessonArcNodeProgress) {
  return {
    ...(progressMap ?? {}),
    [progress.nodeId]: progress,
  };
}

export function createLessonSession(params: {
  node: LessonArcNodeDescriptor;
  lessonIndex: LessonArcLessonIndex;
  questions: LessonArcQuestion[];
  previousSession?: LessonArcSession | null;
  mode?: "progress" | "review";
}) {
  const { node, lessonIndex, questions, previousSession, mode = "progress" } = params;
  const reusePrevious = previousSession?.lessonIndex === lessonIndex && previousSession.mode === mode;
  const baseHearts = reusePrevious ? previousSession.hearts : DEFAULT_HEARTS;

  return {
    nodeId: node.nodeId,
    unitId: node.unitId,
    lessonId: node.lessonId,
    language: node.language,
    concept: node.concept,
    mode,
    lessonIndex,
    questionIndex: reusePrevious ? previousSession.questionIndex : 0,
    hearts: baseHearts,
    xpEarned: reusePrevious ? previousSession.xpEarned : 0,
    correctCount: reusePrevious ? previousSession.correctCount : 0,
    wrongCount: reusePrevious ? previousSession.wrongCount : 0,
    perfectLesson: reusePrevious ? previousSession.perfectLesson : true,
    questions,
    questionOrder: questions.map((question) => question.id),
    completedQuestionIds: reusePrevious ? previousSession.completedQuestionIds : [],
    usedHintQuestionIds: reusePrevious ? previousSession.usedHintQuestionIds : [],
    freeHintUsed: reusePrevious ? previousSession.freeHintUsed : false,
    startedAt: reusePrevious ? previousSession.startedAt : nowIso(),
    questionStartedAt: nowIso(),
    updatedAt: nowIso(),
  } satisfies LessonArcSession;
}

export function restartLessonSession(session: LessonArcSession) {
  return {
    ...session,
    questionIndex: 0,
    hearts: DEFAULT_HEARTS,
    xpEarned: 0,
    correctCount: 0,
    wrongCount: 0,
    perfectLesson: true,
    completedQuestionIds: [],
    usedHintQuestionIds: [],
    freeHintUsed: false,
    startedAt: nowIso(),
    questionStartedAt: nowIso(),
    updatedAt: nowIso(),
  } satisfies LessonArcSession;
}

export function refillLessonHearts(session: LessonArcSession) {
  return {
    ...session,
    hearts: DEFAULT_HEARTS,
    questionStartedAt: nowIso(),
    updatedAt: nowIso(),
  } satisfies LessonArcSession;
}

export function consumeLessonHint(
  session: LessonArcSession,
  questionId: string,
  options: {
    freeHintAvailable: boolean;
    unlimitedHearts: boolean;
  },
): LessonHintResult {
  if (session.usedHintQuestionIds.includes(questionId)) {
    return {
      session,
      consumedHeart: false,
      consumedFreeHint: false,
      failedLesson: false,
    };
  }

  const paidHintLesson = session.lessonIndex >= 3;
  const shouldConsumeHeart = paidHintLesson && !options.freeHintAvailable && !options.unlimitedHearts;
  const nextHearts = shouldConsumeHeart ? Math.max(0, session.hearts - 1) : session.hearts;
    const nextSession = {
      ...session,
      hearts: nextHearts,
      usedHintQuestionIds: [...session.usedHintQuestionIds, questionId],
      freeHintUsed: session.freeHintUsed || options.freeHintAvailable,
      updatedAt: nowIso(),
    } satisfies LessonArcSession;

  return {
    session: nextSession,
    consumedHeart: shouldConsumeHeart,
    consumedFreeHint: options.freeHintAvailable,
    failedLesson: shouldConsumeHeart && nextHearts <= 0,
  };
}

export function applyQuestionEvaluation(params: {
  session: LessonArcSession;
  progress: LessonArcNodeProgress | null | undefined;
  node: LessonArcNodeDescriptor;
  question: LessonArcQuestion;
  evaluation: QuestionEvaluation;
  unlimitedHearts: boolean;
}): LessonAdvanceResult {
  const { session, progress, node, question, evaluation, unlimitedHearts } = params;
  const baseProgress = progress ?? createEmptyNodeProgress(node);

  if (!evaluation.correct) {
    const nextHearts = unlimitedHearts ? session.hearts : Math.max(0, session.hearts - 1);
    const nextSession = {
      ...session,
      hearts: nextHearts,
      wrongCount: session.wrongCount + 1,
      perfectLesson: false,
      questionStartedAt: nowIso(),
      updatedAt: nowIso(),
    } satisfies LessonArcSession;
    const nextProgress = {
      ...baseProgress,
      lessonIndex: nextSession.lessonIndex,
      questionIndex: nextSession.questionIndex,
      hearts: nextSession.hearts,
      status: "in_progress",
      updatedAt: nowIso(),
    } satisfies LessonArcNodeProgress;

    if (!unlimitedHearts && nextHearts <= 0) {
      return {
        kind: "lesson_failed",
        session: nextSession,
        nodeProgress: nextProgress,
        evaluation,
      };
    }

    return {
      kind: "retry_question",
      session: nextSession,
      nodeProgress: nextProgress,
      evaluation,
    };
  }

  const nextSession = {
    ...session,
    questionIndex: session.questionIndex + 1,
    xpEarned: session.xpEarned + evaluation.xpAwarded,
    correctCount: session.correctCount + 1,
    completedQuestionIds: [...session.completedQuestionIds, question.id],
    questionStartedAt: nowIso(),
    updatedAt: nowIso(),
  } satisfies LessonArcSession;

  const runningArcXp = session.mode === "review"
    ? baseProgress.totalArcXpEarned
    : baseProgress.totalArcXpEarned + evaluation.xpAwarded;
  const intermediateProgress = {
    ...baseProgress,
    lessonIndex: nextSession.lessonIndex,
    questionIndex: nextSession.questionIndex,
    hearts: nextSession.hearts,
    xpEarned: runningArcXp,
    totalArcXpEarned: runningArcXp,
    status: "in_progress",
    updatedAt: nowIso(),
  } satisfies LessonArcNodeProgress;

  if (nextSession.questionIndex < nextSession.questions.length) {
    return {
      kind: "next_question",
      session: nextSession,
      nodeProgress: intermediateProgress,
      evaluation,
    };
  }

  const completedLessonIndices = session.mode === "review"
    ? baseProgress.completedLessonIndices
    : uniqueLessonIndices([
        ...baseProgress.completedLessonIndices,
        session.lessonIndex,
      ]);
  const lessonPassed = session.lessonIndex === 4;
  const completionProgress: LessonArcNodeProgress = lessonPassed
    ? {
        ...intermediateProgress,
        lessonIndex: 4,
        questionIndex: nextSession.questions.length,
        hearts: nextSession.hearts,
        completedLessonIndices,
        status: "completed",
        updatedAt: nowIso(),
      }
      : {
        ...intermediateProgress,
        lessonIndex: session.mode === "review" ? baseProgress.lessonIndex : clampLessonIndex(session.lessonIndex + 1),
        questionIndex: 0,
        hearts: DEFAULT_HEARTS,
        completedLessonIndices,
        status: session.mode === "review" ? baseProgress.status : "in_progress",
        updatedAt: nowIso(),
      };

  return {
    kind: "lesson_complete",
    session: nextSession,
    nodeProgress: completionProgress,
    evaluation,
    perfectBonusXp: nextSession.perfectLesson ? PERFECT_LESSON_BONUS_XP : 0,
    lessonPassed,
  };
}

export function getActiveQuestion(session: LessonArcSession | null | undefined) {
  if (!session) return null;
  return session.questions[session.questionIndex] ?? null;
}
