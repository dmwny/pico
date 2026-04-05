import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

type FunctionsSpec = {
  definitionHeader: string;
  definitionDistractors: string[];
  commentPrefix: string;
  functionName: string;
  parameterName: string;
  returnKeyword: string;
  callCode: string;
  callOutput: string;
  returnCode: string;
  returnOutput: string;
  reuseCode: string;
  reuseOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  fillSelectOptions: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getFunctionsSpec(language: LearningLanguage): FunctionsSpec {
  switch (language) {
    case "python":
      return {
        definitionHeader: "def greet(name):",
        definitionDistractors: ["function greet(name) {", "fn greet(name) {", "greet(name) =>"],
        commentPrefix: "#",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "def greet(name):\n    print('Hi ' + name)\n\ngreet('Ada')",
        callOutput: "Hi Ada",
        returnCode: "def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
        returnOutput: "5",
        reuseCode: "def greet(name):\n    print('Hi ' + name)\n\ngreet('Ada')\ngreet('Ben')",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["def", "greet", "(", "name", ")", ":", "function", "return"],
        wordBankCorrect: ["def", "greet", "(", "name", ")", ":"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "def", right: "starts a function definition" },
          { left: "name", right: "parameter" },
          { left: "greet('Ada')", right: "function call" },
          { left: "return a + b", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "function name" },
          { left: "name", right: "input to the function" },
          { left: "print('Hi ' + name)", right: "function body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b", right: "produces a result" },
          { left: "greet('Ada')", right: "reuses the function" },
          { left: "def add(a, b):", right: "defines parameters" },
          { left: "print(add(2, 3))", right: "shows the returned value" },
        ],
      };
    case "javascript":
      return {
        definitionHeader: "function greet(name) {",
        definitionDistractors: ["def greet(name):", "fn greet(name) {", "greet(name) => {"],
        commentPrefix: "//",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "function greet(name) {\n  console.log('Hi ' + name);\n}\n\ngreet('Ada');",
        callOutput: "Hi Ada",
        returnCode: "function add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(2, 3));",
        returnOutput: "5",
        reuseCode: "function greet(name) {\n  console.log('Hi ' + name);\n}\n\ngreet('Ada');\ngreet('Ben');",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["function", "greet", "(", "name", ")", "{", "def", "return"],
        wordBankCorrect: ["function", "greet", "(", "name", ")", "{"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "function", right: "starts a function definition" },
          { left: "name", right: "parameter" },
          { left: "greet('Ada');", right: "function call" },
          { left: "return a + b;", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "function name" },
          { left: "name", right: "input to the function" },
          { left: "console.log('Hi ' + name);", right: "function body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b;", right: "produces a result" },
          { left: "greet('Ada');", right: "reuses the function" },
          { left: "function add(a, b) {", right: "defines parameters" },
          { left: "console.log(add(2, 3));", right: "shows the returned value" },
        ],
      };
    case "typescript":
      return {
        definitionHeader: "function greet(name: string): void {",
        definitionDistractors: ["def greet(name):", "fn greet(name) {", "String greet(name) {"],
        commentPrefix: "//",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "function greet(name: string): void {\n  console.log('Hi ' + name);\n}\n\ngreet('Ada');",
        callOutput: "Hi Ada",
        returnCode: "function add(a: number, b: number): number {\n  return a + b;\n}\n\nconsole.log(add(2, 3));",
        returnOutput: "5",
        reuseCode: "function greet(name: string): void {\n  console.log('Hi ' + name);\n}\n\ngreet('Ada');\ngreet('Ben');",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["function", "greet", "(", "name", ":", "string", ")", ":", "void", "{", "def"],
        wordBankCorrect: ["function", "greet", "(", "name", ":", "string", ")", ":", "void", "{"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "function", right: "starts a function definition" },
          { left: "name: string", right: "typed parameter" },
          { left: "greet('Ada');", right: "function call" },
          { left: "return a + b;", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "function name" },
          { left: "name", right: "input to the function" },
          { left: "console.log('Hi ' + name);", right: "function body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b;", right: "produces a result" },
          { left: "greet('Ada');", right: "reuses the function" },
          { left: "function add(a: number, b: number): number {", right: "defines parameters and a return type" },
          { left: "console.log(add(2, 3));", right: "shows the returned value" },
        ],
      };
    case "java":
      return {
        definitionHeader: "public static void greet(String name) {",
        definitionDistractors: ["def greet(name):", "function greet(name) {", "fn greet(name: String) {"],
        commentPrefix: "//",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "public class Main {\n  public static void greet(String name) {\n    System.out.println(\"Hi \" + name);\n  }\n\n  public static void main(String[] args) {\n    greet(\"Ada\");\n  }\n}",
        callOutput: "Hi Ada",
        returnCode: "public class Main {\n  public static int add(int a, int b) {\n    return a + b;\n  }\n\n  public static void main(String[] args) {\n    System.out.println(add(2, 3));\n  }\n}",
        returnOutput: "5",
        reuseCode: "public class Main {\n  public static void greet(String name) {\n    System.out.println(\"Hi \" + name);\n  }\n\n  public static void main(String[] args) {\n    greet(\"Ada\");\n    greet(\"Ben\");\n  }\n}",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["public", "static", "void", "greet", "(", "String", "name", ")", "{", "def"],
        wordBankCorrect: ["public", "static", "void", "greet", "(", "String", "name", ")", "{"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "public static void", right: "starts a method definition" },
          { left: "String name", right: "parameter" },
          { left: "greet(\"Ada\");", right: "method call" },
          { left: "return a + b;", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "method name" },
          { left: "name", right: "input to the method" },
          { left: "System.out.println(\"Hi \" + name);", right: "method body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b;", right: "produces a result" },
          { left: "greet(\"Ada\");", right: "reuses the method" },
          { left: "public static int add(int a, int b) {", right: "defines parameters and a return type" },
          { left: "System.out.println(add(2, 3));", right: "shows the returned value" },
        ],
      };
    case "csharp":
      return {
        definitionHeader: "static void Greet(string name) {",
        definitionDistractors: ["def greet(name):", "function greet(name) {", "fn greet(name) {"],
        commentPrefix: "//",
        functionName: "Greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "class Program {\n    static void Greet(string name) {\n        Console.WriteLine(\"Hi \" + name);\n    }\n\n    static void Main() {\n        Greet(\"Ada\");\n    }\n}",
        callOutput: "Hi Ada",
        returnCode: "class Program {\n    static int Add(int a, int b) {\n        return a + b;\n    }\n\n    static void Main() {\n        Console.WriteLine(Add(2, 3));\n    }\n}",
        returnOutput: "5",
        reuseCode: "class Program {\n    static void Greet(string name) {\n        Console.WriteLine(\"Hi \" + name);\n    }\n\n    static void Main() {\n        Greet(\"Ada\");\n        Greet(\"Ben\");\n    }\n}",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["static", "void", "Greet", "(", "string", "name", ")", "{", "def"],
        wordBankCorrect: ["static", "void", "Greet", "(", "string", "name", ")", "{"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "static void", right: "starts a method definition" },
          { left: "string name", right: "parameter" },
          { left: "Greet(\"Ada\");", right: "method call" },
          { left: "return a + b;", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "Greet", right: "method name" },
          { left: "name", right: "input to the method" },
          { left: "Console.WriteLine(\"Hi \" + name);", right: "method body action" },
          { left: "Add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b;", right: "produces a result" },
          { left: "Greet(\"Ada\");", right: "reuses the method" },
          { left: "static int Add(int a, int b) {", right: "defines parameters and a return type" },
          { left: "Console.WriteLine(Add(2, 3));", right: "shows the returned value" },
        ],
      };
    case "rust":
      return {
        definitionHeader: "fn greet(name: &str) {",
        definitionDistractors: ["def greet(name):", "function greet(name) {", "public static void greet(String name) {"],
        commentPrefix: "//",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "fn greet(name: &str) {\n    println!(\"Hi {}\", name);\n}\n\nfn main() {\n    greet(\"Ada\");\n}",
        callOutput: "Hi Ada",
        returnCode: "fn add(a: i32, b: i32) -> i32 {\n    return a + b;\n}\n\nfn main() {\n    println!(\"{}\", add(2, 3));\n}",
        returnOutput: "5",
        reuseCode: "fn greet(name: &str) {\n    println!(\"Hi {}\", name);\n}\n\nfn main() {\n    greet(\"Ada\");\n    greet(\"Ben\");\n}",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["fn", "greet", "(", "name", ":", "&str", ")", "{", "def"],
        wordBankCorrect: ["fn", "greet", "(", "name", ":", "&str", ")", "{"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "fn", right: "starts a function definition" },
          { left: "name: &str", right: "parameter" },
          { left: "greet(\"Ada\");", right: "function call" },
          { left: "return a + b;", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "function name" },
          { left: "name", right: "input to the function" },
          { left: "println!(\"Hi {}\", name);", right: "function body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b;", right: "produces a result" },
          { left: "greet(\"Ada\");", right: "reuses the function" },
          { left: "fn add(a: i32, b: i32) -> i32 {", right: "defines parameters and a return type" },
          { left: "println!(\"{}\", add(2, 3));", right: "shows the returned value" },
        ],
      };
    case "lua":
      return {
        definitionHeader: "function greet(name)",
        definitionDistractors: ["def greet(name):", "function greet(name) {", "fn greet(name) {"],
        commentPrefix: "--",
        functionName: "greet",
        parameterName: "name",
        returnKeyword: "return",
        callCode: "function greet(name)\n  print(\"Hi \" .. name)\nend\n\ngreet(\"Ada\")",
        callOutput: "Hi Ada",
        returnCode: "function add(a, b)\n  return a + b\nend\n\nprint(add(2, 3))",
        returnOutput: "5",
        reuseCode: "function greet(name)\n  print(\"Hi \" .. name)\nend\n\ngreet(\"Ada\")\ngreet(\"Ben\")",
        reuseOutput: "Hi Ada\nHi Ben",
        wordBankTokens: ["function", "greet", "(", "name", ")", "end", "def", "return"],
        wordBankCorrect: ["function", "greet", "(", "name", ")"],
        fillSelectOptions: ["return", "print", "loop", "range"],
        matchPairsBasic: [
          { left: "function", right: "starts a function definition" },
          { left: "name", right: "parameter" },
          { left: "greet(\"Ada\")", right: "function call" },
          { left: "return a + b", right: "sends a value back" },
        ],
        matchPairsMid: [
          { left: "greet", right: "function name" },
          { left: "name", right: "input to the function" },
          { left: "print(\"Hi \" .. name)", right: "function body action" },
          { left: "add(2, 3)", right: "call with arguments" },
        ],
        matchPairsHard: [
          { left: "return a + b", right: "produces a result" },
          { left: "greet(\"Ada\")", right: "reuses the function" },
          { left: "function add(a, b)", right: "defines parameters" },
          { left: "print(add(2, 3))", right: "shows the returned value" },
        ],
      };
  }
}

