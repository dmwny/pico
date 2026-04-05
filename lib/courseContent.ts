export type LearningLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "csharp"
  | "rust"
  | "lua";

export const SUPPORTED_LANGUAGES: LearningLanguage[] = [
  "python",
  "javascript",
  "typescript",
  "java",
  "csharp",
  "rust",
  "lua",
];

const LANGUAGE_LABELS: Record<LearningLanguage, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  csharp: "C#",
  rust: "Rust",
  lua: "Lua",
};

const LANGUAGE_COMMENT_PREFIX: Record<LearningLanguage, string> = {
  python: "#",
  javascript: "//",
  typescript: "//",
  java: "//",
  csharp: "//",
  rust: "//",
  lua: "--",
};

const LANGUAGE_HAS_PLACEMENT: Record<LearningLanguage, boolean> = {
  python: true,
  javascript: true,
  typescript: false,
  java: false,
  csharp: false,
  rust: false,
  lua: false,
};

export type LessonKind = "arc" | "challenge";
export type LessonNodeType = "teaching" | "practice";

export interface LessonMeta {
  id: number;
  title: string;
  concept: string;
  kind: LessonKind;
  nodeType?: LessonNodeType;
  language: LearningLanguage;
}

export interface UnitMeta {
  id: number;
  title: string;
  description: string;
  lessons: LessonMeta[];
}

export interface SectionMeta {
  id: number;
  title: string;
  level: string;
  color: string;
  borderColor: string;
  bgTheme: string;
  textAccent: string;
  hex: string;
  picoMessage: string;
  units: UnitMeta[];
}

export interface UnitChallenge {
  title: string;
  description: string;
  prompt: string;
  exampleOutput: string;
}

export interface MiniCourseMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: "live" | "coming_soon" | "planned";
  badge: string;
  href?: string;
}

type UnitLessonBlueprint = [string, string, string, string, string, string];

