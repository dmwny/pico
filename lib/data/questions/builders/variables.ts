import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion, wrapRunnableCode } from "../builderUtils";

type VariablesSpec = {
  displayLabel: string;
  createName: string;
  createNumber: string;
  printNameCode: string;
  updateNumberCode: string;
  totalCode: string;
  suffixCode: string;
  commentPrefix: string;
  declarationDistractors: string[];
  rulePrompt: string;
  ruleOptions: string[];
  ruleCorrectIndex: number;
  keywordToken: string;
  keywordOptions: string[];
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getVariablesSpec(language: LearningLanguage): VariablesSpec {
  switch (language) {
    case "python":
      return {
        displayLabel: "print(name)",
        createName: "name = 'Ada'",
        createNumber: "score = 5",
        printNameCode: "name = 'Ada'\nprint(name)",
        updateNumberCode: "score = 5\nscore = 8\nprint(score)",
        totalCode: "apples = 2\noranges = 3\ntotal = apples + oranges\nprint(total)",
        suffixCode: "name = 'Ada'\nprint(name + '!')",
        commentPrefix: "#",
        declarationDistractors: ["let name = 'Ada';", "String name = \"Ada\";", "const name = 'Ada';"],
        rulePrompt: "Which statement about Python variables is correct?",
        ruleOptions: [
          "You create them with a name, `=`, and a value",
          "You must write `let` before every variable",
          "Every variable must include a type like `String`",
          "Variables cannot be changed once created",
        ],
        ruleCorrectIndex: 0,
        keywordToken: "=",
        keywordOptions: ["=", "let", "const", ":"],
        wordBankTokens: ["name", "=", "'Ada'", "let", "const", "print"],
        wordBankCorrect: ["name", "=", "'Ada'"],
        matchPairsBasic: [
          { left: "name = 'Ada'", right: "stores text in `name`" },
          { left: "score = 5", right: "stores a number in `score`" },
          { left: "print(name)", right: "displays the value in `name`" },
          { left: "score = 8", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "apples = 2", right: "creates a variable" },
          { left: "total = apples + oranges", right: "stores a calculated value" },
          { left: "print(total)", right: "shows the current value" },
          { left: "score = 8", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "name = 'Ada'", right: "text assignment" },
          { left: "count = 3", right: "number assignment" },
          { left: "count = count + 1", right: "updates using the old value" },
          { left: "print(count)", right: "reads the variable" },
        ],
      };
    case "javascript":
      return {
        displayLabel: "console.log(name);",
        createName: "let name = 'Ada';",
        createNumber: "let score = 5;",
        printNameCode: "let name = 'Ada';\nconsole.log(name);",
        updateNumberCode: "let score = 5;\nscore = 8;\nconsole.log(score);",
        totalCode: "let apples = 2;\nlet oranges = 3;\nlet total = apples + oranges;\nconsole.log(total);",
        suffixCode: "let name = 'Ada';\nconsole.log(name + '!');",
        commentPrefix: "//",
        declarationDistractors: ["name = 'Ada'", "String name = \"Ada\";", "local name = \"Ada\""],
        rulePrompt: "Which JavaScript keyword is usually used for a variable you plan to change?",
        ruleOptions: ["let", "const", "def", "print"],
        ruleCorrectIndex: 0,
        keywordToken: "let",
        keywordOptions: ["let", "const", "var()", ":"],
        wordBankTokens: ["let", "name", "=", "'Ada'", ";", "const", "print"],
        wordBankCorrect: ["let", "name", "=", "'Ada'", ";"],
        matchPairsBasic: [
          { left: "let name = 'Ada';", right: "stores text in `name`" },
          { left: "let score = 5;", right: "stores a number in `score`" },
          { left: "console.log(name);", right: "displays the value in `name`" },
          { left: "score = 8;", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "let apples = 2;", right: "creates a variable" },
          { left: "let total = apples + oranges;", right: "stores a calculated value" },
          { left: "console.log(total);", right: "shows the current value" },
          { left: "score = 8;", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "let name = 'Ada';", right: "text assignment" },
          { left: "let count = 3;", right: "number assignment" },
          { left: "count = count + 1;", right: "updates using the old value" },
          { left: "console.log(count);", right: "reads the variable" },
        ],
      };
    case "typescript":
      return {
        displayLabel: "console.log(name);",
        createName: "let name = 'Ada';",
        createNumber: "let score = 5;",
        printNameCode: "let name = 'Ada';\nconsole.log(name);",
        updateNumberCode: "let score = 5;\nscore = 8;\nconsole.log(score);",
        totalCode: "let apples = 2;\nlet oranges = 3;\nlet total = apples + oranges;\nconsole.log(total);",
        suffixCode: "let name = 'Ada';\nconsole.log(name + '!');",
        commentPrefix: "//",
        declarationDistractors: ["name = 'Ada'", "String name = \"Ada\";", "local name = \"Ada\""],
        rulePrompt: "Which TypeScript keyword is usually used for a variable you plan to change?",
        ruleOptions: ["let", "const", "def", "print"],
        ruleCorrectIndex: 0,
        keywordToken: "let",
        keywordOptions: ["let", "const", "var()", ":"],
        wordBankTokens: ["let", "name", "=", "'Ada'", ";", "const", "print"],
        wordBankCorrect: ["let", "name", "=", "'Ada'", ";"],
        matchPairsBasic: [
          { left: "let name = 'Ada';", right: "stores text in `name`" },
          { left: "let score = 5;", right: "stores a number in `score`" },
          { left: "console.log(name);", right: "displays the value in `name`" },
          { left: "score = 8;", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "let apples = 2;", right: "creates a variable" },
          { left: "let total = apples + oranges;", right: "stores a calculated value" },
          { left: "console.log(total);", right: "shows the current value" },
          { left: "score = 8;", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "let name = 'Ada';", right: "text assignment" },
          { left: "let count = 3;", right: "number assignment" },
          { left: "count = count + 1;", right: "updates using the old value" },
          { left: "console.log(count);", right: "reads the variable" },
        ],
      };
    case "java":
      return {
        displayLabel: "System.out.println(name);",
        createName: "String name = \"Ada\";",
        createNumber: "int score = 5;",
        printNameCode: "String name = \"Ada\";\nSystem.out.println(name);",
        updateNumberCode: "int score = 5;\nscore = 8;\nSystem.out.println(score);",
        totalCode: "int apples = 2;\nint oranges = 3;\nint total = apples + oranges;\nSystem.out.println(total);",
        suffixCode: "String name = \"Ada\";\nSystem.out.println(name + \"!\");",
        commentPrefix: "//",
        declarationDistractors: ["name = 'Ada'", "let name = 'Ada';", "local name = \"Ada\""],
        rulePrompt: "What must a Java variable declaration include?",
        ruleOptions: [
          "A type and a variable name",
          "Only a variable name",
          "The word `let`",
          "A `def` keyword",
        ],
        ruleCorrectIndex: 0,
        keywordToken: "String",
        keywordOptions: ["String", "let", "const", "local"],
        wordBankTokens: ["String", "name", "=", "\"Ada\"", ";", "let", "print"],
        wordBankCorrect: ["String", "name", "=", "\"Ada\"", ";"],
        matchPairsBasic: [
          { left: "String name = \"Ada\";", right: "stores text in `name`" },
          { left: "int score = 5;", right: "stores a number in `score`" },
          { left: "System.out.println(name);", right: "displays the value in `name`" },
          { left: "score = 8;", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "int apples = 2;", right: "creates a variable" },
          { left: "int total = apples + oranges;", right: "stores a calculated value" },
          { left: "System.out.println(total);", right: "shows the current value" },
          { left: "score = 8;", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "String name = \"Ada\";", right: "text assignment" },
          { left: "int count = 3;", right: "number assignment" },
          { left: "count = count + 1;", right: "updates using the old value" },
          { left: "System.out.println(count);", right: "reads the variable" },
        ],
      };
    case "csharp":
      return {
        displayLabel: "Console.WriteLine(name);",
        createName: "string name = \"Ada\";",
        createNumber: "int score = 5;",
        printNameCode: "string name = \"Ada\";\nConsole.WriteLine(name);",
        updateNumberCode: "int score = 5;\nscore = 8;\nConsole.WriteLine(score);",
        totalCode: "int apples = 2;\nint oranges = 3;\nint total = apples + oranges;\nConsole.WriteLine(total);",
        suffixCode: "string name = \"Ada\";\nConsole.WriteLine(name + \"!\");",
        commentPrefix: "//",
        declarationDistractors: ["name = 'Ada'", "let name = 'Ada';", "local name = \"Ada\""],
        rulePrompt: "Which C# declaration is valid for a text variable?",
        ruleOptions: [
          "string name = \"Ada\";",
          "let name = 'Ada';",
          "name = \"Ada\"",
          "String name := \"Ada\";",
        ],
        ruleCorrectIndex: 0,
        keywordToken: "string",
        keywordOptions: ["string", "let", "const", "local"],
        wordBankTokens: ["string", "name", "=", "\"Ada\"", ";", "let", "print"],
        wordBankCorrect: ["string", "name", "=", "\"Ada\"", ";"],
        matchPairsBasic: [
          { left: "string name = \"Ada\";", right: "stores text in `name`" },
          { left: "int score = 5;", right: "stores a number in `score`" },
          { left: "Console.WriteLine(name);", right: "displays the value in `name`" },
          { left: "score = 8;", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "int apples = 2;", right: "creates a variable" },
          { left: "int total = apples + oranges;", right: "stores a calculated value" },
          { left: "Console.WriteLine(total);", right: "shows the current value" },
          { left: "score = 8;", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "string name = \"Ada\";", right: "text assignment" },
          { left: "int count = 3;", right: "number assignment" },
          { left: "count = count + 1;", right: "updates using the old value" },
          { left: "Console.WriteLine(count);", right: "reads the variable" },
        ],
      };
    case "rust":
      return {
        displayLabel: "println!(\"{}\", name);",
        createName: "let name = \"Ada\";",
        createNumber: "let mut score = 5;",
        printNameCode: "let name = \"Ada\";\nprintln!(\"{}\", name);",
        updateNumberCode: "let mut score = 5;\nscore = 8;\nprintln!(\"{}\", score);",
        totalCode: "let apples = 2;\nlet oranges = 3;\nlet total = apples + oranges;\nprintln!(\"{}\", total);",
        suffixCode: "let name = \"Ada\";\nprintln!(\"{}!\", name);",
        commentPrefix: "//",
        declarationDistractors: ["name = 'Ada'", "let name = 'Ada';", "String name = \"Ada\";"],
        rulePrompt: "Which Rust keyword is needed if you want to change a variable later?",
        ruleOptions: ["mut", "const", "def", "local"],
        ruleCorrectIndex: 0,
        keywordToken: "mut",
        keywordOptions: ["mut", "let", "const", "var"],
        wordBankTokens: ["let", "name", "=", "\"Ada\"", ";", "mut", "print"],
        wordBankCorrect: ["let", "name", "=", "\"Ada\"", ";"],
        matchPairsBasic: [
          { left: "let name = \"Ada\";", right: "stores text in `name`" },
          { left: "let mut score = 5;", right: "stores a number in `score`" },
          { left: "println!(\"{}\", name);", right: "displays the value in `name`" },
          { left: "score = 8;", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "let apples = 2;", right: "creates a variable" },
          { left: "let total = apples + oranges;", right: "stores a calculated value" },
          { left: "println!(\"{}\", total);", right: "shows the current value" },
          { left: "score = 8;", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "let name = \"Ada\";", right: "text assignment" },
          { left: "let mut count = 3;", right: "number assignment" },
          { left: "count = count + 1;", right: "updates using the old value" },
          { left: "println!(\"{}\", count);", right: "reads the variable" },
        ],
      };
    case "lua":
      return {
        displayLabel: "print(name)",
        createName: "local name = \"Ada\"",
        createNumber: "local score = 5",
        printNameCode: "local name = \"Ada\"\nprint(name)",
        updateNumberCode: "local score = 5\nscore = 8\nprint(score)",
        totalCode: "local apples = 2\nlocal oranges = 3\nlocal total = apples + oranges\nprint(total)",
        suffixCode: "local name = \"Ada\"\nprint(name .. \"!\")",
        commentPrefix: "--",
        declarationDistractors: ["name = 'Ada'", "let name = 'Ada';", "String name = \"Ada\";"],
        rulePrompt: "Which word is recommended when creating a local variable in Lua?",
        ruleOptions: ["local", "let", "var", "const"],
        ruleCorrectIndex: 0,
        keywordToken: "local",
        keywordOptions: ["local", "let", "const", "var"],
        wordBankTokens: ["local", "name", "=", "\"Ada\"", "let", "print", "const"],
        wordBankCorrect: ["local", "name", "=", "\"Ada\""],
        matchPairsBasic: [
          { left: "local name = \"Ada\"", right: "stores text in `name`" },
          { left: "local score = 5", right: "stores a number in `score`" },
          { left: "print(name)", right: "displays the value in `name`" },
          { left: "score = 8", right: "updates `score`" },
        ],
        matchPairsMid: [
          { left: "local apples = 2", right: "creates a variable" },
          { left: "local total = apples + oranges", right: "stores a calculated value" },
          { left: "print(total)", right: "shows the current value" },
          { left: "score = 8", right: "replaces an earlier value" },
        ],
        matchPairsHard: [
          { left: "local name = \"Ada\"", right: "text assignment" },
          { left: "local count = 3", right: "number assignment" },
          { left: "count = count + 1", right: "updates using the old value" },
          { left: "print(count)", right: "reads the variable" },
        ],
      };
  }
}

export function buildVariablesQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getVariablesSpec(language);
  const q = createQuestionFactory(language, concept);
  const runnable = (code: string) => wrapRunnableCode(language, code);
  const selectCode = `${spec.updateNumberCode}\n${spec.commentPrefix} keyword or type token: _____`;

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What is a variable in ${language === "csharp" ? "C#" : language === "typescript" ? "TypeScript" : language === "javascript" ? "JavaScript" : language === "rust" ? "Rust" : language === "lua" ? "Lua" : language === "java" ? "Java" : "Python"}?`,
    options: [
      "A named place that stores a value",
      "A built-in loop",
      "A comment line",
      "A function call that prints output",
    ],
    correctIndex: 0,
    explanation: "A variable gives a value a name so you can reuse it later. That is how programs store information they want to read or update.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly creates a variable named `name`?",
    options: [spec.createName, ...spec.declarationDistractors],
    correctIndex: 0,
    explanation: `The correct declaration uses this language's variable syntax. Several distractors come from other languages, which beginners often mix together.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: spec.rulePrompt,
    options: spec.ruleOptions,
    correctIndex: spec.ruleCorrectIndex,
    explanation: "Variable syntax changes from language to language. Paying attention to the required keyword or type is a common early difference.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A variable can store text or numbers.",
    correct: true,
    explanation: "Variables can hold different kinds of values such as strings and numbers. The exact syntax depends on the language, but the idea is the same.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code creates a variable named `name`.",
    code: runnable(spec.createName),
    correct: true,
    explanation: "The code gives the value a variable name so it can be reused later in the program.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.printNameCode),
    options: ["name", "Ada", "Nothing", "Error"],
    correctIndex: 1,
    correctAnswer: "Ada",
    explanation: "The output statement shows the value stored in `name`, which is Ada.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.updateNumberCode),
    options: ["5", "8", "score", "Error"],
    correctIndex: 1,
    correctAnswer: "8",
    explanation: "The second assignment replaces the old value. When the variable is displayed, the current value is 8.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable name shown in the comment.",
    code: runnable(`${spec.createName} ${spec.commentPrefix} variable name: _____`),
    correctAnswer: "name",
    explanation: "The variable being created is named `name`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the text stored in the variable.",
    code: runnable(`${spec.createName} ${spec.commentPrefix} stored text: _____`),
    correctAnswer: "Ada",
    explanation: "The line stores the text Ada in the variable. The quotes are already present in the code example when needed.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the code that creates `name` with the value Ada.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct tokens form a valid variable declaration in this language. The distractors are tokens from other syntaxes.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each variable statement to what it does.",
    pairs: spec.matchPairsBasic,
    explanation: "These pairs connect common variable actions such as creating, updating, and reading stored values.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What happens when you assign a new value to an existing variable?",
    options: [
      "The new value replaces the old one",
      "Both values stay in the same variable at once",
      "The variable becomes a comment",
      "The program always crashes",
    ],
    correctIndex: 0,
    explanation: "A variable stores its current value. Reassigning it updates what the name refers to.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why are clear variable names helpful?",
    options: [
      "They make code easier to understand",
      "They automatically fix bugs",
      "They remove the need for functions",
      "They turn strings into numbers",
    ],
    correctIndex: 0,
    explanation: "Clear names help you remember what a value represents. That becomes more important as programs grow.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "After a variable is updated, later code sees the new value.",
    correct: true,
    explanation: "Variables do not keep displaying the first value forever. Later reads use the most recent assigned value.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays the latest value stored in `score`.",
    code: runnable(spec.updateNumberCode),
    correct: true,
    explanation: "The variable is updated before it is displayed. That means the final output uses the new value.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.totalCode),
    options: ["23", "5", "total", "Error"],
    correctIndex: 1,
    correctAnswer: "5",
    explanation: "The code stores the sum in `total`, then displays that stored value.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.suffixCode),
    options: ["Ada!", "name!", "Ada", "Error"],
    correctIndex: 0,
    correctAnswer: "Ada!",
    explanation: "The stored text is combined with an exclamation mark before it is displayed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable name described by the comment.",
    code: runnable(`${spec.totalCode}\n${spec.commentPrefix} result variable: _____`),
    correctAnswer: "total",
    explanation: "The sum is stored in the variable named `total`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword or type token used in this declaration.",
    code: runnable(`${spec.createName} ${spec.commentPrefix} keyword or type token: _____`),
    correctAnswer: spec.keywordToken,
    explanation: "This language uses that keyword or type token as part of the variable declaration syntax.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the statement that displays `name`.",
    tokens: (() => {
      if (language === "python") return ["print", "(", "name", ")", "let", "return", "const"];
      if (language === "javascript" || language === "typescript") return ["console", ".", "log", "(", "name", ")", ";", "print", "return"];
      if (language === "java") return ["System.out", ".", "println", "(", "name", ")", ";", "print", "return"];
      if (language === "csharp") return ["Console", ".", "WriteLine", "(", "name", ")", ";", "print", "return"];
      if (language === "rust") return ["println!", "(", "name", ")", ";", "print", "return"];
      return ["print", "(", "name", ")", "local", "return", "const"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["print", "(", "name", ")"];
      if (language === "javascript" || language === "typescript") return ["console", ".", "log", "(", "name", ")", ";"];
      if (language === "java") return ["System.out", ".", "println", "(", "name", ")", ";"];
      if (language === "csharp") return ["Console", ".", "WriteLine", "(", "name", ")", ";"];
      if (language === "rust") return ["println!", "(", "name", ")", ";"];
      return ["print", "(", "name", ")"];
    })(),
    correctAnswer: "",
    explanation: "Reading a variable means passing its name to an expression like print or console output. That shows the stored value.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each variable line to its role.",
    pairs: spec.matchPairsMid,
    explanation: "These pairs show how variables can be created, updated, calculated, and displayed.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the correct keyword or type token for this language.",
    code: runnable(selectCode),
    options: spec.keywordOptions,
    correctIndex: spec.keywordOptions.indexOf(spec.keywordToken),
    correctAnswer: spec.keywordToken,
    explanation: "That token is part of the language's variable syntax. Similar tokens from other languages are common distractors.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why do programmers often store a calculation in a variable first?",
    options: [
      "So the result can be reused later",
      "Because calculations cannot be displayed directly",
      "Because variables automatically loop",
      "Because variables remove all syntax rules",
    ],
    correctIndex: 0,
    explanation: "A named result is easier to reuse and read later in the program. It can also make a longer expression clearer.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Which statement about variables is most accurate?",
    options: [
      "A variable name refers to its current value",
      "A variable permanently remembers every old value",
      "A variable can only store text",
      "A variable must always be printed right away",
    ],
    correctIndex: 0,
    explanation: "At any moment, a variable refers to its current stored value. Older values are replaced when reassignment happens.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A variable can be used inside a larger expression.",
    correct: true,
    explanation: "Variables are often combined with operators and function calls. They are not limited to standing alone.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code uses variables to store a result before displaying it.",
    code: runnable(spec.totalCode),
    correct: true,
    explanation: "The calculation is assigned to `total`, then displayed later. That is a common beginner pattern.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.totalCode,
    options: ["5", "6", "total", "Error"],
    correctIndex: 0,
    correctAnswer: "5",
    explanation: "The stored result in `total` is 5, so that is what the output line shows.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.suffixCode),
    options: ["Ada!", "name", "!", "Error"],
    correctIndex: 0,
    correctAnswer: "Ada!",
    explanation: "The variable's value is combined with another piece of text before it is displayed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable being read in this code.",
    code: runnable(`${spec.printNameCode}\n${spec.commentPrefix} variable being read: _____`),
    correctAnswer: "name",
    explanation: "The output line reads the variable named `name`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the keyword or type token used in the declaration.",
    code: runnable(`${spec.createNumber} ${spec.commentPrefix} keyword or type token: _____`),
    correctAnswer: spec.keywordToken,
    explanation: "This language uses that token as part of the declaration syntax for variables.",
  });
  const hardWordBankCorrect = (() => {
    if (language === "python") return ["total", "=", "5"];
    if (language === "javascript" || language === "typescript") return ["let", "total", "=", "5", ";"];
    if (language === "java") return ["int", "total", "=", "5", ";"];
    if (language === "csharp") return ["int", "total", "=", "5", ";"];
    if (language === "rust") return ["let", "total", "=", "5", ";"];
    return ["local", "total", "=", "5"];
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the code that stores 5 in `total`.",
    tokens: [...hardWordBankCorrect, "print", "return", "const"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "The correct tokens create a variable named `total` and store the number 5 in it.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each variable pattern to what it means.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show common ways variables are assigned, updated, and read later.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the correct keyword or type token used with variables.",
    code: runnable(`${spec.totalCode}\n${spec.commentPrefix} declaration token: _____`),
    options: spec.keywordOptions,
    correctIndex: spec.keywordOptions.indexOf(spec.keywordToken),
    correctAnswer: spec.keywordToken,
    explanation: "That token belongs to this language's variable syntax. The other options come from different languages or contexts.",
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
