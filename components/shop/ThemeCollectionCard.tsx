"use client";

import ThemeMiniCard from "@/components/shop/ThemeMiniCard";
import { PathThemeDefinition, PathThemeId } from "@/lib/themes";

export default function ThemeCollectionCard({
  theme,
  owned,
  equipped,
  onEquip,
}: {
  theme: PathThemeDefinition<PathThemeId>;
  owned: boolean;
  equipped: boolean;
  onEquip: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[1.8rem] border transition ${
        equipped
          ? "border-violet-300/50 bg-[linear-gradient(180deg,rgba(30,41,59,0.96),rgba(10,13,26,0.98))] shadow-[0_24px_60px_rgba(99,102,241,0.18)]"
          : owned
            ? "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(6,9,18,0.96))] shadow-[0_18px_42px_rgba(2,6,23,0.3)]"
            : "border-white/8 bg-[linear-gradient(180deg,rgba(12,16,28,0.9),rgba(5,8,15,0.95))] shadow-[0_14px_34px_rgba(2,6,23,0.24)]"
      }`}
    >
      <div className={`relative px-4 pt-4 ${owned ? "" : "opacity-50 grayscale"}`}>
        <ThemeMiniCard themeId={theme.id} size="thumbnail" />
        {!owned ? (
          <div className="absolute inset-4 flex items-center justify-center rounded-[1.3rem] bg-black/44 backdrop-blur-sm">
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/74">
              Not Yet Discovered
            </span>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black text-white">{theme.name}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/58">{theme.description}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
            {theme.tier}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {owned ? (
            <button
              type="button"
              onClick={onEquip}
              className={`rounded-full px-4 py-2.5 text-sm font-black uppercase tracking-[0.2em] transition ${
                equipped
                  ? "bg-[linear-gradient(135deg,#8b5cf6_0%,#3b82f6_100%)] text-white"
                  : "bg-white text-slate-950 hover:brightness-105"
              }`}
            >
              {equipped ? "Equipped" : "Equip"}
            </button>
          ) : (
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/36">Found in packs</p>
          )}
        </div>
      </div>
    </article>
  );
}
