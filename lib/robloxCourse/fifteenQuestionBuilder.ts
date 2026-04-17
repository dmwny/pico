import type { Question } from "@/lib/data/questions/types";

type DefinitionQuestion = {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
};

type TruthQuestion = {
  prompt: string;
  correct: boolean;
  explanation: string;
  code?: string;
  difficulty: 1 | 2 | 3;
};

type ExampleQuestion = {
  mcOutputPrompt: string;
  code: string;
  mcOutputOptions: [string, string, string, string];
  mcOutputCorrectIndex: number;
  mcOutputExplanation: string;
  fillTypePrompt: string;
  fillTypeCode: string;
  fillTypeAnswer: string;
  fillTypeExplanation: string;
  predictPrompt: string;
  predictCode?: string;
  predictAnswer: string;
  predictExplanation: string;
  difficulty: 1 | 2 | 3;
};

type ArrangeQuestion = {
  prompt: string;
  lines: string[];
  correctOrder: number[];
  explanation: string;
  difficulty: 1 | 2 | 3;
};

type SpotBugQuestion = {
  prompt: string;
  versionA: string;
  versionB: string;
  buggyVersion: "A" | "B";
  explanation: string;
  difficulty: 1 | 2 | 3;
};

export type FifteenQuestionConceptSpec = {
  concept: string;
  definitions: [DefinitionQuestion, DefinitionQuestion, DefinitionQuestion];
  truths: [TruthQuestion, TruthQuestion];
  examples: [ExampleQuestion, ExampleQuestion, ExampleQuestion];
  arrange: ArrangeQuestion;
  spotBug: SpotBugQuestion;
};

const TYPE_ABBREVIATIONS: Partial<Record<Question["type"], string>> = {
  mc_concept: "mc",
  mc_output: "mco",
  true_false: "tf",
  fill_type: "ft",
  fill_select: "fs",
  word_bank: "wb",
  arrange: "arr",
  spot_bug: "sb",
  predict_type: "pt",
  match_pairs: "mp",
  complete_fn: "cf",
  debug: "db",
};

function getTypeAbbreviation(type: Question["type"]) {
  return TYPE_ABBREVIATIONS[type] ?? (type.replace(/[^a-z]/g, "").slice(0, 3) || "q");
}

export function buildFifteenQuestionConcept(spec: FifteenQuestionConceptSpec): Question[] {
  const counters: Record<string, number> = {};
  const push = (question: Omit<Question, "id" | "concept" | "language">) => {
    const abbr = getTypeAbbreviation(question.type);
    counters[abbr] = (counters[abbr] ?? 0) + 1;
    questions.push({
      ...question,
      id: `roblox-${spec.concept}-${abbr}-${counters[abbr]}`,
      concept: spec.concept,
      language: "lua",
    });
  };

  const questions: Question[] = [];

  spec.definitions.forEach((definition) => {
    push({
      type: "mc_concept",
      prompt: definition.prompt,
      options: definition.options,
      correctIndex: definition.correctIndex,
      explanation: definition.explanation,
      difficulty: definition.difficulty,
    });
  });

  const selectedTruth = spec.truths.find((truth) => truth.code) ?? spec.truths[0];
  if (selectedTruth) {
    push({
      type: "true_false",
      prompt: selectedTruth.prompt,
      code: selectedTruth.code,
      options: ["True", "False"],
      correctIndex: selectedTruth.correct ? 0 : 1,
      correctAnswer: selectedTruth.correct ? "True" : "False",
      explanation: selectedTruth.explanation,
      difficulty: selectedTruth.difficulty,
    });
  }

  spec.examples.forEach((example) => {
    push({
      type: "mc_output",
      prompt: example.mcOutputPrompt,
      code: example.code,
      options: example.mcOutputOptions,
      correctIndex: example.mcOutputCorrectIndex,
      explanation: example.mcOutputExplanation,
      difficulty: example.difficulty,
    });
    push({
      type: "fill_type",
      prompt: example.fillTypePrompt,
      code: example.fillTypeCode,
      correctAnswer: example.fillTypeAnswer,
      explanation: example.fillTypeExplanation,
      difficulty: example.difficulty,
    });
    push({
      type: "predict_type",
      prompt: example.predictPrompt,
      code: example.predictCode ?? example.code,
      correctAnswer: example.predictAnswer,
      explanation: example.predictExplanation,
      difficulty: example.difficulty,
    });
  });

  push({
    type: "arrange",
    prompt: spec.arrange.prompt,
    lines: spec.arrange.lines,
    correctOrder: spec.arrange.correctOrder,
    explanation: spec.arrange.explanation,
    difficulty: spec.arrange.difficulty,
  });

  push({
    type: "spot_bug",
    prompt: spec.spotBug.prompt,
    code: `### Version A\n${spec.spotBug.versionA}\n### Version B\n${spec.spotBug.versionB}`,
    options: ["Version A", "Version B"],
    correctIndex: spec.spotBug.buggyVersion === "A" ? 0 : 1,
    explanation: spec.spotBug.explanation,
    difficulty: spec.spotBug.difficulty,
  });

  if (questions.length !== 15) {
    throw new Error(`Expected 15 questions for ${spec.concept}, received ${questions.length}`);
  }

  return questions;
}
