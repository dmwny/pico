export const robloxCourse = {
  id: "roblox-studio",
  language: "lua",
  title: "Roblox Studio",
  description: "Build games in Roblox Studio from the ground up.",
  units: [
    {
      id: "unit-1",
      title: "Welcome to Roblox Studio",
      description: "Open Studio, learn the viewport and core panels, and understand the editor before writing code. Recommended after normal Lua Unit 1.",
      nodes: [
        { id: "studio-layout", concept: "studio-layout", nodeType: "teaching", label: "LEARN" },
        { id: "explorer-panel", concept: "explorer-panel", nodeType: "teaching", label: "LEARN" },
        { id: "properties-panel", concept: "properties-panel", nodeType: "practice", label: "PRACTICE" },
        { id: "toolbox-panel", concept: "toolbox-panel", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-2",
      title: "Building Your First Obby",
      description: "Block out platforms, hazards, and terrain while learning the world-building habits that make an obby readable. Recommended after normal Lua Unit 1.",
      nodes: [
        { id: "part-manipulation", concept: "part-manipulation", nodeType: "teaching", label: "LEARN" },
        { id: "terrain-editor", concept: "terrain-editor", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-3",
      title: "Your First Scripts",
      description: "Move from Studio building into real Roblox Lua scripts tied to the obby world you already made. Recommended after normal Lua Unit 2.",
      nodes: [
        { id: "script-types", concept: "script-types", nodeType: "teaching", label: "LEARN" },
        { id: "getservice", concept: "getservice", nodeType: "teaching", label: "LEARN" },
        { id: "workspace-service", concept: "workspace-service", nodeType: "practice", label: "PRACTICE" },
        { id: "instance-new", concept: "instance-new", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-4",
      title: "Events and Interactivity",
      description: "Turn the obby into a real game with events, hazards, buttons, and checkpoints. Recommended after normal Lua Unit 3.",
      nodes: [
        { id: "events-connect", concept: "events-connect", nodeType: "teaching", label: "LEARN" },
        { id: "touched-event", concept: "touched-event", nodeType: "practice", label: "PRACTICE" },
        { id: "click-detector", concept: "click-detector", nodeType: "practice", label: "PRACTICE" },
        { id: "checkpoint-system", concept: "checkpoint-system", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-5",
      title: "The Player and Character",
      description: "Work with players, characters, humanoids, and stats so the obby reacts to real people instead of static parts. Recommended after normal Lua Unit 4.",
      nodes: [
        { id: "players-service", concept: "players-service", nodeType: "teaching", label: "LEARN" },
        { id: "character-humanoid", concept: "character-humanoid", nodeType: "practice", label: "PRACTICE" },
        { id: "leaderstats", concept: "leaderstats", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-6",
      title: "GUIs and the Screen",
      description: "Build menus, labels, and buttons on the client so the player always knows what is happening. Recommended after normal Lua Unit 4.",
      nodes: [
        { id: "screen-gui", concept: "screen-gui", nodeType: "teaching", label: "LEARN" },
        { id: "hud-buttons", concept: "hud-buttons", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-7",
      title: "Remote Events and Client-Server",
      description: "Learn the server-client boundary and move gameplay data across it safely. Recommended after normal Lua Unit 5.",
      nodes: [
        { id: "remote-event", concept: "remote-event", nodeType: "teaching", label: "LEARN" },
        { id: "remote-function", concept: "remote-function", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-8",
      title: "Data and Persistence",
      description: "Save meaningful player progress and build a real load-save flow that can survive failures. Recommended after normal Lua Unit 5.",
      nodes: [
        { id: "data-store-service", concept: "data-store-service", nodeType: "teaching", label: "LEARN" },
        { id: "save-flow", concept: "save-flow", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-9",
      title: "Polish and Game Feel",
      description: "Add animation, audio, particles, and atmosphere so the obby feels finished instead of merely functional. Recommended after normal Lua Unit 6.",
      nodes: [
        { id: "tween-service", concept: "tween-service", nodeType: "teaching", label: "LEARN" },
        { id: "sound-service", concept: "sound-service", nodeType: "practice", label: "PRACTICE" },
        { id: "visual-effects", concept: "visual-effects", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-10",
      title: "Publishing and Going Live",
      description: "Test like a developer, publish like a developer, and secure the game before real players touch it. Recommended after normal Lua Unit 6.",
      nodes: [
        { id: "playtest-publishing", concept: "playtest-publishing", nodeType: "teaching", label: "LEARN" },
        { id: "live-security", concept: "live-security", nodeType: "practice", label: "PRACTICE" },
      ],
    },
    {
      id: "unit-11",
      title: "Going Further",
      description: "Go beyond the core obby build with reusable modules, raycasts, and advanced Roblox systems. Recommended after finishing the main Lua path.",
      nodes: [
        { id: "module-scripts", concept: "module-scripts", nodeType: "teaching", label: "LEARN" },
        { id: "raycasting", concept: "raycasting", nodeType: "practice", label: "PRACTICE" },
        { id: "advanced-systems", concept: "advanced-systems", nodeType: "practice", label: "PRACTICE" },
      ],
    },
  ],
} as const;
