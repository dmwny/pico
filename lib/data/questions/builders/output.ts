import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion, wrapRunnableCode } from "../builderUtils";

type OutputSpec = {
  displayName: string;
  callableKind: string;
  callableToken: string;
  ownerToken?: string;
  helloCall: string;
  numberCall: string;
  exprCall: string;
  variableCall: string;
  totalCall: string;
  bonusPrompt: string;
  declarationDistractors: string[];
  commentPrefix: string;
  stringLiteral: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getOutputSpec(language: LearningLanguage): OutputSpec {
  switch (language) {
    case "python":
      return {
        displayName: "print()",
        callableKind: "function",
        callableToken: "print",
        helloCall: "print('Hello')",
        numberCall: "print(7)",
        exprCall: "print(3 + 4)",
        variableCall: "name = 'Ada'\nprint(name)",
        totalCall: "apples = 2\noranges = 3\nprint(apples + oranges)",
        bonusPrompt: "Which token is the Python function name in `print('Hello')`?",
        declarationDistractors: ["console.log('Hello');", "System.out.println(\"Hello\");", "Console.WriteLine(\"Hello\");"],
        commentPrefix: "#",
        stringLiteral: "'Hello'",
        wordBankTokens: ["print", "(", "'Hello'", ")", "input", "range", "name"],
        wordBankCorrect: ["print", "(", "'Hello'", ")"],
        matchPairsBasic: [
          { left: "print('Hi')", right: "Hi" },
          { left: "print(5)", right: "5" },
          { left: "print(True)", right: "True" },
          { left: "print(2 + 3)", right: "5" },
        ],
        matchPairsMid: [
          { left: "print('Ada')", right: "prints text" },
          { left: "print(9)", right: "prints a number" },
          { left: "print(score)", right: "prints a variable's value" },
          { left: "print(a + b)", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: "print('x')", right: "shows a string" },
          { left: "print(total)", right: "shows a stored value" },
          { left: "print(8 - 3)", right: "shows calculated output" },
          { left: "print(False)", right: "shows a boolean value" },
        ],
      };
    case "javascript":
      return {
        displayName: "console.log()",
        callableKind: "method",
        callableToken: "log",
        ownerToken: "console",
        helloCall: "console.log('Hello');",
        numberCall: "console.log(7);",
        exprCall: "console.log(3 + 4);",
        variableCall: "const name = 'Ada';\nconsole.log(name);",
        totalCall: "const apples = 2;\nconst oranges = 3;\nconsole.log(apples + oranges);",
        bonusPrompt: "Which token is the JavaScript method name in `console.log('Hello');`?",
        declarationDistractors: ["print('Hello')", "System.out.println(\"Hello\");", "Console.WriteLine(\"Hello\");"],
        commentPrefix: "//",
        stringLiteral: "'Hello'",
        wordBankTokens: ["console", ".", "log", "(", "'Hello'", ")", ";", "print", "alert"],
        wordBankCorrect: ["console", ".", "log", "(", "'Hello'", ")", ";"],
        matchPairsBasic: [
          { left: "console.log('Hi');", right: "Hi" },
          { left: "console.log(5);", right: "5" },
          { left: "console.log(true);", right: "true" },
          { left: "console.log(2 + 3);", right: "5" },
        ],
        matchPairsMid: [
          { left: "console.log('Ada');", right: "prints text" },
          { left: "console.log(9);", right: "prints a number" },
          { left: "console.log(score);", right: "prints a variable's value" },
          { left: "console.log(a + b);", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: "console.log('x');", right: "shows a string" },
          { left: "console.log(total);", right: "shows a stored value" },
          { left: "console.log(8 - 3);", right: "shows calculated output" },
          { left: "console.log(false);", right: "shows a boolean value" },
        ],
      };
    case "typescript":
      return {
        displayName: "console.log()",
        callableKind: "method",
        callableToken: "log",
        ownerToken: "console",
        helloCall: "console.log('Hello');",
        numberCall: "console.log(7);",
        exprCall: "console.log(3 + 4);",
        variableCall: "const name: string = 'Ada';\nconsole.log(name);",
        totalCall: "const apples: number = 2;\nconst oranges: number = 3;\nconsole.log(apples + oranges);",
        bonusPrompt: "Which token is the TypeScript method name in `console.log('Hello');`?",
        declarationDistractors: ["print('Hello')", "System.out.println(\"Hello\");", "Console.WriteLine(\"Hello\");"],
        commentPrefix: "//",
        stringLiteral: "'Hello'",
        wordBankTokens: ["console", ".", "log", "(", "'Hello'", ")", ";", "print", "alert"],
        wordBankCorrect: ["console", ".", "log", "(", "'Hello'", ")", ";"],
        matchPairsBasic: [
          { left: "console.log('Hi');", right: "Hi" },
          { left: "console.log(5);", right: "5" },
          { left: "console.log(true);", right: "true" },
          { left: "console.log(2 + 3);", right: "5" },
        ],
        matchPairsMid: [
          { left: "console.log('Ada');", right: "prints text" },
          { left: "console.log(9);", right: "prints a number" },
          { left: "console.log(score);", right: "prints a variable's value" },
          { left: "console.log(a + b);", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: "console.log('x');", right: "shows a string" },
          { left: "console.log(total);", right: "shows a stored value" },
          { left: "console.log(8 - 3);", right: "shows calculated output" },
          { left: "console.log(false);", right: "shows a boolean value" },
        ],
      };
    case "java":
      return {
        displayName: "System.out.println()",
        callableKind: "method",
        callableToken: "println",
        ownerToken: "System.out",
        helloCall: 'System.out.println("Hello");',
        numberCall: "System.out.println(7);",
        exprCall: "System.out.println(3 + 4);",
        variableCall: 'String name = "Ada";\nSystem.out.println(name);',
        totalCall: "int apples = 2;\nint oranges = 3;\nSystem.out.println(apples + oranges);",
        bonusPrompt: 'Which token is the Java method name in `System.out.println("Hello");`?',
        declarationDistractors: ["print(\"Hello\");", "console.log('Hello');", "Console.WriteLine(\"Hello\");"],
        commentPrefix: "//",
        stringLiteral: "\"Hello\"",
        wordBankTokens: ["System.out", ".", "println", "(", "\"Hello\"", ")", ";", "print", "console"],
        wordBankCorrect: ["System.out", ".", "println", "(", "\"Hello\"", ")", ";"],
        matchPairsBasic: [
          { left: 'System.out.println("Hi");', right: "Hi" },
          { left: "System.out.println(5);", right: "5" },
          { left: "System.out.println(true);", right: "true" },
          { left: "System.out.println(2 + 3);", right: "5" },
        ],
        matchPairsMid: [
          { left: 'System.out.println("Ada");', right: "prints text" },
          { left: "System.out.println(9);", right: "prints a number" },
          { left: "System.out.println(score);", right: "prints a variable's value" },
          { left: "System.out.println(a + b);", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: 'System.out.println("x");', right: "shows a string" },
          { left: "System.out.println(total);", right: "shows a stored value" },
          { left: "System.out.println(8 - 3);", right: "shows calculated output" },
          { left: "System.out.println(false);", right: "shows a boolean value" },
        ],
      };
    case "csharp":
      return {
        displayName: "Console.WriteLine()",
        callableKind: "method",
        callableToken: "WriteLine",
        ownerToken: "Console",
        helloCall: 'Console.WriteLine("Hello");',
        numberCall: "Console.WriteLine(7);",
        exprCall: "Console.WriteLine(3 + 4);",
        variableCall: 'string name = "Ada";\nConsole.WriteLine(name);',
        totalCall: "int apples = 2;\nint oranges = 3;\nConsole.WriteLine(apples + oranges);",
        bonusPrompt: 'Which token is the C# method name in `Console.WriteLine("Hello");`?',
        declarationDistractors: ["print(\"Hello\");", "console.log('Hello');", "System.out.println(\"Hello\");"],
        commentPrefix: "//",
        stringLiteral: "\"Hello\"",
        wordBankTokens: ["Console", ".", "WriteLine", "(", "\"Hello\"", ")", ";", "print", "log"],
        wordBankCorrect: ["Console", ".", "WriteLine", "(", "\"Hello\"", ")", ";"],
        matchPairsBasic: [
          { left: 'Console.WriteLine("Hi");', right: "Hi" },
          { left: "Console.WriteLine(5);", right: "5" },
          { left: "Console.WriteLine(true);", right: "True" },
          { left: "Console.WriteLine(2 + 3);", right: "5" },
        ],
        matchPairsMid: [
          { left: 'Console.WriteLine("Ada");', right: "prints text" },
          { left: "Console.WriteLine(9);", right: "prints a number" },
          { left: "Console.WriteLine(score);", right: "prints a variable's value" },
          { left: "Console.WriteLine(a + b);", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: 'Console.WriteLine("x");', right: "shows a string" },
          { left: "Console.WriteLine(total);", right: "shows a stored value" },
          { left: "Console.WriteLine(8 - 3);", right: "shows calculated output" },
          { left: "Console.WriteLine(false);", right: "shows a boolean value" },
        ],
      };
    case "rust":
      return {
        displayName: "println!()",
        callableKind: "macro",
        callableToken: "println!",
        helloCall: 'println!("Hello");',
        numberCall: "println!(\"{}\", 7);",
        exprCall: "println!(\"{}\", 3 + 4);",
        variableCall: 'let name = "Ada";\nprintln!("{}", name);',
        totalCall: "let apples = 2;\nlet oranges = 3;\nprintln!(\"{}\", apples + oranges);",
        bonusPrompt: 'Which token is the Rust macro name in `println!("Hello");`?',
        declarationDistractors: ["print(\"Hello\");", "console.log('Hello');", "println(\"Hello\");"],
        commentPrefix: "//",
        stringLiteral: "\"Hello\"",
        wordBankTokens: ["println!", "(", "\"Hello\"", ")", ";", "print", "log"],
        wordBankCorrect: ["println!", "(", "\"Hello\"", ")", ";"],
        matchPairsBasic: [
          { left: 'println!("Hi");', right: "Hi" },
          { left: "println!(\"{}\", 5);", right: "5" },
          { left: "println!(\"{}\", true);", right: "true" },
          { left: "println!(\"{}\", 2 + 3);", right: "5" },
        ],
        matchPairsMid: [
          { left: 'println!("Ada");', right: "prints text" },
          { left: "println!(\"{}\", 9);", right: "prints a number" },
          { left: "println!(\"{}\", score);", right: "prints a variable's value" },
          { left: "println!(\"{}\", a + b);", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: 'println!("x");', right: "shows a string" },
          { left: "println!(\"{}\", total);", right: "shows a stored value" },
          { left: "println!(\"{}\", 8 - 3);", right: "shows calculated output" },
          { left: "println!(\"{}\", false);", right: "shows a boolean value" },
        ],
      };
    case "lua":
      return {
        displayName: "print()",
        callableKind: "function",
        callableToken: "print",
        helloCall: 'print("Hello")',
        numberCall: "print(7)",
        exprCall: "print(3 + 4)",
        variableCall: 'local name = "Ada"\nprint(name)',
        totalCall: "local apples = 2\nlocal oranges = 3\nprint(apples + oranges)",
        bonusPrompt: 'Which token is the Lua function name in `print("Hello")`?',
        declarationDistractors: ["console.log('Hello');", "System.out.println(\"Hello\");", "Console.WriteLine(\"Hello\");"],
        commentPrefix: "--",
        stringLiteral: "\"Hello\"",
        wordBankTokens: ["print", "(", "\"Hello\"", ")", "local", "console", "log"],
        wordBankCorrect: ["print", "(", "\"Hello\"", ")"],
        matchPairsBasic: [
          { left: 'print("Hi")', right: "Hi" },
          { left: "print(5)", right: "5" },
          { left: "print(true)", right: "true" },
          { left: "print(2 + 3)", right: "5" },
        ],
        matchPairsMid: [
          { left: 'print("Ada")', right: "prints text" },
          { left: "print(9)", right: "prints a number" },
          { left: "print(score)", right: "prints a variable's value" },
          { left: "print(a + b)", right: "prints an expression result" },
        ],
        matchPairsHard: [
          { left: 'print("x")', right: "shows a string" },
          { left: "print(total)", right: "shows a stored value" },
          { left: "print(8 - 3)", right: "shows calculated output" },
          { left: "print(false)", right: "shows a boolean value" },
        ],
      };
  }
}

export function buildOutputQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getOutputSpec(language);
  const q = createQuestionFactory(language, concept);
  const ownerOrCallable = spec.ownerToken ?? "output";
  const runnable = (code: string) => wrapRunnableCode(language, code);
  const fnExample = spec.helloCall;
  const commentCode = `${fnExample} ${spec.commentPrefix} ${spec.callableKind} name: _____`;
  const stringFillCode = fnExample.replace(spec.stringLiteral, spec.stringLiteral.replace("Hello", "_____"));
  const fillSelectCode = `${spec.variableCall}\n${spec.commentPrefix} choose the output ${spec.callableKind}: _____`;
  const fillSelectOptions = [spec.callableToken, "print", "input", "return"].filter((option, index, all) => all.indexOf(option) === index).slice(0, 4);
  if (!fillSelectOptions.includes(spec.callableToken)) {
    fillSelectOptions[0] = spec.callableToken;
  }

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What does ${spec.displayName} do in ${language === "typescript" ? "TypeScript" : language === "javascript" ? "JavaScript" : language === "csharp" ? "C#" : language === "rust" ? "Rust" : language === "lua" ? "Lua" : language === "java" ? "Java" : "Python"}?`,
    options: [
      "Shows a value as output",
      "Creates a loop",
      "Stores a value in memory",
      "Checks whether a condition is true",
    ],
    correctIndex: 0,
    explanation: `${spec.displayName} is used to show output. It displays the value you pass in rather than storing or repeating code.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly displays the word Hello?",
    options: [spec.helloCall, ...spec.declarationDistractors],
    correctIndex: 0,
    explanation: `${spec.helloCall} uses the correct ${spec.callableKind} syntax for this language. Several distractors are valid in other languages, which is a common beginner mix-up.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: spec.bonusPrompt,
    options: [spec.callableToken, ownerOrCallable, spec.stringLiteral, "output"],
    correctIndex: 0,
    explanation: `The ${spec.callableKind} name is the part you call to produce output. In ${language === "rust" ? "Rust" : "this language"}, that token is \`${spec.callableToken}\`.`,
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A string literal usually needs quotes when you want to display text output.",
    correct: true,
    explanation: "Quotes tell the language that the value is text. Without quotes, many languages treat the word as a variable name instead.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays the number 7.",
    code: runnable(spec.numberCall),
    correct: true,
    explanation: "The code sends the number directly to the output call. Numbers do not need quotes when you print or log them.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.helloCall),
    options: ["Hello", spec.stringLiteral, "Nothing", "Error"],
    correctIndex: 0,
    correctAnswer: "Hello",
    explanation: `The output system shows the text value itself, not the quote marks around the string literal.`,
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.exprCall),
    options: ["34", "7", "3 + 4", "Error"],
    correctIndex: 1,
    correctAnswer: "7",
    explanation: "The expression is evaluated first, then the result is displayed. Output functions show final values, not the unevaluated math expression.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: `Type the missing ${spec.callableKind} name.`,
    code: runnable(commentCode),
    correctAnswer: spec.callableToken,
    explanation: `The missing token is \`${spec.callableToken}\`, which is the ${spec.callableKind} used for output in this language.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the missing text inside the string literal.",
    code: runnable(stringFillCode),
    correctAnswer: "Hello",
    explanation: "The blank sits inside an already quoted string, so you only type the text itself.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the code that displays Hello.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: `This builds the standard output statement for the language. The extra tokens are distractors from other ideas or other languages.`,
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each output statement to what it shows.",
    pairs: spec.matchPairsBasic,
    explanation: "Each output call shows the final value it receives. Matching these pairs helps separate strings, numbers, booleans, and expressions.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What can you pass into an output call besides a plain string?",
    options: [
      "Expressions and variables",
      "Only single words",
      "Only comments",
      "Only loop headers",
    ],
    correctIndex: 0,
    explanation: "Output calls can display evaluated expressions and stored variables, not just text literals.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: `Why is ${spec.displayName} useful while learning to code?`,
    options: [
      "It lets you check what your code is producing",
      "It automatically fixes syntax errors",
      "It turns loops into functions",
      "It declares variables for you",
    ],
    correctIndex: 0,
    explanation: "Seeing output helps you verify whether values and expressions are doing what you expect. That is why printing is one of the first debugging tools beginners learn.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "If you pass a variable to an output call, the displayed value comes from what the variable currently stores.",
    correct: true,
    explanation: "Output uses the variable's current value at that moment. If the variable changes later, future output can change too.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays the value stored in `name`.",
    code: runnable(spec.variableCall),
    correct: true,
    explanation: "The variable is assigned first, then passed to the output call. The screen shows the stored string rather than the variable name itself.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.variableCall),
    options: ["name", "Ada", spec.stringLiteral, "Nothing"],
    correctIndex: 1,
    correctAnswer: "Ada",
    explanation: "The variable stores the text Ada, so that stored value is what gets displayed.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.totalCall),
    options: ["23", "5", "apples + oranges", "Error"],
    correctIndex: 1,
    correctAnswer: "5",
    explanation: "The two variables are added first, and the output call shows the sum.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the missing identifier shown in the comment.",
    code: runnable(`${spec.variableCall}\n${spec.commentPrefix} stored variable: _____`),
    correctAnswer: "name",
    explanation: "The code stores the text in a variable named `name`, then displays that variable.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: `Type the missing ${spec.callableKind} name.`,
    code: runnable(`${spec.totalCall}\n${spec.commentPrefix} output ${spec.callableKind}: _____`),
    correctAnswer: spec.callableToken,
    explanation: `The same output ${spec.callableKind} is still used even when you print a calculated value.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the code that displays the value of `name`.",
    tokens: [...spec.wordBankCorrect.slice(0, -2), "name", ...spec.wordBankCorrect.slice(-2), "input", "return"],
    correctTokens: (() => {
      if (language === "javascript" || language === "typescript") {
        return ["console", ".", "log", "(", "name", ")", ";"];
      }
      if (language === "java") return ["System.out", ".", "println", "(", "name", ")", ";"];
      if (language === "csharp") return ["Console", ".", "WriteLine", "(", "name", ")", ";"];
      if (language === "rust") return ["println!", "(", "name", ")", ";"];
      return ["print", "(", "name", ")"];
    })(),
    correctAnswer: "",
    explanation: "To display a variable, you pass the variable itself to the output call. That prints the stored value instead of the variable name as text.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each statement to what it is doing.",
    pairs: spec.matchPairsMid,
    explanation: "These pairs connect the kind of value you pass in with what the output statement is showing.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: `Choose the ${spec.callableKind} used for output.`,
    code: runnable(fillSelectCode),
    options: fillSelectOptions,
    correctIndex: fillSelectOptions.indexOf(spec.callableToken),
    correctAnswer: spec.callableToken,
    explanation: `The correct ${spec.callableKind} is \`${spec.callableToken}\`. Similar-looking words from other contexts will not be the output call in this language.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What happens before a math expression is displayed?",
    options: [
      "The expression is evaluated first",
      "The expression is skipped",
      "The expression becomes a comment",
      "The expression turns into a variable name",
    ],
    correctIndex: 0,
    explanation: "Output statements show the result of the expression after it is evaluated. They do not print the math symbols unless those symbols are inside a string.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Which statement about beginner debugging is most accurate?",
    options: [
      "Temporary output calls help confirm intermediate values",
      "Output calls permanently change your variables",
      "Output calls only work with strings",
      "Output calls replace conditionals",
    ],
    correctIndex: 0,
    explanation: "Printing intermediate values is a simple debugging habit. It helps you check whether your program is producing the data you expect.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "An output call can show the result of a calculation without storing it in a variable first.",
    correct: true,
    explanation: "You can print or log expressions directly. A variable is useful, but not required, when you want to display a computed result.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 5.",
    code: runnable(spec.totalCall),
    correct: true,
    explanation: "Both variables are defined before the final output line. The result of adding them is 5.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(`${spec.variableCall}\n${language === "python" ? "print(name + '!')" : language === "javascript" || language === "typescript" ? "console.log(name + '!');" : language === "java" ? 'System.out.println(name + "!");' : language === "csharp" ? 'Console.WriteLine(name + "!");' : language === "rust" ? 'println!("{}!", name);' : 'print(name .. "!")'}`),
    options: ["Ada!", "name!", "Ada", "Error"],
    correctIndex: 0,
    correctAnswer: "Ada!",
    explanation: "The code combines the stored text with an exclamation mark, then displays the new result.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(`${language === "python" ? "print(10 - 3)" : language === "javascript" || language === "typescript" ? "console.log(10 - 3);" : language === "java" ? "System.out.println(10 - 3);" : language === "csharp" ? "Console.WriteLine(10 - 3);" : language === "rust" ? 'println!("{}", 10 - 3);' : "print(10 - 3)"}`),
    options: ["10 - 3", "13", "7", "Error"],
    correctIndex: 2,
    correctAnswer: "7",
    explanation: "The subtraction happens before output. The displayed result is the final numeric value 7.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the missing text inside the string literal.",
    code: runnable(`${language === "python" ? "print('Value: _____')" : language === "javascript" || language === "typescript" ? "console.log('Value: _____');" : language === "java" ? 'System.out.println("Value: _____");' : language === "csharp" ? 'Console.WriteLine("Value: _____");' : language === "rust" ? 'println!("Value: _____");' : 'print("Value: _____")'}`),
    correctAnswer: "done",
    explanation: "The code already contains the quotes, so you only type the missing text for the message.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: `Type the output ${spec.callableKind} named in the comment.`,
    code: runnable(`${spec.helloCall} ${spec.commentPrefix} beginner output ${spec.callableKind}: _____`),
    correctAnswer: spec.callableToken,
    explanation: `Even in a simple example, the key output ${spec.callableKind} is still \`${spec.callableToken}\`.`,
  });
  const hardWordBankCorrect = (() => {
    if (language === "javascript" || language === "typescript") {
      return ["console", ".", "log", "(", "total", ")", ";"];
    }
    if (language === "java") return ["System.out", ".", "println", "(", "total", ")", ";"];
    if (language === "csharp") return ["Console", ".", "WriteLine", "(", "total", ")", ";"];
    if (language === "rust") return ["println!", "(", "total", ")", ";"];
    return ["print", "(", "total", ")"];
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the statement that displays `total`.",
    tokens: [...hardWordBankCorrect, "input", "loop", "return"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "The correct statement sends the variable `total` to the language's output call. The distractors are unrelated tokens.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each statement to the kind of output it shows.",
    pairs: spec.matchPairsHard,
    explanation: "These examples separate the kinds of values that can be displayed: stored values, computed values, strings, and booleans.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: `Choose the correct ${spec.callableKind} for output in this language.`,
    code: runnable(`${spec.totalCall}\n${spec.commentPrefix} output ${spec.callableKind}: _____`),
    options: fillSelectOptions,
    correctIndex: fillSelectOptions.indexOf(spec.callableToken),
    correctAnswer: spec.callableToken,
    explanation: `The correct output ${spec.callableKind} is still \`${spec.callableToken}\`, even when the value being displayed comes from a calculation.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
