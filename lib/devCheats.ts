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

type UserMetadataLike = Record<string, unknown> | null | undefined;

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

export function getRemoteDevCheats(userMetadata: UserMetadataLike): DevCheatState | null {
  if (!userMetadata || typeof userMetadata !== "object") return null;

  const devCheats = (userMetadata as Record<string, unknown>).pico_dev_cheats;
  if (!devCheats || typeof devCheats !== "object") return null;

  return sanitizeDevCheatState({
    infiniteGems: (devCheats as Record<string, unknown>).infinite_gems,
  });
}

export function mergeDevCheatSources(
  localState: DevCheatState,
  userMetadata: UserMetadataLike,
) {
  return getRemoteDevCheats(userMetadata) ?? localState;
}

export function buildUpdatedUserMetadata(userMetadata: UserMetadataLike, state: DevCheatState) {
  const base = userMetadata && typeof userMetadata === "object"
    ? { ...(userMetadata as Record<string, unknown>) }
    : {};

  const existingDevCheats = base.pico_dev_cheats && typeof base.pico_dev_cheats === "object"
    ? { ...(base.pico_dev_cheats as Record<string, unknown>) }
    : {};

  return {
    ...base,
    pico_dev_cheats: {
      ...existingDevCheats,
      infinite_gems: state.infiniteGems,
    },
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
