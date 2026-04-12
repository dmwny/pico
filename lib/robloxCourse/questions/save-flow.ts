import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const saveFlowQuestionsSeed = buildFifteenQuestionConcept({
  concept: "save-flow",
  definitions: [
    {
      prompt: "Why do Roblox developers usually wrap datastore calls in `pcall()`?",
      options: [
        "Because datastores can fail and the script should handle that safely",
        "Because `pcall()` makes saving faster",
        "Because datastores only work inside LocalScripts",
        "Because `pcall()` automatically creates keys",
      ],
      correctIndex: 0,
      explanation:
        "Datastore operations can fail because of network issues, throttling, or service limits, so `pcall()` lets your code catch errors instead of crashing. That makes the save system safer and easier to debug. It does not speed up saving or create keys automatically.",
      difficulty: 2,
    },
    {
      prompt: "Which datastore method is used to read previously saved data for a key?",
      options: ["SetAsync()", "UpdateAsync()", "GetAsync()", "GetService()"],
      correctIndex: 2,
      explanation:
        "`GetAsync()` loads data that was previously saved under a key. `SetAsync()` writes data instead. Knowing which direction each method works is a basic part of building persistence correctly.",
      difficulty: 2,
    },
    {
      prompt: "What is a practical reason to build a clear save key like `player_12345`?",
      options: [
        "So the game can consistently read and write the same player's data",
        "So Roblox automatically shows it on the leaderboard",
        "So the save runs on the client instead of the server",
        "So `pcall()` returns a boolean",
      ],
      correctIndex: 0,
      explanation:
        "A consistent key is how your game knows which datastore entry belongs to which player. If the key changes unpredictably, loading and saving will point at different records. The other answers confuse persistence with unrelated systems like leaderboards and client execution.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A good save system should have a plan for what to do when no saved data exists yet for a new player.",
      correct: true,
      explanation:
        "New players often will not have any saved record yet, so your load code needs a default path. That might mean creating starting values for time, deaths, or points instead of treating missing data as a crash. Thinking about the empty-data case is part of writing a real save flow.",
      difficulty: 2,
    },
    {
      prompt: "It is safe to assume every datastore request succeeds, so checking `success` from `pcall()` is optional.",
      correct: false,
      explanation:
        "Datastore calls can fail, and ignoring that possibility leads to lost progress or broken scripts. The `success` value from `pcall()` tells you whether the protected call worked. Real save systems depend on that check.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local dataStoreService = game:GetService(\"DataStoreService\")\nprint(dataStoreService.ClassName)",
      mcOutputOptions: ["DataStore", "DataStoreService", "ReplicatedStorage", "Folder"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script fetches the `DataStoreService`, so printing its class name returns `DataStoreService`. This is the Roblox service your save flow starts from before you request a named datastore.",
      fillTypePrompt: "Type the service name used to access Roblox datastores.",
      fillTypeCode: "local dataStoreService = game:GetService(\"___\")",
      fillTypeAnswer: "DataStoreService",
      fillTypeExplanation:
        "The correct service name is `DataStoreService`. Getting the right service is the first step before you call methods like `GetDataStore()`, `GetAsync()`, or `SetAsync()`.",
      predictPrompt: "What does this code print?",
      predictCode: "local dataStoreService = game:GetService(\"DataStoreService\")\nprint(dataStoreService.Name)",
      predictAnswer: "DataStoreService",
      predictExplanation:
        "For Roblox services like this one, the `Name` and `ClassName` both line up with `DataStoreService`. Printing the name is one quick way to verify you fetched the correct service before building the rest of the save flow.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local success, result = pcall(function()\n    return \"saved\"\nend)\nprint(success)",
      mcOutputOptions: ["false", "saved", "true", "nil"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The protected call succeeds and returns normally, so `success` is `true`. `pcall()` separates whether the operation succeeded from the value returned by the operation itself. That is exactly why it is useful in datastore code.",
      fillTypePrompt: "Type the function used here to protect the save operation from throwing an error directly.",
      fillTypeCode: "local success, result = ___(function()\n    return \"saved\"\nend)",
      fillTypeAnswer: "pcall",
      fillTypeExplanation:
        "The correct function is `pcall`. In Roblox save code, it is the standard beginner-safe way to guard datastore reads and writes so failures can be handled instead of crashing the script.",
      predictPrompt: "What does this code print?",
      predictCode: "local success, result = pcall(function()\n    return \"saved\"\nend)\nprint(result)",
      predictAnswer: "saved",
      predictExplanation:
        "The function inside `pcall()` returns the string `saved`, so the second return value from `pcall()` is that string. The first value reports success; the second carries the function's result.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local userId = 42\nlocal key = \"player_\" .. userId\nprint(key)",
      mcOutputOptions: ["42", "player_", "player_42", "user_42"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The string concatenation builds `player_42` by combining the text `player_` with the number `42`. Keys like this are a common way to make sure each player's save data is read and written consistently.",
      fillTypePrompt: "Type the prefix used in this example's save key.",
      fillTypeCode: "local key = \"___\" .. userId",
      fillTypeAnswer: "player_",
      fillTypeExplanation:
        "The prefix is `player_`. Prefixes like this make save keys more readable and reduce the chance of mixing different kinds of saved data together.",
      predictPrompt: "What does this code print?",
      predictCode: "local userId = 42\nlocal key = \"player_\" .. userId\nprint(key == \"player_42\")",
      predictAnswer: "true",
      predictExplanation:
        "The concatenated key becomes `player_42`, so comparing it to that exact string returns `true`. This is a simple way to sanity-check key-building logic before real datastore calls use it.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a save flow builds a key and safely loads data with `pcall()`.",
    lines: [
      "local dataStoreService = game:GetService(\"DataStoreService\")",
      "local obbyStore = dataStoreService:GetDataStore(\"ObbyStats\")",
      "local key = \"player_\" .. player.UserId",
      "local success, data = pcall(function()\n    return obbyStore:GetAsync(key)\nend)",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "First you get the service, then the named datastore, then build the player's key, and only after that attempt the protected load. This mirrors the real order a safe Roblox load flow should follow.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to load saved obby data safely?",
    versionA: "local success, data = pcall(function()\n    return obbyStore:GetAsync(key)\nend)",
    versionB: "local data = obbyStore:GetAsync(key)",
    buggyVersion: "B",
    explanation:
      "Version B skips `pcall()`, which means any datastore error can bubble straight out of the request. In real Roblox games, save and load code should expect occasional failures and handle them deliberately.",
    difficulty: 3,
  },
});

export const saveFlowContent: LessonContent[] = buildPracticeLessonContent({
  concept: "save-flow",
  cards: [
    {
      title: "Build a Safe Save Loop",
      body:
        "Saving data is not just about calling a datastore method once. A real Roblox save flow has to decide on a key, load old data safely, create defaults when nothing exists yet, and handle failures without destroying the player experience. This lesson turns `DataStoreService` into an actual working pattern instead of a loose API name. By the end, you should understand the shape of a save system, not just one method call.",
      docUrl: "https://create.roblox.com/docs/cloud/datastores",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Protect Every Request",
      body:
        "Datastore code becomes trustworthy only when it expects failure and stays readable anyway. That is why Roblox developers build around `pcall()`, predictable keys, and sensible defaults for new players. If a request fails, your code should know what to do next instead of crashing or silently losing track of state. This is the difference between a demo save system and a production one.",
      docUrl: "https://create.roblox.com/docs/cloud/datastores",
      code: "local dataStoreService = game:GetService(\"DataStoreService\")\nlocal obbyStore = dataStoreService:GetDataStore(\"ObbyStats\")\nlocal key = \"player_\" .. player.UserId\nlocal success, data = pcall(function()\n    return obbyStore:GetAsync(key)\nend)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: saveFlowQuestionsSeed,
  miniProject: {
    title: "Your Turn: Save the Best Run",
    description:
      "Expand your obby's persistence so it can safely load and save a meaningful stat such as best time, total deaths, or points. Build a clear save key, wrap the request in `pcall()`, and decide what default data a brand-new player should receive. If the request fails, make the script fall back gracefully instead of assuming everything worked. When you are done, the save flow should look like something you would trust in a live game.",
    hint:
      "Think in four steps: service, datastore, key, protected request. If one of those is missing, the save flow is usually incomplete.",
    docUrl: "https://create.roblox.com/docs/cloud/datastores",
  },
});

export const saveFlowQuestions: Question[] = saveFlowContent.filter(isQuestionContent);
