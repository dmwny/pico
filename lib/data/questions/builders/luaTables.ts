import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

export function buildLuaTablesQuestions(concept: string): Question[] {
  const q = createQuestionFactory("lua", concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What is a table in Lua?",
    options: [
      "A structure that can store multiple values",
      "A comment symbol",
      "A function return type",
      "A loop keyword",
    ],
    correctIndex: 0,
    explanation: "Tables are Lua's main data structure. They can act like arrays, dictionaries, or a mix of both.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line correctly creates a simple Lua table of numbers?",
    options: [
      "local nums = {10, 20, 30}",
      "const nums = [10, 20, 30];",
      "nums = [10, 20, 30]",
      "int[] nums = {10, 20, 30};",
    ],
    correctIndex: 0,
    explanation: "Lua uses braces for table literals and `local` for a local variable.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What index refers to the first array-like item in a Lua table?",
    options: ["1", "0", "-1", "2"],
    correctIndex: 0,
    explanation: "Lua uses 1-based indexing, which is a common beginner difference from many other languages.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "Lua tables can be used to store values by position.",
    correct: true,
    explanation: "Tables can act like arrays when you store values in numbered positions.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `10`.",
    code: "local nums = {10, 20, 30}\nprint(nums[1])",
    correct: true,
    explanation: "Because Lua starts indexing at 1, `nums[1]` is the first item and prints 10.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "local nums = {10, 20, 30}\nprint(nums[1])",
    options: ["10", "20", "30", "error"],
    correctIndex: 0,
    correctAnswer: "10",
    explanation: "Lua tables use 1-based indexing, so index 1 accesses the first stored value.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "local person = {name = 'Ada', age = 12}\nprint(person.name)",
    options: ["Ada", "12", "name", "error"],
    correctIndex: 0,
    correctAnswer: "Ada",
    explanation: "The table stores a named field called `name`, and `person.name` reads that value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the index used for the first item in a Lua table.",
    code: "local nums = {10, 20, 30}\nprint(nums[1]) -- first-item index: _____",
    correctAnswer: "1",
    explanation: "Lua starts array-style indexing at 1.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the keyword used for a local table variable.",
    code: "local nums = {10, 20, 30} -- local variable keyword: _____",
    correctAnswer: "local",
    explanation: "The `local` keyword creates a local variable in Lua.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the Lua table declaration for three numbers.",
    tokens: ["local", "nums", "=", "{10, 20, 30}", "let", "const", "["],
    correctTokens: ["local", "nums", "=", "{10, 20, 30}"],
    correctAnswer: "local nums = {10, 20, 30}",
    explanation: "This is the basic Lua syntax for a local table variable.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each Lua table pattern to what it means.",
    pairs: [
      { left: "{10, 20, 30}", right: "array-like table" },
      { left: "nums[1]", right: "first item" },
      { left: "{name = 'Ada'}", right: "named-field table" },
      { left: "person.name", right: "read a named field" },
    ],
    explanation: "Lua tables can be used with numeric positions or named fields.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What makes Lua tables flexible?",
    options: [
      "They can store array-like values and named fields",
      "They only work with numbers",
      "They automatically print themselves",
      "They replace all functions",
    ],
    correctIndex: 0,
    explanation: "Lua tables can hold ordered values, named fields, or both, which makes them very flexible.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "How do you read a named field from a Lua table?",
    options: ["person.name", "person['name']", "person(name)", "name.person"],
    correctIndex: 0,
    explanation: "Dot notation is a beginner-friendly way to read a named field from a Lua table.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "Lua tables can store values by name as well as by position.",
    correct: true,
    explanation: "That is one of the reasons tables are the main data structure in Lua.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code changes the second value to 99 and then displays 99.",
    code: "local nums = {10, 20, 30}\nnums[2] = 99\nprint(nums[2])",
    correct: true,
    explanation: "Index 2 refers to the second item in Lua, and the assignment updates that position.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "local nums = {10, 20, 30}\nnums[2] = 99\nprint(nums[2])",
    options: ["99", "20", "10", "error"],
    correctIndex: 0,
    correctAnswer: "99",
    explanation: "The second item is updated to 99 before being printed.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "local person = {name = 'Ada', age = 12}\nperson.age = 13\nprint(person.age)",
    options: ["13", "12", "Ada", "error"],
    correctIndex: 0,
    correctAnswer: "13",
    explanation: "The named field `age` is updated before the output line reads it.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the field name that is updated in this code.",
    code: "local person = {name = 'Ada', age = 12}\nperson.age = 13\nprint(person.age) -- updated field: _____",
    correctAnswer: "age",
    explanation: "The code updates the field named `age`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the variable that stores the table.",
    code: "local person = {name = 'Ada', age = 12}\nprint(person.name) -- table variable: _____",
    correctAnswer: "person",
    explanation: "The table is stored in the variable `person`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the expression that reads the name field.",
    tokens: ["person", ".", "name", "person['name']", "name"],
    correctTokens: ["person", ".", "name"],
    correctAnswer: "person . name",
    explanation: "This is the beginner-friendly Lua syntax for reading the `name` field.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each table pattern to what it does.",
    pairs: [
      { left: "nums[2]", right: "second array-like item" },
      { left: "nums[2] = 99", right: "updates a numbered position" },
      { left: "person.age", right: "reads a named field" },
      { left: "person.age = 13", right: "updates a named field" },
    ],
    explanation: "These examples separate numeric indexing from named-field access and updates.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the correct field-access form in Lua.",
    code: "local person = {name = 'Ada'}\nprint(person.name) -- field access form: _____",
    options: ["person.name", "person['name']", "person(name)", "name.person"],
    correctIndex: 0,
    correctAnswer: "person.name",
    explanation: "Dot notation is the standard beginner form for reading a named field in a Lua table.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why are Lua tables used for so many different tasks?",
    options: [
      "Because they can represent many data shapes in one structure",
      "Because Lua has no functions",
      "Because tables only hold strings",
      "Because tables remove the need for variables",
    ],
    correctIndex: 0,
    explanation: "Tables are flexible enough to act like arrays, records, and other grouped data structures.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main beginner gotcha with array-like Lua tables?",
    options: [
      "They use 1-based indexing",
      "They cannot store numbers",
      "They cannot have named fields",
      "They always sort values automatically",
    ],
    correctIndex: 0,
    explanation: "Many other languages start arrays at 0, but Lua starts at 1.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A Lua table can store both numbered items and named fields.",
    correct: true,
    explanation: "That is part of what makes tables so flexible in Lua.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 30.",
    code: "local nums = {10, 20, 30}\nprint(nums[1] + nums[2])",
    correct: true,
    explanation: "With 1-based indexing, `nums[1]` is 10 and `nums[2]` is 20, so the sum is 30.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "local nums = {10, 20, 30}\nprint(nums[1] + nums[2])",
    options: ["30", "20", "10", "error"],
    correctIndex: 0,
    correctAnswer: "30",
    explanation: "The code adds the first and second values in the table using Lua's 1-based indexing.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "local person = {name = 'Ada', age = 12}\nprint(person.name .. '!')",
    options: ["Ada!", "Ada", "!", "error"],
    correctIndex: 0,
    correctAnswer: "Ada!",
    explanation: "The code reads the name field and joins it with another piece of text using `..`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the index used for the second array-like item in Lua.",
    code: "local nums = {10, 20, 30}\nprint(nums[2]) -- second-item index: _____",
    correctAnswer: "2",
    explanation: "Because Lua starts at 1, the second item is at index 2.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the field name used in this string expression.",
    code: "local person = {name = 'Ada', age = 12}\nprint(person.name .. '!') -- field name: _____",
    correctAnswer: "name",
    explanation: "The expression reads the `name` field from the table.",
  });
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the expression that reads the second array-like item.",
    tokens: ["nums", "[", "2", "]", "1", "name", "."],
    correctTokens: ["nums", "[", "2", "]"],
    correctAnswer: "nums [ 2 ]",
    explanation: "This expression reads the second item from an array-like Lua table.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each Lua table pattern to its effect.",
    pairs: [
      { left: "nums[1] + nums[2]", right: "uses numeric positions in an expression" },
      { left: "person.name", right: "reads a named field" },
      { left: "person.age = 13", right: "updates a named field" },
      { left: "{10, 20, 30}", right: "stores ordered values" },
    ],
    explanation: "These examples show the two main beginner uses of Lua tables: numbered positions and named fields.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the correct index for the first array-like item in Lua.",
    code: "local nums = {10, 20, 30}\nprint(nums[1]) -- first-item index: _____",
    options: ["1", "0", "2", "-1"],
    correctIndex: 0,
    correctAnswer: "1",
    explanation: "Lua uses 1-based indexing, so the first item is at index 1.",
  });

  return ensureQuestionCount(q.done(), "lua", concept);
}
