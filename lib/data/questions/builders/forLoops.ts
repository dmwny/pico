import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion, wrapRunnableCode } from "../builderUtils";

type ForLoopsSpec = {
  header: string;
  headerDistractors: string[];
  helperToken: string;
  helperOptions: string[];
  commentPrefix: string;
  simpleCode: string;
  simpleOutput: string;
  offsetCode: string;
  offsetOutput: string;
  stepCode: string;
  stepOutput: string;
  sumCode: string;
  sumOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getForLoopsSpec(language: LearningLanguage): ForLoopsSpec {
  switch (language) {
    case "python":
      return {
        header: "for i in range(3):",
        headerDistractors: ["for (let i = 0; i < 3; i++) {", "for i = 1, 3 do", "for i in 0..3 {"],
        helperToken: "range",
        helperOptions: ["range", "while", "loop", "items"],
        commentPrefix: "#",
        simpleCode: "for i in range(3):\n    print(i)",
        simpleOutput: "0\n1\n2",
        offsetCode: "for i in range(1, 4):\n    print(i)",
        offsetOutput: "1\n2\n3",
        stepCode: "for i in range(0, 5, 2):\n    print(i)",
        stepOutput: "0\n2\n4",
        sumCode: "total = 0\nfor i in range(1, 4):\n    total = total + i\nprint(total)",
        sumOutput: "6",
        wordBankTokens: ["for", "i", "in", "range", "(", "3", ")", ":", "while", "let"],
        wordBankCorrect: ["for", "i", "in", "range", "(", "3", ")", ":"],
        matchPairsBasic: [
          { left: "range(3)", right: "0, 1, 2" },
          { left: "range(1, 4)", right: "1, 2, 3" },
          { left: "range(0, 5, 2)", right: "0, 2, 4" },
          { left: "for i in fruits:", right: "loops through each item" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "range(3)", right: "provides values" },
          { left: "print(i)", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "range(1, 4)", right: "counts from 1 to 3" },
          { left: "range(0, 5, 2)", right: "steps by 2" },
          { left: "total = total + i", right: "accumulates a running total" },
          { left: "print(total)", right: "shows the final result" },
        ],
      };
    case "javascript":
      return {
        header: "for (let i = 0; i < 3; i++) {",
        headerDistractors: ["for i in range(3):", "for i = 1, 3 do", "for i in 0..3 {"],
        helperToken: "i++",
        helperOptions: ["i++", "range", "then", "end"],
        commentPrefix: "//",
        simpleCode: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
        simpleOutput: "0\n1\n2",
        offsetCode: "for (let i = 1; i < 4; i++) {\n  console.log(i);\n}",
        offsetOutput: "1\n2\n3",
        stepCode: "for (let i = 0; i < 5; i += 2) {\n  console.log(i);\n}",
        stepOutput: "0\n2\n4",
        sumCode: "let total = 0;\nfor (let i = 1; i < 4; i++) {\n  total = total + i;\n}\nconsole.log(total);",
        sumOutput: "6",
        wordBankTokens: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{", "range"],
        wordBankCorrect: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{"],
        matchPairsBasic: [
          { left: "i < 3", right: "stops before 3" },
          { left: "i++", right: "adds 1 each loop" },
          { left: "let i = 1", right: "starts at 1" },
          { left: "console.log(i);", right: "runs each iteration" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "i < 3", right: "continuation test" },
          { left: "console.log(i);", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "let i = 1", right: "counts from 1" },
          { left: "i += 2", right: "steps by 2" },
          { left: "total = total + i;", right: "accumulates a running total" },
          { left: "console.log(total);", right: "shows the final result" },
        ],
      };
    case "typescript":
      return {
        header: "for (let i = 0; i < 3; i++) {",
        headerDistractors: ["for i in range(3):", "for i = 1, 3 do", "for i in 0..3 {"],
        helperToken: "i++",
        helperOptions: ["i++", "range", "then", "end"],
        commentPrefix: "//",
        simpleCode: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
        simpleOutput: "0\n1\n2",
        offsetCode: "for (let i = 1; i < 4; i++) {\n  console.log(i);\n}",
        offsetOutput: "1\n2\n3",
        stepCode: "for (let i = 0; i < 5; i += 2) {\n  console.log(i);\n}",
        stepOutput: "0\n2\n4",
        sumCode: "let total = 0;\nfor (let i = 1; i < 4; i++) {\n  total = total + i;\n}\nconsole.log(total);",
        sumOutput: "6",
        wordBankTokens: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{", "range"],
        wordBankCorrect: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{"],
        matchPairsBasic: [
          { left: "i < 3", right: "stops before 3" },
          { left: "i++", right: "adds 1 each loop" },
          { left: "let i = 1", right: "starts at 1" },
          { left: "console.log(i);", right: "runs each iteration" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "i < 3", right: "continuation test" },
          { left: "console.log(i);", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "let i = 1", right: "counts from 1" },
          { left: "i += 2", right: "steps by 2" },
          { left: "total = total + i;", right: "accumulates a running total" },
          { left: "console.log(total);", right: "shows the final result" },
        ],
      };
    case "java":
      return {
        header: "for (int i = 0; i < 3; i++) {",
        headerDistractors: ["for i in range(3):", "for i = 1, 3 do", "for i in 0..3 {"],
        helperToken: "i++",
        helperOptions: ["i++", "range", "then", "end"],
        commentPrefix: "//",
        simpleCode: "for (int i = 0; i < 3; i++) {\n  System.out.println(i);\n}",
        simpleOutput: "0\n1\n2",
        offsetCode: "for (int i = 1; i < 4; i++) {\n  System.out.println(i);\n}",
        offsetOutput: "1\n2\n3",
        stepCode: "for (int i = 0; i < 5; i += 2) {\n  System.out.println(i);\n}",
        stepOutput: "0\n2\n4",
        sumCode: "int total = 0;\nfor (int i = 1; i < 4; i++) {\n  total = total + i;\n}\nSystem.out.println(total);",
        sumOutput: "6",
        wordBankTokens: ["for", "(", "int", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{", "range"],
        wordBankCorrect: ["for", "(", "int", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{"],
        matchPairsBasic: [
          { left: "i < 3", right: "stops before 3" },
          { left: "i++", right: "adds 1 each loop" },
          { left: "int i = 1", right: "starts at 1" },
          { left: "System.out.println(i);", right: "runs each iteration" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "i < 3", right: "continuation test" },
          { left: "System.out.println(i);", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "int i = 1", right: "counts from 1" },
          { left: "i += 2", right: "steps by 2" },
          { left: "total = total + i;", right: "accumulates a running total" },
          { left: "System.out.println(total);", right: "shows the final result" },
        ],
      };
    case "csharp":
      return {
        header: "for (int i = 0; i < 3; i++) {",
        headerDistractors: ["for i in range(3):", "for i = 1, 3 do", "for i in 0..3 {"],
        helperToken: "i++",
        helperOptions: ["i++", "range", "then", "end"],
        commentPrefix: "//",
        simpleCode: "for (int i = 0; i < 3; i++) {\n  Console.WriteLine(i);\n}",
        simpleOutput: "0\n1\n2",
        offsetCode: "for (int i = 1; i < 4; i++) {\n  Console.WriteLine(i);\n}",
        offsetOutput: "1\n2\n3",
        stepCode: "for (int i = 0; i < 5; i += 2) {\n  Console.WriteLine(i);\n}",
        stepOutput: "0\n2\n4",
        sumCode: "int total = 0;\nfor (int i = 1; i < 4; i++) {\n  total = total + i;\n}\nConsole.WriteLine(total);",
        sumOutput: "6",
        wordBankTokens: ["for", "(", "int", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{", "range"],
        wordBankCorrect: ["for", "(", "int", "i", "=", "0", ";", "i", "<", "3", ";", "i++", ")", "{"],
        matchPairsBasic: [
          { left: "i < 3", right: "stops before 3" },
          { left: "i++", right: "adds 1 each loop" },
          { left: "int i = 1", right: "starts at 1" },
          { left: "Console.WriteLine(i);", right: "runs each iteration" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "i < 3", right: "continuation test" },
          { left: "Console.WriteLine(i);", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "int i = 1", right: "counts from 1" },
          { left: "i += 2", right: "steps by 2" },
          { left: "total = total + i;", right: "accumulates a running total" },
          { left: "Console.WriteLine(total);", right: "shows the final result" },
        ],
      };
    case "rust":
      return {
        header: "for i in 0..3 {",
        headerDistractors: ["for i in range(3):", "for (let i = 0; i < 3; i++) {", "for i = 1, 3 do"],
        helperToken: "..",
        helperOptions: ["..", "range", "then", "i++"],
        commentPrefix: "//",
        simpleCode: "for i in 0..3 {\n    println!(\"{}\", i);\n}",
        simpleOutput: "0\n1\n2",
        offsetCode: "for i in 1..4 {\n    println!(\"{}\", i);\n}",
        offsetOutput: "1\n2\n3",
        stepCode: "for i in (0..5).step_by(2) {\n    println!(\"{}\", i);\n}",
        stepOutput: "0\n2\n4",
        sumCode: "let mut total = 0;\nfor i in 1..4 {\n    total = total + i;\n}\nprintln!(\"{}\", total);",
        sumOutput: "6",
        wordBankTokens: ["for", "i", "in", "0", "..", "3", "{", "range", "then"],
        wordBankCorrect: ["for", "i", "in", "0", "..", "3", "{"],
        matchPairsBasic: [
          { left: "0..3", right: "0, 1, 2" },
          { left: "1..4", right: "1, 2, 3" },
          { left: "step_by(2)", right: "steps by 2" },
          { left: "for i in values {", right: "loops through each item" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "0..3", right: "provides values" },
          { left: "println!(\"{}\", i);", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "1..4", right: "counts from 1 to 3" },
          { left: "step_by(2)", right: "steps by 2" },
          { left: "total = total + i;", right: "accumulates a running total" },
          { left: "println!(\"{}\", total);", right: "shows the final result" },
        ],
      };
    case "lua":
      return {
        header: "for i = 1, 3 do",
        headerDistractors: ["for i in range(3):", "for (let i = 0; i < 3; i++) {", "for i in 0..3 {"],
        helperToken: "do",
        helperOptions: ["do", "range", "i++", "{"],
        commentPrefix: "--",
        simpleCode: "for i = 1, 3 do\n  print(i)\nend",
        simpleOutput: "1\n2\n3",
        offsetCode: "for i = 2, 4 do\n  print(i)\nend",
        offsetOutput: "2\n3\n4",
        stepCode: "for i = 1, 5, 2 do\n  print(i)\nend",
        stepOutput: "1\n3\n5",
        sumCode: "local total = 0\nfor i = 1, 3 do\n  total = total + i\nend\nprint(total)",
        sumOutput: "6",
        wordBankTokens: ["for", "i", "=", "1", ",", "3", "do", "{", "range"],
        wordBankCorrect: ["for", "i", "=", "1", ",", "3", "do"],
        matchPairsBasic: [
          { left: "for i = 1, 3 do", right: "1, 2, 3" },
          { left: "for i = 2, 4 do", right: "2, 3, 4" },
          { left: "for i = 1, 5, 2 do", right: "1, 3, 5" },
          { left: "print(i)", right: "runs each iteration" },
        ],
        matchPairsMid: [
          { left: "for", right: "starts the loop" },
          { left: "i", right: "loop variable" },
          { left: "do", right: "starts the loop body" },
          { left: "print(i)", right: "runs each iteration" },
        ],
        matchPairsHard: [
          { left: "for i = 1, 3 do", right: "counts from 1 to 3" },
          { left: "for i = 1, 5, 2 do", right: "steps by 2" },
          { left: "total = total + i", right: "accumulates a running total" },
          { left: "print(total)", right: "shows the final result" },
        ],
      };
  }
}

export function buildForLoopsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getForLoopsSpec(language);
  const q = createQuestionFactory(language, concept);
  const runnable = (code: string) => wrapRunnableCode(language, code);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does a `for` loop do?",
    options: [
      "Repeats code for a sequence of values",
      "Defines a new function",
      "Stores a permanent variable",
      "Turns text into numbers",
    ],
    correctIndex: 0,
    explanation: "A `for` loop repeats a block of code as it moves through values. It is a common tool for counting or visiting items one by one.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which loop header is correct for this language?",
    options: [spec.header, ...spec.headerDistractors],
    correctIndex: 0,
    explanation: "Loop syntax differs a lot between languages. This is one of the easiest places for cross-language confusion.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What is the loop variable in \`${spec.header}\`?`,
    options: ["i", "for", spec.helperToken, "print"],
    correctIndex: 0,
    explanation: "The loop variable changes on each iteration. It usually holds the current number or current item.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A `for` loop repeats its body more than once when there is more than one value to visit.",
    correct: true,
    explanation: "That is the main purpose of a `for` loop. It runs the same block for each value in the sequence or range.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays three values.",
    code: runnable(spec.simpleCode),
    correct: true,
    explanation: "The loop runs once for each value in its sequence, so it prints three lines here.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.simpleCode),
    options: [spec.simpleOutput, "1\n2\n3", "0\n1\n2\n3", "error"],
    correctIndex: 0,
    correctAnswer: spec.simpleOutput,
    explanation: "The loop visits the values defined by the header and prints each one on its own line.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.offsetCode),
    options: [spec.offsetOutput, spec.simpleOutput, "0\n1\n2\n3", "error"],
    correctIndex: 0,
    correctAnswer: spec.offsetOutput,
    explanation: "Changing the start and stop values changes which numbers the loop visits.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the loop variable named in the comment.",
    code: runnable(`${spec.simpleCode}\n${spec.commentPrefix} loop variable: _____`),
    correctAnswer: "i",
    explanation: "The loop variable here is `i`, which changes as the loop runs.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the helper token used by this loop style.",
    code: runnable(`${spec.simpleCode}\n${spec.commentPrefix} loop helper: _____`),
    correctAnswer: spec.helperToken,
    explanation: `The token \`${spec.helperToken}\` is part of this language's \`for\` loop pattern.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the loop header that visits the first three values.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct header depends on the language's loop syntax. The distractors come from other loop styles.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each loop form to the values it visits.",
    pairs: spec.matchPairsBasic,
    explanation: "These examples show how different loop headers determine which values get visited.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What controls how many times a `for` loop runs?",
    options: [
      "The values or range in the loop header",
      "The output statement inside the loop",
      "The variable name alone",
      "Whether the code uses quotes",
    ],
    correctIndex: 0,
    explanation: "The loop header decides which values are visited. That determines how many iterations happen.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What does a step value or increment change in a `for` loop?",
    options: [
      "How much the loop variable changes each time",
      "Whether the loop is a function",
      "The name of the variable",
      "Whether output is allowed",
    ],
    correctIndex: 0,
    explanation: "A step controls how the loop variable moves through values, such as by 1 or by 2.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "Changing the starting value of a `for` loop changes the first number it visits.",
    correct: true,
    explanation: "If the loop begins at a different number, the visited sequence starts there instead of the old value.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code skips numbers by 2.",
    code: runnable(spec.stepCode),
    correct: true,
    explanation: "The loop moves by a step of 2, so it visits every other number in the range.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.stepCode),
    options: [spec.stepOutput, spec.simpleOutput, spec.offsetOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.stepOutput,
    explanation: "Because the loop steps by 2, it prints every other value instead of every value.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.sumCode),
    options: [spec.sumOutput, "3", "9", "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "The loop adds each visited value to `total`, then the final total is displayed after the loop finishes.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword that starts this loop.",
    code: runnable(`${spec.simpleCode}\n${spec.commentPrefix} starting keyword: _____`),
    correctAnswer: "for",
    explanation: "The starting keyword is `for` across all of these beginner loop syntaxes.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that stores the running total.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} running total variable: _____`),
    correctAnswer: "total",
    explanation: "The code uses a variable named `total` to keep adding values together across iterations.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the loop header that starts counting from 1.",
    tokens: (() => {
      if (language === "python") return ["for", "i", "in", "range", "(", "1", ",", "4", ")", ":", "while"];
      if (language === "lua") return ["for", "i", "=", "1", ",", "3", "do", "{", "range"];
      if (language === "rust") return ["for", "i", "in", "1", "..", "4", "{", "range", "do"];
      return ["for", "(", language === "java" || language === "csharp" ? "int" : "let", "i", "=", "1", ";", "i", "<", "4", ";", "i++", ")", "{", "while"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["for", "i", "in", "range", "(", "1", ",", "4", ")", ":"];
      if (language === "lua") return ["for", "i", "=", "1", ",", "3", "do"];
      if (language === "rust") return ["for", "i", "in", "1", "..", "4", "{"];
      return ["for", "(", language === "java" || language === "csharp" ? "int" : "let", "i", "=", "1", ";", "i", "<", "4", ";", "i++", ")", "{"];
    })(),
    correctAnswer: "",
    explanation: "This header starts the counter at 1. The rest of the syntax follows the loop style for the language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each loop piece to its role.",
    pairs: spec.matchPairsMid,
    explanation: "Each part of a `for` loop has a job: starting the loop, naming the variable, providing values, or running code each iteration.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the helper token used by this loop syntax.",
    code: runnable(`${spec.simpleCode}\n${spec.commentPrefix} helper token: _____`),
    options: spec.helperOptions,
    correctIndex: spec.helperOptions.indexOf(spec.helperToken),
    correctAnswer: spec.helperToken,
    explanation: `The token \`${spec.helperToken}\` is part of this language's \`for\` loop pattern.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why do programmers use a running total inside a `for` loop?",
    options: [
      "To combine values across iterations",
      "To make the loop stop immediately",
      "To rename the loop variable",
      "To remove the need for output",
    ],
    correctIndex: 0,
    explanation: "A running total lets the loop keep adding or combining values as it visits them one by one.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main effect of changing a loop's step or increment?",
    options: [
      "It changes which values are visited",
      "It turns the loop into a conditional",
      "It makes every loop infinite",
      "It changes strings into numbers",
    ],
    correctIndex: 0,
    explanation: "A different step means the loop moves through a different sequence of values, which changes the visited numbers.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A `for` loop can be used to build a result, not just print each number immediately.",
    correct: true,
    explanation: "Loops are often used for counting, summing, collecting, or transforming values before a final result is shown.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 6.",
    code: runnable(spec.sumCode),
    correct: true,
    explanation: "The loop visits the values 1, 2, and 3 and adds them into `total`, producing 6.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.sumCode),
    options: [spec.sumOutput, "3", "4", "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "The running total collects all visited values, then the final result is printed after the loop.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.stepCode),
    options: [spec.stepOutput, spec.offsetOutput, spec.simpleOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.stepOutput,
    explanation: "The step or increment changes which numbers are visited, so only those values are printed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable that changes each iteration.",
    code: runnable(`${spec.simpleCode}\n${spec.commentPrefix} changing variable: _____`),
    correctAnswer: "i",
    explanation: "The loop variable changes to the next value each time the loop runs.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable used for the accumulated result.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} accumulated result: _____`),
    correctAnswer: "total",
    explanation: "The code stores the growing result in `total` as the loop runs.",
  });
  const hardWordBankCorrect = (() => {
    if (language === "python") return ["for", "i", "in", "range", "(", "0", ",", "5", ",", "2", ")", ":"];
    if (language === "lua") return ["for", "i", "=", "1", ",", "5", ",", "2", "do"];
    if (language === "rust") return ["for", "i", "in", "(", "0", "..", "5", ")", ".", "step_by", "(", "2", ")", "{"];
    return ["for", "(", language === "java" || language === "csharp" ? "int" : "let", "i", "=", "0", ";", "i", "<", "5", ";", "i", "+=", "2", ")", "{"];
  })();
  const hardWordBankTokens = [...hardWordBankCorrect, "while", "range", "return"];
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the loop header that steps by 2.",
    tokens: hardWordBankTokens,
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This header makes the loop skip by 2 instead of moving one value at a time.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each loop pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show counting ranges, stepping, accumulation, and final output after the loop.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the helper token used by this language's `for` loop style.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} helper token: _____`),
    options: spec.helperOptions,
    correctIndex: spec.helperOptions.indexOf(spec.helperToken),
    correctAnswer: spec.helperToken,
    explanation: `The correct helper token is \`${spec.helperToken}\`. Different languages express loop progression in different ways.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
