"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChestRarity,
  RewardChest,
  RewardChestOpenResult,
  RewardChestProgressResult,
  RewardChestRevealIntensity,
  TOTAL_CHEST_SPINS,
  buildRewardChestPulsePresentation,
  getChestGemReward,
  getChestTheme,
  reconstructRewardChestSession,
  resolveRewardChestPulse,
} from "@/lib/rewardChests";
import { RewardChestArt } from "@/components/rewards/RewardChest";

type RewardChestModalProps = {
  chest?: RewardChest | null;
  onClose: () => void;
  onOpen?: (result: RewardChestOpenResult) => void | Promise<void>;
  onProgress?: (result: RewardChestProgressResult) => void | Promise<void>;
};

type GemRewardChestModalProps = {
  chest: RewardChest;
  onClose: () => void;
  onOpen: (result: RewardChestOpenResult) => void | Promise<void>;
  onProgress?: (result: RewardChestProgressResult) => void | Promise<void>;
};

type RewardScenePhase = "ready" | "charging" | "recoil" | "near-miss" | "upgrading" | "frozen" | "locking" | "opened";
type RewardTitleMode = "mystery" | "steady" | "hit" | "glimpse" | "final";

type RewardParticleBurst = {
  rarity: ChestRarity;
  intensity: RewardChestRevealIntensity;
  variant: "pulse" | "near-miss" | "reveal" | "counter";
  token: number;
};

