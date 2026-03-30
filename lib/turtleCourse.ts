export type TurtleCourseLesson = {
  unitId: number;
  lessonId: number;
  title: string;
  subtitle: string;
  prompt: string;
  note: string;
  codeLines: string[];
  tiles: string[];
  answer: string[];
  previewDefaults: string[];
};

export type TurtleCourseUnit = {
  id: number;
  title: string;
  description: string;
  lessons: TurtleCourseLesson[];
};

const TURTLE_UNITS: TurtleCourseUnit[] = [
  {
    id: 1,
    title: "First Shapes",
    description: "Move forward, turn, and close a square.",
    lessons: [
      {
        unitId: 1,
        lessonId: 1,
        title: "Move Forward",
        subtitle: "Run the first line",
        prompt: "Fill the blanks so the turtle moves forward 90 units.",
        note: "Pick the forward command and the 90 distance.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "pen.___(___)",
        ],
        tiles: ["forward", "120", "left", "90"],
        answer: ["forward", "90"],
        previewDefaults: ["forward", "40"],
      },
      {
        unitId: 1,
        lessonId: 2,
        title: "Turn Left",
        subtitle: "Make a corner",
        prompt: "Fill the blanks to turn left 90 degrees and draw a corner.",
        note: "Select `left` and `90`.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "pen.forward(90)",
          "pen.___(___)",
          "pen.forward(90)",
        ],
        tiles: ["left", "90", "right", "45"],
        answer: ["left", "90"],
        previewDefaults: ["left", "0"],
      },
      {
        unitId: 1,
        lessonId: 3,
        title: "Loop a Square",
        subtitle: "Repeat four sides",
        prompt: "Fill the blanks to loop 4 times and turn left 90 degrees for a square.",
        note: "Select `4` and `90`.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "for _ in range(___):",
          "    pen.forward(80)",
          "    pen.left(___)",
        ],
        tiles: ["4", "90", "3", "60"],
        answer: ["4", "90"],
        previewDefaults: ["1", "0"],
      },
    ],
  },
  {
    id: 2,
    title: "Position and Pattern",
    description: "Set color, jump position, and build a star.",
    lessons: [
      {
        unitId: 2,
        lessonId: 1,
        title: "Set Color",
        subtitle: "Change the stroke",
        prompt: "Fill the blank so the turtle uses the color coral.",
        note: "Select `coral`.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "pen.color(\"___\")",
          "pen.forward(110)",
        ],
        tiles: ["coral", "navy", "gold"],
        answer: ["coral"],
        previewDefaults: ["teal"],
      },
      {
        unitId: 2,
        lessonId: 2,
        title: "Jump with Goto",
        subtitle: "Move without drawing",
        prompt: "Fill the blanks so the turtle jumps to x = -80 and y = 60, then draws a dot.",
        note: "Select `-80` first and `60` second.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "pen.penup()",
          "pen.goto(___, ___)",
          "pen.pendown()",
          "pen.dot(24)",
        ],
        tiles: ["-80", "60", "90", "-40"],
        answer: ["-80", "60"],
        previewDefaults: ["0", "0"],
      },
      {
        unitId: 2,
        lessonId: 3,
        title: "Loop a Star",
        subtitle: "Build a pattern",
        prompt: "Fill the blanks to loop 5 times and turn right 144 degrees for a five-point star.",
        note: "Select `5` and `144`.",
        codeLines: [
          "import turtle",
          "pen = turtle.Turtle()",
          "for _ in range(___):",
          "    pen.forward(130)",
          "    pen.right(___)",
        ],
        tiles: ["5", "144", "6", "90"],
        answer: ["5", "144"],
        previewDefaults: ["1", "0"],
      },
    ],
  },
];

export function getTurtleUnits() {
  return TURTLE_UNITS;
}

export function getTurtleLessons() {
  return TURTLE_UNITS.flatMap((unit) => unit.lessons);
}

export function getTurtleLesson(unitId: string | number, lessonId: string | number) {
  const unit = TURTLE_UNITS.find((item) => item.id === Number(unitId));
  return unit?.lessons.find((lesson) => lesson.lessonId === Number(lessonId)) ?? null;
}

export function getTurtleLessonKey(unitId: string | number, lessonId: string | number) {
  return `turtle:${Number(unitId)}-${Number(lessonId)}`;
}

export function isTurtleLessonKey(value: string) {
  return /^turtle:\d+-\d+$/.test(value);
}

export function getCompletedTurtleKeys(completedLessons: string[] = []) {
  return completedLessons.filter(isTurtleLessonKey);
}

export function isTurtleLessonUnlocked(completedLessons: string[] = [], unitId: number, lessonId: number) {
  if (unitId === 1 && lessonId === 1) return true;

  if (lessonId > 1) {
    return completedLessons.includes(getTurtleLessonKey(unitId, lessonId - 1));
  }

  const previousUnit = TURTLE_UNITS.find((unit) => unit.id === unitId - 1);
  if (!previousUnit) return false;

  return previousUnit.lessons.every((lesson) =>
    completedLessons.includes(getTurtleLessonKey(lesson.unitId, lesson.lessonId))
  );
}

export function fillTurtleCode(
  codeLines: string[],
  values: string[],
  fallbacks: string[] = []
) {
  let blankIndex = 0;

  return codeLines.map((line) =>
    line.replace(/_{3}/g, () => {
      const value = values[blankIndex] || fallbacks[blankIndex] || "0";
      blankIndex += 1;
      return value;
    })
  );
}
