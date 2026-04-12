import type { Question } from "@/lib/data/questions/types";
import { buildRobloxCodeConceptQuestions } from "@/lib/robloxCourse/builders";
import { instanceNewSpec } from "@/lib/robloxCourse/specs";

export const instanceNewQuestions: Question[] = buildRobloxCodeConceptQuestions(instanceNewSpec);
