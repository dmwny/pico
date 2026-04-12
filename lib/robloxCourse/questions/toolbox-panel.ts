import type { Question } from "@/lib/data/questions/types";
import { buildStudioConceptQuestions } from "@/lib/robloxCourse/builders";
import { toolboxPanelSpec } from "@/lib/robloxCourse/specs";

export const toolboxPanelQuestions: Question[] = buildStudioConceptQuestions(toolboxPanelSpec);
