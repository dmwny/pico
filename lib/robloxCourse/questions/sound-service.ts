import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const soundServiceQuestionsSeed = buildFifteenQuestionConcept({
  concept: "sound-service",
  definitions: [
    {
      prompt: "Which Roblox object plays audio like button clicks, win stingers, or ambient music?",
      options: ["ParticleEmitter", "Sound", "TextLabel", "TweenInfo"],
      correctIndex: 1,
      explanation:
        "The `Sound` object is the Roblox object used to play audio. Developers attach it to the world, to UI objects, or to shared audio containers depending on the effect they want. The other options are for particles, UI text, or tween settings.",
      difficulty: 2,
    },
    {
      prompt: "Which service is commonly used as a shared place for game-wide sounds?",
      options: ["SoundService", "Workspace", "Players", "ServerStorage"],
      correctIndex: 0,
      explanation:
        "`SoundService` is the Roblox service designed for managing and organizing shared audio. It is a natural place for music or sounds that are not tied to one world object. The other services are not dedicated sound containers.",
      difficulty: 2,
    },
    {
      prompt: "What does the `SoundId` property tell Roblox?",
      options: [
        "How loud the sound should be",
        "Which audio asset the Sound should play",
        "Whether the sound should loop forever",
        "Which player created the sound",
      ],
      correctIndex: 1,
      explanation:
        "`SoundId` points to the uploaded audio asset Roblox should use. Volume, looping, and creator identity are different concerns controlled elsewhere. If the SoundId is wrong, the sound will not play the audio you expect.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "Calling `sound:Play()` is the normal way to start a Roblox `Sound` from script.",
      correct: true,
      explanation:
        "`:Play()` is the standard method for starting playback on a Sound object. That makes it a common tool for feedback moments like a button click, checkpoint ding, or win fanfare.",
      difficulty: 2,
    },
    {
      prompt: "`SoundService` is mainly used to store physical platforms and hazards because sound objects have to live in the world to work.",
      correct: false,
      explanation:
        "`SoundService` is for audio organization, not for world geometry. Sounds can be parented in different places depending on the effect, but the service itself is not a container for platforms or hazards.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local winSound = Instance.new(\"Sound\")\nprint(winSound.ClassName)",
      mcOutputOptions: ["Audio", "Sound", "SoundService", "Music"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script creates a `Sound` object, so `winSound.ClassName` prints `Sound`. This is the basic building block for scripted audio feedback in Roblox.",
      fillTypePrompt: "Type the class name so the code creates a Roblox audio object.",
      fillTypeCode: "local clickSound = Instance.new(\"___\")",
      fillTypeAnswer: "Sound",
      fillTypeExplanation:
        "The correct class name is `Sound`. That is the object you script when you want to play music or sound effects in Roblox.",
      predictPrompt: "What does this code print?",
      predictCode: "local winSound = Instance.new(\"Sound\")\nwinSound.Name = \"WinSound\"\nprint(winSound.Name)",
      predictAnswer: "WinSound",
      predictExplanation:
        "The code sets the object's `Name` property to `WinSound` and then prints that property. Naming sounds clearly helps a lot once a project has multiple audio cues.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local clickSound = Instance.new(\"Sound\")\nclickSound.Volume = 0.5\nprint(clickSound.Volume)",
      mcOutputOptions: ["1", "0.5", "50", "0"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The script sets the sound's `Volume` property to `0.5`, then prints it. That means the output is `0.5`. Adjusting volume is one of the simplest ways to balance UI sounds, ambience, and reward effects.",
      fillTypePrompt: "Type the property that controls how loud the Sound is.",
      fillTypeCode: "local clickSound = Instance.new(\"Sound\")\nclickSound.___ = 0.5",
      fillTypeAnswer: "Volume",
      fillTypeExplanation:
        "`Volume` controls how loud the Sound plays. Changing `SoundId` would change the audio asset instead of the playback loudness.",
      predictPrompt: "What does this code print?",
      predictCode: "local clickSound = Instance.new(\"Sound\")\nclickSound.Volume = 0.5\nprint(clickSound.Volume < 1)",
      predictAnswer: "true",
      predictExplanation:
        "The code compares `0.5` to `1`, and `0.5 < 1` evaluates to `true`. This is a simple way to reason about whether you made a sound quieter than full volume.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local soundService = game:GetService(\"SoundService\")\nlocal music = Instance.new(\"Sound\")\nmusic.Parent = soundService\nprint(music.Parent.Name)",
      mcOutputOptions: ["Workspace", "music", "SoundService", "Players"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The Sound is parented into `SoundService`, so printing `music.Parent.Name` returns `SoundService`. This is a common place to keep shared audio like lobby music or global win sounds.",
      fillTypePrompt: "Type the service name used here to hold shared audio.",
      fillTypeCode: "local soundService = game:GetService(\"___\")",
      fillTypeAnswer: "SoundService",
      fillTypeExplanation:
        "The correct service name is `SoundService`. It is the dedicated Roblox audio service, which makes it a natural home for project-wide sounds.",
      predictPrompt: "What does this code print?",
      predictCode: "local soundService = game:GetService(\"SoundService\")\nlocal music = Instance.new(\"Sound\")\nmusic.Parent = soundService\nprint(music.Parent.ClassName)",
      predictAnswer: "SoundService",
      predictExplanation:
        "The sound's parent is the SoundService object, so printing the parent's class name returns `SoundService`. This shows that the audio object is living in the shared audio service instead of in the world.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a win sound is created, given an asset ID, and parented into `SoundService`.",
    lines: [
      "local soundService = game:GetService(\"SoundService\")",
      "local winSound = Instance.new(\"Sound\")",
      "winSound.SoundId = \"rbxassetid://123456\"",
      "winSound.Parent = soundService",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The script gets the service first, creates the sound object, assigns which asset to play, and then places it where the game can manage it cleanly. That is a common setup flow for reusable game-wide audio.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to play a Roblox Sound from script?",
    versionA: "clickSound:Play()",
    versionB: "clickSound.Play()",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because Roblox instance methods are normally called with a colon, not just a dot. `clickSound:Play()` passes the object as `self`, while `clickSound.Play()` only references the function.",
    difficulty: 3,
  },
});

export const soundServiceContent: LessonContent[] = buildPracticeLessonContent({
  concept: "sound-service",
  cards: [
    {
      title: "Give the Game a Voice",
      body:
        "Sound is one of the fastest ways to make a Roblox game feel alive. A checkpoint ding, a button click, or a win stinger tells the player that something important just happened without forcing them to read text. In this lesson, you're learning how Roblox audio objects are organized and triggered. Once you control that well, even simple mechanics feel much more polished.",
      docUrl: "https://create.roblox.com/docs/sound",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Place and Trigger the Cue",
      body:
        "A sound system has two jobs: keep audio objects organized and play them at the right moment. That is why developers think about both the `Sound` object itself and where it lives, such as `SoundService` for shared game audio. The code stays simple, but the result changes how the whole game feels. Small sounds create surprisingly strong feedback loops.",
      docUrl: "https://create.roblox.com/docs/sound",
      code: "local soundService = game:GetService(\"SoundService\")\nlocal winSound = Instance.new(\"Sound\")\nwinSound.SoundId = \"rbxassetid://123456\"\nwinSound.Parent = soundService\nwinSound:Play()",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: soundServiceQuestionsSeed,
  miniProject: {
    title: "Your Turn: Add a Win Sound",
    description:
      "Create a simple sound cue for an important moment in your obby, such as reaching a checkpoint, pressing Start, or touching the finish line. Use a real `Sound` object, set its `SoundId`, keep it in a deliberate location like `SoundService` if it should be shared, and trigger it from script at the correct moment. Make sure the audio supports the action instead of blasting constantly. If the sound makes the game feel more responsive, the exercise worked.",
    hint:
      "Separate the setup from the trigger: first create and place the Sound, then call `:Play()` when the game event actually happens.",
    docUrl: "https://create.roblox.com/docs/sound",
  },
});

export const soundServiceQuestions: Question[] = soundServiceContent.filter(isQuestionContent);
