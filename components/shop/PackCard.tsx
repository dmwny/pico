"use client";

import type { CSSProperties } from "react";
import { PackDefinition, ResolvedCosmeticAppearance } from "@/lib/cosmetics";
import { getChestSkin, getNodeEffect, getPathTheme, getTitleBadge, getTrailEffect } from "@/lib/themes";
import ThemePreview from "@/components/shop/ThemePreview";

type PackCardProps = {
  pack: PackDefinition;
  appearance: ResolvedCosmeticAppearance;
  owned: boolean;
  equipped: boolean;
  previewed: boolean;
  confirming: boolean;
  celebrating: boolean;
  processing: boolean;
  canAfford: boolean;
  onPreview: () => void;
  onPurchaseClick: () => void;
  onConfirmPurchase: () => void;
  onCancelConfirm: () => void;
  onEquip: () => void;
};

export default function PackCard({
  pack,
  appearance,
  owned,
  equipped,
  previewed,
  confirming,
  celebrating,
  processing,
  canAfford,
  onPreview,
  onPurchaseClick,
  onConfirmPurchase,
  onCancelConfirm,
  onEquip,
}: PackCardProps) {
  const theme = getPathTheme(pack.themeId);
  const chest = getChestSkin(pack.chestSkinId);
  const trail = getTrailEffect(pack.trailEffectId);
  const nodeEffect = getNodeEffect(pack.nodeEffectId);
  const badge = getTitleBadge(pack.titleBadgeId);

  return (
    <article
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onPointerDown={onPreview}
      className={`group relative overflow-hidden rounded-[2rem] border bg-white transition duration-300 ${
        previewed
          ? "border-slate-900 shadow-[0_26px_60px_rgba(15,23,42,0.16)]"
          : "border-slate-200 shadow-[0_18px_44px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      }`}
    >
      <style>{`
        @keyframes packCardBurst {
          0% { transform: translate3d(0,0,0) scale(0.35); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: translate3d(var(--shop-x), var(--shop-y), 0) scale(1.08); opacity: 0; }
        }
        @keyframes packCardFlip {
          0% { transform: rotateY(0deg) scale(1); }
          35% { transform: rotateY(90deg) scale(0.98); }
          70% { transform: rotateY(180deg) scale(1.02); }
          100% { transform: rotateY(180deg) scale(1); }
        }
      `}</style>

      <div
        className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{ background: theme.heroBackground }}
      />
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white"
              style={{ background: theme.unitBannerBackground, borderColor: theme.unitBannerBorder }}
            >
              {pack.bestValueLabel}
            </span>
            <h3 className="mt-3 text-2xl font-black text-slate-900">{pack.name}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{pack.description}</p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pack Price</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{pack.price}</p>
            <p className="text-xs font-bold text-sky-600">gems</p>
          </div>
        </div>

        <div className="mt-5">
          <ThemePreview appearance={appearance} previewMode={previewed} />
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-slate-400">Included</p>
          <ul className="mt-3 space-y-2">
            <li>{chest.name}</li>
            <li>{trail.name} trail</li>
            <li>{nodeEffect.name} node effect</li>
            <li>{badge?.name ?? "Exclusive badge"}</li>
          </ul>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-950 px-4 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-white/50">
                {owned ? (equipped ? "Equipped" : "Owned") : "Purchase"}
              </p>
              <p className="mt-1 text-sm font-semibold text-white/72">
                {owned
                  ? equipped
                    ? "This bundle is active across the app right now."
                    : "You own this pack. Equip it whenever you want."
                  : canAfford
                    ? "One confirmation tap, then the bundle unlocks instantly."
                    : "You need more gems before you can buy this pack."}
              </p>
            </div>

            <div
              className={`relative min-w-[14rem] ${celebrating ? "pointer-events-none" : ""}`}
              style={celebrating ? { animation: "packCardFlip 620ms cubic-bezier(0.2,0.9,0.2,1) forwards", transformStyle: "preserve-3d" } : undefined}
            >
              {celebrating && (
                <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <span
                      key={index}
                      className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                      style={{
                        background: index % 2 === 0 ? theme.accentColor : theme.accentSoft,
                        "--shop-x": `${Math.cos((index / 14) * Math.PI * 2) * (52 + (index % 3) * 18)}px`,
                        "--shop-y": `${Math.sin((index / 14) * Math.PI * 2) * (52 + (index % 3) * 18)}px`,
                        animation: `packCardBurst 620ms ease-out ${index * 18}ms forwards`,
                      } as CSSProperties}
                    />
                  ))}
                </div>
              )}

              {owned ? (
                <button
                    type="button"
                    onClick={onEquip}
                    disabled={processing}
                    className={`w-full rounded-[1.1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] transition ${
                    equipped ? "bg-emerald-500 text-white" : "bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {equipped ? "Equipped" : "Equip"}
                </button>
              ) : confirming ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onConfirmPurchase}
                    disabled={processing}
                    className="w-full rounded-[1.1rem] bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-900"
                  >
                    {processing ? "Purchasing..." : `Confirm ${pack.price} Gems`}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelConfirm}
                    disabled={processing}
                    className="w-full rounded-[1rem] border border-white/16 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/64"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onPurchaseClick}
                  disabled={!canAfford || processing}
                  className={`w-full rounded-[1.1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] transition ${
                    canAfford && !processing
                      ? "bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 hover:brightness-105"
                      : "cursor-not-allowed bg-white/10 text-white/40"
                  }`}
                >
                  {processing ? "Purchasing..." : canAfford ? "Purchase" : "Not Enough Gems"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
