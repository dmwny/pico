import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

type StringMethodsSpec = {
  upperExpr: string;
  upperToken: string;
  upperOptions: string[];
  commentPrefix: string;
  declaration: string;
  declarationDistractors: string[];
  upperCode: string;
  upperOutput: string;
  lowerCode: string;
  lowerOutput: string;
  lengthCode: string;
  lengthOutput: string;
  extraCode: string;
  extraOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getStringMethodsSpec(language: LearningLanguage): StringMethodsSpec {
  switch (language) {
    case "python":
      return {
        upperExpr: "text.upper()",
        upperToken: "upper",
        upperOptions: ["upper", "toUpperCase", "ToUpper", "uppercase"],
        commentPrefix: "#",
        declaration: "text = 'ada'",
        declarationDistractors: ["let text = 'ada';", "String text = \"ada\";", "local text = { 'ada' }"],
        upperCode: "text = 'ada'\nprint(text.upper())",
        upperOutput: "ADA",
        lowerCode: "text = 'ADA'\nprint(text.lower())",
        lowerOutput: "ada",
        lengthCode: "text = 'pico'\nprint(len(text))",
        lengthOutput: "4",
        extraCode: "text = '  hi  '\nprint(text.strip())",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "upper", "(", ")", "toUpperCase", "ToUpper"],
        wordBankCorrect: ["text", ".", "upper", "(", ")"],
        matchPairsBasic: [
          { left: "text.upper()", right: "uppercase text" },
          { left: "text.lower()", right: "lowercase text" },
          { left: "len(text)", right: "string length" },
          { left: "text.strip()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "'ada'.upper()", right: "ADA" },
          { left: "'ADA'.lower()", right: "ada" },
          { left: "len('pico')", right: "4" },
          { left: "'  hi  '.strip()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "upper()", right: "changes case to uppercase" },
          { left: "lower()", right: "changes case to lowercase" },
          { left: "len(text)", right: "counts characters" },
          { left: "strip()", right: "removes outer spaces" },
        ],
      };
    case "javascript":
      return {
        upperExpr: "text.toUpperCase()",
        upperToken: "toUpperCase",
        upperOptions: ["toUpperCase", "upper", "ToUpper", "uppercase"],
        commentPrefix: "//",
        declaration: "const text = 'ada';",
        declarationDistractors: ["text = 'ada'", "String text = \"ada\";", "local text = 'ada'"],
        upperCode: "const text = 'ada';\nconsole.log(text.toUpperCase());",
        upperOutput: "ADA",
        lowerCode: "const text = 'ADA';\nconsole.log(text.toLowerCase());",
        lowerOutput: "ada",
        lengthCode: "const text = 'pico';\nconsole.log(text.length);",
        lengthOutput: "4",
        extraCode: "const text = '  hi  ';\nconsole.log(text.trim());",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "toUpperCase", "(", ")", "upper", "ToUpper"],
        wordBankCorrect: ["text", ".", "toUpperCase", "(", ")"],
        matchPairsBasic: [
          { left: "text.toUpperCase()", right: "uppercase text" },
          { left: "text.toLowerCase()", right: "lowercase text" },
          { left: "text.length", right: "string length" },
          { left: "text.trim()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "'ada'.toUpperCase()", right: "ADA" },
          { left: "'ADA'.toLowerCase()", right: "ada" },
          { left: "'pico'.length", right: "4" },
          { left: "'  hi  '.trim()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "toUpperCase()", right: "changes case to uppercase" },
          { left: "toLowerCase()", right: "changes case to lowercase" },
          { left: ".length", right: "counts characters" },
          { left: "trim()", right: "removes outer spaces" },
        ],
      };
    case "typescript":
      return {
        upperExpr: "text.toUpperCase()",
        upperToken: "toUpperCase",
        upperOptions: ["toUpperCase", "upper", "ToUpper", "uppercase"],
        commentPrefix: "//",
        declaration: "const text: string = 'ada';",
        declarationDistractors: ["text = 'ada'", "String text = \"ada\";", "local text = 'ada'"],
        upperCode: "const text: string = 'ada';\nconsole.log(text.toUpperCase());",
        upperOutput: "ADA",
        lowerCode: "const text: string = 'ADA';\nconsole.log(text.toLowerCase());",
        lowerOutput: "ada",
        lengthCode: "const text: string = 'pico';\nconsole.log(text.length);",
        lengthOutput: "4",
        extraCode: "const text: string = '  hi  ';\nconsole.log(text.trim());",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "toUpperCase", "(", ")", "upper", "ToUpper"],
        wordBankCorrect: ["text", ".", "toUpperCase", "(", ")"],
        matchPairsBasic: [
          { left: "text.toUpperCase()", right: "uppercase text" },
          { left: "text.toLowerCase()", right: "lowercase text" },
          { left: "text.length", right: "string length" },
          { left: "text.trim()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "'ada'.toUpperCase()", right: "ADA" },
          { left: "'ADA'.toLowerCase()", right: "ada" },
          { left: "'pico'.length", right: "4" },
          { left: "'  hi  '.trim()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "toUpperCase()", right: "changes case to uppercase" },
          { left: "toLowerCase()", right: "changes case to lowercase" },
          { left: ".length", right: "counts characters" },
          { left: "trim()", right: "removes outer spaces" },
        ],
      };
    case "java":
      return {
        upperExpr: "text.toUpperCase()",
        upperToken: "toUpperCase",
        upperOptions: ["toUpperCase", "upper", "ToUpper", "uppercase"],
        commentPrefix: "//",
        declaration: "String text = \"ada\";",
        declarationDistractors: ["text = 'ada'", "const text = 'ada';", "local text = 'ada'"],
        upperCode: "public class Main {\n  public static void main(String[] args) {\n    String text = \"ada\";\n    System.out.println(text.toUpperCase());\n  }\n}",
        upperOutput: "ADA",
        lowerCode: "public class Main {\n  public static void main(String[] args) {\n    String text = \"ADA\";\n    System.out.println(text.toLowerCase());\n  }\n}",
        lowerOutput: "ada",
        lengthCode: "public class Main {\n  public static void main(String[] args) {\n    String text = \"pico\";\n    System.out.println(text.length());\n  }\n}",
        lengthOutput: "4",
        extraCode: "public class Main {\n  public static void main(String[] args) {\n    String text = \"  hi  \";\n    System.out.println(text.trim());\n  }\n}",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "toUpperCase", "(", ")", "upper", "ToUpper"],
        wordBankCorrect: ["text", ".", "toUpperCase", "(", ")"],
        matchPairsBasic: [
          { left: "text.toUpperCase()", right: "uppercase text" },
          { left: "text.toLowerCase()", right: "lowercase text" },
          { left: "text.length()", right: "string length" },
          { left: "text.trim()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "\"ada\".toUpperCase()", right: "ADA" },
          { left: "\"ADA\".toLowerCase()", right: "ada" },
          { left: "\"pico\".length()", right: "4" },
          { left: "\"  hi  \".trim()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "toUpperCase()", right: "changes case to uppercase" },
          { left: "toLowerCase()", right: "changes case to lowercase" },
          { left: "length()", right: "counts characters" },
          { left: "trim()", right: "removes outer spaces" },
        ],
      };
    case "csharp":
      return {
        upperExpr: "text.ToUpper()",
        upperToken: "ToUpper",
        upperOptions: ["ToUpper", "toUpperCase", "upper", "uppercase"],
        commentPrefix: "//",
        declaration: "string text = \"ada\";",
        declarationDistractors: ["text = 'ada'", "const text = 'ada';", "local text = 'ada'"],
        upperCode: "string text = \"ada\";\nConsole.WriteLine(text.ToUpper());",
        upperOutput: "ADA",
        lowerCode: "string text = \"ADA\";\nConsole.WriteLine(text.ToLower());",
        lowerOutput: "ada",
        lengthCode: "string text = \"pico\";\nConsole.WriteLine(text.Length);",
        lengthOutput: "4",
        extraCode: "string text = \"  hi  \";\nConsole.WriteLine(text.Trim());",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "ToUpper", "(", ")", "upper", "toUpperCase"],
        wordBankCorrect: ["text", ".", "ToUpper", "(", ")"],
        matchPairsBasic: [
          { left: "text.ToUpper()", right: "uppercase text" },
          { left: "text.ToLower()", right: "lowercase text" },
          { left: "text.Length", right: "string length" },
          { left: "text.Trim()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "\"ada\".ToUpper()", right: "ADA" },
          { left: "\"ADA\".ToLower()", right: "ada" },
          { left: "\"pico\".Length", right: "4" },
          { left: "\"  hi  \".Trim()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "ToUpper()", right: "changes case to uppercase" },
          { left: "ToLower()", right: "changes case to lowercase" },
          { left: "Length", right: "counts characters" },
          { left: "Trim()", right: "removes outer spaces" },
        ],
      };
    case "rust":
      return {
        upperExpr: "text.to_uppercase()",
        upperToken: "to_uppercase",
        upperOptions: ["to_uppercase", "toUpperCase", "ToUpper", "upper"],
        commentPrefix: "//",
        declaration: "let text = \"ada\";",
        declarationDistractors: ["text = 'ada'", "const text = 'ada';", "String text = \"ada\";"],
        upperCode: "fn main() {\n    let text = \"ada\";\n    println!(\"{}\", text.to_uppercase());\n}",
        upperOutput: "ADA",
        lowerCode: "fn main() {\n    let text = \"ADA\";\n    println!(\"{}\", text.to_lowercase());\n}",
        lowerOutput: "ada",
        lengthCode: "fn main() {\n    let text = \"pico\";\n    println!(\"{}\", text.len());\n}",
        lengthOutput: "4",
        extraCode: "fn main() {\n    let text = \"  hi  \";\n    println!(\"{}\", text.trim());\n}",
        extraOutput: "hi",
        wordBankTokens: ["text", ".", "to_uppercase", "(", ")", "upper", "ToUpper"],
        wordBankCorrect: ["text", ".", "to_uppercase", "(", ")"],
        matchPairsBasic: [
          { left: "text.to_uppercase()", right: "uppercase text" },
          { left: "text.to_lowercase()", right: "lowercase text" },
          { left: "text.len()", right: "string length" },
          { left: "text.trim()", right: "trim spaces" },
        ],
        matchPairsMid: [
          { left: "\"ada\".to_uppercase()", right: "ADA" },
          { left: "\"ADA\".to_lowercase()", right: "ada" },
          { left: "\"pico\".len()", right: "4" },
          { left: "\"  hi  \".trim()", right: "hi" },
        ],
        matchPairsHard: [
          { left: "to_uppercase()", right: "changes case to uppercase" },
          { left: "to_lowercase()", right: "changes case to lowercase" },
          { left: "len()", right: "counts characters" },
          { left: "trim()", right: "removes outer spaces" },
        ],
      };
    case "lua":
      return {
        upperExpr: "string.upper(text)",
        upperToken: "string.upper",
        upperOptions: ["string.upper", "toUpperCase", "ToUpper", "upper"],
        commentPrefix: "--",
        declaration: "local text = \"ada\"",
        declarationDistractors: ["text = 'ada'", "const text = 'ada';", "String text = \"ada\";"],
        upperCode: "local text = \"ada\"\nprint(string.upper(text))",
        upperOutput: "ADA",
        lowerCode: "local text = \"ADA\"\nprint(string.lower(text))",
        lowerOutput: "ada",
        lengthCode: "local text = \"pico\"\nprint(#text)",
        lengthOutput: "4",
        extraCode: "local text = \"hello\"\nprint(string.sub(text, 1, 2))",
        extraOutput: "he",
        wordBankTokens: ["string.upper", "(", "text", ")", "toUpperCase", "ToUpper"],
        wordBankCorrect: ["string.upper", "(", "text", ")"],
        matchPairsBasic: [
          { left: "string.upper(text)", right: "uppercase text" },
          { left: "string.lower(text)", right: "lowercase text" },
          { left: "#text", right: "string length" },
          { left: "string.sub(text, 1, 2)", right: "part of the string" },
        ],
        matchPairsMid: [
          { left: "string.upper(\"ada\")", right: "ADA" },
          { left: "string.lower(\"ADA\")", right: "ada" },
          { left: "#\"pico\"", right: "4" },
          { left: "string.sub(\"hello\", 1, 2)", right: "he" },
        ],
        matchPairsHard: [
          { left: "string.upper", right: "changes case to uppercase" },
          { left: "string.lower", right: "changes case to lowercase" },
          { left: "#text", right: "counts characters" },
          { left: "string.sub", right: "gets part of a string" },
        ],
      };
  }
}

export function buildStringMethodsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getStringMethodsSpec(language);
  const q = createQuestionFactory(language, concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What do string methods or helpers let you do?",
    options: [
      "Work with and transform text values",
      "Create loops automatically",
      "Turn every string into a number",
      "Delete variables permanently",
    ],
    correctIndex: 0,
    explanation: "String helpers let you inspect or transform text, such as changing case or measuring length.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which expression changes text to uppercase in this language?",
    options: [spec.upperExpr, ...spec.upperOptions.filter((option) => option !== spec.upperToken).map((option) => option.includes(".") ? option : `${option}()` ).slice(0, 3)],
    correctIndex: 0,
    explanation: "Case-change helper names differ between languages, so this is a common syntax detail to learn early.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does a string length helper tell you?",
    options: [
      "How many characters are in the text",
      "Whether the text is uppercase",
      "What the first letter is",
      "How many variables exist",
    ],
    correctIndex: 0,
    explanation: "Length measures the number of characters in the string.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "String helpers can return changed text without changing the original variable name itself.",
    correct: true,
    explanation: "A string helper works on the text value and gives you a result. The exact mutation behavior depends on language details, but the helper is about working with text.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays uppercase text.",
    code: spec.upperCode,
    correct: true,
    explanation: "The uppercase helper is used before the output line displays the result.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.upperCode,
    options: [spec.upperOutput, spec.lowerOutput, "ada", "error"],
    correctIndex: 0,
    correctAnswer: spec.upperOutput,
    explanation: "The uppercase helper converts the text before it is displayed.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.lengthCode,
    options: [spec.lengthOutput, "3", "pico", "error"],
    correctIndex: 0,
    correctAnswer: spec.lengthOutput,
    explanation: "The length helper counts the characters in the string and returns 4.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the helper name used for uppercase text.",
    code: `${spec.upperCode}\n${spec.commentPrefix} uppercase helper: _____`,
    correctAnswer: spec.upperToken,
    explanation: `The uppercase helper used in this language is \`${spec.upperToken}\`.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable name that stores the string.",
    code: `${spec.upperCode}\n${spec.commentPrefix} string variable: _____`,
    correctAnswer: "text",
    explanation: "The example stores the string in a variable named `text`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the uppercase expression for `text`.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct tokens form the language's uppercase expression for the variable `text`.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each string helper to what it does.",
    pairs: spec.matchPairsBasic,
    explanation: "These helpers cover case changes, measuring text, and a second text operation used by the language.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What does a lowercase helper do?",
    options: [
      "Changes letters to lowercase",
      "Counts characters",
      "Removes every space automatically",
      "Turns text into a number",
    ],
    correctIndex: 0,
    explanation: "Lowercase helpers convert letters to lower case for easier formatting or comparison.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why is a string length helper useful?",
    options: [
      "It tells you how much text is stored",
      "It creates a new function",
      "It removes punctuation automatically",
      "It changes text to uppercase",
    ],
    correctIndex: 0,
    explanation: "Length is useful when you need to measure or validate text input.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "A string helper can be used inside an output statement.",
    correct: true,
    explanation: "That is a common pattern: call the helper and immediately display the result.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays lowercase text.",
    code: spec.lowerCode,
    correct: true,
    explanation: "The lowercase helper runs before the result is printed.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.lowerCode,
    options: [spec.lowerOutput, spec.upperOutput, "ADA", "error"],
    correctIndex: 0,
    correctAnswer: spec.lowerOutput,
    explanation: "The lowercase helper converts the text to all lowercase letters before output.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.extraCode,
    options: [spec.extraOutput, spec.upperOutput, spec.lengthOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.extraOutput,
    explanation: "The helper shown in the code performs the extra text operation for this language and produces the displayed result.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the helper used to lowercase text.",
    code: `${spec.lowerCode}\n${spec.commentPrefix} lowercase helper: _____`,
    correctAnswer: language === "python" ? "lower" : language === "javascript" || language === "typescript" ? "toLowerCase" : language === "java" ? "toLowerCase" : language === "csharp" ? "ToLower" : language === "rust" ? "to_lowercase" : "string.lower",
    explanation: "Each language has its own lowercase helper name, and this is the one used in the shown code.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the helper used to measure string length.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} length helper: _____`,
    correctAnswer: language === "python" ? "len" : language === "javascript" || language === "typescript" ? "length" : language === "java" ? "length" : language === "csharp" ? "Length" : language === "rust" ? "len" : "#",
    explanation: "This is the string-length helper used in the code example for the language.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the expression that gets the string length.",
    tokens: (() => {
      if (language === "python") return ["len", "(", "text", ")", "length", "Length"];
      if (language === "lua") return ["#", "text", "len", "(", ")"];
      if (language === "rust") return ["text", ".", "len", "(", ")", "length", "Length"];
      if (language === "csharp") return ["text", ".", "Length", "len", "(", ")"];
      if (language === "java") return ["text", ".", "length", "(", ")", "Length"];
      return ["text", ".", "length", "len", "(", ")"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["len", "(", "text", ")"];
      if (language === "lua") return ["#", "text"];
      if (language === "rust") return ["text", ".", "len", "(", ")"];
      if (language === "csharp") return ["text", ".", "Length"];
      if (language === "java") return ["text", ".", "length", "(", ")"];
      return ["text", ".", "length"];
    })(),
    correctAnswer: "",
    explanation: "The correct expression uses the language's string-length helper.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each string expression to its result.",
    pairs: spec.matchPairsMid,
    explanation: "These examples connect helpers with the exact values they produce.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the uppercase helper used by this language.",
    code: `${spec.upperCode}\n${spec.commentPrefix} uppercase helper: _____`,
    options: spec.upperOptions,
    correctIndex: spec.upperOptions.indexOf(spec.upperToken),
    correctAnswer: spec.upperToken,
    explanation: `The correct uppercase helper is \`${spec.upperToken}\`, and that spelling varies by language.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why are string helpers useful in real programs?",
    options: [
      "They let you clean, inspect, and format text",
      "They automatically remove all bugs",
      "They replace every variable",
      "They turn text into loops",
    ],
    correctIndex: 0,
    explanation: "String helpers make common text operations much easier, such as formatting output or checking input.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What happens when you call a helper like uppercase or length on a string?",
    options: [
      "You get a result based on that string value",
      "The string always disappears",
      "The helper creates a new loop",
      "The string turns into a number automatically",
    ],
    correctIndex: 0,
    explanation: "The helper works from the string value and returns a result such as new text or a character count.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "String helpers can be used to prepare text before showing it to the user.",
    correct: true,
    explanation: "Formatting with uppercase, lowercase, trimming, or other helpers is a common step before display.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays a cleaned or shortened string result instead of the original text.",
    code: spec.extraCode,
    correct: true,
    explanation: "The extra helper changes or extracts text before the output line shows the result.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.extraCode,
    options: [spec.extraOutput, spec.upperOutput, spec.lengthOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.extraOutput,
    explanation: "The helper performs the shown text operation and the output line prints that result.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.lengthCode,
    options: [spec.lengthOutput, spec.upperOutput, spec.lowerOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.lengthOutput,
    explanation: "The length helper returns the number of characters, which is 4 here.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the helper used to measure length in this language.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} length helper: _____`,
    correctAnswer: language === "python" ? "len" : language === "javascript" || language === "typescript" ? "length" : language === "java" ? "length" : language === "csharp" ? "Length" : language === "rust" ? "len" : "#",
    explanation: "That is the helper or operator used to count the characters in the string.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the string variable name used in this example.",
    code: `${spec.extraCode}\n${spec.commentPrefix} string variable: _____`,
    correctAnswer: "text",
    explanation: "The string is stored in the variable `text` before the helper is applied.",
  });
  const hardWordBankCorrect = spec.wordBankCorrect;
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the uppercase expression for `text`.",
    tokens: [...hardWordBankCorrect, "print", "return", "loop"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This expression applies the language's uppercase helper to the variable `text`.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each helper pattern to its purpose.",
    pairs: spec.matchPairsHard,
    explanation: "These patterns show case changes, length, and another common string operation for the language.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the uppercase helper used by this language.",
    code: `${spec.upperCode}\n${spec.commentPrefix} uppercase helper: _____`,
    options: spec.upperOptions,
    correctIndex: spec.upperOptions.indexOf(spec.upperToken),
    correctAnswer: spec.upperToken,
    explanation: `The correct uppercase helper is \`${spec.upperToken}\`. Similar names from other languages are a common distractor.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
