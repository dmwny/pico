import { getCourseSections, getLanguageCommentPrefix, getLanguageLabel, type LearningLanguage } from "@/lib/courseContent";
import type { LessonData, Question } from "./questionBank";

type LanguageProfile = {
  printCall: string;
  commentPrefix: string;
  mutableDecl: string;
  immutableDecl: string;
  inputLine: string;
  parseNumber: string;
  stringLength: string;
  upperCall: string;
  ifExample: string;
  loopExample: string;
  functionHeader: string;
  functionCall: string;
  collectionCreate: string;
  collectionRead: string;
  collectionWrite: string;
  collectionLoop: string;
  dataCreate: string;
  fileExample: string;
  classHeader: string;
  classFeature: string;
};

const PROFILES: Record<LearningLanguage, LanguageProfile> = {
  python: {
    printCall: "print('Hello')",
    commentPrefix: "#",
    mutableDecl: "score = 0",
    immutableDecl: "name = 'Pico'",
    inputLine: "name = input('Name: ')",
    parseNumber: "age = int(input('Age: '))",
    stringLength: "len(name)",
    upperCall: "name.upper()",
    ifExample: "if score > 10:\n    print('Big')",
    loopExample: "for i in range(3):\n    print(i)",
    functionHeader: "def greet(name):",
    functionCall: "greet('Pico')",
    collectionCreate: "items = ['a', 'b']",
    collectionRead: "items[0]",
    collectionWrite: "items.append('c')",
    collectionLoop: "for item in items:\n    print(item)",
    dataCreate: "person = {'name': 'Ava'}",
    fileExample: "with open('notes.txt', 'r') as file:\n    print(file.read())",
    classHeader: "class Dog:",
    classFeature: "def __init__(self, name):",
  },
  javascript: {
    printCall: "console.log('Hello');",
    commentPrefix: "//",
    mutableDecl: "let score = 0;",
    immutableDecl: "const name = 'Pico';",
    inputLine: "const name = prompt('Name?');",
    parseNumber: "const age = Number(prompt('Age?'));",
    stringLength: "name.length",
    upperCall: "name.toUpperCase()",
    ifExample: "if (score > 10) {\n  console.log('Big');\n}",
    loopExample: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
    functionHeader: "function greet(name) {",
    functionCall: "greet('Pico');",
    collectionCreate: "const items = ['a', 'b'];",
    collectionRead: "items[0]",
    collectionWrite: "items.push('c');",
    collectionLoop: "for (const item of items) {\n  console.log(item);\n}",
    dataCreate: "const person = { name: 'Ava' };",
    fileExample: "const text = await fetch('/notes.txt').then((r) => r.text());",
    classHeader: "class Dog {",
    classFeature: "constructor(name) {",
  },
  typescript: {
    printCall: "console.log('Hello');",
    commentPrefix: "//",
    mutableDecl: "let score: number = 0;",
    immutableDecl: "const name: string = 'Pico';",
    inputLine: "const name = prompt('Name?') ?? '';",
    parseNumber: "const age = Number(prompt('Age?') ?? '0');",
    stringLength: "name.length",
    upperCall: "name.toUpperCase()",
    ifExample: "if (score > 10) {\n  console.log('Big');\n}",
    loopExample: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
    functionHeader: "function greet(name: string): void {",
    functionCall: "greet('Pico');",
    collectionCreate: "const items: string[] = ['a', 'b'];",
    collectionRead: "items[0]",
    collectionWrite: "items.push('c');",
    collectionLoop: "for (const item of items) {\n  console.log(item);\n}",
    dataCreate: "const person: { name: string } = { name: 'Ava' };",
    fileExample: "const text = await fetch('/notes.txt').then((r) => r.text());",
    classHeader: "class Dog {",
    classFeature: "constructor(public name: string) {}",
  },
  java: {
    printCall: "System.out.println(\"Hello\");",
    commentPrefix: "//",
    mutableDecl: "int score = 0;",
    immutableDecl: "String name = \"Pico\";",
    inputLine: "String name = scanner.nextLine();",
    parseNumber: "int age = Integer.parseInt(scanner.nextLine());",
    stringLength: "name.length()",
    upperCall: "name.toUpperCase()",
    ifExample: "if (score > 10) {\n    System.out.println(\"Big\");\n}",
    loopExample: "for (int i = 0; i < 3; i++) {\n    System.out.println(i);\n}",
    functionHeader: "static void greet(String name) {",
    functionCall: "greet(\"Pico\");",
    collectionCreate: "String[] items = {\"a\", \"b\"};",
    collectionRead: "items[0]",
    collectionWrite: "names.add(\"c\");",
    collectionLoop: "for (String item : items) {\n    System.out.println(item);\n}",
    dataCreate: "HashMap<String, String> person = new HashMap<>();",
    fileExample: "String text = Files.readString(Path.of(\"notes.txt\"));",
    classHeader: "class Dog {",
    classFeature: "Dog(String name) {",
  },
  csharp: {
    printCall: 'Console.WriteLine("Hello");',
    commentPrefix: "//",
    mutableDecl: "int score = 0;",
    immutableDecl: 'string name = "Pico";',
    inputLine: "string? name = Console.ReadLine();",
    parseNumber: "int age = int.Parse(Console.ReadLine() ?? \"0\");",
    stringLength: "name.Length",
    upperCall: "name.ToUpper()",
    ifExample: "if (score > 10)\n{\n    Console.WriteLine(\"Big\");\n}",
    loopExample: "for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine(i);\n}",
    functionHeader: "static void Greet(string name)",
    functionCall: 'Greet("Pico");',
    collectionCreate: 'var items = new List<string> { "a", "b" };',
    collectionRead: "items[0]",
    collectionWrite: 'items.Add("c");',
    collectionLoop: "foreach (var item in items)\n{\n    Console.WriteLine(item);\n}",
    dataCreate: 'var person = new Dictionary<string, string> { ["name"] = "Ava" };',
    fileExample: 'var text = File.ReadAllText("notes.txt");',
    classHeader: "class Dog",
    classFeature: "public Dog(string name)",
  },
  rust: {
    printCall: 'println!("Hello");',
    commentPrefix: "//",
    mutableDecl: "let mut score = 0;",
    immutableDecl: 'let name = "Pico";',
    inputLine: "std::io::stdin().read_line(&mut name).unwrap();",
    parseNumber: 'let age: i32 = input.trim().parse().unwrap();',
    stringLength: "name.len()",
    upperCall: "name.to_uppercase()",
    ifExample: 'if score > 10 {\n    println!("Big");\n}',
    loopExample: 'for i in 0..3 {\n    println!("{}", i);\n}',
    functionHeader: "fn greet(name: &str) {",
    functionCall: 'greet("Pico");',
    collectionCreate: "let items = vec![\"a\", \"b\"];",
    collectionRead: "items[0]",
    collectionWrite: 'items.push("c");',
    collectionLoop: 'for item in &items {\n    println!("{}", item);\n}',
    dataCreate: 'let person = [("name", "Ava")];',
    fileExample: 'let text = std::fs::read_to_string("notes.txt").unwrap();',
    classHeader: "struct Dog {",
    classFeature: "name: String,",
  },
  lua: {
    printCall: "print('Hello')",
    commentPrefix: "--",
    mutableDecl: "local score = 0",
    immutableDecl: "local name = 'Pico'",
    inputLine: "local name = io.read()",
    parseNumber: "local age = tonumber(io.read())",
    stringLength: "#name",
    upperCall: "string.upper(name)",
    ifExample: "if score > 10 then\n  print('Big')\nend",
    loopExample: "for i = 1, 3 do\n  print(i)\nend",
    functionHeader: "local function greet(name)",
    functionCall: "greet('Pico')",
    collectionCreate: "local items = { 'a', 'b' }",
    collectionRead: "items[1]",
    collectionWrite: "table.insert(items, 'c')",
    collectionLoop: "for _, item in ipairs(items) do\n  print(item)\nend",
    dataCreate: "local person = { name = 'Ava' }",
    fileExample: "local file = io.open('notes.txt', 'r')",
    classHeader: "local Dog = {}",
    classFeature: "function Dog:new(name)",
  },
};

