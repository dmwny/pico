import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const leaderstatsQuestionsSeed = buildFifteenQuestionConcept({
  concept: "leaderstats",
  definitions: [
    {
      prompt: "What is the main purpose of a `leaderstats` folder in Roblox?",
      options: [
        "It stores camera settings for Studio",
        "It gives the player a GUI menu",
        "It exposes player stat values to the Roblox leaderboard display",
        "It saves datastores automatically",
      ],
      correctIndex: 2,
      explanation:
        "A folder named `leaderstats` under a Player is the standard Roblox pattern for showing values on the in-game leaderboard. Developers place value objects like `IntValue` inside it so players can see things like points, deaths, or wins. It is a display pattern, not a save system or a Studio setting.",
      difficulty: 2,
    },
    {
      prompt: "Which value object is a common choice for whole-number stats such as points or deaths?",
      options: ["StringValue", "IntValue", "BoolValue", "ObjectValue"],
      correctIndex: 1,
      explanation:
        "`IntValue` is the usual choice for whole-number stats because it stores integer numbers. That makes it a natural fit for counters like deaths, coins, or stages cleared. The other value objects store different kinds of data.",
      difficulty: 2,
    },
    {
      prompt: "Where should the folder named `leaderstats` be parented so Roblox can treat it as a player's leaderboard data?",
      options: ["The Player object", "Workspace", "ReplicatedStorage", "Lighting"],
      correctIndex: 0,
      explanation:
        "The `leaderstats` folder belongs under the Player object. That is where Roblox expects to find the values it should show on the leaderboard. Putting the folder in Workspace or other services will not turn it into player leaderboard data.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "The folder name should be exactly `leaderstats` if you want Roblox's standard leaderboard behavior.",
      correct: true,
      explanation:
        "This pattern depends on the special folder name `leaderstats`. If you rename it to something else, Roblox will not treat it as the standard leaderboard container. Exact names matter in patterns like this.",
      difficulty: 2,
    },
    {
      prompt: "If you parent a `leaderstats` folder to `Workspace`, Roblox will still show it on the player leaderboard because the name is what matters most.",
      correct: false,
      explanation:
        "The name matters, but the parent matters too. Roblox expects `leaderstats` to be a child of the Player. A folder in Workspace is just world hierarchy, not player leaderboard data.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"leaderstats\"\nprint(leaderstats.Name)",
      mcOutputOptions: ["Folder", "leaderstats", "Stats", "nil"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script sets the folder's `Name` property to `leaderstats` and then prints that property. The output is the exact string `leaderstats`. This exact naming pattern is what Roblox looks for when showing leaderboard values.",
      fillTypePrompt: "Type the folder name Roblox expects for standard leaderboard stats.",
      fillTypeCode: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"___\"",
      fillTypeAnswer: "leaderstats",
      fillTypeExplanation:
        "The folder name must be `leaderstats`. That exact name is the convention Roblox uses for the built-in leaderboard display pattern.",
      predictPrompt: "What does this code print?",
      predictCode: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"leaderstats\"\nprint(leaderstats.ClassName)",
      predictAnswer: "Folder",
      predictExplanation:
        "Even though the folder is named `leaderstats`, its class is still `Folder`. The name tells Roblox how to treat it in the player hierarchy, but it does not change the object's type.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local points = Instance.new(\"IntValue\")\npoints.Name = \"Points\"\npoints.Value = 10\nprint(points.Value)",
      mcOutputOptions: ["Points", "10", "IntValue", "0"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The code stores `10` in the IntValue's `Value` property, so printing `points.Value` returns `10`. This is the common pattern used for score, coins, deaths, and other numeric leaderboard stats.",
      fillTypePrompt: "Type the property that stores the number inside an `IntValue`.",
      fillTypeCode: "local points = Instance.new(\"IntValue\")\npoints.___ = 10",
      fillTypeAnswer: "Value",
      fillTypeExplanation:
        "The numeric content of an `IntValue` lives in the `Value` property. Changing `Name` would rename the stat, but `Value` is what changes the number players see.",
      predictPrompt: "What does this code print?",
      predictCode: "local points = Instance.new(\"IntValue\")\npoints.Name = \"Points\"\npoints.Value = 10\nprint(points.Value > 5)",
      predictAnswer: "true",
      predictExplanation:
        "The value is set to `10`, and `10 > 5` evaluates to `true`. This kind of comparison is common when you check whether a player has reached a target score or unlocked a feature.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"leaderstats\"\nlocal deaths = Instance.new(\"IntValue\")\ndeaths.Name = \"Deaths\"\ndeaths.Parent = leaderstats\nprint(#leaderstats:GetChildren())",
      mcOutputOptions: ["0", "leaderstats", "1", "Deaths"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "Once the `Deaths` IntValue is parented into the folder, `leaderstats:GetChildren()` contains one child. The length operator `#` therefore prints `1`. This confirms the stat object is actually inside the leaderboard folder.",
      fillTypePrompt: "Type the class name used here for a death counter that stores a whole number.",
      fillTypeCode: "local deaths = Instance.new(\"___\")",
      fillTypeAnswer: "IntValue",
      fillTypeExplanation:
        "`IntValue` is the right fit for a death counter because deaths are stored as whole numbers. That makes it the standard beginner choice for leaderstats counters.",
      predictPrompt: "What does this code print?",
      predictCode: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"leaderstats\"\nlocal deaths = Instance.new(\"IntValue\")\ndeaths.Name = \"Deaths\"\ndeaths.Parent = leaderstats\nprint(leaderstats:GetChildren()[1].Name)",
      predictAnswer: "Deaths",
      predictExplanation:
        "The only child inside the folder is the IntValue named `Deaths`, so accessing the first child and printing its `Name` returns `Deaths`. This is a useful reminder that leaderstats is just normal Roblox hierarchy underneath the special naming convention.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a player gets a `leaderstats` folder with a `Points` value inside it.",
    lines: [
      "local leaderstats = Instance.new(\"Folder\")",
      "leaderstats.Name = \"leaderstats\"",
      "local points = Instance.new(\"IntValue\")",
      "points.Name = \"Points\"\npoints.Parent = leaderstats",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The leaderboard folder has to exist before the points value can be parented into it. Naming the folder `leaderstats` is what gives the pattern meaning, and creating the `Points` value inside it completes the standard setup.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to make Roblox recognize the player's leaderboard folder automatically?",
    versionA: "leaderstats.Name = \"leaderstats\"",
    versionB: "leaderstats.Name = \"stats\"",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because the standard Roblox leaderboard pattern expects the folder name `leaderstats` exactly. Using `stats` may look reasonable, but Roblox will not treat it as the built-in leaderboard container.",
    difficulty: 3,
  },
});

export const leaderstatsContent: LessonContent[] = buildPracticeLessonContent({
  concept: "leaderstats",
  cards: [
    {
      title: "Show the Player's Score",
      body:
        "Once your obby tracks something meaningful, players need to see it. Roblox's classic way to do that is a folder named `leaderstats` under each player, with values inside for points, deaths, wins, or stages. This lesson is about building that pattern cleanly so your game starts feeling like a multiplayer system instead of a solo prototype. By the end, your obby can expose real player stats.",
      docUrl: "https://create.roblox.com/docs/players",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Build the Counter Properly",
      body:
        "Leaderstats looks special to the player, but under the hood it is just normal Roblox hierarchy and value objects. That means you still need to create the folder, name it exactly, add the correct value objects, and update their `Value` fields deliberately. The magic comes from using the pattern correctly, not from hidden Roblox automation. Once you get that, scoreboard systems become straightforward.",
      docUrl: "https://create.roblox.com/docs/players",
      code: "local leaderstats = Instance.new(\"Folder\")\nleaderstats.Name = \"leaderstats\"\nlocal points = Instance.new(\"IntValue\")\npoints.Name = \"Points\"\npoints.Parent = leaderstats",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: leaderstatsQuestionsSeed,
  miniProject: {
    title: "Your Turn: Add Obby Points",
    description:
      "Create a basic leaderboard stat for your obby, such as `Points`, `Deaths`, or `Stages`. Make a `leaderstats` folder for each player, add an `IntValue` inside it, and update that value somewhere meaningful in your game flow. Keep the names readable so you can tell exactly what the stat means from Explorer and from the leaderboard itself. When it works, another player should be able to join and see the stat update in the standard Roblox leaderboard area.",
    hint:
      "The two names that matter most are the folder name `leaderstats` and the display name of the value object inside it, such as `Points`.",
    docUrl: "https://create.roblox.com/docs/players",
  },
});

export const leaderstatsQuestions: Question[] = leaderstatsContent.filter(isQuestionContent);
