"use client";

import type { FunctionalProductId } from "@/lib/cosmetics";

type ShopIconKind =
  | "pathTheme"
  | "chestSkin"
  | "trailEffect"
  | "nodeEffect"
  | "profileBorder"
  | "titleBadge"
  | "functional";

type ShopItemIconProps = {
  kind: ShopIconKind;
  assetId: string;
  accent: string;
  className?: string;
};

function BaseSvg({
  children,
  className = "h-9 w-9",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function PathThemeIcon({ accent, className }: { accent: string; className?: string }) {
  return (
    <BaseSvg className={className}>
      <defs>
        <linearGradient id="shop-theme-node" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <rect x="6" y="7" width="14" height="14" rx="4" fill="url(#shop-theme-node)" />
      <rect x="28" y="13" width="14" height="14" rx="4" fill="url(#shop-theme-node)" opacity="0.78" />
      <rect x="12" y="29" width="14" height="14" rx="4" fill="url(#shop-theme-node)" opacity="0.9" />
      <path d="M19 16H29V18H19zM31 20V29H29V20zM19 34H12V32H19z" fill={accent} opacity="0.55" />
    </BaseSvg>
  );
}

function ChestSkinIcon({ accent, className }: { accent: string; className?: string }) {
  return (
    <BaseSvg className={className}>
      <defs>
        <linearGradient id="shop-chest-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <path d="M13 18.5L24 10L35 18.5" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="11" y="19" width="26" height="17" rx="4.5" fill="url(#shop-chest-body)" />
      <path d="M11 25H37" stroke="white" strokeOpacity="0.66" strokeWidth="3" />
      <path d="M23 19V36" stroke="white" strokeOpacity="0.48" strokeWidth="3" />
      <rect x="20" y="22.5" width="8" height="10" rx="3" fill="#f8fafc" fillOpacity="0.9" />
      <circle cx="24" cy="27.5" r="1.8" fill={accent} />
    </BaseSvg>
  );
}

function TrailEffectIcon({ accent, assetId, className }: { accent: string; assetId: string; className?: string }) {
  const particle =
    assetId === "lightning"
      ? <path d="M27 8L18 24H25L21 40L32 22H24L27 8Z" fill={accent} />
      : assetId === "bubble"
        ? (
            <>
              <circle cx="18" cy="16" r="3" fill={accent} fillOpacity="0.8" />
              <circle cx="30" cy="12" r="2" fill={accent} fillOpacity="0.55" />
              <circle cx="29" cy="27" r="4" fill={accent} fillOpacity="0.72" />
            </>
          )
        : assetId === "ghost"
          ? <path d="M31 15c0 5.1-3 10.1-7 10.1S17 20.1 17 15c0-3.7 3.1-6.5 7-6.5s7 2.8 7 6.5Z" fill={accent} opacity="0.78" />
          : assetId === "cherry_blossom"
            ? <path d="M24 12c2 0 3 1.6 3 3.1 1.8-.8 3.8.4 3.8 2.4 0 2.3-2.2 3.2-4.1 3.2.8 1.9-.1 4.1-2.7 4.1-2.3 0-3.2-1.9-3-3.7-1.8.4-3.8-.8-3.8-2.9 0-2 1.8-3 3.6-3.1C20.4 13.6 21.6 12 24 12Z" fill={accent} opacity="0.82" />
            : assetId === "constellation"
              ? (
                  <>
                    <circle cx="16" cy="14" r="2" fill={accent} />
                    <circle cx="31" cy="18" r="2.2" fill={accent} />
                    <circle cx="21" cy="32" r="2" fill={accent} />
                    <path d="M16 14L31 18L21 32" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
                  </>
                )
              : <circle cx="30" cy="14" r="3" fill={accent} opacity="0.88" />;

  return (
    <BaseSvg className={className}>
      <path d="M16 40V11" stroke={accent} strokeWidth="4.5" strokeLinecap="round" opacity="0.4" />
      <path d="M24 36V8" stroke={accent} strokeWidth="4.5" strokeLinecap="round" opacity="0.95" />
      <path d="M32 40V15" stroke={accent} strokeWidth="4.5" strokeLinecap="round" opacity="0.6" />
      {particle}
    </BaseSvg>
  );
}

function NodeEffectIcon({ accent, assetId, className }: { accent: string; assetId: string; className?: string }) {
  const particles =
    assetId === "embers"
      ? (
          <>
            <circle cx="18" cy="28" r="2.2" fill={accent} />
            <circle cx="27" cy="18" r="1.8" fill={accent} fillOpacity="0.8" />
            <circle cx="31" cy="11" r="1.4" fill={accent} fillOpacity="0.58" />
          </>
        )
      : assetId === "snowflakes"
        ? (
            <>
              <path d="M17 16V24M13 20H21M14.5 17.5L19.5 22.5M19.5 17.5L14.5 22.5" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M30 11V17M27 14H33M28.2 12.2L31.8 15.8M31.8 12.2L28.2 15.8" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
            </>
          )
        : assetId === "leaves"
          ? (
              <>
                <path d="M18 14c3 0 5 2 5 5-3 0-5-2-5-5Z" fill={accent} />
                <path d="M28 20c3 0 5 2 5 5-3 0-5-2-5-5Z" fill={accent} opacity="0.82" />
              </>
            )
          : assetId === "fireflies"
            ? (
                <>
                  <circle cx="17" cy="15" r="2.2" fill={accent} />
                  <circle cx="31" cy="13" r="1.8" fill={accent} fillOpacity="0.72" />
                  <circle cx="28" cy="27" r="2" fill={accent} fillOpacity="0.84" />
                </>
              )
            : (
                <>
                  <path d="M24 11L25.9 16.5L31.8 16.7L27.1 20.1L28.8 25.6L24 22.3L19.2 25.6L20.9 20.1L16.2 16.7L22.1 16.5L24 11Z" fill={accent} />
                  {assetId === "stardust_nodes" && <circle cx="33" cy="13" r="1.5" fill={accent} fillOpacity="0.7" />}
                </>
              );

  return (
    <BaseSvg className={className}>
      <rect x="10" y="26" width="28" height="12" rx="4.5" fill={accent} opacity="0.14" />
      <rect x="13" y="23" width="22" height="10" rx="4" fill={accent} opacity="0.3" />
      {particles}
    </BaseSvg>
  );
}

function ProfileBorderIcon({ accent, className }: { accent: string; className?: string }) {
  return (
    <BaseSvg className={className}>
      <circle cx="24" cy="24" r="14.5" stroke={accent} strokeWidth="4.5" />
      <circle cx="24" cy="24" r="8.5" fill={accent} fillOpacity="0.2" />
      <circle cx="24" cy="24" r="4.5" fill={accent} fillOpacity="0.82" />
    </BaseSvg>
  );
}

function TitleBadgeIcon({ accent, className }: { accent: string; className?: string }) {
  return (
    <BaseSvg className={className}>
      <path d="M12 15.5C12 12.5 14.4 10 17.4 10H30.6C33.6 10 36 12.5 36 15.5V23.4C36 26.4 33.6 28.8 30.6 28.8H22.2L17 34.5V28.8H17.4C14.4 28.8 12 26.4 12 23.4V15.5Z" fill={accent} opacity="0.9" />
      <path d="M18 19H30M18 24H26" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    </BaseSvg>
  );
}

function FunctionalIcon({ accent, assetId, className }: { accent: string; assetId: string; className?: string }) {
  const id = assetId as FunctionalProductId;
  return (
    <BaseSvg className={className}>
      {id === "streak_freeze" && (
        <>
          <path d="M24 10C19 10 15 14.1 15 19.2c0 8 9 16 9 16s9-8 9-16C33 14.1 29 10 24 10Z" fill={accent} opacity="0.2" />
          <path d="M24 12.5C19.9 12.5 16.7 15.7 16.7 19.8c0 6.2 7.3 12.8 7.3 12.8s7.3-6.6 7.3-12.8c0-4.1-3.2-7.3-7.3-7.3Z" stroke={accent} strokeWidth="2.8" />
          <path d="M20 20.5h8M24 16.5v8" stroke={accent} strokeWidth="2.8" strokeLinecap="round" />
        </>
      )}
      {id === "streak_shield_pack" && (
        <>
          <path d="M24 9l11 4v8c0 7.4-4.9 13.1-11 16-6.1-2.9-11-8.6-11-16v-8l11-4Z" fill={accent} opacity="0.18" />
          <path d="M24 9l11 4v8c0 7.4-4.9 13.1-11 16-6.1-2.9-11-8.6-11-16v-8l11-4Z" stroke={accent} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M18.5 23.5l3.4 3.4 7.6-7.8" stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {id === "xp_boost" && (
        <>
          <circle cx="24" cy="24" r="12" fill={accent} opacity="0.18" />
          <path d="M25.5 10L17.2 25H24l-1.5 13 8.3-15H24l1.5-13Z" fill={accent} />
        </>
      )}
      {id === "perfect_run_token" && (
        <>
          <circle cx="24" cy="24" r="12.5" stroke={accent} strokeWidth="3.2" />
          <path d="M24 13l2.5 7.3h7.7l-6.2 4.5 2.4 7.2-6.4-4.4-6.4 4.4 2.4-7.2-6.2-4.5h7.7L24 13Z" fill={accent} opacity="0.9" />
        </>
      )}
    </BaseSvg>
  );
}

export default function ShopItemIcon({ kind, assetId, accent, className = "h-9 w-9" }: ShopItemIconProps) {
  switch (kind) {
    case "pathTheme":
      return <PathThemeIcon accent={accent} className={className} />;
    case "chestSkin":
      return <ChestSkinIcon accent={accent} className={className} />;
    case "trailEffect":
      return <TrailEffectIcon accent={accent} assetId={assetId} className={className} />;
    case "nodeEffect":
      return <NodeEffectIcon accent={accent} assetId={assetId} className={className} />;
    case "profileBorder":
      return <ProfileBorderIcon accent={accent} className={className} />;
    case "titleBadge":
      return <TitleBadgeIcon accent={accent} className={className} />;
    case "functional":
      return <FunctionalIcon accent={accent} assetId={assetId} className={className} />;
    default:
      return null;
  }
}
