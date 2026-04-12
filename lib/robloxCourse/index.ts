import type { Question } from "@/lib/data/questions/types";
import type { LessonContent } from "@/lib/robloxCourse/types";
import { robloxCapstone } from "@/lib/robloxCourse/capstone";
import { robloxContentBank } from "@/lib/robloxCourse/contentBank";
import { robloxCourse } from "@/lib/robloxCourse/courseStructure";
import { robloxQuestionBank } from "@/lib/robloxCourse/questions";
import { isQuestionContent } from "@/lib/robloxCourse/types";

export { robloxCourse, robloxQuestionBank, robloxContentBank, robloxCapstone };

export function getRobloxCourseUnit(unitNumber: number) {
  return robloxCourse.units[unitNumber - 1] ?? null;
}

export function getRobloxCourseNode(unitNumber: number, lessonNumber: number) {
  const unit = getRobloxCourseUnit(unitNumber);
  const node = unit?.nodes[lessonNumber - 1] ?? null;
  if (!unit || !node) return null;
  return {
    unit,
    node,
    unitNumber,
    lessonNumber,
    content: getRobloxCourseContent(node.concept),
    questions: robloxQuestionBank[node.concept] ?? [],
  };
}

export function getRobloxCourseQuestions(concept: string): Question[] {
  return robloxQuestionBank[concept] ?? [];
}

export function getRobloxCourseContent(concept: string): LessonContent[] {
  const content = robloxContentBank[concept];
  if (content?.length) return content;
  return robloxQuestionBank[concept] ?? [];
}

export function getRobloxCourseQuestionCount(concept: string) {
  return getRobloxCourseContent(concept).filter(isQuestionContent).length;
}

export function getRobloxCourseKey(unitNumber: number, lessonNumber: number) {
  return `mini:lua:roblox-studio:${unitNumber}-${lessonNumber}`;
}

export function isRobloxCourseKey(value: string) {
  return value.startsWith("mini:lua:roblox-studio:");
}

export function getCompletedRobloxCourseKeys(completedLessons: string[] = []) {
  return completedLessons.filter((value) => isRobloxCourseKey(value));
}

export function isRobloxCourseNodeUnlocked(completedLessons: string[], unitNumber: number, lessonNumber: number) {
  if (unitNumber === 1 && lessonNumber === 1) return true;
  if (lessonNumber > 1) {
    return completedLessons.includes(getRobloxCourseKey(unitNumber, lessonNumber - 1));
  }

  const previousUnit = getRobloxCourseUnit(unitNumber - 1);
  if (!previousUnit) return false;

  return previousUnit.nodes.every((_, index) =>
    completedLessons.includes(getRobloxCourseKey(unitNumber - 1, index + 1)),
  );
}

export function getAllRobloxCourseLessons() {
  return robloxCourse.units.flatMap((unit, unitIndex) =>
    unit.nodes.map((node, nodeIndex) => ({
      unit,
      node,
      unitNumber: unitIndex + 1,
      lessonNumber: nodeIndex + 1,
    })),
  );
}
