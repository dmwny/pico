"use client";

import { ChestRarity, getChestTheme } from "@/lib/rewardChests";
import { ChestIllustration } from "@/components/rewards/ChestIllustration";
import { ChestSkinId } from "@/lib/themes";
import { useThemeContext } from "@/contexts/ThemeContext";

type RewardChestArtMotion =
  | "idle"
  | "still"
  | "charging"
  | "recoil"
  | "upgrade"
  | "near-miss"
  | "lock"
  | "opened";

type RewardChestArtProps = {
  rarity: ChestRarity;
  auraRarity?: ChestRarity | null;
  opened?: boolean;
  skin?: ChestSkinId;
  compact?: boolean;
  mini?: boolean;
  prominent?: boolean;
  className?: string;
  motion?: RewardChestArtMotion;
  energyLevel?: number;
  shakeLevel?: 0 | 1 | 2 | 3 | 4;
  animationToken?: number;
  sceneTint?: boolean;
};

function getLockProfile(rarity: ChestRarity) {
  if (rarity === "mythic") {
    return {
      squashX: 1.18,
      squashY: 0.82,
      stretchX: 0.88,
      stretchY: 1.18,
      jump: 36,
      settle: 11,
      brightness: 1.34,
    };
  }

  if (rarity === "legendary") {
    return {
      squashX: 1.14,
      squashY: 0.86,
      stretchX: 0.9,
      stretchY: 1.14,
      jump: 28,
      settle: 9,
      brightness: 1.26,
    };
  }

  if (rarity === "epic") {
    return {
      squashX: 1.11,
      squashY: 0.89,
      stretchX: 0.92,
      stretchY: 1.1,
      jump: 24,
      settle: 8,
      brightness: 1.22,
    };
  }

  if (rarity === "rare") {
    return {
      squashX: 1.08,
      squashY: 0.92,
      stretchX: 0.94,
      stretchY: 1.08,
      jump: 20,
      settle: 7,
      brightness: 1.18,
    };
  }

  return {
    squashX: 1.06,
    squashY: 0.94,
    stretchX: 0.96,
    stretchY: 1.06,
    jump: 16,
    settle: 6,
    brightness: 1.14,
  };
}

