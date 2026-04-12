import type { Question } from "@/lib/data/questions/types";

type RobloxQuestionType = Question["type"];
type RobloxNodeType = "teaching" | "practice";

type StudioScenario = {
  action: string;
  distractors: [string, string, string];
  explanation: string;
  alternateAction?: string;
};

type StudioTruth = {
  truth: string;
  lie: string;
  explanation: string;
};

export type StudioConceptSpec = {
  concept: string;
  title: string;
  nodeType: RobloxNodeType;
  definition: string;
  definitionDistractors: [string, string, string];
  scenarios: [
    StudioScenario,
    StudioScenario,
    StudioScenario,
    StudioScenario,
    StudioScenario,
    StudioScenario,
    StudioScenario,
    StudioScenario,
  ];
  truths: [
    StudioTruth,
    StudioTruth,
    StudioTruth,
    StudioTruth,
    StudioTruth,
    StudioTruth,
    StudioTruth,
    StudioTruth,
  ];
};

type CodeDefinition = {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

type CodeTruth = {
  prompt: string;
  correct: boolean;
  explanation: string;
  code?: string;
};

type CodeExample = {
  mcOutputPrompt: string;
  mcOutputCode: string;
  mcOutputOptions: [string, string, string, string];
  mcOutputCorrectIndex: number;
  mcOutputExplanation: string;
  fillTypePrompt: string;
  fillTypeCode: string;
  fillTypeAnswer: string;
  fillTypeExplanation: string;
  fillTypeHint?: string;
  fillSelectPrompt: string;
  fillSelectCode: string;
  fillSelectTokens: string[];
  fillSelectAnswer: string[];
  fillSelectExplanation: string;
  fillSelectHint?: string;
  wordBankPrompt: string;
  wordBankTokens: string[];
  wordBankAnswer: string[];
  wordBankExplanation: string;
  predictPrompt: string;
  predictCode: string;
  predictAnswer: string;
  predictExplanation: string;
  predictHint?: string;
};

type ArrangeExample = {
  prompt: string;
  lines: string[];
  correctOrder: number[];
  explanation: string;
};

type SpotBugExample = {
  prompt: string;
  versionA: string;
  versionB: string;
  buggyVersion: "A" | "B";
  explanation: string;
};

export type RobloxCodeConceptSpec = {
  concept: string;
  title: string;
  nodeType: RobloxNodeType;
  definitions: [CodeDefinition, CodeDefinition, CodeDefinition, CodeDefinition];
  truths: [CodeTruth, CodeTruth, CodeTruth, CodeTruth];
  examples: [CodeExample, CodeExample, CodeExample, CodeExample];
  arrange: [ArrangeExample, ArrangeExample, ArrangeExample];
  bugs: [SpotBugExample, SpotBugExample, SpotBugExample];
};

const TYPE_ABBREVIATIONS: Record<RobloxQuestionType, string> = {
  mc_concept: "mc1",
  mc_output: "mco",
  true_false: "tf",
  fill_type: "ft",
  fill_select: "fs",
  word_bank: "wb",
  arrange: "ar",
  spot_bug: "sb",
  predict_type: "pt",
  match_pairs: "mp",
  complete_fn: "cf",
  debug: "db",
};

type QuestionSeed = Omit<Question, "id" | "language" | "concept" | "difficulty"> & {
  difficulty?: 1 | 2 | 3;
};

function difficultyFor(nodeType: RobloxNodeType, index: number, total: number): 1 | 2 | 3 {
  const cutoff = Math.ceil(total / 2);
  if (nodeType === "teaching") {
    return index < cutoff ? 1 : 2;
  }
  return index < cutoff ? 2 : 3;
}

function createRobloxQuestionFactory(concept: string, nodeType: RobloxNodeType, total: number) {
  const counters: Record<string, number> = {};
  const questions: Question[] = [];

  return {
    push(seed: QuestionSeed) {
      const abbreviation = TYPE_ABBREVIATIONS[seed.type];
      counters[abbreviation] = (counters[abbreviation] ?? 0) + 1;
      questions.push({
        ...seed,
        id: `roblox-${concept}-${abbreviation}-${counters[abbreviation]}`,
        concept,
        language: "lua",
        difficulty: seed.difficulty ?? difficultyFor(nodeType, questions.length, total),
      });
    },
    done() {
      if (questions.length !== total) {
        throw new Error(`Expected ${total} Roblox questions for ${concept}, received ${questions.length}`);
      }
      return questions;
    },
  };
}

function trueFalseSeed(seed: {
  prompt: string;
  explanation: string;
  correct: boolean;
  code?: string;
  difficulty?: 1 | 2 | 3;
  hint?: string;
}): QuestionSeed {
  return {
    type: "true_false",
    prompt: seed.prompt,
    explanation: seed.explanation,
    code: seed.code,
    options: ["True", "False"],
    correctIndex: seed.correct ? 0 : 1,
    correctAnswer: seed.correct ? "True" : "False",
    difficulty: seed.difficulty,
    hint: seed.hint,
  };
}

function studioMcPrompt(title: string, action: string, alternateAction?: string) {
  return [
    `Which Roblox Studio panel or area should you use to ${action}?`,
    `A builder wants to ${alternateAction ?? action}. Which Studio panel helps most?`,
  ] as const;
}

export function buildStudioConceptQuestions(spec: StudioConceptSpec): Question[] {
  const q = createRobloxQuestionFactory(spec.concept, spec.nodeType, 33);

  q.push({
    type: "mc_concept",
    prompt: `What is the main purpose of ${spec.title} in Roblox Studio?`,
    options: [spec.definition, ...spec.definitionDistractors],
    correctIndex: 0,
    explanation: spec.definition,
  });

  spec.scenarios.forEach((scenario) => {
    const prompts = studioMcPrompt(spec.title, scenario.action, scenario.alternateAction);
    prompts.forEach((prompt) => {
      q.push({
        type: "mc_concept",
        prompt,
        options: [spec.title, ...scenario.distractors],
        correctIndex: 0,
        explanation: scenario.explanation,
      });
    });
  });

  spec.truths.forEach((truth) => {
    q.push(trueFalseSeed({
      prompt: truth.truth,
      explanation: truth.explanation,
      correct: true,
    }));
    q.push(trueFalseSeed({
      prompt: truth.lie,
      explanation: truth.explanation,
      correct: false,
    }));
  });

  return q.done();
}

export function buildRobloxCodeConceptQuestions(spec: RobloxCodeConceptSpec): Question[] {
  const q = createRobloxQuestionFactory(spec.concept, spec.nodeType, 33);

  spec.definitions.forEach((definition) => {
    q.push({
      type: "mc_concept",
      prompt: definition.prompt,
      options: definition.options,
      correctIndex: definition.correctIndex,
      explanation: definition.explanation,
    });
  });

  spec.truths.forEach((truth) => {
    q.push(trueFalseSeed(truth));
  });

  spec.examples.forEach((example) => {
    q.push({
      type: "mc_output",
      prompt: example.mcOutputPrompt,
      code: example.mcOutputCode,
      options: example.mcOutputOptions,
      correctIndex: example.mcOutputCorrectIndex,
      explanation: example.mcOutputExplanation,
    });
    q.push({
      type: "fill_type",
      prompt: example.fillTypePrompt,
      code: example.fillTypeCode,
      correctAnswer: example.fillTypeAnswer,
      explanation: example.fillTypeExplanation,
      hint: example.fillTypeHint,
    });
    q.push({
      type: "fill_select",
      prompt: example.fillSelectPrompt,
      code: example.fillSelectCode,
      tokens: example.fillSelectTokens,
      correctTokens: example.fillSelectAnswer,
      correctBlanks: example.fillSelectAnswer,
      explanation: example.fillSelectExplanation,
      hint: example.fillSelectHint,
    });
    q.push({
      type: "word_bank",
      prompt: example.wordBankPrompt,
      tokens: example.wordBankTokens,
      correctTokens: example.wordBankAnswer,
      correctAnswer: example.wordBankAnswer.join(" "),
      explanation: example.wordBankExplanation,
    });
  });

  spec.examples.slice(0, 3).forEach((example) => {
    q.push({
      type: "predict_type",
      prompt: example.predictPrompt,
      code: example.predictCode,
      correctAnswer: example.predictAnswer,
      explanation: example.predictExplanation,
      hint: example.predictHint,
    });
  });

  spec.arrange.forEach((arrange) => {
    q.push({
      type: "arrange",
      prompt: arrange.prompt,
      lines: arrange.lines,
      correctOrder: arrange.correctOrder,
      explanation: arrange.explanation,
    });
  });

  spec.bugs.forEach((bug) => {
    q.push({
      type: "spot_bug",
      prompt: bug.prompt,
      code: `### Version A\n${bug.versionA}\n### Version B\n${bug.versionB}`,
      options: ["Version A", "Version B"],
      correctIndex: bug.buggyVersion === "A" ? 0 : 1,
      explanation: bug.explanation,
    });
  });

  return q.done();
}
