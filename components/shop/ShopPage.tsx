"use client";

import { useEffect, useRef, useState } from "react";
import AppTopNav from "@/components/AppTopNav";
import PackOpeningModal from "@/components/shop/PackOpeningModal";
import ShopItemIcon from "@/components/shop/ShopItemIcon";
import ThemeCollectionCard from "@/components/shop/ThemeCollectionCard";
import ThemeMiniCard from "@/components/shop/ThemeMiniCard";
import ThemePackCard from "@/components/shop/ThemePackCard";
import { SnowflakeIcon } from "@/components/streak/StreakFlame";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import {
  FunctionalProductId,
  HEART_REFILL_CAP,
  HINT_TOKEN_CAP,
  PERFECT_RUN_TOKEN_CAP,
  STREAK_FREEZE_CAP,
  getFunctionalProductById,
  SHOP_FUNCTIONAL_PRODUCTS,
  SHOP_PACKS,
  ShopTab,
  SuccessfulThemePackOpenResult,
} from "@/lib/cosmetics";
import { PATH_THEME_IDS, PATH_THEMES, mixHex, withAlpha } from "@/lib/themes";

const TAB_OPTIONS: { id: ShopTab; label: string }[] = [
  { id: "packs", label: "Packs" },
  { id: "collection", label: "Collection" },
  { id: "functional", label: "Functional" },
];

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z" fill="currentColor" opacity="0.18" />
      <path d="M7.2 4.5H16.8L21 10.1L12 20L3 10.1L7.2 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4.8L12 10.2L15 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.8 10.2H19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatCompactGems(value: number, infinite = false) {
  if (infinite) return "∞";
  if (value < 1_000) return value.toString();
  if (value < 10_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 100) / 10}k`.replace(".0k", "k");
  return `${Math.round(value / 100_000) / 10}m`.replace(".0m", "m");
}

function CompactFunctionalCard({
  id,
  name,
  description,
  price,
  accent,
  statusLabel,
  badgeLabel,
  confirming,
  processing,
  purchaseDisabled,
  purchaseLabel,
  secondaryLabel,
  secondaryDisabled,
  onPurchaseClick,
  onConfirmPurchase,
  onCancelConfirm,
  onSecondaryAction,
}: {
  id: FunctionalProductId;
  name: string;
  description: string;
  price: number;
  accent: string;
  statusLabel?: string;
  badgeLabel?: string;
  confirming?: boolean;
  processing?: boolean;
  purchaseDisabled?: boolean;
  purchaseLabel?: string;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  onPurchaseClick: () => void;
  onConfirmPurchase: () => void;
  onCancelConfirm: () => void;
  onSecondaryAction?: () => void;
}) {
  const { pathTheme } = useThemeContext();
  return (
    <article
      className="rounded-[1.5rem] border p-4 shadow-[0_20px_40px_rgba(2,6,23,0.2)]"
      style={{
        borderColor: withAlpha(pathTheme.accentColor, 0.16),
        background: pathTheme.surfaceCard,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border"
          style={{
            borderColor: withAlpha(pathTheme.accentColor, 0.16),
            background: withAlpha("#000000", 0.12),
          }}
        >
          <ShopItemIcon kind="functional" assetId={id} accent={accent} className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black" style={{ color: pathTheme.surfaceText }}>{name}</p>
          <p className="mt-1 text-xs font-semibold leading-5" style={{ color: withAlpha(pathTheme.surfaceText, 0.62) }}>{description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.42) }}>Price</p>
          <p className="mt-1 text-base font-black" style={{ color: pathTheme.surfaceText }}>{price}</p>
          {statusLabel ? <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.42) }}>{statusLabel}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          {badgeLabel ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
              {badgeLabel}
            </span>
          ) : null}
          {confirming ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onConfirmPurchase}
                disabled={processing}
                className="rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white"
                style={{ background: pathTheme.accentColor }}
              >
                {processing ? "..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={onCancelConfirm}
                disabled={processing}
                className="rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
                style={{
                  borderColor: withAlpha(pathTheme.accentColor, 0.18),
                  background: withAlpha("#000000", 0.06),
                  color: withAlpha(pathTheme.surfaceText, 0.72),
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onPurchaseClick}
                disabled={purchaseDisabled || processing}
                className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${purchaseDisabled ? "cursor-not-allowed" : ""}`}
                style={purchaseDisabled
                  ? {
                      background: withAlpha(pathTheme.surfaceText, 0.08),
                      color: withAlpha(pathTheme.surfaceText, 0.32),
                    }
                  : {
                      background: pathTheme.accentColor,
                      color: "#ffffff",
                    }}
              >
                {purchaseLabel ?? "Buy"}
              </button>
              {secondaryLabel && onSecondaryAction ? (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  disabled={secondaryDisabled || processing}
                  className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${secondaryDisabled ? "cursor-not-allowed" : ""}`}
                  style={secondaryDisabled
                    ? {
                        borderColor: withAlpha(pathTheme.surfaceText, 0.08),
                        background: withAlpha(pathTheme.surfaceText, 0.04),
                        color: withAlpha(pathTheme.surfaceText, 0.32),
                      }
                    : {
                        borderColor: withAlpha(pathTheme.accentColor, 0.22),
                        background: withAlpha(pathTheme.accentColor, 0.12),
                        color: pathTheme.accentColor,
                      }}
                >
                  {secondaryLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ShopPage() {
  const { pathTheme } = useThemeContext();
  const {
    cosmetics,
    gemBalance,
    infiniteGemsEnabled,
    loading,
    isHydrating,
    openThemePack,
    purchaseEntry,
    equipTheme,
    heartRefillCount,
    hintTokenCount,
    streakFreezeCount,
    perfectRunTokenCount,
    xpBoostCountdown,
    xpBoostActive,
    unlimitedHeartsActive,
    unlimitedHeartsCountdown,
    activateUnlimitedHeartsWithToken,
  } = useCosmetics();

  const [activeTab, setActiveTab] = useState<ShopTab>("packs");
  const [confirmingId, setConfirmingId] = useState<FunctionalProductId | string | null>(null);
  const [processingId, setProcessingId] = useState<FunctionalProductId | string | null>(null);
  const [packOpening, setPackOpening] = useState<SuccessfulThemePackOpenResult | null>(null);
  const [displayedGems, setDisplayedGems] = useState(gemBalance);
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  const [freezeCelebration, setFreezeCelebration] = useState<FunctionalProductId | null>(null);
  const displayedGemRef = useRef(gemBalance);
  const storeReady = !loading && !isHydrating;

  useEffect(() => {
    displayedGemRef.current = displayedGems;
  }, [displayedGems]);

  useEffect(() => {
    let frameId = 0;
    const startValue = displayedGemRef.current;
    const targetValue = gemBalance;
    if (startValue === targetValue) return undefined;
    let startAt = 0;

    const tick = (timestamp: number) => {
      if (!startAt) startAt = timestamp;
      const progress = Math.min(1, (timestamp - startAt) / 640);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayedGems(Math.round(startValue + (targetValue - startValue) * eased));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [gemBalance]);

  useEffect(() => {
    if (!freezeCelebration) return undefined;
    const timeout = window.setTimeout(() => setFreezeCelebration(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [freezeCelebration]);

  const collectionThemes = PATH_THEME_IDS.map((themeId) => PATH_THEMES[themeId]);
  const ownedThemes = cosmetics.owned.pathThemes.map((themeId) => PATH_THEMES[themeId]).slice(0, 10);
  const accentGlow = withAlpha(pathTheme.accentColor, 0.18);

  const getFunctionalCardState = (product: typeof SHOP_FUNCTIONAL_PRODUCTS[number]) => {
    const canAfford = infiniteGemsEnabled || gemBalance >= product.price;

    switch (product.id) {
      case "heart_refill": {
        const atCap = heartRefillCount >= HEART_REFILL_CAP;
        return {
          statusLabel: `Stored ${heartRefillCount} / ${HEART_REFILL_CAP}`,
          badgeLabel: heartRefillCount > 0 ? "Ready" : undefined,
          purchaseDisabled: atCap || !canAfford,
          purchaseLabel: atCap ? "At Cap" : canAfford ? "Buy" : "Need Gems",
        };
      }
      case "streak_freeze": {
        const atCap = streakFreezeCount >= STREAK_FREEZE_CAP;
        return {
          statusLabel: `Stored ${streakFreezeCount} / ${STREAK_FREEZE_CAP}`,
          badgeLabel: streakFreezeCount > 0 ? "Ready" : undefined,
          purchaseDisabled: atCap || !canAfford,
          purchaseLabel: atCap ? "At Cap" : canAfford ? "Buy" : "Need Gems",
        };
      }
      case "streak_shield_pack": {
        const blocked = streakFreezeCount > 0 || !canAfford;
        return {
          statusLabel: `Stored ${streakFreezeCount} / ${STREAK_FREEZE_CAP}`,
          badgeLabel: streakFreezeCount > 0 ? "Own Freezes" : undefined,
          purchaseDisabled: blocked,
          purchaseLabel: streakFreezeCount > 0 ? "Own Freezes" : canAfford ? "Buy" : "Need Gems",
        };
      }
      case "xp_boost":
        return {
          statusLabel: xpBoostActive ? `Active ${xpBoostCountdown}` : "1 hour • doubles XP",
          badgeLabel: xpBoostActive ? "Active" : undefined,
          purchaseDisabled: xpBoostActive || !canAfford,
          purchaseLabel: xpBoostActive ? "Active" : canAfford ? "Buy" : "Need Gems",
        };
      case "perfect_run_token": {
        const atCap = perfectRunTokenCount >= PERFECT_RUN_TOKEN_CAP;
        return {
          statusLabel: `Stored ${perfectRunTokenCount} / ${PERFECT_RUN_TOKEN_CAP}`,
          badgeLabel: perfectRunTokenCount > 0 ? `${perfectRunTokenCount} ready` : undefined,
          purchaseDisabled: atCap || !canAfford,
          purchaseLabel: atCap ? "At Cap" : canAfford ? "Buy" : "Need Gems",
        };
      }
      case "unlimited_hearts_pass":
        return {
          statusLabel: unlimitedHeartsActive ? `Active ${unlimitedHeartsCountdown}` : "24 hours • or use 1 Perfect Run Token",
          badgeLabel: unlimitedHeartsActive ? "Active" : undefined,
          purchaseDisabled: unlimitedHeartsActive || !canAfford,
          purchaseLabel: unlimitedHeartsActive ? "Active" : canAfford ? "Buy" : "Need Gems",
          secondaryLabel: !unlimitedHeartsActive && perfectRunTokenCount > 0 ? "Use Token" : undefined,
          secondaryDisabled: false,
        };
      case "hint_token": {
        const atCap = hintTokenCount >= HINT_TOKEN_CAP;
        return {
          statusLabel: `Stored ${hintTokenCount} / ${HINT_TOKEN_CAP}`,
          badgeLabel: hintTokenCount > 0 ? `${hintTokenCount} ready` : undefined,
          purchaseDisabled: atCap || !canAfford,
          purchaseLabel: atCap ? "At Cap" : canAfford ? "Buy" : "Need Gems",
        };
      }
      default:
        return {
          statusLabel: undefined,
          badgeLabel: undefined,
          purchaseDisabled: !canAfford,
          purchaseLabel: canAfford ? "Buy" : "Need Gems",
        };
    }
  };

  const handleConfirmPurchase = async (entryId: FunctionalProductId) => {
    if (processingId) return;
    setProcessingId(entryId);
    try {
      const result = await purchaseEntry(entryId);
      if (!result.ok) return;
      if (entryId === "streak_freeze" || entryId === "streak_shield_pack") {
        setFreezeCelebration(entryId);
      }
      setConfirmingId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmPackOpen = async (packId: string) => {
    if (processingId) return;
    setProcessingId(packId);
    try {
      const result = await openThemePack(packId as typeof SHOP_PACKS[number]["id"]);
      if (!result.ok) return;
      setConfirmingId(null);
      setPackOpening(result);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: pathTheme.surfaceBackground }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: pathTheme.pageOverlay, opacity: 0.92 }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 18% 16%, ${withAlpha(pathTheme.accentColor, 0.18)}, transparent 28%), radial-gradient(circle at 82% 24%, ${withAlpha(pathTheme.previewHighlight, 0.16)}, transparent 32%)`,
        }}
      />
      <AppTopNav />
      <style>{`
        @keyframes shopMoteFloat {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.08; }
          50% { transform: translate3d(18px, -24px, 0); opacity: 0.18; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-white/30 blur-[2px]"
            style={{
              left: `${(index * 19) % 100}%`,
              top: `${(index * 13) % 100}%`,
              width: 3 + (index % 3),
              height: 3 + (index % 3),
              animation: `shopMoteFloat ${12 + (index % 5) * 2.5}s ease-in-out ${index * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section
          className="overflow-hidden rounded-[2.5rem] border px-5 py-6 shadow-[0_40px_120px_rgba(2,6,23,0.4)] sm:px-7 lg:px-8"
          style={{
            borderColor: withAlpha(pathTheme.accentColor, 0.18),
            background: `${pathTheme.surfaceDark}`,
            boxShadow: `0 40px 120px ${accentGlow}`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[0.72rem] font-black uppercase tracking-[0.34em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.46) }}>Pack Vault</p>
              <h1 className="mt-4 text-4xl font-black sm:text-5xl">Open Theme Packs</h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7" style={{ color: withAlpha(pathTheme.surfaceText, 0.72) }}>
                Each pack is its own object, its own reveal, and its own chance at a world that changes how the learn path feels.
              </p>
            </div>

            <div
              className="rounded-[1.6rem] border px-5 py-4 shadow-[0_20px_40px_rgba(2,6,23,0.28)]"
              style={{
                borderColor: withAlpha(pathTheme.accentColor, 0.22),
                background: pathTheme.surfaceCard,
              }}
            >
              <p className="text-[0.62rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.5) }}>Gem Balance</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-400/16 bg-sky-400/10 text-sky-200">
                  <GemIcon />
                </span>
                <div>
                  <p className="text-3xl font-black" style={{ color: pathTheme.surfaceText }}>{formatCompactGems(displayedGems, infiniteGemsEnabled)}</p>
                  <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.42) }}>
                    {infiniteGemsEnabled ? "Infinite gems enabled" : "Ready to spend"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-6 inline-flex rounded-full border p-1"
            style={{
              borderColor: withAlpha(pathTheme.accentColor, 0.18),
              background: withAlpha("#000000", 0.18),
            }}
          >
            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setConfirmingId(null);
                }}
                className="rounded-full px-4 py-2 text-sm font-black transition"
                style={activeTab === tab.id
                  ? {
                      background: `linear-gradient(135deg, ${pathTheme.accentColor} 0%, ${mixHex(pathTheme.accentColor, pathTheme.previewHighlight, 0.36)} 100%)`,
                      color: "#ffffff",
                    }
                  : {
                      color: withAlpha(pathTheme.surfaceText, 0.58),
                    }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "packs" ? (
            <div className="mt-8 space-y-8">
              <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(8,12,24,0.9),rgba(4,7,16,0.94))] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  {storeReady ? (
                    SHOP_PACKS.map((pack, index) => (
                      <div
                        key={pack.id}
                        className={`${index % 2 === 0 ? "lg:-translate-y-2" : "lg:translate-y-6"} transition-transform`}
                      >
                        <ThemePackCard
                          pack={pack}
                          pityState={cosmetics.pity}
                          expanded={expandedPackId === pack.id}
                          confirming={confirmingId === pack.id}
                          celebrating={false}
                          processing={processingId === pack.id}
                          canAfford={infiniteGemsEnabled || gemBalance >= pack.price}
                          onOpenClick={setConfirmingId}
                          onConfirmOpen={(packId) => void handleConfirmPackOpen(packId)}
                          onCancelConfirm={() => setConfirmingId(null)}
                          onToggleExpanded={(packId) => setExpandedPackId((current) => (current === packId ? null : packId))}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-semibold text-white/54">
                      Loading pack odds, pity state, and collection...
                    </div>
                  )}
                </div>
              </section>

              <section
                className="rounded-[2rem] border p-5 shadow-[0_24px_60px_rgba(2,6,23,0.26)]"
                style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: pathTheme.surfaceCard }}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.4) }}>Your Collection</p>
                    <p className="mt-2 text-2xl font-black" style={{ color: pathTheme.surfaceText }}>{cosmetics.owned.pathThemes.length} themes discovered</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("collection")}
                    className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
                    style={{
                      borderColor: withAlpha(pathTheme.accentColor, 0.18),
                      color: pathTheme.accentColor,
                      background: withAlpha(pathTheme.accentColor, 0.08),
                    }}
                  >
                    View Full Collection
                  </button>
                </div>
                <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
                  {ownedThemes.map((theme) => (
                    <ThemeMiniCard key={theme.id} themeId={theme.id} size="strip" className="shrink-0" />
                  ))}
                </div>
              </section>

              <section
                className="rounded-[2rem] border p-5"
                style={{ borderColor: withAlpha(pathTheme.accentColor, 0.14), background: withAlpha("#000000", 0.12) }}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/34">Functional Items</p>
                    <p className="mt-2 text-xl font-black text-white">Utility only. Helpful, but not the star of the shop.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/36">
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Heart Refills {heartRefillCount}/{HEART_REFILL_CAP}</span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Freezes {streakFreezeCount}/{STREAK_FREEZE_CAP}</span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Hints {hintTokenCount}/{HINT_TOKEN_CAP}</span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">Perfect Tokens {perfectRunTokenCount}/{PERFECT_RUN_TOKEN_CAP}</span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">
                      {xpBoostActive ? `2x XP ${xpBoostCountdown}` : "No XP Boost"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-2">
                      {unlimitedHeartsActive ? `Unlimited Hearts ${unlimitedHeartsCountdown}` : "Hearts limited"}
                    </span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-4">
                  {SHOP_FUNCTIONAL_PRODUCTS.map((product) => {
                    const preview = getFunctionalProductById(product.id);
                    const state = getFunctionalCardState(product);

                    return (
                      <CompactFunctionalCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        description={preview?.description ?? product.description}
                        price={product.price}
                        accent={product.accent}
                        statusLabel={state.statusLabel}
                        badgeLabel={state.badgeLabel}
                        confirming={confirmingId === product.id}
                        processing={processingId === product.id}
                        purchaseDisabled={state.purchaseDisabled}
                        purchaseLabel={state.purchaseLabel}
                        secondaryLabel={state.secondaryLabel}
                        secondaryDisabled={state.secondaryDisabled}
                        onPurchaseClick={() => setConfirmingId(product.id)}
                        onConfirmPurchase={() => void handleConfirmPurchase(product.id)}
                        onCancelConfirm={() => setConfirmingId(null)}
                        onSecondaryAction={() => {
                          if (product.id !== "unlimited_hearts_pass") return;
                          if (activateUnlimitedHeartsWithToken()) {
                            setConfirmingId(null);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "collection" ? (
            <section className="mt-8 space-y-6">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/34">Theme Collection</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {cosmetics.owned.pathThemes.length} of {collectionThemes.length} discovered
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>
                  Discovered themes can be equipped instantly. Undiscovered themes remain silhouettes until a pack reveals them.
                </p>
              </div>

              {storeReady ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {collectionThemes.map((theme) => (
                    <ThemeCollectionCard
                      key={theme.id}
                      theme={theme}
                      owned={cosmetics.owned.pathThemes.includes(theme.id)}
                      equipped={cosmetics.equipped.pathThemeId === theme.id}
                      onEquip={() => equipTheme(theme.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-8 text-center text-sm font-semibold text-white/54">
                  Loading your discovered themes...
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "functional" ? (
            <section className="mt-8 space-y-6">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/34">Functional</p>
                <p className="mt-2 text-3xl font-black text-white">Utility inventory</p>
                <p className="mt-2 text-sm font-semibold" style={{ color: withAlpha(pathTheme.surfaceText, 0.68) }}>Practical items stay direct-purchase. No randomness here.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-4">
                {SHOP_FUNCTIONAL_PRODUCTS.map((product) => {
                  const preview = getFunctionalProductById(product.id);
                  const state = getFunctionalCardState(product);

                  return (
                    <CompactFunctionalCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      description={preview?.description ?? product.description}
                      price={product.price}
                      accent={product.accent}
                      statusLabel={state.statusLabel}
                      badgeLabel={state.badgeLabel}
                      confirming={confirmingId === product.id}
                      processing={processingId === product.id}
                      purchaseDisabled={state.purchaseDisabled}
                      purchaseLabel={state.purchaseLabel}
                      secondaryLabel={state.secondaryLabel}
                      secondaryDisabled={state.secondaryDisabled}
                      onPurchaseClick={() => setConfirmingId(product.id)}
                      onConfirmPurchase={() => void handleConfirmPurchase(product.id)}
                      onCancelConfirm={() => setConfirmingId(null)}
                      onSecondaryAction={() => {
                        if (product.id !== "unlimited_hearts_pass") return;
                        if (activateUnlimitedHeartsWithToken()) {
                          setConfirmingId(null);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
        </section>
      </div>

      <PackOpeningModal
        opening={packOpening}
        onClose={() => setPackOpening(null)}
        onEquipNow={(themeId) => {
          if (themeId) equipTheme(themeId);
          setPackOpening(null);
        }}
      />
      {freezeCelebration ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[120] flex justify-center px-4">
          <style>{`
            @keyframes freezeAcquireCrystal {
              0% { transform: scale(0.72) rotate(-10deg); opacity: 0; }
              58% { transform: scale(1.12) rotate(4deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes freezeAcquireRing {
              0% { transform: scale(0.72); opacity: 0.68; }
              100% { transform: scale(1.34); opacity: 0; }
            }
          `}</style>
          <div
            className="relative overflow-hidden rounded-[1.7rem] border px-5 py-4 shadow-[0_24px_60px_rgba(8,47,73,0.26)]"
            style={{
              borderColor: "rgba(125,211,252,0.3)",
              background: "linear-gradient(135deg,rgba(8,47,73,0.94) 0%,rgba(15,23,42,0.96) 100%)",
            }}
          >
            <span
              className="absolute left-5 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full border border-sky-200/30"
              style={{ animation: "freezeAcquireRing 1.6s ease-out infinite" }}
            />
            <div className="relative flex items-center gap-4 text-white">
              <span
                className="inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-sky-200/24 bg-sky-200/12 text-sky-100 shadow-[0_18px_36px_rgba(56,189,248,0.22)]"
                style={{ animation: "freezeAcquireCrystal 0.75s cubic-bezier(0.22,1,0.36,1)" }}
              >
                <SnowflakeIcon className="h-8 w-8" />
              </span>
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-sky-200/72">Freeze Acquired</p>
                <p className="mt-1 text-base font-black">
                  {freezeCelebration === "streak_shield_pack" ? "Three freezes locked in." : "One freeze added to inventory."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