export function RewardChestArt({
  rarity,
  auraRarity = null,
  opened = false,
  skin,
  compact = false,
  mini = false,
  prominent = false,
  className = "",
  motion = "idle",
  energyLevel = 0,
  shakeLevel = 0,
  animationToken = 0,
  sceneTint = false,
}: RewardChestArtProps) {
  const { chestSkin } = useThemeContext();
  const auraTheme = getChestTheme(auraRarity ?? rarity);
  const activeSkin = skin ?? chestSkin.id;
  const chestHeight = mini ? 56 : compact ? (prominent ? 126 : 102) : 320;
  const chestMaxWidth = mini ? 72 : compact ? (prominent ? 148 : 132) : 420;
  const auraSize = mini ? 84 : compact ? (prominent ? 180 : 148) : 360;
  const mythicRingSize = mini ? 90 : compact ? (prominent ? 190 : 154) : 380;
  const orbitRadius = mini ? "42px" : compact ? (prominent ? "90px" : "74px") : "152px";
  const normalizedEnergy = Math.max(0, Math.min(1, energyLevel));
  const motionKey = `${motion}-${animationToken}-${shakeLevel}`;
  const motionClass =
    motion === "charging"
      ? "reward-chest-motion-charging"
      : motion === "recoil"
        ? "reward-chest-motion-recoil"
        : motion === "upgrade"
          ? "reward-chest-motion-upgrade"
          : motion === "near-miss"
            ? "reward-chest-motion-near-miss"
            : motion === "lock"
              ? "reward-chest-motion-lock"
              : motion === "opened"
                ? "reward-chest-motion-opened"
                : motion === "still"
                  ? "reward-chest-motion-still"
                  : "reward-chest-motion-idle";
  const shakeClass =
    shakeLevel === 4
      ? "reward-chest-shake-4"
      : shakeLevel === 3
        ? "reward-chest-shake-3"
        : shakeLevel === 2
          ? "reward-chest-shake-2"
          : shakeLevel === 1
            ? "reward-chest-shake-1"
            : "";
  const auraOpacity = 0.18 + normalizedEnergy * 0.44;
  const haloScale = 0.94 + normalizedEnergy * 0.22;
  const mythicActive = (auraRarity ?? rarity) === "mythic";
  const lockProfile = getLockProfile(rarity);

  return (
    <div
      className={`relative w-full overflow-visible ${className}`}
      style={{ height: chestHeight, maxWidth: chestMaxWidth }}
    >
      <style>{`
        @keyframes rewardChestIdleFloat {
          0%, 100% { transform: translateY(0px) scale(1); filter: brightness(1); }
          50% { transform: translateY(-9px) scale(1.015); filter: brightness(1.05); }
        }
        @keyframes rewardChestCharge {
          0% { transform: translateY(0px) scaleX(1) scaleY(1); filter: brightness(1); }
          34% { transform: translateY(10px) scaleX(0.95) scaleY(1.05); filter: brightness(1.04); }
          100% { transform: translateY(-2px) scaleX(1.04) scaleY(0.98); filter: brightness(1.12); }
        }
        @keyframes rewardChestRecoil {
          0% { transform: translateY(0px) scaleX(1) scaleY(1); }
          25% { transform: translateY(-4px) scaleX(1.03) scaleY(0.97); }
          100% { transform: translateY(7px) scaleX(0.97) scaleY(1.03); }
        }
        @keyframes rewardChestUpgrade {
          0% { transform: translateY(0px) scaleX(0.99) scaleY(1.01); filter: brightness(1.02); }
          36% { transform: translateY(-22px) scaleX(1.08) scaleY(0.92); filter: brightness(1.2); }
          100% { transform: translateY(-6px) scaleX(1.02) scaleY(0.98); filter: brightness(1.1); }
        }
        @keyframes rewardChestNearMiss {
          0% { transform: translateY(0px) scale(1); filter: brightness(1); }
          18% { transform: translateY(-12px) scale(1.08); filter: brightness(1.18); }
          100% { transform: translateY(-2px) scale(1.02); filter: brightness(1.04); }
        }
        @keyframes rewardChestLock {
          0% {
            transform: translateY(0px) scaleX(var(--lock-squash-x)) scaleY(var(--lock-squash-y));
            filter: brightness(1.06);
          }
          18% {
            transform: translateY(0px) scaleX(var(--lock-stretch-x)) scaleY(var(--lock-stretch-y));
            filter: brightness(1.14);
          }
          54% {
            transform: translateY(calc(var(--lock-jump) * -1px)) scaleX(1.07) scaleY(0.93);
            filter: brightness(var(--lock-brightness));
          }
          78% {
            transform: translateY(calc(var(--lock-settle) * -1px)) scaleX(0.99) scaleY(1.02);
            filter: brightness(calc(var(--lock-brightness) - 0.08));
          }
          100% {
            transform: translateY(-6px) scaleX(1.02) scaleY(0.98);
            filter: brightness(calc(var(--lock-brightness) - 0.05));
          }
        }
        @keyframes rewardChestOpened {
          0%, 100% { transform: translateY(-4px) scale(1.02); filter: brightness(1.08); }
          50% { transform: translateY(-12px) scale(1.04); filter: brightness(1.14); }
        }
        @keyframes rewardChestShakeOne {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
        }
        @keyframes rewardChestShakeTwo {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          20% { transform: translateX(-4px) rotate(-1deg); }
          40% { transform: translateX(4px) rotate(1deg); }
          60% { transform: translateX(-3px) rotate(-0.8deg); }
          80% { transform: translateX(3px) rotate(0.8deg); }
        }
        @keyframes rewardChestShakeThree {
          0%, 100% { transform: translateX(0px) rotate(0deg); }
          14% { transform: translateX(-6px) rotate(-1.8deg); }
          28% { transform: translateX(6px) rotate(1.8deg); }
          42% { transform: translateX(-4px) rotate(-1.4deg); }
          56% { transform: translateX(4px) rotate(1.2deg); }
          70% { transform: translateX(-2px) rotate(-0.8deg); }
          84% { transform: translateX(2px) rotate(0.6deg); }
        }
        @keyframes rewardChestShakeFour {
          0%, 100% { transform: translateX(0px) rotate(0deg) scale(1); }
          10% { transform: translateX(-9px) rotate(-2.4deg) scale(1.01); }
          20% { transform: translateX(9px) rotate(2.4deg) scale(1.01); }
          35% { transform: translateX(-7px) rotate(-2deg) scale(1.012); }
          50% { transform: translateX(7px) rotate(2deg) scale(1.012); }
          65% { transform: translateX(-5px) rotate(-1.4deg) scale(1.008); }
          80% { transform: translateX(5px) rotate(1.4deg) scale(1.008); }
          90% { transform: translateX(-2px) rotate(-0.7deg) scale(1.004); }
        }
        @keyframes rewardChestHaloPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(var(--halo-scale)); opacity: var(--halo-opacity); }
          50% { transform: translate(-50%, -50%) scale(calc(var(--halo-scale) + 0.09)); opacity: calc(var(--halo-opacity) + 0.14); }
        }
        @keyframes rewardChestMythicHalo {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.05); }
        }
        @keyframes rewardChestOrbit {
          0% { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); opacity: 0.5; }
        }
        .reward-chest-motion-idle { animation: rewardChestIdleFloat 2.8s ease-in-out infinite; }
        .reward-chest-motion-still { transform: translateY(0px) scale(1); filter: brightness(1); }
        .reward-chest-motion-charging { animation: rewardChestCharge 420ms cubic-bezier(0.12, 0.9, 0.24, 1) forwards; }
        .reward-chest-motion-recoil { animation: rewardChestRecoil 250ms cubic-bezier(0.22, 0.82, 0.24, 1) forwards; }
        .reward-chest-motion-upgrade { animation: rewardChestUpgrade 280ms cubic-bezier(0.68, 0.02, 0.22, 1) forwards; }
        .reward-chest-motion-near-miss { animation: rewardChestNearMiss 150ms ease-out forwards; }
        .reward-chest-motion-lock { animation: rewardChestLock 760ms cubic-bezier(0.18, 0.88, 0.16, 1) forwards; }
        .reward-chest-motion-opened { animation: rewardChestOpened 2.2s ease-in-out infinite; }
        .reward-chest-shake-1 { animation: rewardChestShakeOne 0.22s linear infinite; }
        .reward-chest-shake-2 { animation: rewardChestShakeTwo 0.18s linear infinite; }
        .reward-chest-shake-3 { animation: rewardChestShakeThree 0.14s linear infinite; }
        .reward-chest-shake-4 { animation: rewardChestShakeFour 0.11s linear infinite; }
      `}</style>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full blur-[56px]"
        style={{
          width: auraSize,
          height: auraSize,
          background: mythicActive
            ? "conic-gradient(from 180deg at 50% 50%, rgba(236,72,153,0.24), rgba(139,92,246,0.26), rgba(59,130,246,0.24), rgba(245,158,11,0.24), rgba(236,72,153,0.24))"
            : `radial-gradient(circle, ${auraTheme.aura} 0%, rgba(255,255,255,0) 72%)`,
          opacity: auraOpacity,
          transform: `translate(-50%, -50%) scale(${haloScale})`,
          animation: motion === "still"
            ? "none"
            : mythicActive
              ? "rewardChestMythicHalo 5.8s linear infinite"
              : "rewardChestHaloPulse 2.5s ease-in-out infinite",
          ["--halo-scale" as string]: `${haloScale}`,
          ["--halo-opacity" as string]: `${auraOpacity}`,
        }}
      />

      {mythicActive ? (
        <>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/20"
            style={{
              width: mythicRingSize,
              height: mythicRingSize,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 36px rgba(255,255,255,0.22), inset 0 0 18px rgba(255,255,255,0.14)",
              opacity: motion === "still" ? 0.88 : 1,
            }}
          />
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="pointer-events-none absolute left-1/2 top-1/2 block rounded-full"
              style={{
                width: mini ? 7 : compact ? 8 : 12,
                height: mini ? 7 : compact ? 8 : 12,
                background: index % 2 === 0 ? "#F9A8D4" : "#93C5FD",
                boxShadow: "0 0 18px rgba(255,255,255,0.72)",
                ["--orbit-radius" as string]: orbitRadius,
                animation: motion === "still" ? "none" : `rewardChestOrbit ${4.6 + index * 0.6}s linear ${index * -0.9}s infinite`,
              }}
            />
          ))}
        </>
      ) : null}

      <div
        key={motionKey}
        className={`relative h-full w-full ${motionClass}`}
        style={{
          ["--lock-squash-x" as string]: `${lockProfile.squashX}`,
          ["--lock-squash-y" as string]: `${lockProfile.squashY}`,
          ["--lock-stretch-x" as string]: `${lockProfile.stretchX}`,
          ["--lock-stretch-y" as string]: `${lockProfile.stretchY}`,
          ["--lock-jump" as string]: `${lockProfile.jump}`,
          ["--lock-settle" as string]: `${lockProfile.settle}`,
          ["--lock-brightness" as string]: `${lockProfile.brightness}`,
        }}
      >
        <div className={`relative h-full w-full ${motion === "still" ? "" : shakeClass}`}>
          <div className={opened ? "drop-shadow-[0_30px_58px_rgba(15,23,42,0.34)]" : "drop-shadow-[0_28px_54px_rgba(15,23,42,0.32)]"}>
            <ChestIllustration
              state={opened ? "open" : "closed"}
              rarity={auraRarity ?? rarity}
              tone={sceneTint ? "tinted" : opened ? "spent" : "base"}
              skin={activeSkin}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
