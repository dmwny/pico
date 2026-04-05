import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion, wrapRunnableCode } from "../builderUtils";

type WhileLoopsSpec = {
  header: string;
  headerDistractors: string[];
  updateToken: string;
  updateOptions: string[];
  commentPrefix: string;
  countdownCode: string;
  countdownOutput: string;
  doneCode: string;
  doneOutput: string;
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

function getWhileLoopsSpec(language: LearningLanguage): WhileLoopsSpec {
  switch (language) {
    case "python":
      return {
        header: "while count > 0:",
        headerDistractors: ["while (count > 0) {", "while count > 0 do", "while count > 0 {"],
        updateToken: "count = count - 1",
        updateOptions: ["count = count - 1", "count++", "range(1)", "then"],
        commentPrefix: "#",
        countdownCode: "count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1",
        countdownOutput: "3\n2\n1",
        doneCode: "count = 0\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint('done')",
        doneOutput: "done",
        stepCode: "count = 6\nwhile count > 0:\n    print(count)\n    count = count - 2",
        stepOutput: "6\n4\n2",
        sumCode: "total = 0\ncount = 1\nwhile count < 4:\n    total = total + count\n    count = count + 1\nprint(total)",
        sumOutput: "6",
        wordBankTokens: ["while", "count", ">", "0", ":", "for", "then", "{"],
        wordBankCorrect: ["while", "count", ">", "0", ":"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count = count - 1", right: "updates the loop variable" },
          { left: "print(count)", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "count = 3", right: "starting value" },
          { left: "while count > 0:", right: "keeps looping while true" },
          { left: "count = count - 2", right: "steps down by 2" },
          { left: "print('done')", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count", right: "builds a running total" },
          { left: "count = count + 1", right: "moves toward the stop condition" },
          { left: "print(total)", right: "shows the final total" },
        ],
      };
    case "javascript":
      return {
        header: "while (count > 0) {",
        headerDistractors: ["while count > 0:", "while count > 0 do", "while count > 0 {"],
        updateToken: "count--;",
        updateOptions: ["count--;", "count = count - 1", "range(1)", "then"],
        commentPrefix: "//",
        countdownCode: "let count = 3;\nwhile (count > 0) {\n  console.log(count);\n  count--;\n}",
        countdownOutput: "3\n2\n1",
        doneCode: "let count = 0;\nwhile (count > 0) {\n  console.log(count);\n  count--;\n}\nconsole.log('done');",
        doneOutput: "done",
        stepCode: "let count = 6;\nwhile (count > 0) {\n  console.log(count);\n  count -= 2;\n}",
        stepOutput: "6\n4\n2",
        sumCode: "let total = 0;\nlet count = 1;\nwhile (count < 4) {\n  total = total + count;\n  count++;\n}\nconsole.log(total);",
        sumOutput: "6",
        wordBankTokens: ["while", "(", "count", ">", "0", ")", "{", "for", "then"],
        wordBankCorrect: ["while", "(", "count", ">", "0", ")", "{"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count--;", right: "updates the loop variable" },
          { left: "console.log(count);", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "let count = 3;", right: "starting value" },
          { left: "while (count > 0) {", right: "keeps looping while true" },
          { left: "count -= 2;", right: "steps down by 2" },
          { left: "console.log('done');", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count;", right: "builds a running total" },
          { left: "count++;", right: "moves toward the stop condition" },
          { left: "console.log(total);", right: "shows the final total" },
        ],
      };
    case "typescript":
      return {
        header: "while (count > 0) {",
        headerDistractors: ["while count > 0:", "while count > 0 do", "while count > 0 {"],
        updateToken: "count--;",
        updateOptions: ["count--;", "count = count - 1", "range(1)", "then"],
        commentPrefix: "//",
        countdownCode: "let count = 3;\nwhile (count > 0) {\n  console.log(count);\n  count--;\n}",
        countdownOutput: "3\n2\n1",
        doneCode: "let count = 0;\nwhile (count > 0) {\n  console.log(count);\n  count--;\n}\nconsole.log('done');",
        doneOutput: "done",
        stepCode: "let count = 6;\nwhile (count > 0) {\n  console.log(count);\n  count -= 2;\n}",
        stepOutput: "6\n4\n2",
        sumCode: "let total = 0;\nlet count = 1;\nwhile (count < 4) {\n  total = total + count;\n  count++;\n}\nconsole.log(total);",
        sumOutput: "6",
        wordBankTokens: ["while", "(", "count", ">", "0", ")", "{", "for", "then"],
        wordBankCorrect: ["while", "(", "count", ">", "0", ")", "{"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count--;", right: "updates the loop variable" },
          { left: "console.log(count);", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "let count = 3;", right: "starting value" },
          { left: "while (count > 0) {", right: "keeps looping while true" },
          { left: "count -= 2;", right: "steps down by 2" },
          { left: "console.log('done');", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count;", right: "builds a running total" },
          { left: "count++;", right: "moves toward the stop condition" },
          { left: "console.log(total);", right: "shows the final total" },
        ],
      };
    case "java":
      return {
        header: "while (count > 0) {",
        headerDistractors: ["while count > 0:", "while count > 0 do", "while count > 0 {"],
        updateToken: "count--;",
        updateOptions: ["count--;", "count = count - 1", "range(1)", "then"],
        commentPrefix: "//",
        countdownCode: "int count = 3;\nwhile (count > 0) {\n  System.out.println(count);\n  count--;\n}",
        countdownOutput: "3\n2\n1",
        doneCode: "int count = 0;\nwhile (count > 0) {\n  System.out.println(count);\n  count--;\n}\nSystem.out.println(\"done\");",
        doneOutput: "done",
        stepCode: "int count = 6;\nwhile (count > 0) {\n  System.out.println(count);\n  count -= 2;\n}",
        stepOutput: "6\n4\n2",
        sumCode: "int total = 0;\nint count = 1;\nwhile (count < 4) {\n  total = total + count;\n  count++;\n}\nSystem.out.println(total);",
        sumOutput: "6",
        wordBankTokens: ["while", "(", "count", ">", "0", ")", "{", "for", "then"],
        wordBankCorrect: ["while", "(", "count", ">", "0", ")", "{"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count--;", right: "updates the loop variable" },
          { left: "System.out.println(count);", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "int count = 3;", right: "starting value" },
          { left: "while (count > 0) {", right: "keeps looping while true" },
          { left: "count -= 2;", right: "steps down by 2" },
          { left: "System.out.println(\"done\");", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count;", right: "builds a running total" },
          { left: "count++;", right: "moves toward the stop condition" },
          { left: "System.out.println(total);", right: "shows the final total" },
        ],
      };
    case "csharp":
      return {
        header: "while (count > 0) {",
        headerDistractors: ["while count > 0:", "while count > 0 do", "while count > 0 {"],
        updateToken: "count--;",
        updateOptions: ["count--;", "count = count - 1", "range(1)", "then"],
        commentPrefix: "//",
        countdownCode: "int count = 3;\nwhile (count > 0) {\n  Console.WriteLine(count);\n  count--;\n}",
        countdownOutput: "3\n2\n1",
        doneCode: "int count = 0;\nwhile (count > 0) {\n  Console.WriteLine(count);\n  count--;\n}\nConsole.WriteLine(\"done\");",
        doneOutput: "done",
        stepCode: "int count = 6;\nwhile (count > 0) {\n  Console.WriteLine(count);\n  count -= 2;\n}",
        stepOutput: "6\n4\n2",
        sumCode: "int total = 0;\nint count = 1;\nwhile (count < 4) {\n  total = total + count;\n  count++;\n}\nConsole.WriteLine(total);",
        sumOutput: "6",
        wordBankTokens: ["while", "(", "count", ">", "0", ")", "{", "for", "then"],
        wordBankCorrect: ["while", "(", "count", ">", "0", ")", "{"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count--;", right: "updates the loop variable" },
          { left: "Console.WriteLine(count);", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "int count = 3;", right: "starting value" },
          { left: "while (count > 0) {", right: "keeps looping while true" },
          { left: "count -= 2;", right: "steps down by 2" },
          { left: "Console.WriteLine(\"done\");", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count;", right: "builds a running total" },
          { left: "count++;", right: "moves toward the stop condition" },
          { left: "Console.WriteLine(total);", right: "shows the final total" },
        ],
      };
    case "rust":
      return {
        header: "while count > 0 {",
        headerDistractors: ["while count > 0:", "while (count > 0) {", "while count > 0 do"],
        updateToken: "count -= 1;",
        updateOptions: ["count -= 1;", "count--;", "range(1)", "then"],
        commentPrefix: "//",
        countdownCode: "let mut count = 3;\nwhile count > 0 {\n    println!(\"{}\", count);\n    count -= 1;\n}",
        countdownOutput: "3\n2\n1",
        doneCode: "let mut count = 0;\nwhile count > 0 {\n    println!(\"{}\", count);\n    count -= 1;\n}\nprintln!(\"done\");",
        doneOutput: "done",
        stepCode: "let mut count = 6;\nwhile count > 0 {\n    println!(\"{}\", count);\n    count -= 2;\n}",
        stepOutput: "6\n4\n2",
        sumCode: "let mut total = 0;\nlet mut count = 1;\nwhile count < 4 {\n    total = total + count;\n    count += 1;\n}\nprintln!(\"{}\", total);",
        sumOutput: "6",
        wordBankTokens: ["while", "count", ">", "0", "{", "for", "then", ":"],
        wordBankCorrect: ["while", "count", ">", "0", "{"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count -= 1;", right: "updates the loop variable" },
          { left: "println!(\"{}\", count);", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "let mut count = 3;", right: "starting value" },
          { left: "while count > 0 {", right: "keeps looping while true" },
          { left: "count -= 2;", right: "steps down by 2" },
          { left: "println!(\"done\");", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count;", right: "builds a running total" },
          { left: "count += 1;", right: "moves toward the stop condition" },
          { left: "println!(\"{}\", total);", right: "shows the final total" },
        ],
      };
    case "lua":
      return {
        header: "while count > 0 do",
        headerDistractors: ["while count > 0:", "while (count > 0) {", "while count > 0 {"],
        updateToken: "count = count - 1",
        updateOptions: ["count = count - 1", "count--;", "range(1)", "then"],
        commentPrefix: "--",
        countdownCode: "local count = 3\nwhile count > 0 do\n  print(count)\n  count = count - 1\nend",
        countdownOutput: "3\n2\n1",
        doneCode: "local count = 0\nwhile count > 0 do\n  print(count)\n  count = count - 1\nend\nprint(\"done\")",
        doneOutput: "done",
        stepCode: "local count = 6\nwhile count > 0 do\n  print(count)\n  count = count - 2\nend",
        stepOutput: "6\n4\n2",
        sumCode: "local total = 0\nlocal count = 1\nwhile count < 4 do\n  total = total + count\n  count = count + 1\nend\nprint(total)",
        sumOutput: "6",
        wordBankTokens: ["while", "count", ">", "0", "do", "for", "then", "{"],
        wordBankCorrect: ["while", "count", ">", "0", "do"],
        matchPairsBasic: [
          { left: "while", right: "starts a loop that depends on a condition" },
          { left: "count > 0", right: "condition checked each time" },
          { left: "count = count - 1", right: "updates the loop variable" },
          { left: "print(count)", right: "runs inside the loop body" },
        ],
        matchPairsMid: [
          { left: "local count = 3", right: "starting value" },
          { left: "while count > 0 do", right: "keeps looping while true" },
          { left: "count = count - 2", right: "steps down by 2" },
          { left: "print(\"done\")", right: "runs after the loop ends" },
        ],
        matchPairsHard: [
          { left: "count < 4", right: "loop continuation check" },
          { left: "total = total + count", right: "builds a running total" },
          { left: "count = count + 1", right: "moves toward the stop condition" },
          { left: "print(total)", right: "shows the final total" },
        ],
      };
  }
}

export function buildWhileLoopsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getWhileLoopsSpec(language);
  const q = createQuestionFactory(language, concept);
  const runnable = (code: string) => wrapRunnableCode(language, code);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does a `while` loop do?",
    options: [
      "Repeats code while a condition stays true",
      "Creates a function automatically",
      "Declares a new string method",
      "Builds an array literal",
    ],
    correctIndex: 0,
    explanation: "A `while` loop keeps checking a condition and repeats as long as that condition remains true.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which loop header is correct for this language?",
    options: [spec.header, ...spec.headerDistractors],
    correctIndex: 0,
    explanation: "The header syntax is different across languages. Python, Lua, Rust, and brace-based languages all format `while` loops differently.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Why does a `while` loop usually need an update inside it?",
    options: [
      "So the condition can eventually become false",
      "So the loop can become a function",
      "So output can work",
      "So variables can be removed",
    ],
    correctIndex: 0,
    explanation: "If the value controlling the condition never changes, the loop may run forever.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A `while` loop checks its condition more than once while it runs.",
    correct: true,
    explanation: "The condition is checked before each iteration. That is how the loop knows whether to continue or stop.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code counts down from 3 to 1.",
    code: runnable(spec.countdownCode),
    correct: true,
    explanation: "The loop prints the current value, then updates it so the next iteration uses a smaller number.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.countdownCode),
    options: [spec.countdownOutput, "1\n2\n3", "3\n2\n1\n0", "error"],
    correctIndex: 0,
    correctAnswer: spec.countdownOutput,
    explanation: "The loop runs while the value stays above 0, so it prints 3, 2, and 1.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: runnable(spec.doneCode),
    options: [spec.doneOutput, spec.countdownOutput, "0\ndone", "error"],
    correctIndex: 0,
    correctAnswer: spec.doneOutput,
    explanation: "Because the condition is false at the start, the loop body never runs and only the final line after the loop executes.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable that controls this loop.",
    code: runnable(`${spec.countdownCode}\n${spec.commentPrefix} controlling variable: _____`),
    correctAnswer: "count",
    explanation: "The condition checks the variable `count`, so that variable controls whether the loop continues.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the update statement used in this loop style.",
    code: runnable(`${spec.countdownCode}\n${spec.commentPrefix} update statement: _____`),
    correctAnswer: spec.updateToken,
    explanation: "That update changes the controlling variable so the loop can eventually stop.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the `while` header that checks whether `count` is greater than 0.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct header uses this language's `while` syntax. The extra tokens come from other languages.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each `while` loop part to its role.",
    pairs: spec.matchPairsBasic,
    explanation: "These pieces show the condition, the update, and the body of a `while` loop.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What happens if a `while` loop condition is false at the start?",
    options: [
      "The loop body does not run",
      "The loop always runs once anyway",
      "The code becomes a function",
      "The condition turns into output",
    ],
    correctIndex: 0,
    explanation: "A `while` loop checks the condition before entering the body. If the condition starts false, the body is skipped.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What does changing the update from 1 to 2 do in a countdown loop?",
    options: [
      "It skips numbers",
      "It reverses the loop",
      "It removes the condition",
      "It changes a number into text",
    ],
    correctIndex: 0,
    explanation: "A larger step changes which values are visited, so the loop can count down or up more quickly.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "A `while` loop can stop after zero iterations if its condition is already false.",
    correct: true,
    explanation: "Because the condition is checked first, zero-iteration loops are completely possible with `while`.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code skips by 2.",
    code: runnable(spec.stepCode),
    correct: true,
    explanation: "The update subtracts 2 each time, so the loop visits every other value.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.stepCode),
    options: [spec.stepOutput, spec.countdownOutput, spec.doneOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.stepOutput,
    explanation: "The controlling value changes by 2 on each iteration, so the output skips numbers.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: runnable(spec.sumCode),
    options: [spec.sumOutput, "3", "4", "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "The loop builds a running total by adding 1, 2, and 3 before printing the final result.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword that starts this loop.",
    code: runnable(`${spec.countdownCode}\n${spec.commentPrefix} starting keyword: _____`),
    correctAnswer: "while",
    explanation: "The keyword that starts this loop form is `while`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that stores the running total.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} running total variable: _____`),
    correctAnswer: "total",
    explanation: "The loop keeps adding values into the variable named `total`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the update statement that subtracts 1 from `count`.",
    tokens: [...spec.updateToken.split(" "), "count--;", "range(1)", "then"],
    correctTokens: spec.updateToken.split(" "),
    correctAnswer: spec.updateToken,
    explanation: "This update moves the loop toward its stopping condition. Without it, the loop might not end.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each `while` loop pattern to its meaning.",
    pairs: spec.matchPairsMid,
    explanation: "These examples show start values, step sizes, stop checks, and code that runs after a loop ends.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the update statement used by this loop style.",
    code: runnable(`${spec.countdownCode}\n${spec.commentPrefix} update statement: _____`),
    options: spec.updateOptions,
    correctIndex: spec.updateOptions.indexOf(spec.updateToken),
    correctAnswer: spec.updateToken,
    explanation: "That update changes the loop variable toward the stopping condition.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why is a running total a common `while` loop pattern?",
    options: [
      "It lets the loop build one result across many iterations",
      "It removes the need for a condition",
      "It makes updates unnecessary",
      "It automatically creates arrays",
    ],
    correctIndex: 0,
    explanation: "A running total lets the loop combine values as it repeats. This is common in counting and summing tasks.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What must happen for a typical `while` loop to finish?",
    options: [
      "The condition must eventually become false",
      "The output line must print text",
      "The variable name must change",
      "The loop must use a `for` keyword",
    ],
    correctIndex: 0,
    explanation: "A `while` loop ends when its condition becomes false. That is why the update step matters.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A `while` loop can be used to build a final answer instead of printing every intermediate value.",
    correct: true,
    explanation: "Loops often work on a result silently, then print only the final value after the loop ends.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 6.",
    code: runnable(spec.sumCode),
    correct: true,
    explanation: "The loop adds 1, 2, and 3 into `total`, then prints the final sum of 6.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.sumCode),
    options: [spec.sumOutput, "3", "1\n2\n3", "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "Only the final total is printed after the loop, so the output is 6.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: runnable(spec.stepCode),
    options: [spec.stepOutput, spec.countdownOutput, spec.doneOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.stepOutput,
    explanation: "The update changes the loop value by 2, so the loop prints every other value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the condition variable used in this loop.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} condition variable: _____`),
    correctAnswer: "count",
    explanation: "The loop keeps checking the variable `count` against the condition each time.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable that stores the final answer.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} final answer variable: _____`),
    correctAnswer: "total",
    explanation: "The final accumulated result is stored in `total`.",
  });
  const hardWordBankCorrect = (() => {
    if (language === "python") return ["while", "count", "<", "4", ":"];
    if (language === "lua") return ["while", "count", "<", "4", "do"];
    if (language === "rust") return ["while", "count", "<", "4", "{"];
    return ["while", "(", "count", "<", "4", ")", "{"];
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the `while` header that keeps looping while `count` is less than 4.",
    tokens: [...hardWordBankCorrect, "for", "then", ":"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This header checks whether `count` is still below 4 before each iteration.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each `while` loop pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show the stop check, the accumulation step, the variable update, and the final output.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the update statement used by this language's `while` loop example.",
    code: runnable(`${spec.sumCode}\n${spec.commentPrefix} update statement: _____`),
    options: spec.updateOptions,
    correctIndex: spec.updateOptions.indexOf(spec.updateToken),
    correctAnswer: spec.updateToken,
    explanation: "That update moves the loop variable toward the stopping condition in this syntax.",
  });

  return ensureQuestionCount(q.done(), language, concept);
}
