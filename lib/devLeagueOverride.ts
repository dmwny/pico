"use client";

export const PICO_DEV_LEAGUE_OVERRIDE_EVENT = "pico:dev-league-override";

export type DevLeagueOverride = {
  leagueId: number;
  leagueTier: string;
  updatedAt: string;
};

export type DevLeagueOverrideChangeDetail = {
  userId: string;
  override: DevLeagueOverride | null;
};

export function getDevLeagueOverrideStorageKey(userId: string) {
  return `pico-dev-league-override:${userId}`;
}

export function getStoredDevLeagueOverride(userId: string): DevLeagueOverride | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getDevLeagueOverrideStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DevLeagueOverride>;
    const leagueId = Number(parsed.leagueId ?? 0);
    const leagueTier = typeof parsed.leagueTier === "string" ? parsed.leagueTier.trim().toLowerCase() : "";
    if (!leagueId || !leagueTier) return null;

    return {
      leagueId,
      leagueTier,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function setStoredDevLeagueOverride(userId: string, override: Pick<DevLeagueOverride, "leagueId" | "leagueTier">) {
  if (typeof window === "undefined") return;

  const nextOverride: DevLeagueOverride = {
    leagueId: Number(override.leagueId ?? 0),
    leagueTier: typeof override.leagueTier === "string" ? override.leagueTier.trim().toLowerCase() : "",
    updatedAt: new Date().toISOString(),
  };

  if (!nextOverride.leagueId || !nextOverride.leagueTier) return;

  window.localStorage.setItem(getDevLeagueOverrideStorageKey(userId), JSON.stringify(nextOverride));
  window.dispatchEvent(new CustomEvent<DevLeagueOverrideChangeDetail>(PICO_DEV_LEAGUE_OVERRIDE_EVENT, {
    detail: {
      userId,
      override: nextOverride,
    },
  }));
}

export function clearStoredDevLeagueOverride(userId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(getDevLeagueOverrideStorageKey(userId));
  window.dispatchEvent(new CustomEvent<DevLeagueOverrideChangeDetail>(PICO_DEV_LEAGUE_OVERRIDE_EVENT, {
    detail: {
      userId,
      override: null,
    },
  }));
}
