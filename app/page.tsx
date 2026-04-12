"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_HEIGHT = 64;
const WORLD_WIDTH = 4300;
const WORLD_HEIGHT = 3200;
const BASE_ZOOM = 0.84;
const SCROLL_INPUT_GAIN = 1.1;
const SCROLL_SMOOTH_TIME = 0.18;
const MAX_SCROLL_SPEED = 2.4;

const COLORS = {
  cream: "#f5f0e8",
  creamCard: "#fdfcf9",
  white: "#ffffff",
  navy: "#1a2332",
  orange: "#e8820c",
  green: "#22c55e",
  mutedBody: "rgba(26,35,50,0.62)",
  mutedLabel: "rgba(26,35,50,0.38)",
  mutedCream: "rgba(245,240,232,0.56)",
  mutedCreamLabel: "rgba(245,240,232,0.44)",
  border: "rgba(26,35,50,0.10)",
  borderStrong: "rgba(26,35,50,0.18)",
} as const;

const DISPLAY_FONT = "\"Playfair Display\", serif";
const SANS_FONT = "\"Source Sans 3\", sans-serif";
const MONO_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", monospace";

type Tone = "light" | "dark" | "orange";
type IconKind = "python" | "javascript" | "typescript" | "go" | "java" | "lua" | "sql";

type WorldRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type CardSpec = WorldRect & {
  id: string;
  tone: Tone;
  rotation: number;
  zIndex?: number;
};

type FloaterSpec = WorldRect & {
  id: string;
  phase: number;
  speed: number;
  amplitude: number;
  baseTransform?: string;
  rotateAmplitude?: number;
  zIndex?: number;
};

type StoryScene = {
  id: string;
  label: string;
  title: string;
  body: string;
  progress: number;
  camera: { x: number; y: number };
};

type SceneMoodChannels = {
  r: number;
  g: number;
  b: number;
  a: number;
};

type CardEntranceMeta = {
  sceneId: string;
  indexWithinScene: number;
  totalInScene: number;
};

type PathPoint = {
  x: number;
  y: number;
};

type PathMetrics = {
  total: number;
  segments: Array<{
    start: PathPoint;
    end: PathPoint;
    length: number;
    cumulativeStart: number;
  }>;
};

type ConnectorSpec = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  controlOffsetY: number;
  padding?: number;
};

type AmbientElementKind = "code" | "stat" | "note" | "dot";
type AmbientNoteTone = "yellow" | "sage" | "peach" | "sky";

type AmbientElementSpec = {
  id: string;
  kind: AmbientElementKind;
  worldX: number;
  worldY: number;
  width: number;
  height: number;
  depth: number;
  phase: number;
  speed: number;
  rotation: number;
  content?: string;
  lines?: string[];
  tone?: AmbientNoteTone;
};

type AmbientElementBlueprint = Omit<AmbientElementSpec, "phase" | "worldX" | "worldY"> & {
  anchorCardId: string;
  offsetX: number;
  offsetY: number;
};

type HorizontalTrackData = {
  cards: CardSpec[];
  scenes: StoryScene[];
  sceneOrigins: Array<{ x: number; y: number }>;
  totalWidth: number;
  totalHeight: number;
  pathMetrics: PathMetrics;
  pathSvg: string;
};

type SceneCardLayout = {
  id: string;
  x: number;
  y: number;
  scale?: number;
};

type SceneLayout = {
  sceneId: string;
  cards: SceneCardLayout[];
};

const STORY_SCENES: StoryScene[] = [
  {
    id: "intro",
    label: "Start",
    title: "Start here.",
    body: "What Pico is, how short sessions work, and why the board keeps moving.",
    progress: 0.03,
    camera: { x: 760, y: 420 },
  },
  {
    id: "tracks",
    label: "Tracks",
    title: "Choose a track.",
    body: "Python, JavaScript, Lua, SQL, and more with placement before repetition.",
    progress: 0.18,
    camera: { x: 1780, y: 430 },
  },
  {
    id: "practice",
    label: "Practice",
    title: "Practice the exact thing.",
    body: "Question types, lesson flow, and cards that keep the pace tight.",
    progress: 0.34,
    camera: { x: 2850, y: 470 },
  },
  {
    id: "libraries",
    label: "Libraries",
    title: "Open tools that build.",
    body: "Roblox Studio, Turtle, Canvas, Fetch, and project-driven modules.",
    progress: 0.52,
    camera: { x: 3420, y: 1180 },
  },
  {
    id: "progress",
    label: "Progress",
    title: "Progress has shape.",
    body: "Leaderboards, streaks, hearts, XP, and visible forward motion.",
    progress: 0.70,
    camera: { x: 1860, y: 1620 },
  },
  {
    id: "community",
    label: "Proof",
    title: "People stick with it.",
    body: "Social proof, real learner momentum, and a product that does not feel dead.",
    progress: 0.84,
    camera: { x: 980, y: 2310 },
  },
  {
    id: "cta",
    label: "Account",
    title: "Open your account.",
    body: "End on a clear action instead of a dead-end landing page.",
    progress: 0.97,
    camera: { x: 2650, y: 2570 },
  },
];

const SCENE_MOODS: Record<string, string> = {
  intro: "rgba(232,130,12,0.03)",
  tracks: "rgba(26,35,50,0.04)",
  practice: "rgba(26,35,50,0.05)",
  libraries: "rgba(232,130,12,0.05)",
  progress: "rgba(34,197,94,0.03)",
  community: "rgba(26,35,50,0.03)",
  cta: "rgba(26,35,50,0.06)",
};

const SCENE_HERO_CARD: Record<string, string> = {
  intro: "hero",
  tracks: "languages",
  practice: "question-types",
  libraries: "mini-courses",
  progress: "leaderboard",
  community: "security",
  cta: "cta",
};

const PATH_POINTS: PathPoint[] = [
  { x: 720, y: 430 },
  { x: 1620, y: 430 },
  { x: 2620, y: 470 },
  { x: 3460, y: 560 },
  { x: 3460, y: 1220 },
  { x: 2560, y: 1480 },
  { x: 1660, y: 1610 },
  { x: 780, y: 1760 },
  { x: 780, y: 2290 },
  { x: 1750, y: 2520 },
  { x: 2790, y: 2570 },
];

const CARD_SPECS: CardSpec[] = [
  { id: "hero", x: 280, y: 140, w: 520, h: 404, tone: "light", rotation: 0, zIndex: 5 },
  { id: "preview", x: 930, y: 130, w: 430, h: 340, tone: "dark", rotation: 1.6, zIndex: 6 },
  { id: "sessions", x: 320, y: 620, w: 240, h: 168, tone: "light", rotation: -1, zIndex: 4 },
  { id: "placement", x: 600, y: 620, w: 290, h: 168, tone: "dark", rotation: 0.6, zIndex: 4 },
  { id: "functions", x: 950, y: 610, w: 430, h: 198, tone: "light", rotation: -0.4, zIndex: 5 },
  { id: "languages", x: 1460, y: 130, w: 350, h: 376, tone: "light", rotation: -0.3, zIndex: 4 },
  { id: "question-types", x: 1890, y: 160, w: 390, h: 372, tone: "light", rotation: 0.9, zIndex: 4 },
  { id: "lessons", x: 2350, y: 170, w: 280, h: 184, tone: "dark", rotation: -1.4, zIndex: 4 },
  { id: "path", x: 2690, y: 150, w: 430, h: 320, tone: "light", rotation: -0.1, zIndex: 4 },
  { id: "roblox", x: 3330, y: 220, w: 340, h: 250, tone: "orange", rotation: 2.1, zIndex: 6 },
  { id: "shop", x: 2770, y: 880, w: 300, h: 216, tone: "dark", rotation: -1.1, zIndex: 4 },
  { id: "mini-courses", x: 3150, y: 860, w: 550, h: 360, tone: "light", rotation: 0, zIndex: 4 },
  { id: "creator-tools", x: 3440, y: 1260, w: 390, h: 240, tone: "light", rotation: 1.2, zIndex: 4 },
  { id: "progress", x: 2220, y: 1430, w: 350, h: 300, tone: "light", rotation: -0.7, zIndex: 4 },
  { id: "stats", x: 1720, y: 1400, w: 280, h: 350, tone: "orange", rotation: 2.2, zIndex: 5 },
  { id: "leaderboard", x: 1160, y: 1380, w: 330, h: 370, tone: "dark", rotation: -0.9, zIndex: 5 },
  { id: "placement-callout", x: 740, y: 1450, w: 250, h: 214, tone: "light", rotation: 1.8, zIndex: 4 },
  { id: "testimonial-1", x: 680, y: 2020, w: 330, h: 248, tone: "light", rotation: -2.1, zIndex: 4 },
  { id: "security", x: 1120, y: 2050, w: 410, h: 250, tone: "light", rotation: 1.1, zIndex: 4 },
  { id: "signal", x: 1640, y: 2500, w: 290, h: 220, tone: "orange", rotation: -1.6, zIndex: 4 },
  { id: "testimonial-2", x: 2050, y: 2440, w: 320, h: 242, tone: "dark", rotation: 1.2, zIndex: 4 },
  { id: "cta", x: 2450, y: 2340, w: 1100, h: 340, tone: "dark", rotation: 0, zIndex: 4 },
];

const CARD_BY_ID = Object.fromEntries(CARD_SPECS.map((card) => [card.id, card])) as Record<
  string,
  CardSpec
>;

const AMBIENT_ELEMENT_BLUEPRINTS: AmbientElementBlueprint[] = [
  {
    id: "ambient-1",
    anchorCardId: "hero",
    offsetX: 320,
    offsetY: -180,
    kind: "stat",
    content: "94% retention",
    width: 110,
    height: 28,
    depth: 0.8,
    speed: 0.45,
    rotation: -2,
  },
  {
    id: "ambient-2",
    anchorCardId: "preview",
    offsetX: -300,
    offsetY: 190,
    kind: "code",
    width: 156,
    height: 74,
    depth: 1.1,
    speed: 0.38,
    rotation: 3,
    lines: [
      "def greet(name):",
      "    return f\"Hi {name}\"",
      "print(greet(\"Pico\"))",
    ],
  },
  {
    id: "ambient-3",
    anchorCardId: "functions",
    offsetX: 300,
    offsetY: -160,
    kind: "note",
    content: "Ship it",
    width: 80,
    height: 60,
    depth: 1.25,
    speed: 0.52,
    rotation: -3,
    tone: "amber" as AmbientNoteTone,
  },
  {
    id: "ambient-4",
    anchorCardId: "languages",
    offsetX: 280,
    offsetY: 210,
    kind: "stat",
    content: "12k users",
    width: 96,
    height: 28,
    depth: 1.05,
    speed: 0.58,
    rotation: 0,
  },
  {
    id: "ambient-5",
    anchorCardId: "question-types",
    offsetX: -310,
    offsetY: -170,
    kind: "code",
    width: 160,
    height: 74,
    depth: 0.78,
    speed: 0.42,
    rotation: -2,
    lines: [
      "const nums = [1, 2, 3];",
      "const doubled = nums.map(n => n * 2);",
      "console.log(doubled);",
    ],
  },
  {
    id: "ambient-6",
    anchorCardId: "lessons",
    offsetX: 240,
    offsetY: -140,
    kind: "stat",
    content: "128 lessons",
    width: 108,
    height: 28,
    depth: 1.18,
    speed: 0.47,
    rotation: 1,
  },
  {
    id: "ambient-7",
    anchorCardId: "path",
    offsetX: -260,
    offsetY: 220,
    kind: "note",
    content: "Day 3",
    width: 80,
    height: 60,
    depth: 0.72,
    speed: 0.41,
    rotation: 2,
    tone: "amber" as AmbientNoteTone,
  },
  {
    id: "ambient-8",
    anchorCardId: "mini-courses",
    offsetX: -320,
    offsetY: -180,
    kind: "code",
    width: 162,
    height: 74,
    depth: 0.88,
    speed: 0.36,
    rotation: -1,
    lines: [
      "for i in range(4):",
      "    print(i)",
      "print(\"done\")",
    ],
  },
  {
    id: "ambient-9",
    anchorCardId: "roblox",
    offsetX: 230,
    offsetY: 170,
    kind: "stat",
    content: "81% completion",
    width: 122,
    height: 28,
    depth: 1.14,
    speed: 0.54,
    rotation: 0,
  },
  {
    id: "ambient-10",
    anchorCardId: "creator-tools",
    offsetX: 260,
    offsetY: -150,
    kind: "note",
    content: "Nice!",
    width: 80,
    height: 60,
    depth: 1.22,
    speed: 0.49,
    rotation: -4,
    tone: "amber" as AmbientNoteTone,
  },
  {
    id: "ambient-11",
    anchorCardId: "shop",
    offsetX: -220,
    offsetY: 180,
    kind: "dot",
    width: 12,
    height: 12,
    depth: 0.7,
    speed: 0.6,
    rotation: 0,
  },
  {
    id: "ambient-12",
    anchorCardId: "leaderboard",
    offsetX: -260,
    offsetY: -150,
    kind: "code",
    width: 158,
    height: 74,
    depth: 0.82,
    speed: 0.4,
    rotation: 2,
    lines: [
      "function add(a, b) {",
      "  return a + b;",
      "}",
      "console.log(add(2, 3));",
    ],
  },
  {
    id: "ambient-13",
    anchorCardId: "stats",
    offsetX: 260,
    offsetY: -130,
    kind: "stat",
    content: "7-day streak",
    width: 106,
    height: 28,
    depth: 1.2,
    speed: 0.63,
    rotation: 0,
  },
  {
    id: "ambient-14",
    anchorCardId: "progress",
    offsetX: 250,
    offsetY: 210,
    kind: "note",
    content: "Streak",
    width: 80,
    height: 60,
    depth: 1.3,
    speed: 0.44,
    rotation: 3,
    tone: "amber" as AmbientNoteTone,
  },
  {
    id: "ambient-15",
    anchorCardId: "placement-callout",
    offsetX: -210,
    offsetY: 170,
    kind: "stat",
    content: "32-day best",
    width: 112,
    height: 28,
    depth: 0.9,
    speed: 0.43,
    rotation: 0,
  },
  {
    id: "ambient-16",
    anchorCardId: "testimonial-1",
    offsetX: -240,
    offsetY: -170,
    kind: "code",
    width: 154,
    height: 72,
    depth: 0.86,
    speed: 0.35,
    rotation: -2,
    lines: [
      "total = 0",
      "for n in [1, 2, 3]:",
      "    total += n",
      "print(total)",
    ],
  },
  {
    id: "ambient-17",
    anchorCardId: "security",
    offsetX: -270,
    offsetY: -150,
    kind: "code",
    width: 160,
    height: 74,
    depth: 0.96,
    speed: 0.39,
    rotation: 1,
    lines: [
      "let score = 0;",
      "for (const step of [1, 2, 3]) {",
      "  score += step;",
      "}",
    ],
  },
  {
    id: "ambient-18",
    anchorCardId: "signal",
    offsetX: 240,
    offsetY: -130,
    kind: "stat",
    content: "26 projects",
    width: 102,
    height: 28,
    depth: 1.16,
    speed: 0.51,
    rotation: 0,
  },
  {
    id: "ambient-19",
    anchorCardId: "testimonial-2",
    offsetX: 210,
    offsetY: 150,
    kind: "dot",
    width: 12,
    height: 12,
    depth: 1.28,
    speed: 0.67,
    rotation: 0,
  },
  {
    id: "ambient-20",
    anchorCardId: "cta",
    offsetX: -330,
    offsetY: -170,
    kind: "note",
    content: "Level up",
    width: 80,
    height: 60,
    depth: 0.84,
    speed: 0.4,
    rotation: -2,
    tone: "amber" as AmbientNoteTone,
  },
];

