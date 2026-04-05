import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

export function buildTypeAnnotationsQuestions(concept: string): Question[] {
  const q = createQuestionFactory("typescript", concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What is a type annotation in TypeScript?",
    options: [
      "A note in code that describes the expected type of a value",
      "A special kind of loop",
      "A function that prints text",
      "A comment marker",
    ],
    correctIndex: 0,
    explanation: "A type annotation tells TypeScript what kind of value a variable, parameter, or function result should have.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly declares a string variable with a type annotation?",
    options: [
      "let name: string = 'Ada';",
      "String name = 'Ada';",
      "name: string = 'Ada'",
      "let name = string 'Ada';",
    ],
    correctIndex: 0,
    explanation: "TypeScript places the type after the variable name with a colon: `name: string`.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does `: string` mean in `let name: string = 'Ada';`?",
    options: [
      "The variable should hold text",
      "The variable is a loop",
      "The variable is a number",
      "The variable is a comment",
    ],
    correctIndex: 0,
    explanation: "`string` is the TypeScript type for text values.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "Type annotations help describe the kind of value code expects.",
    correct: true,
    explanation: "They make code clearer and help TypeScript catch type mismatches.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `Ada`.",
    code: "let name: string = 'Ada';\nconsole.log(name);",
    correct: true,
    explanation: "The annotated variable stores a string and the output line prints that value.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "let name: string = 'Ada';\nconsole.log(name);",
    options: ["Ada", "string", "name", "error"],
    correctIndex: 0,
    correctAnswer: "Ada",
    explanation: "The code prints the value stored in the annotated variable `name`.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "const nums: number[] = [1, 2, 3];\nconsole.log(nums[0]);",
    options: ["1", "2", "3", "error"],
    correctIndex: 0,
    correctAnswer: "1",
    explanation: "The array holds numbers, and index 0 reads the first one.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the annotation used for text values.",
    code: "let name: string = 'Ada'; // text type annotation: _____",
    correctAnswer: "string",
    explanation: "`string` is the TypeScript type annotation for text.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable name used in this declaration.",
    code: "let name: string = 'Ada'; // variable name: _____",
    correctAnswer: "name",
    explanation: "The variable being declared is named `name`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the typed string declaration.",
    tokens: ["let", "name", ":", "string", "=", "'Ada'", ";", "int"],
    correctTokens: ["let", "name", ":", "string", "=", "'Ada'", ";"],
    correctAnswer: "let name : string = 'Ada' ;",
    explanation: "This is the standard TypeScript pattern for a typed string variable.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each type annotation pattern to what it means.",
    pairs: [
      { left: "name: string", right: "text value" },
      { left: "age: number", right: "numeric value" },
      { left: "done: boolean", right: "true/false value" },
      { left: "nums: number[]", right: "array of numbers" },
    ],
    explanation: "These are common beginner TypeScript annotations for variables and arrays.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why are type annotations useful?",
    options: [
      "They help TypeScript catch mismatched value types",
      "They make every variable a string",
      "They replace all functions",
      "They remove the need for arrays",
    ],
    correctIndex: 0,
    explanation: "Type annotations help the language and the reader understand what each value is supposed to be.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What does `number[]` mean in TypeScript?",
    options: [
      "An array of numbers",
      "A single number",
      "A string that looks like a number",
      "A boolean list of text",
    ],
    correctIndex: 0,
    explanation: "`number[]` means the variable should hold an array where each item is a number.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "Type annotations can be used on function parameters and return values.",
    correct: true,
    explanation: "TypeScript often annotates variables, parameters, arrays, and function return types.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays 5.",
    code: "function add(a: number, b: number): number {\n  return a + b;\n}\nconsole.log(add(2, 3));",
    correct: true,
    explanation: "The function parameters and return value are typed as numbers, and the call prints 5.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "function add(a: number, b: number): number {\n  return a + b;\n}\nconsole.log(add(2, 3));",
    options: ["5", "23", "number", "error"],
    correctIndex: 0,
    correctAnswer: "5",
    explanation: "The typed function returns the numeric sum of its two arguments.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "const words: string[] = ['hi', 'bye'];\nconsole.log(words[1]);",
    options: ["bye", "hi", "string[]", "error"],
    correctIndex: 0,
    correctAnswer: "bye",
    explanation: "The array contains strings, and index 1 reads the second item.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the annotation used for an array of numbers.",
    code: "const nums: number[] = [1, 2, 3]; // array annotation: _____",
    correctAnswer: "number[]",
    explanation: "`number[]` is the TypeScript annotation for an array of numbers.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the keyword used to send a value back from the function.",
    code: "function add(a: number, b: number): number {\n  return a + b;\n} // value-sending keyword: _____",
    correctAnswer: "return",
    explanation: "`return` sends the typed result back from the function.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the typed function header.",
    tokens: ["function", "add", "(", "a", ":", "number", ",", "b", ":", "number", ")", ":", "number", "{", "def"],
    correctTokens: ["function", "add", "(", "a", ":", "number", ",", "b", ":", "number", ")", ":", "number", "{"],
    correctAnswer: "function add ( a : number , b : number ) : number {",
    explanation: "This is the start of a TypeScript function definition with parameter and return type annotations.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each annotation to its role.",
    pairs: [
      { left: "a: number", right: "number parameter" },
      { left: "): number", right: "number return type" },
      { left: "words: string[]", right: "array of strings" },
      { left: "done: boolean", right: "true/false variable" },
    ],
    explanation: "These patterns show where annotations appear in variables and function signatures.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the annotation used for text values.",
    code: "let name: string = 'Ada'; // text annotation: _____",
    options: ["string", "number", "boolean", "void"],
    correctIndex: 0,
    correctAnswer: "string",
    explanation: "`string` is the correct TypeScript annotation for text values.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the benefit of annotating a function's return type?",
    options: [
      "It makes the expected output type explicit",
      "It automatically creates arrays",
      "It removes the need for parameters",
      "It turns the function into a loop",
    ],
    correctIndex: 0,
    explanation: "A return type annotation documents and checks the kind of value the function should produce.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What does `void` mean for a TypeScript function?",
    options: [
      "The function does not return a useful value",
      "The function returns a number",
      "The function only works with arrays",
      "The function is a comment",
    ],
    correctIndex: 0,
    explanation: "`void` means the function is meant to perform an action rather than return a meaningful result.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "Type annotations can describe both stored values and function results.",
    correct: true,
    explanation: "TypeScript uses annotations on variables, arrays, parameters, and return types.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays `HI`.",
    code: "function shout(word: string): string {\n  return word.toUpperCase();\n}\nconsole.log(shout('hi'));",
    correct: true,
    explanation: "The function returns an uppercase string, and the output line prints HI.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "function shout(word: string): string {\n  return word.toUpperCase();\n}\nconsole.log(shout('hi'));",
    options: ["HI", "hi", "string", "error"],
    correctIndex: 0,
    correctAnswer: "HI",
    explanation: "The function returns the uppercase version of the string argument.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "const scores: number[] = [4, 5, 6];\nconsole.log(scores.length);",
    options: ["3", "6", "number[]", "error"],
    correctIndex: 0,
    correctAnswer: "3",
    explanation: "The typed array contains three numbers, so its length is 3.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the annotation used for a function that returns text.",
    code: "function shout(word: string): string {\n  return word.toUpperCase();\n} // return annotation: _____",
    correctAnswer: "string",
    explanation: "Because the function returns text, its return type annotation is `string`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the function name used in this example.",
    code: "function shout(word: string): string {\n  return word.toUpperCase();\n} // function name: _____",
    correctAnswer: "shout",
    explanation: "The function that returns uppercase text is named `shout`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the typed array declaration.",
    tokens: ["const", "scores", ":", "number[]", "=", "[4, 5, 6]", ";", "string"],
    correctTokens: ["const", "scores", ":", "number[]", "=", "[4, 5, 6]", ";"],
    correctAnswer: "const scores : number[] = [4, 5, 6] ;",
    explanation: "This line declares a typed array of numbers in TypeScript.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each annotation pattern to its meaning.",
    pairs: [
      { left: ": string", right: "text type" },
      { left: ": number[]", right: "array of numbers" },
      { left: ": boolean", right: "true/false type" },
      { left: ": void", right: "no useful return value" },
    ],
    explanation: "These are common TypeScript annotations for beginner variables and functions.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the annotation used for a function that returns no useful value.",
    code: "function greet(name: string): void {\n  console.log(name);\n} // return annotation: _____",
    options: ["void", "string", "number", "boolean"],
    correctIndex: 0,
    correctAnswer: "void",
    explanation: "`void` is used when the function is meant to perform an action instead of returning a meaningful result.",
  });

  return ensureQuestionCount(q.done(), "typescript", concept);
}
