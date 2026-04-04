"use client";

import PackObject from "@/components/shop/PackObject";
import ThemeMiniCard from "@/components/shop/ThemeMiniCard";
import type { PackId, ThemePackDefinition, ThemePackPityState } from "@/lib/cosmetics";
import { getPityProgress, getThemePackExamples } from "@/lib/cosmetics";
import { ThemeTier } from "@/lib/themes";

const TIER_ACCENTS: Record<ThemeTier, string> = {
  common: "#CBD5E1",
  rare: "#60A5FA",
  epic: "#C084FC",
  legendary: "#FBBF24",
  mythic: "#F472B6",
};

const PACK_BUTTONS: Record<PackId, string> = {
  basic_pack: "bg-[linear-gradient(135deg,#f8fafc_0%,#dbe5f0_100%)] text-slate-900",
  premium_pack: "bg-[linear-gradient(135deg,#93c5fd_0%,#8b5cf6_100%)] text-white",
  legendary_pack: "bg-[linear-gradient(135deg,#fcd34d_0%,#f59e0b_100%)] text-slate-950",
  mythic_pack: "bg-[linear-gradient(135deg,#f472b6_0%,#8b5cf6_48%,#22d3ee_100%)] text-white",
};

function formatOdds(value: number) {
  return `${(value * 100).toFixed(value * 100 < 10 && value !== 0 ? 1 : 0).replace(/\.0$/, "")}%`;
}

export default function ThemePackCard({
  pack,
  pityState,
  expanded,
  confirming,
  celebrating,
  processing,
  canAfford,
  onOpenClick,
  onConfirmOpen,
  onCancelConfirm,
  onToggleExpanded,
}: {
  pack: ThemePackDefinition;
  pityState: ThemePackPityState;
  expanded: boolean;
  confirming: boolean;
  celebrating: boolean;
  processing: boolean;
  canAfford: boolean;
  onOpenClick: (packId: PackId) => void;
  onConfirmOpen: (packId: PackId) => void;
  onCancelConfirm: () => void;
  onToggleExpanded: (packId: PackId) => void;
}) {
  const pity = getPityProgress(pack.id, pityState);
  const exampleThemes = getThemePackExamples(pack.id);

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(7,10,20,0.96))] p-5 shadow-[0_28px_80px_rgba(2,6,23,0.36)]">
      <div className="absolute inset-x-5 bottom-3 h-8 rounded-full bg-black/40 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <PackObject packId={pack.id} className="mx-auto max-w-[11rem]" />

        <div className="mt-5">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-white/40">Theme Pack</p>
          <h3 className="mt-3 text-2xl font-black text-white">{pack.name}</h3>
          <p className="mt-2 text-sm font-semibold text-white/56">{pack.price} gems</p>
        </div>

        <div className="mt-5 w-full">
          {confirming ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onConfirmOpen(pack.id)}
                disabled={processing}
                className={`w-full rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.24em] ${PACK_BUTTONS[pack.id]} ${processing ? "opacity-70" : ""}`}
              >
                {processing ? "Opening..." : `Open For ${pack.price}`}
              </button>
              <button
                type="button"
                onClick={onCancelConfirm}
                disabled={processing}
                className="w-full rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/62"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenClick(pack.id)}
              disabled={!canAfford || processing}
              className={`w-full rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.24em] transition ${canAfford ? PACK_BUTTONS[pack.id] : "cursor-not-allowed bg-white/8 text-white/30"} ${celebrating ? "scale-[1.02]" : ""}`}
            >
              {processing ? "Opening..." : canAfford ? "Open Pack" : "Not Enough Gems"}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleExpanded(pack.id)}
          className="mt-4 inline-flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.28em] text-white/52 transition hover:text-white/80"
        >
          <span>{expanded ? "Hide Odds" : "Odds"}</span>
          <span className={`transition-transform ${expanded ? "rotate-180" : ""}`}>↓</span>
        </button>

        {expanded ? (
          <div className="mt-5 w-full rounded-[1.5rem] border border-white/10 bg-black/22 p-4 text-left">
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(pack.odds) as ThemeTier[]).map((tier) => (
                <div key={tier} className="flex items-center justify-between rounded-[1rem] border border-white/8 bg-white/[0.04] px-3 py-2.5">
                  <span className="text-[0.68rem] font-black uppercase tracking-[0.2em]" style={{ color: TIER_ACCENTS[tier] }}>
                    {tier}
                  </span>
                  <span className="text-sm font-black text-white">{formatOdds(pack.odds[tier])}</span>
                </div>
              ))}
            </div>



            <div className="mt-4 grid grid-cols-3 gap-3">
              {exampleThemes.map((theme) => (
                <ThemeMiniCard key={theme.id} themeId={theme.id} size="thumbnail" />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