const CODE_SNIPPETS: Array<FloaterSpec & { code: string }> = [
  {
    id: "snippet-python",
    x: 110,
    y: 880,
    w: 230,
    h: 86,
    phase: 0.2,
    speed: 0.012,
    amplitude: 10,
    baseTransform: "rotate(-1.5deg)",
    rotateAmplitude: 0.8,
    zIndex: 2,
    code: "for i in range(10):\n    print(i)",
  },
  {
    id: "snippet-js",
    x: 1700,
    y: 650,
    w: 240,
    h: 92,
    phase: 1.5,
    speed: 0.01,
    amplitude: 8,
    baseTransform: "rotate(1deg)",
    rotateAmplitude: 1,
    zIndex: 2,
    code: "const greet = (name) =>\n  `Hello, ${name}!`",
  },
  {
    id: "snippet-roblox",
    x: 2920,
    y: 1310,
    w: 240,
    h: 92,
    phase: 2.2,
    speed: 0.013,
    amplitude: 11,
    baseTransform: "rotate(-2deg)",
    rotateAmplitude: 1.2,
    zIndex: 2,
    code: "workspace:FindFirstChild(\"Part\")\n  :Destroy()",
  },
  {
    id: "snippet-sql",
    x: 560,
    y: 2550,
    w: 240,
    h: 90,
    phase: 0.8,
    speed: 0.011,
    amplitude: 9,
    baseTransform: "rotate(1.5deg)",
    rotateAmplitude: 1,
    zIndex: 2,
    code: "SELECT * FROM users\nWHERE streak > 7",
  },
  {
    id: "snippet-go",
    x: 3850,
    y: 1370,
    w: 230,
    h: 98,
    phase: 2.8,
    speed: 0.009,
    amplitude: 12,
    baseTransform: "rotate(-1deg)",
    rotateAmplitude: 1.2,
    zIndex: 2,
    code: "func main() {\n  fmt.Println(\"hello\")\n}",
  },
  {
    id: "snippet-turtle",
    x: 1960,
    y: 2810,
    w: 240,
    h: 90,
    phase: 0.5,
    speed: 0.013,
    amplitude: 8,
    baseTransform: "rotate(2deg)",
    rotateAmplitude: 1,
    zIndex: 2,
    code: "pen = turtle.Turtle()\npen.forward(100)",
  },
];

const BRACKETS: Array<FloaterSpec & { value: "{" | "}" }> = [
  { id: "bracket-1", x: 450, y: 1600, w: 80, h: 90, value: "{", phase: 0.6, speed: 0.008, amplitude: 8, baseTransform: "rotate(-4deg)", rotateAmplitude: 1.2, zIndex: 1 },
  { id: "bracket-2", x: 2450, y: 820, w: 80, h: 90, value: "}", phase: 2.4, speed: 0.012, amplitude: 10, baseTransform: "rotate(3deg)", rotateAmplitude: 1.2, zIndex: 1 },
  { id: "bracket-3", x: 3260, y: 1810, w: 80, h: 90, value: "{", phase: 1.8, speed: 0.009, amplitude: 7, baseTransform: "rotate(-2deg)", rotateAmplitude: 1.2, zIndex: 1 },
  { id: "bracket-4", x: 1240, y: 2910, w: 80, h: 90, value: "}", phase: 3.2, speed: 0.010, amplitude: 11, baseTransform: "rotate(2deg)", rotateAmplitude: 1.2, zIndex: 1 },
];

const LANGUAGE_ICONS: Array<FloaterSpec & { label: string; kind: IconKind }> = [
  { id: "icon-python", x: 140, y: 520, w: 64, h: 76, label: "Python", kind: "python", phase: 0.3, speed: 0.013, amplitude: 8, zIndex: 3 },
  { id: "icon-javascript", x: 2080, y: 70, w: 64, h: 76, label: "JavaScript", kind: "javascript", phase: 1.1, speed: 0.015, amplitude: 10, baseTransform: "rotate(-8deg)", rotateAmplitude: 1.5, zIndex: 3 },
  { id: "icon-typescript", x: 3010, y: 640, w: 64, h: 76, label: "TypeScript", kind: "typescript", phase: 2.2, speed: 0.011, amplitude: 8, zIndex: 3 },
  { id: "icon-go", x: 2430, y: 1880, w: 64, h: 76, label: "Go", kind: "go", phase: 0.7, speed: 0.010, amplitude: 10, baseTransform: "rotate(5deg)", rotateAmplitude: 1.3, zIndex: 3 },
  { id: "icon-java", x: 340, y: 2420, w: 64, h: 76, label: "Java", kind: "java", phase: 1.7, speed: 0.014, amplitude: 9, zIndex: 3 },
  { id: "icon-lua", x: 3160, y: 2730, w: 64, h: 76, label: "Lua", kind: "lua", phase: 2.9, speed: 0.012, amplitude: 11, baseTransform: "rotate(-4deg)", rotateAmplitude: 1.2, zIndex: 3 },
  { id: "icon-sql", x: 860, y: 930, w: 64, h: 76, label: "SQL", kind: "sql", phase: 1.0, speed: 0.009, amplitude: 7, zIndex: 3 },
];

const STATS: Array<FloaterSpec & { key: string; fallbackValue: string; label: string }> = [
  { id: "stat-learners", key: "learners", x: 2740, y: 640, w: 170, h: 100, fallbackValue: "50k+", label: "learners", phase: 0.5, speed: 0.009, amplitude: 8, zIndex: 2 },
  { id: "stat-rating", key: "rating", x: 3880, y: 820, w: 140, h: 96, fallbackValue: "4.9", label: "avg rating", phase: 1.3, speed: 0.013, amplitude: 9, zIndex: 2 },
  { id: "stat-streak", key: "streak", x: 80, y: 2200, w: 160, h: 96, fallbackValue: "14 days", label: "avg streak", phase: 2.0, speed: 0.010, amplitude: 10, zIndex: 2 },
  { id: "stat-languages", key: "languages", x: 2160, y: 2920, w: 140, h: 94, fallbackValue: "7", label: "languages", phase: 2.6, speed: 0.012, amplitude: 8, zIndex: 2 },
];

const STICKY_NOTES: Array<FloaterSpec & { label: string; body: string; tone: Tone }> = [
  {
    id: "note-1",
    x: 1500,
    y: 690,
    w: 170,
    h: 130,
    label: "TODAY",
    body: "Placement before repeated basics.",
    tone: "light",
    phase: 1.1,
    speed: 0.011,
    amplitude: 8,
    baseTransform: "rotate(-4deg)",
    rotateAmplitude: 1.2,
    zIndex: 3,
  },
  {
    id: "note-2",
    x: 3700,
    y: 690,
    w: 170,
    h: 132,
    label: "BUILD",
    body: "Open Roblox Studio and ship a first game.",
    tone: "orange",
    phase: 2.3,
    speed: 0.009,
    amplitude: 9,
    baseTransform: "rotate(3deg)",
    rotateAmplitude: 1.1,
    zIndex: 3,
  },
  {
    id: "note-3",
    x: 2110,
    y: 1920,
    w: 170,
    h: 132,
    label: "TRACK",
    body: "Hearts, streaks, XP, and visible progress.",
    tone: "dark",
    phase: 0.8,
    speed: 0.010,
    amplitude: 8,
    baseTransform: "rotate(-2deg)",
    rotateAmplitude: 1.1,
    zIndex: 3,
  },
];

const NEW_BADGE: FloaterSpec = {
  id: "badge-new",
  x: 3470,
  y: 170,
  w: 72,
  h: 26,
  phase: 1.6,
  speed: 0.016,
  amplitude: 6,
  baseTransform: "rotate(-5deg)",
  rotateAmplitude: 1.5,
  zIndex: 7,
};

const STREAK_FLAME: FloaterSpec = {
  id: "streak-fire",
  x: 2570,
  y: 1530,
  w: 120,
  h: 110,
  phase: 0.8,
  speed: 0.012,
  amplitude: 9,
  baseTransform: "rotate(1deg)",
  rotateAmplitude: 1.2,
  zIndex: 3,
};

