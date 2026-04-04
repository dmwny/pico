"use client";
import { ChestIllustration } from "@/components/rewards/ChestIllustration";
import { useThemeContext } from "@/contexts/ThemeContext";
import { ChestRarity } from "@/lib/rewardChests";

type PathChestNodeProps = {
  rarity: ChestRarity;
  className?: string;
};

function CelestialOrrery({ opened, className = "" }: { opened: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes pathOrreryOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pathOrreryPulse {
          0%, 100% { transform: scale(1); opacity: 0.72; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
      {!opened ? (
        <span
          className="absolute inset-[-10%] rounded-full blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(253,224,71,0.34) 0%, rgba(191,219,254,0.16) 42%, transparent 70%)",
            animation: "pathOrreryPulse 2.2s ease-in-out infinite",
          }}
        />
      ) : null}
      <svg viewBox="0 0 96 96" className="relative h-full w-full" fill="none" aria-hidden="true">
        <circle cx="48" cy="48" r="12" fill={opened ? "#94A3B8" : "#F8FAFC"} opacity={opened ? 0.55 : 0.92} />
        <circle cx="48" cy="48" r="6" fill={opened ? "#CBD5E1" : "#FDE68A"} opacity={opened ? 0.52 : 1} />
        <g style={{ animation: opened ? "none" : "pathOrreryOrbit 7s linear infinite", transformOrigin: "48px 48px" }}>
          <ellipse cx="48" cy="48" rx="28" ry="16" stroke={opened ? "rgba(203,213,225,0.35)" : "rgba(191,219,254,0.75)"} strokeWidth="2.2" />
          <circle cx="74" cy="48" r="4" fill={opened ? "#CBD5E1" : "#FDE68A"} opacity={opened ? 0.46 : 0.92} />
        </g>
        <g style={{ animation: opened ? "none" : "pathOrreryOrbit 10s linear infinite reverse", transformOrigin: "48px 48px" }}>
          <ellipse cx="48" cy="48" rx="20" ry="30" stroke={opened ? "rgba(203,213,225,0.26)" : "rgba(250,204,21,0.58)"} strokeWidth="2" />
          <circle cx="48" cy="18" r="3.6" fill={opened ? "#CBD5E1" : "#FFFFFF"} opacity={opened ? 0.32 : 0.88} />
        </g>
        <g opacity={opened ? 0.45 : 1}>
          <path d="M28 59L38 28H58L68 59" fill={opened ? "#64748B" : "#0F172A"} />
          <path d="M28 59H68" stroke={opened ? "#94A3B8" : "#F8FAFC"} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M38 28L48 18L58 28" stroke={opened ? "#94A3B8" : "#F8FAFC"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function VoidRift({ opened, className = "" }: { opened: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes pathRiftPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
      {!opened ? (
        <span
          className="absolute inset-[-12%] rounded-full blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(139,92,246,0.18) 28%, transparent 60%)",
            animation: "pathRiftPulse 2s ease-in-out infinite",
          }}
        />
      ) : null}
      <svg viewBox="0 0 96 96" className="relative h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="path-void-rift" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="58%" stopColor={opened ? "#12081f" : "#1a0a2e"} />
            <stop offset="82%" stopColor={opened ? "#8b5cf6" : "#ffffff"} stopOpacity={opened ? 0.46 : 0.88} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <ellipse cx="48" cy="48" rx="20" ry="28" fill="url(#path-void-rift)" />
        <path d="M44 16C40 26 42 34 36 44C30 54 34 68 42 78" stroke="rgba(255,255,255,0.58)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M56 20C60 34 56 44 62 54C68 64 64 72 56 82" stroke="rgba(255,255,255,0.42)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ClosedChestNode({ rarity, className = "" }: PathChestNodeProps) {
  const { chestSkin } = useThemeContext();

  if (chestSkin.id === "celestial_orrery") {
    return <CelestialOrrery opened={false} className={className} />;
  }

  if (chestSkin.id === "void_rift") {
    return <VoidRift opened={false} className={className} />;
  }

  return (
    <ChestIllustration
      state="closed"
      rarity={rarity}
      tone="base"
      skin={chestSkin.id}
      glowMode="pulse"
      float
      shine
      className={className}
    />
  );
}

export function OpenChestNode({ rarity, className = "" }: PathChestNodeProps) {
  const { chestSkin } = useThemeContext();

  if (chestSkin.id === "celestial_orrery") {
    return <CelestialOrrery opened className={className} />;
  }

  if (chestSkin.id === "void_rift") {
    return <VoidRift opened className={className} />;
  }

  return (
    <ChestIllustration
      state="open"
      rarity={rarity}
      tone="spent"
      skin={chestSkin.id}
      glowMode="none"
      className={className}
    />
  );
}
