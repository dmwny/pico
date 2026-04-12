import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const advancedSystemsQuestionsSeed = buildFifteenQuestionConcept({
  concept: "advanced-systems",
  definitions: [
    {
      prompt: "Which Roblox service helps NPCs find paths around obstacles?",
      options: ["TweenService", "PathfindingService", "CollectionService", "SoundService"],
      correctIndex: 1,
      explanation:
        "`PathfindingService` is the Roblox service used for generating paths through the world. Developers use it when NPCs or bots need to navigate around obstacles instead of moving in a straight line.",
      difficulty: 2,
    },
    {
      prompt: "Which Roblox service is used to tag instances so many objects can be found and handled as a group?",
      options: ["CollectionService", "Players", "Lighting", "RunService"],
      correctIndex: 0,
      explanation:
        "`CollectionService` lets you tag objects with shared labels and then retrieve or react to groups of tagged instances. This is useful once a project grows past manual one-object-at-a-time logic.",
      difficulty: 2,
    },
    {
      prompt: "Which service is commonly used to bind custom gameplay actions to keyboard, gamepad, or touch input?",
      options: ["UserInputService only", "ReplicatedStorage", "ContextActionService", "DataStoreService"],
      correctIndex: 2,
      explanation:
        "`ContextActionService` is the Roblox service built for binding gameplay actions to different input types in a unified way. It is especially useful when you want one action to work across keyboard, controller, and touch.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "CollectionService tags are useful when many hazard parts should share the same script behavior without each part being hard-coded one by one.",
      correct: true,
      explanation:
        "Tags let you group many related objects together so systems can find and process them consistently. That becomes very valuable once a project has lots of similar objects scattered around the map.",
      difficulty: 2,
    },
    {
      prompt: "Physics constraints are only visual decorations and do not affect how connected parts move.",
      correct: false,
      explanation:
        "Constraints are physics tools that influence how connected parts behave. They are used for advanced mechanics like hinges, springs, or connected bodies, so they absolutely affect movement.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local collectionService = game:GetService(\"CollectionService\")\nlocal part = Instance.new(\"Part\")\ncollectionService:AddTag(part, \"Hazard\")\nprint(collectionService:HasTag(part, \"Hazard\"))",
      mcOutputOptions: ["Hazard", "false", "CollectionService", "true"],
      mcOutputCorrectIndex: 3,
      mcOutputExplanation:
        "The part is tagged with `Hazard`, so `HasTag(part, \"Hazard\")` returns `true`. This is a compact example of why tags are useful: the part now belongs to a named group without a special folder or hard-coded list.",
      fillTypePrompt: "Type the CollectionService method used here to apply a tag to an instance.",
      fillTypeCode: "collectionService:___(part, \"Hazard\")",
      fillTypeAnswer: "AddTag",
      fillTypeExplanation:
        "`AddTag` is the method that attaches a tag string to an instance. Once tagged, the object can be found or handled as part of that named group.",
      predictPrompt: "What does this code print?",
      predictCode: "local collectionService = game:GetService(\"CollectionService\")\nlocal part = Instance.new(\"Part\")\ncollectionService:AddTag(part, \"Hazard\")\nprint(#collectionService:GetTags(part))",
      predictAnswer: "1",
      predictExplanation:
        "The part has exactly one tag after `AddTag` is called, so `#collectionService:GetTags(part)` returns `1`. This confirms the tag was actually attached to the instance.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local pathfinding = game:GetService(\"PathfindingService\")\nprint(pathfinding.ClassName)",
      mcOutputOptions: ["Path", "Pathfinding", "PathfindingService", "NavigationService"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The code fetches `PathfindingService`, so printing its class name returns `PathfindingService`. This is the service advanced Roblox developers use when NPC movement needs more than simple straight-line logic.",
      fillTypePrompt: "Type the service name used for NPC path generation.",
      fillTypeCode: "local pathfinding = game:GetService(\"___\")",
      fillTypeAnswer: "PathfindingService",
      fillTypeExplanation:
        "The correct service name is `PathfindingService`. It is the Roblox service for building navigation paths through the world.",
      predictPrompt: "What does this code print?",
      predictCode: "local pathfinding = game:GetService(\"PathfindingService\")\nprint(pathfinding.Name)",
      predictAnswer: "PathfindingService",
      predictExplanation:
        "The service's name is `PathfindingService`, so printing `pathfinding.Name` returns that string. This is a quick sanity check that the correct advanced service was fetched.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local constraint = Instance.new(\"BallSocketConstraint\")\nprint(constraint.ClassName)",
      mcOutputOptions: ["Constraint", "BallSocketConstraint", "Attachment", "Weld"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The created object's class name is `BallSocketConstraint`. This is one example of the physics constraints Roblox uses for more advanced connected-part behavior.",
      fillTypePrompt: "Type the class name so this code creates the same physics constraint shown here.",
      fillTypeCode: "local constraint = Instance.new(\"___\")",
      fillTypeAnswer: "BallSocketConstraint",
      fillTypeExplanation:
        "The correct class name is `BallSocketConstraint`. Constraints like this are part of Roblox's advanced physics toolset for connected moving objects.",
      predictPrompt: "What does this code print?",
      predictCode: "local constraint = Instance.new(\"BallSocketConstraint\")\nprint(constraint:IsA(\"Constraint\"))",
      predictAnswer: "true",
      predictExplanation:
        "A BallSocketConstraint is part of the broader `Constraint` family, so `IsA(\"Constraint\")` returns `true`. That is a helpful reminder that many specialized Roblox physics objects still belong to larger class families.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a tagged hazard part is created and marked for a shared advanced system.",
    lines: [
      "local collectionService = game:GetService(\"CollectionService\")",
      "local hazard = Instance.new(\"Part\")",
      "hazard.Name = \"LaserGate\"",
      "collectionService:AddTag(hazard, \"Hazard\")",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The script gets CollectionService first, creates the object, gives it a readable name, and then tags it. That is a typical flow for building a reusable tagged-object system in a larger Roblox project.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to fetch Roblox's tag service?",
    versionA: "local collectionService = game:GetService(\"CollectionService\")",
    versionB: "local collectionService = game:GetService(\"CollectionsService\")",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because the service is named `CollectionService`, not `CollectionsService`. Precise service names matter a lot once you start using advanced Roblox APIs.",
    difficulty: 3,
  },
});

export const advancedSystemsContent: LessonContent[] = buildPracticeLessonContent({
  concept: "advanced-systems",
  cards: [
    {
      title: "Beyond the Main Game",
      body:
        "This lesson is the doorway into the Roblox systems that go beyond a standard beginner obby. Tags, pathfinding, input binding, and physics constraints all let you build richer mechanics once your fundamentals are solid. You do not need every one of these tools to ship your first game, but knowing they exist changes what kinds of games you can imagine building next. Think of this as your advanced toolbox preview.",
      docUrl: "https://create.roblox.com/docs/scripting",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Pick the Right System",
      body:
        "The key to advanced Roblox development is recognizing which system solves which problem. Tags help you manage groups of objects. Pathfinding helps NPCs move intelligently. ContextActionService and related input systems let the same action work across devices. Constraints unlock more physical mechanics than simple anchored parts ever could.",
      docUrl: "https://create.roblox.com/docs/physics",
      code: "local collectionService = game:GetService(\"CollectionService\")\nlocal pathfinding = game:GetService(\"PathfindingService\")\nlocal constraint = Instance.new(\"BallSocketConstraint\")\nprint(collectionService.ClassName, pathfinding.ClassName, constraint.ClassName)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: advancedSystemsQuestionsSeed,
  miniProject: {
    title: "Your Turn: Add One Advanced System",
    description:
      "Choose one advanced Roblox system from this lesson and add a small version of it to your game. You might tag all hazard parts with `CollectionService`, prototype an NPC route with `PathfindingService`, bind a custom action with `ContextActionService`, or experiment with a simple physics constraint. Keep the scope small and finishable. The goal is to cross the line from knowing the tool exists to actually using it once.",
    hint:
      "Do not try every advanced system at once. Pick the one that would most meaningfully extend the kind of game you want to build next.",
    docUrl: "https://create.roblox.com/docs/scripting",
  },
});

export const advancedSystemsQuestions: Question[] = advancedSystemsContent.filter(isQuestionContent);
