import type { Question } from "@/lib/data/questions/types";

export type ExplainCard = {
  id: string;
  type: "explain";
  concept: string;
  language: "lua";
  title: string;
  body: string;
  docUrl: string;
  code?: string;
  position: "start" | "mid";
  lessonIndex: number;
};

export type MiniProjectCard = {
  id: string;
  type: "mini_project";
  concept: string;
  title: string;
  description: string;
  hint: string;
  docUrl: string;
};

export type CapstoneCard = {
  id: string;
  type: "capstone_project";
  phase: "concept" | "build" | "script" | "players" | "polish" | "ui" | "data" | "publish";
  title: string;
  description: string;
  tools: string[];
  docUrl: string;
};

export type LessonContent = ExplainCard | MiniProjectCard | Question;

export function isQuestionContent(item: LessonContent): item is Question {
  return item.type !== "explain" && item.type !== "mini_project";
}
