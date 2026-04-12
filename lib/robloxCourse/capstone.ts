import type { CapstoneCard } from "@/lib/robloxCourse/types";

export const robloxCapstone: CapstoneCard[] = [
  {
    id: "roblox-capstone-concept-1",
    type: "capstone_project",
    phase: "concept",
    title: "Choose Your Core Loop",
    description:
      "Pick a game type you genuinely want to make: obby, arena, survival challenge, racer, or something else. Write one sentence that explains what the player does again and again, because that loop is the heart of the whole project. Decide what counts as winning, what counts as failing, and what keeps the player pressing Play again. Before you build anything, sketch the first version small enough that you could finish it. The goal here is clarity, not ambition.",
    tools: ["Explorer", "Properties", "Workspace", "Notes or design doc", "Reference images"],
    docUrl: "https://create.roblox.com/docs/studio/explorer",
  },
  {
    id: "roblox-capstone-build-1",
    type: "capstone_project",
    phase: "build",
    title: "Build the World",
    description:
      "Open Studio and block out the full map using Parts, Models, and terrain where it helps the idea. Focus on scale, flow, and readability before details, because a clean map beats a cluttered one every time. Organize the hierarchy as you go so major areas, hazards, and checkpoints are easy to find later in scripts. Use playtesting early to see whether the space feels fun to move through. By the end of this phase, the world should already communicate what kind of game it is.",
    tools: ["Part", "Move", "Scale", "Rotate", "Model", "Terrain Editor", "Explorer", "Properties"],
    docUrl: "https://create.roblox.com/docs/parts",
  },
  {
    id: "roblox-capstone-script-1",
    type: "capstone_project",
    phase: "script",
    title: "Code the Main Mechanic",
    description:
      "Implement the one mechanic your game absolutely depends on. For an obby, that might be hazards, checkpoints, and a finish system. For a combat game, it might be hit detection and health. For a racer, it might be laps and boost pads. Build only the minimum version first, test it, and make sure the mechanic is understandable before adding polish or edge cases.",
    tools: ["Script", "LocalScript", "workspace", "Instance.new()", "Touched", "ClickDetector", "RunService", "Question output and debugging"],
    docUrl: "https://create.roblox.com/docs/scripting",
  },
  {
    id: "roblox-capstone-players-1",
    type: "capstone_project",
    phase: "players",
    title: "Make It About Players",
    description:
      "Add player-facing systems so the game reacts to the person playing it instead of acting like a static demo. That usually means at least one stat, one win or loss condition, and one player-specific behavior such as health, score, speed boosts, checkpoints, or respawn handling. Use the `Players` service, character objects, and humanoid-related APIs where appropriate. Make sure the game still works when multiple players join, not just when you test alone. This is where your project starts feeling like a real Roblox experience.",
    tools: ["Players", "CharacterAdded", "Humanoid", "HumanoidRootPart", "leaderstats", "SpawnLocation"],
    docUrl: "https://create.roblox.com/docs/players",
  },
  {
    id: "roblox-capstone-polish-1",
    type: "capstone_project",
    phase: "polish",
    title: "Add Game Feel",
    description:
      "Choose a few polish systems that make the game feel satisfying without drowning the player in noise. Tween an important door or reward platform. Add a sound for success, failure, or collection. Use particles for impact moments and tune Lighting so the atmosphere matches the game's mood. Keep asking whether each effect makes the mechanic clearer or more exciting. Good polish supports gameplay instead of competing with it.",
    tools: ["TweenService", "Sound", "SoundService", "ParticleEmitter", "Lighting", "Atmosphere"],
    docUrl: "https://create.roblox.com/docs/environment/lighting",
  },
  {
    id: "roblox-capstone-ui-1",
    type: "capstone_project",
    phase: "ui",
    title: "Build the Interface",
    description:
      "Create the UI the player needs to understand and control the experience. That usually means a start screen, a HUD that shows useful information during play, and an end screen or win state. Use `ScreenGui`, `Frame`, `TextLabel`, and `TextButton` deliberately so the interface is readable on first glance. If a button triggers gameplay, connect it through the correct client or server path instead of faking the result locally. By the end of this phase, the player should always know what is happening and what to do next.",
    tools: ["ScreenGui", "Frame", "TextLabel", "TextButton", "StarterGui", "LocalScript", "RemoteEvent"],
    docUrl: "https://create.roblox.com/docs/ui",
  },
  {
    id: "roblox-capstone-data-1",
    type: "capstone_project",
    phase: "data",
    title: "Save What Matters",
    description:
      "Choose the smallest set of progress values that deserve to persist across sessions, then save them properly. Good candidates are best time, total deaths, coins, unlocked stages, or completed quests. Use `DataStoreService` carefully with `pcall`, and test what happens when loading fails or returns nothing yet. Avoid saving everything just because you can; save the things that improve player investment. When you are done, quitting and rejoining should still feel like the same game, not a reset.",
    tools: ["DataStoreService", "GetDataStore", "GetAsync", "SetAsync", "pcall"],
    docUrl: "https://create.roblox.com/docs/cloud/datastores",
  },
  {
    id: "roblox-capstone-publish-1",
    type: "capstone_project",
    phase: "publish",
    title: "Ship It Live",
    description:
      "Do a final round of Studio playtesting, then prepare the game page players will actually see. Write a clear title and description, set the correct permissions, and choose an image or thumbnail direction that honestly represents the experience. Before publishing an update, sanity-check any RemoteEvent or datastore code so live players cannot break the game with bad inputs or edge cases. Publish once the game is stable enough to be played, not once you think it is perfect. A real shipped version that you can keep improving beats an unfinished dream project every time.",
    tools: ["Play test", "Experience Settings", "Permissions", "Description", "Thumbnails", "RemoteEvent validation"],
    docUrl: "https://create.roblox.com/docs/studio/experience-settings",
  },
];
