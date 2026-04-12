import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const characterHumanoidQuestionsSeed = buildFifteenQuestionConcept({
  concept: "character-humanoid",
  definitions: [
    {
      prompt: "Which object inside a Roblox character usually stores health, jump behavior, and walk speed?",
      options: ["Humanoid", "ParticleEmitter", "ScreenGui", "ClickDetector"],
      correctIndex: 0,
      explanation:
        "The `Humanoid` object is the part of the character model that controls core character behavior like health, movement, and jumping. If you want to damage the player, speed them up, or change jump settings, this is usually the object you touch. The other choices belong to visual effects, interface, or world interaction instead.",
      difficulty: 2,
    },
    {
      prompt: "What is `HumanoidRootPart` usually used for in Roblox character code?",
      options: [
        "It stores leaderboard values for the player",
        "It is the central body part used for character position and movement calculations",
        "It displays TextLabels above the character",
        "It automatically saves player data",
      ],
      correctIndex: 1,
      explanation:
        "`HumanoidRootPart` is the central reference part in many character movement systems. Developers often use it for position checks, teleporting, boosts, and physics-based interactions. It is not a UI object, a save system, or a leaderboard container.",
      difficulty: 2,
    },
    {
      prompt: "Which event is the best fit when you need to react every time a player's character spawns or respawns?",
      options: ["Touched", "OnServerEvent", "CharacterAdded", "Changed"],
      correctIndex: 2,
      explanation:
        "`CharacterAdded` fires whenever the player's character appears, including after respawns. That makes it the safe place to set up things that depend on the character existing. `Touched`, `OnServerEvent`, and `Changed` solve different problems and do not specifically mean a character has loaded.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A player's `Character` can be `nil` for a moment, which is why Roblox developers often use `CharacterAdded` or `WaitForChild()`.",
      correct: true,
      explanation:
        "When a player first joins or respawns, the character model may not exist yet at the exact moment your script starts running. Good Roblox code waits for the character instead of assuming it is already there. That habit prevents a lot of early nil errors in player scripts.",
      difficulty: 2,
    },
    {
      prompt: "Setting `humanoid.WalkSpeed = 24` also automatically changes the character's health to 24.",
      correct: false,
      explanation:
        "`WalkSpeed` and `Health` are separate properties on the Humanoid. Changing speed affects movement, not damage or remaining health. Roblox developers need to be careful about changing exactly the property they intend.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local character = Instance.new(\"Model\")\nlocal humanoid = Instance.new(\"Humanoid\")\nhumanoid.Parent = character\nprint(humanoid.ClassName)",
      mcOutputOptions: ["Model", "Humanoid", "Part", "Instance"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script creates a `Humanoid` object and parents it into a Model. Printing `humanoid.ClassName` returns the class of that specific object, which is `Humanoid`. The parent being a Model does not change the child's class.",
      fillTypePrompt: "Type the class name so this code creates the object that controls health and movement.",
      fillTypeCode: "local humanoid = Instance.new(\"___\")",
      fillTypeAnswer: "Humanoid",
      fillTypeExplanation:
        "The class name is `Humanoid`. This is the character object Roblox uses for health, walking, jumping, and many other player-related systems. Writing the correct class name matters because `Instance.new()` depends on exact strings.",
      predictPrompt: "What does this code print?",
      predictAnswer: "true",
      predictExplanation:
        "A new Humanoid starts with positive health, so `humanoid.Health > 0` evaluates to `true`. The script is checking whether the health value is above zero, not printing the health itself. That makes the result a boolean.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print after the boost is applied?",
      code: "local humanoid = Instance.new(\"Humanoid\")\nhumanoid.WalkSpeed = 24\nprint(humanoid.WalkSpeed)",
      mcOutputOptions: ["16", "24", "100", "0"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script explicitly sets `WalkSpeed` to `24` and then prints that property. The printed result is therefore `24`. This is the kind of change you would make for a speed pad or temporary power-up in an obby.",
      fillTypePrompt: "Type the property name used to increase how fast a character walks.",
      fillTypeCode: "local humanoid = Instance.new(\"Humanoid\")\nhumanoid.___ = 24",
      fillTypeAnswer: "WalkSpeed",
      fillTypeExplanation:
        "`WalkSpeed` is the Humanoid property that controls character movement speed. If you want a speed boost pad, this is the property you normally modify. It does not change health or jump power by itself.",
      predictPrompt: "What does this code print?",
      predictAnswer: "true",
      predictExplanation:
        "The code sets `WalkSpeed` to `24`, then checks whether it is greater than `16`. Since `24` is greater than `16`, the comparison prints `true`. This is a useful pattern when checking whether a boost was applied successfully.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local character = Instance.new(\"Model\")\nlocal root = Instance.new(\"Part\")\nroot.Name = \"HumanoidRootPart\"\nroot.Parent = character\nprint(character:FindFirstChild(\"HumanoidRootPart\") ~= nil)",
      mcOutputOptions: ["false", "Part", "HumanoidRootPart", "true"],
      mcOutputCorrectIndex: 3,
      mcOutputExplanation:
        "The part is named `HumanoidRootPart` and parented into the character model, so `FindFirstChild(\"HumanoidRootPart\")` succeeds. Comparing that result to `nil` gives `true`. This is a common pattern when checking whether the root part is present before using it.",
      fillTypePrompt: "Type the exact child name used for the central root part lookup.",
      fillTypeCode: "local root = character:FindFirstChild(\"___\")",
      fillTypeAnswer: "HumanoidRootPart",
      fillTypeExplanation:
        "The exact name is `HumanoidRootPart`. This is a name lookup, not a class lookup, so the string has to match the child name exactly. Many Roblox movement systems start by finding this object first.",
      predictPrompt: "What does this code print?",
      predictAnswer: "HumanoidRootPart",
      predictExplanation:
        "The part is named `HumanoidRootPart`, and the script prints `root.Name`. Because the name was explicitly set before the print, the result is that exact string. This is one more example of code matching the object names you see in the hierarchy.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a LocalScript waits for the character, finds the Humanoid, and applies a speed boost.",
    lines: [
      "local player = game:GetService(\"Players\").LocalPlayer",
      "local character = player.Character or player.CharacterAdded:Wait()",
      "local humanoid = character:WaitForChild(\"Humanoid\")",
      "humanoid.WalkSpeed = 24",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The script first gets the local player, then waits for that player's character to exist, then waits for the Humanoid inside the character, and only after that changes `WalkSpeed`. If you reorder those steps, you risk trying to use the character or humanoid before they exist. This is the normal safe sequence for character-based LocalScripts.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to find the root part inside the character model?",
    versionA: "local root = character:FindFirstChild(\"HumanoidRootPart\")",
    versionB: "local root = character:FindFirstChildOfClass(\"HumanoidRootPart\")",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because `HumanoidRootPart` is usually a Part named `HumanoidRootPart`, not a Roblox class called `HumanoidRootPart`. `FindFirstChildOfClass()` is for class names like `Humanoid` or `Part`. When you are looking for this specific root part by its name, `FindFirstChild()` is the correct tool.",
    difficulty: 3,
  },
});

export const characterHumanoidContent: LessonContent[] = buildPracticeLessonContent({
  concept: "character-humanoid",
  cards: [
    {
      title: "Meet the Character",
      body:
        "Your obby only becomes a real game when it starts reacting to the player's character. In Roblox, that usually means working with the character model, the `Humanoid`, and the `HumanoidRootPart`. Those objects are what let you build jump pads, speed boosts, damage zones, and many other player-focused mechanics. This lesson turns the player from a generic object into something you can control on purpose.",
      docUrl: "https://create.roblox.com/docs/players",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Power Up the Run",
      body:
        "Now you're using those character objects to build a real obby mechanic: a temporary movement boost. Changing `WalkSpeed` on the Humanoid is one of the simplest ways to make a pad feel exciting, but it only works if you found the right objects safely first. That means waiting for the character and targeting the Humanoid intentionally. Once you can do that, lots of player mechanics become possible.",
      docUrl: "https://create.roblox.com/docs/players",
      code: "local player = game:GetService(\"Players\").LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\nlocal humanoid = character:WaitForChild(\"Humanoid\")\nhumanoid.WalkSpeed = 24",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: characterHumanoidQuestionsSeed,
  miniProject: {
    title: "Your Turn: Build a Speed Pad",
    description:
      "Add a speed pad to your obby that boosts the player when they touch it. Use a visible Part in the map, detect the touch, find the character's Humanoid, and increase `WalkSpeed` for a short time or until the next section. Make sure the script handles the character safely instead of assuming every object is already there. When it works, the pad should clearly change how the player moves.",
    hint:
      "After a touch, look for `Humanoid` inside the touching character model rather than trying to change movement on the part that was touched.",
    docUrl: "https://create.roblox.com/docs/players",
  },
});

export const characterHumanoidQuestions: Question[] = characterHumanoidContent.filter(isQuestionContent);
