export type TurtleCourseQuestion = {
  id: number;
  prompt: string;
  note: string;
  codeLines: string[];
  tiles: string[];
  answer: string[];
  previewDefaults: string[];
};

export type TurtleCourseLesson = {
  unitId: number;
  lessonId: number;
  title: string;
  subtitle: string;
  questions: TurtleCourseQuestion[];
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
        questions: [
          {
            id: 1,
            prompt: "Fill the blanks so the turtle moves forward 90 units.",
            note: "Use the movement command, then use the distance from the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.___(___)"],
            tiles: ["forward", "120", "left", "90"],
            answer: ["forward", "90"],
            previewDefaults: ["forward", "40"],
          },
          {
            id: 2,
            prompt: "Fill the blank so the turtle moves forward 120 units.",
            note: "Use the larger distance tile.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(___)"],
            tiles: ["30", "60", "120"],
            answer: ["120"],
            previewDefaults: ["40"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the turtle uses the forward command.",
            note: "Pick the command that moves the turtle ahead.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.___(60)"],
            tiles: ["left", "backward", "forward"],
            answer: ["forward"],
            previewDefaults: ["forward"],
          },
          {
            id: 4,
            prompt: "Fill the blank so the second move adds 30 more units.",
            note: "Use the smaller distance from the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(40)", "pen.forward(___)"],
            tiles: ["30", "80", "120"],
            answer: ["30"],
            previewDefaults: ["10"],
          },
          {
            id: 5,
            prompt: "Fill the blank so the turtle takes one forward step of 75 units.",
            note: "Pick the one movement command in the tile list.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.___(75)"],
            tiles: ["right", "forward", "goto"],
            answer: ["forward"],
            previewDefaults: ["forward"],
          },
        ],
      },
      {
        unitId: 1,
        lessonId: 2,
        title: "Turn Left",
        subtitle: "Make a corner",
        questions: [
          {
            id: 1,
            prompt: "Fill the blanks to turn left 90 degrees and draw a corner.",
            note: "Turn in the direction named in the prompt, then use the corner angle.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(90)", "pen.___(___)", "pen.forward(90)"],
            tiles: ["left", "90", "right", "45"],
            answer: ["left", "90"],
            previewDefaults: ["left", "0"],
          },
          {
            id: 2,
            prompt: "Fill the blank so the turtle turns left 45 degrees.",
            note: "Use the smaller angle tile.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(90)", "pen.left(___)", "pen.forward(60)"],
            tiles: ["45", "90", "180"],
            answer: ["45"],
            previewDefaults: ["0"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the turtle uses left before the second line.",
            note: "Pick the turn method that matches the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(70)", "pen.___(120)", "pen.forward(50)"],
            tiles: ["left", "right", "forward"],
            answer: ["left"],
            previewDefaults: ["left"],
          },
          {
            id: 4,
            prompt: "Fill the blank so the turtle turns left 180 degrees.",
            note: "Use the largest turn angle in the tile list.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(80)", "pen.left(___)", "pen.forward(30)"],
            tiles: ["45", "90", "180"],
            answer: ["180"],
            previewDefaults: ["0"],
          },
          {
            id: 5,
            prompt: "Fill the blank so the turtle turns left instead of right.",
            note: "Pick the turn command named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.forward(50)", "pen.___(90)", "pen.forward(50)"],
            tiles: ["left", "right", "goto"],
            answer: ["left"],
            previewDefaults: ["left"],
          },
        ],
      },
      {
        unitId: 1,
        lessonId: 3,
        title: "Loop a Square",
        subtitle: "Repeat four sides",
        questions: [
          {
            id: 1,
            prompt: "Fill the blanks to loop 4 times and turn left 90 degrees for a square.",
            note: "Repeat once per side, then use the square turn angle.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(___):", "    pen.forward(80)", "    pen.left(___)"],
            tiles: ["4", "90", "3", "60"],
            answer: ["4", "90"],
            previewDefaults: ["1", "0"],
          },
          {
            id: 2,
            prompt: "Fill the blank so each side of the square is 60 units long.",
            note: "Use the side length named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(4):", "    pen.forward(___)", "    pen.left(90)"],
            tiles: ["60", "30", "90"],
            answer: ["60"],
            previewDefaults: ["20"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the loop repeats once for each side of the square.",
            note: "Pick the repeat count that matches a square.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(___):", "    pen.forward(70)", "    pen.left(90)"],
            tiles: ["3", "4", "5"],
            answer: ["4"],
            previewDefaults: ["1"],
          },
          {
            id: 4,
            prompt: "Fill the blank so each corner uses the square angle.",
            note: "Use the turn angle that makes square corners.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(4):", "    pen.forward(70)", "    pen.left(___)"],
            tiles: ["60", "90", "120"],
            answer: ["90"],
            previewDefaults: ["0"],
          },
          {
            id: 5,
            prompt: "Fill the blank so the loop turns left on every side.",
            note: "Pick the turn command that matches the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(4):", "    pen.forward(65)", "    pen.___(90)"],
            tiles: ["left", "right", "forward"],
            answer: ["left"],
            previewDefaults: ["left"],
          },
        ],
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
        questions: [
          {
            id: 1,
            prompt: "Fill the blank so the turtle uses the color coral.",
            note: "Pick the color named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", 'pen.color("___")', "pen.forward(110)"],
            tiles: ["coral", "navy", "gold"],
            answer: ["coral"],
            previewDefaults: ["teal"],
          },
          {
            id: 2,
            prompt: "Fill the blank so the turtle uses the color navy.",
            note: "Pick the darker blue color tile.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", 'pen.color("___")', "pen.forward(110)"],
            tiles: ["coral", "navy", "gold"],
            answer: ["navy"],
            previewDefaults: ["teal"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the turtle uses the color gold.",
            note: "Pick the warm yellow color tile.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", 'pen.color("___")', "pen.forward(110)"],
            tiles: ["gold", "navy", "purple"],
            answer: ["gold"],
            previewDefaults: ["teal"],
          },
          {
            id: 4,
            prompt: "Fill the blank so the turtle changes to coral before drawing twice.",
            note: "Use the color named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", 'pen.color("___")', "pen.forward(80)", "pen.left(90)", "pen.forward(60)"],
            tiles: ["coral", "navy", "silver"],
            answer: ["coral"],
            previewDefaults: ["teal"],
          },
          {
            id: 5,
            prompt: "Fill the blank so the turtle keeps the line navy during the turn.",
            note: "Pick the blue color named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", 'pen.color("___")', "pen.forward(80)", "pen.left(90)", "pen.forward(40)"],
            tiles: ["gold", "navy", "pink"],
            answer: ["navy"],
            previewDefaults: ["teal"],
          },
        ],
      },
      {
        unitId: 2,
        lessonId: 2,
        title: "Jump with Goto",
        subtitle: "Move without drawing",
        questions: [
          {
            id: 1,
            prompt: "Fill the blanks so the turtle jumps to x = -80 and y = 60, then draws a dot.",
            note: "Use the x position first and the y position second.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.penup()", "pen.goto(___, ___)", "pen.pendown()", "pen.dot(24)"],
            tiles: ["-80", "60", "90", "-40"],
            answer: ["-80", "60"],
            previewDefaults: ["0", "0"],
          },
          {
            id: 2,
            prompt: "Fill the blanks so the turtle jumps to x = 100 and y = -40.",
            note: "Use the positive x value first and the negative y value second.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.penup()", "pen.goto(___, ___)", "pen.pendown()", "pen.dot(24)"],
            tiles: ["100", "-40", "40", "-100"],
            answer: ["100", "-40"],
            previewDefaults: ["0", "0"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the turtle uses goto before drawing the dot.",
            note: "Pick the movement command that jumps to coordinates.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.penup()", "pen.___(20, 90)", "pen.pendown()", "pen.dot(24)"],
            tiles: ["forward", "goto", "left"],
            answer: ["goto"],
            previewDefaults: ["goto"],
          },
          {
            id: 4,
            prompt: "Fill the blanks so the turtle jumps to x = 0 and y = 120.",
            note: "Use the centered x value first and the higher y value second.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.penup()", "pen.goto(___, ___)", "pen.pendown()", "pen.dot(24)"],
            tiles: ["0", "120", "-120", "20"],
            answer: ["0", "120"],
            previewDefaults: ["0", "0"],
          },
          {
            id: 5,
            prompt: "Fill the blanks so the turtle jumps to x = -120 and y = -90.",
            note: "Use the negative x value first and the negative y value second.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "pen.penup()", "pen.goto(___, ___)", "pen.pendown()", "pen.dot(24)"],
            tiles: ["-120", "-90", "120", "90"],
            answer: ["-120", "-90"],
            previewDefaults: ["0", "0"],
          },
        ],
      },
      {
        unitId: 2,
        lessonId: 3,
        title: "Loop a Star",
        subtitle: "Build a pattern",
        questions: [
          {
            id: 1,
            prompt: "Fill the blanks to loop 5 times and turn right 144 degrees for a five-point star.",
            note: "Repeat once per star point, then use the star turn angle.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(___):", "    pen.forward(130)", "    pen.right(___)"],
            tiles: ["5", "144", "6", "90"],
            answer: ["5", "144"],
            previewDefaults: ["1", "0"],
          },
          {
            id: 2,
            prompt: "Fill the blank so each star line is 100 units long.",
            note: "Use the side length named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(5):", "    pen.forward(___)", "    pen.right(144)"],
            tiles: ["100", "60", "144"],
            answer: ["100"],
            previewDefaults: ["20"],
          },
          {
            id: 3,
            prompt: "Fill the blank so the pattern repeats once for each star point.",
            note: "Pick the repeat count that matches a five-point star.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(___):", "    pen.forward(120)", "    pen.right(144)"],
            tiles: ["4", "5", "6"],
            answer: ["5"],
            previewDefaults: ["1"],
          },
          {
            id: 4,
            prompt: "Fill the blank so the turtle turns with the star angle.",
            note: "Use the larger turn angle that closes the star shape.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(5):", "    pen.forward(110)", "    pen.right(___)"],
            tiles: ["90", "120", "144"],
            answer: ["144"],
            previewDefaults: ["0"],
          },
          {
            id: 5,
            prompt: "Fill the blank so the star uses right turns instead of left turns.",
            note: "Pick the turn command named in the prompt.",
            codeLines: ["import turtle", "pen = turtle.Turtle()", "for _ in range(5):", "    pen.forward(110)", "    pen.___(144)"],
            tiles: ["left", "right", "goto"],
            answer: ["right"],
            previewDefaults: ["right"],
          },
        ],
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

export function fillTurtleCode(codeLines: string[], values: string[], fallbacks: string[] = []) {
  let blankIndex = 0;

  return codeLines.map((line) =>
    line.replace(/_{3}/g, () => {
      const value = values[blankIndex] || fallbacks[blankIndex] || "0";
      blankIndex += 1;
      return value;
    })
  );
}
