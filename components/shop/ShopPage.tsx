"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppTopNav from "@/components/AppTopNav";
import ItemCard from "@/components/shop/ItemCard";
import PackCard from "@/components/shop/PackCard";
import ThemePreview from "@/components/shop/ThemePreview";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import {
  CosmeticCatalogItem,
  CosmeticItemId,
  FunctionalProductId,
  getCosmeticItemById,
  getFeaturedPackForDate,
  getFunctionalProductById,
  getPreviewAppearanceForItem,
  getPackById,
  isCosmeticEquipped,
  isCosmeticOwned,
  isPackOwned,
  resolveAppearanceForPack,
  SHOP_FUNCTIONAL_PRODUCTS,
  SHOP_PACKS,
  SHOP_VISIBLE_ITEMS,
  ShopEntryId,
  ShopTab,
} from "@/lib/cosmetics";
import { getChestSkin, getPathTheme, getTitleBadge, getTrailEffect } from "@/lib/themes";

const TAB_OPTIONS: { id: ShopTab; label: string; kicker: string }[] = [
  { id: "packs", label: "Packs", kicker: "Featured bundles" },
  { id: "items", label: "Items", kicker: "Mix and match cosmetics" },
  { id: "functional", label: "Functional", kicker: "Useful utility boosts" },
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
  return infinite ? "∞" : value.toLocaleString("en-US");
}

function groupItems(items: CosmeticCatalogItem[]) {
  return {
    pathThemes: items.filter((item) => item.kind === "pathTheme"),
    chestSkins: items.filter((item) => item.kind === "chestSkin"),
    trailEffects: items.filter((item) => item.kind === "trailEffect"),
    nodeEffects: items.filter((item) => item.kind === "nodeEffect"),
    flair: items.filter((item) => item.kind === "profileBorder" || item.kind === "titleBadge"),
  };
}

