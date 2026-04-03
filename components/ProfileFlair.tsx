"use client";

import { useThemeContext } from "@/contexts/ThemeContext";

type AvatarSize = "compact" | "default" | "hero";

function getAvatarSizing(size: AvatarSize) {
  if (size === "hero") {
    return {
      shell: "h-32 w-32 p-[4px]",
      inner: "text-3xl",
    };
  }

  if (size === "compact") {
    return {
      shell: "h-11 w-11 p-[3px]",
      inner: "text-lg",
    };
  }

  return {
    shell: "h-16 w-16 p-[3px]",
    inner: "text-lg",
  };
}

function getBorderAnimationClass(animation: "spin" | "pulse" | "shimmer" | undefined) {
  switch (animation) {
    case "spin":
      return "profile-border-spin";
    case "shimmer":
      return "profile-border-shimmer";
    case "pulse":
      return "profile-border-pulse";
    default:
      return "";
  }
}

export function ProfileAvatar({
  name,
  size = "default",
  ambient = true,
  borderOverride,
}: {
  name: string;
  size?: AvatarSize;
  ambient?: boolean;
  borderOverride?: {
    gradient: string;
    glow: string;
    animation?: "spin" | "pulse" | "shimmer";
  } | null;
}) {
  const { profileBorder } = useThemeContext();
  const activeBorder = borderOverride ?? profileBorder;
  const sizing = getAvatarSizing(size);
  const initials = (name || "P").slice(0, 2).toUpperCase();
  const animationClass = getBorderAnimationClass(activeBorder?.animation);

  return (
    <div className={`relative flex items-center justify-center rounded-full ${sizing.shell}`}>
      <style>{`
        @keyframes profileBorderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes profileBorderPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.08); }
        }
        @keyframes profileBorderShimmer {
          0%, 100% { opacity: 0.88; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        .profile-border-spin { animation: profileBorderSpin 8.5s linear infinite; }
        .profile-border-pulse { animation: profileBorderPulse 2.8s ease-in-out infinite; }
        .profile-border-shimmer { animation: profileBorderShimmer 3.2s ease-in-out infinite; }
      `}</style>

      {ambient && (
        <div
          className="pointer-events-none absolute inset-[-10%] rounded-full blur-2xl"
          style={{
            background: activeBorder?.gradient ?? "linear-gradient(135deg,#cbd5e1 0%,#94a3b8 100%)",
            opacity: size === "hero" ? 0.32 : 0.18,
          }}
        />
      )}

      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full ${animationClass}`}
        style={{
          background: activeBorder?.gradient ?? "linear-gradient(135deg,#cbd5e1 0%,#94a3b8 100%)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.54), 0 14px 32px ${activeBorder?.glow ?? "rgba(148,163,184,0.16)"}`,
        }}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-white">
          <span className={`font-black ${sizing.inner}`}>{initials}</span>
        </div>
      </div>
    </div>
  );
}

export function ProfileFlair({
  name,
  subtitle,
  compact = false,
}: {
  name: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const { titleBadge } = useThemeContext();

  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "rounded-[1.8rem] border border-white/70 bg-[rgba(255,255,255,0.82)] px-4 py-4 shadow-sm"}`}>
      <ProfileAvatar name={name} size={compact ? "compact" : "default"} ambient={!compact} />
      <div className="min-w-0">
        <p className={`truncate font-black text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>{name}</p>
        {titleBadge && (
          <span
            className="mt-1 inline-flex max-w-full truncate rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{
              background: titleBadge.tone,
              boxShadow: `0 10px 24px ${titleBadge.glow}`,
              borderColor: "rgba(255,255,255,0.36)",
            }}
          >
            {titleBadge.name}
          </span>
        )}
        {subtitle && <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
