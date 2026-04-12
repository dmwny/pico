import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const raycastingQuestionsSeed = buildFifteenQuestionConcept({
  concept: "raycasting",
  definitions: [
    {
      prompt: "What is a Roblox raycast mainly used for?",
      options: [
        "Checking what a line would hit in the world",
        "Saving player data across sessions",
        "Opening the Toolbox panel",
        "Creating a leaderboard",
      ],
      correctIndex: 0,
      explanation:
        "A raycast checks along a direction in the world to see what it hits first. Developers use it for line-of-sight checks, hit detection, placement tests, and ground checks. It is a world-query tool, not a save or UI system.",
      difficulty: 2,
    },
    {
      prompt: "Which Roblox type stores filter settings for a raycast?",
      options: ["TweenInfo", "RaycastParams", "RemoteEvent", "Sound"],
      correctIndex: 1,
      explanation:
        "`RaycastParams` stores things like filter lists and filter mode for a raycast. That lets you control what the ray should ignore or include during the world query.",
      difficulty: 2,
    },
    {
      prompt: "What does it usually mean if `workspace:Raycast(...)` returns `nil`?",
      options: [
        "The code has a syntax error",
        "The ray hit too many objects",
        "The ray did not hit anything",
        "The ray only works on the client",
      ],
      correctIndex: 2,
      explanation:
        "A `nil` raycast result usually means nothing was hit along that ray. That is not automatically an error; it is often the expected outcome when no object is in the tested path.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "Raycasts are a common choice for precise hit detection, line-of-sight checks, and ground checks in Roblox.",
      correct: true,
      explanation:
        "Raycasts are useful because they let you ask a very specific world question without relying on broad physical overlap. That makes them a strong tool for advanced mechanics and more precise gameplay systems.",
      difficulty: 2,
    },
    {
      prompt: "A raycast always hits something in `Workspace`, so checking for a nil result is unnecessary.",
      correct: false,
      explanation:
        "A raycast can absolutely miss. Safe Roblox code checks whether the result exists before trying to read properties like `Position` or `Instance` from it.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local params = RaycastParams.new()\nprint(typeof(params))",
      mcOutputOptions: ["table", "Raycast", "RaycastParams", "Instance"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The constructor creates a RaycastParams object, so `typeof(params)` prints `RaycastParams`. This is the settings object used to control how a raycast should filter the world.",
      fillTypePrompt: "Type the Roblox type constructor used here for raycast filter settings.",
      fillTypeCode: "local params = ___.new()",
      fillTypeAnswer: "RaycastParams",
      fillTypeExplanation:
        "The correct constructor is `RaycastParams.new()`. That object stores settings such as filter lists and filter type for a raycast query.",
      predictPrompt: "What does this code print?",
      predictCode: "local params = RaycastParams.new()\nparams.FilterType = Enum.RaycastFilterType.Exclude\nprint(params.FilterType == Enum.RaycastFilterType.Exclude)",
      predictAnswer: "true",
      predictExplanation:
        "The filter type is explicitly set to `Exclude`, so the comparison prints `true`. This kind of setup is common when you want the ray to ignore certain objects.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local origin = Vector3.new(0, 10, 0)\nlocal direction = Vector3.new(0, -20, 0)\nprint(direction.Y)",
      mcOutputOptions: ["10", "-20", "0", "-10"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The direction vector's Y component is `-20`, so that is what gets printed. Downward raycasts often use a negative Y direction like this for ground checks or drop tests.",
      fillTypePrompt: "Type the Roblox vector type used here for the ray's origin and direction.",
      fillTypeCode: "local origin = ___.new(0, 10, 0)",
      fillTypeAnswer: "Vector3",
      fillTypeExplanation:
        "The correct type is `Vector3`. Raycasts use a 3D origin and a 3D direction, so vectors are part of almost every raycast setup.",
      predictPrompt: "What does this code print?",
      predictCode: "local origin = Vector3.new(0, 10, 0)\nlocal direction = Vector3.new(0, -20, 0)\nprint((origin + direction).Y)",
      predictAnswer: "-10",
      predictExplanation:
        "The Y values add together as `10 + (-20)`, which gives `-10`. This is simple vector math, but it also helps you reason about where a ray is pointing in the world.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local params = RaycastParams.new()\nlocal ignoreFolder = Instance.new(\"Folder\")\nparams.FilterDescendantsInstances = { ignoreFolder }\nprint(#params.FilterDescendantsInstances)",
      mcOutputOptions: ["0", "Folder", "1", "nil"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The filter list contains one instance, so its length is `1`. This is how developers tell a raycast which descendants should be ignored or otherwise considered by the query.",
      fillTypePrompt: "Type the property used here to provide the list of instances for raycast filtering.",
      fillTypeCode: "params.___ = { ignoreFolder }",
      fillTypeAnswer: "FilterDescendantsInstances",
      fillTypeExplanation:
        "`FilterDescendantsInstances` is the property that stores the list of instances used for filtering. It works together with `FilterType` to decide how the list affects the ray.",
      predictPrompt: "What does this code print?",
      predictCode: "local params = RaycastParams.new()\nlocal ignoreFolder = Instance.new(\"Folder\")\nparams.FilterDescendantsInstances = { ignoreFolder }\nprint(params.FilterDescendantsInstances[1].ClassName)",
      predictAnswer: "Folder",
      predictExplanation:
        "The only item in the filter list is the Folder instance, so accessing the first entry and printing its class name returns `Folder`. This is a direct way to verify the right object ended up in the filter list.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a downward raycast is prepared with filter settings.",
    lines: [
      "local params = RaycastParams.new()",
      "params.FilterType = Enum.RaycastFilterType.Exclude",
      "params.FilterDescendantsInstances = { script.Parent }",
      "local result = workspace:Raycast(Vector3.new(0, 10, 0), Vector3.new(0, -20, 0), params)",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The raycast settings object needs to exist before you configure its filter mode and filter list. Once those settings are ready, the script can perform the world query using `workspace:Raycast(...)`.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to create raycast filter settings?",
    versionA: "local params = RaycastParams.new()",
    versionB: "local params = Instance.new(\"RaycastParams\")",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because `RaycastParams` is not created through `Instance.new()`. It uses the special constructor `RaycastParams.new()` instead.",
    difficulty: 3,
  },
});

export const raycastingContent: LessonContent[] = buildPracticeLessonContent({
  concept: "raycasting",
  cards: [
    {
      title: "Trace the World",
      body:
        "Raycasting is one of the biggest upgrades from beginner Roblox scripting to more advanced game logic. Instead of waiting for physics touches, you can ask the world a precise question: if I trace a line from here in this direction, what do I hit first? That opens the door to better hit detection, line-of-sight checks, and smarter mechanics. In this lesson, you're learning the core pieces of that system.",
      docUrl: "https://create.roblox.com/docs/physics",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Filter the Query",
      body:
        "A raycast becomes much more useful once you control what it should ignore. That is where `RaycastParams` comes in. By setting filter mode and filter instances, you can stop the ray from accidentally hitting the shooter's own model, the tool that fired it, or some other object you do not want counted. This is what makes raycasts practical in real gameplay code.",
      docUrl: "https://create.roblox.com/docs/physics",
      code: "local params = RaycastParams.new()\nparams.FilterType = Enum.RaycastFilterType.Exclude\nparams.FilterDescendantsInstances = { script.Parent }\nlocal result = workspace:Raycast(Vector3.new(0, 10, 0), Vector3.new(0, -20, 0), params)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: raycastingQuestionsSeed,
  miniProject: {
    title: "Your Turn: Build a Ground Check",
    description:
      "Use a downward raycast to test whether something in your game is standing over solid ground. Create `RaycastParams`, choose which objects to ignore, cast the ray downward, and handle the case where nothing is hit. You can use this for an advanced jump pad, a hover mechanic, or a placement check on a moving part. The important part is learning to ask the world a precise question instead of relying only on touch events.",
    hint:
      "Think about the three ingredients every raycast needs: an origin, a direction, and optional filter settings.",
    docUrl: "https://create.roblox.com/docs/physics",
  },
});

export const raycastingQuestions: Question[] = raycastingContent.filter(isQuestionContent);
