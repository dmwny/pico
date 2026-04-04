"use client";

import { defineMythicTheme } from "@/lib/themes/shared";

export const MYTHIC_THEME_IDS = ["the_void", "celestial"] as const;

export type MythicThemeId = typeof MYTHIC_THEME_IDS[number];

export const MYTHIC_THEMES = {
  the_void: defineMythicTheme({
    id: "the_void",
    name: "The Void",
    description: "Lessons materialize from darkness as if the path is being pulled into existence.",
    shopDescription: "Reality cracks, hidden nodes, and stark white threads make every unlock feel summoned from nothing.",
    previewColor: "#020617",
    previewUnitTitle: "Null Span",
    accent: "#FFFFFF",
    surface: "#020617",
    text: "#FFFFFF",
    node: "#FFFFFF",
    nodeDark: "#475569",
    trail: "#FFFFFF",
    background: "linear-gradient(180deg,#000000 0%,#05070D 100%)",
    overlay: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 34%)",
    chestSkin: "void_rift",
    trailEffect: "void_thread",
    particleEffect: "void_particles",
    nodeShape: "star",
    ambientEffects: [
      { kind: "void-cracks", color: "#FFFFFF", opacity: 0.16 },
      { kind: "dust", color: "#FFFFFF", count: 24, opacity: 0.08 },
      { kind: "mist", color: "#475569", opacity: 0.06, durationMs: 12000 },
    ],
  }),
  celestial: defineMythicTheme({
    id: "celestial",
    name: "Celestial",
    description: "A constellation journey across the cosmos with living nebula light and drifting planets.",
    shopDescription: "Parallax stars, drawing constellation lines, and supernova finishes turn the path into a cosmic event.",
    previewColor: "#8B5CF6",
    previewUnitTitle: "Observatory Arc",
    accent: "#C4B5FD",
    surface: "#050816",
    text: "#F8FAFC",
    node: "#E0F2FE",
    nodeDark: "#60A5FA",
    trail: "#93C5FD",
    background: "linear-gradient(180deg,#020617 0%,#0F172A 100%)",
    overlay: "radial-gradient(circle at 70% 20%, rgba(139,92,246,0.18), transparent 26%)",
    chestSkin: "celestial_orrery",
    trailEffect: "celestial_constellation",
    particleEffect: "supernova",
    nodeShape: "star",
    ambientEffects: [
      { kind: "stars", color: "#FFFFFF", count: 100, opacity: 0.18 },
      { kind: "nebula", color: "#8B5CF6", colorSecondary: "#22D3EE", opacity: 0.18 },
      { kind: "shooting-stars", color: "#F8FAFC", durationMs: 10000 },
      { kind: "aurora", color: "#60A5FA", colorSecondary: "#C084FC", opacity: 0.1 },
      { kind: "planets", color: "#93C5FD", durationMs: 24000 },
      { kind: "constellation-lines", color: "#BFDBFE", opacity: 0.12 },
    ],
  }),
} satisfies Record<MythicThemeId, ReturnType<typeof defineMythicTheme<MythicThemeId>>>;
