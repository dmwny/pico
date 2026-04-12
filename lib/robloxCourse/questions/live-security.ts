import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const liveSecurityQuestionsSeed = buildFifteenQuestionConcept({
  concept: "live-security",
  definitions: [
    {
      prompt: "What is the core security rule for Roblox client-server gameplay?",
      options: [
        "Always trust the client because it is closest to the player",
        "Never trust the client without validating what it sends",
        "Store all secure logic inside StarterGui",
        "Use RemoteFunction instead of RemoteEvent for every action",
      ],
      correctIndex: 1,
      explanation:
        "The server should treat client input as untrusted until it has been checked. Clients can request actions, but the server should decide whether those actions are allowed. That rule protects live games from abuse and accidental bad data.",
      difficulty: 2,
    },
    {
      prompt: "Where should a Roblox game usually validate RemoteEvent data that affects score, stages, currency, or damage?",
      options: ["On the server", "Inside Explorer", "Only in a LocalScript", "Inside Lighting"],
      correctIndex: 0,
      explanation:
        "Validation belongs on the server because the server is the authority for real game state. A LocalScript can help with responsiveness, but it cannot be the final security layer for live gameplay changes.",
      difficulty: 2,
    },
    {
      prompt: "What is a good example of server-side sanity checking for a stage update request?",
      options: [
        "Accept any value because the client already did the UI",
        "Make sure the stage value is the right type and within allowed limits",
        "Store the request in StarterGui first",
        "Rename the RemoteEvent every time it is fired",
      ],
      correctIndex: 1,
      explanation:
        "A server should verify both the type and the allowed range of important data. That keeps bad or malicious input from becoming real game state. Accepting any value just because the client asked is exactly what secure Roblox code avoids.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "Studio playtesting is useful, but a live game still needs server-side validation because real players can send unexpected data.",
      correct: true,
      explanation:
        "Playtesting helps find bugs, but it does not replace security rules. Once a game is live, you need the server to reject impossible values and suspicious requests rather than trusting the client blindly.",
      difficulty: 2,
    },
    {
      prompt: "If a LocalScript awards itself 9999 points, the server should just accept that value so the UI stays responsive.",
      correct: false,
      explanation:
        "Responsiveness is important, but server authority is more important for real game state. A good system lets the client request a change, then has the server validate and apply the allowed result.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local remote = Instance.new(\"RemoteEvent\")\nprint(remote.ClassName)",
      mcOutputOptions: ["RemoteFunction", "ReplicatedStorage", "RemoteEvent", "BindableEvent"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The code creates a `RemoteEvent`, so printing its class name returns `RemoteEvent`. That is one of the core objects used for client-server communication in Roblox, which is why it also needs careful validation on the server side.",
      fillTypePrompt: "Type the class name so this code creates a one-way client-server remote.",
      fillTypeCode: "local remote = Instance.new(\"___\")",
      fillTypeAnswer: "RemoteEvent",
      fillTypeExplanation:
        "The correct class name is `RemoteEvent`. This remote sends one-way messages, which is often enough for client requests that the server will validate and handle.",
      predictPrompt: "What does this code print?",
      predictCode: "local remote = Instance.new(\"RemoteEvent\")\nremote.Name = \"StageRequest\"\nprint(remote.Name)",
      predictAnswer: "StageRequest",
      predictExplanation:
        "The code sets the remote's name to `StageRequest` and then prints that property. Clear naming becomes especially important once you have multiple remotes in a live game.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local function isValidStage(stageNumber)\n    return typeof(stageNumber) == \"number\" and stageNumber >= 1 and stageNumber <= 100\nend\nprint(isValidStage(5))",
      mcOutputOptions: ["5", "false", "number", "true"],
      mcOutputCorrectIndex: 3,
      mcOutputExplanation:
        "The value `5` is a number and falls within the allowed range from 1 to 100, so the function returns `true`. This is the exact kind of sanity check a server should do before accepting stage progress from a client.",
      fillTypePrompt: "Type the Roblox function used here to check the runtime type of the incoming value.",
      fillTypeCode: "local ok = ___(stageNumber) == \"number\"",
      fillTypeAnswer: "typeof",
      fillTypeExplanation:
        "`typeof` is the Roblox function used to inspect the runtime type of a value. It is a common part of server-side validation when remotes can receive many kinds of input.",
      predictPrompt: "What does this code print?",
      predictCode: "local function isValidStage(stageNumber)\n    return typeof(stageNumber) == \"number\" and stageNumber >= 1 and stageNumber <= 100\nend\nprint(isValidStage(\"5\"))",
      predictAnswer: "false",
      predictExplanation:
        "The string `\"5\"` is not a number, so the first part of the condition fails and the whole function returns `false`. This shows why server checks should verify type as well as value range.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local checkpointPart = Instance.new(\"Part\")\nprint(checkpointPart:IsA(\"BasePart\"))",
      mcOutputOptions: ["Part", "BasePart", "true", "false"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "A `Part` inherits from `BasePart`, so `IsA(\"BasePart\")` returns `true`. Checks like this are useful when the server needs to confirm a client-sent instance is at least the right kind of object before using it.",
      fillTypePrompt: "Type the method used here to verify an instance belongs to a certain Roblox class family.",
      fillTypeCode: "local ok = checkpointPart:___(\"BasePart\")",
      fillTypeAnswer: "IsA",
      fillTypeExplanation:
        "`IsA` checks whether an instance matches a class or inherited class family. That makes it useful for defensive server code that validates incoming instances before trusting them.",
      predictPrompt: "What does this code print?",
      predictCode: "local checkpointPart = Instance.new(\"Part\")\nprint(checkpointPart:IsA(\"Model\"))",
      predictAnswer: "false",
      predictExplanation:
        "A Part is not a Model, so `IsA(\"Model\")` returns `false`. This is exactly the kind of check a secure server can use to reject the wrong kind of instance data.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so the server validates a stage request before accepting it.",
    lines: [
      "local remote = game:GetService(\"ReplicatedStorage\"):WaitForChild(\"StageRequest\")",
      "remote.OnServerEvent:Connect(function(player, stageNumber)",
      "    if typeof(stageNumber) == \"number\" and stageNumber >= 1 and stageNumber <= 100 then",
      "        print(\"accepted\")\n    end\nend)",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The server first gets the remote, then listens for incoming requests, then validates the stage number, and only after that performs the accepted action. That is the backbone of safe remote handling in a live Roblox game.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to keep stage progress secure?",
    versionA: "if typeof(stageNumber) == \"number\" and stageNumber >= 1 and stageNumber <= 100 then\n    player.leaderstats.Stage.Value = stageNumber\nend",
    versionB: "player.leaderstats.Stage.Value = stageNumber",
    buggyVersion: "B",
    explanation:
      "Version B blindly trusts the incoming value and writes it straight into game state. Version A is safer because it checks the type and range before accepting the request.",
    difficulty: 3,
  },
});

export const liveSecurityContent: LessonContent[] = buildPracticeLessonContent({
  concept: "live-security",
  cards: [
    {
      title: "Protect the Live Game",
      body:
        "Once your Roblox game is published, your code is dealing with real players and real client input. That means the server has to protect important game state instead of assuming every request is honest or well-formed. This lesson is about the habit that separates a working prototype from a game you can safely ship: validate before you trust. Good security starts with simple checks done consistently.",
      docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Check Before You Accept",
      body:
        "A secure server does not need complicated tricks to be effective. It just needs to verify that incoming data is the right type, inside allowed limits, and tied to the right kind of object before applying it. Those small checks stop many common exploit paths and accidental bugs. This lesson grounds that idea in the kinds of requests an obby would actually handle.",
      docUrl: "https://create.roblox.com/docs/studio/experience-settings",
      code: "local remote = game:GetService(\"ReplicatedStorage\"):WaitForChild(\"StageRequest\")\nremote.OnServerEvent:Connect(function(player, stageNumber)\n    if typeof(stageNumber) == \"number\" and stageNumber >= 1 and stageNumber <= 100 then\n        print(\"accepted\")\n    end\nend)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: liveSecurityQuestionsSeed,
  miniProject: {
    title: "Your Turn: Harden One Remote",
    description:
      "Pick one client-to-server action in your game, such as changing stages, awarding points, or activating a button, and add real validation on the server. Check the value type, the allowed range, and any object classes involved before the server updates game state. Make sure the client can still request the action, but the server stays in charge of whether it actually happens. When you are done, the feature should feel the same for honest players and much safer for a live game.",
    hint:
      "Ask yourself what the worst fake value would be for this remote, then write the smallest server check that prevents it.",
    docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
  },
});

export const liveSecurityQuestions: Question[] = liveSecurityContent.filter(isQuestionContent);