export default function ShopPage() {
  const {
    cosmetics,
    gemBalance,
    infiniteGemsEnabled,
    appearance,
    loading,
    purchaseEntry,
    equipItem,
    equipPack,
    streakFreezeCount,
    perfectRunTokenCount,
    xpBoostCountdown,
    xpBoostActive,
  } = useCosmetics();

  const featuredPack = useMemo(() => getFeaturedPackForDate(), []);
  const [activeTab, setActiveTab] = useState<ShopTab>("packs");
  const [previewEntryId, setPreviewEntryId] = useState<ShopEntryId>(featuredPack.id);
  const [confirmingId, setConfirmingId] = useState<ShopEntryId | null>(null);
  const [celebratingId, setCelebratingId] = useState<ShopEntryId | null>(null);
  const [processingId, setProcessingId] = useState<ShopEntryId | null>(null);
  const [displayedGems, setDisplayedGems] = useState(gemBalance);
  const displayedGemRef = useRef(gemBalance);

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
      const progress = Math.min(1, (timestamp - startAt) / 560);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayedGems(Math.round(startValue + (targetValue - startValue) * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [gemBalance]);

  const previewAppearance = useMemo(() => {
    const pack = getPackById(previewEntryId as never);
    if (pack) return resolveAppearanceForPack(pack.id);

    const item = getCosmeticItemById(previewEntryId as CosmeticItemId);
    if (item) return getPreviewAppearanceForItem(item);

    return resolveAppearanceForPack(featuredPack.id);
  }, [featuredPack.id, previewEntryId]);

  const previewPack = useMemo(() => getPackById(previewEntryId as never) ?? featuredPack, [featuredPack, previewEntryId]);
  const previewTheme = getPathTheme(previewAppearance.pathThemeId);
  const heroHighlights = useMemo(() => {
    const chest = getChestSkin(previewPack.chestSkinId);
    const trail = getTrailEffect(previewPack.trailEffectId);
    const badge = getTitleBadge(previewPack.titleBadgeId);

    return [
      { label: `${chest.name} Skin`, accent: chest.accent },
      { label: `${trail.name} Trail`, accent: trail.particleColor },
      { label: `${badge?.name ?? "Exclusive"} Title`, accent: getPathTheme(previewPack.themeId).previewHighlight },
    ];
  }, [previewPack]);
  const firstPack = SHOP_PACKS[0];
  const firstPackTheme = getPathTheme(firstPack.themeId);
  const groupedItems = groupItems(SHOP_VISIBLE_ITEMS.filter((item) => item.kind !== "pathTheme" || item.assetId !== "default"));

  const handleConfirmPurchase = async (entryId: ShopEntryId) => {
    if (processingId) return;
    setProcessingId(entryId);
    try {
      const result = await purchaseEntry(entryId);
      if (!result.ok) return;

      setConfirmingId(null);
      setCelebratingId(entryId);
      window.setTimeout(() => setCelebratingId((current) => (current === entryId ? null : current)), 900);
    } finally {
      setProcessingId(null);
    }
  };

  const renderItemCard = (item: CosmeticCatalogItem) => {
    const owned = isCosmeticOwned(cosmetics, item);
    const equipped = isCosmeticEquipped(cosmetics, item);
    const canAfford = infiniteGemsEnabled || gemBalance >= item.price;
    const preview = item.kind === "titleBadge"
      ? (
          <span
            className="rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white"
            style={{
              background: getTitleBadge(item.assetId as never)?.tone ?? "linear-gradient(135deg,#22c55e,#16a34a)",
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            {item.name.slice(0, 8)}
          </span>
        )
      : undefined;

    return (
      <ItemCard
        key={item.id}
        name={item.name}
        description={item.description}
        price={item.price}
        accent={item.accent}
        owned={owned}
        equipped={equipped}
        confirming={confirmingId === item.id}
        celebrating={celebratingId === item.id}
        processing={processingId === item.id}
        canAfford={canAfford}
        previewed={previewEntryId === item.id}
        preview={preview}
        onPreview={() => setPreviewEntryId(item.id)}
        onPurchaseClick={() => setConfirmingId(item.id)}
        onConfirmPurchase={() => void handleConfirmPurchase(item.id)}
        onCancelConfirm={() => setConfirmingId(null)}
        onEquip={() => equipItem(item.id)}
      />
    );
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <AppTopNav />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <section
          className="relative overflow-hidden rounded-[2.4rem] border border-white/60 px-6 pb-24 pt-7 shadow-[0_28px_60px_rgba(15,23,42,0.1)] sm:px-8"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)" }}
        >
          <style>{`
            @keyframes shopHeroArrow {
              0%, 100% { transform: translateY(0px); opacity: 0.28; }
              50% { transform: translateY(6px); opacity: 0.82; }
            }
          `}</style>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.08),transparent_34%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-500">Gem Store</p>
              <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">Cosmetics That Change The Whole Run.</h1>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
                Spend reward gems on full path bundles, custom chest skins, trail energy, profile flair, and utility items that help you protect or amplify progress.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.78)] px-4 py-2 text-sky-700 shadow-sm">
                  <GemIcon />
                  <span className="text-sm font-black">
                    {infiniteGemsEnabled ? "∞ gems enabled" : `${formatCompactGems(displayedGems)} gems ready`}
                  </span>
                </div>
                {previewEntryId !== featuredPack.id && (
                  <span className="rounded-full border border-slate-200 bg-[rgba(255,255,255,0.76)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Preview Mode
                  </span>
                )}
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-white/60 bg-[rgba(255,255,255,0.72)] p-4">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">
                  {previewEntryId === featuredPack.id ? "Featured Rotation" : "Pack Preview"}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">{previewPack.name}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{previewPack.description}</p>
              </div>
            </div>

            <ThemePreview
              hero
              appearance={previewAppearance}
              previewMode={previewEntryId !== featuredPack.id}
              heading={previewTheme.name}
              includedHighlights={heroHighlights}
            />
          </div>

          {activeTab === "packs" && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-[4.8rem] z-10 flex flex-col items-center gap-2">
                <span className="h-5 w-px rounded-full bg-white/46" />
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-[rgba(255,255,255,0.2)] text-slate-700 backdrop-blur-sm"
                  style={{ animation: "shopHeroArrow 2.2s ease-in-out infinite" }}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-[-4.75rem] flex justify-center px-6">
                <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200/90 bg-white px-6 pb-6 pt-5 shadow-[0_26px_70px_rgba(15,23,42,0.14)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white"
                        style={{ background: firstPackTheme.unitBannerBackground, borderColor: firstPackTheme.unitBannerBorder }}
                      >
                        {firstPack.bestValueLabel}
                      </span>
                      <p className="mt-3 text-2xl font-black text-slate-900">{firstPack.name}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{firstPack.description}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pack Price</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{firstPack.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {TAB_OPTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setConfirmingId(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeTab === tab.id ? "text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
                style={activeTab === tab.id ? { background: previewTheme.unitBannerBackground } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Freezes {streakFreezeCount}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">Perfect Tokens {perfectRunTokenCount}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
              {xpBoostActive ? `2x XP ${xpBoostCountdown}` : "No XP boost active"}
            </span>
          </div>
        </div>

        {activeTab === "packs" && (
          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            {SHOP_PACKS.map((pack) => {
              const owned = isPackOwned(cosmetics, pack.id);
              const equipped = appearance.pathThemeId === pack.themeId
                && appearance.chestSkinId === pack.chestSkinId
                && appearance.trailEffectId === pack.trailEffectId
                && appearance.nodeEffectId === pack.nodeEffectId
                && appearance.titleBadgeId === pack.titleBadgeId;

              return (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  appearance={resolveAppearanceForPack(pack.id)}
                  owned={owned}
                  equipped={equipped}
                  previewed={previewEntryId === pack.id}
                  confirming={confirmingId === pack.id}
                  celebrating={celebratingId === pack.id}
                  processing={processingId === pack.id}
                  canAfford={infiniteGemsEnabled || gemBalance >= pack.price}
                  onPreview={() => setPreviewEntryId(pack.id)}
                  onPurchaseClick={() => setConfirmingId(pack.id)}
                  onConfirmPurchase={() => void handleConfirmPurchase(pack.id)}
                  onCancelConfirm={() => setConfirmingId(null)}
                  onEquip={() => equipPack(pack.id)}
                />
              );
            })}
          </section>
        )}

        {activeTab === "items" && (
          <section className="mt-8 space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">Path Themes</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Switch the entire lesson atmosphere instantly.</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {SHOP_VISIBLE_ITEMS
                  .filter((item) => item.kind === "pathTheme")
                  .map(renderItemCard)}
              </div>
            </div>

            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">Chest Skins</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{groupedItems.chestSkins.map(renderItemCard)}</div>
            </div>

            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">Trail Effects</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{groupedItems.trailEffects.map(renderItemCard)}</div>
            </div>

            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">Node Effects</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{groupedItems.nodeEffects.map(renderItemCard)}</div>
            </div>

            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-slate-400">Profile Flair</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{groupedItems.flair.map(renderItemCard)}</div>
            </div>
          </section>
        )}

        {activeTab === "functional" && (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SHOP_FUNCTIONAL_PRODUCTS.map((product) => {
              const purchasePreview = getFunctionalProductById(product.id);
              const canAfford = infiniteGemsEnabled || gemBalance >= product.price;
              const previewed = previewEntryId === product.id;
              const active = product.id === "xp_boost" ? xpBoostActive : false;
              const ownedStateLabel =
                product.id === "streak_freeze"
                  ? `Hold ${streakFreezeCount}`
                  : product.id === "streak_shield_pack"
                    ? `Hold ${streakFreezeCount}`
                    : product.id === "xp_boost"
                      ? (xpBoostActive ? `Active ${xpBoostCountdown}` : undefined)
                      : `Hold ${perfectRunTokenCount}`;
              const pseudoOwned =
                product.id === "streak_freeze"
                  ? streakFreezeCount >= 3
                  : product.id === "streak_shield_pack"
                    ? streakFreezeCount > 0
                    : product.id === "xp_boost"
                      ? xpBoostActive
                      : perfectRunTokenCount >= 3;

              return (
                <ItemCard
                  key={product.id}
                  name={product.name}
                  description={purchasePreview?.description ?? product.description}
                  price={product.price}
                  accent={product.accent}
                  owned={pseudoOwned || active}
                  active={active}
                  statusLabel={ownedStateLabel}
                  confirming={confirmingId === product.id}
                  celebrating={celebratingId === product.id}
                  processing={processingId === product.id}
                  canAfford={canAfford && !pseudoOwned}
                  previewed={previewed}
                  purchaseLabel="Purchase"
                  footerNote={product.limitLabel}
                  onPreview={() => setPreviewEntryId(featuredPack.id)}
                  onPurchaseClick={() => setConfirmingId(product.id)}
                  onConfirmPurchase={() => void handleConfirmPurchase(product.id as FunctionalProductId)}
                  onCancelConfirm={() => setConfirmingId(null)}
                />
              );
            })}
          </section>
        )}

        {loading && <p className="mt-8 text-sm font-semibold text-slate-500">Loading your store inventory...</p>}
      </div>
    </main>
  );
}