const CONNECTORS: ConnectorSpec[] = [
  {
    id: "connector-hero-preview",
    start: { x: CARD_BY_ID.hero.x + CARD_BY_ID.hero.w, y: CARD_BY_ID.hero.y + 160 },
    end: { x: CARD_BY_ID.preview.x, y: CARD_BY_ID.preview.y + 158 },
    controlOffsetY: -80,
    padding: 40,
  },
  {
    id: "connector-sessions-placement",
    start: { x: CARD_BY_ID.sessions.x + 118, y: CARD_BY_ID.sessions.y + CARD_BY_ID.sessions.h },
    end: { x: CARD_BY_ID.placement.x + 136, y: CARD_BY_ID.placement.y },
    controlOffsetY: 86,
    padding: 34,
  },
  {
    id: "connector-languages-question",
    start: { x: CARD_BY_ID.languages.x + CARD_BY_ID.languages.w, y: CARD_BY_ID.languages.y + 180 },
    end: { x: CARD_BY_ID["question-types"].x, y: CARD_BY_ID["question-types"].y + 160 },
    controlOffsetY: -70,
    padding: 36,
  },
  {
    id: "connector-question-path",
    start: { x: CARD_BY_ID["question-types"].x + CARD_BY_ID["question-types"].w, y: CARD_BY_ID["question-types"].y + 170 },
    end: { x: CARD_BY_ID.path.x, y: CARD_BY_ID.path.y + 150 },
    controlOffsetY: -46,
    padding: 34,
  },
  {
    id: "connector-path-roblox",
    start: { x: CARD_BY_ID.path.x + CARD_BY_ID.path.w, y: CARD_BY_ID.path.y + 144 },
    end: { x: CARD_BY_ID.roblox.x, y: CARD_BY_ID.roblox.y + 130 },
    controlOffsetY: -60,
    padding: 36,
  },
  {
    id: "connector-mini-creator",
    start: { x: CARD_BY_ID["mini-courses"].x + 280, y: CARD_BY_ID["mini-courses"].y + CARD_BY_ID["mini-courses"].h },
    end: { x: CARD_BY_ID["creator-tools"].x + 160, y: CARD_BY_ID["creator-tools"].y },
    controlOffsetY: 100,
    padding: 40,
  },
  {
    id: "connector-progress-stats",
    start: { x: CARD_BY_ID.progress.x, y: CARD_BY_ID.progress.y + 150 },
    end: { x: CARD_BY_ID.stats.x + CARD_BY_ID.stats.w, y: CARD_BY_ID.stats.y + 150 },
    controlOffsetY: -80,
    padding: 36,
  },
  {
    id: "connector-stats-leaderboard",
    start: { x: CARD_BY_ID.stats.x, y: CARD_BY_ID.stats.y + 84 },
    end: { x: CARD_BY_ID.leaderboard.x + CARD_BY_ID.leaderboard.w, y: CARD_BY_ID.leaderboard.y + 290 },
    controlOffsetY: -130,
    padding: 48,
  },
  {
    id: "connector-security-cta",
    start: { x: CARD_BY_ID.security.x + CARD_BY_ID.security.w, y: CARD_BY_ID.security.y + 120 },
    end: { x: CARD_BY_ID.cta.x, y: CARD_BY_ID.cta.y + 150 },
    controlOffsetY: 110,
    padding: 44,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

function smoothDamp(
  current: number,
  target: number,
  currentVelocity: number,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number,
) {
  const safeSmoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / safeSmoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const originalTarget = target;
  const maxChange = maxSpeed * safeSmoothTime;
  const change = clamp(current - target, -maxChange, maxChange);
  const adjustedTarget = current - change;
  const temp = (currentVelocity + omega * change) * deltaTime;
  let nextVelocity = (currentVelocity - omega * temp) * exp;
  let nextValue = adjustedTarget + (change + temp) * exp;

  if ((originalTarget - current > 0) === (nextValue > originalTarget)) {
    nextValue = originalTarget;
    nextVelocity = 0;
  }

  return {
    value: nextValue,
    velocity: nextVelocity,
  };
}

function easeOutCubic(value: number) {
  const clamped = clamp(value, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

function easeInOutQuad(value: number) {
  const clamped = clamp(value, 0, 1);
  return clamped < 0.5
    ? 2 * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
}

function normalizeWheelDelta(event: WheelEvent) {
  const lineHeight = 18;
  const pageHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const multiplier = event.deltaMode === 1 ? lineHeight : event.deltaMode === 2 ? pageHeight : 1;
  return clamp(event.deltaY * multiplier, -180, 180);
}

function computeDistanceToCamera(rect: WorldRect, cameraX: number, cameraY: number) {
  const centerX = rect.x + rect.w / 2;
  const centerY = rect.y + rect.h / 2;
  return Math.hypot(centerX - cameraX, centerY - cameraY);
}

function applyDepthTransform(params: {
  cameraX: number;
  cameraY: number;
  objectX: number;
  objectY: number;
  depth: number;
  maxOffset?: number;
}) {
  const { cameraX, cameraY, objectX, objectY, depth, maxOffset = 20 } = params;
  const depthValue = clamp(depth, 0.78, 1.26);
  const offsetX = clamp((cameraX - objectX) * (1 - depthValue), -maxOffset, maxOffset);
  const offsetY = clamp((cameraY - objectY) * (1 - depthValue), -maxOffset, maxOffset);

  return {
    offsetX,
    offsetY,
    scale: 1 + (depthValue - 1) * 0.08,
    blur: Math.abs(1 - depthValue) * 0.65,
  };
}

function computeFocusState(distance: number, viewportWidth: number, viewportHeight: number) {
  const maxDistance = Math.max(1, Math.hypot(viewportWidth * 0.58, viewportHeight * 0.58));
  const normalized = clamp(distance / maxDistance, 0, 1);
  const focus = easeOutCubic(1 - normalized);

  return {
    focus,
    opacity: 0.24 + focus * 0.76,
    blur: (1 - focus) * 3.1,
    scale: 0.9 + focus * 0.1,
  };
}

function applyFloatingAnimation(params: {
  time: number;
  phase: number;
  speed: number;
  amplitude: number;
  rotateAmplitude?: number;
}) {
  const { time, phase, speed, amplitude, rotateAmplitude = 0.45 } = params;
  const driftX = Math.cos(time * speed + phase) * amplitude;
  const driftY = Math.sin(time * speed * 0.82 + phase * 1.4) * amplitude * 0.72;
  const rotate = Math.sin(time * speed * 0.46 + phase * 1.7) * rotateAmplitude;

  return {
    driftX,
    driftY,
    rotate,
  };
}

function formatLearnerCount(count: number | null) {
  if (!count || count <= 0) return "50k+";
  if (count > 1000) return `${Math.floor(count / 1000)}k+`;
  return count.toLocaleString("en-US");
}

function intersects(a: WorldRect, b: WorldRect) {
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function buildPathMetrics(points: PathPoint[]): PathMetrics {
  const segments: PathMetrics["segments"] = [];
  let total = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push({
      start,
      end,
      length,
      cumulativeStart: total,
    });
    total += length;
  }

  return { total, segments };
}

function samplePath(metrics: PathMetrics, progress: number) {
  const clamped = clamp(progress, 0, 1);
  const distance = clamped * metrics.total;

  for (const segment of metrics.segments) {
    const segmentEnd = segment.cumulativeStart + segment.length;
    if (distance <= segmentEnd) {
      const local = segment.length === 0 ? 0 : (distance - segment.cumulativeStart) / segment.length;
      const x = segment.start.x + (segment.end.x - segment.start.x) * local;
      const y = segment.start.y + (segment.end.y - segment.start.y) * local;
      const dx = segment.end.x - segment.start.x;
      const dy = segment.end.y - segment.start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      return {
        x,
        y,
        tangentX: dx / length,
        tangentY: dy / length,
      };
    }
  }

  const last = metrics.segments[metrics.segments.length - 1];
  const dx = last.end.x - last.start.x;
  const dy = last.end.y - last.start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    x: last.end.x,
    y: last.end.y,
    tangentX: dx / length,
    tangentY: dy / length,
  };
}

function buildSvgPath(points: PathPoint[]) {
  if (!points.length) return "";
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    path += ` Q ${midX} ${previous.y} ${current.x} ${current.y}`;
  }

  return path;
}

function getEstimatedStoryScrollDistance(viewportWidth: number, pathDistance: number) {
  const totalCardWidth = CARD_SPECS.reduce((sum, card) => sum + card.w, 0);
  const averageCardWidth = totalCardWidth / CARD_SPECS.length;
  const padding = Math.max(480, averageCardWidth * 1.25);
  const estimatedTrackWidth = totalCardWidth + padding;
  const viewportWorldWidth = viewportWidth / BASE_ZOOM;
  const horizontalTravel = Math.max(0, estimatedTrackWidth - viewportWorldWidth);
  const pathTravel = Math.max(0, pathDistance * 0.95);

  return Math.max(horizontalTravel, pathTravel);
}

const SCENE_ARTBOARD = { width: 1320, height: 820 };

const HORIZONTAL_SCENE_LAYOUTS: SceneLayout[] = [
  {
    sceneId: "intro",
    cards: [
      { id: "hero", x: 74, y: 112, scale: 1.03 },
      { id: "preview", x: 746, y: 74, scale: 1.0 },
      { id: "sessions", x: 124, y: 568, scale: 1.04 },
      { id: "placement", x: 430, y: 582, scale: 1.04 },
      { id: "functions", x: 756, y: 516, scale: 0.98 },
    ],
  },
  {
    sceneId: "tracks",
    cards: [
      { id: "languages", x: 356, y: 156, scale: 1.1 },
    ],
  },
  {
    sceneId: "practice",
    cards: [
      { id: "question-types", x: 210, y: 152, scale: 1.06 },
      { id: "lessons", x: 760, y: 150, scale: 1.08 },
      { id: "path", x: 812, y: 402, scale: 1.02 },
    ],
  },
  {
    sceneId: "libraries",
    cards: [
      { id: "mini-courses", x: 268, y: 108, scale: 1.04 },
      { id: "roblox", x: 86, y: 522, scale: 1.08 },
      { id: "creator-tools", x: 1014, y: 190, scale: 1.0 },
      { id: "shop", x: 970, y: 522, scale: 1.05 },
    ],
  },
  {
    sceneId: "progress",
    cards: [
      { id: "leaderboard", x: 112, y: 194, scale: 1.08 },
      { id: "stats", x: 520, y: 140, scale: 1.13 },
      { id: "progress", x: 904, y: 192, scale: 1.06 },
      { id: "placement-callout", x: 1160, y: 520, scale: 1.02 },
    ],
  },
  {
    sceneId: "community",
    cards: [
      { id: "testimonial-1", x: 96, y: 154, scale: 1.08 },
      { id: "security", x: 394, y: 176, scale: 1.06 },
      { id: "signal", x: 956, y: 160, scale: 1.08 },
      { id: "testimonial-2", x: 1100, y: 488, scale: 1.04 },
    ],
  },
  {
    sceneId: "cta",
    cards: [{ id: "cta", x: 148, y: 210, scale: 1.0 }],
  },
];

function buildHorizontalTrack(viewportWidth: number, viewportHeight: number): HorizontalTrackData {
  const safeViewportWidth = Math.max(960, viewportWidth);
  const safeViewportHeight = Math.max(720, viewportHeight);
  const pageWidth = Math.max(1040, Math.round(safeViewportWidth * 0.96));
  const pageHeight = Math.max(780, safeViewportHeight);
  const sceneGapX = Math.round(pageWidth * 0.12);
  const sceneGapY = Math.round(pageHeight * 0.1);
  const sceneScale = clamp(
    Math.min(
      (safeViewportWidth - 80) / SCENE_ARTBOARD.width,
      (safeViewportHeight - 120) / SCENE_ARTBOARD.height,
    ),
    0.72,
    1.1,
  );
  const contentOffsetX = Math.max(72, Math.round((pageWidth - SCENE_ARTBOARD.width * sceneScale) / 2));
  const contentOffsetY = NAV_HEIGHT + 54;
  const cards: CardSpec[] = [];
  const cardsByScene: Record<string, CardSpec[]> = {};
  const sceneRanges: Array<{ meta: StoryScene; start: number; end: number; origin: { x: number; y: number } }> = [];
  const sceneOrigins: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    { x: pageWidth + sceneGapX, y: Math.round(sceneGapY * 0.4) },
    { x: pageWidth * 2 + sceneGapX * 2, y: 0 },
    { x: pageWidth * 3 + sceneGapX * 3, y: Math.round(sceneGapY * 0.75) },
    { x: pageWidth * 4 + sceneGapX * 4, y: Math.round(sceneGapY * 0.18) },
    { x: pageWidth * 5 + sceneGapX * 5, y: Math.round(sceneGapY * 0.92) },
    { x: pageWidth * 6 + sceneGapX * 6, y: Math.round(sceneGapY * 0.28) },
  ];

  HORIZONTAL_SCENE_LAYOUTS.forEach((layout, sceneIndex) => {
    const sceneOrigin = sceneOrigins[sceneIndex];

    layout.cards.forEach((placement) => {
      const base = CARD_BY_ID[placement.id];
      const scale = (placement.scale ?? 1) * sceneScale;
      const width = Math.round(base.w * scale);
      const height = Math.round(base.h * scale);

      const builtCard = {
        ...base,
        x: sceneOrigin.x + contentOffsetX + Math.round(placement.x * sceneScale),
        y: sceneOrigin.y + contentOffsetY + Math.round(placement.y * sceneScale),
        w: width,
        h: height,
      };

      cards.push(builtCard);
      cardsByScene[layout.sceneId] = [...(cardsByScene[layout.sceneId] ?? []), builtCard];
    });

    const meta = STORY_SCENES.find((scene) => scene.id === layout.sceneId) ?? STORY_SCENES[0];
    sceneRanges.push({
      meta,
      start: sceneOrigin.x,
      end: sceneOrigin.x + pageWidth,
      origin: sceneOrigin,
    });
  });

  const totalWidth = Math.max(
    WORLD_WIDTH,
    ...sceneOrigins.map((sceneOrigin) => sceneOrigin.x + pageWidth),
    safeViewportWidth + 1,
  );
  const totalHeight = Math.max(
    WORLD_HEIGHT,
    ...sceneOrigins.map((sceneOrigin) => sceneOrigin.y + pageHeight),
    safeViewportHeight + 1,
  );
  const scenes = sceneRanges.map(({ meta, start, end, origin }) => {
    const heroCard = (cardsByScene[meta.id] ?? []).find((card) => card.id === SCENE_HERO_CARD[meta.id]);
    const centerX = heroCard ? heroCard.x + heroCard.w / 2 : (start + end) / 2;
    const centerY = heroCard ? heroCard.y + heroCard.h / 2 : origin.y + pageHeight / 2;
    return {
      ...meta,
      progress: 0,
      camera: { x: centerX, y: centerY },
    };
  });
  const pathPoints = scenes.map((scene) => scene.camera);
  const pathMetrics = buildPathMetrics(pathPoints);
  const sceneDistances = scenes.map((_, index) => {
    if (index === 0) return 0;
    const previousSegment = pathMetrics.segments[index - 1];
    return previousSegment.cumulativeStart + previousSegment.length;
  });

  return {
    cards,
    sceneOrigins,
    totalWidth,
    totalHeight,
    pathMetrics,
    pathSvg: buildSvgPath(pathPoints),
    scenes: scenes.map((scene, index) => ({
      ...scene,
      progress: clamp(sceneDistances[index] / Math.max(1, pathMetrics.total), 0, 1),
    })),
  };
}

function buildAmbientElements(
  cards: CardSpec[],
  totalWidth: number,
  totalHeight: number,
): AmbientElementSpec[] {
  const cardById = Object.fromEntries(cards.map((card) => [card.id, card])) as Record<string, CardSpec>;

  return AMBIENT_ELEMENT_BLUEPRINTS.flatMap((blueprint) => {
    const anchor = cardById[blueprint.anchorCardId];
    if (!anchor) return [];

    const centerX = anchor.x + anchor.w / 2 + blueprint.offsetX;
    const centerY = anchor.y + anchor.h / 2 + blueprint.offsetY;
    const maxX = Math.max(24, totalWidth - blueprint.width - 24);
    const maxY = Math.max(24, totalHeight - blueprint.height - 24);

    return [
      {
        ...blueprint,
        worldX: clamp(centerX - blueprint.width / 2, 24, maxX),
        worldY: clamp(centerY - blueprint.height / 2, NAV_HEIGHT + 24, maxY),
        phase: Math.random() * Math.PI * 2,
      },
    ];
  });
}

function getConnectorGeometry(spec: ConnectorSpec) {
  const padding = spec.padding ?? 30;
  const left = Math.min(spec.start.x, spec.end.x) - padding;
  const top = Math.min(spec.start.y, spec.end.y) - padding;
  const width = Math.abs(spec.end.x - spec.start.x) + padding * 2;
  const height = Math.abs(spec.end.y - spec.start.y) + padding * 2 + Math.abs(spec.controlOffsetY);
  const startX = spec.start.x - left;
  const startY = spec.start.y - top;
  const endX = spec.end.x - left;
  const endY = spec.end.y - top;
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2 + spec.controlOffsetY;

  return {
    left,
    top,
    width,
    height,
    path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
  };
}

function labelStyle(isDark = false): CSSProperties {
  return {
    fontFamily: SANS_FONT,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: isDark ? COLORS.mutedCreamLabel : COLORS.mutedLabel,
  };
}

function bodyStyle(isDark = false): CSSProperties {
  return {
    fontFamily: SANS_FONT,
    fontSize: 13,
    lineHeight: 1.65,
    color: isDark ? COLORS.mutedCream : COLORS.mutedBody,
  };
}

function buttonStyle(tone: "navy" | "orange" | "ghost" | "ghost-dark"): CSSProperties {
  if (tone === "orange") {
    return {
      background: COLORS.orange,
      color: COLORS.navy,
      border: `1px solid ${COLORS.orange}`,
      borderRadius: 2,
      padding: "10px 20px",
      fontFamily: SANS_FONT,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
    };
  }

  if (tone === "ghost") {
    return {
      background: "transparent",
      color: COLORS.navy,
      border: `1.5px solid ${COLORS.navy}`,
      borderRadius: 2,
      padding: "10px 20px",
      fontFamily: SANS_FONT,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
    };
  }

  if (tone === "ghost-dark") {
    return {
      background: "transparent",
      color: COLORS.cream,
      border: "1.5px solid rgba(245,240,232,0.3)",
      borderRadius: 2,
      padding: "10px 20px",
      fontFamily: SANS_FONT,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
    };
  }

  return {
    background: COLORS.navy,
    color: COLORS.cream,
    border: `1px solid ${COLORS.navy}`,
    borderRadius: 2,
    padding: "10px 20px",
    fontFamily: SANS_FONT,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
  };
}

function PicoBirdMark({ size = 32, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg
      viewBox="20 136 190 404"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={style}
      aria-hidden="true"
    >
      <ellipse cx="95" cy="470" rx="14" ry="52" fill="#1d4ed8" transform="rotate(-18 95 470)" />
      <ellipse cx="110" cy="478" rx="12" ry="58" fill="#2563eb" transform="rotate(-6 110 478)" />
      <ellipse cx="125" cy="478" rx="12" ry="58" fill="#3b82f6" transform="rotate(6 125 478)" />
      <ellipse cx="140" cy="470" rx="14" ry="52" fill="#1d4ed8" transform="rotate(18 140 470)" />
      <ellipse cx="115" cy="370" rx="78" ry="100" fill="#22c55e" />
      <ellipse cx="115" cy="390" rx="46" ry="68" fill="#86efac" />
      <ellipse cx="48" cy="360" rx="28" ry="72" fill="#16a34a" transform="rotate(-10 48 360)" />
      <ellipse cx="44" cy="345" rx="14" ry="36" fill="#15803d" transform="rotate(-10 44 345)" />
      <ellipse cx="182" cy="360" rx="28" ry="72" fill="#16a34a" transform="rotate(10 182 360)" />
      <ellipse cx="186" cy="345" rx="14" ry="36" fill="#15803d" transform="rotate(10 186 345)" />
      <ellipse cx="115" cy="278" rx="44" ry="36" fill="#22c55e" />
      <circle cx="115" cy="235" r="72" fill="#22c55e" />
      <ellipse cx="115" cy="178" rx="38" ry="22" fill="#3b82f6" />
      <ellipse cx="95" cy="162" rx="9" ry="20" fill="#2563eb" transform="rotate(-12 95 162)" />
      <ellipse cx="115" cy="158" rx="9" ry="22" fill="#1d4ed8" />
      <ellipse cx="135" cy="162" rx="9" ry="20" fill="#2563eb" transform="rotate(12 135 162)" />
      <ellipse cx="68" cy="240" rx="22" ry="18" fill="#fbbf24" />
      <ellipse cx="162" cy="240" rx="22" ry="18" fill="#fbbf24" />
      <circle cx="82" cy="222" r="18" fill="white" />
      <circle cx="148" cy="222" r="18" fill="white" />
      <circle cx="86" cy="224" r="12" fill="#1e293b" />
      <circle cx="152" cy="224" r="12" fill="#1e293b" />
      <circle cx="86" cy="224" r="6" fill="#111827" />
      <circle cx="152" cy="224" r="6" fill="#111827" />
      <circle cx="91" cy="219" r="3" fill="white" />
      <circle cx="157" cy="219" r="3" fill="white" />
      <path d="M98 252 Q115 260 132 252 Q126 240 115 238 Q104 240 98 252Z" fill="#f59e0b" />
      <path d="M101 257 Q115 263 129 257 Q122 268 115 269 Q108 268 101 257Z" fill="#d97706" />
      <g fill="#d97706">
        <rect x="82" y="462" width="8" height="22" rx="4" />
        <rect x="70" y="480" width="22" height="7" rx="3" />
        <rect x="66" y="476" width="8" height="14" rx="3" transform="rotate(-20 66 476)" />
        <rect x="89" y="476" width="8" height="14" rx="3" transform="rotate(20 89 476)" />
        <rect x="126" y="462" width="8" height="22" rx="4" />
        <rect x="114" y="480" width="22" height="7" rx="3" />
        <rect x="110" y="476" width="8" height="14" rx="3" transform="rotate(-20 110 476)" />
        <rect x="133" y="476" width="8" height="14" rx="3" transform="rotate(20 133 476)" />
      </g>
      <rect x="40" y="483" width="150" height="16" rx="8" fill="#92400e" />
      <rect x="40" y="483" width="150" height="6" rx="3" fill="#b45309" />
    </svg>
  );
}

function PythonIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M31 8c-10 0-12 5-12 12v7h18v2H12C5 29 2 35 2 42s4 14 10 14h7v-10c0-7 6-13 13-13h18c6 0 11-5 11-11V20c0-8-7-12-14-12H31Z" fill="#3776AB" />
      <circle cx="25" cy="16" r="2.4" fill="#fff" />
      <path d="M33 56c10 0 12-5 12-12v-7H27v-2h25c7 0 10-6 10-13s-4-14-10-14h-7v10c0 7-6 13-13 13H14c-6 0-11 5-11 11v2c0 8 7 12 14 12h16Z" fill="#FFD43B" />
      <circle cx="39" cy="48" r="2.4" fill="#fff" />
    </svg>
  );
}

function JavascriptIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" fill="#F7DF1E" rx="2" />
      <text x="16" y="42" fontFamily={SANS_FONT} fontWeight="800" fontSize="24" fill="#1a2332">
        JS
      </text>
    </svg>
  );
}

function TypescriptIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" fill="#3178C6" rx="2" />
      <text x="14" y="42" fontFamily={SANS_FONT} fontWeight="800" fontSize="24" fill="#ffffff">
        TS
      </text>
    </svg>
  );
}

function GoIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="6" y="38" fontFamily={SANS_FONT} fontWeight="800" fontSize="24" fill="#00ADD8">
        Go
      </text>
      <circle cx="50" cy="24" r="5" fill="#00ADD8" />
      <circle cx="52" cy="22" r="1.4" fill="#1a2332" />
    </svg>
  );
}

function JavaIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24 44h20c0 7-4 12-10 12s-10-5-10-12Z" fill="#f97316" />
      <path d="M20 40h28" stroke="#1a2332" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 32c5 0 8 2 8 5s-3 5-8 5" fill="none" stroke="#1a2332" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 10c6 4-2 8 4 12" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 14c6 4-2 8 4 12" fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LuaIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="28" cy="32" r="24" fill="#2C5AA0" />
      <circle cx="45" cy="19" r="8" fill="#9DB7E5" />
      <text x="15" y="37" fontFamily={SANS_FONT} fontWeight="700" fontSize="13" fill="#ffffff">
        Lua
      </text>
    </svg>
  );
}

function SqlIcon({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="32" cy="16" rx="18" ry="8" fill="#cfd4db" />
      <path d="M14 16v22c0 4 8 8 18 8s18-4 18-8V16" fill="#b8c0ca" />
      <ellipse cx="32" cy="38" rx="18" ry="8" fill="#d6dbe1" />
      <text x="22" y="41" fontFamily={SANS_FONT} fontWeight="800" fontSize="10" fill="#495261">
        SQL
      </text>
    </svg>
  );
}

function FlameIcon({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 52" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 2c4 8 2 13-1 18 8-2 14 6 14 14 0 10-7 16-14 16S6 44 6 34c0-7 4-12 9-16-1 6 1 10 4 13 4-4 6-9 2-29Z" fill="#e8820c" />
      <path d="M20 18c3 5 2 9 0 12 5-1 8 3 8 8 0 6-4 10-8 10s-8-4-8-10c0-4 2-7 5-9 0 3 1 5 3 7 2-2 3-5 0-18Z" fill="#f5b253" />
    </svg>
  );
}

function renderIcon(kind: IconKind) {
  switch (kind) {
    case "python":
      return <PythonIcon />;
    case "javascript":
      return <JavascriptIcon />;
    case "typescript":
      return <TypescriptIcon />;
    case "go":
      return <GoIcon />;
    case "java":
      return <JavaIcon />;
    case "lua":
      return <LuaIcon />;
    case "sql":
      return <SqlIcon />;
  }
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0 0L8 4L0 8" fill="none" stroke="rgba(104,110,255,0.78)" strokeWidth="1.5" />
    </marker>
  );
}

function getCardStyle(card: CardSpec): CSSProperties {
  return {
    position: "absolute",
    left: card.x,
    top: card.y,
    width: card.w,
    height: card.h,
    background: card.tone === "dark" ? COLORS.navy : card.tone === "orange" ? COLORS.orange : COLORS.creamCard,
    border: card.tone === "light" ? `1px solid ${COLORS.border}` : "1px solid transparent",
    borderRadius: card.id === "functions" ? "0 3px 3px 0" : 4,
    borderLeft: card.id === "functions" ? `4px solid ${COLORS.orange}` : undefined,
    zIndex: card.zIndex ?? 3,
    overflow: "hidden",
    transform: `rotate(${card.rotation}deg)`,
    pointerEvents: "auto",
    willChange: "transform, opacity, filter",
  };
}

function getAmbientElementStyle(element: AmbientElementSpec): CSSProperties {
  if (element.kind === "code") {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: element.width,
      maxWidth: 160,
      minHeight: element.height,
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "rgba(0,0,0,0.04)",
      color: "rgba(26,35,50,0.72)",
      fontFamily: MONO_FONT,
      fontSize: 11,
      lineHeight: 1.45,
      whiteSpace: "pre-wrap",
      pointerEvents: "none",
      opacity: 0,
      zIndex: 2,
      willChange: "transform, opacity",
      transform: `translate3d(${element.worldX}px, ${element.worldY}px, 0) rotate(${element.rotation}deg)`,
    };
  }

  if (element.kind === "stat") {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      minWidth: element.width,
      height: element.height,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.1)",
      background: "rgba(255,255,255,0.8)",
      color: "rgba(26,35,50,0.72)",
      fontFamily: SANS_FONT,
      fontSize: 12,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      opacity: 0,
      zIndex: 2,
      whiteSpace: "nowrap",
      willChange: "transform, opacity",
      transform: `translate3d(${element.worldX}px, ${element.worldY}px, 0)`,
    };
  }

  if (element.kind === "note") {
    const tone =
      element.tone === "sage"
        ? "#dcfce7"
        : element.tone === "peach"
          ? "#fed7aa"
          : element.tone === "sky"
            ? "#dbeafe"
            : "#fef3c7";

    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: 80,
      height: 60,
      padding: 8,
      borderRadius: 4,
      background: tone,
      color: "rgba(26,35,50,0.74)",
      fontFamily: SANS_FONT,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.2,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      boxShadow: "0 8px 18px rgba(26,35,50,0.08)",
      pointerEvents: "none",
      opacity: 0,
      zIndex: 3,
      willChange: "transform, opacity",
      transform: `translate3d(${element.worldX}px, ${element.worldY}px, 0) rotate(${element.rotation}deg)`,
    };
  }

  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    borderRadius: 999,
    border: "1px solid rgba(26,35,50,0.12)",
    background: "rgba(255,255,255,0.42)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.16) inset",
    pointerEvents: "none",
    opacity: 0,
    zIndex: 1,
    willChange: "transform, opacity",
    transform: `translate3d(${element.worldX}px, ${element.worldY}px, 0)`,
  };
}

