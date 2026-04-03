"use client";

export const PICO_DEV_CHEATS_EVENT = "pico:dev-cheats-changed";
const DEV_CHEATS_STORAGE_VERSION = 1;
const DEV_CHEATS_STORAGE_PREFIX = "pico-dev-cheats:";

export type DevCheatState = {
  version: number;
  infiniteGems: boolean;
};

export type DevCheatChangeDetail = {
  userId: string;
  state: DevCheatState;
};

export function getDevCheatsStorageKey(userId: string) {
  return `${DEV_CHEATS_STORAGE_PREFIX}${userId}`;
}

export function getDefaultDevCheatState(): DevCheatState {
  return {
    version: DEV_CHEATS_STORAGE_VERSION,
    infiniteGems: false,
  };
}

export function sanitizeDevCheatState(value: unknown): DevCheatState {
  const defaults = getDefaultDevCheatState();
  if (!value || typeof value !== "object") return defaults;

  const raw = value as Partial<DevCheatState>;
  return {
    version: DEV_CHEATS_STORAGE_VERSION,
    infiniteGems: Boolean(raw.infiniteGems),
  };
}

export function getStoredDevCheats(userId: string) {
  if (typeof window === "undefined") return getDefaultDevCheatState();

  try {
    const raw = window.localStorage.getItem(getDevCheatsStorageKey(userId));
    if (!raw) return getDefaultDevCheatState();
    return sanitizeDevCheatState(JSON.parse(raw));
  } catch {
    return getDefaultDevCheatState();
  }
}

export function setStoredDevCheats(userId: string, state: DevCheatState) {
  if (typeof window === "undefined") return;

  const sanitized = sanitizeDevCheatState(state);
  window.localStorage.setItem(getDevCheatsStorageKey(userId), JSON.stringify(sanitized));
  window.dispatchEvent(
    new CustomEvent<DevCheatChangeDetail>(PICO_DEV_CHEATS_EVENT, {
      detail: {
        userId,
        state: sanitized,
      },
    }),
  );
}

export function enableInfiniteGems(userId: string) {
  const next = {
    ...getStoredDevCheats(userId),
    infiniteGems: true,
  };
  setStoredDevCheats(userId, next);
  return next;
}
