"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { splitSpotBugVersions } from "@/lib/lessonArc/engine";
import type {
  LessonArcQuestion,
  LessonCodeRunResult,
  QuestionAttemptAnswer,
  QuestionEvaluation,
} from "@/lib/lessonArc/types";

function seededOrder<T>(items: T[], seed: string) {
  const chars = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [...items].sort((left, right) => {
    const leftScore = JSON.stringify(left).length * 17 + chars;
    const rightScore = JSON.stringify(right).length * 17 + chars * 2;
    return leftScore - rightScore;
  });
}

function splitCodeBlank(code: string | undefined) {
  return code ? code.split(/_{3,}/) : [];
}

function countCodeBlanks(code: string | undefined) {
  return code?.match(/_{3,}/g)?.length ?? 0;
}

function getFillSelectExpectedBlanks(question: LessonArcQuestion) {
  if (question.correctBlanks?.length) {
    return question.correctBlanks;
  }
  if (typeof question.correctAnswer === "string") {
    return [question.correctAnswer];
  }
  if (typeof question.correctIndex === "number" && question.options?.[question.correctIndex]) {
    return [question.options[question.correctIndex]];
  }
  return [];
}

function CodeCard({
  code,
  highlightLine,
}: {
  code: string;
  highlightLine?: number;
}) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101d]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-white/38">Code</p>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/75" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/75" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/75" />
        </div>
      </div>
      <div className="space-y-1 px-4 py-4 font-mono text-[0.95rem] text-slate-100">
        {lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className={`grid grid-cols-[2rem_1fr] gap-3 rounded-lg px-2 py-1 ${highlightLine === index + 1 ? "bg-rose-500/12 ring-1 ring-rose-300/30" : ""}`}
          >
            <span className="text-right text-[0.72rem] font-bold text-white/28">{index + 1}</span>
            <code className="whitespace-pre-wrap break-words">{line}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChoiceCard({
  label,
  active,
  correct,
  wrong,
  onClick,
}: {
  label: string;
  active: boolean;
  correct?: boolean;
  wrong?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[88px] rounded-[1.4rem] border px-4 py-4 text-left text-base font-semibold transition ${
        correct
          ? "border-emerald-300/50 bg-emerald-400/14 text-emerald-100"
          : wrong
            ? "border-rose-300/50 bg-rose-500/14 text-rose-100 animate-[lessonShake_400ms_ease-in-out]"
            : active
              ? "border-white/30 bg-white/10 text-white"
              : "border-white/10 bg-white/6 text-white/82 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function TokenChip({
  token,
  onClick,
  highlighted,
}: {
  token: string;
  onClick: () => void;
  highlighted?: "correct" | "wrong";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Token ${token}`}
      className={`rounded-full border px-4 py-2 font-mono text-sm font-bold transition active:scale-[0.96] ${
        highlighted === "correct"
          ? "border-emerald-300/50 bg-emerald-400/14 text-emerald-100"
          : highlighted === "wrong"
            ? "border-rose-300/50 bg-rose-500/14 text-rose-100"
            : "border-white/10 bg-white/7 text-white hover:-translate-y-0.5"
      }`}
    >
      {token}
    </button>
  );
}

function MatchPairsQuestion({
  question,
  answer,
  onChange,
  feedback,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  onChange: (next: QuestionAttemptAnswer) => void;
  feedback: QuestionEvaluation | null;
}) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [shakePair, setShakePair] = useState<string | null>(null);
  const selectedPairs = useMemo(() => answer.selectedPairs ?? [], [answer.selectedPairs]);
  const pairs = useMemo(() => question.pairs ?? [], [question.pairs]);
  const matchedLeft = useMemo(() => new Set(selectedPairs.map((pair) => pair.left)), [selectedPairs]);
  const matchedRight = useMemo(() => new Set(selectedPairs.map((pair) => pair.right)), [selectedPairs]);
  const remainingPairs = useMemo(
    () => pairs.filter((pair) => !matchedLeft.has(pair.left) && !matchedRight.has(pair.right)),
    [matchedLeft, matchedRight, pairs],
  );

  const resolvePair = useCallback((left: string, right: string) => {
    const isCorrect = pairs.some((pair) => pair.left === left && pair.right === right);
    if (isCorrect) {
      onChange({
        ...answer,
        selectedPairs: [...selectedPairs, { left, right }],
      });
      setSelectedLeft(null);
      setSelectedRight(null);
      return;
    }

    setShakePair(`${left}:${right}`);
    window.setTimeout(() => {
      setSelectedLeft(null);
      setSelectedRight(null);
      setShakePair(null);
    }, 420);
  }, [answer, onChange, pairs, selectedPairs]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {remainingPairs.map((pair) => (
          <button
            key={pair.left}
            type="button"
            disabled={matchedLeft.has(pair.left)}
            onClick={() => {
              if (selectedRight) {
                resolvePair(pair.left, selectedRight);
                return;
              }
              setSelectedLeft(pair.left);
            }}
            className={`min-h-[52px] w-full rounded-[1.2rem] border px-4 py-3 text-left font-semibold transition ${
              matchedLeft.has(pair.left)
                ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100/75"
                : selectedLeft === pair.left
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-white/6 text-white/84"
            } ${shakePair?.startsWith(`${pair.left}:`) ? "animate-[lessonShake_400ms_ease-in-out]" : ""}`}
          >
            {pair.left}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {remainingPairs.map((pair) => (
          <button
            key={pair.right}
            type="button"
            disabled={matchedRight.has(pair.right)}
            onClick={() => {
              if (selectedLeft) {
                resolvePair(selectedLeft, pair.right);
                return;
              }
              setSelectedRight(pair.right);
            }}
            className={`min-h-[52px] w-full rounded-[1.2rem] border px-4 py-3 text-left font-semibold transition ${
              matchedRight.has(pair.right)
                ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100/75"
                : selectedRight === pair.right
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-white/6 text-white/84"
            } ${shakePair?.endsWith(`:${pair.right}`) ? "animate-[lessonShake_400ms_ease-in-out]" : ""}`}
          >
            {pair.right}
          </button>
        ))}
      </div>
      {feedback?.correct ? (
        <p className="md:col-span-2 text-sm font-semibold text-emerald-100/85">All pairs matched.</p>
      ) : null}
    </div>
  );
}

function FillSelectQuestion({
  question,
  answer,
  onChange,
  feedback,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  onChange: (next: QuestionAttemptAnswer) => void;
  feedback: QuestionEvaluation | null;
}) {
  const code = question.code ?? "";
  const codeLines = useMemo(() => code.split("\n"), [code]);
  const blankCount = countCodeBlanks(code);
  const blankValues = useMemo(() => answer.fillSelectValues ?? [], [answer.fillSelectValues]);
  const expectedBlanks = useMemo(() => getFillSelectExpectedBlanks(question), [question]);
  const firstEmptyIndex = blankValues.findIndex((value) => !value);
  const nextBlankIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : blankValues.length;
  const lineSegments = useMemo(() => {
    return codeLines.reduce<Array<{ line: string; parts: string[]; startingBlankIndex: number }>>((segments, line) => {
      const startingBlankIndex = segments.reduce(
        (count, entry) => count + Math.max(0, entry.parts.length - 1),
        0,
      );
      const parts = line.split(/_{3,}/);
      return [...segments, { line, parts, startingBlankIndex }];
    }, []);
  }, [codeLines]);

  const fillBlank = useCallback((option: string) => {
    if (feedback) return;
    const targetIndex = nextBlankIndex;
    if (targetIndex < 0 || targetIndex >= blankCount) return;
    const nextValues = Array.from({ length: blankCount }, (_, index) => blankValues[index] ?? "");
    nextValues[targetIndex] = option;
    onChange({
      ...answer,
      fillSelectValues: nextValues,
    });
  }, [answer, blankCount, blankValues, feedback, nextBlankIndex, onChange]);

  const clearBlank = useCallback((blankIndex: number) => {
    if (feedback) return;
    const nextValues = Array.from({ length: blankCount }, (_, index) => blankValues[index] ?? "");
    nextValues[blankIndex] = "";
    onChange({
      ...answer,
      fillSelectValues: nextValues,
    });
  }, [answer, blankCount, blankValues, feedback, onChange]);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101d]">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-white/38">Code</p>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/42">
            Fill {blankCount} blank{blankCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-1 px-4 py-4 font-mono text-[0.95rem] text-slate-100">
          {lineSegments.map(({ line, parts: lineParts, startingBlankIndex }, lineIndex) => {
            return (
              <div key={`${lineIndex}-${line}`} className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg px-2 py-1">
                <span className="text-right text-[0.72rem] font-bold text-white/28">{lineIndex + 1}</span>
                <code className="flex flex-wrap items-center gap-2 whitespace-pre-wrap break-words">
                  {lineParts.map((part, partIndex) => {
                    const blankIndex = startingBlankIndex + partIndex;
                    const hasBlankAfterPart = partIndex < lineParts.length - 1;
                    const selectedValue = blankValues[blankIndex] ?? "";
                    const isCorrect = feedback && expectedBlanks[blankIndex] === selectedValue;
                    const isWrong = feedback && selectedValue && expectedBlanks[blankIndex] !== selectedValue;
                    const isActiveBlank = !feedback && blankIndex === nextBlankIndex;

                    return (
                      <span key={`${lineIndex}-${partIndex}`} className="contents">
                        {part ? <span className="whitespace-pre-wrap">{part}</span> : null}
                        {hasBlankAfterPart ? (
                          <button
                            type="button"
                            onClick={() => clearBlank(blankIndex)}
                            disabled={feedback ? true : !selectedValue}
                            aria-label={selectedValue ? `Filled blank ${blankIndex + 1} with ${selectedValue}. Tap to clear.` : `Blank ${blankIndex + 1}`}
                            className={`inline-flex min-h-[2.25rem] min-w-[4.5rem] items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-bold transition ${
                              isCorrect
                                ? "border-emerald-300/50 bg-emerald-400/14 text-emerald-100"
                                : isWrong
                                  ? "border-rose-300/50 bg-rose-500/14 text-rose-100 animate-[lessonShake_400ms_ease-in-out]"
                                  : selectedValue
                                    ? "border-sky-300/35 bg-sky-400/12 text-sky-100"
                                    : isActiveBlank
                                      ? "border-amber-300/40 bg-amber-400/12 text-amber-100"
                                      : "border-white/12 bg-white/6 text-white/45"
                            } ${!feedback && selectedValue ? "hover:-translate-y-0.5" : ""}`}
                          >
                            {selectedValue || `Blank ${blankIndex + 1}`}
                          </button>
                        ) : null}
                      </span>
                    );
                  })}
                </code>
              </div>
            );
          })}
        </div>
      </div>

      {question.options?.length ? (
        <div className="space-y-3">
          {!feedback && nextBlankIndex < blankCount ? (
            <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-white/42">
              Available choices
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {question.options.map((option, index) => {
              const usedCount = blankValues.filter((value) => value === option).length;
              const availableCount = (question.options ?? []).filter((entry) => entry === option).length;
              const canUse = !feedback && usedCount < availableCount && nextBlankIndex < blankCount;
              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  onClick={() => fillBlank(option)}
                  disabled={!canUse}
                  className={`rounded-full border px-4 py-2 font-mono text-sm font-bold transition ${
                    canUse
                      ? "border-white/10 bg-white/7 text-white hover:-translate-y-0.5"
                      : "border-white/10 bg-white/5 text-white/35"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function isQuestionAnswerReady(
  question: LessonArcQuestion,
  answer: QuestionAttemptAnswer,
  runResult: LessonCodeRunResult | null,
) {
  switch (question.type) {
    case "mc_concept":
    case "mc_output":
    case "true_false":
      return typeof answer.optionIndex === "number" || typeof answer.optionValue === "string";
    case "fill_select": {
      const blankCount = countCodeBlanks(question.code);
      if (blankCount <= 1) {
        return Boolean(answer.fillSelectValues?.[0]);
      }
      return (answer.fillSelectValues?.filter(Boolean).length ?? 0) === blankCount;
    }
    case "word_bank":
      return (answer.tokens?.length ?? 0) > 0;
    case "arrange":
      return (answer.arrangedLines?.length ?? 0) === (question.lines?.length ?? 0);
    case "fill_type":
    case "predict_type":
      return Boolean(answer.textValue?.trim());
    case "spot_bug":
      return Boolean(answer.chosenVersion);
    case "match_pairs":
      return (answer.selectedPairs?.length ?? 0) === (question.pairs?.length ?? 0);
    case "complete_fn":
    case "debug":
      return Boolean(answer.codeValue?.trim()) && Boolean(runResult);
    default:
      return false;
  }
}

export default function QuestionRenderer({
  question,
  answer,
  onChange,
  feedback,
  runResult,
  onRunCode,
  hintVisible,
  onRevealHint,
  hintEnabled,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  onChange: (next: QuestionAttemptAnswer) => void;
  feedback: QuestionEvaluation | null;
  runResult: LessonCodeRunResult | null;
  onRunCode: () => void;
  hintVisible: boolean;
  onRevealHint: () => void;
  hintEnabled: boolean;
}) {
  const shuffledLines = useMemo(
    () => question.lines ? seededOrder(question.lines, question.id) : [],
    [question.id, question.lines],
  );
  const arrangedLines = answer.arrangedLines ?? [];

  useEffect(() => {
    if (question.type !== "arrange") return;
    if ((answer.arrangedLines?.length ?? 0) > 0) return;
    onChange({ ...answer, arrangedLines: shuffledLines });
  }, [answer, onChange, question.type, shuffledLines]);

  const { versionA, versionB } = useMemo(() => splitSpotBugVersions(question.code), [question.code]);
  const fillParts = splitCodeBlank(question.code);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("[lesson-arc] rendering question", {
      id: question.id,
      concept: question.concept,
      type: question.type,
      difficulty: question.difficulty,
    });
  }, [question.concept, question.difficulty, question.id, question.type]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6" role="group" aria-label={`Question: ${question.prompt}`}>
      <style>{`
        @keyframes lessonShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-black uppercase tracking-[0.24em] text-white/36">{question.type.replace(/_/g, " ")}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-white md:text-4xl">{question.prompt}</h1>
        </div>
        {question.hint ? (
          <button
            type="button"
            onClick={onRevealHint}
            disabled={!hintEnabled && hintVisible}
            className="mt-1 inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 text-sm font-black uppercase tracking-[0.16em] text-white/75"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-300" fill="currentColor">
              <path d="M12 2a7 7 0 0 0-4.43 12.42c.64.52 1.09 1.14 1.31 1.86l.11.34h6.02l.11-.34c.22-.72.67-1.34 1.31-1.86A7 7 0 0 0 12 2Zm-3 16h6v2H9v-2Zm1 3h4v1h-4v-1Z" />
            </svg>
            Hint
          </button>
        ) : null}
      </div>

      {hintVisible && question.hint ? (
        <div className="rounded-[1.4rem] border border-amber-300/20 bg-amber-400/10 px-5 py-4 text-sm font-semibold leading-6 text-amber-50">
          {question.hint}
        </div>
      ) : null}

      {(question.type === "mc_output" || question.type === "predict_type" || question.type === "fill_type" || question.type === "true_false" || question.type === "complete_fn" || question.type === "debug") && question.code ? (
        <CodeCard code={question.code} />
      ) : null}

      {(question.type === "mc_concept" || question.type === "mc_output") && question.options ? (
        <div className="grid gap-4 md:grid-cols-2">
          {question.options.map((option, index) => (
            <ChoiceCard
              key={option}
              label={option}
              active={answer.optionIndex === index}
              correct={Boolean(feedback && question.correctIndex === index)}
              wrong={Boolean(feedback && !feedback.correct && answer.optionIndex === index)}
              onClick={() => onChange({ optionIndex: index, optionValue: option })}
            />
          ))}
        </div>
      ) : null}

      {question.type === "word_bank" ? (
        <div className="space-y-5">
          <div className="min-h-[74px] rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {(answer.tokens ?? []).map((token, index) => {
                const correctToken = question.correctTokens?.[index] === token;
                return (
                  <TokenChip
                    key={`${token}-${index}`}
                    token={token}
                    onClick={() => {
                      const nextTokens = [...(answer.tokens ?? [])];
                      nextTokens.splice(index, 1);
                      onChange({ ...answer, tokens: nextTokens });
                    }}
                    highlighted={feedback ? (correctToken ? "correct" : "wrong") : undefined}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(question.tokens ?? []).map((token, index) => {
              const alreadyUsed = (answer.tokens ?? []).filter((entry) => entry === token).length;
              const availableCount = (question.correctTokens ?? []).filter((entry) => entry === token).length;
              const canUse = alreadyUsed < Math.max(availableCount, 1);
              return (
                <TokenChip
                  key={`${token}-${index}`}
                  token={token}
                  onClick={() => {
                    if (!canUse) return;
                    onChange({ ...answer, tokens: [...(answer.tokens ?? []), token] });
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {question.type === "arrange" ? (
        <div className="space-y-3">
          {arrangedLines.map((line, index) => {
            const expectedLine = question.lines?.[index];
            const state = feedback
              ? expectedLine === line
                ? "correct"
                : "wrong"
              : "idle";
            return (
              <div
                key={`${line}-${index}`}
                className={`flex items-center gap-3 rounded-[1.3rem] border px-4 py-3 ${
                  state === "correct"
                    ? "border-emerald-300/50 bg-emerald-400/14 text-emerald-100"
                    : state === "wrong"
                      ? "border-rose-300/50 bg-rose-500/14 text-rose-100"
                      : "border-white/10 bg-white/6 text-white"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs" onClick={() => {
                    if (index === 0) return;
                    const next = [...arrangedLines];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    onChange({ ...answer, arrangedLines: next });
                  }}>▲</button>
                  <button type="button" className="rounded border border-white/10 px-2 py-1 text-xs" onClick={() => {
                    if (index === arrangedLines.length - 1) return;
                    const next = [...arrangedLines];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    onChange({ ...answer, arrangedLines: next });
                  }}>▼</button>
                </div>
                <code className="whitespace-pre-wrap font-mono text-sm">{line}</code>
              </div>
            );
          })}
        </div>
      ) : null}

      {question.type === "fill_type" ? (
        <div className="rounded-[1.6rem] border border-white/10 bg-[#07101d] px-4 py-4 font-mono text-[1rem] text-slate-100">
          {fillParts[0]}
          <input
            autoFocus
            value={answer.textValue ?? ""}
            onChange={(event) => onChange({ textValue: event.target.value })}
            aria-label="Type the missing code token"
            className={`mx-2 inline-block min-w-[9rem] rounded-md border px-2 py-1 font-mono outline-none ${
              feedback?.correct
                ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-100"
                : feedback && !feedback.correct
                  ? "border-rose-300/50 bg-rose-500/10 text-rose-100"
                  : "border-white/10 bg-white/8 text-white"
            }`}
          />
          {fillParts[1]}
        </div>
      ) : null}

      {question.type === "fill_select" ? (
        <FillSelectQuestion question={question} answer={answer} onChange={onChange} feedback={feedback} />
      ) : null}

      {question.type === "spot_bug" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {([
            { label: "Version A", code: versionA, version: "A" as const },
            { label: "Version B", code: versionB, version: "B" as const },
          ]).map((panel) => {
            const chosen = answer.chosenVersion === panel.version;
            const correct = feedback?.selectedVersion ? question.correctIndex === (panel.version === "A" ? 0 : 1) : false;
            const wrong = Boolean(feedback && !feedback.correct && chosen);
            return (
              <button
                key={panel.label}
                type="button"
                onClick={() => onChange({ chosenVersion: panel.version })}
                className={`rounded-[1.6rem] border p-4 text-left transition ${
                  correct
                    ? "border-emerald-300/50 bg-emerald-400/12"
                    : wrong
                      ? "border-rose-300/50 bg-rose-500/12 animate-[lessonShake_400ms_ease-in-out]"
                      : chosen
                        ? "border-white/28 bg-white/10"
                        : "border-white/10 bg-white/6"
                }`}
              >
                <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-white/55">{panel.label}</p>
                <CodeCard
                  code={panel.code}
                  highlightLine={
                    feedback && question.correctIndex === (panel.version === "A" ? 0 : 1)
                      ? question.bugLine
                      : undefined
                  }
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {question.type === "predict_type" ? (
        <textarea
          autoFocus
          value={answer.textValue ?? ""}
          onChange={(event) => onChange({ textValue: event.target.value })}
          aria-label="Type the exact output"
          className={`min-h-[128px] w-full rounded-[1.5rem] border bg-[#0a1423] px-4 py-4 font-mono text-base outline-none ${
            feedback?.correct
              ? "border-emerald-300/50 text-emerald-100"
              : feedback && !feedback.correct
                ? "border-rose-300/50 text-rose-100"
                : "border-white/10 text-white"
          }`}
          placeholder="Type the exact output here..."
        />
      ) : null}

      {question.type === "match_pairs" ? (
        <MatchPairsQuestion question={question} answer={answer} onChange={onChange} feedback={feedback} />
      ) : null}

      {question.type === "true_false" && question.options ? (
        <div className="grid gap-4 md:grid-cols-2">
          {question.options.map((option, index) => (
            <ChoiceCard
              key={option}
              label={option}
              active={answer.optionIndex === index}
              correct={Boolean(feedback && question.correctIndex === index)}
              wrong={Boolean(feedback && !feedback.correct && answer.optionIndex === index)}
              onClick={() => onChange({ optionIndex: index, optionValue: option, booleanValue: index === 0 })}
            />
          ))}
        </div>
      ) : null}

      {(question.type === "complete_fn" || question.type === "debug") ? (
        <div className="space-y-4">
          <textarea
            value={answer.codeValue ?? question.code ?? ""}
            onChange={(event) => onChange({ codeValue: event.target.value })}
            aria-label={question.type === "complete_fn" ? "Complete the function code" : "Fix the code in the editor"}
            className="min-h-[220px] w-full rounded-[1.6rem] border border-white/10 bg-[#07101d] px-4 py-4 font-mono text-[0.95rem] text-white outline-none"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRunCode}
              className="rounded-full border border-sky-300/30 bg-sky-400/12 px-5 py-2 text-sm font-black uppercase tracking-[0.16em] text-sky-100"
            >
              Run
            </button>
            {question.testCases?.[0] ? (
              <p className="text-sm font-semibold text-white/65">
                Example test: <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono">{question.testCases[0].input}</code> → {question.testCases[0].expected}
              </p>
            ) : null}
          </div>
          {runResult ? (
            <div className={`rounded-[1.4rem] border px-4 py-4 ${runResult.passed ? "border-emerald-300/35 bg-emerald-400/10" : "border-rose-300/30 bg-rose-500/10"}`}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-white/55">Test results</p>
              <div className="mt-3 space-y-2">
                {runResult.tests.map((test) => (
                  <div key={`${test.input}-${test.expected}`} className="rounded-xl border border-white/8 bg-black/10 px-3 py-3 text-sm text-white/85">
                    <p><span className="font-black text-white">Input:</span> <code>{test.input}</code></p>
                    <p><span className="font-black text-white">Expected:</span> <code>{test.expected}</code></p>
                    <p><span className="font-black text-white">Actual:</span> <code>{test.actual}</code></p>
                  </div>
                ))}
              </div>
              {runResult.error ? <p className="mt-3 text-sm font-semibold text-rose-100">{runResult.error}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
