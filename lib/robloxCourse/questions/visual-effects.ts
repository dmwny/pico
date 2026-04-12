import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const visualEffectsQuestionsSeed = buildFifteenQuestionConcept({
  concept: "visual-effects",
  definitions: [
    {
      prompt: "Which Roblox object emits particles such as sparks, smoke, or celebratory bursts?",
      options: ["ParticleEmitter", "Atmosphere", "TextButton", "RemoteEvent"],
      correctIndex: 0,
      explanation:
        "`ParticleEmitter` is the object Roblox uses for visual particle effects. It is a strong fit for things like win bursts, dust trails, or hazard feedback. The other options belong to atmosphere, UI, or networking.",
      difficulty: 2,
    },
    {
      prompt: "Which service controls global world lighting settings like time of day and brightness?",
      options: ["Lighting", "Players", "ReplicatedStorage", "TweenService"],
      correctIndex: 0,
      explanation:
        "`Lighting` is the Roblox service that manages world mood settings such as time of day, ambient light, and other scene-wide lighting behavior. It affects the whole game rather than one local object.",
      difficulty: 2,
    },
    {
      prompt: "Which object is used to add depth, haze, and sky atmosphere to the world?",
      options: ["ParticleEmitter", "Frame", "Humanoid", "Atmosphere"],
      correctIndex: 3,
      explanation:
        "`Atmosphere` is the environment object used to create air and haze effects across the world. It works with the `Lighting` service to shape the overall visual mood of the game.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A `ParticleEmitter` is commonly parented to a Part or Attachment so the effect appears in the right world location.",
      correct: true,
      explanation:
        "Particles need a place in the hierarchy to emit from, which is why developers usually parent them to a Part or Attachment. That lets sparks, smoke, or confetti appear exactly where the effect should happen.",
      difficulty: 2,
    },
    {
      prompt: "`Atmosphere` belongs in `StarterGui` because it is a screen effect, not a world effect.",
      correct: false,
      explanation:
        "`Atmosphere` is part of the game world, not a screen UI object. It normally lives under `Lighting`, where it affects how the environment looks for players.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local part = Instance.new(\"Part\")\nlocal particles = Instance.new(\"ParticleEmitter\")\nparticles.Parent = part\nprint(particles.ClassName)",
      mcOutputOptions: ["Emitter", "Part", "ParticleEmitter", "Attachment"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The code creates a `ParticleEmitter`, so printing its class name returns `ParticleEmitter`. Parenting it into the part is what gives the effect a world location to emit from.",
      fillTypePrompt: "Type the class name so this code creates a particle effect object.",
      fillTypeCode: "local particles = Instance.new(\"___\")",
      fillTypeAnswer: "ParticleEmitter",
      fillTypeExplanation:
        "The correct class name is `ParticleEmitter`. That is the Roblox object used for sparks, smoke, dust, and other particle-based visual effects.",
      predictPrompt: "What does this code print?",
      predictCode: "local part = Instance.new(\"Part\")\nlocal particles = Instance.new(\"ParticleEmitter\")\nparticles.Parent = part\nprint(#part:GetChildren())",
      predictAnswer: "1",
      predictExplanation:
        "The part has exactly one child after the ParticleEmitter is parented into it, so `#part:GetChildren()` returns `1`. This confirms the emitter is attached to the part where the effect should appear.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local lighting = game:GetService(\"Lighting\")\nlighting.ClockTime = 18\nprint(lighting.ClockTime)",
      mcOutputOptions: ["6", "18", "Lighting", "true"],
      mcOutputCorrectIndex: 1,
      mcOutputExplanation:
        "The code sets `ClockTime` to `18`, then prints that property. That makes the output `18`. Adjusting `ClockTime` is one of the simplest ways to change the mood of the whole game world.",
      fillTypePrompt: "Type the Lighting property used here to change the world's time of day.",
      fillTypeCode: "local lighting = game:GetService(\"Lighting\")\nlighting.___ = 18",
      fillTypeAnswer: "ClockTime",
      fillTypeExplanation:
        "`ClockTime` controls the world's time of day in the Lighting service. Changing it can make the game feel like morning, evening, or night.",
      predictPrompt: "What does this code print?",
      predictCode: "local lighting = game:GetService(\"Lighting\")\nlighting.ClockTime = 18\nprint(lighting.ClockTime > 12)",
      predictAnswer: "true",
      predictExplanation:
        "Since `ClockTime` is set to `18`, comparing it to `12` gives `true`. This is a simple way to reason about how the time setting changed the scene.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local atmosphere = Instance.new(\"Atmosphere\")\natmosphere.Density = 0.4\nprint(atmosphere.Density)",
      mcOutputOptions: ["0.4", "4", "Atmosphere", "0"],
      mcOutputCorrectIndex: 0,
      mcOutputExplanation:
        "The script sets `Density` to `0.4` and then prints it, so the output is `0.4`. Atmosphere density is one of the controls that changes how thick or hazy the world's air appears.",
      fillTypePrompt: "Type the class name so this code creates an atmosphere object for the world.",
      fillTypeCode: "local atmosphere = Instance.new(\"___\")",
      fillTypeAnswer: "Atmosphere",
      fillTypeExplanation:
        "The correct class name is `Atmosphere`. It is the environment object used with Lighting to shape haze, depth, and mood across the world.",
      predictPrompt: "What does this code print?",
      predictCode: "local atmosphere = Instance.new(\"Atmosphere\")\natmosphere.Density = 0.4\nprint(atmosphere.ClassName)",
      predictAnswer: "Atmosphere",
      predictExplanation:
        "The object was created as an Atmosphere, so its class name prints as `Atmosphere`. This reinforces that the effect is a world environment object, not a UI or particle object.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a finish platform gets a particle effect attached to it.",
    lines: [
      "local finishPart = Instance.new(\"Part\")",
      "local particles = Instance.new(\"ParticleEmitter\")",
      "particles.Rate = 25",
      "particles.Parent = finishPart",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The part needs to exist before the emitter can be attached to it. After the emitter exists, setting `Rate` and then parenting it into the finish part creates a basic world effect anchored to that object.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to change the world's time of day?",
    versionA: "game:GetService(\"Lighting\").ClockTime = 18",
    versionB: "game:GetService(\"LightService\").ClockTime = 18",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because the Roblox service is named `Lighting`, not `LightService`. Exact service names matter in Roblox APIs, especially when you are changing environment settings.",
    difficulty: 3,
  },
});

export const visualEffectsContent: LessonContent[] = buildPracticeLessonContent({
  concept: "visual-effects",
  cards: [
    {
      title: "Make the Win Feel Big",
      body:
        "Visual polish turns a working game into one that feels memorable. In Roblox, that usually means using particles for impact moments and using the environment itself to reinforce the mood of the world. This lesson teaches both local effects and global atmosphere so your obby can look exciting, not just functional. Good visual effects make the important moments obvious.",
      docUrl: "https://create.roblox.com/docs/effects/particle-emitters",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Shape the Mood",
      body:
        "Particles handle the moment-to-moment feedback, while Lighting and Atmosphere shape how the whole game feels. A finish burst, a sunset sky, or a hazy victory room can all make the same mechanic feel more dramatic. The tools are simple, but the effect on player perception is huge. This is where your obby starts feeling authored instead of assembled.",
      docUrl: "https://create.roblox.com/docs/environment/lighting",
      code: "local lighting = game:GetService(\"Lighting\")\nlighting.ClockTime = 18\nlocal finishPart = script.Parent\nlocal particles = Instance.new(\"ParticleEmitter\")\nparticles.Parent = finishPart",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: visualEffectsQuestionsSeed,
  miniProject: {
    title: "Your Turn: Make the Finish Pop",
    description:
      "Choose one big moment in your obby, like the finish line or a reward platform, and add visual feedback that makes it feel special. Use a `ParticleEmitter` for a local effect and change at least one world mood setting through `Lighting` or `Atmosphere` so the whole scene supports the moment. Keep the effect readable rather than noisy. If the player can instantly feel that they reached something important, you succeeded.",
    hint:
      "Think in layers: particles for the local celebration, Lighting or Atmosphere for the larger mood around it.",
    docUrl: "https://create.roblox.com/docs/environment/lighting",
  },
});

export const visualEffectsQuestions: Question[] = visualEffectsContent.filter(isQuestionContent);