function buildQuestions(profile: LanguageProfile, category: string, lessonId: string, label: string): Question[] {
  if (category === "basics") {
    if (lessonId === "1") {
      return [
        { type: "arrange", instruction: `Fill the blank so ${label} prints Hello`, codeLines: [profile.printCall.replace(/Hello/, "___").replace(/\"___\"|\'___\'/, "___")], tiles: ["'Hello'", "\"Hello\"", "Hello", "42"], answer: ["'Hello'"], explanation: `${label} needs quotes around text.`, consoleOutput: "Hello" },
        { type: "fill", instruction: "Complete the output line", codeLines: [profile.printCall.replace(/Hello/, "___").replace(/\"___\"|\'___\'/, "___")], tiles: ["'Hi'", "\"Hi\"", "Hi", "name"], answer: "'Hi'", explanation: "Text must stay inside quotes.", consoleOutput: "Hi" },
        { type: "multiple_choice", instruction: `Which line prints text in ${label}?`, options: [profile.printCall, profile.mutableDecl, profile.inputLine, profile.commentPrefix + " note"], answer: profile.printCall, explanation: `That line sends text to ${label} output.` },
        { type: "output", instruction: "What does this code print?", codeLines: [profile.printCall], options: ["Hello", "hello", "Nothing", "Error"], answer: "Hello", explanation: "The output line prints the text.", consoleOutput: null },
      ];
    }

    if (lessonId === "4") {
      return [
        { type: "fill", instruction: "Complete the comment symbol", codeLines: [`___ note`, profile.printCall], tiles: [profile.commentPrefix, "#", "//", "--"], answer: profile.commentPrefix, explanation: `${profile.commentPrefix} starts a comment in ${label}.`, consoleOutput: "Hello" },
        { type: "multiple_choice", instruction: "What does a comment do?", options: ["It is ignored when the code runs", "It prints to the screen", "It stores a variable", "It repeats code"], answer: "It is ignored when the code runs", explanation: "Comments are notes for humans." },
        { type: "output", instruction: "What does this code print?", codeLines: [`${profile.commentPrefix} skip this`, profile.printCall], options: ["Hello", "skip this", "Nothing", "Error"], answer: "Hello", explanation: "The comment line is ignored.", consoleOutput: null },
        { type: "multiple_choice", instruction: `Which symbol starts a comment in ${label}?`, options: [profile.commentPrefix, ";", "=", ":"], answer: profile.commentPrefix, explanation: `That is the comment marker for ${label}.` },
      ];
    }

    return [
      { type: "arrange", instruction: "Fill the blank to print the number 42", codeLines: [profile.printCall.replace(/'Hello'|"Hello"|\(.*?Hello.*?\)/, "(___)").replace(/Hello/, "___")], tiles: ["42", "'42'", "\"42\"", "0"], answer: ["42"], explanation: "Numbers do not need quotes.", consoleOutput: "42" },
      { type: "fill", instruction: "Complete the output line to print 7", codeLines: [profile.printCall.replace(/'Hello'|"Hello"|Hello/, "___").replace(/\(.*\)/, "(___)")], tiles: ["7", "'7'", "\"7\"", "seven"], answer: "7", explanation: "Use the number itself.", consoleOutput: "7" },
      { type: "multiple_choice", instruction: "What prints two values with output?", options: [profile.printCall, profile.mutableDecl, profile.inputLine, profile.functionCall], answer: profile.printCall, explanation: "Output lines show values on screen." },
      { type: "output", instruction: "What does this code print?", codeLines: [profile.printCall.replace(/Hello/, "42").replace(/'42'|"42"/, "42")], options: ["42", "Hello", "Nothing", "Error"], answer: "42", explanation: "The output line prints the number.", consoleOutput: null },
    ];
  }

  if (category === "variables") {
    return [
      { type: "multiple_choice", instruction: `Which line creates a variable in ${label}?`, options: [profile.mutableDecl, profile.printCall, profile.commentPrefix + " score", profile.functionCall], answer: profile.mutableDecl, explanation: "That line stores a value in a named variable." },
      { type: "fill", instruction: "Complete the assignment operator", codeLines: [profile.mutableDecl.replace(" = ", " ___ ")], tiles: ["=", "==", ":", "->"], answer: "=", explanation: "= stores a value in the variable.", consoleOutput: null },
      { type: "output", instruction: "What does this code print?", codeLines: [profile.immutableDecl, profile.printCall.replace(/'Hello'|"Hello"|Hello/, "name").replace(/\(.*\)/, "(name)")], options: ["Pico", "name", "Hello", "Nothing"], answer: "Pico", explanation: "The output line uses the variable value.", consoleOutput: null },
      { type: "multiple_choice", instruction: "Why use a variable?", options: ["To store a value and use it later", "To make comments", "To repeat code", "To close the program"], answer: "To store a value and use it later", explanation: "Variables hold values you can reuse." },
    ];
  }

  if (category === "input") {
    return [
      { type: "multiple_choice", instruction: `Which line reads user input in ${label}?`, options: [profile.inputLine, profile.printCall, profile.mutableDecl, profile.collectionCreate], answer: profile.inputLine, explanation: "That line reads a value from the user." },
      { type: "fill", instruction: "Complete the numeric input line", codeLines: [profile.parseNumber.replace(/Age|\d+|0/, "___")], tiles: ["Age?", "Count?", "Name?", "Ready?"], answer: "Age?", explanation: "That prompt asks for a number.", consoleOutput: null },
      { type: "multiple_choice", instruction: "What usually comes back from input before parsing?", options: ["Text", "A number every time", "A loop", "A comment"], answer: "Text", explanation: "Input starts as text in beginner programs." },
      { type: "output", instruction: "What should you do before math on input?", options: ["Convert it to a number", "Turn it into a comment", "Print it twice", "Put it in quotes again"], answer: "Convert it to a number", explanation: "Parsing is what makes the value numeric." },
    ];
  }

  if (category === "strings") {
    return [
      { type: "multiple_choice", instruction: `Which example gets string length in ${label}?`, options: [profile.stringLength, profile.upperCall, profile.mutableDecl, profile.collectionRead], answer: profile.stringLength, explanation: "That expression measures the text length." },
      { type: "multiple_choice", instruction: `Which example changes text to uppercase in ${label}?`, options: [profile.upperCall, profile.stringLength, profile.ifExample, profile.functionCall], answer: profile.upperCall, explanation: "That call changes the text casing." },
      { type: "output", instruction: "What does a string length expression return?", options: ["A number", "A comment", "A loop", "A file"], answer: "A number", explanation: "Length tells you how many characters are in the string." },
      { type: "multiple_choice", instruction: "Why use string tools?", options: ["To inspect and change text", "To open files only", "To create classes only", "To define loops only"], answer: "To inspect and change text", explanation: "String methods help you work with text values." },
    ];
  }

  if (category === "conditions") {
    return [
      { type: "multiple_choice", instruction: `Which example uses a condition in ${label}?`, options: [profile.ifExample, profile.loopExample, profile.mutableDecl, profile.fileExample], answer: profile.ifExample, explanation: "That code checks a condition before running a block." },
      { type: "multiple_choice", instruction: "What does else do?", options: ["Runs when the first condition is false", "Starts a loop", "Creates a variable", "Prints comments"], answer: "Runs when the first condition is false", explanation: "else is the fallback branch." },
      { type: "multiple_choice", instruction: "What is an else-if branch for?", options: ["Checking another condition", "Ending the file", "Declaring a list", "Creating a method"], answer: "Checking another condition", explanation: "else-if lets you test another case." },
      { type: "output", instruction: "What do conditions help you do?", options: ["Make decisions", "Store files", "Create comments", "Draw shapes"], answer: "Make decisions", explanation: "Conditions let the program choose a branch." },
    ];
  }

  if (category === "loops") {
    return [
      { type: "multiple_choice", instruction: `Which example repeats code in ${label}?`, options: [profile.loopExample, profile.ifExample, profile.mutableDecl, profile.dataCreate], answer: profile.loopExample, explanation: "That example runs code more than once." },
      { type: "multiple_choice", instruction: "What is a loop for?", options: ["Repeating code", "Starting comments", "Naming classes", "Opening files"], answer: "Repeating code", explanation: "Loops are for repetition." },
      { type: "multiple_choice", instruction: "What does break usually do?", options: ["Stops the loop early", "Creates a variable", "Changes string case", "Reads a file"], answer: "Stops the loop early", explanation: "break exits the loop." },
      { type: "output", instruction: "Why are counters useful?", options: ["They track the current loop step", "They add comments", "They open the terminal", "They make classes private"], answer: "They track the current loop step", explanation: "Counters help you know where you are in the loop." },
    ];
  }

  if (category === "functions") {
    return [
      { type: "multiple_choice", instruction: `Which line starts a function in ${label}?`, options: [profile.functionHeader, profile.functionCall, profile.mutableDecl, profile.printCall], answer: profile.functionHeader, explanation: "That line defines a new function." },
      { type: "multiple_choice", instruction: `Which line calls a function in ${label}?`, options: [profile.functionCall, profile.functionHeader, profile.ifExample, profile.collectionWrite], answer: profile.functionCall, explanation: "That line runs the function." },
      { type: "multiple_choice", instruction: "What is a parameter?", options: ["A value a function receives", "A kind of comment", "A file path", "A loop counter only"], answer: "A value a function receives", explanation: "Parameters let functions work with data." },
      { type: "multiple_choice", instruction: "What does return do?", options: ["Sends a value back", "Starts a list", "Ends a comment", "Reads input"], answer: "Sends a value back", explanation: "return gives the result back to the caller." },
    ];
  }

  if (category === "collections") {
    return [
      { type: "multiple_choice", instruction: `Which line creates a collection in ${label}?`, options: [profile.collectionCreate, profile.mutableDecl, profile.printCall, profile.fileExample], answer: profile.collectionCreate, explanation: "That line creates a grouped set of values." },
      { type: "multiple_choice", instruction: `Which example reads one item from the collection?`, options: [profile.collectionRead, profile.collectionWrite, profile.collectionLoop, profile.dataCreate], answer: profile.collectionRead, explanation: "That expression reads one stored item." },
      { type: "multiple_choice", instruction: `Which example adds a new item?`, options: [profile.collectionWrite, profile.collectionRead, profile.stringLength, profile.classHeader], answer: profile.collectionWrite, explanation: "That line changes the collection by adding data." },
      { type: "multiple_choice", instruction: `Which example loops over the collection?`, options: [profile.collectionLoop, profile.collectionCreate, profile.inputLine, profile.printCall], answer: profile.collectionLoop, explanation: "That loop visits each item." },
    ];
  }

  if (category === "data") {
    return [
      { type: "multiple_choice", instruction: `Which line creates grouped data in ${label}?`, options: [profile.dataCreate, profile.collectionCreate, profile.printCall, profile.inputLine], answer: profile.dataCreate, explanation: "That example stores related values together." },
      { type: "multiple_choice", instruction: "Why use key-value style data?", options: ["To label values by name", "To repeat loops faster", "To make comments longer", "To avoid functions"], answer: "To label values by name", explanation: "Named fields make data easier to read." },
      { type: "multiple_choice", instruction: "What does updating a field mean?", options: ["Changing one stored value", "Printing a loop", "Opening a file", "Declaring a comment"], answer: "Changing one stored value", explanation: "You replace the old value with a new one." },
      { type: "multiple_choice", instruction: "When would you loop through grouped data?", options: ["When you need every stored entry", "Only for comments", "Only for return statements", "Never"], answer: "When you need every stored entry", explanation: "Loops help you visit each entry." },
    ];
  }

  if (category === "special") {
    return [
      { type: "multiple_choice", instruction: `Which example matches this ${label} unit?`, options: [profile.fileExample, profile.printCall, profile.mutableDecl, profile.collectionCreate], answer: profile.fileExample, explanation: "That example uses the feature from this unit." },
      { type: "multiple_choice", instruction: "What is the main goal of this unit?", options: ["Use a standard library feature", "Rename all variables", "Delete loops", "Avoid strings"], answer: "Use a standard library feature", explanation: "This unit is about a built-in tool or API." },
      { type: "multiple_choice", instruction: "Why read or update external data?", options: ["To work with real files or page data", "To make comments faster", "To avoid output", "To remove conditions"], answer: "To work with real files or page data", explanation: "These APIs connect code to real data." },
      { type: "multiple_choice", instruction: "What should beginners focus on first here?", options: ["Basic read and write steps", "Advanced optimization", "Metaprogramming", "Memory layout"], answer: "Basic read and write steps", explanation: "Start with the simplest useful actions." },
    ];
  }

  if (category === "advanced") {
    return [
      { type: "multiple_choice", instruction: `Which line starts an advanced type in ${label}?`, options: [profile.classHeader, profile.functionHeader, profile.collectionCreate, profile.printCall], answer: profile.classHeader, explanation: "That line starts the advanced type or structure." },
      { type: "multiple_choice", instruction: `Which line matches a key feature of that type?`, options: [profile.classFeature, profile.commentPrefix + " note", profile.inputLine, profile.collectionWrite], answer: profile.classFeature, explanation: "That line is part of how the type works." },
      { type: "multiple_choice", instruction: "Why use classes, enums, or metatables?", options: ["To group behavior with data", "To replace every loop", "To avoid functions", "To hide all output"], answer: "To group behavior with data", explanation: "These features help you model more complex programs." },
      { type: "multiple_choice", instruction: "What should you practice first here?", options: ["Creating the type and reading one field", "Optimizing memory", "Concurrency", "Package publishing"], answer: "Creating the type and reading one field", explanation: "Start with the basic structure first." },
    ];
  }

  return [
    { type: "multiple_choice", instruction: `What is the goal of a ${label} project unit?`, options: ["Combine earlier concepts", "Only print one word", "Remove all variables", "Skip testing"], answer: "Combine earlier concepts", explanation: "Project units bring earlier skills together." },
    { type: "multiple_choice", instruction: "What should you do before building?", options: ["Plan the steps", "Delete all comments", "Avoid functions", "Skip output"], answer: "Plan the steps", explanation: "Planning makes the build easier." },
    { type: "multiple_choice", instruction: "What helps most while fixing a project?", options: ["Testing one part at a time", "Changing everything at once", "Removing output", "Skipping loops"], answer: "Testing one part at a time", explanation: "Small checks make bugs easier to find." },
    { type: "multiple_choice", instruction: "What makes a project complete?", options: ["It runs and matches the goal", "It has no variables", "It has no functions", "It never prints anything"], answer: "It runs and matches the goal", explanation: "A finished project solves the target problem." },
  ];
}

function getCategory(unitTitle: string): string {
  const title = unitTitle.toLowerCase();
  if (title.includes("hello") || title.includes("console") || title.includes("output") || title.includes("print")) return "basics";
  if (title.includes("variable")) return "variables";
  if (title.includes("input") || title.includes("scanner")) return "input";
  if (title.includes("string")) return "strings";
  if (title.includes("condition")) return "conditions";
  if (title.includes("loop")) return "loops";
  if (title.includes("function") || title.includes("method")) return "functions";
  if (title.includes("array") || title.includes("list") || title.includes("vector") || title.includes("table")) return "collections";
  if (title.includes("object") || title.includes("interface") || title.includes("dictionary") || title.includes("struct") || title.includes("module")) return "data";
  if (title.includes("dom") || title.includes("file")) return "special";
  if (title.includes("class") || title.includes("enum") || title.includes("metatable")) return "advanced";
  return "project";
}

export function getGeneratedLessonData(language: LearningLanguage, unitId: string, lessonId: string): LessonData | null {
  const unit = getCourseSections(language)
    .flatMap((section) => section.units)
    .find((item) => String(item.id) === unitId);
  const lesson = unit?.lessons.find((item) => String(item.id) === lessonId);

  if (!unit || !lesson || lesson.title.toLowerCase().includes("challenge")) return null;

  const label = getLanguageLabel(language);
  const category = getCategory(unit.title);
  const profile = PROFILES[language];
  const questions = buildQuestions(profile, category, lessonId, label);

  return {
    teaching: {
      title: lesson.title,
      explanation: `${lesson.title} is part of ${unit.title} in ${label}. This lesson keeps the syntax small and focuses on one beginner step at a time.`,
      example:
        category === "basics"
          ? profile.printCall
          : category === "variables"
            ? profile.mutableDecl
            : category === "input"
              ? profile.inputLine
              : category === "strings"
                ? profile.upperCall
                : category === "conditions"
                  ? profile.ifExample
                  : category === "loops"
                    ? profile.loopExample
                    : category === "functions"
                      ? `${profile.functionHeader}\n  ${profile.printCall}`
                      : category === "collections"
                        ? profile.collectionCreate
                        : category === "data"
                          ? profile.dataCreate
                          : category === "special"
                            ? profile.fileExample
                            : profile.classHeader,
      tip: `${getLanguageCommentPrefix(language)} keep the code small and test one idea at a time.`,
    },
    questions,
  };
}
