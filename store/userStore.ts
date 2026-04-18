"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ActivePowerUp {
  effect:
    | "xp-multiplier"
    | "heart-refill"
    | "combo-shield"
    | "time-freeze"
    | "hint-free"
    | "pack-guaranteed"
    | "streak-freeze";
  expiresAt?: number;
  remaining?: number;
  itemId: string;
}

export interface UserStore {
  userId: string | null;
  displayName: string;
  xp: number;
  weeklyXP: number;
  coins: number;
  hearts: number;
  maxHearts: number;
  streak: number;
  level: number;
  lastActiveDate: string | null;
  lastHeartRegenAt: number | null;
  leagueTier: string;
  highestLeagueTier: string;
  unlockedThemes: string[];
  equippedTheme: string;
  activePowerUps: ActivePowerUp[];
  comboCount: number;
  comboMultiplier: number;
  isHydrated: boolean;
  isFetching: boolean;
  hydrate: (data: Partial<UserStore>) => void;
  setHydrated: (value: boolean) => void;
  setFetching: (value: boolean) => void;
  addXP: (baseAmount: number) => number;
  addWeeklyXP: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addCoins: (amount: number) => void;
  useHeart: () => boolean;
  refillHearts: () => void;
  tickHeartRegen: () => void;
  incrementCombo: () => void;
  breakCombo: () => void;
  resetCombo: () => void;
  equipTheme: (id: string) => void;
  unlockTheme: (id: string) => void;
  activatePowerUp: (powerUp: ActivePowerUp) => void;
  consumePowerUp: (effect: ActivePowerUp["effect"]) => void;
  hasPowerUp: (effect: ActivePowerUp["effect"]) => boolean;
  syncToServer: () => Promise<void>;
}

const COMBO_THRESHOLDS = [
  { min: 1, max: 2, multiplier: 1 },
  { min: 3, max: 4, multiplier: 1.5 },
  { min: 5, max: 7, multiplier: 2 },
  { min: 8, max: Number.POSITIVE_INFINITY, multiplier: 3 },
] as const;

const HEART_REGEN_MS = 30 * 60 * 1000;

function getMultiplier(combo: number) {
  return COMBO_THRESHOLDS.find((threshold) => combo >= threshold.min && combo <= threshold.max)?.multiplier ?? 1;
}

function getLevelFromXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userId: null,
      displayName: "",
      xp: 0,
      weeklyXP: 0,
      coins: 0,
      hearts: 5,
      maxHearts: 5,
      streak: 0,
      level: 1,
      lastActiveDate: null,
      lastHeartRegenAt: null,
      leagueTier: "bronze",
      highestLeagueTier: "bronze",
      unlockedThemes: ["default"],
      equippedTheme: "default",
      activePowerUps: [],
      comboCount: 0,
      comboMultiplier: 1,
      isHydrated: false,
      isFetching: false,

      hydrate: (data) =>
        set((state) => ({
          ...state,
          ...data,
          level: typeof data.xp === "number" ? getLevelFromXp(data.xp) : state.level,
          isHydrated: true,
          isFetching: false,
        })),

      setHydrated: (value) => set({ isHydrated: value }),
      setFetching: (value) => set({ isFetching: value }),

      addXP: (baseAmount) => {
        const state = get();
        const xpBoost = state.activePowerUps.find((powerUp) => powerUp.effect === "xp-multiplier");
        const boostMultiplier = xpBoost?.expiresAt && xpBoost.expiresAt > Date.now() ? 2 : 1;
        const actual = Math.round(baseAmount * state.comboMultiplier * boostMultiplier);
        const xp = state.xp + actual;
        set({
          xp,
          weeklyXP: state.weeklyXP + actual,
          level: getLevelFromXp(xp),
        });
        void get().syncToServer();
        return actual;
      },

      addWeeklyXP: (amount) => {
        set((state) => ({ weeklyXP: state.weeklyXP + amount }));
        void get().syncToServer();
      },

      spendCoins: (amount) => {
        const state = get();
        if (state.coins < amount) return false;
        set({ coins: state.coins - amount });
        void get().syncToServer();
        return true;
      },

      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
        void get().syncToServer();
      },

      useHeart: () => {
        const state = get();
        if (state.hearts <= 0) return false;
        set({ hearts: state.hearts - 1 });
        void get().syncToServer();
        return true;
      },

      refillHearts: () => {
        set({ hearts: get().maxHearts, lastHeartRegenAt: Date.now() });
        void get().syncToServer();
      },

      tickHeartRegen: () => {
        const state = get();
        if (state.hearts >= state.maxHearts) return;

        const now = Date.now();
        const lastRegen = state.lastHeartRegenAt ?? now;
        const elapsed = now - lastRegen;
        const heartsToAdd = Math.floor(elapsed / HEART_REGEN_MS);

        if (heartsToAdd <= 0) return;

        set({
          hearts: Math.min(state.maxHearts, state.hearts + heartsToAdd),
          lastHeartRegenAt: lastRegen + heartsToAdd * HEART_REGEN_MS,
        });
        void get().syncToServer();
      },

      incrementCombo: () => {
        const comboCount = get().comboCount + 1;
        set({ comboCount, comboMultiplier: getMultiplier(comboCount) });
      },

      breakCombo: () => {
        const state = get();
        const shield = state.activePowerUps.find((powerUp) => powerUp.effect === "combo-shield");
        if (shield) {
          get().consumePowerUp("combo-shield");
          return;
        }
        set({ comboCount: 0, comboMultiplier: 1 });
      },

      resetCombo: () => set({ comboCount: 0, comboMultiplier: 1 }),

      equipTheme: (id) => {
        set({ equippedTheme: id });
        void get().syncToServer();
      },

      unlockTheme: (id) => {
        const state = get();
        if (state.unlockedThemes.includes(id)) return;
        set({ unlockedThemes: [...state.unlockedThemes, id] });
        void get().syncToServer();
      },

      activatePowerUp: (powerUp) => {
        set((state) => ({
          activePowerUps: [
            ...state.activePowerUps.filter((entry) => entry.effect !== powerUp.effect),
            powerUp,
          ],
        }));
        void get().syncToServer();
      },

      consumePowerUp: (effect) => {
        set((state) => ({
          activePowerUps: state.activePowerUps.filter((powerUp) => powerUp.effect !== effect),
        }));
        void get().syncToServer();
      },

      hasPowerUp: (effect) => {
        const powerUp = get().activePowerUps.find((entry) => entry.effect === effect);
        if (!powerUp) return false;
        if (powerUp.expiresAt && powerUp.expiresAt < Date.now()) {
          get().consumePowerUp(effect);
          return false;
        }
        return true;
      },

      syncToServer: async () => {
        const state = get();
        if (!state.userId) return;

        try {
          const payload = {
            userId: state.userId,
            xp: state.xp,
            weeklyXP: state.weeklyXP,
            coins: state.coins,
            hearts: state.hearts,
            streak: state.streak,
            level: state.level,
            lastHeartRegenAt: state.lastHeartRegenAt,
            equippedTheme: state.equippedTheme,
            unlockedThemes: state.unlockedThemes,
            activePowerUps: state.activePowerUps,
            leagueTier: state.leagueTier,
            highestLeagueTier: state.highestLeagueTier,
            lastActiveDate: state.lastActiveDate,
          };

          const accessToken = typeof window === "undefined"
            ? null
            : window.localStorage.getItem("pico_supabase_access_token");

          await fetch("/api/user/sync", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          console.error("[UserStore] Failed to sync user state", error);
        }
      },
    }),
    {
      name: "pico-user-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        displayName: state.displayName,
        xp: state.xp,
        weeklyXP: state.weeklyXP,
        coins: state.coins,
        hearts: state.hearts,
        maxHearts: state.maxHearts,
        streak: state.streak,
        level: state.level,
        lastActiveDate: state.lastActiveDate,
        lastHeartRegenAt: state.lastHeartRegenAt,
        leagueTier: state.leagueTier,
        highestLeagueTier: state.highestLeagueTier,
        equippedTheme: state.equippedTheme,
        unlockedThemes: state.unlockedThemes,
        activePowerUps: state.activePowerUps,
      }),
    },
  ),
);
