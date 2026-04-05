import type { Question } from "../types";
import { createQuestionFactory, ensureQuestionCount, joinTokens, tfQuestion } from "../builderUtils";

export function buildUserInputQuestions(concept: string): Question[] {
  const q = createQuestionFactory("python", concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What does `input()` do in Python?",
    options: [
      "Reads text entered by the user",
      "Prints text to the screen",
      "Creates a list",
      "Starts a loop",
    ],
    correctIndex: 0,
    explanation: "`input()` waits for the user to type something and returns that text as a string.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which line stores user input in a variable?",
    options: [
      "name = input('Name: ')",
      "print('Name: ')",
      "input = 'Name'",
      "name = print('Name: ')",
    ],
    correctIndex: 0,
    explanation: "The `input()` call reads text and assigns it to the variable `name`.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What type of value does `input()` return by default?",
    options: ["A string", "An integer", "A list", "A boolean"],
    correctIndex: 0,
    explanation: "`input()` returns text. If you need a number, you usually convert the result with `int()` or `float()`.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "Python `input()` returns text by default.",
    correct: true,
    explanation: "Even if the user types digits, the raw result from `input()` is still a string until you convert it.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `Ada`.",
    code: "import builtins\nbuiltins.input = lambda prompt='': 'Ada'\nname = input('Name: ')\nprint(name)",
    correct: true,
    explanation: "The stubbed `input()` returns Ada, which is stored in `name` and then printed.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': 'Ada'\nname = input('Name: ')\nprint(name)",
    options: ["Ada", "Name:", "input", "error"],
    correctIndex: 0,
    correctAnswer: "Ada",
    explanation: "The user input value is stored in `name`, then printed.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': '5'\ntext = input('Number: ')\nprint(text)",
    options: ["5", "Number:", "text", "error"],
    correctIndex: 0,
    correctAnswer: "5",
    explanation: "The stubbed input returns the text `5`, so printing the variable shows 5.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the function that reads user text.",
    code: "name = input('Name: ')  # input function: _____",
    correctAnswer: "input",
    explanation: "`input` is the Python function used to read text from the user.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the variable that stores the user's answer.",
    code: "name = input('Name: ')  # stored variable: _____",
    correctAnswer: "name",
    explanation: "The variable `name` stores the value returned by `input()`.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build the line that stores a name from user input.",
    tokens: ["name", "=", "input", "(", "'Name: '", ")", "print", "range"],
    correctTokens: ["name", "=", "input", "(", "'Name: '", ")"],
    correctAnswer: "name = input ( 'Name: ' )",
    explanation: "This line reads the user's answer and stores it in the variable `name`.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each input pattern to what it does.",
    pairs: [
      { left: "input('Name: ')", right: "reads text from the user" },
      { left: "name = input('Name: ')", right: "stores user input in `name`" },
      { left: "print(name)", right: "displays the stored answer" },
      { left: "int(input('Age: '))", right: "reads text and converts it to an integer" },
    ],
    explanation: "These patterns show reading input, storing it, displaying it, and converting it.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why do beginners often use `int(input(...))`?",
    options: [
      "To turn text input into a number",
      "To turn numbers into comments",
      "To make `input()` print text",
      "To start a while loop",
    ],
    correctIndex: 0,
    explanation: "`input()` returns text, so `int()` is often used when the program needs a numeric value.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why store the result of `input()` in a variable?",
    options: [
      "So you can reuse the user's answer later",
      "So Python can create a function automatically",
      "So the answer becomes a comment",
      "So the input turns into a list",
    ],
    correctIndex: 0,
    explanation: "Storing input in a variable lets you print it, compare it, or convert it later in the program.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "You can convert the result of `input()` before using it in math.",
    correct: true,
    explanation: "That is why beginners often wrap `input()` with functions like `int()`.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code displays 6.",
    code: "import builtins\nbuiltins.input = lambda prompt='': '5'\nnumber = int(input('Number: '))\nprint(number + 1)",
    correct: true,
    explanation: "The input text `5` is converted to the number 5, so adding 1 produces 6.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': '5'\nnumber = int(input('Number: '))\nprint(number + 1)",
    options: ["6", "51", "5", "error"],
    correctIndex: 0,
    correctAnswer: "6",
    explanation: "Because the input is converted with `int()`, the program does numeric addition instead of string joining.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': 'Ada'\nname = input('Name: ')\nprint('Hi ' + name)",
    options: ["Hi Ada", "Ada", "Hi", "error"],
    correctIndex: 0,
    correctAnswer: "Hi Ada",
    explanation: "The input value is stored in `name`, then combined with other text before being printed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the function used to convert text input into an integer.",
    code: "number = int(input('Number: '))  # conversion function: _____",
    correctAnswer: "int",
    explanation: "`int` converts the text returned by `input()` into an integer value.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the function that reads the user's answer.",
    code: "number = int(input('Number: '))  # reading function: _____",
    correctAnswer: "input",
    explanation: "`input` is the function that reads the user's text before `int` converts it.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the expression that reads a number and converts it to an integer.",
    tokens: ["int", "(", "input", "(", "'Number: '", ")", ")", "print", "range"],
    correctTokens: ["int", "(", "input", "(", "'Number: '", ")", ")"],
    correctAnswer: "int ( input ( 'Number: ' ) )",
    explanation: "This expression first reads text from the user, then converts it to an integer.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each input expression to its result.",
    pairs: [
      { left: "input('Name: ')", right: "returns text" },
      { left: "int(input('Age: '))", right: "returns an integer" },
      { left: "name = input('Name: ')", right: "stores the answer" },
      { left: "print('Hi ' + name)", right: "uses the stored answer in output" },
    ],
    explanation: "These patterns connect raw input, conversion, storing input, and using input later.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the function that converts input text into an integer.",
    code: "number = int(input('Number: '))  # conversion function: _____",
    options: ["int", "print", "range", "str"],
    correctIndex: 0,
    correctAnswer: "int",
    explanation: "`int()` is the conversion function used here to turn the input text into a number.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "Why is it important to remember that `input()` returns text?",
    options: [
      "Because math often needs a conversion step first",
      "Because strings cannot be stored in variables",
      "Because `input()` only works inside loops",
      "Because text cannot be printed",
    ],
    correctIndex: 0,
    explanation: "If you forget that `input()` returns a string, your math code may behave differently than you expect.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main advantage of storing input in a variable before using it?",
    options: [
      "You can reuse, compare, or convert it later",
      "It turns the input into a comment",
      "It forces the input to be a number",
      "It stops the program from printing",
    ],
    correctIndex: 0,
    explanation: "A stored input value can be used in more than one place, which is why variables and input work together so often.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "A converted input value can be used in arithmetic.",
    correct: true,
    explanation: "Once text input is converted to a number, it can be used in math expressions like any other number.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code displays 12.",
    code: "import builtins\nbuiltins.input = lambda prompt='': '4'\nvalue = int(input('Value: '))\nprint(value * 3)",
    correct: true,
    explanation: "The input text `4` is converted to the integer 4, and then multiplied by 3 to get 12.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': '4'\nvalue = int(input('Value: '))\nprint(value * 3)",
    options: ["12", "43", "4", "error"],
    correctIndex: 0,
    correctAnswer: "12",
    explanation: "The converted number 4 is used in multiplication, so the result printed is 12.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "import builtins\nbuiltins.input = lambda prompt='': 'Pico'\nword = input('Word: ')\nprint(word + '!')",
    options: ["Pico!", "Pico", "!", "error"],
    correctIndex: 0,
    correctAnswer: "Pico!",
    explanation: "The input text is stored in `word` and then combined with an exclamation mark before printing.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the variable that stores the converted number.",
    code: "value = int(input('Value: '))  # converted number variable: _____",
    correctAnswer: "value",
    explanation: "The converted number is stored in the variable `value`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the conversion function used here.",
    code: "value = int(input('Value: '))  # conversion function: _____",
    correctAnswer: "int",
    explanation: "`int` converts the text input into a number for arithmetic.",
  });
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the line that stores converted numeric input in `value`.",
    tokens: ["value", "=", "int", "(", "input", "(", "'Value: '", ")", ")", "print", "range"],
    correctTokens: ["value", "=", "int", "(", "input", "(", "'Value: '", ")", ")"],
    correctAnswer: "value = int ( input ( 'Value: ' ) )",
    explanation: "This line reads text from the user, converts it to an integer, and stores the result in `value`.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each input pattern to its purpose.",
    pairs: [
      { left: "input('Word: ')", right: "reads text" },
      { left: "int(input('Value: '))", right: "reads and converts to a number" },
      { left: "word + '!'", right: "uses stored input in a string expression" },
      { left: "value * 3", right: "uses converted input in math" },
    ],
    explanation: "These patterns show how raw input, conversion, and later use of the input value fit together.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the function that reads user input.",
    code: "value = int(input('Value: '))  # reading function: _____",
    options: ["input", "print", "range", "len"],
    correctIndex: 0,
    correctAnswer: "input",
    explanation: "`input()` is the function that reads the user's answer before any conversion happens.",
  });

  return ensureQuestionCount(q.done(), "python", concept);
}

