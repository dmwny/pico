import type { Question } from "@/lib/data/questions/types";
import { buildStudioConceptQuestions } from "@/lib/robloxCourse/builders";
import { playtestPublishingSpec } from "@/lib/robloxCourse/specs";

export const playtestPublishingQuestions: Question[] = buildStudioConceptQuestions(playtestPublishingSpec);
