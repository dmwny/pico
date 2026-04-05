import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

type ConversionSpec = {
  conceptLabel: string;
  toNumberExpr: string;
  toStringExpr: string;
  commentPrefix: string;
  numberToken: string;
  stringToken: string;
  numberOptions: string[];
  parseCode: string;
  parseOutput: string;
  stringCode: string;
  stringOutput: string;
  mathCode: string;
  mathOutput: string;
  extraCode: string;
  extraOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getConversionSpec(language: LearningLanguage): ConversionSpec {
  switch (language) {
    case "python":
      return {
        conceptLabel: "type conversion",
        toNumberExpr: "int('5')",
        toStringExpr: "str(5)",
        commentPrefix: "#",
        numberToken: "int",
        stringToken: "str",
        numberOptions: ["int", "str", "len", "range"],
        parseCode: "print(int('5'))",
        parseOutput: "5",
        stringCode: "print(str(5))",
        stringOutput: "5",
        mathCode: "value = int('5')\nprint(value + 1)",
        mathOutput: "6",
        extraCode: "print(float('3.5'))",
        extraOutput: "3.5",
        wordBankTokens: ["int", "(", "'5'", ")", "str", "float"],
        wordBankCorrect: ["int", "(", "'5'", ")"],
        matchPairsBasic: [
          { left: "int('5')", right: "text to integer" },
          { left: "str(5)", right: "number to text" },
          { left: "float('3.5')", right: "text to decimal number" },
          { left: "value + 1", right: "math after conversion" },
        ],
        matchPairsMid: [
          { left: "int", right: "converts to integer" },
          { left: "str", right: "converts to string" },
          { left: "float", right: "converts to decimal number" },
          { left: "'5'", right: "text that looks like a number" },
        ],
        matchPairsHard: [
          { left: "int('5')", right: "allows numeric math" },
          { left: "str(5)", right: "creates text output" },
          { left: "float('3.5')", right: "creates a floating-point value" },
          { left: "value + 1", right: "uses the converted number" },
        ],
      };
    case "java":
      return {
        conceptLabel: "type casting",
        toNumberExpr: "Integer.parseInt(\"5\")",
        toStringExpr: "String.valueOf(5)",
        commentPrefix: "//",
        numberToken: "Integer.parseInt",
        stringToken: "String.valueOf",
        numberOptions: ["Integer.parseInt", "String.valueOf", "length", "println"],
        parseCode: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(Integer.parseInt(\"5\"));\n  }\n}",
        parseOutput: "5",
        stringCode: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(String.valueOf(5));\n  }\n}",
        stringOutput: "5",
        mathCode: "public class Main {\n  public static void main(String[] args) {\n    int value = Integer.parseInt(\"5\");\n    System.out.println(value + 1);\n  }\n}",
        mathOutput: "6",
        extraCode: "public class Main {\n  public static void main(String[] args) {\n    System.out.println((int) 3.9);\n  }\n}",
        extraOutput: "3",
        wordBankTokens: ["Integer.parseInt", "(", "\"5\"", ")", "String.valueOf", "length"],
        wordBankCorrect: ["Integer.parseInt", "(", "\"5\"", ")"],
        matchPairsBasic: [
          { left: "Integer.parseInt(\"5\")", right: "text to integer" },
          { left: "String.valueOf(5)", right: "number to text" },
          { left: "(int) 3.9", right: "casts to integer" },
          { left: "value + 1", right: "math after conversion" },
        ],
        matchPairsMid: [
          { left: "Integer.parseInt", right: "converts text to integer" },
          { left: "String.valueOf", right: "converts a value to text" },
          { left: "(int)", right: "cast operator" },
          { left: "\"5\"", right: "text that looks like a number" },
        ],
        matchPairsHard: [
          { left: "Integer.parseInt(\"5\")", right: "allows numeric math" },
          { left: "String.valueOf(5)", right: "creates text output" },
          { left: "(int) 3.9", right: "drops the decimal part" },
          { left: "value + 1", right: "uses the converted number" },
        ],
      };
    case "csharp":
      return {
        conceptLabel: "type conversion",
        toNumberExpr: "int.Parse(\"5\")",
        toStringExpr: "5.ToString()",
        commentPrefix: "//",
        numberToken: "int.Parse",
        stringToken: "ToString",
        numberOptions: ["int.Parse", "ToString", "Length", "WriteLine"],
        parseCode: "Console.WriteLine(int.Parse(\"5\"));",
        parseOutput: "5",
        stringCode: "Console.WriteLine(5.ToString());",
        stringOutput: "5",
        mathCode: "int value = int.Parse(\"5\");\nConsole.WriteLine(value + 1);",
        mathOutput: "6",
        extraCode: "Console.WriteLine(Convert.ToInt32(\"7\"));",
        extraOutput: "7",
        wordBankTokens: ["int.Parse", "(", "\"5\"", ")", "ToString", "Length"],
        wordBankCorrect: ["int.Parse", "(", "\"5\"", ")"],
        matchPairsBasic: [
          { left: "int.Parse(\"5\")", right: "text to integer" },
          { left: "5.ToString()", right: "number to text" },
          { left: "Convert.ToInt32(\"7\")", right: "text to integer" },
          { left: "value + 1", right: "math after conversion" },
        ],
        matchPairsMid: [
          { left: "int.Parse", right: "converts text to integer" },
          { left: "ToString", right: "converts a value to text" },
          { left: "Convert.ToInt32", right: "another numeric conversion method" },
          { left: "\"5\"", right: "text that looks like a number" },
        ],
        matchPairsHard: [
          { left: "int.Parse(\"5\")", right: "allows numeric math" },
          { left: "5.ToString()", right: "creates text output" },
          { left: "Convert.ToInt32(\"7\")", right: "creates an integer value" },
          { left: "value + 1", right: "uses the converted number" },
        ],
      };
    default:
      throw new Error(`Unsupported conversion language: ${language}`);
  }
}

export function buildConversionQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getConversionSpec(language);
  const q = createQuestionFactory(language, concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What is ${spec.conceptLabel}?`,
    options: [
      "Changing a value from one type to another",
      "Adding a comment to code",
      "Creating a loop automatically",
      "Declaring a function name",
    ],
    correctIndex: 0,
    explanation: `${spec.conceptLabel[0].toUpperCase()}${spec.conceptLabel.slice(1)} means converting a value such as text into a number or a number into text.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which expression converts text to a number in this language?",
    options: [spec.toNumberExpr, spec.toStringExpr, "print('5')", "len('5')"],
    correctIndex: 0,
    explanation: "The correct expression converts numeric-looking text into a real numeric value for this language.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Why do beginners need conversion functions?",
    options: [
      "Because text that looks like a number is still text",
      "Because comments must be turned into numbers",
      "Because loops only work with strings",
      "Because output cannot show numbers directly",
    ],
    correctIndex: 0,
    explanation: "A value like `\"5\"` or `'5'` looks numeric, but it is still text until you convert it.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "A conversion function can turn text that looks numeric into a real number.",
    correct: true,
    explanation: "That is one of the most common beginner uses of conversion.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays 5.",
    code: spec.parseCode,
    correct: true,
    explanation: "The text value is converted before it is displayed, so the output is the numeric value 5.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.parseCode,
    options: [spec.parseOutput, "\"5\"", "5.0", "error"],
    correctIndex: 0,
    correctAnswer: spec.parseOutput,
    explanation: "The conversion produces the numeric value 5, which is then shown in output.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.stringCode,
    options: [spec.stringOutput, "\"5\"", "error", "0"],
    correctIndex: 0,
    correctAnswer: spec.stringOutput,
    explanation: "The number is converted to text, but printing it still shows the characters 5.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the conversion token that makes a number from text.",
    code: `${spec.parseCode}\n${spec.commentPrefix} text-to-number token: _____`,
    correctAnswer: spec.numberToken,
    explanation: `The token \`${spec.numberToken}\` is the text-to-number conversion used here.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the conversion token that makes text from a number.",
    code: `${spec.stringCode}\n${spec.commentPrefix} number-to-text token: _____`,
    correctAnswer: spec.stringToken,
    explanation: `The token \`${spec.stringToken}\` converts a number into text in this example.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the text-to-number conversion expression.",
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "These tokens build the conversion expression that turns text into a numeric value.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each conversion pattern to what it does.",
    pairs: spec.matchPairsBasic,
    explanation: "These patterns cover text-to-number conversion, number-to-text conversion, and using a converted number in math.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why does converted input work better in math expressions?",
    options: [
      "Because it becomes a numeric value instead of plain text",
      "Because comments are removed",
      "Because the variable disappears",
      "Because strings and numbers are always identical",
    ],
    correctIndex: 0,
    explanation: "Math needs real numeric types, not raw text. Conversion creates the right type for the calculation.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What is the main benefit of converting a number to text?",
    options: [
      "You can use it in string output or concatenation",
      "You can make loops run forever",
      "You can remove all decimals automatically",
      "You can turn text into a list",
    ],
    correctIndex: 0,
    explanation: "Converting to text is useful when you want to display or combine a numeric value as part of a string.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "After converting text to a number, you can use it in arithmetic.",
    correct: true,
    explanation: "That is why conversion is so common before addition, subtraction, and other math operations.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays 6.",
    code: spec.mathCode,
    correct: true,
    explanation: "The text `5` is converted first, then 1 is added to produce 6.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.mathCode,
    options: [spec.mathOutput, "51", spec.parseOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.mathOutput,
    explanation: "Because the value is numeric after conversion, the program performs arithmetic instead of string joining.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.extraCode,
    options: [spec.extraOutput, spec.parseOutput, spec.mathOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.extraOutput,
    explanation: "The extra conversion example produces the displayed value shown in the answer.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the conversion token that creates a number.",
    code: `${spec.mathCode}\n${spec.commentPrefix} numeric conversion token: _____`,
    correctAnswer: spec.numberToken,
    explanation: `The token \`${spec.numberToken}\` converts the text before the math runs.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that stores the converted number.",
    code: `${spec.mathCode}\n${spec.commentPrefix} converted number variable: _____`,
    correctAnswer: "value",
    explanation: "The converted number is stored in the variable `value`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the expression that converts a number to text.",
    tokens: (() => {
      if (language === "python") return ["str", "(", "5", ")", "int", "float"];
      if (language === "java") return ["String.valueOf", "(", "5", ")", "Integer.parseInt", "length"];
      return ["5.ToString", "(", ")", "int.Parse", "Length"];
    })(),
    correctTokens: (() => {
      if (language === "python") return ["str", "(", "5", ")"];
      if (language === "java") return ["String.valueOf", "(", "5", ")"];
      return ["5.ToString", "(", ")"];
    })(),
    correctAnswer: "",
    explanation: "This expression converts the numeric value 5 into text for the language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each conversion token to its role.",
    pairs: spec.matchPairsMid,
    explanation: "These pairs distinguish numeric conversion, string conversion, casting, and raw text input.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the token that converts text to a number.",
    code: `${spec.parseCode}\n${spec.commentPrefix} text-to-number token: _____`,
    options: spec.numberOptions,
    correctIndex: spec.numberOptions.indexOf(spec.numberToken),
    correctAnswer: spec.numberToken,
    explanation: `The correct text-to-number token is \`${spec.numberToken}\` for this language.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why is conversion important when values come from text?",
    options: [
      "Because programs often need the right type before using the value",
      "Because text can never be printed",
      "Because numbers and strings are always identical",
      "Because conversion automatically creates loops",
    ],
    correctIndex: 0,
    explanation: "Programs behave differently depending on the value type, so conversion helps ensure the value fits the job you need.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main difference between numeric conversion and string conversion?",
    options: [
      "One prepares a value for math and the other prepares it for text use",
      "Both do exactly the same thing",
      "Both always remove decimals",
      "Both only work inside loops",
    ],
    correctIndex: 0,
    explanation: "Numeric conversion is about arithmetic, while string conversion is about text display or text combination.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "Type conversion helps prevent text values from behaving like strings during math.",
    correct: true,
    explanation: "Without conversion, text values can behave differently from numeric values in expressions.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code uses a converted number in arithmetic and displays 6.",
    code: spec.mathCode,
    correct: true,
    explanation: "The converted numeric value is stored and then used in the addition expression.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.mathCode,
    options: [spec.mathOutput, "51", spec.parseOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.mathOutput,
    explanation: "The value has already been converted to a number, so the arithmetic result is 6.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.extraCode,
    options: [spec.extraOutput, spec.stringOutput, spec.mathOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.extraOutput,
    explanation: "The extra conversion example produces that exact output after the conversion is applied.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable that stores the converted numeric value.",
    code: `${spec.mathCode}\n${spec.commentPrefix} converted number variable: _____`,
    correctAnswer: "value",
    explanation: "The converted number is stored in `value` before being used in math.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the token that converts a number into text.",
    code: `${spec.stringCode}\n${spec.commentPrefix} number-to-text token: _____`,
    correctAnswer: spec.stringToken,
    explanation: `The number-to-text token here is \`${spec.stringToken}\`.`,
  });
  const hardWordBankCorrect = spec.wordBankCorrect;
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the text-to-number conversion expression.",
    tokens: [...hardWordBankCorrect, "print", "loop", "range"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This expression converts text into a numeric value that the program can use in arithmetic.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each conversion pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These examples show why conversion matters for math, text output, and related numeric operations.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the token that converts text to a number.",
    code: `${spec.mathCode}\n${spec.commentPrefix} text-to-number token: _____`,
    options: spec.numberOptions,
    correctIndex: spec.numberOptions.indexOf(spec.numberToken),
    correctAnswer: spec.numberToken,
    explanation: `The correct text-to-number token is \`${spec.numberToken}\` in this language.`,
  });

  const questions = q.done();
  questions.forEach((question) => {
    if (question.type === "word_bank" && !question.correctAnswer) {
      question.correctAnswer = joinTokens(question.correctTokens ?? []);
    }
  });
  return ensureQuestionCount(questions, language, concept);
}