function slugifyConcept(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function inferLessonConcept(unitTitle: string, lessonTitle: string) {
  const unit = unitTitle.toLowerCase();
  const lesson = lessonTitle.toLowerCase();
  const combined = `${unit} ${lesson}`;

  if (combined.includes("print") || combined.includes("console.log") || combined.includes("write line") || unit.includes("hello")) {
    return "print-statements";
  }
  if (combined.includes("comment")) {
    return "comments";
  }
  if (unit.includes("variable")) {
    return "variables";
  }
  if (unit.includes("input") || unit.includes("scanner") || lesson.includes("prompt")) {
    return "user-input";
  }
  if (unit.includes("string")) {
    return "string-methods";
  }
  if (unit.includes("condition") || lesson.includes("if") || lesson.includes("else")) {
    return "conditionals";
  }
  if (lesson.includes("for loop") || lesson.includes("numeric for") || lesson.includes("foreach") || combined.includes("for loops")) {
    return "for-loops";
  }
  if (lesson.includes("while")) {
    return "while-loops";
  }
  if (lesson.includes("range")) {
    return "ranges";
  }
  if (lesson.includes("break") || lesson.includes("continue")) {
    return "loop-control";
  }
  if (unit.includes("loop")) {
    return "loops";
  }
  if (unit.includes("function") || unit.includes("method")) {
    return "functions";
  }
  if (unit.includes("list") || unit.includes("array") || unit.includes("vector") || unit.includes("table")) {
    return "lists";
  }
  if (unit.includes("dictionary") || unit.includes("object") || unit.includes("interface") || unit.includes("struct") || unit.includes("module")) {
    return "dictionaries";
  }
  if (unit.includes("file") || unit.includes("dom")) {
    return "file-handling";
  }
  if (unit.includes("class") || unit.includes("enum") || unit.includes("metatable")) {
    return "classes";
  }

  return slugifyConcept(lessonTitle);
}

function buildUnit(
  id: number,
  title: string,
  description: string,
  lessons: UnitLessonBlueprint,
  language: LearningLanguage,
): UnitMeta {
  const regularLessons: LessonMeta[] = lessons.map((lessonTitle, index) => ({
    id: index + 1,
    title: lessonTitle,
    concept: inferLessonConcept(title, lessonTitle),
    kind: "arc",
    nodeType: index < 2 ? "teaching" : "practice",
    language,
  }));

  return {
    id,
    title,
    description,
    lessons: [
      ...regularLessons,
      { id: 7, title: "Unit challenge", concept: `${slugifyConcept(title)}-challenge`, kind: "challenge", language },
    ],
  };
}

const BASE_SECTION_META = [
  {
    id: 1,
    title: "Getting Started",
    level: "Section 1",
    color: "bg-green-500",
    borderColor: "border-green-600",
    bgTheme: "bg-green-50",
    textAccent: "text-green-500",
    hex: "#22c55e",
    picoMessage: "Let's write your first line of code!",
  },
  {
    id: 2,
    title: "Speed Training",
    level: "Section 2",
    color: "bg-blue-500",
    borderColor: "border-blue-600",
    bgTheme: "bg-blue-50",
    textAccent: "text-blue-500",
    hex: "#3b82f6",
    picoMessage: "Getting faster! Keep that streak going!",
  },
  {
    id: 3,
    title: "Pro Challenges",
    level: "Section 3",
    color: "bg-purple-500",
    borderColor: "border-purple-600",
    bgTheme: "bg-purple-50",
    textAccent: "text-purple-500",
    hex: "#a855f7",
    picoMessage: "This one's tricky. You've got this!",
  },
] as const;

const PYTHON_SECTIONS: SectionMeta[] = [
  {
    ...BASE_SECTION_META[0],
    units: [
      buildUnit(1, "Hello World", "Your first lines of code", ["Your first print()", "Printing numbers", "Printing multiple things", "Comments", "Reading output", "Quick print checks"], "python"),
      buildUnit(2, "Variables", "Store and use information", ["Creating a variable", "Variable names", "Changing a variable", "Printing variables", "Using variables together", "Simple variable patterns"], "python"),
      buildUnit(3, "User Input", "Let users interact with your code", ["The input() function", "Storing input", "Input with numbers", "Using input in print", "Input and variables", "Checking input results"], "python"),
      buildUnit(4, "Strings", "Work with text in Python", ["Joining strings", "String length", "Upper and lower case", "f-strings", "String variables", "String practice"], "python"),
    ],
  },
  {
    ...BASE_SECTION_META[1],
    units: [
      buildUnit(5, "Conditions", "Make decisions in your code", ["if statements", "else statements", "elif statements", "Combining conditions", "Comparing values", "Condition practice"], "python"),
      buildUnit(6, "Loops", "Repeat code automatically", ["while loops", "for loops", "range()", "break and continue", "Loop counters", "Loop practice"], "python"),
      buildUnit(7, "Functions", "Write reusable blocks of code", ["Defining a function", "Calling a function", "Parameters", "Return values", "Using functions twice", "Function practice"], "python"),
      buildUnit(8, "Lists", "Store multiple values together", ["Creating a list", "Accessing items", "Adding and removing", "Looping through lists", "List variables", "List practice"], "python"),
    ],
  },
  {
    ...BASE_SECTION_META[2],
    units: [
      buildUnit(9, "Dictionaries", "Store data with keys and values", ["Creating a dictionary", "Accessing values", "Adding and updating", "Looping through dicts", "Dictionary keys and values", "Dictionary practice"], "python"),
      buildUnit(10, "File Handling", "Read and write files", ["Opening files", "Reading files", "Writing files", "Closing files", "Read vs write mode", "File practice"], "python"),
      buildUnit(11, "Classes", "Build your own data types", ["Defining a class", "The __init__ method", "Attributes", "Methods", "Making an object", "Class practice"], "python"),
      buildUnit(12, "Final Project", "Build a real Python program", ["Planning your project", "Building the structure", "Adding features", "Testing and fixing", "Refining the project", "Final checks"], "python"),
    ],
  },
];

const JAVASCRIPT_SECTIONS: SectionMeta[] = [
  {
    ...BASE_SECTION_META[0],
    units: [
      buildUnit(1, "Hello Console", "Your first JavaScript lines", ["Your first console.log()", "Logging numbers", "Logging multiple values", "Comments", "Reading output", "Quick console checks"], "javascript"),
      buildUnit(2, "Variables", "Store and update values", ["Creating a variable", "let vs const", "Changing a variable", "Logging variables", "Using variables together", "Simple variable patterns"], "javascript"),
      buildUnit(3, "User Input", "Let users interact with your code", ["The prompt() function", "Storing input", "Turning text into numbers", "Using input in console.log", "Input and variables", "Checking input results"], "javascript"),
      buildUnit(4, "Strings", "Work with text in JavaScript", ["Joining strings", "String length", "Uppercase and lowercase", "Template literals", "String variables", "String practice"], "javascript"),
    ],
  },
  {
    ...BASE_SECTION_META[1],
    units: [
      buildUnit(5, "Conditions", "Make decisions in your code", ["if statements", "else statements", "else if statements", "Combining conditions", "Comparing values", "Condition practice"], "javascript"),
      buildUnit(6, "Loops", "Repeat code automatically", ["while loops", "for loops", "Loop counters", "break and continue", "Counting patterns", "Loop practice"], "javascript"),
      buildUnit(7, "Functions", "Write reusable blocks of code", ["Defining a function", "Calling a function", "Parameters", "Return values", "Using functions twice", "Function practice"], "javascript"),
      buildUnit(8, "Arrays", "Store multiple values together", ["Creating an array", "Accessing items", "Adding and removing", "Looping through arrays", "Array variables", "Array practice"], "javascript"),
    ],
  },
  {
    ...BASE_SECTION_META[2],
    units: [
      buildUnit(9, "Objects", "Store data with keys and values", ["Creating an object", "Accessing values", "Adding and updating", "Looping through objects", "Object keys and values", "Object practice"], "javascript"),
      buildUnit(10, "The DOM", "Read and update a web page", ["Finding elements", "Changing text", "Changing styles", "Button clicks", "Reading form values", "DOM practice"], "javascript"),
      buildUnit(11, "Classes", "Build your own blueprints", ["Defining a class", "The constructor", "Properties", "Methods", "Making an object", "Class practice"], "javascript"),
      buildUnit(12, "Final Project", "Build a real JavaScript app", ["Planning your project", "Building the structure", "Adding features", "Testing and fixing", "Refining the project", "Final checks"], "javascript"),
    ],
  },
];

type GeneratedUnitBlueprint = {
  id: number;
  title: string;
  description: string;
  lessons: UnitLessonBlueprint;
};

function buildGeneratedSections(units: GeneratedUnitBlueprint[], language: LearningLanguage): SectionMeta[] {
  return [
    {
      ...BASE_SECTION_META[0],
      units: units.slice(0, 4).map((unit) => buildUnit(unit.id, unit.title, unit.description, unit.lessons, language)),
    },
    {
      ...BASE_SECTION_META[1],
      units: units.slice(4, 8).map((unit) => buildUnit(unit.id, unit.title, unit.description, unit.lessons, language)),
    },
    {
      ...BASE_SECTION_META[2],
      units: units.slice(8, 12).map((unit) => buildUnit(unit.id, unit.title, unit.description, unit.lessons, language)),
    },
  ];
}

const TYPESCRIPT_SECTIONS = buildGeneratedSections([
  { id: 1, title: "Hello Console", description: "Start with typed console output", lessons: ["Use console.log", "Log numbers", "Log strings", "Add comments", "Read output", "Quick console checks"] },
  { id: 2, title: "Variables", description: "Store values with types", lessons: ["Use let and const", "Add type annotations", "Update variables", "Log variables", "Use variables together", "Variable practice"] },
  { id: 3, title: "Input", description: "Read values into your program", lessons: ["Read prompt text", "Store input", "Convert input", "Log input", "Input and variables", "Input practice"] },
  { id: 4, title: "Strings", description: "Work with text and templates", lessons: ["Join strings", "Use length", "Change case", "Use template strings", "String variables", "String practice"] },
  { id: 5, title: "Conditions", description: "Branch with type-safe checks", lessons: ["Use if", "Use else", "Use else if", "Combine checks", "Compare values", "Condition practice"] },
  { id: 6, title: "Loops", description: "Repeat code with counters", lessons: ["Use while", "Use for", "Step counters", "Break and continue", "Count patterns", "Loop practice"] },
  { id: 7, title: "Functions", description: "Build reusable typed functions", lessons: ["Define functions", "Call functions", "Use parameters", "Return values", "Reuse a function", "Function practice"] },
  { id: 8, title: "Arrays", description: "Store grouped values", lessons: ["Create arrays", "Read items", "Push and pop", "Loop arrays", "Array variables", "Array practice"] },
  { id: 9, title: "Objects", description: "Shape data with keys", lessons: ["Create objects", "Read properties", "Update properties", "Loop keys", "Named fields", "Object practice"] },
  { id: 10, title: "DOM Types", description: "Work with typed page elements", lessons: ["Query elements", "Narrow element types", "Set text", "Handle clicks", "Read input values", "DOM practice"] },
  { id: 11, title: "Interfaces", description: "Describe object shapes", lessons: ["Declare interfaces", "Use typed objects", "Optional fields", "Typed methods", "Read one field", "Interface practice"] },
  { id: 12, title: "Project Build", description: "Assemble a TypeScript app", lessons: ["Plan features", "Build structure", "Add types", "Test and fix", "Refine the app", "Final checks"] },
], "typescript");

const JAVA_SECTIONS = buildGeneratedSections([
  { id: 1, title: "Hello Output", description: "Print your first Java lines", lessons: ["Use System.out.println", "Print numbers", "Print strings", "Add comments", "Read output", "Quick output checks"] },
  { id: 2, title: "Variables", description: "Store typed values", lessons: ["Declare variables", "Pick data types", "Update values", "Print variables", "Use variables together", "Variable practice"] },
  { id: 3, title: "Scanner Input", description: "Read user input", lessons: ["Create Scanner", "Read text", "Read numbers", "Store input", "Input and variables", "Input practice"] },
  { id: 4, title: "Strings", description: "Work with Java text", lessons: ["Join strings", "Use length", "Change case", "Format output", "String variables", "String practice"] },
  { id: 5, title: "Conditions", description: "Control flow with booleans", lessons: ["Use if", "Use else", "Use else if", "Combine checks", "Compare values", "Condition practice"] },
  { id: 6, title: "Loops", description: "Repeat code in Java", lessons: ["Use while", "Use for", "Count loops", "Break and continue", "Loop counters", "Loop practice"] },
  { id: 7, title: "Methods", description: "Write reusable methods", lessons: ["Declare methods", "Call methods", "Pass arguments", "Return values", "Reuse a method", "Method practice"] },
  { id: 8, title: "Arrays", description: "Store ordered values", lessons: ["Create arrays", "Read items", "Change items", "Loop arrays", "Array variables", "Array practice"] },
  { id: 9, title: "ArrayList", description: "Work with dynamic lists", lessons: ["Create ArrayList", "Add items", "Remove items", "Loop lists", "Read one item", "ArrayList practice"] },
  { id: 10, title: "Files", description: "Read and write files", lessons: ["Open files", "Read files", "Write files", "Handle errors", "Read vs write mode", "File practice"] },
  { id: 11, title: "Classes", description: "Build objects in Java", lessons: ["Declare classes", "Use constructors", "Set fields", "Call methods", "Make an object", "Class practice"] },
  { id: 12, title: "Project Build", description: "Assemble a Java app", lessons: ["Plan features", "Build structure", "Add classes", "Test and fix", "Refine the app", "Final checks"] },
], "java");

const CSHARP_SECTIONS = buildGeneratedSections([
  { id: 1, title: "Hello Console", description: "Print your first C# lines", lessons: ["Use Console.WriteLine", "Print numbers", "Print strings", "Add comments", "Read output", "Quick console checks"] },
  { id: 2, title: "Variables", description: "Store typed values", lessons: ["Declare variables", "Use var", "Update values", "Print variables", "Use variables together", "Variable practice"] },
  { id: 3, title: "Console Input", description: "Read user input", lessons: ["Use ReadLine", "Store text", "Parse numbers", "Print input", "Input and variables", "Input practice"] },
  { id: 4, title: "Strings", description: "Work with text", lessons: ["Join strings", "Use Length", "Change case", "Interpolate strings", "String variables", "String practice"] },
  { id: 5, title: "Conditions", description: "Control flow with checks", lessons: ["Use if", "Use else", "Use else if", "Combine checks", "Compare values", "Condition practice"] },
  { id: 6, title: "Loops", description: "Repeat code in C#", lessons: ["Use while", "Use for", "Use foreach", "Break and continue", "Loop counters", "Loop practice"] },
  { id: 7, title: "Methods", description: "Write reusable methods", lessons: ["Declare methods", "Call methods", "Pass arguments", "Return values", "Reuse a method", "Method practice"] },
  { id: 8, title: "Lists", description: "Use dynamic collections", lessons: ["Create List", "Add items", "Remove items", "Loop lists", "Read one item", "List practice"] },
  { id: 9, title: "Dictionaries", description: "Store key-value data", lessons: ["Create dictionary", "Read values", "Update values", "Loop pairs", "Named fields", "Dictionary practice"] },
  { id: 10, title: "Files", description: "Read and write files", lessons: ["Read text", "Write text", "Append text", "Check paths", "Read vs write mode", "File practice"] },
  { id: 11, title: "Classes", description: "Build objects in C#", lessons: ["Declare classes", "Use constructors", "Set properties", "Call methods", "Make an object", "Class practice"] },
  { id: 12, title: "Project Build", description: "Assemble a C# app", lessons: ["Plan features", "Build structure", "Add classes", "Test and fix", "Refine the app", "Final checks"] },
], "csharp");

const RUST_SECTIONS = buildGeneratedSections([
  { id: 1, title: "Hello Cargo", description: "Print your first Rust lines", lessons: ["Use println!", "Print numbers", "Print strings", "Add comments", "Read output", "Quick output checks"] },
  { id: 2, title: "Variables", description: "Store values safely", lessons: ["Use let", "Use mut", "Update values", "Print variables", "Use variables together", "Variable practice"] },
  { id: 3, title: "Input", description: "Read values from stdin", lessons: ["Read a line", "Trim text", "Parse numbers", "Store input", "Input and variables", "Input practice"] },
  { id: 4, title: "Strings", description: "Work with Rust text", lessons: ["Use String", "Use len", "Push text", "Format output", "String variables", "String practice"] },
  { id: 5, title: "Conditions", description: "Branch with if and match", lessons: ["Use if", "Use else", "Use else if", "Use match", "Compare values", "Condition practice"] },
  { id: 6, title: "Loops", description: "Repeat code in Rust", lessons: ["Use loop", "Use while", "Use for", "Break and continue", "Loop counters", "Loop practice"] },
  { id: 7, title: "Functions", description: "Write reusable functions", lessons: ["Define functions", "Call functions", "Pass arguments", "Return values", "Reuse a function", "Function practice"] },
  { id: 8, title: "Vectors", description: "Store grouped values", lessons: ["Create Vec", "Push items", "Read items", "Loop vectors", "Read one item", "Vector practice"] },
  { id: 9, title: "Structs", description: "Shape custom data", lessons: ["Declare structs", "Create structs", "Update fields", "Impl methods", "Read one field", "Struct practice"] },
  { id: 10, title: "Files", description: "Read and write files", lessons: ["Open files", "Read text", "Write text", "Handle Result", "Read vs write mode", "File practice"] },
  { id: 11, title: "Enums", description: "Represent typed states", lessons: ["Declare enums", "Use variants", "Match values", "Use Option", "Read one variant", "Enum practice"] },
  { id: 12, title: "Project Build", description: "Assemble a Rust app", lessons: ["Plan features", "Build modules", "Handle errors", "Test and fix", "Refine the app", "Final checks"] },
], "rust");

const LUA_SECTIONS = buildGeneratedSections([
  { id: 1, title: "Hello Print", description: "Print your first Lua lines", lessons: ["Use print", "Print numbers", "Print strings", "Add comments", "Read output", "Quick output checks"] },
  { id: 2, title: "Variables", description: "Store values in Lua", lessons: ["Declare locals", "Store text", "Update values", "Print variables", "Use variables together", "Variable practice"] },
  { id: 3, title: "Input", description: "Read values from the console", lessons: ["Use io.read", "Store input", "Convert numbers", "Print input", "Input and variables", "Input practice"] },
  { id: 4, title: "Strings", description: "Work with Lua text", lessons: ["Join strings", "Use string.len", "Change case", "Format strings", "String variables", "String practice"] },
  { id: 5, title: "Conditions", description: "Branch with if statements", lessons: ["Use if", "Use else", "Use elseif", "Combine checks", "Compare values", "Condition practice"] },
  { id: 6, title: "Loops", description: "Repeat code in Lua", lessons: ["Use while", "Use numeric for", "Use ipairs", "Break loops", "Loop counters", "Loop practice"] },
  { id: 7, title: "Functions", description: "Write reusable functions", lessons: ["Declare functions", "Call functions", "Pass arguments", "Return values", "Reuse a function", "Function practice"] },
  { id: 8, title: "Tables", description: "Store grouped values", lessons: ["Create tables", "Read items", "Write items", "Loop tables", "Read one item", "Table practice"] },
  { id: 9, title: "Modules", description: "Split code across files", lessons: ["Return a table", "Require a module", "Call module functions", "Store module data", "Use one field", "Module practice"] },
  { id: 10, title: "Files", description: "Read and write files", lessons: ["Open files", "Read text", "Write text", "Close files", "Read vs write mode", "File practice"] },
  { id: 11, title: "Metatables", description: "Customize table behavior", lessons: ["Create metatables", "Use __index", "Use __add", "Build objects", "Read one field", "Metatable practice"] },
  { id: 12, title: "Project Build", description: "Assemble a Lua app", lessons: ["Plan features", "Build modules", "Add tables", "Test and fix", "Refine the app", "Final checks"] },
], "lua");

const MINI_COURSES: Record<LearningLanguage, MiniCourseMeta[]> = {
  python: [
    {
      id: "turtle",
      title: "Turtle Graphics",
      subtitle: "Draw with code",
      description: "Learn loops, angles, and functions by moving a turtle around the screen.",
      status: "live",
      badge: "TG",
      href: "/labs/python/turtle",
    },
    {
      id: "random",
      title: "Random",
      subtitle: "Ranges, samples, and lucky picks",
      description: "Use the random docs for integers, floats, samples, seeds, and weighted choices in Python.",
      status: "live",
      badge: "RD",
      href: "/labs/python/random",
    },
    {
      id: "pygame",
      title: "Pygame",
      subtitle: "2D game systems and APIs",
      description: "Build game windows, surfaces, sprites, collisions, audio, vectors, and rendering with Python.",
      status: "live",
      badge: "PG",
      href: "/labs/python/pygame",
    },
  ],
  javascript: [
    {
      id: "fetch-api",
      title: "Fetch API",
      subtitle: "Requests, headers, and responses",
      description: "Use Fetch docs coverage for request options, headers, bodies, JSON, and response helpers.",
      status: "live",
      badge: "FX",
      href: "/labs/javascript/fetch-api",
    },
    {
      id: "canvas",
      title: "Canvas",
      subtitle: "Shapes, paths, text, and transforms",
      description: "Cover more Canvas docs with drawing paths, text, images, state, and transform helpers.",
      status: "live",
      badge: "CV",
      href: "/labs/javascript/canvas",
    },
    {
      id: "dom-projects",
      title: "DOM Projects",
      subtitle: "Select, build, and update UI",
      description: "Practice broader DOM docs coverage with selectors, events, classes, attributes, and created elements.",
      status: "live",
      badge: "DM",
      href: "/labs/javascript/dom-projects",
    },
  ],
  typescript: [
    {
      id: "ts-dom",
      title: "DOM Types",
      subtitle: "Typed queries and DOM guards",
      description: "Use TypeScript DOM docs patterns for typed queries, narrowing, events, and element creation.",
      status: "live",
      badge: "TD",
      href: "/labs/typescript/ts-dom",
    },
  ],
  java: [
    {
      id: "array-list",
      title: "ArrayList",
      subtitle: "Grow, search, and reshape lists",
      description: "Cover more ArrayList docs with inserts, updates, searches, loops, and list-combining helpers.",
      status: "live",
      badge: "AL",
      href: "/labs/java/array-list",
    },
  ],
  csharp: [
    {
      id: "http-client",
      title: "HttpClient",
      subtitle: "Requests, headers, and JSON",
      description: "Use HttpClient docs for request messages, JSON content, headers, and cancellation-aware API calls.",
      status: "live",
      badge: "HC",
      href: "/labs/csharp/http-client",
    },
  ],
  rust: [
    {
      id: "vec",
      title: "Vec",
      subtitle: "Grow, inspect, and trim vectors",
      description: "Cover more Vec docs with safe reads, inserts, removals, mutable loops, and trimming helpers.",
      status: "live",
      badge: "VC",
      href: "/labs/rust/vec",
    },
  ],
  lua: [
    {
      id: "tables",
      title: "Tables",
      subtitle: "Fields, helpers, and table tools",
      description: "Use more Lua table docs for fields, iteration, joins, sorting, packing, and range moves.",
      status: "live",
      badge: "TB",
      href: "/labs/lua/tables",
    },
  ],
};

const LESSON_TOPICS: Partial<Record<LearningLanguage, Record<string, Record<string, string>>>> = {
  python: {
    "1": { "1": "the print() function in Python and how to display text on the screen using print('hello')", "2": "printing numbers in Python using print() with integers and floats like print(42)", "3": "printing multiple things in Python using commas in print() like print('hello', 'world')", "4": "comments in Python using the # symbol to write notes in code" },
    "2": { "1": "creating variables in Python like name = 'Alice' or age = 25", "2": "rules for naming variables in Python. No spaces, no special characters, case sensitive", "3": "changing a variable value in Python by reassigning it", "4": "printing variables in Python using print(variable_name)" },
    "3": { "1": "the input() function in Python is how to get text from the user using input('Enter your name: ')", "2": "storing user input in a variable like name = input('Your name: ')", "3": "converting input to a number using int(input()) or float(input())", "4": "using input values inside print() statements" },
    "4": { "1": "joining strings in Python using the + operator like 'hello' + ' world'", "2": "string length in Python using the len() function", "3": "upper() and lower() string methods in Python", "4": "f-strings in Python like f'Hello {name}' to insert variables into strings" },
    "5": { "1": "if statements in Python to run code only when a condition is True", "2": "else statements in Python to run code when the if condition is False", "3": "elif statements in Python to check multiple conditions", "4": "combining conditions in Python using and, or, not" },
    "6": { "1": "while loops in Python to repeat code while a condition is True", "2": "for loops in Python to repeat code a set number of times", "3": "the range() function in Python for loops like for i in range(5)", "4": "break and continue in Python to control loops" },
    "7": { "1": "defining a function in Python using the def keyword like def greet():", "2": "calling a function in Python by writing its name like greet()", "3": "function parameters in Python like def add(a, b):", "4": "return values in Python using the return keyword" },
    "8": { "1": "creating a list in Python like fruits = ['apple', 'banana', 'cherry']", "2": "accessing list items in Python using index like fruits[0]", "3": "adding and removing items from a list using append() and remove()", "4": "looping through a list in Python using a for loop" },
    "9": { "1": "creating a dictionary in Python like person = {'name': 'Alice', 'age': 25}", "2": "accessing dictionary values in Python using keys like person['name']", "3": "adding and updating dictionary entries in Python", "4": "looping through a dictionary in Python using for key in dict" },
    "10": { "1": "opening a file in Python using open() with read mode 'r' or write mode 'w'", "2": "reading a file in Python using file.read() or file.readlines()", "3": "writing to a file in Python using file.write()", "4": "closing files properly in Python using file.close() or with open()" },
    "11": { "1": "defining a class in Python using the class keyword like class Dog:", "2": "the __init__ method in Python classes to set up attributes", "3": "class attributes in Python using self.name = name", "4": "class methods in Python are functions that belong to a class" },
    "12": { "1": "planning a Python project is breaking a problem into small steps before writing any code", "2": "building the structure of a Python program using functions and variables together", "3": "adding features to a Python program step by step using everything learned so far", "4": "testing and fixing bugs in a Python program using print statements and logic checks" },
  },
  javascript: {
    "1": { "1": "the console.log() function in JavaScript and how to display text on the screen using console.log('hello')", "2": "logging numbers in JavaScript using console.log() with integers and decimals like console.log(42)", "3": "logging multiple values in JavaScript using commas in console.log() like console.log('hello', 'world')", "4": "comments in JavaScript using // to write notes in code" },
    "2": { "1": "creating variables in JavaScript like let name = 'Alice' or const age = 25", "2": "the difference between let and const in JavaScript and when to use each one", "3": "changing a variable value in JavaScript by reassigning it", "4": "logging variables in JavaScript using console.log(variableName)" },
    "3": { "1": "the prompt() function in JavaScript is how to get text from the user using prompt('Enter your name:')", "2": "storing user input in a variable like const name = prompt('Your name:')", "3": "turning prompt input into a number using Number(prompt())", "4": "using input values inside console.log() statements" },
    "4": { "1": "joining strings in JavaScript using the + operator like 'hello' + ' world'", "2": "string length in JavaScript using the .length property", "3": "toUpperCase() and toLowerCase() string methods in JavaScript", "4": "template literals in JavaScript like `Hello ${name}` to insert variables into strings" },
    "5": { "1": "if statements in JavaScript to run code only when a condition is true", "2": "else statements in JavaScript to run code when the if condition is false", "3": "else if statements in JavaScript to check multiple conditions", "4": "combining conditions in JavaScript using &&, ||, and !" },
    "6": { "1": "while loops in JavaScript to repeat code while a condition is true", "2": "for loops in JavaScript to repeat code a set number of times", "3": "loop counters in JavaScript like for (let i = 0; i < 5; i++)", "4": "break and continue in JavaScript to control loops" },
    "7": { "1": "defining a function in JavaScript using the function keyword like function greet() {}", "2": "calling a function in JavaScript by writing its name like greet()", "3": "function parameters in JavaScript like function add(a, b) {}", "4": "return values in JavaScript using the return keyword" },
    "8": { "1": "creating an array in JavaScript like const fruits = ['apple', 'banana', 'cherry']", "2": "accessing array items in JavaScript using index like fruits[0]", "3": "adding and removing items from an array using push() and pop()", "4": "looping through an array in JavaScript using a for loop or for...of" },
    "9": { "1": "creating an object in JavaScript like const person = { name: 'Alice', age: 25 }", "2": "accessing object values in JavaScript using dot notation like person.name or brackets like person['name']", "3": "adding and updating object properties in JavaScript", "4": "looping through an object in JavaScript using Object.keys() or for...in" },
    "10": { "1": "finding an HTML element in JavaScript using document.querySelector()", "2": "changing text on a web page in JavaScript using textContent", "3": "changing styles in JavaScript using element.style", "4": "responding to button clicks in JavaScript using addEventListener" },
    "11": { "1": "defining a class in JavaScript using the class keyword like class Dog {}", "2": "the constructor method in JavaScript classes to set up properties", "3": "class properties in JavaScript using this.name = name", "4": "class methods in JavaScript are functions that belong to a class" },
    "12": { "1": "planning a JavaScript project by breaking a problem into small steps before writing code", "2": "building the structure of a JavaScript app using functions, variables, and page elements together", "3": "adding features to a JavaScript app step by step using everything learned so far", "4": "testing and fixing bugs in a JavaScript app using console.log and careful checks" },
  },
};

const UNIT_CHALLENGES: Partial<Record<LearningLanguage, Record<string, UnitChallenge>>> = {
  python: {
    "1": {
      title: "Hello World Challenge", description: "Use what you learned about print() and comments to complete this challenge.", prompt: `Write a Python program that:
1. Prints your name
2. Prints your age
3. Prints "I am learning Python!"
4. Has at least one comment explaining what your code does`, exampleOutput: `Alice
25
I am learning Python!` },
    "2": {
      title: "Variables Challenge", description: "Use variables to store and display information.", prompt: `Write a Python program that:
1. Creates a variable called "name" with your name
2. Creates a variable called "age" with your age
3. Creates a variable called "city" with your city
4. Prints all three variables`, exampleOutput: `Alice
25
New York` },
    "3": {
      title: "User Input Challenge", description: "Build a simple interactive program using input().", prompt: `Write a Python program that:
1. Asks the user for their name using input()
2. Asks the user for their favorite color
3. Prints a message combining both, like "Hi Alice! Your favorite color is blue."`, exampleOutput: `Hi Alice! Your favorite color is blue.`
    },
    "4": {
      title: "Strings Challenge", description: "Use string operations to manipulate text.", prompt: `Write a Python program that:
1. Creates a variable with your full name
2. Prints your name in ALL CAPS
3. Prints how many characters are in your name
4. Prints a greeting using an f-string like "Hello, my name is Alice!"`, exampleOutput: `ALICE SMITH
11
Hello, my name is Alice Smith!` },
    "5": {
      title: "Conditions Challenge", description: "Write a program that makes decisions.", prompt: `Write a Python program that:
1. Creates a variable called "score" with a number between 0 and 100
2. Prints "A" if score is 90 or above
3. Prints "B" if score is 80-89
4. Prints "C" if score is 70-79
5. Prints "F" if score is below 70`, exampleOutput: `B`
    },
    "6": {
      title: "Loops Challenge", description: "Use loops to repeat code.", prompt: `Write a Python program that:
1. Uses a for loop to print the numbers 1 through 10
2. Uses a while loop to count down from 5 to 1
3. Prints "Blast off!" at the end`, exampleOutput: `1
2
3
4
5
6
7
8
9
10
5
4
3
2
1
Blast off!` },
    "7": {
      title: "Functions Challenge", description: "Write and use your own functions.", prompt: `Write a Python program that:
1. Defines a function called "greet" that takes a name and prints "Hello, [name]!"
2. Defines a function called "add" that takes two numbers and returns their sum
3. Calls greet() with your name
4. Calls add() with two numbers and prints the result`, exampleOutput: `Hello, Alice!
15` },
    "8": {
      title: "Lists Challenge", description: "Work with lists of data.", prompt: `Write a Python program that:
1. Creates a list of 5 of your favorite foods
2. Prints the first and last item in the list
3. Adds a new food to the list
4. Prints how many items are in the list
5. Loops through the list and prints each item`, exampleOutput: `pizza
sushi
6
pizza
burger
tacos
ramen
sushi
ice cream` },
    "9": {
      title: "Dictionaries Challenge", description: "Use dictionaries to store structured data.", prompt: `Write a Python program that:
1. Creates a dictionary called "person" with keys: name, age, city, hobby
2. Prints each value using its key
3. Adds a new key called "language" with value "Python"
4. Prints all keys and values using a loop`, exampleOutput: `Alice
25
New York
coding
name: Alice
age: 25
city: New York
hobby: coding
language: Python` },
    "10": {
      title: "File Handling Challenge", description: "Read and write files.", prompt: `Write a Python program that:
1. Creates a file called "notes.txt" and writes three lines to it
2. Closes the file
3. Opens the file again and reads all the content
4. Prints the content`, exampleOutput: `Line 1
Line 2
Line 3` },
    "11": {
      title: "Classes Challenge", description: "Build your own class.", prompt: `Write a Python program that:
1. Defines a class called "Dog" with attributes: name, breed, age
2. Adds a method called "bark" that prints "[name] says: Woof!"
3. Adds a method called "info" that prints the dog's name, breed and age
4. Creates two Dog objects and calls both methods on each`, exampleOutput: `Rex says: Woof!
Name: Rex, Breed: Labrador, Age: 3
Buddy says: Woof!
Name: Buddy, Breed: Poodle, Age: 5` },
    "12": {
      title: "Final Project Challenge", description: "Build a complete Python program using everything you learned.", prompt: `Build a simple contact book program that:
1. Has a dictionary to store contacts (name -> phone number)
2. Has a function to add a contact
3. Has a function to look up a contact by name
4. Has a function to display all contacts
5. Demonstrates all three functions working`, exampleOutput: `Contact added: Alice - 555-1234
Looking up Alice: 555-1234
All contacts:
Alice: 555-1234
Bob: 555-5678` },
  },
  javascript: {
    "1": {
      title: "Hello Console Challenge", description: "Use console.log() and comments to complete this challenge.", prompt: `Write a JavaScript program that:
1. Logs your name
2. Logs your age
3. Logs "I am learning JavaScript!"
4. Has at least one comment explaining what your code does`, exampleOutput: `Alice
25
I am learning JavaScript!` },
    "2": {
      title: "Variables Challenge", description: "Use variables to store and display information.", prompt: `Write a JavaScript program that:
1. Creates a variable called name with your name
2. Creates a variable called age with your age
3. Creates a variable called city with your city
4. Logs all three variables`, exampleOutput: `Alice
25
New York` },
    "3": {
      title: "User Input Challenge", description: "Build a simple interactive program using prompt().", prompt: `Write a JavaScript program that:
1. Asks the user for their name using prompt()
2. Asks the user for their favorite color
3. Logs a message combining both, like "Hi Alice! Your favorite color is blue."`, exampleOutput: `Hi Alice! Your favorite color is blue.`
    },
    "4": {
      title: "Strings Challenge", description: "Use string operations to manipulate text.", prompt: `Write a JavaScript program that:
1. Creates a variable with your full name
2. Logs your name in ALL CAPS
3. Logs how many characters are in your name
4. Logs a greeting using a template literal like "Hello, my name is Alice!"`, exampleOutput: `ALICE SMITH
11
Hello, my name is Alice Smith!` },
    "5": {
      title: "Conditions Challenge", description: "Write a program that makes decisions.", prompt: `Write a JavaScript program that:
1. Creates a variable called score with a number between 0 and 100
2. Logs "A" if score is 90 or above
3. Logs "B" if score is 80-89
4. Logs "C" if score is 70-79
5. Logs "F" if score is below 70`, exampleOutput: `B`
    },
    "6": {
      title: "Loops Challenge", description: "Use loops to repeat code.", prompt: `Write a JavaScript program that:
1. Uses a for loop to log the numbers 1 through 10
2. Uses a while loop to count down from 5 to 1
3. Logs "Blast off!" at the end`, exampleOutput: `1
2
3
4
5
6
7
8
9
10
5
4
3
2
1
Blast off!` },
    "7": {
      title: "Functions Challenge", description: "Write and use your own functions.", prompt: `Write a JavaScript program that:
1. Defines a function called greet that takes a name and logs "Hello, [name]!"
2. Defines a function called add that takes two numbers and returns their sum
3. Calls greet() with your name
4. Calls add() with two numbers and logs the result`, exampleOutput: `Hello, Alice!
15` },
    "8": {
      title: "Arrays Challenge", description: "Work with arrays of data.", prompt: `Write a JavaScript program that:
1. Creates an array of 5 of your favorite foods
2. Logs the first and last item in the array
3. Adds a new food to the array
4. Logs how many items are in the array
5. Loops through the array and logs each item`, exampleOutput: `pizza
sushi
6
pizza
burger
tacos
ramen
sushi
ice cream` },
    "9": {
      title: "Objects Challenge", description: "Use objects to store structured data.", prompt: `Write a JavaScript program that:
1. Creates an object called person with keys: name, age, city, hobby
2. Logs each value using its key
3. Adds a new key called language with value "JavaScript"
4. Logs all keys and values using a loop`, exampleOutput: `Alice
25
New York
coding
name: Alice
age: 25
city: New York
hobby: coding
language: JavaScript` },
    "10": {
      title: "DOM Challenge", description: "Update a web page with JavaScript.", prompt: `Write JavaScript that:
1. Selects an element with the id "message"
2. Changes its text to "Hello from JavaScript!"
3. Changes its color to blue
4. Adds a click handler to a button with the id "changeBtn" that updates the text again`, exampleOutput: `Hello from JavaScript!`
    },
    "11": {
      title: "Classes Challenge", description: "Build your own class.", prompt: `Write a JavaScript program that:
1. Defines a class called Dog with properties: name, breed, age
2. Adds a method called bark that logs "[name] says: Woof!"
3. Adds a method called info that logs the dog's name, breed and age
4. Creates two Dog objects and calls both methods on each`, exampleOutput: `Rex says: Woof!
Name: Rex, Breed: Labrador, Age: 3
Buddy says: Woof!
Name: Buddy, Breed: Poodle, Age: 5` },
    "12": {
      title: "Final Project Challenge", description: "Build a complete JavaScript program using everything you learned.", prompt: `Build a simple contact book program that:
1. Has an object to store contacts (name -> phone number)
2. Has a function to add a contact
3. Has a function to look up a contact by name
4. Has a function to display all contacts
5. Demonstrates all three functions working`, exampleOutput: `Contact added: Alice - 555-1234
Looking up Alice: 555-1234
All contacts:
Alice: 555-1234
Bob: 555-5678` },
  },
};

const LANGUAGE_SECTIONS: Record<LearningLanguage, SectionMeta[]> = {
  python: PYTHON_SECTIONS,
  javascript: JAVASCRIPT_SECTIONS,
  typescript: TYPESCRIPT_SECTIONS,
  java: JAVA_SECTIONS,
  csharp: CSHARP_SECTIONS,
  rust: RUST_SECTIONS,
  lua: LUA_SECTIONS,
};

export function normalizeLanguage(language?: string | null): LearningLanguage {
  if (language && SUPPORTED_LANGUAGES.includes(language as LearningLanguage)) {
    return language as LearningLanguage;
  }

  return "python";
}

export function getLanguageLabel(language?: string | null): string {
  return LANGUAGE_LABELS[normalizeLanguage(language)];
}

export function getCourseSections(language?: string | null): SectionMeta[] {
  return LANGUAGE_SECTIONS[normalizeLanguage(language)];
}

export function getMiniCourses(language?: string | null): MiniCourseMeta[] {
  return MINI_COURSES[normalizeLanguage(language)];
}

export function getLessonTopic(language: string | null | undefined, unitId: string, lessonId: string): string {
  const normalizedLanguage = normalizeLanguage(language);
  const explicit = LESSON_TOPICS[normalizedLanguage]?.[unitId]?.[lessonId];
  if (explicit) return explicit;

  const sectionUnit = LANGUAGE_SECTIONS[normalizedLanguage]
    .flatMap((section) => section.units)
    .find((unit) => String(unit.id) === unitId);
  const lesson = sectionUnit?.lessons.find((item) => String(item.id) === lessonId);

  if (sectionUnit && lesson) {
    return `${lesson.title} in ${getLanguageLabel(normalizedLanguage)} inside the unit ${sectionUnit.title}. Keep it beginner-friendly and use only ${getLanguageLabel(normalizedLanguage)} syntax.`;
  }

  return `${getLanguageLabel(normalizedLanguage)} basics`;
}

export function getUnitChallenge(language: string | null | undefined, unitId: string): UnitChallenge | null {
  const normalizedLanguage = normalizeLanguage(language);
  const explicit = UNIT_CHALLENGES[normalizedLanguage]?.[unitId];
  if (explicit) return explicit;

  const unit = LANGUAGE_SECTIONS[normalizedLanguage]
    .flatMap((section) => section.units)
    .find((item) => String(item.id) === unitId);

  if (!unit) return null;

  return {
    title: `${unit.title} Challenge`,
    description: `Apply ${unit.title} in a short ${getLanguageLabel(normalizedLanguage)} program.`,
    prompt: `Write a ${getLanguageLabel(normalizedLanguage)} program that:
1. Uses the main idea from ${unit.title}
2. Stores at least one value
3. Prints a clear result
4. Includes one small extension of your own`,
    exampleOutput: `Program output goes here`,
  };
}

export function getLanguageCommentPrefix(language?: string | null): string {
  return LANGUAGE_COMMENT_PREFIX[normalizeLanguage(language)];
}

export function languageHasPlacement(language?: string | null): boolean {
  return LANGUAGE_HAS_PLACEMENT[normalizeLanguage(language)];
}
