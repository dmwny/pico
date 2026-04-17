import {
  SUPPORTED_LANGUAGES,
  getCourseSections,
  getLanguageLabel,
  getMiniCourses,
  languageHasPlacement,
  type LearningLanguage,
  type LessonMeta,
  type UnitMeta,
} from "@/lib/courseContent";

export type LandingCourseSummary = {
  id: LearningLanguage;
  title: string;
  tag: string;
  lessonCount: number;
  unitCount: number;
  miniCourseCount: number;
  placement: boolean;
  firstUnitTitle: string;
  firstLessonTitle: string;
};

export type LandingBoardTile = {
  id: string;
  unitTitle: string;
  lessonTitle: string;
  state: "done" | "locked";
};

export type LandingBoardColumn = {
  id: string;
  unitTitle: string;
  lessons: LandingBoardTile[];
};

function flattenUnits(language: LearningLanguage) {
  return getCourseSections(language).flatMap((section) => section.units);
}

function countLessons(unit: UnitMeta) {
  return unit.lessons.length;
}

function getDisplayTag(language: LearningLanguage) {
  if (language === "lua") return "Lua · Roblox";
  if (language === "typescript") return "Typed JavaScript";
  return getLanguageLabel(language);
}

export function getLandingCourseSummaries(): LandingCourseSummary[] {
  return SUPPORTED_LANGUAGES.map((language) => {
    const units = flattenUnits(language);
    const lessons = units.flatMap((unit) => unit.lessons);
    const liveMiniCourses = getMiniCourses(language).filter((course) => course.status === "live");
    const firstLesson = lessons[0];

    return {
      id: language,
      title: getLanguageLabel(language),
      tag: getDisplayTag(language),
      lessonCount: lessons.length,
      unitCount: units.length,
      miniCourseCount: liveMiniCourses.length,
      placement: languageHasPlacement(language),
      firstUnitTitle: units[0]?.title ?? "Core Path",
      firstLessonTitle: firstLesson?.title ?? "Start here",
    };
  });
}

export function getLandingHeroLanguages() {
  return getLandingCourseSummaries().map((course) => course.title);
}

export function getFirstBoardColumns(language: LearningLanguage = "python", limit = 6): LandingBoardColumn[] {
  return flattenUnits(language).slice(0, limit).map((unit, unitIndex) => ({
    id: `${language}-${unit.id}`,
    unitTitle: unit.title,
    lessons: unit.lessons.slice(0, 6).map((lesson, lessonIndex) => ({
      id: `${language}-${unit.id}-${lesson.id}`,
      unitTitle: unit.title,
      lessonTitle: lesson.title,
      state: unitIndex === 0 && lessonIndex < 3 ? "done" : "locked",
    })),
  }));
}

export function getFirstBoardLessonTitles(language: LearningLanguage = "python", limit = 18): string[] {
  return getFirstBoardColumns(language, Math.ceil(limit / 6))
    .flatMap((column) => column.lessons)
    .slice(0, limit)
    .map((lesson) => lesson.lessonTitle);
}

export function getRealLessonCount(language: LearningLanguage = "python") {
  return flattenUnits(language).reduce((total, unit) => total + countLessons(unit), 0);
}

export function getRealLessonSamples(language: LearningLanguage = "python", limit = 6): LessonMeta[] {
  return flattenUnits(language)
    .flatMap((unit) => unit.lessons)
    .slice(0, limit);
}
