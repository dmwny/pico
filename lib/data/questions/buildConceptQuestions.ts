import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "./types";
import { buildConditionalsQuestions } from "./builders/conditionals";
import { buildConversionQuestions } from "./builders/conversions";
import { buildForLoopsQuestions } from "./builders/forLoops";
import { buildFunctionsQuestions } from "./builders/functions";
import { buildLuaTablesQuestions } from "./builders/luaTables";
import { buildMapsQuestions } from "./builders/maps";
import { buildOutputQuestions } from "./builders/output";
import { buildOwnershipQuestions } from "./builders/ownership";
import { buildCommentsQuestions, buildUserInputQuestions } from "./builders/pythonSpecial";
import { buildSequenceQuestions } from "./builders/sequences";
import { buildStringMethodsQuestions } from "./builders/stringMethods";
import { buildTypeAnnotationsQuestions } from "./builders/typeAnnotations";
import { buildVariablesQuestions } from "./builders/variables";
import { buildWhileLoopsQuestions } from "./builders/whileLoops";

export function buildConceptQuestions(language: LearningLanguage, concept: string): Question[] {
  if (concept === "print-statements" || concept === "console-log") {
    return buildOutputQuestions(language, concept);
  }
  if (concept === "variables") {
    return buildVariablesQuestions(language, concept);
  }
  if (concept === "conditionals") {
    return buildConditionalsQuestions(language, concept);
  }
  if (concept === "for-loops") {
    return buildForLoopsQuestions(language, concept);
  }
  if (concept === "while-loops") {
    return buildWhileLoopsQuestions(language, concept);
  }
  if (concept === "functions") {
    return buildFunctionsQuestions(language, concept);
  }
  if (concept === "lists" || concept === "arrays") {
    return buildSequenceQuestions(language, concept);
  }
  if (concept === "dictionaries" || concept === "objects") {
    return buildMapsQuestions(language, concept);
  }
  if (concept === "string-methods") {
    return buildStringMethodsQuestions(language, concept);
  }
  if (language === "python" && concept === "user-input") {
    return buildUserInputQuestions(concept);
  }
  if (language === "python" && concept === "comments") {
    return buildCommentsQuestions(concept);
  }
  if ((language === "python" && concept === "type-conversion") || (language === "csharp" && concept === "type-conversion") || (language === "java" && concept === "type-casting")) {
    return buildConversionQuestions(language, concept);
  }
  if (language === "typescript" && concept === "type-annotations") {
    return buildTypeAnnotationsQuestions(concept);
  }
  if (language === "rust" && concept === "ownership") {
    return buildOwnershipQuestions(concept);
  }
  if (language === "lua" && concept === "tables") {
    return buildLuaTablesQuestions(concept);
  }

  throw new Error(`Unsupported question concept: ${language}/${concept}`);
}
