import type { Question } from "@/lib/data/questions/types";
import { buildRobloxCodeConceptQuestions } from "@/lib/robloxCourse/builders";
import { workspaceServiceSpec } from "@/lib/robloxCourse/specs";

export const workspaceServiceQuestions: Question[] = buildRobloxCodeConceptQuestions(workspaceServiceSpec);
