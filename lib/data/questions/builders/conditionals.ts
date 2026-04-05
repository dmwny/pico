import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion, wrapRunnableCode } from "../builderUtils";

type ConditionalsSpec = {
  header: string;
  headerTokens: string[];
  headerDistractors: string[];
  equalityToken: string;
  elseIfToken: string;
  commentPrefix: string;
  trueCode: string;
  falseCode: string;
  elseIfCode: string;
  compareCode: string;
  hardCode: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  fillSelectOptions: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getConditionalsSpec(language: LearningLanguage): ConditionalsSpec {
  switch (language) {
    case "python":
      return {
        header: "if score > 0:",
        headerTokens: ["if", "score", ">", "0", ":"],
        headerDistractors: ["if (score > 0) {", "if score > 0 then", "if score > 0"],
        equalityToken: "==",
        elseIfToken: "elif",
        commentPrefix: "#",
        trueCode: "score = 3\nif score > 0:\n    print('yes')",
        falseCode: "score = 0\nif score > 0:\n    print('yes')\nelse:\n    print('no')",
        elseIfCode: "score = 2\nif score == 1:\n    print('one')\nelif score == 2:\n    print('two')\nelse:\n    print('other')",
        compareCode: "score = 4\nif score == 4:\n    print('match')\nelse:\n    print('miss')",
        hardCode: "score = 9\nif score >= 10:\n    print('big')\nelse:\n    print('small')",
        wordBankTokens: ["if", "score", ">", "0", ":", "then", "{", "}"],
        wordBankCorrect: ["if", "score", ">", "0", ":"],
        fillSelectOptions: ["==", "=", "===", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "==", right: "checks equality" },
          { left: "elif", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score == 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "print('yes')", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if score >= 10:", right: "checks a threshold" },
          { left: "elif score == 5:", right: "checks another case" },
          { left: "else:", right: "handles remaining cases" },
          { left: "score == 3", right: "equality test" },
        ],
      };
    case "javascript":
      return {
        header: "if (score > 0) {",
        headerTokens: ["if", "(", "score", ">", "0", ")", "{"],
        headerDistractors: ["if score > 0:", "if score > 0 then", "if (score > 0):"],
        equalityToken: "===",
        elseIfToken: "else if",
        commentPrefix: "//",
        trueCode: "const score = 3;\nif (score > 0) {\n  console.log('yes');\n}",
        falseCode: "const score = 0;\nif (score > 0) {\n  console.log('yes');\n} else {\n  console.log('no');\n}",
        elseIfCode: "const score = 2;\nif (score === 1) {\n  console.log('one');\n} else if (score === 2) {\n  console.log('two');\n} else {\n  console.log('other');\n}",
        compareCode: "const score = 4;\nif (score === 4) {\n  console.log('match');\n} else {\n  console.log('miss');\n}",
        hardCode: "const score = 9;\nif (score >= 10) {\n  console.log('big');\n} else {\n  console.log('small');\n}",
        wordBankTokens: ["if", "(", "score", ">", "0", ")", "{", ":", "then"],
        wordBankCorrect: ["if", "(", "score", ">", "0", ")", "{"],
        fillSelectOptions: ["===", "==", "=", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "===", right: "checks equality" },
          { left: "else if", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score === 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "console.log('yes');", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if (score >= 10) {", right: "checks a threshold" },
          { left: "else if (score === 5) {", right: "checks another case" },
          { left: "} else {", right: "handles remaining cases" },
          { left: "score === 3", right: "strict equality test" },
        ],
      };
    case "typescript":
      return {
        header: "if (score > 0) {",
        headerTokens: ["if", "(", "score", ">", "0", ")", "{"],
        headerDistractors: ["if score > 0:", "if score > 0 then", "if (score > 0):"],
        equalityToken: "===",
        elseIfToken: "else if",
        commentPrefix: "//",
        trueCode: "const score: number = 3;\nif (score > 0) {\n  console.log('yes');\n}",
        falseCode: "const score: number = 0;\nif (score > 0) {\n  console.log('yes');\n} else {\n  console.log('no');\n}",
        elseIfCode: "const score: number = 2;\nif (score === 1) {\n  console.log('one');\n} else if (score === 2) {\n  console.log('two');\n} else {\n  console.log('other');\n}",
        compareCode: "const score: number = 4;\nif (score === 4) {\n  console.log('match');\n} else {\n  console.log('miss');\n}",
        hardCode: "const score: number = 9;\nif (score >= 10) {\n  console.log('big');\n} else {\n  console.log('small');\n}",
        wordBankTokens: ["if", "(", "score", ">", "0", ")", "{", ":", "then"],
        wordBankCorrect: ["if", "(", "score", ">", "0", ")", "{"],
        fillSelectOptions: ["===", "==", "=", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "===", right: "checks equality" },
          { left: "else if", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score === 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "console.log('yes');", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if (score >= 10) {", right: "checks a threshold" },
          { left: "else if (score === 5) {", right: "checks another case" },
          { left: "} else {", right: "handles remaining cases" },
          { left: "score === 3", right: "strict equality test" },
        ],
      };
    case "java":
      return {
        header: "if (score > 0) {",
        headerTokens: ["if", "(", "score", ">", "0", ")", "{"],
        headerDistractors: ["if score > 0:", "if score > 0 then", "if (score > 0):"],
        equalityToken: "==",
        elseIfToken: "else if",
        commentPrefix: "//",
        trueCode: "int score = 3;\nif (score > 0) {\n  System.out.println(\"yes\");\n}",
        falseCode: "int score = 0;\nif (score > 0) {\n  System.out.println(\"yes\");\n} else {\n  System.out.println(\"no\");\n}",
        elseIfCode: "int score = 2;\nif (score == 1) {\n  System.out.println(\"one\");\n} else if (score == 2) {\n  System.out.println(\"two\");\n} else {\n  System.out.println(\"other\");\n}",
        compareCode: "int score = 4;\nif (score == 4) {\n  System.out.println(\"match\");\n} else {\n  System.out.println(\"miss\");\n}",
        hardCode: "int score = 9;\nif (score >= 10) {\n  System.out.println(\"big\");\n} else {\n  System.out.println(\"small\");\n}",
        wordBankTokens: ["if", "(", "score", ">", "0", ")", "{", ":", "then"],
        wordBankCorrect: ["if", "(", "score", ">", "0", ")", "{"],
        fillSelectOptions: ["==", "=", "===", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "==", right: "checks equality" },
          { left: "else if", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score == 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "System.out.println(\"yes\");", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if (score >= 10) {", right: "checks a threshold" },
          { left: "else if (score == 5) {", right: "checks another case" },
          { left: "} else {", right: "handles remaining cases" },
          { left: "score == 3", right: "equality test" },
        ],
      };
    case "csharp":
      return {
        header: "if (score > 0) {",
        headerTokens: ["if", "(", "score", ">", "0", ")", "{"],
        headerDistractors: ["if score > 0:", "if score > 0 then", "if (score > 0):"],
        equalityToken: "==",
        elseIfToken: "else if",
        commentPrefix: "//",
        trueCode: "int score = 3;\nif (score > 0) {\n  Console.WriteLine(\"yes\");\n}",
        falseCode: "int score = 0;\nif (score > 0) {\n  Console.WriteLine(\"yes\");\n} else {\n  Console.WriteLine(\"no\");\n}",
        elseIfCode: "int score = 2;\nif (score == 1) {\n  Console.WriteLine(\"one\");\n} else if (score == 2) {\n  Console.WriteLine(\"two\");\n} else {\n  Console.WriteLine(\"other\");\n}",
        compareCode: "int score = 4;\nif (score == 4) {\n  Console.WriteLine(\"match\");\n} else {\n  Console.WriteLine(\"miss\");\n}",
        hardCode: "int score = 9;\nif (score >= 10) {\n  Console.WriteLine(\"big\");\n} else {\n  Console.WriteLine(\"small\");\n}",
        wordBankTokens: ["if", "(", "score", ">", "0", ")", "{", ":", "then"],
        wordBankCorrect: ["if", "(", "score", ">", "0", ")", "{"],
        fillSelectOptions: ["==", "=", "===", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "==", right: "checks equality" },
          { left: "else if", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score == 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "Console.WriteLine(\"yes\");", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if (score >= 10) {", right: "checks a threshold" },
          { left: "else if (score == 5) {", right: "checks another case" },
          { left: "} else {", right: "handles remaining cases" },
          { left: "score == 3", right: "equality test" },
        ],
      };
    case "rust":
      return {
        header: "if score > 0 {",
        headerTokens: ["if", "score", ">", "0", "{"],
        headerDistractors: ["if (score > 0) {", "if score > 0:", "if score > 0 then"],
        equalityToken: "==",
        elseIfToken: "else if",
        commentPrefix: "//",
        trueCode: "let score = 3;\nif score > 0 {\n    println!(\"yes\");\n}",
        falseCode: "let score = 0;\nif score > 0 {\n    println!(\"yes\");\n} else {\n    println!(\"no\");\n}",
        elseIfCode: "let score = 2;\nif score == 1 {\n    println!(\"one\");\n} else if score == 2 {\n    println!(\"two\");\n} else {\n    println!(\"other\");\n}",
        compareCode: "let score = 4;\nif score == 4 {\n    println!(\"match\");\n} else {\n    println!(\"miss\");\n}",
        hardCode: "let score = 9;\nif score >= 10 {\n    println!(\"big\");\n} else {\n    println!(\"small\");\n}",
        wordBankTokens: ["if", "score", ">", "0", "{", "(", ")", ":"],
        wordBankCorrect: ["if", "score", ">", "0", "{"],
        fillSelectOptions: ["==", "=", "===", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "==", right: "checks equality" },
          { left: "else if", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score == 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "println!(\"yes\");", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if score >= 10 {", right: "checks a threshold" },
          { left: "else if score == 5 {", right: "checks another case" },
          { left: "} else {", right: "handles remaining cases" },
          { left: "score == 3", right: "equality test" },
        ],
      };
    case "lua":
      return {
        header: "if score > 0 then",
        headerTokens: ["if", "score", ">", "0", "then"],
        headerDistractors: ["if (score > 0) {", "if score > 0:", "if score > 0 {"],
        equalityToken: "==",
        elseIfToken: "elseif",
        commentPrefix: "--",
        trueCode: "local score = 3\nif score > 0 then\n  print(\"yes\")\nend",
        falseCode: "local score = 0\nif score > 0 then\n  print(\"yes\")\nelse\n  print(\"no\")\nend",
        elseIfCode: "local score = 2\nif score == 1 then\n  print(\"one\")\nelseif score == 2 then\n  print(\"two\")\nelse\n  print(\"other\")\nend",
        compareCode: "local score = 4\nif score == 4 then\n  print(\"match\")\nelse\n  print(\"miss\")\nend",
        hardCode: "local score = 9\nif score >= 10 then\n  print(\"big\")\nelse\n  print(\"small\")\nend",
        wordBankTokens: ["if", "score", ">", "0", "then", "{", "}", ":"],
        wordBankCorrect: ["if", "score", ">", "0", "then"],
        fillSelectOptions: ["==", "=", "===", ":"],
        matchPairsBasic: [
          { left: "if", right: "starts a conditional check" },
          { left: "else", right: "runs when the first condition is false" },
          { left: "==", right: "checks equality" },
          { left: "elseif", right: "checks another condition" },
        ],
        matchPairsMid: [
          { left: "score > 0", right: "true when the value is positive" },
          { left: "score == 2", right: "true only when the value is 2" },
          { left: "else", right: "fallback branch" },
          { left: "print(\"yes\")", right: "code inside a branch" },
        ],
        matchPairsHard: [
          { left: "if score >= 10 then", right: "checks a threshold" },
          { left: "elseif score == 5 then", right: "checks another case" },
          { left: "else", right: "handles remaining cases" },
          { left: "score == 3", right: "equality test" },
        ],
      };
  }
}

export function buildConditionalsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getConditionalsSpec(language);
  const q = createQuestionFactory(language, concept);
  const runnable = (code: string) => wrapRunnableCode(language, code);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does a conditional do?",
    options: [
      "Runs code only when a condition matches",
      "Creates a list of values",
      "Declares a new function",
      "Repeats code forever",
    ],
    correctIndex: 0,
    explanation: "Conditionals let your program make decisions. They run different code depending on whether a test is true or false.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly starts an `if` statement in this language?",
    options: [spec.header, ...spec.headerDistractors],
    correctIndex: 0,
    explanation: "Conditional syntax is language-specific. Beginners often confuse Python colons, Lua `then`, and brace-based languages.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `Which token is used for an extra branch after the first condition?`,
    options: [spec.elseIfToken, "otherwise", "repeat", "return"],
    correctIndex: 0,
    explanation: `The keyword is \`${spec.elseIfToken}\` in this language. Other languages use slightly different spellings like \`elif\`, \`else if\`, or \`elseif\`.`,
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "If the condition is false, the `if` branch does not run.",
    correct: true,
    explanation: "An `if` branch only runs when its condition evaluates to true. Otherwise the program skips it or goes to another branch.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `yes`.",
    code: runnable(spec.trueCode),
    correct: true,
    explanation: "The condition is true in this example, so the `if` branch runs and prints yes.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.trueCode),
    options: ["yes", "no", "nothing", "error"],
    correctIndex: 0,
    correctAnswer: "yes",
    explanation: "Because the condition is true, the code inside the `if` branch runs.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.falseCode),
    options: ["yes", "no", "both", "error"],
    correctIndex: 1,
    correctAnswer: "no",
    explanation: "The first condition is false, so the `else` branch runs instead.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the equality operator used by this language.",
    code: runnable(`${spec.compareCode}\n${spec.commentPrefix} equality operator: _____`),
    correctAnswer: spec.equalityToken,
    explanation: `This language uses \`${spec.equalityToken}\` to compare two values for equality.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the keyword used for an extra branch.",
    code: runnable(`${spec.elseIfCode}\n${spec.commentPrefix} extra branch keyword: _____`),
    correctAnswer: spec.elseIfToken,
    explanation: `The extra branch keyword is \`${spec.elseIfToken}\` in this language.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the `if` header that checks whether `score` is greater than 0.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct header follows this language's conditional syntax. The distractors mimic syntax from other languages.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each conditional token to its job.",
    pairs: spec.matchPairsBasic,
    explanation: "These are the basic building blocks of beginner conditional logic.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What is the purpose of `else`?",
    options: [
      "It runs when earlier conditions fail",
      "It repeats the same branch again",
      "It creates a variable",
      "It adds two numbers together",
    ],
    correctIndex: 0,
    explanation: "`else` provides a fallback branch. It runs when the previous conditions were not true.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why is the equality operator important in conditionals?",
    options: [
      "It lets you test whether two values are the same",
      "It turns numbers into strings",
      "It starts a loop",
      "It closes a code block",
    ],
    correctIndex: 0,
    explanation: "Equality tests are common in decisions like checking scores, menu choices, or exact values.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "An `else if` or similar middle branch checks another condition before the final `else`.",
    correct: true,
    explanation: "Middle branches let you test more than one case in order. The final `else` only runs if the earlier checks fail.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays `two`.",
    code: runnable(spec.elseIfCode),
    correct: true,
    explanation: "The first check fails, but the middle branch matches the value 2, so that branch runs.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.elseIfCode),
    options: ["one", "two", "other", "nothing"],
    correctIndex: 1,
    correctAnswer: "two",
    explanation: "The middle branch is the one that matches, so the output is two.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.compareCode),
    options: ["match", "miss", "both", "error"],
    correctIndex: 0,
    correctAnswer: "match",
    explanation: "The equality comparison is true, so the matching branch runs.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword that starts a conditional.",
    code: runnable(`${spec.trueCode}\n${spec.commentPrefix} starting keyword: _____`),
    correctAnswer: "if",
    explanation: "Every beginner conditional starts with `if`, even though the rest of the syntax differs by language.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the fallback branch keyword.",
    code: runnable(`${spec.falseCode}\n${spec.commentPrefix} fallback keyword: _____`),
    correctAnswer: "else",
    explanation: "The fallback branch keyword is `else` across these beginner languages.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the equality check header for `score` and 4.",
    tokens: (() => {
      if (language === "python") return ["if", "score", "==", "4", ":", "=", "==="];
      if (language === "lua") return ["if", "score", "==", "4", "then", "=", "==="];
      if (language === "rust") return ["if", "score", "==", "4", "{", "=", ":"];
      return ["if", "(", "score", spec.equalityToken, "4", ")", "{", "=", ":"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["if", "score", "==", "4", ":"];
      if (language === "lua") return ["if", "score", "==", "4", "then"];
      if (language === "rust") return ["if", "score", "==", "4", "{"];
      return ["if", "(", "score", spec.equalityToken, "4", ")", "{"];
    })(),
    correctAnswer: "",
    explanation: "This builds the condition that checks whether `score` equals 4 using the correct equality syntax for the language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each conditional piece to its meaning.",
    pairs: spec.matchPairsMid,
    explanation: "These pieces show how conditions, branches, and branch bodies work together.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the equality operator used in this language.",
    code: runnable(`${spec.compareCode}\n${spec.commentPrefix} equality operator: _____`),
    options: spec.fillSelectOptions,
    correctIndex: spec.fillSelectOptions.indexOf(spec.equalityToken),
    correctAnswer: spec.equalityToken,
    explanation: `The correct operator is \`${spec.equalityToken}\`. Languages differ here, especially JavaScript and TypeScript with strict equality.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why are ordered conditional branches useful?",
    options: [
      "They let you test multiple cases in sequence",
      "They automatically sort numbers",
      "They replace variables completely",
      "They make every condition true",
    ],
    correctIndex: 0,
    explanation: "Ordered branches let you check one case, then another, then fall back if none match.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What does a threshold check like `score >= 10` do?",
    options: [
      "It checks whether the value is at least 10",
      "It subtracts 10 from the value",
      "It converts the value to text",
      "It ends the program",
    ],
    correctIndex: 0,
    explanation: "A threshold check compares a value against a boundary. It is common for grades, levels, and minimum requirements.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "Only one branch in a basic `if` / `else if` / `else` chain runs for a single check.",
    correct: true,
    explanation: "Once a matching branch is found, the later branches are skipped in a standard conditional chain.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays `small`.",
    code: runnable(spec.hardCode),
    correct: true,
    explanation: "The score is 9, so the `>= 10` check fails and the fallback branch runs.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.hardCode),
    options: ["big", "small", "9", "error"],
    correctIndex: 1,
    correctAnswer: "small",
    explanation: "The threshold check fails because 9 is less than 10, so the `else` branch prints small.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.compareCode),
    options: ["match", "miss", "4", "nothing"],
    correctIndex: 0,
    correctAnswer: "match",
    explanation: "The equality check succeeds, so the code in the matching branch runs.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the operator used for equality in this language.",
    code: runnable(`${spec.elseIfCode}\n${spec.commentPrefix} equality operator: _____`),
    correctAnswer: spec.equalityToken,
    explanation: `This language uses \`${spec.equalityToken}\` for equality checks inside conditionals.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the middle-branch keyword used in this language.",
    code: runnable(`${spec.elseIfCode}\n${spec.commentPrefix} middle-branch keyword: _____`),
    correctAnswer: spec.elseIfToken,
    explanation: `The correct middle-branch keyword is \`${spec.elseIfToken}\`. This is one of the easy cross-language syntax differences to miss.`,
  });
  const hardWordBankCorrect = (() => {
    if (language === "python") return ["if", "score", ">=", "10", ":"];
    if (language === "lua") return ["if", "score", ">=", "10", "then"];
    if (language === "rust") return ["if", "score", ">=", "10", "{"];
    return ["if", "(", "score", ">=", "10", ")", "{"];
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the threshold check header for `score` and 10.",
    tokens: [...hardWordBankCorrect, "=", "then", ":"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This builds a conditional header that checks whether `score` is at least 10.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each conditional pattern to its purpose.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show equality tests, threshold checks, extra branches, and fallback branches.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the middle-branch keyword used by this language.",
    code: runnable(`${spec.elseIfCode}\n${spec.commentPrefix} middle-branch keyword: _____`),
    options: [spec.elseIfToken, "elif", "elseif", "otherwise"].filter((option, index, list) => list.indexOf(option) === index).slice(0, 4),
    correctIndex: 0,
    correctAnswer: spec.elseIfToken,
    explanation: `The correct keyword is \`${spec.elseIfToken}\`. Different languages spell this branch differently, which makes it a common beginner mistake.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
