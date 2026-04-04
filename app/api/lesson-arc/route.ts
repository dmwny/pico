import { createClient } from "@supabase/supabase-js";
import { getLocalFallbackQuestionBank } from "@/lib/data/questionBank";
import {
  getLessonArcTitle,
  getSeededLessonQuestions,
  pickQuestionsForLesson,
  resolveNodeDescriptor,
} from "@/lib/lessonArc/catalog";
import { getLegacyFallbackQuestions } from "@/lib/lessonArc/legacyFallback";
import type { LessonArcLessonIndex, LessonArcPayload, LessonArcQuestion } from "@/lib/lessonArc/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

type RemoteQuestionRow = {
  id: string;
  language: string;
  concept_slug: string;
  type: LessonArcQuestion["type"];
  concept: string;
  difficulty: number;
  prompt: string;
  code: string | null;
  options: string[] | null;
  correct_index: number | null;
  correct_answer: string | null;
  correct_blanks?: string[] | null;
  pairs: { left: string; right: string }[] | null;
  tokens: string[] | null;
  correct_tokens: string[] | null;
  lines: string[] | null;
  correct_order: number[] | null;
  bug_line: number | null;
  test_cases: { input: string; expected: string }[] | null;
  explanation: string;
  hint: string | null;
  xp_bonus: number | null;
};

function clampLessonIndex(value: unknown): LessonArcLessonIndex {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (numeric === 1) return 1;
  if (numeric === 2) return 2;
  if (numeric === 3) return 3;
  return 4;
}

function mapRemoteRows(rows: RemoteQuestionRow[]): LessonArcQuestion[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    concept: row.concept,
    difficulty: Math.min(5, Math.max(1, row.difficulty)) as LessonArcQuestion["difficulty"],
    prompt: row.prompt,
    code: row.code ?? undefined,
    options: row.options ?? undefined,
    correctIndex: typeof row.correct_index === "number" ? row.correct_index : undefined,
    correctAnswer: row.correct_answer ?? undefined,
    correctBlanks: row.correct_blanks ?? undefined,
    pairs: row.pairs ?? undefined,
    tokens: row.tokens ?? undefined,
    correctTokens: row.correct_tokens ?? undefined,
    lines: row.lines ?? undefined,
    correctOrder: row.correct_order ?? undefined,
    bugLine: typeof row.bug_line === "number" ? row.bug_line : undefined,
    testCases: row.test_cases ?? undefined,
    explanation: row.explanation,
    hint: row.hint ?? undefined,
    xpBonus: typeof row.xp_bonus === "number" ? row.xp_bonus : undefined,
  }));
}

async function readRemoteQuestionBank(language: string, conceptSlug: string, lessonIndex: LessonArcLessonIndex) {
  if (!supabase) return null;

  console.log("[lesson-arc] querying remote question bank", {
    source: "supabase",
    language,
    concept: conceptSlug,
    difficulty: lessonIndex + 1,
  });

  const { data, error } = await supabase
    .from("pico_questions")
    .select("*")
    .eq("language", language)
    .eq("concept_slug", conceptSlug);

  if (error) {
    console.warn("[lesson-arc] remote question query failed", {
      source: "supabase",
      language,
      concept: conceptSlug,
      difficulty: lessonIndex + 1,
      error: error.message,
    });
    return null;
  }

  const mapped = mapRemoteRows((data ?? []) as RemoteQuestionRow[]);
  console.log("[lesson-arc] remote question query result", {
    source: "supabase",
    language,
    concept: conceptSlug,
    difficulty: lessonIndex + 1,
    resultCount: mapped.length,
    results: mapped,
  });
  if (mapped.length === 0) return null;

  try {
    return pickQuestionsForLesson(mapped, lessonIndex, `${conceptSlug}:${lessonIndex}:remote`);
  } catch {
    return null;
  }
}

function readLocalArcQuestionBank(node: ReturnType<typeof resolveNodeDescriptor>, lessonIndex: LessonArcLessonIndex) {
  const localFallback = getLocalFallbackQuestionBank(node.concept);
  const seeded = getSeededLessonQuestions(node, lessonIndex);
  const bank = [...localFallback, ...(seeded ?? [])].filter(
    (question, index, questions) => questions.findIndex((entry) => entry.id === question.id) === index,
  );

  console.log("[lesson-arc] local arc question query result", {
    source: "local-arc-bank",
    concept: node.concept,
    difficulty: lessonIndex + 1,
    resultCount: bank.length,
    results: bank,
  });

  if (bank.length === 0) return null;

  try {
    return pickQuestionsForLesson(bank, lessonIndex, `${node.concept}:${lessonIndex}:local-arc-bank`);
  } catch {
    return null;
  }
}

function buildPayload(params: {
  node: ReturnType<typeof resolveNodeDescriptor>;
  lessonIndex: LessonArcLessonIndex;
  questions: LessonArcQuestion[];
  source: "supabase" | "local-arc-bank" | "legacy-fallback";
}): LessonArcPayload {
  const { node, lessonIndex, questions, source } = params;
  const title = getLessonArcTitle(node, lessonIndex);
  return {
    node,
    lessonIndex,
    title: title.title,
    subtitle: title.subtitle,
    questions,
    source,
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const unitId = String(body?.unitId ?? "");
  const lessonId = String(body?.lessonId ?? "");
  const node = resolveNodeDescriptor(body?.language, unitId, lessonId);
  const lessonIndex = clampLessonIndex(body?.lessonIndex ?? 0);

  const remote = await readRemoteQuestionBank(node.language, node.conceptSlug, lessonIndex);
  if (remote) {
    return Response.json(buildPayload({ node, lessonIndex, questions: remote, source: "supabase" }));
  }

  const localFallback = readLocalArcQuestionBank(node, lessonIndex);
  if (localFallback) {
    console.warn("[lesson-arc] using local arc question bank", {
      source: "local-arc-bank",
      concept: node.concept,
      difficulty: lessonIndex + 1,
    });
    return Response.json(buildPayload({ node, lessonIndex, questions: localFallback, source: "local-arc-bank" }));
  }

  const legacyFallback = getLegacyFallbackQuestions(node, lessonIndex);
  if (legacyFallback) {
    console.warn("[lesson-arc] using legacy lesson fallback", {
      source: "legacy-fallback",
      concept: node.concept,
      difficulty: lessonIndex + 1,
    });
    return Response.json(buildPayload({ node, lessonIndex, questions: legacyFallback, source: "legacy-fallback" }));
  }

  console.error("[lesson-arc] no questions available after remote and local fallback checks", {
    concept: node.concept,
    conceptSlug: node.conceptSlug,
    difficulty: lessonIndex + 1,
    unitId,
    lessonId,
  });
  return Response.json(
    {
      error: "No questions available for this lesson yet.",
      node,
      lessonIndex,
    },
    { status: 404 },
  );
}
