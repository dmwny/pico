import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildTeachingLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const moduleScriptsQuestionsSeed = buildFifteenQuestionConcept({
  concept: "module-scripts",
  definitions: [
    {
      prompt: "What is a `ModuleScript` mainly used for in Roblox?",
      options: [
        "Showing text on the screen",
        "Storing reusable code or shared data that other scripts can require",
        "Creating a new player automatically",
        "Opening the Toolbox panel in Studio",
      ],
      correctIndex: 1,
      explanation:
        "`ModuleScript` is Roblox's built-in way to package reusable code or shared configuration. Other scripts load that module with `require()`. This helps larger projects stay organized instead of repeating the same logic everywhere.",
      difficulty: 1,
    },
    {
      prompt: "Which function is used to load the value returned by a ModuleScript?",
      options: ["GetService()", "Connect()", "require()", "FindFirstChild()"],
      correctIndex: 2,
      explanation:
        "`require()` loads the ModuleScript and gives you the value it returns. In most beginner Roblox modules, that returned value is a table containing data or functions.",
      difficulty: 2,
    },
    {
      prompt: "What should a simple configuration ModuleScript usually return?",
      options: ["A table of settings", "A ParticleEmitter", "A BasePart", "An Explorer panel"],
      correctIndex: 0,
      explanation:
        "A table is the usual return value for a simple config module because it can hold named settings like respawn delay, reward amount, or door open time. That makes the module easy for other scripts to read and reuse.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A ModuleScript does not replace normal Scripts and LocalScripts; it usually supports them by sharing code or settings.",
      correct: true,
      explanation:
        "Modules are helpers, not direct replacements for everything else. A Script or LocalScript still handles events and runtime flow, while the ModuleScript can provide shared functions or values those scripts depend on.",
      difficulty: 2,
    },
    {
      prompt: "A ModuleScript runs automatically just by existing in the game, even if nothing ever requires it.",
      correct: false,
      explanation:
        "A ModuleScript is normally loaded when another script calls `require()` on it. That makes modules feel more deliberate than normal Scripts, which run based on where Roblox allows them to execute.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local module = Instance.new(\"ModuleScript\")\nprint(module.ClassName)",
      mcOutputOptions: ["Script", "ModuleScript", "Folder", "LocalScript"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The code creates a `ModuleScript`, so printing its class name returns `ModuleScript`. This confirms you are using the reusable module object, not a normal Script or LocalScript.",
      fillTypePrompt: "Type the class name so this code creates a reusable Roblox module object.",
      fillTypeCode: "local configModule = Instance.new(\"___\")",
      fillTypeAnswer: "ModuleScript",
      fillTypeExplanation:
        "The correct class name is `ModuleScript`. That is the Roblox script type used for reusable shared code and configuration.",
      predictPrompt: "What does this code print?",
      predictCode: "local module = Instance.new(\"ModuleScript\")\nmodule.Name = \"DoorConfig\"\nprint(module.Name)",
      predictAnswer: "DoorConfig",
      predictExplanation:
        "The module's name is set to `DoorConfig`, so printing `module.Name` returns `DoorConfig`. Clear module names matter once a game has many shared systems.",
      difficulty: 1,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local sharedConfig = {\n    RespawnDelay = 3,\n}\nprint(sharedConfig.RespawnDelay)",
      mcOutputOptions: ["3", "RespawnDelay", "table", "nil"],
      mcOutputCorrectIndex: 0,
      mcOutputExplanation:
        "The table stores the value `3` under `RespawnDelay`, so printing that field returns `3`. This is the same kind of table a config ModuleScript would often return to the rest of the game.",
      fillTypePrompt: "Type the field name used here for the respawn setting.",
      fillTypeCode: "local sharedConfig = {\n    ___ = 3,\n}",
      fillTypeAnswer: "RespawnDelay",
      fillTypeExplanation:
        "The field name is `RespawnDelay`. Named fields are what make configuration tables readable when several scripts need the same setting.",
      predictPrompt: "What does this code print?",
      predictCode: "local sharedConfig = {\n    RespawnDelay = 3,\n}\nprint(type(sharedConfig))",
      predictAnswer: "table",
      predictExplanation:
        "The config value is stored in a Lua table, so `type(sharedConfig)` prints `table`. That is why tables are such a common return type for ModuleScripts.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local folder = Instance.new(\"Folder\")\nfolder.Name = \"Modules\"\nlocal module = Instance.new(\"ModuleScript\")\nmodule.Parent = folder\nprint(module.Parent.Name)",
      mcOutputOptions: ["ModuleScript", "Folder", "Modules", "Workspace"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The ModuleScript is parented into the Folder named `Modules`, so printing `module.Parent.Name` returns `Modules`. Grouping modules together like this is a common project-organization pattern.",
      fillTypePrompt: "Type the parent object type used here to organize several modules together.",
      fillTypeCode: "local modulesFolder = Instance.new(\"___\")",
      fillTypeAnswer: "Folder",
      fillTypeExplanation:
        "A `Folder` is a simple way to organize related ModuleScripts together. It keeps the hierarchy readable without affecting how the modules themselves work.",
      predictPrompt: "What does this code print?",
      predictCode: "local folder = Instance.new(\"Folder\")\nfolder.Name = \"Modules\"\nlocal module = Instance.new(\"ModuleScript\")\nmodule.Parent = folder\nprint(#folder:GetChildren())",
      predictAnswer: "1",
      predictExplanation:
        "The folder contains exactly one child after the module is parented into it, so `#folder:GetChildren()` prints `1`. This shows that modules still follow the same normal Roblox hierarchy rules as other instances.",
      difficulty: 2,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a configuration module table is created and returned.",
    lines: [
      "local Config = {}",
      "Config.RespawnDelay = 3",
      "Config.CheckpointReward = 25",
      "return Config",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "A simple module usually starts by creating a table, filling it with named values or functions, and then returning it at the end. That is the standard pattern other scripts later read through `require()`.",
    difficulty: 2,
  },
  spotBug: {
    prompt: "Which version has the bug if another script is supposed to load the module's values with `require()`?",
    versionA: "return Config",
    versionB: "print(Config)",
    buggyVersion: "B",
    explanation:
      "Version B only prints the table instead of returning it to the caller. If a script is going to use `require()`, the module needs to `return` the value it wants to share.",
    difficulty: 3,
  },
});

export const moduleScriptsContent: LessonContent[] = buildTeachingLessonContent({
  concept: "module-scripts",
  cards: [
    {
      title: "Stop Repeating Yourself",
      body:
        "As Roblox projects grow, copying the same values and helper functions into many scripts becomes a mess fast. `ModuleScript` solves that by giving you one place to store shared logic or configuration and then loading it where you need it. This lesson is your first step from tiny scripts toward maintainable game code. It is one of the biggest upgrades in how advanced Roblox developers think.",
      docUrl: "https://create.roblox.com/docs/scripting",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Return Something Useful",
      body:
        "The heart of a ModuleScript is the value it returns. That might be a table of config values, a table of helper functions, or some other shared object that other scripts can require. If you understand that pattern, modules stop feeling magical. They become a very practical way to keep a growing project clean.",
      docUrl: "https://create.roblox.com/docs/scripting",
      code: "local Config = {}\nConfig.RespawnDelay = 3\nConfig.CheckpointReward = 25\nreturn Config",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: moduleScriptsQuestionsSeed,
});

export const moduleScriptsQuestions: Question[] = moduleScriptsContent.filter(isQuestionContent);
