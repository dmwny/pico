import type { Question } from "@/lib/data/questions/types";
import type { ExplainCard, LessonContent, MiniProjectCard } from "@/lib/robloxCourse/types";

type ExplainSeed = Omit<ExplainCard, "id" | "type" | "concept" | "language">;
type MiniProjectSeed = Omit<MiniProjectCard, "id" | "type" | "concept">;

function uniqueById(questions: Question[]) {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function takeFirstByType(questions: Question[], type: Question["type"], used: Set<string>) {
  const match = questions.find((question) => question.type === type && !used.has(question.id));
  if (match) used.add(match.id);
  return match ?? null;
}

function takeFirstAny(questions: Question[], used: Set<string>) {
  const match = questions.find((question) => !used.has(question.id));
  if (match) used.add(match.id);
  return match ?? null;
}

function desiredTypePlan(nodeType: "teaching" | "practice") {
  if (nodeType === "practice") {
    return [
      "mc_output",
      "fill_type",
      "spot_bug",
      "predict_type",
      "fill_select",
      "word_bank",
      "mc_output",
      "fill_type",
      "true_false",
      "arrange",
      "mc_concept",
      "spot_bug",
      "predict_type",
      "mc_output",
      "mc_concept",
    ] as const;
  }

  return [
    "mc_concept",
    "true_false",
    "fill_type",
    "mc_output",
    "mc_concept",
    "fill_select",
    "predict_type",
    "spot_bug",
    "arrange",
    "word_bank",
    "mc_concept",
    "true_false",
    "fill_type",
    "mc_output",
    "mc_concept",
  ] as const;
}

export function selectRobloxLessonQuestions(
  sourceQuestions: Question[],
  nodeType: "teaching" | "practice",
  count = 15,
) {
  const byDifficulty = uniqueById(
    sourceQuestions.filter((question) =>
      nodeType === "teaching"
        ? question.difficulty <= 2
        : question.difficulty >= 2,
    ),
  );
  const candidates = byDifficulty.length > 0 ? byDifficulty : uniqueById(sourceQuestions);
  const used = new Set<string>();
  const selected: Question[] = [];

  for (const type of desiredTypePlan(nodeType)) {
    if (selected.length >= count) break;
    const match = takeFirstByType(candidates, type, used);
    if (match) selected.push(match);
  }

  while (selected.length < count) {
    const fallback = takeFirstAny(candidates, used);
    if (!fallback) break;
    selected.push(fallback);
  }

  return selected.slice(0, count);
}

function buildExplainCards(concept: string, cards: ExplainSeed[]) {
  return cards.map<ExplainCard>((card, index) => ({
    ...card,
    id: `roblox-${concept}-explain-${index + 1}`,
    type: "explain",
    concept,
    language: "lua",
  }));
}

function evenSlices(totalQuestions: number, cardCount: number) {
  if (cardCount <= 0) return [totalQuestions];
  const base = Math.floor(totalQuestions / cardCount);
  const remainder = totalQuestions % cardCount;
  return Array.from({ length: cardCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function buildTeachingLessonContent(params: {
  concept: string;
  cards: ExplainSeed[];
  questions: Question[];
}) {
  const { concept, cards, questions } = params;
  const explainCards = buildExplainCards(concept, cards);
  const slices = evenSlices(questions.length, explainCards.length);
  const content: LessonContent[] = [];
  let questionIndex = 0;

  explainCards.forEach((card, cardIndex) => {
    content.push(card);
    const take = slices[cardIndex] ?? 0;
    for (let index = 0; index < take; index += 1) {
      const question = questions[questionIndex++];
      if (question) content.push(question);
    }
  });

  while (questionIndex < questions.length) {
    content.push(questions[questionIndex++]);
  }

  return content;
}

export function buildPracticeLessonContent(params: {
  concept: string;
  cards: ExplainSeed[];
  questions: Question[];
  miniProject: MiniProjectSeed;
}) {
  const { concept, cards, questions, miniProject } = params;
  const content = buildTeachingLessonContent({ concept, cards, questions });
  content.push({
    ...miniProject,
    id: `roblox-${concept}-project-1`,
    type: "mini_project",
    concept,
  });
  return content;
}
