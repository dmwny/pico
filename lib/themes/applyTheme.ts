import { THEMES, type ThemeId } from "@/lib/themes/themeRegistry";

let activeCleanup: (() => void) | null = null;

export async function applyTheme(id: ThemeId): Promise<void> {
  if (typeof document === "undefined") return;

  const theme = THEMES.find((entry) => entry.id === id);
  if (!theme) {
    console.error("[Theme] Unknown theme", id);
    return;
  }

  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (error) {
      console.error("[Theme] Cleanup failed", error);
    }
    activeCleanup = null;
  }

  document.documentElement.setAttribute("data-theme", id);

  if (theme.hasJsEffects && typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try {
      const mod = await import(`./effects/${id}`);
      mod.init();
      activeCleanup = mod.cleanup;
    } catch (error) {
      console.error("[Theme] Failed to load effect module", error);
    }
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem("pico_theme", id);
  }
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem("pico_theme") as ThemeId | null;
  return THEMES.some((theme) => theme.id === stored) ? stored! : "default";
}
