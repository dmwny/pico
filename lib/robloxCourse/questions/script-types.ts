import type { Question } from "@/lib/data/questions/types";
import { buildRobloxCodeConceptQuestions } from "@/lib/robloxCourse/builders";
import { scriptTypesSpec } from "@/lib/robloxCourse/specs";

export const scriptTypesQuestions: Question[] = buildRobloxCodeConceptQuestions(scriptTypesSpec);
