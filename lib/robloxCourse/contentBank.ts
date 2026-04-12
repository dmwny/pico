import { buildPracticeLessonContent, buildTeachingLessonContent, selectRobloxLessonQuestions } from "@/lib/robloxCourse/contentBuilders";
import type { LessonContent } from "@/lib/robloxCourse/types";
import {
  clickDetectorQuestions,
  dataStoreServiceQuestions,
  eventsConnectQuestions,
  explorerPanelQuestions,
  getServiceQuestions,
  instanceNewQuestions,
  partManipulationQuestions,
  playtestPublishingQuestions,
  playersServiceQuestions,
  remoteEventQuestions,
  screenGuiQuestions,
  scriptTypesQuestions,
  studioLayoutQuestions,
  terrainEditorQuestions,
  toolboxPanelQuestions,
  touchedEventQuestions,
  tweenServiceQuestions,
  workspaceServiceQuestions,
} from "@/lib/robloxCourse/questions";
import { advancedSystemsContent } from "@/lib/robloxCourse/questions/advanced-systems";
import { characterHumanoidContent } from "@/lib/robloxCourse/questions/character-humanoid";
import { checkpointSystemContent } from "@/lib/robloxCourse/questions/checkpoint-system";
import { hudButtonsContent } from "@/lib/robloxCourse/questions/hud-buttons";
import { leaderstatsContent } from "@/lib/robloxCourse/questions/leaderstats";
import { liveSecurityContent } from "@/lib/robloxCourse/questions/live-security";
import { moduleScriptsContent } from "@/lib/robloxCourse/questions/module-scripts";
import { propertiesPanelContent } from "@/lib/robloxCourse/questions/properties-panel";
import { raycastingContent } from "@/lib/robloxCourse/questions/raycasting";
import { remoteFunctionContent } from "@/lib/robloxCourse/questions/remote-function";
import { saveFlowContent } from "@/lib/robloxCourse/questions/save-flow";
import { soundServiceContent } from "@/lib/robloxCourse/questions/sound-service";
import { visualEffectsContent } from "@/lib/robloxCourse/questions/visual-effects";

