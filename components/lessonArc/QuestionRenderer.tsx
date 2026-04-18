"use client";

import type {
  LessonArcBaseQuestionType,
  LessonArcQuestion,
  LessonCodeRunResult,
  QuestionAttemptAnswer,
} from "@/lib/lessonArc/types";
import { getQuestionTypeLabel, resolveQuestionType } from "@/lib/lessonArc/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

/**
 * Cream/ink editorial question renderer.
 * Handles all original types + the new ones.
 */

export function isQuestionAnswerReady(
  q: LessonArcQuestion,
  a: QuestionAttemptAnswer,
  run: LessonCodeRunResult | null,
): boolean {
  switch (resolveQuestionType(q.type)) {
    case "mc_concept":
    case "mc_output":
    case "true_false":
    case "output_to_code":
      return typeof a.optionIndex === "number";
    case "code_diff":
      return a.chosenVersion === "A" || a.chosenVersion === "B";
    case "fill_type":
    case "predict_type":
    case "fill_select":
      return Boolean(a.textValue?.trim() || a.fillSelectValues?.length);
    case "word_bank":
    case "build_regex":
    case "build_query":
      return Boolean(a.tokens?.length);
    case "arrange":
    case "code_order":
    case "flowchart":
      return Boolean(a.arrangedLines?.length);
    case "spot_bug":
    case "find_token":
      return typeof a.tokenIndex === "number" || typeof a.optionIndex === "number";
    case "match_pairs":
      return (a.selectedPairs?.length ?? 0) === (q.pairs?.length ?? 0);
    case "complete_fn":
    case "debug":
      return Boolean(run?.passed) || Boolean(a.codeValue?.trim());
    case "trace_steps":
      return (a.tokens?.length ?? 0) === (q.traceSteps?.length ?? 0);
    case "slider_predict":
      return typeof a.numericValue === "number";
    default:
      return false;
  }
}

type QuestionAnswerSetter = (a: QuestionAttemptAnswer) => void;

type QuestionBodyProps = {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
  runResult: LessonCodeRunResult | null;
  onRunCode: () => void | Promise<void>;
};

type QuestionRendererProps = {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer?: QuestionAnswerSetter;
  onChange?: QuestionAnswerSetter;
  feedback: { correct: boolean } | null;
  runResult: LessonCodeRunResult | null;
  onRunCode: () => void | Promise<void>;
  hintVisible: boolean;
  onRevealHint: () => void;
  hintEnabled: boolean;
};

export default function QuestionRenderer({
  question,
  answer,
  setAnswer,
  onChange,
  feedback,
  runResult,
  onRunCode,
  hintVisible,
  onRevealHint,
  hintEnabled,
}: QuestionRendererProps) {
  const updateAnswer = setAnswer ?? onChange;

  if (typeof updateAnswer !== "function") {
    throw new TypeError("QuestionRenderer requires a setAnswer or onChange callback.");
  }

  const locked = Boolean(feedback);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10">
      {/* concept chip + hint */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--theme-accent, #e8761c)" }}>
          {getQuestionTypeLabel(question.type)} · {question.concept}
        </span>
        {question.hint && hintEnabled && !hintVisible && !locked ? (
          <button
            type="button"
            onClick={onRevealHint}
            className="font-mono text-[11px] uppercase tracking-[0.18em] underline-offset-4 hover:underline"
            style={{ color: "var(--theme-text-secondary, rgba(250,245,236,0.72))" }}
          >
            Show hint
          </button>
        ) : null}
      </div>

      <h1
        className="font-serif text-3xl leading-tight sm:text-4xl"
        style={{
          color: "#f8f3ea",
          textShadow: "0 2px 24px rgba(0,0,0,0.32)",
        }}
      >
        {question.prompt}
      </h1>

      {hintVisible && question.hint ? (
        <div
          className="mt-4 rounded-xl p-4 font-serif text-[15px]"
          style={{
            border: "1px solid color-mix(in srgb, var(--theme-accent, #e8761c) 40%, transparent)",
            background: "color-mix(in srgb, var(--theme-accent, #e8761c) 10%, transparent)",
            color: "#f8f3ea",
          }}
        >
          <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--theme-accent, #e8761c)" }}>Hint</span>
          {question.hint}
        </div>
      ) : null}

      <div className="mt-7">
        <Body
          question={question}
          answer={answer}
          setAnswer={updateAnswer}
          locked={locked}
          runResult={runResult}
          onRunCode={onRunCode}
        />
      </div>
    </div>
  );
}

