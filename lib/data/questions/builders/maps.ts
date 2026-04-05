import type { LearningLanguage } from "@/lib/courseContent";
import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

type MapsSpec = {
  kindLabel: string;
  declaration: string;
  declarationDistractors: string[];
  commentPrefix: string;
  accessForm: string;
  updateKey: string;
  accessCode: string;
  accessOutput: string;
  updateCode: string;
  updateOutput: string;
  secondCode: string;
  secondOutput: string;
  wordBankTokens: string[];
  wordBankCorrect: string[];
  accessOptions: string[];
  matchPairsBasic: { left: string; right: string }[];
  matchPairsMid: { left: string; right: string }[];
  matchPairsHard: { left: string; right: string }[];
};

function getMapsSpec(language: LearningLanguage): MapsSpec {
  if (language === "python") {
    return {
      kindLabel: "dictionary",
      declaration: "person = {'name': 'Ada', 'age': 12}",
      declarationDistractors: ["const person = { name: 'Ada', age: 12 };", "person = ['Ada', 12]", "local person = {name = 'Ada'}"],
      commentPrefix: "#",
      accessForm: "person['name']",
      updateKey: "'age'",
      accessCode: "person = {'name': 'Ada', 'age': 12}\nprint(person['name'])",
      accessOutput: "Ada",
      updateCode: "person = {'name': 'Ada', 'age': 12}\nperson['age'] = 13\nprint(person['age'])",
      updateOutput: "13",
      secondCode: "person = {'name': 'Ada', 'age': 12}\nprint(person['age'])",
      secondOutput: "12",
      wordBankTokens: ["person", "=", "{'name': 'Ada'}", "let", "const", "["],
      wordBankCorrect: ["person", "=", "{'name': 'Ada'}"],
      accessOptions: ["person['name']", "person.name", "person(name)", "name['person']"],
      matchPairsBasic: [
        { left: "{'name': 'Ada'}", right: "dictionary literal" },
        { left: "'name'", right: "key" },
        { left: "person['name']", right: "reads a value by key" },
        { left: "person['age'] = 13", right: "updates a value by key" },
      ],
      matchPairsMid: [
        { left: "person['name']", right: "reads the name value" },
        { left: "person['age']", right: "reads the age value" },
        { left: "person['age'] = 13", right: "changes the age" },
        { left: "'age'", right: "dictionary key" },
      ],
      matchPairsHard: [
        { left: "person['name']", right: "access by key" },
        { left: "person['age'] = 13", right: "updates stored data" },
        { left: "{'name': 'Ada', 'age': 12}", right: "stores key-value pairs" },
        { left: "print(person['age'])", right: "displays a value from the dictionary" },
      ],
    };
  }
  if (language === "javascript") {
    return {
      kindLabel: "object",
      declaration: "const person = { name: 'Ada', age: 12 };",
      declarationDistractors: ["person = {'name': 'Ada', 'age': 12}", "person = ['Ada', 12]", "local person = {name = 'Ada'}"],
      commentPrefix: "//",
      accessForm: "person.name",
      updateKey: "age",
      accessCode: "const person = { name: 'Ada', age: 12 };\nconsole.log(person.name);",
      accessOutput: "Ada",
      updateCode: "const person = { name: 'Ada', age: 12 };\nperson.age = 13;\nconsole.log(person.age);",
      updateOutput: "13",
      secondCode: "const person = { name: 'Ada', age: 12 };\nconsole.log(person.age);",
      secondOutput: "12",
      wordBankTokens: ["const", "person", "=", "{ name: 'Ada' }", ";", "let", "["],
      wordBankCorrect: ["const", "person", "=", "{ name: 'Ada' }", ";"],
      accessOptions: ["person.name", "person['name']", "person(name)", "name.person"],
      matchPairsBasic: [
        { left: "{ name: 'Ada' }", right: "object literal" },
        { left: "name", right: "property key" },
        { left: "person.name", right: "reads a value by property" },
        { left: "person.age = 13;", right: "updates a value by property" },
      ],
      matchPairsMid: [
        { left: "person.name", right: "reads the name value" },
        { left: "person.age", right: "reads the age value" },
        { left: "person.age = 13;", right: "changes the age" },
        { left: "age", right: "object property key" },
      ],
      matchPairsHard: [
        { left: "person.name", right: "access by property" },
        { left: "person.age = 13;", right: "updates stored data" },
        { left: "{ name: 'Ada', age: 12 }", right: "stores key-value pairs" },
        { left: "console.log(person.age);", right: "displays a value from the object" },
      ],
    };
  }
  if (language === "typescript") {
    return {
      kindLabel: "object",
      declaration: "const person: { name: string; age: number } = { name: 'Ada', age: 12 };",
      declarationDistractors: ["person = {'name': 'Ada', 'age': 12}", "person = ['Ada', 12]", "local person = {name = 'Ada'}"],
      commentPrefix: "//",
      accessForm: "person.name",
      updateKey: "age",
      accessCode: "const person: { name: string; age: number } = { name: 'Ada', age: 12 };\nconsole.log(person.name);",
      accessOutput: "Ada",
      updateCode: "const person: { name: string; age: number } = { name: 'Ada', age: 12 };\nperson.age = 13;\nconsole.log(person.age);",
      updateOutput: "13",
      secondCode: "const person: { name: string; age: number } = { name: 'Ada', age: 12 };\nconsole.log(person.age);",
      secondOutput: "12",
      wordBankTokens: ["const", "person", ":", "{ name: string }", "=", "{ name: 'Ada' }", ";", "let"],
      wordBankCorrect: ["const", "person", ":", "{ name: string }", "=", "{ name: 'Ada' }", ";"],
      accessOptions: ["person.name", "person['name']", "person(name)", "name.person"],
      matchPairsBasic: [
        { left: "{ name: 'Ada' }", right: "object literal" },
        { left: "name", right: "property key" },
        { left: "person.name", right: "reads a value by property" },
        { left: "person.age = 13;", right: "updates a value by property" },
      ],
      matchPairsMid: [
        { left: "person.name", right: "reads the name value" },
        { left: "person.age", right: "reads the age value" },
        { left: "person.age = 13;", right: "changes the age" },
        { left: "age", right: "object property key" },
      ],
      matchPairsHard: [
        { left: "person.name", right: "access by property" },
        { left: "person.age = 13;", right: "updates stored data" },
        { left: "{ name: 'Ada', age: 12 }", right: "stores key-value pairs" },
        { left: "console.log(person.age);", right: "displays a value from the object" },
      ],
    };
  }
  throw new Error(`Unsupported map language: ${language}`);
}