export const robloxContentBank: Partial<Record<string, LessonContent[]>> = {
  "studio-layout": buildTeachingLessonContent({
    concept: "studio-layout",
    cards: [
      {
        title: "Meet Your Workspace",
        body:
          "Roblox Studio is the place where you build, test, and publish your game. The big center area is the 3D viewport, while the ribbon across the top holds tabs like Home, Model, Test, and View. In this lesson, you're learning how to move around the editor without confusing Studio panels with runtime Roblox services. That foundation matters because later lessons will jump back and forth between the editor and code constantly.",
        docUrl: "https://create.roblox.com/docs/studio/explorer",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "UI Versus Game Data",
        body:
          "A big early Roblox habit is separating the Studio interface from the game's actual DataModel. Explorer, Properties, and Output are editor tools, but `Workspace`, `Players`, and `TweenService` are runtime objects your scripts can access. If you mix those up, your code starts reaching for things that do not exist. This section makes that split explicit before you write your first obby scripts.",
        docUrl: "https://create.roblox.com/docs/scripting",
        code: "local world = game:GetService(\"Workspace\")\nprint(world == workspace)",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: studioLayoutQuestions,
  }),
  "explorer-panel": buildTeachingLessonContent({
    concept: "explorer-panel",
    cards: [
      {
        title: "Read the Hierarchy",
        body:
          "Explorer is the tree view of your whole place. It shows which objects live inside which containers, which is how Roblox keeps track of parts, folders, scripts, GUIs, and services. When you see a Part nested under `Workspace`, that same relationship is what code reads through the `Parent` property. Learning to read Explorer is the first step to understanding how Roblox code finds things.",
        docUrl: "https://create.roblox.com/docs/studio/explorer",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "Explorer Into Code",
        body:
          "The hierarchy you see in Explorer is not just visual organization. Methods like `FindFirstChild()`, `GetChildren()`, and `GetDescendants()` are just code versions of reading that tree. Once you understand that connection, scripts stop feeling magical and start feeling predictable. This is exactly how you will find your obby parts in later units.",
        docUrl: "https://create.roblox.com/docs/scripting",
        code: "local floor = workspace:FindFirstChild(\"Floor\")\nprint(floor ~= nil)",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: explorerPanelQuestions,
  }),
  "properties-panel": propertiesPanelContent,
  "toolbox-panel": buildPracticeLessonContent({
    concept: "toolbox-panel",
    cards: [
      {
        title: "Grab Assets Carefully",
        body:
          "Today you're dressing your obby lobby with a few starter assets from Toolbox. Toolbox can save time, but it also adds real Instances to your place, so you need to inspect what you insert instead of dropping in random models blindly. In a real project, good developers use Toolbox as a starting point and then clean up, rename, and verify what was added. This lesson keeps the focus on using the panel safely and intentionally.",
        docUrl: "https://create.roblox.com/docs/studio/toolbox",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "Inspect Before Keeping",
        body:
          "Every model you insert should be checked in Explorer and Properties before it stays in your game. That includes looking at its children, scripts, and names so you understand what was added to the hierarchy. Treat Toolbox like importing code from the internet: useful, but only after you inspect it. That habit becomes part of shipping reliable Roblox games later.",
        docUrl: "https://create.roblox.com/docs/studio/toolbox",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: selectRobloxLessonQuestions(toolboxPanelQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Dress the Lobby",
      description:
        "Add one decorative asset from Toolbox to your obby lobby, then inspect it in Explorer before keeping it. Rename the top-level model so it matches your game theme, and delete any child objects you do not understand or do not need. Your goal is to keep the lobby readable and organized, not cluttered. When you are done, the asset should feel intentional instead of random.",
      hint:
        "After inserting a model, expand it in Explorer first. If you see extra scripts or oddly named children, inspect them before deciding to keep the asset.",
      docUrl: "https://create.roblox.com/docs/studio/toolbox",
    },
  }),
  "part-manipulation": buildTeachingLessonContent({
    concept: "part-manipulation",
    cards: [
      {
        title: "Block Out the Obby",
        body:
          "This is where your game starts feeling real. Roblox obbies are built from simple Parts that you move, scale, duplicate, and rotate into platforms, walls, and hazards. Strong developers build the layout first and worry about scripting later, because gameplay begins with readable level geometry. In this lesson, you are learning the physical editing tools that shape the whole course.",
        docUrl: "https://create.roblox.com/docs/parts",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(partManipulationQuestions, "teaching"),
  }),
  "playtest-publishing": buildTeachingLessonContent({
    concept: "playtest-publishing",
    cards: [
      {
        title: "Test Before You Ship",
        body:
          "A Roblox game is never really built until you press Play and see what players will actually experience. Playtesting catches missing anchors, bad spawn locations, broken jumps, and obvious scripting mistakes before anyone else does. Publishing is the separate step where your place becomes available on Roblox. This lesson makes sure you understand that testing and publishing solve different problems.",
        docUrl: "https://create.roblox.com/docs/studio/experience-settings",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(playtestPublishingQuestions, "teaching"),
  }),
  "terrain-editor": buildPracticeLessonContent({
    concept: "terrain-editor",
    cards: [
      {
        title: "Shape the Background",
        body:
          "Your obby platforms are the main path, but the world around them still matters. In this lesson, you're using Terrain Editor to sculpt the mountains, cliffs, or ground around your course so the level feels like a real place instead of floating parts in empty space. Terrain is not required for every game, but it is a powerful way to make beginner projects feel much more complete. The key is using it to support the obby, not distract from it.",
        docUrl: "https://create.roblox.com/docs/parts",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "Terrain Supports Gameplay",
        body:
          "Good terrain guides the eye and frames the path players should follow. Smooth cliffs, painted materials, and simple water areas can make your obby look deliberate without changing the actual jumps. As you build bigger games later, this same skill becomes part of level art and player direction. Right now, the goal is simple: make the obby world feel intentional.",
        docUrl: "https://create.roblox.com/docs/parts",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: selectRobloxLessonQuestions(terrainEditorQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Add a Backdrop",
      description:
        "Use Terrain Editor to add a simple backdrop around one section of your obby. Create at least one raised landform, paint it with a material that fits your theme, and make sure it does not block the player's path. The goal is to make the level look more finished while keeping the jump route clear. If your terrain improves the scene without hurting gameplay, you succeeded.",
      hint:
        "Start with broad shapes first, then smooth them. Tiny edits are much easier once the large terrain silhouette already feels right.",
      docUrl: "https://create.roblox.com/docs/parts",
    },
  }),
  "workspace-service": buildPracticeLessonContent({
    concept: "workspace-service",
    cards: [
      {
        title: "Script the Real World",
        body:
          "Now you're finally connecting Studio builds to code. `Workspace` is the live world container for the parts and models players actually see, so this is where your obby platforms and hazards usually live. When you reference `workspace` in code, you are reaching into the world you built in Studio. This lesson keeps everything grounded in the actual obby map you already made.",
        docUrl: "https://create.roblox.com/docs/scripting",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "World Objects Need Parents",
        body:
          "Creating an object in code is not enough by itself. If you want the player to see that object in the game world, it needs to be parented into `Workspace` or into something already inside it. That is why so much Roblox code eventually comes back to `Parent`. This step turns abstract objects into visible parts of your level.",
        docUrl: "https://create.roblox.com/docs/scripting",
        code: "local marker = Instance.new(\"Part\")\nmarker.Parent = workspace",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: selectRobloxLessonQuestions(workspaceServiceQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Add a Finish Marker",
      description:
        "Create a new Part in code and parent it into `Workspace` as a finish marker for your obby. Give it a clear name in Explorer and make it visually different from normal platforms so players can recognize it. If you want, place it above the last jump to hint that it marks the end. The result should be a visible, intentional object that clearly belongs in your world.",
      hint:
        "If the marker does not appear, check whether you forgot to set its `Parent` to `workspace` or position it somewhere visible.",
      docUrl: "https://create.roblox.com/docs/scripting",
    },
  }),
  "instance-new": buildPracticeLessonContent({
    concept: "instance-new",
    cards: [
      {
        title: "Spawn Objects by Code",
        body:
          "Studio is great for placing static geometry, but Roblox gets much more powerful when code can create objects on demand. `Instance.new()` is the basic tool for that. In this lesson, you are using it the way a real obby developer would: to add markers, helper parts, and other objects that support your level. That makes the map feel dynamic instead of frozen.",
        docUrl: "https://create.roblox.com/docs/scripting",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "Create, Name, Parent",
        body:
          "Most beginner Roblox object creation follows the same pattern: create the object, give it useful properties, and then parent it where it belongs. If you skip one of those steps, the result is usually confusing: unnamed objects, invisible objects, or objects that exist but do nothing. This lesson drills that sequence until it feels natural.",
        docUrl: "https://create.roblox.com/docs/scripting",
        code: "local checkpoint = Instance.new(\"Part\")\ncheckpoint.Name = \"CheckpointMarker\"\ncheckpoint.Parent = workspace",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: selectRobloxLessonQuestions(instanceNewQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Add a Checkpoint Marker",
      description:
        "Use `Instance.new()` to create a checkpoint marker part in code for one jump in your obby. Name it clearly, size it so players can land on it, and parent it into the world. Make sure it is anchored so it stays where you expect during play. This is the first small step toward a fully scripted checkpoint system.",
      hint:
        "Write the class name as a string inside `Instance.new()`, then set properties like `Name`, `Size`, `Anchored`, and `Parent` in that order.",
      docUrl: "https://create.roblox.com/docs/scripting",
    },
  }),
  "script-types": buildTeachingLessonContent({
    concept: "script-types",
    cards: [
      {
        title: "Pick the Right Script",
        body:
          "Roblox does not have just one kind of script. `Script` runs on the server, `LocalScript` runs on the client, and `ModuleScript` stores reusable code. If you put code in the wrong place, it may not run where you expect or may not have access to the objects you need. This lesson introduces those three roles using the obby project you already built.",
        docUrl: "https://create.roblox.com/docs/scripting",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(scriptTypesQuestions, "teaching"),
  }),
  getservice: buildTeachingLessonContent({
    concept: "getservice",
    cards: [
      {
        title: "Fetch the Right Service",
        body:
          "A lot of Roblox scripting starts with getting the right service. `game:GetService()` is the standard way to fetch shared systems like `Players`, `ReplicatedStorage`, and `TweenService` by name. That makes your code more explicit and less fragile than guessing where things live. In a real project, this becomes one of the first lines in many scripts.",
        docUrl: "https://create.roblox.com/docs/scripting",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(getServiceQuestions, "teaching"),
  }),
  "players-service": buildPracticeLessonContent({
    concept: "players-service",
    cards: [
      {
        title: "Work With Players",
        body:
          "An obby is not just platforms and hazards. It is also a player experience, which means your scripts need to know when players join and who is currently in the game. The `Players` service is where that information starts. In this lesson, you are using it in the same way you would when tracking obby progress, points, or deaths.",
        docUrl: "https://create.roblox.com/docs/players",
        position: "start",
        lessonIndex: 0,
      },
      {
        title: "From Service to Player",
        body:
          "Once you have the `Players` service, you can list players, react to joins, and connect later systems like leaderboards or checkpoints. This is the bridge between world logic and player-specific logic. It is also the point where Roblox games stop feeling like static maps and start feeling like multiplayer systems.",
        docUrl: "https://create.roblox.com/docs/players",
        code: "local players = game:GetService(\"Players\")\nprint(#players:GetPlayers() >= 0)",
        position: "mid",
        lessonIndex: 2,
      },
    ],
    questions: selectRobloxLessonQuestions(playersServiceQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Welcome the Player",
      description:
        "Write a small server script that gets the `Players` service and reacts when a player joins your obby. For now, it can simply print a message or the player's name to Output, but the structure should be ready for future systems like points or deaths. The goal is to prove that your game can respond to real player objects, not just parts in the world. Keep the script simple and readable.",
      hint:
        "Start by getting `Players` with `game:GetService(\"Players\")`, then connect to `PlayerAdded` with `:Connect(function(player) ... end)`.",
      docUrl: "https://create.roblox.com/docs/players",
    },
  }),
  "events-connect": buildPracticeLessonContent({
    concept: "events-connect",
    cards: [
      {
        title: "React to the Game",
        body:
          "Roblox games come alive through events. A button click, a part touch, or a player join all become useful only when your script connects a callback to the event signal. In this lesson, you are practicing the pattern behind almost every interactive system in Roblox: event, connection, response. Once this pattern clicks, later lessons on kill bricks, GUI buttons, and remotes make far more sense.",
        docUrl: "https://create.roblox.com/docs/scripting/events",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(eventsConnectQuestions, "practice"),
    miniProject: {
      title: "Your Turn: Wire a Test Event",
      description:
        "Create a simple event-driven script in Studio that reacts to something happening and prints a message to Output. If you want a safe sandbox, use a `BindableEvent` and fire it manually in code so you can focus on the `:Connect()` pattern itself. The goal is not the printed message; the goal is understanding the flow from signal to callback. That pattern will power your whole game.",
      hint:
        "Think in three steps: create or get the signal, connect a function to it, then trigger the signal so you can watch the callback run.",
      docUrl: "https://create.roblox.com/docs/scripting/events",
    },
  }),
  "character-humanoid": characterHumanoidContent,
  leaderstats: leaderstatsContent,
  "touched-event": buildTeachingLessonContent({
    concept: "touched-event",
    cards: [
      {
        title: "Build a Kill Brick",
        body:
          "This is one of the first classic Roblox mechanics every obby developer learns. A kill brick uses the `Touched` event so the game can react when a player's character hits a dangerous part. It turns static geometry into gameplay. In this lesson, you are learning the event that makes hazards possible.",
        docUrl: "https://create.roblox.com/docs/scripting/events",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(touchedEventQuestions, "teaching"),
  }),
  "click-detector": buildTeachingLessonContent({
    concept: "click-detector",
    cards: [
      {
        title: "Click to Open",
        body:
          "Not every interaction should come from touching a part. Sometimes you want the player to choose when to trigger something, like opening a door or pressing a lobby button. `ClickDetector` is the simple Roblox tool for that kind of world interaction. In this lesson, you are using it the way a real obby might use a start button or unlock switch.",
        docUrl: "https://create.roblox.com/docs/scripting/events",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(clickDetectorQuestions, "teaching"),
  }),
  "checkpoint-system": checkpointSystemContent,
  "remote-event": buildTeachingLessonContent({
    concept: "remote-event",
    cards: [
      {
        title: "Cross the Boundary",
        body:
          "Roblox games run on both the server and the client, and they are not the same place. `RemoteEvent` is one of the main tools for sending information across that boundary. You need this whenever a GUI button, checkpoint effect, or local action needs to tell the server something, or the server needs to tell the client something. This lesson introduces that flow before you build larger secure systems.",
        docUrl: "https://create.roblox.com/docs/scripting/remote-events-and-functions",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(remoteEventQuestions, "teaching"),
  }),
  "remote-function": remoteFunctionContent,
  "screen-gui": buildTeachingLessonContent({
    concept: "screen-gui",
    cards: [
      {
        title: "Put UI on Screen",
        body:
          "Now your obby gets a real interface. `ScreenGui` is the container for HUDs, labels, counters, and menus that appear on the player's screen. The important Roblox habit here is putting GUI objects in the right place so players actually receive them. This lesson starts that process before you build timers, death counters, and buttons.",
        docUrl: "https://create.roblox.com/docs/ui",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(screenGuiQuestions, "teaching"),
  }),
  "hud-buttons": hudButtonsContent,
  "tween-service": buildTeachingLessonContent({
    concept: "tween-service",
    cards: [
      {
        title: "Make It Feel Good",
        body:
          "A game that works is not automatically a game that feels good. `TweenService` helps you animate parts and UI smoothly so doors slide open, counters fade in, and win moments feel rewarding instead of abrupt. In this lesson, you are learning the tool that brings polish to your obby. Small motion details make beginner games feel dramatically more professional.",
        docUrl: "https://create.roblox.com/docs/animation",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(tweenServiceQuestions, "teaching"),
  }),
  "data-store-service": buildTeachingLessonContent({
    concept: "data-store-service",
    cards: [
      {
        title: "Save Real Progress",
        body:
          "Persistence is what makes a Roblox game feel like a real experience instead of a toy. `DataStoreService` lets you save useful values like best time, deaths, or points across play sessions. It also introduces a new responsibility: handling failures safely so a temporary save error does not break the game. This lesson starts that habit early.",
        docUrl: "https://create.roblox.com/docs/cloud/datastores",
        position: "start",
        lessonIndex: 0,
      },
    ],
    questions: selectRobloxLessonQuestions(dataStoreServiceQuestions, "teaching"),
  }),
  "save-flow": saveFlowContent,
  "sound-service": soundServiceContent,
  "visual-effects": visualEffectsContent,
  "live-security": liveSecurityContent,
  "module-scripts": moduleScriptsContent,
  raycasting: raycastingContent,
  "advanced-systems": advancedSystemsContent,
};