export function buildFunctionsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getFunctionsSpec(language);
  const q = createQuestionFactory(language, concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What is a function?",
    options: [
      "A reusable block of code",
      "A type of comment",
      "A way to name an array index",
      "A loop that always counts forever",
    ],
    correctIndex: 0,
    explanation: "A function groups code into a reusable action. You can call it whenever you need that behavior again.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly starts a function definition in this language?",
    options: [spec.definitionHeader, ...spec.definitionDistractors],
    correctIndex: 0,
    explanation: "Function syntax changes a lot across languages. Mixing `def`, `function`, `fn`, and typed method headers is a common beginner mistake.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What is a parameter?",
    options: [
      "A named input to a function",
      "The output printed by the function",
      "A loop condition",
      "A comment after the code",
    ],
    correctIndex: 0,
    explanation: "A parameter is a named input that the function can use inside its body.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A function can be defined once and called later.",
    correct: true,
    explanation: "That is the main reason functions are useful. You define the behavior once, then reuse it as needed.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `Hi Ada`.",
    code: spec.callCode,
    correct: true,
    explanation: "The function is defined and then called with Ada, so the output shows the greeting for that argument.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.callCode,
    options: [spec.callOutput, "Ada", "greet", "error"],
    correctIndex: 0,
    correctAnswer: spec.callOutput,
    explanation: "Calling the function runs its body with the provided argument, producing the greeting.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.returnCode,
    options: [spec.returnOutput, "2 + 3", "add", "error"],
    correctIndex: 0,
    correctAnswer: spec.returnOutput,
    explanation: "The function returns the sum, and the outer output line shows that returned value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the function name shown in the comment.",
    code: `${spec.callCode}\n${spec.commentPrefix} function name: _____`,
    correctAnswer: spec.functionName,
    explanation: `The function being defined and called here is named \`${spec.functionName}\`.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the parameter name shown in the comment.",
    code: `${spec.callCode}\n${spec.commentPrefix} parameter name: _____`,
    correctAnswer: spec.parameterName,
    explanation: `The function receives input through the parameter named \`${spec.parameterName}\`.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the start of the function definition.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct tokens build the opening of a valid function definition for this language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each function piece to its role.",
    pairs: spec.matchPairsBasic,
    explanation: "These pieces show the difference between defining a function, giving it input, calling it, and returning a value.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why are parameters useful?",
    options: [
      "They let one function work with different inputs",
      "They turn functions into loops",
      "They remove the need for return values",
      "They automatically print output",
    ],
    correctIndex: 0,
    explanation: "Parameters make functions flexible. The same function can behave differently depending on the input you pass in.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What does `return` do in a function?",
    options: [
      "Sends a value back to the caller",
      "Starts a new loop",
      "Declares a parameter",
      "Turns output into a comment",
    ],
    correctIndex: 0,
    explanation: "`return` sends a result back from the function so other code can use it.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "A function with parameters can be called with different arguments at different times.",
    correct: true,
    explanation: "That is what makes functions reusable. The same definition can process many different inputs.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code uses a returned value and displays 5.",
    code: spec.returnCode,
    correct: true,
    explanation: "The `add` function returns a result, and the outer output statement displays that result.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.returnCode,
    options: [spec.returnOutput, "23", "add", "error"],
    correctIndex: 0,
    correctAnswer: spec.returnOutput,
    explanation: "The return value is the result of adding the two arguments, so the output is 5.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.reuseCode,
    options: [spec.reuseOutput, spec.callOutput, "Hi Ada\nAda", "error"],
    correctIndex: 0,
    correctAnswer: spec.reuseOutput,
    explanation: "The function is called twice with different arguments, so it produces two lines of output.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword that sends a value back from the function.",
    code: `${spec.returnCode}\n${spec.commentPrefix} value-sending keyword: _____`,
    correctAnswer: spec.returnKeyword,
    explanation: `The keyword is \`${spec.returnKeyword}\`, which sends a value back to the caller.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the function name that gets called more than once.",
    code: `${spec.reuseCode}\n${spec.commentPrefix} reused function name: _____`,
    correctAnswer: spec.functionName,
    explanation: "The same function is called multiple times, which is one of the main benefits of functions.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the function call that passes Ada as an argument.",
    tokens: (() => {
      if (language === "python") return ["greet", "(", "'Ada'", ")", "print", "return", "def"];
      if (language === "javascript" || language === "typescript") return ["greet", "(", "'Ada'", ")", ";", "print", "return"];
      if (language === "java") return ["greet", "(", "\"Ada\"", ")", ";", "print", "return"];
      if (language === "csharp") return ["Greet", "(", "\"Ada\"", ")", ";", "print", "return"];
      if (language === "rust") return ["greet", "(", "\"Ada\"", ")", ";", "print", "return"];
      return ["greet", "(", "\"Ada\"", ")", "print", "return", "def"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["greet", "(", "'Ada'", ")"];
      if (language === "javascript" || language === "typescript") return ["greet", "(", "'Ada'", ")", ";"];
      if (language === "java") return ["greet", "(", "\"Ada\"", ")", ";"];
      if (language === "csharp") return ["Greet", "(", "\"Ada\"", ")", ";"];
      if (language === "rust") return ["greet", "(", "\"Ada\"", ")", ";"];
      return ["greet", "(", "\"Ada\"", ")"];
    })(),
    correctAnswer: "",
    explanation: "A function call uses the function name plus parentheses with an argument inside.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each function part to what it means.",
    pairs: spec.matchPairsMid,
    explanation: "These pairs highlight the function name, parameter, body, and a call with arguments.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the keyword that sends a result back from a function.",
    code: `${spec.returnCode}\n${spec.commentPrefix} value-sending keyword: _____`,
    options: spec.fillSelectOptions,
    correctIndex: spec.fillSelectOptions.indexOf(spec.returnKeyword),
    correctAnswer: spec.returnKeyword,
    explanation: `The correct keyword is \`${spec.returnKeyword}\`, which is used to send a result back from the function.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why is returning a value often more flexible than printing inside a function?",
    options: [
      "The caller can decide what to do with the result",
      "Return values automatically create loops",
      "Printed values can be reused more easily than returned ones",
      "Return removes the need for parameters",
    ],
    correctIndex: 0,
    explanation: "A returned value can be stored, printed, or used in a larger expression. That gives the caller more control.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the benefit of calling the same function more than once?",
    options: [
      "You reuse the same logic without rewriting it",
      "You convert it into a variable",
      "You remove all parameters",
      "You make the function stop existing",
    ],
    correctIndex: 0,
    explanation: "Functions help avoid repeating the same code. You define the logic once and reuse it with different inputs.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A returned value can be passed into an output statement.",
    correct: true,
    explanation: "That is a common pattern: call a function, get its returned value, then print or otherwise use that result.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code calls the same function twice with different arguments.",
    code: spec.reuseCode,
    correct: true,
    explanation: "The two calls reuse the same function definition while changing the input value.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.reuseCode,
    options: [spec.reuseOutput, spec.callOutput, "Ada\nBen", "error"],
    correctIndex: 0,
    correctAnswer: spec.reuseOutput,
    explanation: "Each function call runs the same body with a different argument, so you get two greeting lines.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.returnCode,
    options: [spec.returnOutput, "2\n3", "a + b", "error"],
    correctIndex: 0,
    correctAnswer: spec.returnOutput,
    explanation: "The returned result is 5, and the outer output statement shows that final value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the parameter name used by this function.",
    code: `${spec.reuseCode}\n${spec.commentPrefix} parameter name: _____`,
    correctAnswer: spec.parameterName,
    explanation: "The function receives input through the parameter named in its definition.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the function name that returns a value.",
    code: `${spec.returnCode}\n${spec.commentPrefix} function name: _____`,
    correctAnswer: language === "csharp" ? "Add" : "add",
    explanation: "That function computes a value and sends it back with `return`.",
  });
  const hardWordBankCorrect = (() => {
    if (language === "python") return ["return", "a", "+", "b"];
    return ["return", "a", "+", "b", language === "lua" ? "" : ";"].filter(Boolean);
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the line that returns the sum of `a` and `b`.",
    tokens: [...hardWordBankCorrect, "print", "loop", "range"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "A return statement sends the computed result back to the caller.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each function pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show definition details, returning values, reuse, and displaying a returned result.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the keyword that sends a result back from the function.",
    code: `${spec.returnCode}\n${spec.commentPrefix} value-sending keyword: _____`,
    options: spec.fillSelectOptions,
    correctIndex: spec.fillSelectOptions.indexOf(spec.returnKeyword),
    correctAnswer: spec.returnKeyword,
    explanation: `The correct keyword is \`${spec.returnKeyword}\`. It lets the function produce a value for the caller.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