function renderCardContent(card: CardSpec, pushRoute: (path: string) => void, learnerCount: string): ReactNode {
  const isDark = card.tone === "dark";

  if (card.id === "hero") {
    return (
      <div style={{ padding: "36px 36px 30px", height: "100%" }}>
        <p style={{ ...labelStyle(false), color: COLORS.orange, letterSpacing: "0.14em" }}>PICO</p>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 60, lineHeight: 0.94, fontWeight: 900, color: COLORS.navy }}>Select.</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 60, lineHeight: 0.94, fontWeight: 900, color: COLORS.orange }}>
            Practice. Verify.
          </div>
        </div>
        <p style={{ marginTop: 16, fontFamily: SANS_FONT, fontSize: 14, lineHeight: 1.65, color: COLORS.mutedBody }}>
          Learn Python, JavaScript, Lua, SQL, and more through short timed lessons, varied question types, and build-focused libraries.
        </p>
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" data-ui="true" onClick={() => pushRoute("/signup")} style={buttonStyle("navy")}>
            Create Account
          </button>
          <button type="button" data-ui="true" onClick={() => pushRoute("/learn")} style={buttonStyle("ghost")}>
            Open Courses
          </button>
        </div>
        <div style={{ marginTop: 26, height: 1, background: "rgba(26,35,50,0.08)" }} />
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <span style={{ fontFamily: SANS_FONT, fontSize: 11, letterSpacing: "0.04em", color: COLORS.mutedLabel }}>
            Free to start · No time limit · 7 languages
          </span>
          <div style={{ flex: 1, minWidth: 120, height: 3, background: "rgba(232,130,12,0.18)", position: "relative", overflow: "hidden" }}>
            <div className="hero-sweep" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(232,130,12,0.94), transparent)" }} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: "12px 12px 10px" }}>
            <div style={labelStyle(false)}>LEARNERS</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1, fontWeight: 900 }}>{learnerCount}</div>
          </div>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: "12px 12px 10px" }}>
            <div style={labelStyle(false)}>SESSIONS</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1, fontWeight: 900 }}>5m</div>
          </div>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: "12px 12px 10px" }}>
            <div style={labelStyle(false)}>LIBRARIES</div>
            <div style={{ marginTop: 6, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1, fontWeight: 900 }}>8</div>
          </div>
        </div>
      </div>
    );
  }

  if (card.id === "preview") {
    return (
      <div style={{ height: "100%", position: "relative" }}>
        <div style={{ height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "rgba(255,255,255,0.06)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f56" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffbd2e" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#27c93f" }} />
          <span style={{ marginLeft: "auto", ...labelStyle(true) }}>PREVIEW</span>
        </div>
        <PicoBirdMark size={54} style={{ position: "absolute", top: 12, right: 12 }} />
        <div style={{ display: "flex", gap: 6, padding: "12px 14px 0" }}>
          {["Python", "JavaScript", "Lua"].map((label, index) => (
            <span
              key={label}
              style={{
                padding: "4px 10px",
                borderRadius: 2,
                background: index === 0 ? COLORS.orange : "rgba(255,255,255,0.07)",
                color: index === 0 ? COLORS.navy : "rgba(245,240,232,0.5)",
                fontFamily: SANS_FONT,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ padding: "16px 14px", fontFamily: MONO_FONT, fontSize: 12, lineHeight: 1.72, color: COLORS.cream }}>
          <div style={{ color: "rgba(245,240,232,0.35)" }}># Data Science</div>
          <div>
            <span style={{ color: COLORS.orange }}>import</span> turtle
          </div>
          <div>pen = turtle.Turtle()</div>
          <div>pen.forward(80)</div>
          <div>pen.left(90)</div>
          <div>pen.forward(80)</div>
          <div className="preview-cursor" style={{ marginTop: 4, width: 12, height: 2, background: COLORS.green }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: SANS_FONT, fontSize: 11, color: "rgba(245,240,232,0.5)" }}>Use Turtle, variables, loops, and functions.</p>
        </div>
      </div>
    );
  }

  if (card.id === "sessions") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>SESSIONS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 29, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>Run 5 minutes.</p>
        <p style={{ marginTop: 10, ...bodyStyle(false) }}>Complete short lessons and keep progress saved.</p>
      </div>
    );
  }

  if (card.id === "placement") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(true)}>PLACEMENT</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.05, fontWeight: 900, color: COLORS.cream }}>Start accurately.</p>
        <p style={{ marginTop: 10, ...bodyStyle(true) }}>Skip repeated basics when prior knowledge exists.</p>
      </div>
    );
  }

  if (card.id === "functions") {
    return (
      <div style={{ padding: "24px 24px 24px 20px", height: "100%" }}>
        <p style={labelStyle(false)}>FUNCTIONS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>Open technical tools.</p>
        <p style={{ marginTop: 12, ...bodyStyle(false) }}>
          Use lessons, placement, and library modules. Open Turtle, Fetch, Canvas, SQL, and Roblox tools from the same app.
        </p>
        <button
          type="button"
          data-ui="true"
          onClick={() => pushRoute("/learn")}
          style={{
            marginTop: 16,
            border: "none",
            background: "transparent",
            padding: 0,
            color: COLORS.orange,
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          OPEN COURSES →
        </button>
      </div>
    );
  }

  if (card.id === "languages") {
    const rows = [
      ["Python", "Most popular"],
      ["JavaScript", "Web and apps"],
      ["TypeScript", "Typed JS"],
      ["Go", "Performance"],
      ["Java", "Enterprise"],
      ["Lua", "Roblox and games"],
      ["SQL", "Databases"],
    ];

    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>LANGUAGES</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 34, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>7 languages.</p>
        <div style={{ marginTop: 18 }}>
          {rows.map(([name, detail], index) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "10px 0",
                borderBottom: index === rows.length - 1 ? "none" : "1px solid rgba(26,35,50,0.07)",
              }}
            >
              <span style={{ fontFamily: SANS_FONT, fontSize: 13, fontWeight: 700, color: COLORS.navy }}>{name}</span>
              <span style={{ fontFamily: SANS_FONT, fontSize: 11, color: COLORS.mutedLabel }}>{detail}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "question-types") {
    const items = [
      "Multiple choice output",
      "Fill in the blank",
      "Spot the bug",
      "Arrange the lines",
      "Predict the output",
      "Word bank",
      "True or false",
    ];

    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>QUESTION TYPES</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 26, lineHeight: 1.08, fontWeight: 900, color: COLORS.navy }}>
          Never the same format twice.
        </p>
        <div style={{ marginTop: 18 }}>
          {items.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(26,35,50,0.06)" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.orange }} />
              <span style={{ fontFamily: SANS_FONT, fontSize: 13, color: COLORS.navy }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "lessons") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(true)}>LESSONS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 29, lineHeight: 1.05, fontWeight: 900, color: COLORS.cream }}>Use short lessons.</p>
        <p style={{ marginTop: 10, ...bodyStyle(true) }}>Practice syntax, outputs, challenges, and libraries.</p>
      </div>
    );
  }

  if (card.id === "path") {
    const learnBoxes = ["EXPLAIN", "Q1", "Q2", "Q3"];
    const practiceBoxes = ["Q1", "Q2", "Q3", "Q4", "Q5"];

    return (
      <div style={{ padding: 28, height: "100%" }}>
        <p style={labelStyle(false)}>THE PATH</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>5 lessons per concept.</p>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 24px 1fr 24px 1fr", gap: 10, alignItems: "start" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ ...labelStyle(false), color: COLORS.orange }}>LEARN</p>
            <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
              {learnBoxes.map((box) => (
                <div key={box} style={{ height: 28, borderRadius: 2, background: COLORS.navy, color: COLORS.cream, fontFamily: SANS_FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {box}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 118, color: COLORS.mutedLabel }}>→</div>
          <div style={{ textAlign: "center" }}>
            <p style={{ ...labelStyle(false), color: COLORS.orange }}>PRACTICE</p>
            <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
              {practiceBoxes.map((box, index) => (
                <div key={box} style={{ height: 28, borderRadius: 2, background: index > 2 ? "rgba(26,35,50,0.88)" : COLORS.navy, color: COLORS.cream, fontFamily: SANS_FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {box}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 118, color: COLORS.mutedLabel }}>→</div>
          <div style={{ textAlign: "center", paddingTop: 14 }}>
            <div className="mini-star-pulse" style={{ width: 48, height: 48, margin: "0 auto", borderRadius: 2, background: COLORS.orange, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 900 }}>
              □
            </div>
            <p style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 12, fontWeight: 700, color: COLORS.navy }}>Unit complete</p>
          </div>
        </div>
        <p style={{ marginTop: 18, fontFamily: SANS_FONT, fontSize: 11, color: COLORS.mutedBody, fontStyle: "italic" }}>
          Hearts lost on wrong answers. XP gained on correct.
        </p>
      </div>
    );
  }

  if (card.id === "roblox") {
    return (
      <div style={{ padding: 28, height: "100%" }}>
        <p style={{ ...labelStyle(false), color: "rgba(26,35,50,0.70)", fontSize: 9, letterSpacing: "0.14em" }}>NEW · BETA</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 38, lineHeight: 1, fontWeight: 900, color: COLORS.navy }}>Roblox Studio.</p>
        <p style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 13, lineHeight: 1.65, color: "rgba(26,35,50,0.72)" }}>
          Build real games with Lua. Studio UI through scripting, events, data, polish, and publishing.
        </p>
        <p style={{ marginTop: 8, fontFamily: SANS_FONT, fontSize: 11, color: "rgba(26,35,50,0.52)" }}>
          Units 1–11. Ship your first game.
        </p>
      </div>
    );
  }

  if (card.id === "shop") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(true)}>SHOP</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.04, fontWeight: 900, color: COLORS.cream }}>Spend your XP.</p>
        <p style={{ marginTop: 10, ...bodyStyle(true) }}>Unlock cosmetics, avatars, and theme packs from the XP shop.</p>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {["A", "B", "C", "?"].map((item, index) => (
            <div
              key={item}
              className={`shop-item-card shop-item-${index + 1}`}
              style={{
                width: 52,
                height: 52,
                borderRadius: 2,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 900, color: "rgba(245,240,232,0.3)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "mini-courses") {
    const entries = [
      ["Turtle Graphics", "Python", false],
      ["Pygame", "Python", false],
      ["Roblox Studio", "Lua", true],
      ["Random", "Python", false],
      ["Canvas API", "JavaScript", false],
      ["Fetch API", "JavaScript", false],
      ["Data Science", "Python", false],
      ["SQL Queries", "SQL", false],
    ] as const;

    return (
      <div style={{ padding: 28 }}>
        <p style={labelStyle(false)}>LIBRARIES</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 38, lineHeight: 1.02, fontWeight: 900, color: COLORS.navy }}>Go deeper.</p>
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 16 }}>
          {entries.map(([name, language, highlight]) => (
            <div key={name}>
              <div style={{ fontFamily: SANS_FONT, fontSize: 13, fontWeight: 700, color: highlight ? COLORS.orange : COLORS.navy }}>{name}</div>
              <div style={{ marginTop: 2, fontFamily: SANS_FONT, fontSize: 10, color: COLORS.mutedLabel }}>{language}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 22, fontFamily: SANS_FONT, fontSize: 11, color: COLORS.mutedBody }}>
          Unlock after completing Unit 1 of the language.
        </p>
      </div>
    );
  }

  if (card.id === "creator-tools") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>CREATOR TOOLS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 32, lineHeight: 1.04, fontWeight: 900, color: COLORS.navy }}>Build and verify.</p>
        <p style={{ marginTop: 10, ...bodyStyle(false) }}>Open a library, learn the API, then use project-driven lessons to apply the tool in context.</p>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["Turtle", "Canvas", "Fetch", "Roblox"].map((item, index) => (
            <div
              key={item}
              style={{
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: index === 3 ? "rgba(232,130,12,0.14)" : COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2,
                fontFamily: SANS_FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: index === 3 ? COLORS.orange : COLORS.navy,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "progress") {
    const rows = [
      ["STREAK", "Keep a daily streak for bonus XP."],
      ["HEARTS", "5 hearts per session. Wrong answers cost one."],
      ["XP", "Correct answers earn XP. Spend it in the shop."],
    ];

    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>PROGRESS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>Streaks. Hearts. XP.</p>
        <div style={{ marginTop: 16 }}>
          {rows.map(([heading, copy], index) => (
            <div key={heading} style={{ padding: "10px 0", borderBottom: index === rows.length - 1 ? "none" : "1px solid rgba(26,35,50,0.07)" }}>
              <div style={{ fontFamily: SANS_FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: COLORS.orange }}>
                {heading}
              </div>
              <div style={{ marginTop: 4, fontFamily: SANS_FONT, fontSize: 12, lineHeight: 1.55, color: COLORS.mutedBody }}>
                {copy}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "stats") {
    return (
      <div style={{ padding: 28 }}>
        {[
          [learnerCount, "learners"],
          ["4.9", "avg rating"],
          ["14", "day avg streak"],
        ].map(([value, label], index, list) => (
          <div key={label}>
            <div style={{ fontFamily: DISPLAY_FONT, fontSize: 44, lineHeight: 1, fontWeight: 900, color: COLORS.navy }}>{value}</div>
            <div style={{ marginTop: 2, fontFamily: SANS_FONT, fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(26,35,50,0.60)" }}>
              {label}
            </div>
            {index < list.length - 1 ? <div style={{ margin: "16px 0", height: 1, background: "rgba(26,35,50,0.15)" }} /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (card.id === "leaderboard") {
    const rows = [
      { rank: "#1", initials: "AK", name: "AK", language: "Python", xp: "12,400 XP", rankColor: COLORS.orange, avatar: "#f6bd50", text: "#4a2500" },
      { rank: "#2", initials: "SR", name: "SR", language: "JavaScript", xp: "11,200 XP", rankColor: "rgba(245,240,232,0.6)", avatar: "#d7dfeb", text: "#1a2332" },
      { rank: "#3", initials: "JM", name: "JM", language: "Lua", xp: "9,800 XP", rankColor: "rgba(245,240,232,0.5)", avatar: "#95e7b0", text: "#114b26" },
      { rank: "#4", initials: "TL", name: "TL", language: "Go", xp: "8,100 XP", rankColor: "rgba(245,240,232,0.35)", avatar: "#a6d2ff", text: "#14304f" },
      { rank: "#5", initials: "PR", name: "PR", language: "TypeScript", xp: "7,400 XP", rankColor: "rgba(245,240,232,0.28)", avatar: "#f8bfd2", text: "#4f1932" },
    ];

    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(true)}>LEADERBOARD</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 30, lineHeight: 1.04, fontWeight: 900, color: COLORS.cream }}>Who&apos;s on top?</p>
        <div style={{ marginTop: 16 }}>
          {rows.map((row) => (
            <div key={row.rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ width: 20, fontFamily: SANS_FONT, fontSize: 18, fontWeight: 800, color: row.rankColor }}>{row.rank}</span>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: row.avatar, color: row.text, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: SANS_FONT, fontSize: 10, fontWeight: 700 }}>
                {row.initials}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS_FONT, fontSize: 12, fontWeight: 700, color: COLORS.cream }}>{row.name}</div>
                <div style={{ fontFamily: SANS_FONT, fontSize: 10, color: "rgba(245,240,232,0.45)" }}>{row.language}</div>
              </div>
              <div style={{ fontFamily: SANS_FONT, fontSize: 12, fontWeight: 700, color: COLORS.orange }}>{row.xp}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "placement-callout") {
    return (
      <div style={{ padding: 22 }}>
        <p style={labelStyle(false)}>PLACEMENT</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 24, lineHeight: 1.08, fontWeight: 900, color: COLORS.navy }}>Know it already?</p>
        <p style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 12, lineHeight: 1.65, color: COLORS.mutedBody }}>
          Take a placement test and skip ahead to where you actually belong.
        </p>
        <button
          type="button"
          data-ui="true"
          onClick={() => pushRoute("/placement")}
          style={{
            marginTop: 12,
            border: "none",
            background: "transparent",
            padding: 0,
            color: COLORS.orange,
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          TAKE TEST →
        </button>
      </div>
    );
  }

  if (card.id === "testimonial-1") {
    return (
      <div style={{ padding: 24, position: "relative", height: "100%" }}>
        <div style={{ position: "absolute", top: 16, left: 20, fontFamily: DISPLAY_FONT, fontSize: 52, color: "rgba(26,35,50,0.08)", fontWeight: 900 }}>
          &ldquo;
        </div>
        <p style={{ position: "relative", fontFamily: SANS_FONT, fontSize: 14, lineHeight: 1.65, color: COLORS.navy, fontStyle: "italic", paddingLeft: 8 }}>
          I tried six apps and quit all of them. Pico is the only one I&apos;ve opened every day for a month.
        </p>
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(26,35,50,0.1)", color: COLORS.navy, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: SANS_FONT, fontSize: 11, fontWeight: 700 }}>
            AK
          </span>
          <div>
            <div style={{ fontFamily: SANS_FONT, fontSize: 12, fontWeight: 700, color: COLORS.navy }}>Alex K.</div>
            <div style={{ fontFamily: SANS_FONT, fontSize: 10, color: COLORS.mutedLabel }}>Python · 34 day streak</div>
          </div>
        </div>
      </div>
    );
  }

  if (card.id === "security") {
    return (
      <div style={{ padding: 24 }}>
        <p style={labelStyle(false)}>SYSTEMS</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 31, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>Real progress, not noise.</p>
        <p style={{ marginTop: 10, ...bodyStyle(false) }}>
          Placement, streaks, hearts, and XP create a clear feedback loop. You always know what changed after a session.
        </p>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {["Correct answer → XP", "Missed answer → one heart", "Daily return → streak bonus"].map((row) => (
            <div key={row} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS_FONT, fontSize: 12, color: COLORS.navy }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.orange }} />
              {row}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.id === "signal") {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ ...labelStyle(false), color: "rgba(26,35,50,0.7)" }}>SIGNAL</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 38, lineHeight: 1.02, fontWeight: 900, color: COLORS.navy }}>Keep moving.</p>
        <p style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 13, lineHeight: 1.65, color: "rgba(26,35,50,0.72)" }}>
          Short sessions, visible completion, and a board that tells you what matters next.
        </p>
      </div>
    );
  }

  if (card.id === "testimonial-2") {
    return (
      <div style={{ padding: 24, height: "100%" }}>
        <p style={{ fontFamily: SANS_FONT, fontSize: 14, lineHeight: 1.65, color: COLORS.cream, fontStyle: "italic" }}>
          My kid opened Studio and built his first obby the same weekend he started the Roblox course.
        </p>
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", color: COLORS.cream, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: SANS_FONT, fontSize: 11, fontWeight: 700 }}>
            JM
          </span>
          <div>
            <div style={{ fontFamily: SANS_FONT, fontSize: 12, fontWeight: 700, color: COLORS.cream }}>JM</div>
            <div style={{ fontFamily: SANS_FONT, fontSize: 10, color: "rgba(245,240,232,0.45)" }}>Parent · Roblox Studio</div>
          </div>
        </div>
      </div>
    );
  }

  if (card.id === "cta") {
    return (
      <div style={{ padding: "52px 52px 48px", position: "relative", height: "100%" }}>
        <p style={labelStyle(true)}>ACCOUNT</p>
        <p style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 58, lineHeight: 0.98, fontWeight: 900, color: COLORS.cream }}>Create your account.</p>
        <p style={{ marginTop: 12, fontFamily: SANS_FONT, fontSize: 15, lineHeight: 1.68, color: COLORS.mutedCream, maxWidth: 440 }}>
          Free to start. No time limit on lessons. Join 50,000 learners building real coding skill.
        </p>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button type="button" data-ui="true" onClick={() => pushRoute("/signup")} style={buttonStyle("orange")}>
            Create Account
          </button>
          <button type="button" data-ui="true" onClick={() => pushRoute("/learn")} style={buttonStyle("ghost-dark")}>
            Open Courses
          </button>
        </div>
        <div style={{ position: "absolute", right: 48, top: "50%", transform: "translateY(-50%)", textAlign: "right" }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 88, lineHeight: 0.92, fontWeight: 900, color: "rgba(245,240,232,0.06)" }}>
            50k
          </div>
          <div style={{ fontFamily: SANS_FONT, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(245,240,232,0.12)" }}>
            learners
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={labelStyle(isDark)}>CARD</p>
    </div>
  );
}

