import type { LessonContent } from "@/lib/robloxCourse/types";
import type { Question } from "@/lib/data/questions/types";
import { buildPracticeLessonContent } from "@/lib/robloxCourse/contentBuilders";
import { buildFifteenQuestionConcept } from "@/lib/robloxCourse/fifteenQuestionBuilder";
import { isQuestionContent } from "@/lib/robloxCourse/types";

const hudButtonsQuestionsSeed = buildFifteenQuestionConcept({
  concept: "hud-buttons",
  definitions: [
    {
      prompt: "Which Roblox GUI object is meant to be clicked like a button on the player's screen?",
      options: ["Frame", "TextLabel", "ImageLabel", "TextButton"],
      correctIndex: 3,
      explanation:
        "`TextButton` is the GUI object designed for clickable text-based buttons. `TextLabel` only displays text, while `Frame` is a container and `ImageLabel` is a non-clickable image display object. When you want the player to press something in the UI, `TextButton` is usually the starting point.",
      difficulty: 2,
    },
    {
      prompt: "Where should a normal player HUD usually be placed so Roblox gives it to players automatically?",
      options: ["Workspace", "StarterGui", "ServerStorage", "Lighting"],
      correctIndex: 1,
      explanation:
        "`StarterGui` is the usual container for player GUI that should appear on-screen. Roblox uses it as the starting source for interface elements players receive. `Workspace`, `ServerStorage`, and `Lighting` serve completely different purposes and do not act as the normal HUD source.",
      difficulty: 2,
    },
    {
      prompt: "Why do many GUI interaction scripts use `LocalScript` instead of a normal server `Script`?",
      options: [
        "Because GUI interaction is usually handled on the client side",
        "Because LocalScripts are the only scripts that can use `print()`",
        "Because server scripts cannot access any Instances",
        "Because LocalScripts automatically save datastores",
      ],
      correctIndex: 0,
      explanation:
        "Player-facing GUI is usually a client-side system, so `LocalScript` is the common choice. LocalScripts can respond to button clicks and update the player's own screen directly. The other answers describe things that are false or unrelated to GUI behavior.",
      difficulty: 2,
    },
  ],
  truths: [
    {
      prompt: "A `TextLabel` shows text on screen, but it is not a clickable button by default.",
      correct: true,
      explanation:
        "A TextLabel is for displaying information like timers, score, or death count. If you want the player to click something, you usually use a `TextButton` instead. Confusing those two is a very common beginner UI mistake.",
      difficulty: 2,
    },
    {
      prompt: "A `ScreenGui` should usually be parented directly into `Workspace` so players can see it on their screen.",
      correct: false,
      explanation:
        "A ScreenGui normally belongs under `StarterGui` or a player's `PlayerGui`, not in the 3D world under `Workspace`. Workspace is for world objects like parts and models. Screen UI and world geometry live in different parts of the Roblox hierarchy.",
      difficulty: 2,
    },
  ],
  examples: [
    {
      mcOutputPrompt: "What does this code print?",
      code: "local label = Instance.new(\"TextLabel\")\nlabel.Text = \"Deaths: 0\"\nprint(label.Text)",
      mcOutputOptions: ["Deaths: 0", "TextLabel", "0", "nil"],
      mcOutputCorrectIndex: 0,
      mcOutputExplanation:
        "The script sets the TextLabel's `Text` property to `Deaths: 0` and then prints that property. The result is the exact string that was assigned. This is the same property you would change when building a visible death counter in your HUD.",
      fillTypePrompt: "Type the property name that controls the text shown on a TextLabel.",
      fillTypeCode: "local label = Instance.new(\"TextLabel\")\nlabel.___ = \"Deaths: 0\"",
      fillTypeAnswer: "Text",
      fillTypeExplanation:
        "The property is `Text`. That is the string the player actually sees on screen, whether the object is a TextLabel or a TextButton. Changing `Name` would rename the object in the hierarchy, not change what the player reads.",
      predictPrompt: "What does this code print?",
      predictAnswer: "Deaths: 0",
      predictExplanation:
        "The code prints `label.Text`, and the TextLabel's text was set to `Deaths: 0`. Since no other line changes that property, the output is the same string. This is exactly how a HUD label stores its displayed message.",
      difficulty: 2,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local button = Instance.new(\"TextButton\")\nbutton.Text = \"Play\"\nprint(button.ClassName)",
      mcOutputOptions: ["TextLabel", "Button", "TextButton", "Frame"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The script creates a `TextButton`, so `button.ClassName` prints `TextButton`. The `Text` property sets what the button says, but it does not change the object's class. This is a good reminder that a label on the button and the type of the button are different things.",
      fillTypePrompt: "Type the class name so the code creates a clickable text button.",
      fillTypeCode: "local startButton = Instance.new(\"___\")",
      fillTypeAnswer: "TextButton",
      fillTypeExplanation:
        "The correct class name is `TextButton`. This is the clickable GUI object beginners usually use for start menus, restart buttons, or shop buttons. `TextLabel` would display text but would not act like a button.",
      predictPrompt: "What does this code print?",
      predictAnswer: "TextButton",
      predictExplanation:
        "The code prints `button.ClassName`, and the object was created as a `TextButton`. The value of `button.Text` does not affect that class. So the output stays `TextButton`.",
      difficulty: 3,
    },
    {
      mcOutputPrompt: "What does this code print?",
      code: "local gui = Instance.new(\"ScreenGui\")\nlocal frame = Instance.new(\"Frame\")\nframe.Parent = gui\nprint(frame.Parent.ClassName)",
      mcOutputOptions: ["Frame", "StarterGui", "ScreenGui", "Workspace"],
      mcOutputCorrectIndex: 2,
      mcOutputExplanation:
        "The `Frame` is parented into the `ScreenGui`, so `frame.Parent.ClassName` is `ScreenGui`. This matches how Roblox GUI is nested: containers inside other UI containers, not inside world parts. It is a direct hierarchy check just like Explorer would show.",
      fillTypePrompt: "Type the property that makes the Frame a child of the ScreenGui.",
      fillTypeCode: "local gui = Instance.new(\"ScreenGui\")\nlocal frame = Instance.new(\"Frame\")\nframe.___ = gui",
      fillTypeAnswer: "Parent",
      fillTypeExplanation:
        "The property is `Parent`. In Roblox, GUI hierarchy uses the same parent-child system as parts, scripts, and other Instances. If you want a Frame to live inside a ScreenGui, you set its Parent to that ScreenGui.",
      predictPrompt: "What does this code print?",
      predictAnswer: "ScreenGui",
      predictExplanation:
        "The code prints the class name of `frame.Parent`. Since the frame was parented to `gui`, and `gui` is a ScreenGui, the result is `ScreenGui`. This is a good way to verify the hierarchy is built correctly.",
      difficulty: 3,
    },
  ],
  arrange: {
    prompt: "Arrange the code so a ScreenGui is created, a TextLabel is added to it, and the label text becomes `Deaths: 0`.",
    lines: [
      "local gui = Instance.new(\"ScreenGui\")",
      "local label = Instance.new(\"TextLabel\")",
      "label.Parent = gui",
      "label.Text = \"Deaths: 0\"",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "The ScreenGui has to exist before the TextLabel can be parented into it. After the label exists and is connected to the GUI container, setting its text gives it something visible to show. This is the same build order you would use for a real death counter or timer label.",
    difficulty: 3,
  },
  spotBug: {
    prompt: "Which version has the bug if the goal is to create a clickable start button in the HUD?",
    versionA: "local startButton = Instance.new(\"TextButton\")",
    versionB: "local startButton = Instance.new(\"Button\")",
    buggyVersion: "B",
    explanation:
      "Version B is wrong because `Button` is not the Roblox class name used here. The standard clickable text control is `TextButton`. Class strings in `Instance.new()` must match the real Roblox object names exactly.",
    difficulty: 3,
  },
});

export const hudButtonsContent: LessonContent[] = buildPracticeLessonContent({
  concept: "hud-buttons",
  cards: [
    {
      title: "Build the HUD",
      body:
        "A good obby UI tells the player exactly what matters right now: deaths, time, buttons, or clear next actions. In this lesson, you're moving from raw `ScreenGui` containers into the actual interface pieces players see and click. That means labels for information and buttons for actions. Once you can build those confidently, you can create start screens, counters, and win menus without guessing.",
      docUrl: "https://create.roblox.com/docs/ui",
      position: "start",
      lessonIndex: 0,
    },
    {
      title: "Make the UI Do Something",
      body:
        "A HUD becomes useful when it reacts to the player and the game state. TextLabels display information like a death counter, while TextButtons give the player something to press, such as a start button or restart control. The structure matters too: the right objects need to be parented under the right GUI containers. This lesson keeps that hierarchy and behavior grounded in real obby UI work.",
      docUrl: "https://create.roblox.com/docs/ui",
      code: "local gui = Instance.new(\"ScreenGui\")\nlocal button = Instance.new(\"TextButton\")\nbutton.Text = \"Play\"\nbutton.Parent = gui",
      position: "mid",
      lessonIndex: 2,
    },
  ],
  questions: hudButtonsQuestionsSeed,
  miniProject: {
    title: "Your Turn: Add a Start Screen",
    description:
      "Build a simple start screen for your obby using a ScreenGui, at least one Frame, one TextLabel, and one TextButton. The label should tell the player what the game is, and the button should clearly communicate the next action, such as starting or continuing. Organize the hierarchy so every UI object is parented deliberately rather than floating loose. When you are done, the screen should look like the beginning of a real playable game.",
    hint:
      "Start with the container order first: ScreenGui, then Frame, then labels and buttons inside the Frame. Good UI hierarchy makes scripting much easier later.",
    docUrl: "https://create.roblox.com/docs/ui",
  },
});

export const hudButtonsQuestions: Question[] = hudButtonsContent.filter(isQuestionContent);
