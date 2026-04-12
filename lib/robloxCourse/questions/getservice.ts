import type { Question } from "@/lib/data/questions/types";
import { buildRobloxCodeConceptQuestions } from "@/lib/robloxCourse/builders";
import { getServiceSpec } from "@/lib/robloxCourse/specs";

export const getServiceQuestions: Question[] = buildRobloxCodeConceptQuestions(getServiceSpec);
