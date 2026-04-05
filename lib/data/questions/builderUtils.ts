import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "./types";

const LANGUAGE_PREFIX: Record<LearningLanguage, string> = {
  python: "py",
  javascript: "js",
  typescript: "ts",
  java: "java",
  csharp: "cs",
  rust: "rs",
  lua: "lua",
};

const TYPE_ABBREVIATIONS = {
  mc_concept: "mc1",
  mc_output: "mco",
  true_false: "tf",
  fill_type: "ft",
  fill_select: "fs",
  word_bank: "wb",
  match_pairs: "mp",
} as const;

type SupportedQuestionType = keyof typeof TYPE_ABBREVIATIONS;

type QuestionSeed = Omit<Question, "id" | "language" | "concept">;

type QuestionFactory = {
  push: (seed: QuestionSeed) => void;
  done: () => Question[];
};

export function createQuestionFactory(language: LearningLanguage, concept: string): QuestionFactory {
  const prefix = LANGUAGE_PREFIX[language];
  const counters: Record<string, number> = {};
  const questions: Question[] = [];

  return {
    push(seed) {
      const abbreviation = TYPE_ABBREVIATIONS[seed.type as SupportedQuestionType];
      counters[abbreviation] = (counters[abbreviation] ?? 0) + 1;
      questions.push({
        ...seed,
        id: `${prefix}-${concept}-${abbreviation}-${counters[abbreviation]}`,
        language,
        concept,
      });
    },
    done() {
      return questions;
    },
  };
}

export function tfQuestion(seed: Omit<QuestionSeed, "type" | "options" | "correctIndex"> & { correct: boolean }): QuestionSeed {
  return {
    ...seed,
    type: "true_false",
    options: ["True", "False"],
    correctIndex: seed.correct ? 0 : 1,
    correctAnswer: seed.correct ? "true" : "false",
  };
}

export function joinTokens(tokens: string[]) {
  return tokens.join(" ");
}

function indentBlock(value: string, spaces: number) {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
}

export function wrapRunnableCode(language: LearningLanguage, body: string) {
  if (language === "java") {
    return `public class Main {\n  public static void main(String[] args) {\n${indentBlock(body, 4)}\n  }\n}`;
  }
  if (language === "rust") {
    return `fn main() {\n${indentBlock(body, 4)}\n}`;
  }
  return body;
}

export function ensureQuestionCount(questions: Question[], language: LearningLanguage, concept: string) {
  if (questions.length !== 33) {
    throw new Error(`Expected 33 questions for ${language}/${concept}, received ${questions.length}`);
  }
  return questions;
}