function HomePage() {
  const router = useRouter();
  const storyRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const sceneMoodRef = useRef<HTMLDivElement | null>(null);
  const dotGridRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const regionTitleRef = useRef<HTMLDivElement | null>(null);
  const regionTitleOutRef = useRef<HTMLDivElement | null>(null);
  const regionBodyRef = useRef<HTMLDivElement | null>(null);
  const gradientARef = useRef<HTMLDivElement | null>(null);
  const gradientBRef = useRef<HTMLDivElement | null>(null);
  const gradientCRef = useRef<HTMLDivElement | null>(null);
  const routePathRef = useRef<SVGPathElement | null>(null);
  const worldNodeRefs = useRef<Record<string, HTMLElement | SVGElement | null>>({});
  const seenCardsRef = useRef<Set<string>>(new Set());
  const cardLastSeenSceneRef = useRef<Record<string, string>>({});
  const progressBarAnimatingRef = useRef(false);

  const [learnerCount, setLearnerCount] = useState("50k+");
  const [storyHeight, setStoryHeight] = useState(6200);
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 });
  const [activeSceneId, setActiveSceneId] = useState(STORY_SCENES[0].id);

  const currentProgressRef = useRef(0);
  const storyTravelRef = useRef(1);
  const cameraRef = useRef({ x: 0, y: 0 });
  const scrollPhysicsRef = useRef({
    progressVelocity: 0,
    targetProgress: 0,
  });
  const currentMoodRef = useRef<SceneMoodChannels>({ r: 0, g: 0, b: 0, a: 0 });
  const scrollDirectionRef = useRef<"forward" | "backward">("forward");
  const prevProgressRef = useRef(0);
  const cardEntranceMetaRef = useRef<Record<string, CardEntranceMeta>>({});
  const routeLengthRef = useRef(0);
  const viewportRef = useRef({ width: 1440, height: 900 });
  const activeSceneRef = useRef(STORY_SCENES[0].id);
  const horizontalTrack = useMemo(
    () => buildHorizontalTrack(viewportSize.width, viewportSize.height),
    [viewportSize.height, viewportSize.width],
  );
  const ambientElements = useMemo(
    () => buildAmbientElements(horizontalTrack.cards, horizontalTrack.totalWidth, horizontalTrack.totalHeight),
    [horizontalTrack],
  );

  const registerNode = (id: string, node: HTMLElement | SVGElement | null) => {
    worldNodeRefs.current[id] = node;
  };

  useEffect(() => {
    console.log("camera source: single-system");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (active) {
        setLearnerCount(formatLearnerCount(count));
      }
    }

    loadCount().catch(() => {
      if (active) {
        setLearnerCount("50k+");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateMetrics = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const track = buildHorizontalTrack(viewportWidth, viewportHeight);
      const totalTravel = Math.max(
        1,
        getEstimatedStoryScrollDistance(viewportWidth, track.pathMetrics.total),
      );

      setViewportSize({ width: viewportWidth, height: viewportHeight });
      viewportRef.current = { width: viewportWidth, height: viewportHeight };
      storyTravelRef.current = totalTravel;
      setStoryHeight(viewportHeight + totalTravel);
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  useEffect(() => {
    const entranceMeta: Record<string, CardEntranceMeta> = {};

    for (const layout of HORIZONTAL_SCENE_LAYOUTS) {
      const sceneCards = layout.cards
        .map((placement) => horizontalTrack.cards.find((card) => card.id === placement.id))
        .filter((card): card is CardSpec => card !== undefined)
        .sort((a, b) => a.x - b.x);

      sceneCards.forEach((card, index) => {
        entranceMeta[card.id] = {
          sceneId: layout.sceneId,
          indexWithinScene: index,
          totalInScene: sceneCards.length,
        };
      });
    }

    const initialProgress = clamp(currentProgressRef.current, 0, 1);
    const initialSample = samplePath(horizontalTrack.pathMetrics, initialProgress);
    const initialCamX = clamp(
      initialSample.x - viewportRef.current.width / 2,
      0,
      Math.max(0, horizontalTrack.totalWidth - viewportRef.current.width),
    );
    const initialCamY = clamp(
      initialSample.y - viewportRef.current.height / 2,
      0,
      Math.max(0, horizontalTrack.totalHeight - viewportRef.current.height),
    );
    cameraRef.current.x = initialCamX;
    cameraRef.current.y = initialCamY;
    currentProgressRef.current = initialProgress;
    prevProgressRef.current = initialProgress;
    scrollPhysicsRef.current.targetProgress = initialProgress;
    scrollPhysicsRef.current.progressVelocity = 0;
    const initialVisibleRect = {
      x: initialCamX - 600,
      y: initialCamY - 600,
      w: viewportRef.current.width + 1200,
      h: viewportRef.current.height + 1200,
    };
    const seen = new Set<string>();
    const lastSeenScene: Record<string, string> = {};

    for (const card of horizontalTrack.cards) {
      const rect = { x: card.x, y: card.y, w: card.w, h: card.h };
      if (intersects(rect, initialVisibleRect)) {
        seen.add(card.id);
        lastSeenScene[card.id] = entranceMeta[card.id]?.sceneId ?? activeSceneRef.current;
      }
    }

    cardEntranceMetaRef.current = entranceMeta;
    seenCardsRef.current = seen;
    cardLastSeenSceneRef.current = lastSeenScene;
  }, [horizontalTrack]);

  useEffect(() => {
    const routePath = routePathRef.current;
    if (!routePath) return;

    try {
      const routeLength = routePath.getTotalLength();
      routeLengthRef.current = routeLength;
      routePath.style.strokeDasharray = `${routeLength}`;
      routePath.style.strokeDashoffset = `${routeLength}`;
    } catch {
      routeLengthRef.current = 0;
    }
  }, [horizontalTrack]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const story = storyRef.current;
      if (!story) return;

      const rect = story.getBoundingClientRect();
      const storyIsPinned =
        rect.top <= 1 &&
        rect.bottom >= window.innerHeight - 1;

      if (!storyIsPinned) return;

      const physics = scrollPhysicsRef.current;
      const movingDown = event.deltaY > 0;
      const movingUp = event.deltaY < 0;
      const atStart =
        physics.targetProgress <= 0.001 &&
        currentProgressRef.current <= 0.01 &&
        Math.abs(physics.progressVelocity) < 0.0008;
      const atEnd =
        physics.targetProgress >= 0.999 &&
        currentProgressRef.current >= 0.99 &&
        Math.abs(physics.progressVelocity) < 0.0008;
      const shouldCapture =
        (movingDown && !atEnd) ||
        (movingUp && !atStart);

      if (!shouldCapture) return;

      event.preventDefault();
      window.scrollTo({ top: story.offsetTop });

      const deltaProgress = normalizeWheelDelta(event) / Math.max(1, storyTravelRef.current);
      physics.targetProgress = clamp(
        physics.targetProgress + deltaProgress * SCROLL_INPUT_GAIN,
        0,
        1,
      );
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let time = 0;
    let lastFrameTime = 0;

    const findNearestScene = (progress: number) => {
      let nearest = horizontalTrack.scenes[0];
      let distance = Number.POSITIVE_INFINITY;

      for (const scene of horizontalTrack.scenes) {
        const next = Math.abs(scene.progress - progress);
        if (next < distance) {
          distance = next;
          nearest = scene;
        }
      }

      return { nearest, distance };
    };

    const updateSceneInfo = (progress: number) => {
      const { nearest } = findNearestScene(progress);

      if (nearest.id !== activeSceneRef.current) {
        const previousSceneIndex = horizontalTrack.scenes.findIndex((scene) => scene.id === activeSceneRef.current);
        const nextSceneIndex = horizontalTrack.scenes.findIndex((scene) => scene.id === nearest.id);

        if (nextSceneIndex >= 0 && previousSceneIndex >= 0 && nextSceneIndex < previousSceneIndex) {
          const sceneIndexById = Object.fromEntries(
            horizontalTrack.scenes.map((scene, index) => [scene.id, index]),
          ) as Record<string, number>;

          Object.entries(cardEntranceMetaRef.current).forEach(([cardId, meta]) => {
            const cardSceneIndex = sceneIndexById[meta.sceneId];
            if (cardSceneIndex > nextSceneIndex) {
              seenCardsRef.current.delete(cardId);
              delete cardLastSeenSceneRef.current[cardId];
            }
          });
        }

        activeSceneRef.current = nearest.id;
        setActiveSceneId(nearest.id);

        const titleOut = regionTitleOutRef.current;
        const titleIn = regionTitleRef.current;
        const body = regionBodyRef.current;

        if (titleOut && titleIn) {
          titleOut.textContent = titleIn.textContent;
          titleOut.style.position = "absolute";
          titleOut.style.left = "0";
          titleOut.style.right = "0";
          titleOut.style.top = "0";
          titleOut.style.transition = "opacity 180ms ease-out, transform 200ms ease-in";
          titleOut.style.opacity = "1";
          titleOut.style.transform = "translateX(0)";
          titleIn.style.transition = "none";
          titleIn.style.opacity = "0";
          titleIn.style.transform = "translateX(18px)";
          titleIn.textContent = nearest.title;
          requestAnimationFrame(() => {
            titleOut.style.opacity = "0";
            titleOut.style.transform = "translateX(-22px)";
            requestAnimationFrame(() => {
              titleIn.style.transition = "opacity 260ms ease-out 80ms, transform 280ms cubic-bezier(0.22,1,0.36,1) 80ms";
              titleIn.style.opacity = "1";
              titleIn.style.transform = "translateX(0)";
            });
          });
          window.setTimeout(() => {
            if (titleOut.isConnected) {
              titleOut.textContent = "";
              titleOut.style.transition = "";
              titleOut.style.opacity = "0";
              titleOut.style.transform = "";
            }
            if (titleIn.isConnected) {
              titleIn.style.transition = "";
            }
          }, 300);
        }

        if (body) {
          body.style.transition = "opacity 200ms ease-out";
          body.style.opacity = "0";
          window.setTimeout(() => {
            if (body.isConnected) {
              body.textContent = nearest.body;
              body.style.transition = "opacity 260ms ease-in";
              body.style.opacity = "1";
            }
          }, 200);
        }

        if (progressFillRef.current && !progressBarAnimatingRef.current) {
          progressBarAnimatingRef.current = true;
          progressFillRef.current.style.transition = "transform 180ms ease-in";
          progressFillRef.current.style.transform = "scaleX(0)";
          window.setTimeout(() => {
            if (progressFillRef.current) {
              progressFillRef.current.style.transition = "transform 220ms ease-out";
              progressFillRef.current.style.transform = `scaleX(${nearest.progress})`;
            }
            window.setTimeout(() => {
              progressBarAnimatingRef.current = false;
              if (progressFillRef.current) progressFillRef.current.style.transition = "";
            }, 240);
          }, 200);
        }
      }
    };

    const applyTransform = () => {
      const world = worldRef.current;
      if (!world) return;
      world.style.transform = `translate3d(${-cameraRef.current.x}px, ${-cameraRef.current.y}px, 0)`;
      world.style.transformOrigin = "0 0";
    };

    const updateGrid = () => {
      const grid = dotGridRef.current;
      if (!grid) return;
      const tileSize = 28;
      grid.style.backgroundSize = `${tileSize}px ${tileSize}px`;
      grid.style.backgroundPosition = `${(-cameraRef.current.x * 0.05).toFixed(1)}px ${(-cameraRef.current.y * 0.05).toFixed(1)}px`;
    };

    const updateGradients = (progress: number) => {
      const orbit = Math.sin(time * 0.0018);
      if (gradientARef.current) {
        gradientARef.current.style.transform = `translate3d(${cameraRef.current.x * -0.08 + orbit * 44}px, ${cameraRef.current.y * -0.05 - orbit * 18}px, 0)`;
        gradientARef.current.style.opacity = `${0.08 + progress * 0.08}`;
      }
      if (gradientBRef.current) {
        gradientBRef.current.style.transform = `translate3d(${cameraRef.current.x * -0.05 - orbit * 36}px, ${cameraRef.current.y * -0.07 + orbit * 26}px, 0)`;
        gradientBRef.current.style.opacity = `${0.06 + Math.sin(progress * Math.PI) * 0.08}`;
      }
      if (gradientCRef.current) {
        gradientCRef.current.style.transform = `translate3d(${cameraRef.current.x * -0.03 + orbit * 24}px, ${cameraRef.current.y * -0.02 + orbit * 18}px, 0)`;
        gradientCRef.current.style.opacity = `${0.05 + (1 - progress) * 0.08}`;
      }
      const targetMoodValue = SCENE_MOODS[activeSceneRef.current] ?? "rgba(0,0,0,0)";
      const moodMatch = targetMoodValue.match(/rgba\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/);
      const targetMood: SceneMoodChannels = moodMatch
        ? {
            r: Number.parseFloat(moodMatch[1]),
            g: Number.parseFloat(moodMatch[2]),
            b: Number.parseFloat(moodMatch[3]),
            a: Number.parseFloat(moodMatch[4]),
          }
        : { r: 0, g: 0, b: 0, a: 0 };
      const cm = currentMoodRef.current;
      cm.r = lerp(cm.r, targetMood.r, 0.018);
      cm.g = lerp(cm.g, targetMood.g, 0.018);
      cm.b = lerp(cm.b, targetMood.b, 0.018);
      cm.a = lerp(cm.a, targetMood.a, 0.018);
      if (sceneMoodRef.current) {
        sceneMoodRef.current.style.background = `rgba(${cm.r.toFixed(1)},${cm.g.toFixed(1)},${cm.b.toFixed(1)},${cm.a.toFixed(4)})`;
      }
    };

    const updateProgress = () => {
      if (progressFillRef.current && !progressBarAnimatingRef.current) {
        const activeScene = horizontalTrack.scenes.find((scene) => scene.id === activeSceneRef.current) ?? horizontalTrack.scenes[0];
        progressFillRef.current.style.transform = `scaleX(${activeScene.progress})`;
      }
    };

    const updateRoute = () => {
      const routePath = routePathRef.current;
      const routeLength = routeLengthRef.current;
      if (!routePath || routeLength <= 0) return;
      const routeProgress = clamp(currentProgressRef.current, 0, 1);

      routePath.style.strokeDasharray = `${routeLength}`;
      routePath.style.strokeDashoffset = `${((1 - routeProgress) * routeLength).toFixed(1)}`;
      routePath.style.opacity = `${clamp(0.22 + routeProgress * 0.78, 0.22, 1).toFixed(3)}`;
    };

    const updateCards = () => {
      const vw = viewportRef.current.width;
      const vh = viewportRef.current.height;
      const screenCenterX = vw / 2;
      const cameraCenterX = cameraRef.current.x + screenCenterX;
      const cameraCenterY = cameraRef.current.y + vh / 2;
      const heroCardId = SCENE_HERO_CARD[activeSceneRef.current];
      const timeSeconds = time / 1000;
      const cullRect = {
        x: cameraRef.current.x - 920,
        y: cameraRef.current.y - 760,
        w: vw + 1840,
        h: vh + 1520,
      };
      let focusedCardId = heroCardId;
      let focusedCardDistance = Number.POSITIVE_INFINITY;

      for (const card of horizontalTrack.cards) {
        const rect = { x: card.x, y: card.y, w: card.w, h: card.h };
        if (!intersects(rect, cullRect)) continue;
        const dx = card.x + card.w / 2 - cameraCenterX;
        const dy = card.y + card.h / 2 - cameraCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < focusedCardDistance) {
          focusedCardDistance = dist;
          focusedCardId = card.id;
        }
      }

      for (const [cardIndex, card] of horizontalTrack.cards.entries()) {
        const node = worldNodeRefs.current[card.id];
        if (!node || !(node instanceof HTMLElement)) continue;
        const baseBorderColor = card.tone === "light" ? COLORS.border : "transparent";
        const rect = { x: card.x, y: card.y, w: card.w, h: card.h };
        if (!intersects(rect, cullRect)) {
          node.style.visibility = "hidden";
          node.style.pointerEvents = "none";
          node.style.borderColor = baseBorderColor;
          node.style.boxShadow = "none";
          continue;
        }
        node.style.visibility = "visible";
        cardLastSeenSceneRef.current[card.id] = activeSceneRef.current;

        const cardScreenX = card.x + card.w / 2 - cameraRef.current.x;
        const dx = card.x + card.w / 2 - cameraCenterX;
        const dy = card.y + card.h / 2 - cameraCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const proximity = clamp(1 - distance / 900, 0, 1);
        const eased = easeInOutQuad(proximity);
        const focusState = computeFocusState(distance, vw, vh);
        const isHero = heroCardId === card.id;
        const isFocusedCard = focusedCardId === card.id;
        const effectiveFocus = isFocusedCard ? 1 : Math.max(eased, focusState.focus * 0.42);
        const depth = 0.94 + ((card.zIndex ?? 3) - 3) * 0.08 + (isFocusedCard ? 0.03 : 0);
        const depthTransform = applyDepthTransform({
          cameraX: cameraCenterX,
          cameraY: cameraCenterY,
          objectX: rect.x + rect.w / 2,
          objectY: rect.y + rect.h / 2,
          depth,
        });
        const sway = (cardScreenX - screenCenterX) * 0.012;
        const idleMultiplier = isFocusedCard ? 0.5 : 1;
        const idleY = Math.sin(timeSeconds * 0.4 + cardIndex * 1.3) * 2.5 * idleMultiplier;
        const idleR = Math.sin(timeSeconds * 0.25 + cardIndex * 0.9) * 0.3 * idleMultiplier;
        const hoverLift = node.dataset.hovered === "true" ? -10 : 0;
        const hoverScale = node.dataset.hovered === "true" ? 0.02 : 0;
        const pressScale = node.dataset.pressed === "true" ? -0.03 : 0;
        const translateX = sway + depthTransform.offsetX;
        const translateY = depthTransform.offsetY + hoverLift + idleY;
        const emergenceScale = Math.max(
          0.82,
          (isFocusedCard ? 1.04 : 0.88 + eased * 0.12) + hoverScale + pressScale,
        );
        const emergenceTranslateY = isFocusedCard ? 0 : (1 - eased) * 18;
        const dropShadow = isFocusedCard
          ? "drop-shadow(0 24px 44px rgba(26,35,50,0.18))"
          : effectiveFocus > 0.72
            ? "drop-shadow(0 12px 24px rgba(26,35,50,0.10))"
            : "";
        const blur = isFocusedCard ? 0 : (1 - eased) * 5;
        const targetFilter = [
          `blur(${Math.max(0, blur).toFixed(1)}px)`,
          dropShadow,
          `brightness(${(0.9 + effectiveFocus * 0.16).toFixed(3)})`,
          `contrast(${(0.94 + effectiveFocus * 0.16).toFixed(3)})`,
          `saturate(${(0.94 + effectiveFocus * 0.12).toFixed(3)})`,
        ]
          .filter(Boolean)
          .join(" ");
        const existingTransform = `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0) rotate(${(
          card.rotation + idleR
        ).toFixed(2)}deg)`;
        const targetTransform = `${existingTransform} scale(${emergenceScale.toFixed(3)}) translateY(${emergenceTranslateY.toFixed(1)}px)`;

        if (isHero && effectiveFocus > 0.7) {
          node.style.borderColor =
            card.tone === "light"
              ? `rgba(26,35,50,${(0.1 + effectiveFocus * 0.14).toFixed(3)})`
              : "transparent";
        } else {
          node.style.borderColor = baseBorderColor;
        }
        node.style.zIndex = `${(card.zIndex ?? 3) + (isFocusedCard ? 6 : 0)}`;
        node.style.boxShadow = isFocusedCard
          ? "0 34px 90px rgba(26,35,50,0.22), 0 0 0 1px rgba(245,240,232,0.24)"
          : `0 18px 48px rgba(26,35,50,${(0.08 + effectiveFocus * 0.08).toFixed(3)})`;

        node.style.pointerEvents = isFocusedCard || eased > 0.58 ? "auto" : "none";
        node.style.opacity = isFocusedCard ? "1" : eased.toFixed(3);
        node.style.filter = targetFilter;
        node.style.transform = targetTransform;
      }
    };

    const updateAmbientElements = () => {
      const cameraX = cameraRef.current.x;
      const cameraY = cameraRef.current.y;
      const cameraCenterX = cameraX + viewportRef.current.width / 2;
      const cameraCenterY = cameraY + viewportRef.current.height / 2;
      const timeSeconds = time / 1000;

      for (const element of ambientElements) {
        const node = worldNodeRefs.current[element.id];
        if (!node || !(node instanceof HTMLElement)) continue;

        const centerX = element.worldX + element.width / 2;
        const centerY = element.worldY + element.height / 2;
        const dx = centerX - cameraCenterX;
        const dy = centerY - cameraCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = clamp(1 - dist / 1400, 0, 1);
        const floatY = Math.sin(timeSeconds * element.speed + element.phase) * 6;
        const floatX = Math.cos(timeSeconds * element.speed * 0.7 + element.phase) * 3;
        const parallaxX = -(cameraX * (element.depth - 1) * 0.15);
        const parallaxY = -(cameraY * (element.depth - 1) * 0.15);

        node.style.opacity = `${(proximity * 0.65).toFixed(3)}`;
        node.style.transform = `translate3d(${(element.worldX + floatX + parallaxX).toFixed(1)}px, ${(element.worldY + floatY + parallaxY).toFixed(1)}px, 0) rotate(${element.rotation.toFixed(2)}deg)`;
      }
    };

    const updateSeparators = () => {
      horizontalTrack.sceneOrigins.slice(1).forEach((sceneOrigin, index) => {
        const separatorNode = worldNodeRefs.current[`separator-${index}`];
        if (!(separatorNode instanceof HTMLElement)) return;

        const distanceFromCamera = sceneOrigin.x - cameraRef.current.x;
        const normalizedDistance = distanceFromCamera / viewportRef.current.width;
        const finalScaleY =
          distanceFromCamera < 0
            ? 1
            : clamp(1 - normalizedDistance * 2.2, 0, 1);
        const separatorOpacity = clamp(finalScaleY * 0.7, 0, 0.7);
        separatorNode.style.transform = `scaleY(${finalScaleY.toFixed(3)})`;
        separatorNode.style.opacity = `${separatorOpacity.toFixed(3)}`;
      });
    };

    const updateSceneLabels = () => {
      horizontalTrack.scenes.forEach((scene, index) => {
        if (index === 0) return;

        const labelNode = worldNodeRefs.current[`scene-label-${scene.id}`];
        if (!(labelNode instanceof HTMLElement)) return;

        const sceneOrigin = horizontalTrack.sceneOrigins[index];
        const labelDistanceFromCamera = sceneOrigin.x - cameraRef.current.x;
        const labelOpacity = clamp(
          0.18 - Math.abs(labelDistanceFromCamera) / (viewportRef.current.width * 2.2),
          0,
          0.18,
        );
        labelNode.style.opacity = `${labelOpacity.toFixed(3)}`;
        const floatState = applyFloatingAnimation({
          time,
          phase: index * 0.8,
          speed: 0.0012,
          amplitude: 5,
        });
        labelNode.style.transform = `translate3d(${floatState.driftX.toFixed(1)}px, ${floatState.driftY.toFixed(1)}px, 0) rotate(${floatState.rotate.toFixed(2)}deg)`;
      });
    };

    const updateStoryProgress = (deltaSeconds: number) => {
      const physics = scrollPhysicsRef.current;
      const next = smoothDamp(
        currentProgressRef.current,
        physics.targetProgress,
        physics.progressVelocity,
        SCROLL_SMOOTH_TIME,
        MAX_SCROLL_SPEED,
        deltaSeconds,
      );
      currentProgressRef.current = clamp(next.value, 0, 1);
      physics.progressVelocity = next.velocity;

      if (
        Math.abs(physics.progressVelocity) < 0.00004 &&
        Math.abs(physics.targetProgress - currentProgressRef.current) < 0.0005
      ) {
        currentProgressRef.current = physics.targetProgress;
        physics.progressVelocity = 0;
      }
    };

    const getCameraPositionForProgress = (progress: number) => {
      const sample = samplePath(horizontalTrack.pathMetrics, progress);

      return {
        x: clamp(
          sample.x - viewportRef.current.width / 2,
          0,
          Math.max(0, horizontalTrack.totalWidth - viewportRef.current.width),
        ),
        y: clamp(
          sample.y - viewportRef.current.height / 2,
          0,
          Math.max(0, horizontalTrack.totalHeight - viewportRef.current.height),
        ),
      };
    };

    const updateCamera = () => {
      const clampedProgress = clamp(currentProgressRef.current, 0, 1);
      const nextCamera = getCameraPositionForProgress(clampedProgress);
      cameraRef.current.x = nextCamera.x;
      cameraRef.current.y = nextCamera.y;
    };

    const tick = (now: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = now;
      }
      const deltaMilliseconds = Math.min(36, Math.max(10, now - lastFrameTime));
      const deltaSeconds = deltaMilliseconds / 1000;
      lastFrameTime = now;
      time += deltaMilliseconds;
      updateStoryProgress(deltaSeconds);
      const progressDelta = currentProgressRef.current - prevProgressRef.current;
      if (Math.abs(progressDelta) > 0.00002) {
        scrollDirectionRef.current = progressDelta > 0 ? "forward" : "backward";
      }
      prevProgressRef.current = currentProgressRef.current;
      updateCamera();

      const clampedProgress = clamp(currentProgressRef.current, 0, 1);
      updateSceneInfo(clampedProgress);
      applyTransform();
      updateGrid();
      updateGradients(clampedProgress);
      updateProgress();
      updateRoute();
      updateAmbientElements();
      updateCards();
      updateSeparators();
      updateSceneLabels();

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ambientElements, horizontalTrack]);

  const scrollToScene = (scene: StoryScene) => {
    if (!storyRef.current) return;

    const physics = scrollPhysicsRef.current;
    physics.targetProgress = scene.progress;
    physics.progressVelocity = 0;

    window.scrollTo({
      top: storyRef.current.offsetTop,
      behavior: "auto",
    });
  };

  const pushRoute = (path: string) => {
    router.push(path);
  };

  const activeScene = horizontalTrack.scenes.find((scene) => scene.id === activeSceneId) ?? horizontalTrack.scenes[0];

  return (
    <main
      className="story-canvas-page"
      style={{
        background: COLORS.cream,
        color: COLORS.navy,
        fontFamily: SANS_FONT,
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style jsx global>{`
        .story-canvas-page a:hover,
        .story-canvas-page button:hover {
          transform: none !important;
        }

        .story-canvas-page .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .story-canvas-page .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -7px;
          height: 1px;
          background: ${COLORS.navy};
          transform: scaleX(0.2);
          transform-origin: center;
          transition: transform 180ms ease;
        }

        .story-canvas-page .nav-link:hover::after {
          transform: scaleX(1);
        }

        .story-canvas-page .world-card {
          transition: border-color 180ms ease, box-shadow 180ms ease;
          cursor: default;
        }

        .story-canvas-page .world-card:hover {
          border-color: ${COLORS.borderStrong} !important;
        }

        @keyframes heroSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(260%); }
        }

        @keyframes cursorBlink {
          0%, 48% { opacity: 1; }
          52%, 100% { opacity: 0.12; }
        }

        @keyframes connectorDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -180; }
        }

        @keyframes floatNote {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulseTile {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }

        @keyframes shopCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes labelPulse {
          0%, 100% { opacity: 0.86; }
          50% { opacity: 0.58; }
        }

        .story-canvas-page .hero-sweep {
          animation: heroSweep 2.8s linear infinite;
        }

        .story-canvas-page .preview-cursor {
          animation: cursorBlink 1.3s steps(1) infinite;
        }

        .story-canvas-page .connector-line {
          animation: connectorDash 12s linear infinite;
        }

        .story-canvas-page .mini-star-pulse {
          animation: pulseTile 2.4s ease-in-out infinite;
        }

        .story-canvas-page .shop-item-1 { animation: shopCardFloat 3s ease-in-out infinite; }
        .story-canvas-page .shop-item-2 { animation: shopCardFloat 3.2s ease-in-out infinite 0.15s; }
        .story-canvas-page .shop-item-3 { animation: shopCardFloat 3.1s ease-in-out infinite 0.3s; }
        .story-canvas-page .shop-item-4 { animation: shopCardFloat 3.3s ease-in-out infinite 0.45s; }

        .story-canvas-page .scene-chip-active {
          background: ${COLORS.orange} !important;
          color: ${COLORS.navy} !important;
          border-color: ${COLORS.orange} !important;
        }

        .story-canvas-page .minimap-caption {
          animation: labelPulse 4s ease-in-out infinite;
        }

        @media (max-width: 960px) {
          .story-canvas-page .nav-center {
            display: none !important;
          }

          .story-canvas-page .floating-scenes {
            display: none !important;
          }

          .story-canvas-page .sticky-instructions {
            width: 240px !important;
          }
        }
      `}</style>

      <div
        ref={dotGridRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(26,35,50,0.09) 1px, transparent 1px)",
          backgroundColor: COLORS.cream,
        }}
      />

      <div
        ref={gradientARef}
        style={{
          position: "fixed",
          inset: "-16%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 20% 20%, rgba(232,130,12,0.12), transparent 30%), radial-gradient(circle at 82% 32%, rgba(34,197,94,0.06), transparent 22%)",
          filter: "blur(42px)",
        }}
      />
      <div
        ref={gradientBRef}
        style={{
          position: "fixed",
          inset: "-18%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 60% 66%, rgba(104,110,255,0.08), transparent 32%), radial-gradient(circle at 30% 88%, rgba(232,130,12,0.06), transparent 24%)",
          filter: "blur(70px)",
        }}
      />
      <div
        ref={gradientCRef}
        style={{
          position: "fixed",
          inset: "-12%",
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at 88% 18%, rgba(104,110,255,0.08), transparent 22%), radial-gradient(circle at 40% 86%, rgba(34,197,94,0.05), transparent 24%)",
          filter: "blur(72px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: NAV_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "0 28px",
          background: "rgba(245,240,232,0.92)",
          borderBottom: `1px solid ${COLORS.border}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={() => scrollToScene(horizontalTrack.scenes[0])}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <PicoBirdMark size={32} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 900, color: COLORS.navy }}>Pico</span>
            <span style={{ fontFamily: SANS_FONT, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.mutedLabel, marginTop: 4 }}>
              Code Training
            </span>
          </div>
        </button>

        <div className="nav-center" style={{ display: "flex", alignItems: "center", gap: 28, justifyContent: "center", flex: 1 }}>
          {[
            ["Open Courses", "/learn"],
            ["Open Shop", "/shop"],
            ["Open Login", "/login"],
          ].map(([label, path]) => (
            <button
              key={label}
              type="button"
              onClick={() => pushRoute(path)}
              className="nav-link"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: COLORS.navy,
                fontFamily: SANS_FONT,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => pushRoute("/signup")} style={buttonStyle("orange")}>
          Create Account
        </button>
      </nav>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          padding: `${NAV_HEIGHT + 40}px 28px 36px`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: "min(1180px, 100%)", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 34, alignItems: "center" }}>
          <div>
            <div style={{ ...labelStyle(false), color: COLORS.orange, letterSpacing: "0.14em" }}>PICO</div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(3.4rem, 7vw, 6rem)", lineHeight: 0.92, fontWeight: 900, color: COLORS.navy }}>
                Learn on a board.
              </div>
              <div style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(3.4rem, 7vw, 6rem)", lineHeight: 0.92, fontWeight: 900, color: COLORS.orange }}>
                Build with momentum.
              </div>
            </div>
            <p style={{ marginTop: 18, maxWidth: 620, fontFamily: SANS_FONT, fontSize: 17, lineHeight: 1.7, color: COLORS.mutedBody }}>
              Learn Python, JavaScript, Lua, SQL, and more through short lessons, varied question types, live progress, and build-focused libraries like Roblox Studio.
            </p>
            <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button type="button" onClick={() => scrollToScene(horizontalTrack.scenes[0])} style={buttonStyle("navy")}>
                Open Board
              </button>
              <button type="button" onClick={() => pushRoute("/learn")} style={buttonStyle("ghost")}>
                Open Courses
              </button>
            </div>
          </div>

          <div
            style={{
              background: "rgba(253,252,249,0.92)",
              border: `1px solid ${COLORS.border}`,
              padding: "18px 18px 16px",
              borderRadius: 4,
            }}
          >
            <div style={labelStyle(false)}>BOARD</div>
            <div style={{ marginTop: 8, fontFamily: DISPLAY_FONT, fontSize: 28, lineHeight: 1.02, fontWeight: 900, color: COLORS.navy }}>
              Tracks. Practice. Progress.
            </div>
            <div style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 13, lineHeight: 1.65, color: COLORS.mutedBody }}>
              The board ties together tracks, question flow, tools, social proof, and account setup in one continuous system.
            </div>
            <div className="floating-scenes" style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {horizontalTrack.scenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => scrollToScene(scene)}
                  className={scene.id === activeSceneId ? "scene-chip-active" : ""}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    background: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 2,
                    padding: "9px 10px",
                    cursor: "pointer",
                    color: COLORS.navy,
                  }}
                >
                  <span style={{ fontFamily: SANS_FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>{scene.label}</span>
                  <span style={{ fontFamily: SANS_FONT, fontSize: 10 }}>{Math.round(scene.progress * 100)}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={storyRef} style={{ position: "relative", height: storyHeight, zIndex: 1 }}>
        <div
          ref={stageRef}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: "transparent",
          }}
      >
          <div
            ref={sceneMoodRef}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          <div
            className="sticky-instructions"
            style={{
              position: "absolute",
              top: NAV_HEIGHT + 18,
              left: 24,
              zIndex: 20,
              width: 220,
              background: "rgba(253,252,249,0.92)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              padding: "12px 14px 12px",
            }}
          >
            <div style={labelStyle(false)}>CURRENT CHAPTER</div>
            <div style={{ marginTop: 8, position: "relative", minHeight: 36, overflow: "hidden" }}>
              <div ref={regionTitleRef} style={{ fontFamily: DISPLAY_FONT, fontSize: 24, lineHeight: 1.02, fontWeight: 900, color: COLORS.navy }}>
                {activeScene.title}
              </div>
              <div
                ref={regionTitleOutRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 24,
                  lineHeight: 1.02,
                  fontWeight: 900,
                  color: COLORS.navy,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            </div>
            <div ref={regionBodyRef} style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 11, lineHeight: 1.6, color: COLORS.mutedBody }}>
              {activeScene.body}
            </div>
            <div style={{ marginTop: 14, height: 3, background: "rgba(26,35,50,0.12)", overflow: "hidden" }}>
              <div
                ref={progressFillRef}
                style={{
                  width: "100%",
                  height: "100%",
                  background: COLORS.orange,
                  transformOrigin: "0 50%",
                  transform: "scaleX(0)",
                }}
              />
            </div>
            <div style={{ marginTop: 10, fontFamily: SANS_FONT, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.mutedLabel }}>
              Tracks, practice, libraries, progress, account
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 24,
              top: NAV_HEIGHT + 18,
              zIndex: 20,
              width: 200,
              background: "rgba(253,252,249,0.92)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              padding: "12px 12px 10px",
            }}
          >
            <div style={labelStyle(false)}>SCENES</div>
            <div className="floating-scenes" style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {horizontalTrack.scenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => scrollToScene(scene)}
                  className={scene.id === activeSceneId ? "scene-chip-active" : ""}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                    background: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 2,
                    padding: "7px 8px",
                    cursor: "pointer",
                    color: COLORS.navy,
                    textAlign: "left",
                  }}
                >
                  <span>
                    <span style={{ display: "block", fontFamily: SANS_FONT, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.mutedLabel }}>
                      {scene.label}
                    </span>
                    <span style={{ display: "block", marginTop: 3, fontFamily: SANS_FONT, fontSize: 11, fontWeight: 700 }}>
                      {scene.title}
                    </span>
                  </span>
                  <span style={{ fontFamily: SANS_FONT, fontSize: 10, color: COLORS.orange }}>{Math.round(scene.progress * 100)}%</span>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              overflow: "hidden",
            }}
          >
            <div
              ref={worldRef}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: horizontalTrack.totalWidth,
                height: horizontalTrack.totalHeight,
                transformOrigin: "0 0",
                willChange: "transform",
              }}
            >
              <svg
                width={horizontalTrack.totalWidth}
                height={horizontalTrack.totalHeight}
                viewBox={`0 0 ${horizontalTrack.totalWidth} ${horizontalTrack.totalHeight}`}
                style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
              >
                <defs>
                  <ArrowMarker id="story-route-arrow" />
                </defs>
                <path
                  d={horizontalTrack.pathSvg}
                  fill="none"
                  stroke="rgba(104,110,255,0.14)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  ref={routePathRef}
                  d={horizontalTrack.pathSvg}
                  fill="none"
                  stroke="rgba(104,110,255,0.88)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#story-route-arrow)"
                  style={{ opacity: 0.22 }}
                />
              </svg>

              {horizontalTrack.sceneOrigins.slice(1).map((sceneOrigin, index) => (
                <div
                  key={`separator-${index}`}
                  ref={(node) => registerNode(`separator-${index}`, node)}
                  style={{
                    position: "absolute",
                    left: sceneOrigin.x,
                    top: 0,
                    width: 1,
                    height: "100%",
                    background: "rgba(26,35,50,0.08)",
                    pointerEvents: "none",
                    zIndex: 1,
                    transformOrigin: "50% 0%",
                    transform: "scaleY(0)",
                    opacity: 0,
                  }}
                />
              ))}

              {horizontalTrack.scenes.map((scene, index) => {
                if (index === 0) return null;
                const sceneOrigin = horizontalTrack.sceneOrigins[index];

                return (
                  <div
                    key={`scene-label-${scene.id}`}
                    ref={(node) => registerNode(`scene-label-${scene.id}`, node)}
                    style={{
                      position: "absolute",
                      left: sceneOrigin.x + 20,
                      top: sceneOrigin.y + NAV_HEIGHT + 10,
                      zIndex: 2,
                      pointerEvents: "none",
                      opacity: 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(26,35,50,0.32)",
                      }}
                    >
                      {scene.label}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: DISPLAY_FONT,
                        fontSize: 18,
                        lineHeight: 1,
                        fontWeight: 900,
                        color: "rgba(26,35,50,0.14)",
                      }}
                    >
                      {scene.title}
                    </div>
                  </div>
                );
              })}

              {ambientElements.map((element) => (
                <div
                  key={element.id}
                  ref={(node) => registerNode(element.id, node)}
                  aria-hidden="true"
                  style={getAmbientElementStyle(element)}
                >
                  {element.kind === "code"
                    ? element.lines?.map((line, index) => <div key={`${element.id}-${index}`}>{line}</div>)
                    : element.kind === "dot"
                      ? null
                      : element.content}
                </div>
              ))}

              {horizontalTrack.cards.map((card) => (
                <article
                  key={card.id}
                  ref={(node) => registerNode(card.id, node)}
                  className="world-card"
                  onPointerEnter={(event) => {
                    event.currentTarget.dataset.hovered = "true";
                  }}
                  onPointerLeave={(event) => {
                    event.currentTarget.dataset.hovered = "false";
                    event.currentTarget.dataset.pressed = "false";
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.dataset.pressed = "true";
                  }}
                  onPointerUp={(event) => {
                    event.currentTarget.dataset.pressed = "false";
                  }}
                  onPointerCancel={(event) => {
                    event.currentTarget.dataset.pressed = "false";
                  }}
                  style={getCardStyle(card)}
                >
                  {renderCardContent(card, pushRoute, learnerCount)}
                </article>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: 24,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS.orange }} />
              <div className="sticky-instructions" style={{ fontFamily: SANS_FONT, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.mutedLabel }}>
                Product board
              </div>
            </div>

            <div
              style={{
                flex: 1,
                maxWidth: 480,
                background: "rgba(253,252,249,0.92)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                padding: "14px 14px 12px",
              }}
            >
              <div className="minimap-caption" style={{ ...labelStyle(false), color: COLORS.mutedLabel }}>
                Progress
              </div>
              <div
                style={{
                  marginTop: 12,
                  height: 3,
                  background: "rgba(26,35,50,0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(6, activeScene.progress * 100)}%`,
                    height: "100%",
                    background: COLORS.orange,
                    transition: "width 120ms linear",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {horizontalTrack.scenes.map((scene) => (
                  <div
                    key={`${scene.id}-dot`}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: scene.id === activeSceneId ? COLORS.orange : "rgba(26,35,50,0.14)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "90px 28px 80px",
        }}
      >
        <div style={{ width: "min(1180px, 100%)", margin: "0 auto", display: "grid", gap: 18 }}>
          <div style={{ ...labelStyle(false), color: COLORS.orange }}>END</div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: "clamp(2.6rem, 5vw, 4.6rem)", lineHeight: 0.96, fontWeight: 900, color: COLORS.navy }}>
            That is the full product.
          </div>
          <div style={{ maxWidth: 620, fontFamily: SANS_FONT, fontSize: 16, lineHeight: 1.7, color: COLORS.mutedBody }}>
            Pico combines short lessons, placement, libraries, visible progress, and project-driven tracks so the next step stays obvious.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" onClick={() => pushRoute("/signup")} style={buttonStyle("navy")}>
              Create Account
            </button>
            <button type="button" onClick={() => pushRoute("/login")} style={buttonStyle("ghost")}>
              Open Login
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default dynamic(() => Promise.resolve(HomePage), {
  ssr: false,
});