export function buildCommentsQuestions(concept: string): Question[] {
  const q = createQuestionFactory("python", concept);

  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "What is a comment in Python?",
    options: [
      "A note for humans that Python ignores",
      "A special kind of variable",
      "A loop that runs once",
      "A function that prints text",
    ],
    correctIndex: 0,
    explanation: "Comments are for explaining code to people. Python ignores them when the program runs.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Which symbol starts a Python comment?",
    options: ["#", "//", "--", "/*"],
    correctIndex: 0,
    explanation: "Python uses `#` to start a comment. Other languages often use `//` or `--` instead.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 1,
    prompt: "Why are comments useful?",
    options: [
      "They explain code for readers",
      "They make loops faster",
      "They automatically fix errors",
      "They turn text into numbers",
    ],
    correctIndex: 0,
    explanation: "Comments help humans understand code. They do not change what the program does.",
  });
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "Python ignores comment text when running code.",
    correct: true,
    explanation: "Comments are skipped by the interpreter, so they are only for human readers.",
  }));
  q.push(tfQuestion({
    difficulty: 1,
    prompt: "This code displays `Hi`.",
    code: "# this is a comment\nprint('Hi')",
    correct: true,
    explanation: "The comment is ignored, so the `print` line still runs and shows Hi.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "# greet the user\nprint('Hi')",
    options: ["Hi", "# greet the user", "nothing", "error"],
    correctIndex: 0,
    correctAnswer: "Hi",
    explanation: "The comment is ignored, so only the `print` line affects output.",
  });
  q.push({
    type: "mc_output",
    difficulty: 1,
    prompt: "What is the output of this code?",
    code: "print('A')\n# print('B')",
    options: ["A", "A\nB", "B", "error"],
    correctIndex: 0,
    correctAnswer: "A",
    explanation: "The second line is commented out, so only `A` is printed.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the symbol that starts a Python comment.",
    code: "# comment symbol: _____",
    correctAnswer: "#",
    explanation: "Python comments start with `#`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 1,
    prompt: "Type the word that describes text Python ignores.",
    code: "# Python ignores this _____",
    correctAnswer: "comment",
    explanation: "The ignored text is called a comment.",
  });
  q.push({
    type: "word_bank",
    difficulty: 1,
    prompt: "Build a Python comment line.",
    tokens: ["#", "this", "is", "a", "comment", "print", "range"],
    correctTokens: ["#", "this", "is", "a", "comment"],
    correctAnswer: "# this is a comment",
    explanation: "A Python comment starts with `#` and then contains human-readable note text.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 1,
    prompt: "Match each comment example to what it does.",
    pairs: [
      { left: "# note", right: "ignored by Python" },
      { left: "print('Hi')", right: "runs and shows output" },
      { left: "# print('Bye')", right: "does not run" },
      { left: "# explain the next line", right: "helps human readers" },
    ],
    explanation: "These examples show the difference between real code and ignored comment text.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "What happens if you put `#` before a line of Python code?",
    options: [
      "That line becomes a comment and does not run",
      "That line runs twice",
      "That line becomes a variable",
      "That line turns into output",
    ],
    correctIndex: 0,
    explanation: "Placing `#` before a line turns the rest of that line into a comment.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 2,
    prompt: "Why might you comment out a line temporarily?",
    options: [
      "To stop it from running while testing",
      "To turn it into a function",
      "To make it run faster",
      "To create user input",
    ],
    correctIndex: 0,
    explanation: "Commenting out code is a common way to test or isolate behavior without deleting the line entirely.",
  });
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "A comment can appear on its own line before code.",
    correct: true,
    explanation: "Comments are often placed above code to explain what the next line or block is doing.",
  }));
  q.push(tfQuestion({
    difficulty: 2,
    prompt: "This code prints only `1`.",
    code: "print(1)\n# print(2)",
    correct: true,
    explanation: "The second line is commented out, so it does not run.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "print(1)\n# print(2)",
    options: ["1", "1\n2", "2", "error"],
    correctIndex: 0,
    correctAnswer: "1",
    explanation: "The comment prevents the second `print` from running.",
  });
  q.push({
    type: "mc_output",
    difficulty: 2,
    prompt: "What is the output of this code?",
    code: "# note about the next line\nprint('Go')",
    options: ["Go", "note about the next line", "nothing", "error"],
    correctIndex: 0,
    correctAnswer: "Go",
    explanation: "Only the `print` line affects program output. The comment is ignored.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the symbol that comments out a line.",
    code: "# comment-out symbol: _____",
    correctAnswer: "#",
    explanation: "In Python, `#` comments out the rest of the line.",
  });
  q.push({
    type: "fill_type",
    difficulty: 2,
    prompt: "Type the word for a line Python ignores.",
    code: "# ignored line type: _____",
    correctAnswer: "comment",
    explanation: "That kind of ignored note is called a comment.",
  });
  q.push({
    type: "word_bank",
    difficulty: 2,
    prompt: "Build the commented-out print line.",
    tokens: ["#", "print('Bye')", "print('Hi')", "range", "input"],
    correctTokens: ["#", "print('Bye')"],
    correctAnswer: "# print('Bye')",
    explanation: "Placing `#` before the print call comments the line out so it does not run.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 2,
    prompt: "Match each comment pattern to its effect.",
    pairs: [
      { left: "# print('Bye')", right: "commented-out code" },
      { left: "# explanation", right: "note for the reader" },
      { left: "print('Hi')", right: "active code" },
      { left: "# note\nprint('Hi')", right: "comment followed by running code" },
    ],
    explanation: "These examples show how comments explain code or temporarily disable lines.",
  });
  q.push({
    type: "fill_select",
    difficulty: 2,
    prompt: "Choose the symbol that starts a Python comment.",
    code: "# comment symbol: _____",
    options: ["#", "//", "--", "/*"],
    correctIndex: 0,
    correctAnswer: "#",
    explanation: "Python uses `#` for comments, unlike many other languages.",
  });

  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "What is the main benefit of clear comments?",
    options: [
      "They help humans understand code later",
      "They make code compile faster",
      "They replace all variable names",
      "They force code to run once",
    ],
    correctIndex: 0,
    explanation: "Good comments improve readability for you and other people who revisit the code later.",
  });
  q.push({
    type: "mc_concept",
    difficulty: 3,
    prompt: "When is a comment especially helpful?",
    options: [
      "When code would otherwise be hard to understand quickly",
      "When you want Python to ignore every line",
      "When you need to create a variable",
      "When you need a string method",
    ],
    correctIndex: 0,
    explanation: "Comments are most helpful when they clarify purpose or intent that may not be obvious at a glance.",
  });
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "Comments are for readers, not for changing program behavior directly.",
    correct: true,
    explanation: "Python ignores comments during execution, so they are mainly for explanation and temporary disabling of code.",
  }));
  q.push(tfQuestion({
    difficulty: 3,
    prompt: "This code prints only `Ready`.",
    code: "# setup note\nprint('Ready')\n# print('Later')",
    correct: true,
    explanation: "The comment lines are ignored, so only the active `print('Ready')` line runs.",
  }));
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "# setup note\nprint('Ready')\n# print('Later')",
    options: ["Ready", "Ready\nLater", "Later", "error"],
    correctIndex: 0,
    correctAnswer: "Ready",
    explanation: "Only the uncommented `print` line runs, so the output is Ready.",
  });
  q.push({
    type: "mc_output",
    difficulty: 3,
    prompt: "What is the output of this code?",
    code: "print('A')\n# temporary test line\nprint('B')",
    options: ["A\nB", "A", "B", "error"],
    correctIndex: 0,
    correctAnswer: "A\nB",
    explanation: "The comment line is ignored, so both active print statements run.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the symbol used for comments in Python.",
    code: "# Python comment symbol: _____",
    correctAnswer: "#",
    explanation: "Python comments begin with `#`.",
  });
  q.push({
    type: "fill_type",
    difficulty: 3,
    prompt: "Type the word for code that has been temporarily disabled with `#`.",
    code: "# temporarily disabled line type: _____",
    correctAnswer: "comment",
    explanation: "Once a line is prefixed with `#`, it becomes a comment and no longer runs.",
  });
  q.push({
    type: "word_bank",
    difficulty: 3,
    prompt: "Build the comment that says temporary test line.",
    tokens: ["#", "temporary", "test", "line", "print", "input"],
    correctTokens: ["#", "temporary", "test", "line"],
    correctAnswer: "# temporary test line",
    explanation: "This creates a readable comment line that Python ignores.",
  });
  q.push({
    type: "match_pairs",
    difficulty: 3,
    prompt: "Match each comment example to its purpose.",
    pairs: [
      { left: "# explain the next step", right: "clarifies intent for readers" },
      { left: "# print('Later')", right: "temporarily disables code" },
      { left: "# setup note", right: "adds context before code" },
      { left: "print('Ready')", right: "active code, not a comment" },
    ],
    explanation: "These examples separate active code from comments and show different reasons for using comments.",
  });
  q.push({
    type: "fill_select",
    difficulty: 3,
    prompt: "Choose the Python comment symbol.",
    code: "# Python comment symbol: _____",
    options: ["#", "//", "--", "/*"],
    correctIndex: 0,
    correctAnswer: "#",
    explanation: "The correct Python comment symbol is `#`.",
  });

  return ensureQuestionCount(q.done(), "python", concept);
}
