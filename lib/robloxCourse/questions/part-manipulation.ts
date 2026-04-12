import type { Question } from "@/lib/data/questions/types";
import { buildStudioConceptQuestions } from "@/lib/robloxCourse/builders";
import { partManipulationSpec } from "@/lib/robloxCourse/specs";

export const partManipulationQuestions: Question[] = buildStudioConceptQuestions(partManipulationSpec);
