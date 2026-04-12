import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const checkpointSystemQuestionsSeed = buildFifteenQuestionConcept({
  concept: "checkpoint-system",
  definitions: [
    {
      prompt: "Which Roblox object is the best fit for a checkpoint that should become the player's respawn location?",
      options: ["TextLabel", "SpawnLocation", "RemoteEvent", "Humanoid"],
      correctIndex: 1,
      explanation:
        "`SpawnLocation` is the built-in world object meant for player spawning and respawning. A checkpoint system often uses one or more SpawnLocations so the player's next respawn happens at the right stage. The other choices are for UI, networking, or character logic instead.",
      difficulty: 2,
    },
    {
      prompt: "Which `Players` service method turns a touched character model into its owning player?",
      options: [
        "Players:GetPlayerFromCharacter()",
        "Players:FindFirstChild()",
        "Players:GetChildren()",
        "Players:WaitForChild()",
      ],
      correctIndex: 0,
      explanation:
        "`GetPlayerFromCharacter()` is the direct Roblox helper for mapping a character model back to the Player who owns it. That is exactly what checkpoint scripts need after a `Touched` event. The other methods inspect hierarchy but do not perform this character-to-player lookup.",
      difficulty: 2,
    },
    {
      prompt: "What player property is commonly updated so a checkpoint changes where the player respawns?",
      options: ["Character", "Team", "RespawnLocation", "DisplayName"],
      correctIndex: 2,
      explanation:
        "`RespawnLocation` is the player property used to control which SpawnLocation they should use next. Updating it lets a checkpoint move the player's restart point forward through the obby. The other properties serve unrelated player features.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A checkpoint script should confirm the touched model has a `Humanoid` before treating it like a player character.",
      correct: true,
      explanation:
        "A lot of objects can touch a part in Roblox, including loose parts, tools, and debris. Checking for `Humanoid` helps confirm that the touching object is actually a character model. That makes the checkpoint logic more reliable and prevents accidental triggers.",
      difficulty: 2,
    },
    {
      prompt: "If every checkpoint is left with the default name `Part`, scripts are easier to maintain because Roblox can tell them apart automatically.",
      correct: false,
      explanation:
        "Good checkpoint systems depend on clear naming and structure, especially once an obby has many stages. Leaving everything named `Part` makes debugging and hierarchy lookups much harder. Roblox does not magically understand your design intent from default names.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local checkpoint = Instance.new(\"SpawnLocation\")\nprint(checkpoint.ClassName)",
      mcOutputOptions: ["Part", "SpawnLocation", "Checkpoint", "BasePart"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The code creates a `SpawnLocation`, so printing `checkpoint.ClassName` returns `SpawnLocation`. That is the Roblox object type most checkpoint systems build around when they want a real respawn marker.",
      fillTypePrompt: "Type the class name so this code creates a checkpoint spawn object.",
      fillTypeCode: "local checkpoint = Instance.new(\"___\")",
      fillTypeAnswer: "SpawnLocation",
      fillTypeExplanation:
        "The correct class name is `SpawnLocation`. Roblox uses this class for places where players can spawn or respawn, so it is a natural building block for checkpoints.",
      predictPrompt: "What does this code print?",
      predictCode: "local checkpoint = Instance.new(\"SpawnLocation\")\ncheckpoint.Name = \"CheckpointA\"\nprint(checkpoint.Name)",
      predictAnswer: "CheckpointA",
      predictExplanation:
        "The code sets the SpawnLocation's `Name` property to `CheckpointA` and then prints that property. Naming checkpoints clearly matters because it makes Explorer and script lookups much easier to follow later.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local checkpoint = Instance.new(\"SpawnLocation\")\ncheckpoint:SetAttribute(\"Stage\", 4)\nprint(checkpoint:GetAttribute(\"Stage\"))",
      mcOutputOptions: ["Stage", "4", "true", "nil"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The attribute named `Stage` is set to the number `4`, so `GetAttribute(\"Stage\")` returns `4`. Attributes are a clean way to label checkpoints with stage numbers or metadata without creating extra child objects.",
      fillTypePrompt: "Type the attribute name so this checkpoint stores its stage number in the same place as the example.",
      fillTypeCode: "local checkpoint = Instance.new(\"SpawnLocation\")\ncheckpoint:SetAttribute(\"___\", 4)",
      fillTypeAnswer: "Stage",
      fillTypeExplanation:
        "The attribute name is `Stage`. A named attribute like this gives your scripts a reliable place to store checkpoint-specific data such as stage order or checkpoint IDs.",
      predictPrompt: "What does this code print?",
      predictCode: "local checkpoint = Instance.new(\"SpawnLocation\")\ncheckpoint:SetAttribute(\"Stage\", 4)\nprint(checkpoint:GetAttribute(\"Stage\") == 4)",
      predictAnswer: "true",
      predictExplanation:
        "The code stores `4` in the `Stage` attribute, then compares the returned value to `4`. Because the values match, the printed result is `true`. This is a common way to verify a checkpoint attribute was set correctly.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local character = Instance.new(\"Model\")\nlocal humanoid = Instance.new(\"Humanoid\")\nhumanoid.Parent = character\nprint(character:FindFirstChild(\"Humanoid\") ~= nil)",
      mcOutputOptions: ["Humanoid", "Model", "false", "true"],
      mcOutputCorrectIndex: 3,
      mcOutputExplanation:
        "The Humanoid is parented into the character model, so `FindFirstChild(\"Humanoid\")` returns an object instead of `nil`. Comparing that result to `nil` prints `true`. This is exactly the kind of safety check checkpoint scripts use before assuming a toucher is a real character.",
      fillTypePrompt: "Type the child name this script is checking before awarding the checkpoint.",
      fillTypeCode: "local humanoid = character:FindFirstChild(\"___\")",
      fillTypeAnswer: "Humanoid",
      fillTypeExplanation:
        "The checkpoint code checks for `Humanoid`. Roblox characters normally include a Humanoid, so this is a reliable beginner-friendly way to filter out non-character touches.",
      predictPrompt: "What does this code print?",
      predictCode: "local character = Instance.new(\"Model\")\nlocal humanoid = Instance.new(\"Humanoid\")\nhumanoid.Parent = character\nprint(character:FindFirstChildOfClass(\"Humanoid\").ClassName)",
      predictAnswer: "Humanoid",
      predictExplanation:
        "The script finds the Humanoid object inside the model and prints its `ClassName`. Since the object is a Humanoid, the output is `Humanoid`. This is another way to confirm the touching model is the kind of object your checkpoint expects.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a checkpoint touch script gets the player and updates their respawn location.",
    lines: [
      "local Players = game:GetService(\"Players\")",
      "local character = hit.Parent",
      "local player = Players:GetPlayerFromCharacter(character)",
      "if player then\n    player.RespawnLocation = script.Parent\nend",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The script first gets the `Players` service, then reads the touching character from `hit.Parent`, then resolves that character to a player, and only then updates `RespawnLocation`. That order mirrors the real flow of a checkpoint script reacting to a touch in the world.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to get the player from the character that touched the checkpoint?",
    versionA: "local player = Players:GetPlayerFromCharacter(hit.Parent)",
    versionB: "local player = Players:GetPlayerFromCharacter(hit)",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because `hit` is usually the touching part, not the full character model. `GetPlayerFromCharacter()` expects the character model, which is why checkpoint scripts normally pass `hit.Parent` after verifying the model is valid.",
    difficulty: 3,
  },
});

export const checkpointSystemContent: LessonContent[] = buildPracticeLessonContent({
  concept: "checkpoint-system",
  cards: [
    {
      title: "Save the Player's Place",
      body:
        "A checkpoint keeps an obby from feeling punishing by moving the player's restart point forward after they reach a safe stage. In Roblox, that usually means combining a touched part, a real player lookup, and a `SpawnLocation` or respawn target. This lesson is about building that flow on purpose instead of hoping respawns land in the right spot. By the end, your obby can remember how far the player got.",
      docUrl: "https://create.roblox.com/docs/players",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Touch, Find, Update",
      body:
        "A checkpoint script usually follows the same sequence every time: detect the touch, confirm it came from a character, identify the player, and update that player's respawn target. Each step matters because Roblox worlds contain lots of touching objects that are not players. Once you understand that chain, checkpoint systems stop feeling mysterious. They become one more event-driven mechanic you can reason about clearly.",
      docUrl: "https://create.roblox.com/docs/scripting/events",
      code: "local Players = game:GetService(\"Players\")\nlocal checkpoint = script.Parent\ncheckpoint.Touched:Connect(function(hit)\n    local player = Players:GetPlayerFromCharacter(hit.Parent)\n    if player then\n        player.RespawnLocation = checkpoint\n    end\nend)",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: checkpointSystemQuestionsSeed,
  miniProject: {
    title: "Your Turn: Add a Real Checkpoint",
    description:
      "Create a checkpoint section in your obby that updates the player's respawn point when they reach it. Use a visible checkpoint object, detect the touch, make sure the toucher is a real character, and set the player's respawn target deliberately. Give the checkpoint a clear name or stage attribute so you can tell which one was reached. When it works, dying after that point should bring the player back to the later stage instead of the start.",
    hint:
      "After `Touched` fires, look up the player from the character model before changing any respawn setting. The touch part itself is not the player.",
    docUrl: "https://create.roblox.com/docs/players",
  },
});

export const checkpointSystemQuestions: Question[] = checkpointSystemContent.filter(isQuestionContent);
