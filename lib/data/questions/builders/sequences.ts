import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

type SequenceSpec = {
  kindLabel: string;
  declaration: string;
  declarationDistractors: string[];
  commentPrefix: string;
  firstIndex: string;
  lengthToken: string;
  lengthOptions: string[];
  accessCode: string;
  accessOutput: string;
  lengthCode: string;
  lengthOutput: string;
  updateCode: string;
  updateOutput: string;
  sumCode: string;
  sumOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getSequenceSpec(language: LearningLanguage): SequenceSpec {
  switch (language) {
    case "python":
      return {
        kindLabel: "list",
        declaration: "nums = [10, 20, 30]",
        declarationDistractors: ["let nums = [10, 20, 30];", "int[] nums = {10, 20, 30};", "nums = {10, 20, 30}"],
        commentPrefix: "#",
        firstIndex: "0",
        lengthToken: "len",
        lengthOptions: ["len", "length", "Length", "count"],
        accessCode: "nums = [10, 20, 30]\nprint(nums[1])",
        accessOutput: "20",
        lengthCode: "nums = [10, 20, 30]\nprint(len(nums))",
        lengthOutput: "3",
        updateCode: "nums = [10, 20, 30]\nnums[0] = 99\nprint(nums[0])",
        updateOutput: "99",
        sumCode: "nums = [10, 20, 30]\nprint(nums[0] + nums[1])",
        sumOutput: "30",
        wordBankTokens: ["nums", "=", "[10, 20, 30]", "let", "const", "{"],
        wordBankCorrect: ["nums", "=", "[10, 20, 30]"],
        matchPairsBasic: [
          { left: "[10, 20, 30]", right: "list literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "len(nums)", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99", right: "updates an item" },
          { left: "print(nums[1])", right: "reads one item" },
          { left: "len(nums)", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99", right: "replaces the first item" },
          { left: "len(nums)", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    case "javascript":
      return {
        kindLabel: "array",
        declaration: "const nums = [10, 20, 30];",
        declarationDistractors: ["nums = [10, 20, 30]", "int[] nums = {10, 20, 30};", "local nums = {10, 20, 30}"],
        commentPrefix: "//",
        firstIndex: "0",
        lengthToken: "length",
        lengthOptions: ["length", "len", "Length", "count"],
        accessCode: "const nums = [10, 20, 30];\nconsole.log(nums[1]);",
        accessOutput: "20",
        lengthCode: "const nums = [10, 20, 30];\nconsole.log(nums.length);",
        lengthOutput: "3",
        updateCode: "const nums = [10, 20, 30];\nnums[0] = 99;\nconsole.log(nums[0]);",
        updateOutput: "99",
        sumCode: "const nums = [10, 20, 30];\nconsole.log(nums[0] + nums[1]);",
        sumOutput: "30",
        wordBankTokens: ["const", "nums", "=", "[10, 20, 30]", ";", "let", "{"],
        wordBankCorrect: ["const", "nums", "=", "[10, 20, 30]", ";"],
        matchPairsBasic: [
          { left: "[10, 20, 30]", right: "array literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "nums.length", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99;", right: "updates an item" },
          { left: "console.log(nums[1]);", right: "reads one item" },
          { left: "nums.length", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99;", right: "replaces the first item" },
          { left: "nums.length", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    case "typescript":
      return {
        kindLabel: "array",
        declaration: "const nums: number[] = [10, 20, 30];",
        declarationDistractors: ["nums = [10, 20, 30]", "int[] nums = {10, 20, 30};", "local nums = {10, 20, 30}"],
        commentPrefix: "//",
        firstIndex: "0",
        lengthToken: "length",
        lengthOptions: ["length", "len", "Length", "count"],
        accessCode: "const nums: number[] = [10, 20, 30];\nconsole.log(nums[1]);",
        accessOutput: "20",
        lengthCode: "const nums: number[] = [10, 20, 30];\nconsole.log(nums.length);",
        lengthOutput: "3",
        updateCode: "const nums: number[] = [10, 20, 30];\nnums[0] = 99;\nconsole.log(nums[0]);",
        updateOutput: "99",
        sumCode: "const nums: number[] = [10, 20, 30];\nconsole.log(nums[0] + nums[1]);",
        sumOutput: "30",
        wordBankTokens: ["const", "nums", ":", "number[]", "=", "[10, 20, 30]", ";", "let", "{"],
        wordBankCorrect: ["const", "nums", ":", "number[]", "=", "[10, 20, 30]", ";"],
        matchPairsBasic: [
          { left: "[10, 20, 30]", right: "array literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "nums.length", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99;", right: "updates an item" },
          { left: "console.log(nums[1]);", right: "reads one item" },
          { left: "nums.length", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99;", right: "replaces the first item" },
          { left: "nums.length", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    case "java":
      return {
        kindLabel: "array",
        declaration: "int[] nums = {10, 20, 30};",
        declarationDistractors: ["nums = [10, 20, 30]", "const nums = [10, 20, 30];", "local nums = {10, 20, 30}"],
        commentPrefix: "//",
        firstIndex: "0",
        lengthToken: "length",
        lengthOptions: ["length", "len", "Length", "count"],
        accessCode: "public class Main {\n  public static void main(String[] args) {\n    int[] nums = {10, 20, 30};\n    System.out.println(nums[1]);\n  }\n}",
        accessOutput: "20",
        lengthCode: "public class Main {\n  public static void main(String[] args) {\n    int[] nums = {10, 20, 30};\n    System.out.println(nums.length);\n  }\n}",
        lengthOutput: "3",
        updateCode: "public class Main {\n  public static void main(String[] args) {\n    int[] nums = {10, 20, 30};\n    nums[0] = 99;\n    System.out.println(nums[0]);\n  }\n}",
        updateOutput: "99",
        sumCode: "public class Main {\n  public static void main(String[] args) {\n    int[] nums = {10, 20, 30};\n    System.out.println(nums[0] + nums[1]);\n  }\n}",
        sumOutput: "30",
        wordBankTokens: ["int[]", "nums", "=", "{10, 20, 30}", ";", "const", "["],
        wordBankCorrect: ["int[]", "nums", "=", "{10, 20, 30}", ";"],
        matchPairsBasic: [
          { left: "{10, 20, 30}", right: "array literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "nums.length", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99;", right: "updates an item" },
          { left: "System.out.println(nums[1]);", right: "reads one item" },
          { left: "nums.length", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99;", right: "replaces the first item" },
          { left: "nums.length", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    case "csharp":
      return {
        kindLabel: "array",
        declaration: "int[] nums = { 10, 20, 30 };",
        declarationDistractors: ["nums = [10, 20, 30]", "const nums = [10, 20, 30];", "local nums = {10, 20, 30}"],
        commentPrefix: "//",
        firstIndex: "0",
        lengthToken: "Length",
        lengthOptions: ["Length", "length", "len", "count"],
        accessCode: "int[] nums = { 10, 20, 30 };\nConsole.WriteLine(nums[1]);",
        accessOutput: "20",
        lengthCode: "int[] nums = { 10, 20, 30 };\nConsole.WriteLine(nums.Length);",
        lengthOutput: "3",
        updateCode: "int[] nums = { 10, 20, 30 };\nnums[0] = 99;\nConsole.WriteLine(nums[0]);",
        updateOutput: "99",
        sumCode: "int[] nums = { 10, 20, 30 };\nConsole.WriteLine(nums[0] + nums[1]);",
        sumOutput: "30",
        wordBankTokens: ["int[]", "nums", "=", "{ 10, 20, 30 }", ";", "const", "["],
        wordBankCorrect: ["int[]", "nums", "=", "{ 10, 20, 30 }", ";"],
        matchPairsBasic: [
          { left: "{ 10, 20, 30 }", right: "array literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "nums.Length", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99;", right: "updates an item" },
          { left: "Console.WriteLine(nums[1]);", right: "reads one item" },
          { left: "nums.Length", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99;", right: "replaces the first item" },
          { left: "nums.Length", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    case "rust":
      return {
        kindLabel: "array",
        declaration: "let nums = [10, 20, 30];",
        declarationDistractors: ["nums = [10, 20, 30]", "const nums = [10, 20, 30];", "int[] nums = {10, 20, 30};"],
        commentPrefix: "//",
        firstIndex: "0",
        lengthToken: "len",
        lengthOptions: ["len", "length", "Length", "count"],
        accessCode: "fn main() {\n    let nums = [10, 20, 30];\n    println!(\"{}\", nums[1]);\n}",
        accessOutput: "20",
        lengthCode: "fn main() {\n    let nums = [10, 20, 30];\n    println!(\"{}\", nums.len());\n}",
        lengthOutput: "3",
        updateCode: "fn main() {\n    let mut nums = [10, 20, 30];\n    nums[0] = 99;\n    println!(\"{}\", nums[0]);\n}",
        updateOutput: "99",
        sumCode: "fn main() {\n    let nums = [10, 20, 30];\n    println!(\"{}\", nums[0] + nums[1]);\n}",
        sumOutput: "30",
        wordBankTokens: ["let", "nums", "=", "[10, 20, 30]", ";", "const", "int[]"],
        wordBankCorrect: ["let", "nums", "=", "[10, 20, 30]", ";"],
        matchPairsBasic: [
          { left: "[10, 20, 30]", right: "array literal" },
          { left: "nums[0]", right: "first item" },
          { left: "nums[1]", right: "second item" },
          { left: "nums.len()", right: "number of items" },
        ],
        matchPairsMid: [
          { left: "nums[0] = 99;", right: "updates an item" },
          { left: "println!(\"{}\", nums[1]);", right: "reads one item" },
          { left: "nums.len()", right: "measures size" },
          { left: "nums[0] + nums[1]", right: "uses items in an expression" },
        ],
        matchPairsHard: [
          { left: "nums[0]", right: "index 0 access" },
          { left: "nums[0] = 99;", right: "replaces the first item" },
          { left: "nums.len()", right: "returns 3 here" },
          { left: "nums[0] + nums[1]", right: "adds two stored values" },
        ],
      };
    default:
      throw new Error(`Unsupported sequence language: ${language}`);
  }
}

export function buildSequenceQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getSequenceSpec(language);
  const q = createQuestionFactory(language, concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What is a ${spec.kindLabel}?`,
    options: [
      "A collection that stores multiple values in order",
      "A special kind of comment",
      "A function that always prints text",
      "A conditional branch",
    ],
    correctIndex: 0,
    explanation: `${spec.kindLabel[0].toUpperCase()}${spec.kindLabel.slice(1)}s or arrays store several values together so you can access them by index.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `Which line correctly creates a ${spec.kindLabel}?`,
    options: [spec.declaration, ...spec.declarationDistractors],
    correctIndex: 0,
    explanation: "Collection literal syntax is another place where beginners often mix languages. The correct answer matches this language's declaration style.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What index usually refers to the first item in this concept?",
    options: [spec.firstIndex, "1", "2", "-1"],
    correctIndex: 0,
    explanation: `For this concept, the first item is accessed with index ${spec.firstIndex}.`,
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: `A ${spec.kindLabel} can hold more than one value.`,
    correct: true,
    explanation: `${spec.kindLabel[0].toUpperCase()}${spec.kindLabel.slice(1)}s are used to keep several values together in order.`,
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code reads the second item.",
    code: spec.accessCode,
    correct: true,
    explanation: "The index shown accesses the item in the second position for this collection.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.accessCode,
    options: [spec.accessOutput, "10", "30", "error"],
    correctIndex: 0,
    correctAnswer: spec.accessOutput,
    explanation: "The code accesses the item at index 1, which is the second stored value.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.lengthCode,
    options: [spec.lengthOutput, "2", "30", "error"],
    correctIndex: 0,
    correctAnswer: spec.lengthOutput,
    explanation: `The collection contains three items, so the length expression returns ${spec.lengthOutput}.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the index used for the first item.",
    code: `${spec.accessCode}\n${spec.commentPrefix} first-item index: _____`,
    correctAnswer: spec.firstIndex,
    explanation: `The first item is reached with index ${spec.firstIndex} in this concept.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the length helper used by this language.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} length helper: _____`,
    correctAnswer: spec.lengthToken,
    explanation: `This language uses \`${spec.lengthToken}\` as the length helper in the shown code.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: `Build the ${spec.kindLabel} declaration.`,
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: `The correct tokens build a valid ${spec.kindLabel} declaration for this language.`,
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each collection expression to what it means.",
    pairs: spec.matchPairsBasic,
    explanation: "These pairs cover the literal itself, indexing, and checking the collection size.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: `What does indexing let you do with a ${spec.kindLabel}?`,
    options: [
      "Access one stored item by position",
      "Turn it into a function",
      "Remove the need for variables",
      "Automatically sort it",
    ],
    correctIndex: 0,
    explanation: "Indexes let you read or update individual items by their position in the collection.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why is a length expression useful?",
    options: [
      "It tells you how many items are stored",
      "It changes the first item automatically",
      "It creates a loop for you",
      "It converts the collection into text",
    ],
    correctIndex: 0,
    explanation: "The length tells you the size of the collection, which is important for loops and boundary checks.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "Changing one indexed position updates that item in the collection.",
    correct: true,
    explanation: "Assigning to an index replaces the value stored at that position.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code replaces the first item with 99.",
    code: spec.updateCode,
    correct: true,
    explanation: "The assignment to index 0 changes the first stored value before it is printed.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.updateCode,
    options: [spec.updateOutput, "10", "20", "error"],
    correctIndex: 0,
    correctAnswer: spec.updateOutput,
    explanation: "The first item is updated to 99, so reading it afterward shows 99.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.sumCode,
    options: [spec.sumOutput, "20", "50", "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "The code reads two items from the collection and adds them together.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the collection variable name used in this code.",
    code: `${spec.updateCode}\n${spec.commentPrefix} collection variable: _____`,
    correctAnswer: "nums",
    explanation: "The collection variable is named `nums` in this example.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the index used to update the first item.",
    code: `${spec.updateCode}\n${spec.commentPrefix} updated index: _____`,
    correctAnswer: spec.firstIndex,
    explanation: `The first item is updated at index ${spec.firstIndex}.`,
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the expression that reads the second item.",
    tokens: ["nums", "[", "1", "]", "0", "length", "len"],
    correctTokens: ["nums", "[", "1", "]"],
    correctAnswer: "nums [ 1 ]",
    explanation: "The second item is read using index 1 in these sequence concepts.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each sequence pattern to what it does.",
    pairs: spec.matchPairsMid,
    explanation: "These patterns show updating, reading, measuring, and using stored items in an expression.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the length helper used by this language.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} length helper: _____`,
    options: spec.lengthOptions,
    correctIndex: spec.lengthOptions.indexOf(spec.lengthToken),
    correctAnswer: spec.lengthToken,
    explanation: `The correct length helper is \`${spec.lengthToken}\`, which differs by language.`,
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: `Why is storing numbers in a ${spec.kindLabel} useful?`,
    options: [
      "You can access and combine multiple related values",
      "It makes all indexes start at 1",
      "It removes the need for variables",
      "It turns numbers into comments",
    ],
    correctIndex: 0,
    explanation: `${spec.kindLabel[0].toUpperCase()}${spec.kindLabel.slice(1)}s help group related values so you can work with them together.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What happens if you use indexing inside a math expression?",
    options: [
      "The indexed values can be combined like normal numbers",
      "The collection stops existing",
      "The indexes become comments",
      "The length changes automatically",
    ],
    correctIndex: 0,
    explanation: "Reading an indexed item gives you the stored value, which you can then use in calculations or other expressions.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A collection item can be read and used in a larger expression.",
    correct: true,
    explanation: "Indexed values behave like normal values once they are read, so you can add them, compare them, or print them.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code adds the first two stored values and displays 30.",
    code: spec.sumCode,
    correct: true,
    explanation: "The first two items are 10 and 20, and their sum is 30.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.sumCode,
    options: [spec.sumOutput, spec.lengthOutput, spec.updateOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.sumOutput,
    explanation: "The code reads the first two stored values and adds them together before printing the result.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.lengthCode,
    options: [spec.lengthOutput, spec.sumOutput, "2", "error"],
    correctIndex: 0,
    correctAnswer: spec.lengthOutput,
    explanation: "The collection still has three items, so the length expression returns 3.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the helper used to measure this collection.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} size helper: _____`,
    correctAnswer: spec.lengthToken,
    explanation: `The helper used in the code is \`${spec.lengthToken}\`.`,
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the collection variable used in this expression.",
    code: `${spec.sumCode}\n${spec.commentPrefix} collection variable: _____`,
    correctAnswer: "nums",
    explanation: "The collection variable named `nums` is used throughout the expression.",
  });
  const hardWordBankCorrect = (() => {
    if (language === "java") return ["nums", ".", "length"];
    if (language === "csharp") return ["nums", ".", "Length"];
    if (language === "rust") return ["nums", ".", "len", "(", ")"];
    if (language === "python") return ["len", "(", "nums", ")"];
    return ["nums", ".", "length"];
  })();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the expression that gets the collection length.",
    tokens: [...hardWordBankCorrect, "print", "return", "count"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This expression reads the number of stored items using the length helper for the language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each collection pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These examples show indexing, replacement, measuring size, and combining stored values.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the length helper used by this language.",
    code: `${spec.lengthCode}\n${spec.commentPrefix} size helper: _____`,
    options: spec.lengthOptions,
    correctIndex: spec.lengthOptions.indexOf(spec.lengthToken),
    correctAnswer: spec.lengthToken,
    explanation: `The correct size helper is \`${spec.lengthToken}\`, and that naming differs across languages.`,
  });

  return ensureQuestionCount(q.done(), language, concept);
}