export function buildMapsQuestions(language: LearningLanguage, concept: string): Question[] {
  const spec = getMapsSpec(language);
  const q = createQuestionFactory(language, concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `What does a ${spec.kindLabel} store?`,
    options: [
      "Key-value pairs",
      "Only numbered positions",
      "Only function definitions",
      "Only comments",
    ],
    correctIndex: 0,
    explanation: `${spec.kindLabel[0].toUpperCase()}${spec.kindLabel.slice(1)}s store values under named keys or properties instead of only numeric positions.`,
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: `Which line correctly creates a ${spec.kindLabel}?`,
    options: [spec.declaration, ...spec.declarationDistractors],
    correctIndex: 0,
    explanation: "The correct literal uses this language's key-value syntax. The distractors mix in list or table syntax from other languages.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "How do you get a value from this concept?",
    options: [spec.accessForm, "print(value)", "value[0]", "loop(value)"],
    correctIndex: 0,
    explanation: `The correct answer shows this language's access form for reading a value by key or property.`,
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: `A ${spec.kindLabel} lets you look up values by key or property name.`,
    correct: true,
    explanation: "That is the main idea behind dictionaries and objects. Instead of positions only, you use names like keys or properties.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code reads the name value.",
    code: spec.accessCode,
    correct: true,
    explanation: "The code accesses the value stored under the name key or property and displays it.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.accessCode,
    options: [spec.accessOutput, spec.secondOutput, "name", "error"],
    correctIndex: 0,
    correctAnswer: spec.accessOutput,
    explanation: "The code reads the value stored for the name field, which is Ada.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: spec.secondCode,
    options: [spec.secondOutput, spec.accessOutput, "age", "error"],
    correctIndex: 0,
    correctAnswer: spec.secondOutput,
    explanation: "The code reads the age value from the dictionary or object, so the output is 12.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable name that stores this data.",
    code: `${spec.accessCode}\n${spec.commentPrefix} data variable: _____`,
    correctAnswer: "person",
    explanation: "The dictionary or object variable is named `person` in this example.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the key or property used in this access.",
    code: `${spec.accessCode}\n${spec.commentPrefix} accessed key or property: _____`,
    correctAnswer: "name",
    explanation: "The code reads the value stored under the key or property `name`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: `Build the ${spec.kindLabel} declaration.`,
    tokens: spec.wordBankTokens,
    correctTokens: spec.wordBankCorrect,
    correctAnswer: joinTokens(spec.wordBankCorrect),
    explanation: "The correct tokens form a valid key-value literal in this language.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each key-value pattern to what it means.",
    pairs: spec.matchPairsBasic,
    explanation: "These pairs show literals, keys, reading values, and updating stored data.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: `What does updating a key or property do in a ${spec.kindLabel}?`,
    options: [
      "It replaces the stored value for that key or property",
      "It removes every other entry",
      "It turns the object into a list",
      "It changes all keys at once",
    ],
    correctIndex: 0,
    explanation: "Updating a key or property changes the value stored at that one location.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why are named keys or properties useful?",
    options: [
      "They make data meaning easier to understand",
      "They force every value to be a number",
      "They remove the need for variables",
      "They stop all updates",
    ],
    correctIndex: 0,
    explanation: "Named keys make code clearer because `name` and `age` describe what the values represent.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "A key or property can be updated after the object or dictionary is created.",
    correct: true,
    explanation: "These structures are commonly used because values can be changed by key or property name.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code changes the age value to 13.",
    code: spec.updateCode,
    correct: true,
    explanation: "The update line replaces the old age with 13 before the output line reads it.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.updateCode,
    options: [spec.updateOutput, spec.secondOutput, spec.accessOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.updateOutput,
    explanation: "The age is updated before it is displayed, so the new value 13 appears.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: spec.accessCode,
    options: [spec.accessOutput, spec.secondOutput, spec.updateOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.accessOutput,
    explanation: "Reading the name key or property returns Ada in this example.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the key or property that gets updated.",
    code: `${spec.updateCode}\n${spec.commentPrefix} updated key or property: _____`,
    correctAnswer: spec.updateKey.replace(/'/g, ""),
    explanation: "The update targets the age field in this example.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that holds the key-value data.",
    code: `${spec.updateCode}\n${spec.commentPrefix} data variable: _____`,
    correctAnswer: "person",
    explanation: "The key-value data is stored in the variable `person`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the access expression that reads the name value.",
    tokens: (() => {
      if (language === "python") return ["person", "['name']", "person.name", "name", "."];
      return ["person", ".", "name", "person['name']", "name"];
    })(),
    correctTokens: (() => language === "python" ? ["person", "['name']"] : ["person", ".", "name"])(),
    correctAnswer: language === "python" ? "person ['name']" : "person . name",
    explanation: "The correct access form depends on the language's dictionary or object syntax.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each access pattern to its meaning.",
    pairs: spec.matchPairsMid,
    explanation: "These patterns distinguish reading values, changing them, and identifying the named fields.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the correct way to access the name value.",
    code: `${spec.accessCode}\n${spec.commentPrefix} access form: _____`,
    options: spec.accessOptions,
    correctIndex: spec.accessOptions.indexOf(spec.accessForm),
    correctAnswer: spec.accessForm,
    explanation: "The correct access form depends on whether the language uses bracket lookup or property access.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: `Why is a ${spec.kindLabel} often better than a list when values have names?`,
    options: [
      "You can access values by meaningful keys or properties",
      "It always uses less memory",
      "It removes the need for loops forever",
      "It forces values to be ordered alphabetically",
    ],
    correctIndex: 0,
    explanation: "Named fields like `name` and `age` make the data easier to understand than remembering numeric positions.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the effect of reading a key or property inside an output expression?",
    options: [
      "It retrieves the stored value for display",
      "It creates a new object automatically",
      "It turns the key into a loop",
      "It deletes the stored value",
    ],
    correctIndex: 0,
    explanation: "Accessing a field gives you the stored value, which can then be printed or used in another expression.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A named field can be read after a different field has been updated.",
    correct: true,
    explanation: "Updating one field does not stop you from reading others. Key-value data is meant to hold several named values together.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 13 after updating the age field.",
    code: spec.updateCode,
    correct: true,
    explanation: "The update happens before the value is displayed, so the output reflects the new age.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.updateCode,
    options: [spec.updateOutput, spec.secondOutput, spec.accessOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.updateOutput,
    explanation: "The code updates the age field and then displays the updated value.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: spec.secondCode,
    options: [spec.secondOutput, spec.accessOutput, spec.updateOutput, "error"],
    correctIndex: 0,
    correctAnswer: spec.secondOutput,
    explanation: "This code reads the age field without changing it, so the output is the original value 12.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the field name being read in this code.",
    code: `${spec.secondCode}\n${spec.commentPrefix} read field name: _____`,
    correctAnswer: "age",
    explanation: "The code reads the `age` field in this example.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable that stores the key-value data.",
    code: `${spec.secondCode}\n${spec.commentPrefix} data variable: _____`,
    correctAnswer: "person",
    explanation: "The named data is stored in the variable `person`.",
  });
  const hardWordBankCorrect = (() => language === "python" ? ["person", "['age']"] : ["person", ".", "age"])();
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the access expression that reads the age value.",
    tokens: [...hardWordBankCorrect, "print", "loop", "name"],
    correctTokens: hardWordBankCorrect,
    correctAnswer: joinTokens(hardWordBankCorrect),
    explanation: "This expression reads the value stored under the age field.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each key-value pattern to its effect.",
    pairs: spec.matchPairsHard,
    explanation: "These examples show access, updates, stored structure, and output of named values.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the correct access form for the name value.",
    code: `${spec.accessCode}\n${spec.commentPrefix} access form: _____`,
    options: spec.accessOptions,
    correctIndex: spec.accessOptions.indexOf(spec.accessForm),
    correctAnswer: spec.accessForm,
    explanation: "The language chooses either property access or bracket lookup for this field access.",
  });

  return ensureQuestionCount(q.done(), language, concept);
}
