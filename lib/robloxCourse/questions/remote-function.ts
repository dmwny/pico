import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const remoteFunctionQuestionsSeed = buildFifteenQuestionConcept({
  concept: "remote-function",
  definitions: [
    {
      prompt: "What is a `RemoteFunction` mainly used for in Roblox?",
      options: [
        "It creates tween animations for parts",
        "It handles request-response communication between client and server",
        "It permanently saves datastore values",
        "It shows a ScreenGui on the player's screen",
      ],
      correctIndex: 1,
      explanation:
        "`RemoteFunction` is the remote type you use when one side needs to ask a question and get a return value back. That is different from `RemoteEvent`, which is one-way. Developers often use `RemoteFunction` for things like stage info, shop checks, or server-approved values.",
      difficulty: 2,
    },
    {
      prompt: "Which callback property on a server-side `RemoteFunction` handles incoming client requests?",
      options: ["OnServerEvent", "MouseClick", "OnServerInvoke", "Touched"],
      correctIndex: 2,
      explanation:
        "`OnServerInvoke` is the function the server assigns on a RemoteFunction so it can respond to client requests. `OnServerEvent` belongs to RemoteEvent instead. The other choices are unrelated interaction events.",
      difficulty: 2,
    },
    {
      prompt: "What is the biggest practical difference between `RemoteEvent` and `RemoteFunction`?",
      options: [
        "Only RemoteFunction directly returns a value to the caller",
        "Only RemoteEvent can live in ReplicatedStorage",
        "Only RemoteFunction can be created with `Instance.new()`",
        "Only RemoteEvent works on the server",
      ],
      correctIndex: 0,
      explanation:
        "`RemoteFunction` is the request-response tool, so it can return a value to the caller. `RemoteEvent` is one-way and does not directly return one. Both can be created with `Instance.new()` and both are commonly stored in `ReplicatedStorage`.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A `RemoteFunction` can be created with `Instance.new(\"RemoteFunction\")`.",
      correct: true,
      explanation:
        "RemoteFunction is a normal Roblox Instance class. Like many other Roblox objects, you can create it through `Instance.new()` and then parent it into a shared container such as `ReplicatedStorage`.",
      difficulty: 2,
    },
    {
      prompt: "A client should call a `RemoteFunction` with `FireServer()` when it wants a response from the server.",
      correct: false,
      explanation:
        "`FireServer()` is for RemoteEvent, not RemoteFunction. When you want a response, the client uses `InvokeServer()`. Mixing those two APIs is one of the most common beginner networking mistakes in Roblox.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local remote = Instance.new(\"RemoteFunction\")\nprint(remote.ClassName)",
      mcOutputOptions: ["RemoteFunction", "RemoteEvent", "BindableFunction", "Function"],
      mcOutputCorrectIndex: 0,
      mcOutputExplanation:
        "The code creates a `RemoteFunction` and prints its class name, so the result is `RemoteFunction`. This confirms that the object was created from the correct Roblox class string.",
      fillTypePrompt: "Type the class name so the code creates a request-response remote.",
      fillTypeCode: "local remote = Instance.new(\"___\")",
      fillTypeAnswer: "RemoteFunction",
      fillTypeExplanation:
        "The correct class name is `RemoteFunction`. That is the remote type Roblox provides when the caller needs a returned answer instead of just firing a message and moving on.",
      predictPrompt: "What does this code print?",
      predictAnswer: "RemoteFunction",
      predictExplanation:
        "The code prints `remote.ClassName`, and the object was created as a `RemoteFunction`. That means the output is the string `RemoteFunction`. This reinforces that you are working with the request-response remote type, not a RemoteEvent.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local remote = Instance.new(\"RemoteFunction\")\nremote.OnServerInvoke = function(player, stageNumber)\n    return stageNumber + 1\nend\nprint(typeof(remote.OnServerInvoke))",
      mcOutputOptions: ["table", "RBXScriptSignal", "function", "number"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The script assigns a function to `remote.OnServerInvoke`, so `typeof(remote.OnServerInvoke)` prints `function`. This is the callback the server uses to decide what value should be returned.",
      fillTypePrompt: "Type the callback property name used to handle client invokes on the server.",
      fillTypeCode: "local remote = Instance.new(\"RemoteFunction\")\nremote.___ = function(player, stageNumber)\n    return stageNumber + 1\nend",
      fillTypeAnswer: "OnServerInvoke",
      fillTypeExplanation:
        "`OnServerInvoke` is the RemoteFunction property where server code defines the response logic. When a client calls `InvokeServer()`, Roblox runs this function and returns its result.",
      predictPrompt: "What does this code print?",
      predictAnswer: "function",
      predictExplanation:
        "The shown code prints `typeof(remote.OnServerInvoke)` after assigning a function to that property. Because the property now holds a function, the printed result is `function`. The important lesson is that `OnServerInvoke` is the callback slot the server fills in.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print after the remote is parented?",
      code: "local remote = Instance.new(\"RemoteFunction\")\nlocal replicatedStorage = game:GetService(\"ReplicatedStorage\")\nremote.Parent = replicatedStorage\nprint(remote.Parent.Name)",
      mcOutputOptions: ["RemoteFunction", "Workspace", "ReplicatedStorage", "Players"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The RemoteFunction is parented to `ReplicatedStorage`, so printing `remote.Parent.Name` returns `ReplicatedStorage`. This is the common shared location for remotes used by both the client and the server.",
      fillTypePrompt: "Type the client-side method used to ask the server for a returned value from a RemoteFunction.",
      fillTypeCode: "local stageName = remote:___(3)",
      fillTypeAnswer: "InvokeServer",
      fillTypeExplanation:
        "`InvokeServer()` is the client-side method for calling a RemoteFunction and waiting for the server's answer. This is exactly what makes RemoteFunction different from a one-way RemoteEvent.",
      predictPrompt: "What does this code print?",
      predictAnswer: "ReplicatedStorage",
      predictExplanation:
        "The RemoteFunction is parented to `ReplicatedStorage`, and the code prints `remote.Parent.Name`. That means the output is `ReplicatedStorage`. This mirrors the common Roblox pattern of storing remotes in a shared replicated container.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so the server defines a RemoteFunction and returns the next stage number.",
    lines: [
      "local remote = Instance.new(\"RemoteFunction\")",
      "remote.Name = \"GetNextStage\"",
      "remote.OnServerInvoke = function(player, stageNumber)\n    return stageNumber + 1\nend",
      "remote.Parent = game:GetService(\"ReplicatedStorage\")",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The RemoteFunction has to exist before you can name it or assign `OnServerInvoke`. After the response logic is defined, the remote is parented into `ReplicatedStorage` so both sides can access it. This is a normal setup sequence for a shared networking object.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the client needs to ask the server for a returned stage name?",
    versionA: "local stageName = remote:InvokeServer(3)",
    versionB: "local stageName = remote:FireServer(3)",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because `FireServer()` is the one-way RemoteEvent API. If the client expects a returned value, it needs `InvokeServer()` on a RemoteFunction instead. That is the core distinction this lesson is teaching.",
    difficulty: 3,
  },
});

export const remoteFunctionContent: LessonContent[] = buildPracticeLessonContent({
  concept: "remote-function",
  cards: [
    {
      title: "Ask the Server",
      body:
        "Some client actions need more than a one-way message. Sometimes the client needs to ask the server a question and wait for an answer, like checking what stage should unlock next or what data a button should display. That is exactly what `RemoteFunction` is for. In this lesson, you are learning the request-response version of Roblox remotes.",
      docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Use the Answer",
      body:
        "A RemoteFunction is most useful when the client's next action depends on the server's reply. That makes it perfect for things like validated shop prices, stage names, or server-approved status checks. The big rule is simple: if you need a return value, use `InvokeServer()` and implement `OnServerInvoke`. If you do not need a return value, you are usually looking for RemoteEvent instead.",
      docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
      code: "local remote = game:GetService(\"ReplicatedStorage\"):WaitForChild(\"GetNextStage\")\nlocal stageName = remote:InvokeServer(3)\nprint(stageName)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: remoteFunctionQuestionsSeed,
  miniProject: {
    title: "Your Turn: Ask for Stage Info",
    description:
      "Create a RemoteFunction that lets a LocalScript ask the server for some stage-related information, such as the next stage number or a display name for the current checkpoint. Put the remote in ReplicatedStorage, define `OnServerInvoke` on the server, and call `InvokeServer()` from the client. The point of the exercise is not the exact data; it is learning when a returned answer is the right networking pattern. Make the final result something your obby UI could realistically use.",
    hint:
      "If the client needs data back immediately, think `RemoteFunction` plus `InvokeServer()`, not `RemoteEvent` plus `FireServer()`.",
    docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
  },
});

export const remoteFunctionQuestions: Question[] = remoteFunctionContent.filter(isQuestionContent);