/* ---------- Body switch ---------- */

function Body(p: QuestionBodyProps) {
  const Component = QUESTION_COMPONENTS[resolveQuestionType(p.question.type)];
  if (!Component) {
    return <FallbackQuestion question={p.question} />;
  }

  return <Component key={p.question.id} {...p} />;
}

/* ---------- Shared bits ---------- */

function CodeBlock({ code, highlightLine }: { code: string; highlightLine?: number }) {
  const lines = code.split("\n");
  return (
    <pre className="overflow-x-auto rounded-xl border-2 border-[#1a1815] bg-[#1a1815] p-5 font-mono text-[13px] leading-relaxed text-[#faf5ec]">
      <code>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`flex gap-4 ${highlightLine === i + 1 ? "bg-[#e8761c]/20 -mx-5 px-5" : ""}`}
          >
            <span className="select-none text-[#faf5ec]/30 tabular-nums">{String(i + 1).padStart(2, " ")}</span>
            <span className="whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </code>
    </pre>
  );
}

function getQuestionBlankCount(question: LessonArcQuestion) {
  if (question.correctBlanks?.length) return question.correctBlanks.length;
  const inlineBlanks = question.code?.match(/_{3,}/g)?.length ?? 0;
  if (inlineBlanks > 0) return inlineBlanks;
  if (typeof question.correctAnswer === "string" && question.correctAnswer.trim().length > 0) {
    return 1;
  }
  return 1;
}

function getBlankValues(answer: QuestionAttemptAnswer, count: number) {
  if (answer.fillSelectValues?.length) {
    return Array.from({ length: count }, (_, index) => answer.fillSelectValues?.[index] ?? "");
  }
  if (answer.textValue !== undefined) {
    return [answer.textValue, ...Array.from({ length: Math.max(0, count - 1) }, () => "")];
  }
  return Array.from({ length: count }, () => "");
}