function formatRarity(rarity: ChestRarity) {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

function emitRewardSoundCue(chestId: string, cue: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("pico:reward-sound", {
      detail: { chestId, cue },
    }),
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getShakeAnimation(preset: "light" | "heavy" | "mythic") {
  if (preset === "mythic") return "rewardSceneShakeMythic 860ms ease-in-out";
  if (preset === "heavy") return "rewardSceneShakeHeavy 720ms ease-in-out";
  return "rewardSceneShakeLight 460ms ease-in-out";
}

function getInitialScene(chest: RewardChest) {
  const session = reconstructRewardChestSession(chest, chest.tapsUsed);
  const opened = chest.state === "opened";

  return {
    currentRarity: opened ? chest.currentRarity : session.currentRarity,
    pulseCount: session.history.length,
    storedEnergy: opened ? 0 : session.storedEnergy,
    opened,
    gemAmount: chest.gemAmount ?? 0,
  };
}

function getInitialRarityTitle(scene: ReturnType<typeof getInitialScene> | null) {
  if (!scene) {
    return {
      text: "???",
      rarity: null as ChestRarity | null,
      mode: "mystery" as RewardTitleMode,
      token: 0,
    };
  }

  if (scene.opened) {
    return {
      text: formatRarity(scene.currentRarity),
      rarity: scene.currentRarity,
      mode: "final" as RewardTitleMode,
      token: 1,
    };
  }

  if (scene.pulseCount > 0) {
    return {
      text: formatRarity(scene.currentRarity),
      rarity: scene.currentRarity,
      mode: "steady" as RewardTitleMode,
      token: 1,
    };
  }

  return {
    text: "???",
    rarity: null as ChestRarity | null,
    mode: "mystery" as RewardTitleMode,
    token: 0,
  };
}

function RewardParticles({
  rarity,
  intensity,
  variant,
  token,
}: RewardParticleBurst) {
  const theme = getChestTheme(rarity);
  const count = variant === "reveal"
    ? intensity === "mythic"
      ? 52
      : intensity === "legendary"
        ? 38
        : 26
    : variant === "counter"
      ? 16
      : variant === "near-miss"
        ? 12
        : 18;
  const travelBase = variant === "reveal"
    ? intensity === "mythic"
      ? 250
      : intensity === "legendary"
        ? 204
        : 148
    : variant === "counter"
      ? 116
      : variant === "near-miss"
        ? 96
        : 124;
  const duration = variant === "reveal"
    ? intensity === "mythic"
      ? 1100
      : intensity === "legendary"
        ? 920
        : 780
    : variant === "counter"
      ? 560
      : variant === "near-miss"
        ? 360
        : 520;

  return (
    <div key={`${variant}-${rarity}-${token}`} className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes rewardParticleBurst {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.45) rotate(0deg);
          }
          14% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--travel-x), var(--travel-y), 0) scale(1.08) rotate(240deg);
          }
        }
      `}</style>
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const distance = travelBase + (index % 5) * 18;
        const size = variant === "counter" ? 5 + (index % 3) * 2 : 7 + (index % 4) * 3;
        const delay = (index % 8) * 18;
        const x = `${Math.cos(angle) * distance}px`;
        const y = `${Math.sin(angle) * distance}px`;

        return (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background:
                rarity === "mythic"
                  ? "linear-gradient(135deg,#ec4899 0%,#8b5cf6 34%,#3b82f6 62%,#f59e0b 100%)"
                  : index % 2 === 0
                    ? theme.sparkle
                    : theme.gem,
              boxShadow: `0 0 20px ${theme.aura}`,
              animation: `rewardParticleBurst ${duration}ms ease-out ${delay}ms forwards`,
              "--travel-x": x,
              "--travel-y": y,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

function PulseSigils({
  currentPulse,
  rarity,
  freezeFrame,
  opened,
}: {
  currentPulse: number;
  rarity: ChestRarity;
  freezeFrame: boolean;
  opened: boolean;
}) {
  const theme = getChestTheme(rarity);
  const completeCount = opened ? TOTAL_CHEST_SPINS : currentPulse;

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <style>{`
        @keyframes rewardNodePulse {
          0%, 100% { transform: scale(1); opacity: 0.72; }
          50% { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
      {Array.from({ length: TOTAL_CHEST_SPINS }).map((_, index) => {
        const complete = index < completeCount;
        const active = !opened && index === currentPulse;

        return (
          <div key={index} className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <span
                className="absolute inset-0 rounded-full blur-[12px]"
                style={{
                  background: complete || active
                    ? rarity === "mythic"
                      ? "linear-gradient(135deg,#ec4899 0%,#8b5cf6 36%,#3b82f6 68%,#f59e0b 100%)"
                      : theme.aura
                    : "transparent",
                  opacity: complete || active ? 0.95 : 0.18,
                  animation: active && !freezeFrame ? "rewardNodePulse 1.2s ease-in-out infinite" : "none",
                }}
              />
              <span
                className="relative block h-4 w-4 rounded-full border sm:h-5 sm:w-5"
                style={{
                  borderColor: complete || active ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.12)",
                  background:
                    complete || active
                      ? rarity === "mythic"
                        ? "linear-gradient(135deg,#ec4899 0%,#8b5cf6 36%,#3b82f6 68%,#f59e0b 100%)"
                        : theme.sparkle
                      : "rgba(10,15,30,0.88)",
                  boxShadow: complete || active
                    ? `0 0 22px ${theme.aura}, inset 0 0 10px rgba(255,255,255,0.18)`
                    : "inset 0 0 8px rgba(0,0,0,0.35)",
                  animation: active && !freezeFrame ? "rewardNodePulse 1.2s ease-in-out infinite" : "none",
                }}
              />
            </div>

            {index < TOTAL_CHEST_SPINS - 1 ? (
              <div
                className="h-[2px] w-8 rounded-full sm:w-10"
                style={{
                  background: index < completeCount - 1
                    ? rarity === "mythic"
                      ? "linear-gradient(90deg,#ec4899 0%,#8b5cf6 36%,#3b82f6 68%,#f59e0b 100%)"
                      : theme.aura
                    : "rgba(255,255,255,0.12)",
                  boxShadow: index < completeCount - 1 ? `0 0 14px ${theme.aura}` : "none",
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function getRarityTitleStyle(rarity: ChestRarity): CSSProperties {
  if (rarity === "mythic") {
    return {
      background: "linear-gradient(90deg,#F9A8D4 0%,#E9D5FF 24%,#93C5FD 48%,#FDE68A 74%,#F9A8D4 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      textShadow: "0 0 32px rgba(255,255,255,0.18)",
    };
  }

  if (rarity === "legendary") {
    return {
      color: "#F6D36A",
      textShadow: "0 0 30px rgba(246,211,106,0.26)",
    };
  }

  if (rarity === "epic") {
    return {
      color: "#D8B4FE",
      textShadow: "0 0 28px rgba(168,85,247,0.24)",
    };
  }

  if (rarity === "rare") {
    return {
      color: "#93C5FD",
      textShadow: "0 0 24px rgba(59,130,246,0.22)",
    };
  }

  return {
    color: "#E2E8F0",
    textShadow: "0 0 20px rgba(226,232,240,0.18)",
  };
}

function getActiveRarityTitleStyle(rarity: ChestRarity | null, mode: RewardTitleMode): CSSProperties {
  if (!rarity) {
    return {
      color: "rgba(255,255,255,0.34)",
      textShadow: "0 0 16px rgba(255,255,255,0.08)",
      opacity: 0.54,
    };
  }

  return {
    ...getRarityTitleStyle(rarity),
    opacity: mode === "glimpse" ? 0.72 : 1,
  };
}

export default function RewardChestModal({
  chest,
  onClose,
  onOpen,
  onProgress,
}: RewardChestModalProps) {
  if (!chest || !onOpen) return null;

  return (
    <GemRewardChestModal
      chest={chest}
      onClose={onClose}
      onOpen={onOpen}
      onProgress={onProgress}
    />
  );
}

function GemRewardChestModal({ chest, onClose, onOpen, onProgress }: GemRewardChestModalProps) {
  const runTokenRef = useRef(0);
  const lastTapAtRef = useRef<number | null>(null);

  const initialScene = chest ? getInitialScene(chest) : null;

  const [displayRarity, setDisplayRarity] = useState<ChestRarity>(initialScene?.currentRarity ?? "common");
  const [pulseCount, setPulseCount] = useState(initialScene?.pulseCount ?? 0);
  const [storedEnergy, setStoredEnergy] = useState(initialScene?.storedEnergy ?? 0);
  const [opened, setOpened] = useState(initialScene?.opened ?? false);
  const [gemAmount, setGemAmount] = useState(initialScene?.gemAmount ?? 0);
  const [displayedGemAmount, setDisplayedGemAmount] = useState(0);
  const [scenePhase, setScenePhase] = useState<RewardScenePhase>(initialScene?.opened ? "opened" : "ready");
  const [auraRarity, setAuraRarity] = useState<ChestRarity | null>(null);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const [sceneShakeAnimation, setSceneShakeAnimation] = useState<string | null>(null);
  const [particleBurst, setParticleBurst] = useState<RewardParticleBurst | null>(null);
  const [impactFlashToken, setImpactFlashToken] = useState(0);
  const [motionToken, setMotionToken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showRewardValue, setShowRewardValue] = useState(Boolean(initialScene?.opened));
  const [rewardCountToken, setRewardCountToken] = useState(initialScene?.opened ? 1 : 0);
  const initialRarityTitle = getInitialRarityTitle(initialScene);
  const [rarityTitleText, setRarityTitleText] = useState(initialRarityTitle.text);
  const [rarityTitleRarity, setRarityTitleRarity] = useState<ChestRarity | null>(initialRarityTitle.rarity);
  const [rarityTitleMode, setRarityTitleMode] = useState<RewardTitleMode>(initialRarityTitle.mode);
  const [rarityTitleToken, setRarityTitleToken] = useState(initialRarityTitle.token);

  useEffect(() => {
    return () => {
      runTokenRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!showRewardValue || rewardCountToken === 0) return;

    let rafId = 0;
    let cancelled = false;
    let startAt = 0;
    const duration =
      displayRarity === "mythic"
        ? 1600
        : displayRarity === "legendary"
          ? 1320
          : displayRarity === "epic"
            ? 1120
            : 900;

    const step = (timestamp: number) => {
      if (!startAt) startAt = timestamp;
      const progress = Math.min(1, (timestamp - startAt) / duration);
      const eased = 1 - (1 - progress) ** 3;

      if (!cancelled) {
        setDisplayedGemAmount(Math.round(gemAmount * eased));
      }

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
        return;
      }

      if (!cancelled) {
        setDisplayedGemAmount(gemAmount);
        setParticleBurst({
          rarity: displayRarity,
          intensity: displayRarity === "mythic" ? "mythic" : displayRarity === "legendary" ? "legendary" : "standard",
          variant: "counter",
          token: Date.now(),
        });
        emitRewardSoundCue(chest?.id ?? "reward-chest", "reward_counter_finish");
      }
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [rewardCountToken, showRewardValue, gemAmount, displayRarity, chest?.id]);

  const theme = getChestTheme(displayRarity);
  const sceneRarity = auraRarity ?? displayRarity;
  const cinematicReveal = freezeFrame || scenePhase === "locking" || opened;
  const currentPulse = Math.min(pulseCount, TOTAL_CHEST_SPINS - 1);

  const closeModal = () => {
    runTokenRef.current += 1;
    onClose();
  };

  const triggerSceneShake = (preset: "light" | "heavy" | "mythic") => {
    setSceneShakeAnimation("none");
    window.requestAnimationFrame(() => {
      setSceneShakeAnimation(getShakeAnimation(preset));
    });
  };

  const triggerParticles = (
    rarity: ChestRarity,
    intensity: RewardChestRevealIntensity,
    variant: RewardParticleBurst["variant"],
  ) => {
    setParticleBurst({ rarity, intensity, variant, token: Date.now() });
  };

  const advanceMotion = () => {
    setMotionToken((value) => value + 1);
  };

  const setRarityTitle = (
    rarity: ChestRarity | null,
    mode: RewardTitleMode,
    options?: { text?: string; animate?: boolean },
  ) => {
    setRarityTitleRarity(rarity);
    setRarityTitleText(options?.text ?? (rarity ? formatRarity(rarity) : "???"));
    setRarityTitleMode(mode);

    if (options?.animate) {
      setRarityTitleToken((value) => value + 1);
    }
  };

  const playPulse = async () => {
    if (busy) return;

    if (opened) {
      closeModal();
      return;
    }

    const currentToken = runTokenRef.current + 1;
    runTokenRef.current = currentToken;
    setBusy(true);
    setFreezeFrame(false);
    setSceneShakeAnimation(null);
    setShowRewardValue(false);
    setDisplayedGemAmount(0);
    setAuraRarity(null);
    setParticleBurst(null);
    setImpactFlashToken(0);

    const now = Date.now();
    const tapCadenceMs = lastTapAtRef.current ? now - lastTapAtRef.current : null;
    lastTapAtRef.current = now;

    const pulseResult = resolveRewardChestPulse(chest, displayRarity, pulseCount, storedEnergy);
    const presentation = buildRewardChestPulsePresentation(chest, pulseResult, tapCadenceMs);
    const nextPulseCount = pulseCount + 1;

    if (rarityTitleMode === "mystery") {
      setRarityTitle(displayRarity, "hit", { animate: true });
    }

    setScenePhase("charging");
    advanceMotion();
    emitRewardSoundCue(chest.id, "pulse_charge");

    await wait(presentation.chargeDurationMs);
    if (runTokenRef.current !== currentToken) return;

    if (pulseResult.upgradeSteps.length === 0) {
      if (pulseResult.nearMissRarity) {
        setScenePhase("near-miss");
        setAuraRarity(pulseResult.nearMissRarity);
        setRarityTitle(pulseResult.nearMissRarity, "glimpse", { animate: true });
        advanceMotion();
        triggerParticles(pulseResult.nearMissRarity, "standard", "near-miss");
        emitRewardSoundCue(chest.id, "near_miss");

        await wait(presentation.nearMissFlashMs);
        if (runTokenRef.current !== currentToken) return;

        setRarityTitle(pulseResult.settledRarity, "steady");
      }

      setAuraRarity(null);
      setScenePhase("recoil");
      advanceMotion();
      emitRewardSoundCue(chest.id, "pulse_fail");

      await wait(presentation.settleDurationMs);
      if (runTokenRef.current !== currentToken) return;
    } else {
      for (let index = 0; index < pulseResult.upgradeSteps.length; index += 1) {
        const step = pulseResult.upgradeSteps[index];
        const stepIntensity: RewardChestRevealIntensity =
          step.toRarity === "mythic" ? "mythic" : step.toRarity === "legendary" ? "legendary" : "standard";

        setScenePhase("upgrading");
        setDisplayRarity(step.toRarity);
        setAuraRarity(step.toRarity);
        setRarityTitle(step.toRarity, "hit", { animate: true });
        advanceMotion();
        triggerParticles(step.toRarity, stepIntensity, "pulse");
        emitRewardSoundCue(chest.id, index > 0 ? "chain_upgrade" : "upgrade_hit");

        await wait(presentation.upgradeBurstDurationMs);
        if (runTokenRef.current !== currentToken) return;

        if (index < pulseResult.upgradeSteps.length - 1) {
          setScenePhase("charging");
          await wait(presentation.chainPauseMs);
          if (runTokenRef.current !== currentToken) return;
        }
      }

      if (pulseResult.nearMissRarity) {
        setScenePhase("near-miss");
        setAuraRarity(pulseResult.nearMissRarity);
        setRarityTitle(pulseResult.nearMissRarity, "glimpse", { animate: true });
        advanceMotion();
        triggerParticles(pulseResult.nearMissRarity, "standard", "near-miss");
        emitRewardSoundCue(chest.id, "near_miss");

        await wait(presentation.nearMissFlashMs);
        if (runTokenRef.current !== currentToken) return;

        setRarityTitle(pulseResult.settledRarity, "steady");
      }

      setAuraRarity(null);
      await wait(presentation.settleDurationMs);
      if (runTokenRef.current !== currentToken) return;
    }

    setDisplayRarity(pulseResult.settledRarity);
    setStoredEnergy(pulseResult.finalSpin ? 0 : pulseResult.storedEnergyAfter);
    setPulseCount(nextPulseCount);

    await wait(presentation.confirmationDelayMs);
    if (runTokenRef.current !== currentToken) return;

    if (!pulseResult.finalSpin) {
      setScenePhase("ready");
      setRarityTitle(pulseResult.settledRarity, "steady");

      if (onProgress) {
        await onProgress({
          chestId: chest.id,
          currentRarity: pulseResult.settledRarity,
          tapsUsed: nextPulseCount,
        });
      }

      setBusy(false);
      return;
    }

    if (presentation.revealStillPauseMs > 0) {
      setFreezeFrame(true);
      setScenePhase("frozen");
      setAuraRarity(pulseResult.settledRarity);

      await wait(presentation.revealStillPauseMs);
      if (runTokenRef.current !== currentToken) return;
    }

    setFreezeFrame(false);
    setScenePhase("locking");
    setAuraRarity(pulseResult.settledRarity);
    advanceMotion();
    triggerSceneShake(
      pulseResult.revealIntensity === "mythic"
        ? "mythic"
        : pulseResult.revealIntensity === "legendary"
          ? "heavy"
          : "light",
    );
    emitRewardSoundCue(
      chest.id,
      pulseResult.revealIntensity === "mythic"
        ? "mythic_charge"
        : pulseResult.revealIntensity === "legendary"
          ? "legendary_charge"
          : "final_lock",
    );

    await wait(presentation.finalLockPauseMs);
    if (runTokenRef.current !== currentToken) return;

    setRarityTitle(pulseResult.settledRarity, "final", { animate: true });
    setImpactFlashToken(Date.now());
    triggerParticles(pulseResult.settledRarity, pulseResult.revealIntensity, "reveal");
    emitRewardSoundCue(
      chest.id,
      pulseResult.revealIntensity === "mythic"
        ? "mythic_reveal"
        : pulseResult.revealIntensity === "legendary"
          ? "legendary_reveal"
          : "reward_reveal",
    );

    await wait(presentation.finalImpactDurationMs);
    if (runTokenRef.current !== currentToken) return;

    const nextGemAmount = getChestGemReward(chest.id, pulseResult.settledRarity, chest.source);
    await onOpen({
      chestId: chest.id,
      finalRarity: pulseResult.settledRarity,
      gemsAwarded: nextGemAmount,
      tapsUsed: nextPulseCount,
    });

    setGemAmount(nextGemAmount);
    setOpened(true);
    setScenePhase("opened");
    setShowRewardValue(true);
    setRewardCountToken((value) => value + 1);
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#070C16]"
      onClick={playPulse}
    >
      <style>{`
        @keyframes rewardSceneGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes rewardSceneFogDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -12px, 0) scale(1.05); }
        }
        @keyframes rewardSceneLegendaryRays {
          0%, 100% { opacity: 0.34; transform: translateY(0); }
          50% { opacity: 0.55; transform: translateY(8px); }
        }
        @keyframes rewardSceneMythicShift {
          0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
          50% { transform: scale(1.08) rotate(180deg); filter: hue-rotate(90deg); }
          100% { transform: scale(1) rotate(360deg); filter: hue-rotate(180deg); }
        }
        @keyframes rewardSceneMythicBeams {
          0%, 100% { opacity: 0.28; transform: translateY(0); }
          50% { opacity: 0.46; transform: translateY(12px); }
        }
        @keyframes rewardSceneImpactFlash {
          0% { opacity: 0; }
          24% { opacity: 0.96; }
          100% { opacity: 0; }
        }
        @keyframes rewardSceneShakeLight {
          0%, 100% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-4px, 1px, 0); }
          40% { transform: translate3d(4px, -1px, 0); }
          60% { transform: translate3d(-3px, 0, 0); }
          80% { transform: translate3d(3px, 0, 0); }
        }
        @keyframes rewardSceneShakeHeavy {
          0%, 100% { transform: translate3d(0, 0, 0); }
          16% { transform: translate3d(-8px, 2px, 0); }
          32% { transform: translate3d(8px, -2px, 0); }
          48% { transform: translate3d(-6px, 1px, 0); }
          64% { transform: translate3d(6px, -1px, 0); }
          80% { transform: translate3d(-3px, 0, 0); }
        }
        @keyframes rewardSceneShakeMythic {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          12% { transform: translate3d(-10px, 2px, 0) scale(1.01); }
          24% { transform: translate3d(10px, -2px, 0) scale(1.01); }
          36% { transform: translate3d(-8px, 1px, 0) scale(1.012); }
          48% { transform: translate3d(8px, -1px, 0) scale(1.012); }
          60% { transform: translate3d(-6px, 0, 0) scale(1.01); }
          72% { transform: translate3d(6px, 0, 0) scale(1.01); }
          84% { transform: translate3d(-2px, 0, 0) scale(1.004); }
        }
        @keyframes rewardRevealTitleIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.72);
            filter: blur(10px);
          }
          58% {
            opacity: 1;
            transform: translateY(-4px) scale(1.08);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0);
          }
        }
        @keyframes rewardRarityHitIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
            filter: blur(6px);
          }
          58% {
            opacity: 1;
            transform: translateY(-2px) scale(1.06);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0);
          }
        }
        @keyframes rewardRarityGlimpse {
          0% { opacity: 0.24; }
          35% { opacity: 0.74; }
          100% { opacity: 0.68; }
        }
        @keyframes rewardCounterIn {
          0% { opacity: 0; transform: translateY(18px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#060A13_0%,#091120_50%,#060A13_100%)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              sceneRarity === "common"
                ? "radial-gradient(circle at 50% 36%, rgba(255,255,255,0.06), transparent 26%)"
                : sceneRarity === "rare"
                  ? "radial-gradient(circle at 50% 34%, rgba(59,130,246,0.22), transparent 32%), radial-gradient(circle at 20% 72%, rgba(96,165,250,0.08), transparent 24%), radial-gradient(circle at 80% 20%, rgba(147,197,253,0.1), transparent 22%)"
                  : sceneRarity === "epic"
                    ? "radial-gradient(circle at 50% 34%, rgba(168,85,247,0.28), transparent 34%), radial-gradient(circle at 18% 74%, rgba(196,181,253,0.1), transparent 22%), radial-gradient(circle at 82% 22%, rgba(217,70,239,0.1), transparent 24%)"
                    : sceneRarity === "legendary"
                      ? "radial-gradient(circle at 50% 32%, rgba(246,211,106,0.28), transparent 34%), linear-gradient(180deg, rgba(251,191,36,0.16) 0%, transparent 46%)"
                      : "radial-gradient(circle at 50% 32%, rgba(236,72,153,0.24), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 46%)",
            animation: freezeFrame
              ? "none"
              : sceneRarity === "common"
                ? "none"
                : "rewardSceneGlow 3.6s ease-in-out infinite",
          }}
        />

        {sceneRarity === "legendary" ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,239,174,0.32) 0%, transparent 34%), repeating-linear-gradient(108deg, rgba(255,231,142,0.12) 0px, rgba(255,231,142,0.12) 16px, transparent 16px, transparent 74px)",
              mixBlendMode: "screen",
              animation: freezeFrame ? "none" : "rewardSceneLegendaryRays 4.2s ease-in-out infinite",
            }}
          />
        ) : null}

        {sceneRarity === "mythic" ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, rgba(236,72,153,0.2), rgba(139,92,246,0.18), rgba(59,130,246,0.18), rgba(245,158,11,0.16), rgba(236,72,153,0.2))",
                mixBlendMode: "screen",
                animation: freezeFrame ? "none" : "rewardSceneMythicShift 12s linear infinite",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 40%), repeating-linear-gradient(112deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 18px, transparent 18px, transparent 76px)",
                mixBlendMode: "screen",
                animation: freezeFrame ? "none" : "rewardSceneMythicBeams 5.2s ease-in-out infinite",
              }}
            />
          </>
        ) : null}
      </div>

      {impactFlashToken ? (
        <div
          key={impactFlashToken}
          className="pointer-events-none absolute inset-0"
          style={{
            animation: "rewardSceneImpactFlash 420ms ease-out forwards",
            background:
              sceneRarity === "mythic"
                ? "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.82), rgba(236,72,153,0.24) 36%, transparent 62%)"
                : `radial-gradient(circle at 50% 46%, rgba(255,255,255,0.74), ${theme.aura} 42%, transparent 66%)`,
          }}
        />
      ) : null}

      {particleBurst ? <RewardParticles {...particleBurst} /> : null}

      <div
        className="relative flex min-h-[100dvh] flex-col px-5 pb-6 pt-6 sm:px-8"
        style={{ animation: sceneShakeAnimation ?? undefined }}
      >
        {!cinematicReveal ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/35">
                {chest.source === "quest" ? "Quest Reward" : "Path Reward"}
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-white/92 sm:text-5xl">
                {chest.title}
              </h2>
              <p className="mt-2 text-base font-semibold text-white/54">{chest.sourceLabel}</p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                closeModal();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/12 bg-white/8 text-white/60 transition hover:text-white/85"
              aria-label="Close reward chest"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="h-6 sm:h-10" />
        )}

        <div className="flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
          <div className="w-full max-w-5xl">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <PulseSigils
                currentPulse={currentPulse}
                rarity={sceneRarity}
                freezeFrame={freezeFrame}
                opened={opened}
              />

              <div className="mt-6 flex min-h-[4.5rem] items-center justify-center sm:min-h-[5.75rem]">
                <p
                  key={`rarity-title-${rarityTitleToken}-${rarityTitleMode}`}
                  className={`text-center font-black uppercase tracking-[0.12em] ${
                    rarityTitleMode === "final"
                      ? "text-5xl sm:text-7xl"
                      : "text-3xl sm:text-5xl"
                  }`}
                  style={{
                    ...getActiveRarityTitleStyle(rarityTitleRarity, rarityTitleMode),
                    animation:
                      rarityTitleMode === "final"
                        ? "rewardRevealTitleIn 680ms cubic-bezier(0.2, 0.88, 0.18, 1) forwards"
                        : rarityTitleMode === "hit"
                          ? "rewardRarityHitIn 240ms cubic-bezier(0.2, 0.88, 0.18, 1) forwards"
                          : rarityTitleMode === "glimpse"
                            ? "rewardRarityGlimpse 120ms linear forwards"
                            : undefined,
                  }}
                >
                  {rarityTitleText}
                </p>
              </div>

              <div className="relative mt-4 flex min-h-[22rem] w-full items-center justify-center sm:min-h-[30rem]">
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[18rem] w-[18rem] -translate-y-1/2 rounded-full blur-[88px] sm:h-[24rem] sm:w-[24rem]"
                  style={{
                    background:
                      sceneRarity === "mythic"
                        ? "conic-gradient(from 180deg at 50% 50%, rgba(236,72,153,0.22), rgba(139,92,246,0.24), rgba(59,130,246,0.22), rgba(245,158,11,0.18), rgba(236,72,153,0.22))"
                        : `radial-gradient(circle, ${getChestTheme(sceneRarity).aura} 0%, rgba(255,255,255,0) 72%)`,
                    opacity: freezeFrame ? 0.98 : 0.88,
                    animation: freezeFrame ? "none" : "rewardSceneFogDrift 4.8s ease-in-out infinite",
                  }}
                />

                <RewardChestArt
                  rarity={displayRarity}
                  auraRarity={auraRarity}
                  opened={opened}
                  sceneTint={opened || busy || pulseCount > 0 || auraRarity !== null}
                  className="w-[min(88vw,24rem)] sm:w-[min(74vw,28rem)]"
                  motion={
                    freezeFrame
                      ? "still"
                      : opened
                        ? "opened"
                        : scenePhase === "charging"
                          ? "charging"
                          : scenePhase === "recoil"
                            ? "recoil"
                            : scenePhase === "near-miss"
                              ? "near-miss"
                              : scenePhase === "upgrading"
                                ? "upgrade"
                                : scenePhase === "locking"
                                  ? "lock"
                                  : "idle"
                  }
                  energyLevel={storedEnergy + (busy ? 0.1 : 0)}
                  shakeLevel={
                    freezeFrame
                      ? 0
                      : scenePhase === "locking"
                        ? sceneRarity === "mythic"
                          ? 4
                          : sceneRarity === "legendary"
                            ? 3
                            : 2
                        : scenePhase === "upgrading"
                          ? pulseCount >= 2
                            ? 2
                            : 1
                          : scenePhase === "charging"
                            ? pulseCount >= 3
                              ? 2
                              : 1
                            : scenePhase === "near-miss"
                              ? 1
                              : 0
                  }
                  animationToken={motionToken}
                />
              </div>

              <div className="min-h-[9rem]">
                {showRewardValue ? (
                  <div
                    key={`reward-count-${rewardCountToken}`}
                    className="mt-4 flex flex-col items-center"
                    style={{ animation: "rewardCounterIn 380ms cubic-bezier(0.18, 0.88, 0.18, 1) forwards" }}
                  >
                    <p className="text-6xl font-black tracking-[-0.06em] text-white sm:text-8xl">
                      {displayedGemAmount}
                    </p>
                    <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.3em] text-white/38">
                      Gems Reward
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="pb-2 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/22">
            {opened ? "Tap anywhere to continue" : busy ? "" : "Tap anywhere"}
          </p>
        </div>
      </div>
    </div>
  );
}