function InlineBlankCode({
  code,
  values,
  locked,
  activeBlank,
  onFocusBlank,
  onChangeBlank,
}: {
  code: string;
  values: string[];
  locked: boolean;
  activeBlank?: number;
  onFocusBlank?: (index: number) => void;
  onChangeBlank: (index: number, value: string) => void;
}) {
  let blankIndex = 0;
  const lines = code.split("\n");

  return (
    <pre className="overflow-x-auto rounded-xl border-2 border-[#1a1815] bg-[#1a1815] p-5 font-mono text-[13px] leading-relaxed text-[#faf5ec]">
      <code>
        {lines.map((line, lineIndex) => {
          const segments = line.split(/_{3,}/g);
          const blankMatches = line.match(/_{3,}/g) ?? [];

          return (
            <div key={lineIndex} className="flex gap-4">
              <span className="select-none text-[#faf5ec]/30 tabular-nums">{String(lineIndex + 1).padStart(2, " ")}</span>
              <span className="flex flex-wrap items-center gap-1 whitespace-pre-wrap">
                {segments.map((segment, segmentIndex) => {
                  const elements: React.ReactNode[] = [
                    <span key={`segment-${lineIndex}-${segmentIndex}`}>{segment || (segmentIndex === 0 ? "" : " ")}</span>,
                  ];

                  if (segmentIndex < blankMatches.length) {
                    const currentBlank = blankIndex++;
                    elements.push(
                      <input
                        key={`blank-${lineIndex}-${segmentIndex}`}
                        type="text"
                        disabled={locked}
                        spellCheck={false}
                        autoComplete="off"
                        value={values[currentBlank] ?? ""}
                        onFocus={() => onFocusBlank?.(currentBlank)}
                        onChange={(event) => onChangeBlank(currentBlank, event.target.value)}
                        className={`min-w-[88px] rounded-md border px-2 py-1 font-mono text-[13px] outline-none transition-colors ${
                          activeBlank === currentBlank
                            ? "border-[#e8761c] bg-[#faf5ec] text-[#1a1815]"
                            : "border-[#faf5ec]/20 bg-[#faf5ec]/10 text-[#faf5ec]"
                        }`}
                        aria-label={`Blank ${currentBlank + 1}`}
                      />,
                    );
                  }

                  return elements;
                })}
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}

function OptionButton({
  selected,
  correct,
  wrong,
  locked,
  onClick,
  letter,
  children,
}: {
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  locked: boolean;
  onClick: () => void;
  letter?: string;
  children: React.ReactNode;
}) {
  const base =
    "group flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left font-mono text-sm transition-all";
  const state = locked
    ? correct
      ? "border-[#1a1815] bg-[#1a1815] text-[#faf5ec]"
      : wrong
        ? "border-[#e8761c] bg-[#e8761c]/10 text-[#1a1815]"
        : "border-[#1a1815]/15 bg-[#faf5ec] text-[#1a1815]/50"
    : selected
      ? "border-[#1a1815] bg-[#f1e9d4] text-[#1a1815]"
      : "border-[#1a1815]/15 bg-[#faf5ec] text-[#1a1815] hover:border-[#1a1815] hover:bg-[#f1e9d4]";

  return (
    <button type="button" disabled={locked} onClick={onClick} className={`${base} ${state}`}>
      {letter ? (
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 font-mono text-[11px] ${
            locked && correct
              ? "border-[#faf5ec] text-[#faf5ec]"
              : selected
                ? "border-[#1a1815] bg-[#1a1815] text-[#faf5ec]"
                : "border-[#1a1815]/25 text-[#1a1815]/55 group-hover:border-[#1a1815]"
          }`}
        >
          {letter}
        </span>
      ) : null}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/* ---------- Question types ---------- */

function MultipleChoice({
  question,
  answer,
  setAnswer,
  locked,
  columns,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
  columns?: 1 | 2;
}) {
  const opts = question.options ?? [];
  return (
    <div className="space-y-5">
      {question.code ? <CodeBlock code={question.code} /> : null}
      <div className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        {opts.map((opt, i) => (
          <OptionButton
            key={i}
            letter={String.fromCharCode(65 + i)}
            selected={answer.optionIndex === i}
            correct={locked && question.correctIndex === i}
            wrong={locked && answer.optionIndex === i && question.correctIndex !== i}
            locked={locked}
            onClick={() => setAnswer({ optionIndex: i, optionValue: opt })}
          >
            {opt}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}

function CodeDiff({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const versions = question.codeVersions ?? [];
  const correct = (question.correctAnswer ?? "A") as "A" | "B";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {versions.map((v) => {
        const selected = answer.chosenVersion === v.id;
        const isCorrect = locked && v.id === correct;
        const isWrong = locked && selected && v.id !== correct;
        return (
          <button
            key={v.id}
            type="button"
            disabled={locked}
            onClick={() => setAnswer({ chosenVersion: v.id })}
            className={`group overflow-hidden rounded-xl border-2 text-left transition-all ${
              isCorrect
                ? "border-[#1a1815] ring-2 ring-[#1a1815]"
                : isWrong
                  ? "border-[#e8761c] ring-2 ring-[#e8761c]"
                  : selected
                    ? "border-[#1a1815]"
                    : "border-[#1a1815]/15 hover:border-[#1a1815]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#faf5ec]/10 bg-[#1a1815] px-4 py-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#faf5ec]">
                Version {v.id}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#faf5ec]/40">
                {v.label ?? "candidate"}
              </span>
            </div>
            <pre className="overflow-x-auto bg-[#1a1815] p-4 font-mono text-[12.5px] leading-relaxed text-[#faf5ec]">
              <code>{v.code}</code>
            </pre>
          </button>
        );
      })}
    </div>
  );
}

function FillType({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const blankValues = getBlankValues(answer, 1);

  return (
    <div className="space-y-5">
      {question.code?.includes("___") ? (
        <InlineBlankCode
          code={question.code}
          values={blankValues}
          locked={locked}
          onChangeBlank={(_, value) => setAnswer({ textValue: value })}
        />
      ) : question.code ? (
        <CodeBlock code={question.code} />
      ) : null}
      {!question.code?.includes("___") ? (
        <input
          type="text"
          autoFocus
          disabled={locked}
          spellCheck={false}
          autoComplete="off"
          value={answer.textValue ?? ""}
          onChange={(e) => setAnswer({ textValue: e.target.value })}
          placeholder="Type your answer"
          className="w-full rounded-xl border-2 border-[#1a1815] bg-[#faf5ec] px-5 py-4 font-mono text-base text-[#1a1815] outline-none transition-colors placeholder:text-[#1a1815]/30 focus:bg-[#f1e9d4]"
        />
      ) : null}
    </div>
  );
}

function FillSelect({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const blankCount = getQuestionBlankCount(question);
  const opts = question.options ?? [];
  const values = getBlankValues(answer, blankCount);
  const [activeBlank, setActiveBlank] = useState(0);

  const setBlankValue = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    setAnswer({ fillSelectValues: next, textValue: next.join(" ") });
  };

  const fillFromOption = (option: string) => {
    const targetIndex = values.findIndex((value) => value.trim().length === 0);
    const nextIndex = targetIndex >= 0 ? targetIndex : activeBlank;
    setBlankValue(nextIndex, option);
    if (nextIndex < blankCount - 1) {
      setActiveBlank(nextIndex + 1);
    }
  };

  return (
    <div className="space-y-5">
      {question.code?.includes("___") ? (
        <InlineBlankCode
          code={question.code}
          values={values}
          locked={locked}
          activeBlank={activeBlank}
          onFocusBlank={setActiveBlank}
          onChangeBlank={setBlankValue}
        />
      ) : question.code ? (
        <CodeBlock code={question.code} />
      ) : null}

      {!question.code?.includes("___") ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: blankCount }, (_, index) => (
            <input
              key={index}
              type="text"
              disabled={locked}
              spellCheck={false}
              autoComplete="off"
              value={values[index] ?? ""}
              onFocus={() => setActiveBlank(index)}
              onChange={(event) => setBlankValue(index, event.target.value)}
              placeholder={`Blank ${index + 1}`}
              className="rounded-xl border-2 border-[#1a1815] bg-[#faf5ec] px-4 py-3 font-mono text-sm text-[#1a1815] outline-none transition-colors focus:bg-[#f1e9d4]"
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {opts.map((option) => (
          <button
            key={option}
            type="button"
            disabled={locked}
            onClick={() => fillFromOption(option)}
            className="rounded-md border-2 border-[#1a1815] bg-[#f1e9d4] px-3 py-1.5 font-mono text-sm text-[#1a1815] transition-colors hover:bg-[#1a1815] hover:text-[#faf5ec]"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function WordBank({
  question,
  answer,
  setAnswer,
  locked,
  mono,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
  mono?: boolean;
}) {
  const tokens = question.tokens ?? [];
  const picked = answer.tokens ?? [];

  return (
    <div className="space-y-4">
      {question.code ? <CodeBlock code={question.code} /> : null}

      {question.examples?.length ? (
        <div className="grid gap-2 rounded-xl border border-[#1a1815]/15 bg-[#f1e9d4] p-4 sm:grid-cols-2">
          {question.examples.map((ex, i) => (
            <div key={i} className="flex items-center justify-between font-mono text-[12px]">
              <span className="text-[#1a1815]">{ex.input}</span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${ex.matches ? "text-[#1a1815]" : "text-[#c95f10]"}`}>
                {ex.matches ? "match" : "no match"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="min-h-[64px] rounded-xl border-2 border-dashed border-[#1a1815]/25 bg-[#faf5ec] p-3">
        <div className="flex flex-wrap gap-2">
          {picked.length === 0 ? (
            <span className="font-mono text-xs text-[#1a1815]/40">Tap tokens below to compose your answer</span>
          ) : (
            picked.map((tok, i) => (
              <button
                key={`${tok}-${i}`}
                type="button"
                disabled={locked}
                onClick={() => setAnswer({ tokens: picked.filter((_, j) => j !== i) })}
                className={`${mono ? "font-mono" : "font-sans"} rounded-md border-2 border-[#1a1815] bg-[#1a1815] px-3 py-1.5 text-sm text-[#faf5ec]`}
              >
                {tok.split("__")[0]}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tokens.map((t, i) => {
          const key = `${t}__${i}`;
          const used = picked.includes(key);
          return (
            <button
              key={key}
              type="button"
              disabled={locked || used}
              onClick={() => setAnswer({ tokens: [...picked, key] })}
              className={`${mono ? "font-mono" : "font-sans"} rounded-md border-2 px-3 py-1.5 text-sm transition-colors ${
                used
                  ? "border-[#1a1815]/10 bg-[#faf5ec] text-[#1a1815]/25"
                  : "border-[#1a1815] bg-[#f1e9d4] text-[#1a1815] hover:bg-[#1a1815] hover:text-[#faf5ec]"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArrangeLines({
  question,
  answer,
  setAnswer,
  locked,
  mono,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
  mono?: boolean;
}) {
  const sourceLines = question.lines ?? question.flowBlocks ?? [];
  const [list, setList] = useState(() =>
    (answer.arrangedLines?.length ? answer.arrangedLines : sourceLines).map((text, index) => ({
      id: `${index}-${text}`,
      t: text,
    })),
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onEnd = (e: DragEndEvent) => {
    if (locked) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = list.findIndex((i) => i.id === active.id);
    const newI = list.findIndex((i) => i.id === over.id);
    const next = arrayMove(list, oldI, newI);
    setList(next);
    setAnswer({ arrangedLines: next.map((n) => n.t) });
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={list} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {list.map((it, idx) => (
              <SortableLine key={it.id} id={it.id} index={idx} text={it.t} mono={mono} locked={locked} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableLine({
  id,
  index,
  text,
  mono,
  locked,
}: {
  id: string;
  index: number;
  text: string;
  mono?: boolean;
  locked: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...(locked ? {} : listeners)}
      className={`flex items-center gap-3 rounded-xl border-2 border-[#1a1815] bg-[#faf5ec] px-4 py-3 ${locked ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1a1815]/40 w-6">{String(index + 1).padStart(2, "0")}</span>
      <span className={`flex-1 ${mono ? "font-mono text-[13px]" : "font-sans text-sm"} text-[#1a1815]`}>{text}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1a1815]/30" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
      </svg>
    </div>
  );
}

function SpotBug({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const lines = (question.code ?? "").split("\n");
  return (
    <div className="overflow-hidden rounded-xl border-2 border-[#1a1815] bg-[#1a1815]">
      {lines.map((line, i) => {
        const lineNo = i + 1;
        const selected = answer.optionIndex === lineNo;
        const isBug = locked && question.bugLine === lineNo;
        const isWrong = locked && selected && !isBug;
        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => setAnswer({ optionIndex: lineNo })}
            className={`flex w-full items-center gap-4 px-5 py-2 text-left font-mono text-[13px] transition-colors ${
              isBug
                ? "bg-[#e8761c] text-[#faf5ec]"
                : isWrong
                  ? "bg-[#e8761c]/30 text-[#faf5ec]"
                  : selected
                    ? "bg-[#faf5ec]/10 text-[#faf5ec]"
                    : "text-[#faf5ec] hover:bg-[#faf5ec]/5"
            }`}
          >
            <span className="select-none w-6 text-[#faf5ec]/40 tabular-nums">{String(lineNo).padStart(2, " ")}</span>
            <span className="whitespace-pre">{line || " "}</span>
          </button>
        );
      })}
    </div>
  );
}

function FindToken({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const tokenParts = useMemo(
    () =>
      (question.code ?? "").split(/(\s+)/).reduce<
        Array<{ key: number; text: string; tokenIndex: number | null; whitespace: boolean }>
      >((parts, text, index) => {
        if (/^\s+$/.test(text)) {
          parts.push({
            key: index,
            text,
            tokenIndex: null,
            whitespace: true,
          });
          return parts;
        }

        const nextIndex = parts.filter((part) => !part.whitespace).length;
        parts.push({
          key: index,
          text,
          tokenIndex: nextIndex,
          whitespace: false,
        });
        return parts;
      }, []),
    [question.code],
  );

  return (
    <pre className="overflow-x-auto rounded-xl border-2 border-[#1a1815] bg-[#1a1815] p-5 font-mono text-[14px] leading-relaxed text-[#faf5ec]">
      <code className="block">
        {tokenParts.map((part) => {
          if (part.whitespace || part.tokenIndex === null) {
            return <span key={part.key}>{part.text}</span>;
          }

          const myIdx = part.tokenIndex;
          const selected = answer.tokenIndex === myIdx;
          const isWrong = locked && question.wrongTokenIndex === myIdx;
          const isMissed = locked && selected && !isWrong;
          return (
            <button
              key={part.key}
              type="button"
              disabled={locked}
              onClick={() => setAnswer({ tokenIndex: myIdx })}
              className={`mx-[1px] rounded px-1 transition-colors ${
                isWrong
                  ? "bg-[#e8761c] text-[#faf5ec]"
                  : isMissed
                    ? "bg-[#e8761c]/30"
                    : selected
                      ? "bg-[#faf5ec]/15"
                      : "hover:bg-[#faf5ec]/10"
              }`}
            >
              {part.text}
            </button>
          );
        })}
      </code>
    </pre>
  );
}

function MatchPairs({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const pairs = question.pairs ?? [];
  const lefts = pairs.map((p) => p.left);
  const baseRights = pairs.map((pair) => pair.right);
  const offset =
    baseRights.length > 0
      ? question.id.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % baseRights.length
      : 0;
  const rights = baseRights.length <= 1
    ? baseRights
    : baseRights.map((_, index) => baseRights[(index + offset) % baseRights.length]);
  const selected = answer.selectedPairs ?? [];
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const matchedLefts = new Set(selected.map((s) => s.left));
  const matchedRights = new Set(selected.map((s) => s.right));

  const pickRight = (right: string) => {
    if (!activeLeft || locked) return;
    setAnswer({ selectedPairs: [...selected.filter((s) => s.left !== activeLeft), { left: activeLeft, right }] });
    setActiveLeft(null);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        {lefts.map((l) => {
          const matched = matchedLefts.has(l);
          const active = activeLeft === l;
          return (
            <button
              key={l}
              type="button"
              disabled={locked || matched}
              onClick={() => setActiveLeft(l)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left font-mono text-sm transition-colors ${
                matched
                  ? "border-[#1a1815] bg-[#1a1815] text-[#faf5ec]"
                  : active
                    ? "border-[#e8761c] bg-[#e8761c]/10 text-[#1a1815]"
                    : "border-[#1a1815]/15 bg-[#faf5ec] text-[#1a1815] hover:border-[#1a1815]"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {rights.map((r) => {
          const matched = matchedRights.has(r);
          return (
            <button
              key={r}
              type="button"
              disabled={locked || matched}
              onClick={() => pickRight(r)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left font-mono text-sm transition-colors ${
                matched
                  ? "border-[#1a1815] bg-[#1a1815] text-[#faf5ec]"
                  : "border-[#1a1815]/15 bg-[#faf5ec] text-[#1a1815] hover:border-[#1a1815]"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TraceSteps({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const steps = question.traceSteps ?? [];
  const [active, setActive] = useState(0);
  const values = answer.tokens ?? Array(steps.length).fill("");

  const setVal = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    setAnswer({ tokens: next });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <CodeBlock code={question.code ?? ""} highlightLine={steps[active]?.line} />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i === active ? "bg-[#e8761c]" : values[i] ? "bg-[#1a1815]" : "bg-[#1a1815]/15"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
        <div className="rounded-xl border-2 border-[#1a1815] bg-[#faf5ec] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8761c]">
            Step {active + 1} of {steps.length}
          </div>
          <p className="mt-2 font-serif text-lg text-[#1a1815]">{steps[active]?.prompt}</p>
          <input
            type="text"
            disabled={locked}
            value={values[active] ?? ""}
            onChange={(e) => setVal(active, e.target.value)}
            placeholder="Predicted value"
            className="mt-3 w-full rounded-lg border-2 border-[#1a1815] bg-[#faf5ec] px-3 py-2 font-mono text-sm focus:bg-[#f1e9d4]"
          />
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              disabled={active === 0}
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1a1815]/55 hover:text-[#1a1815] disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={active === steps.length - 1}
              onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1a1815]/55 hover:text-[#1a1815] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderPredict({
  question,
  answer,
  setAnswer,
  locked,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
}) {
  const min = question.numericMin ?? 0;
  const max = question.numericMax ?? 100;
  const step = question.numericStep ?? 1;
  const value = answer.numericValue ?? Math.round((min + max) / 2);

  return (
    <div className="space-y-6">
      {question.code ? <CodeBlock code={question.code} /> : null}
      <div className="rounded-xl border-2 border-[#1a1815] bg-[#faf5ec] p-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#1a1815]/55">Your prediction</span>
          <span className="font-serif text-5xl text-[#1a1815] tabular-nums">{value}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          disabled={locked}
          value={value}
          onChange={(e) => setAnswer({ numericValue: Number(e.target.value), textValue: e.target.value })}
          className="mt-4 w-full accent-[#e8761c]"
        />
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#1a1815]/45">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

function CodeEditor({
  question,
  answer,
  setAnswer,
  locked,
  runResult,
  onRunCode,
}: {
  question: LessonArcQuestion;
  answer: QuestionAttemptAnswer;
  setAnswer: (a: QuestionAttemptAnswer) => void;
  locked: boolean;
  runResult: LessonCodeRunResult | null;
  onRunCode: () => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border-2 border-[#1a1815]">
        <div className="flex items-center justify-between border-b border-[#faf5ec]/10 bg-[#1a1815] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e8761c]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#faf5ec]/70">editor</span>
          </div>
          <button
            type="button"
            onClick={() => void onRunCode()}
            disabled={locked}
            className="rounded-md bg-[#e8761c] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#faf5ec] hover:bg-[#c95f10]"
          >
            Run tests
          </button>
        </div>
        <textarea
          value={answer.codeValue ?? question.code ?? ""}
          disabled={locked}
          spellCheck={false}
          onChange={(e) => setAnswer({ codeValue: e.target.value })}
          className="block min-h-[260px] w-full bg-[#1a1815] p-5 font-mono text-[13px] leading-relaxed text-[#faf5ec] outline-none"
        />
      </div>

      {runResult ? (
        <div className="overflow-hidden rounded-xl border border-[#1a1815]/15 bg-[#f1e9d4]">
          <div className="border-b border-[#1a1815]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1a1815]/60">
            Tests · {runResult.tests.filter((t) => t.passed).length}/{runResult.tests.length} passed
          </div>
          <div className="divide-y divide-[#1a1815]/10">
            {runResult.tests.map((t, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr] items-center gap-4 px-4 py-2 font-mono text-[12px]">
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] ${t.passed ? "bg-[#1a1815] text-[#faf5ec]" : "bg-[#e8761c] text-[#faf5ec]"}`}>
                  {t.passed ? "✓" : "×"}
                </span>
                <span className="text-[#1a1815]">{t.input}</span>
                <span className="text-[#1a1815]/70">→ {t.actual}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FallbackQuestion({ question }: { question: LessonArcQuestion }) {
  return (
    <div className="space-y-4 rounded-xl border-2 border-dashed border-[#e8761c] bg-[#e8761c]/8 p-5">
      <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#c95f10]">
        Question type not supported
      </p>
      <pre className="overflow-x-auto rounded-lg border border-[#1a1815]/15 bg-[#faf5ec] p-4 font-mono text-[12px] leading-relaxed text-[#1a1815]">
        <code>{JSON.stringify(question, null, 2)}</code>
      </pre>
    </div>
  );
}

const QUESTION_COMPONENTS: Partial<Record<LessonArcBaseQuestionType, React.ComponentType<QuestionBodyProps>>> = {
  mc_concept: MultipleChoice,
  mc_output: MultipleChoice,
  output_to_code: MultipleChoice,
  true_false: (props) => <MultipleChoice {...props} columns={2} />,
  code_diff: CodeDiff,
  fill_type: FillType,
  predict_type: FillType,
  fill_select: FillSelect,
  word_bank: WordBank,
  build_regex: (props) => <WordBank {...props} mono />,
  build_query: (props) => <WordBank {...props} mono />,
  arrange: (props) => <ArrangeLines {...props} mono />,
  code_order: (props) => <ArrangeLines {...props} mono />,
  flowchart: ArrangeLines,
  spot_bug: SpotBug,
  find_token: FindToken,
  match_pairs: MatchPairs,
  trace_steps: TraceSteps,
  slider_predict: SliderPredict,
  complete_fn: CodeEditor,
  debug: CodeEditor,
};
