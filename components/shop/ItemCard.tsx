"use client";

import type { CSSProperties, ReactNode } from "react";

type ItemCardProps = {
  name: string;
  description: string;
  price: number;
  accent: string;
  owned?: boolean;
  equipped?: boolean;
  active?: boolean;
  confirming?: boolean;
  celebrating?: boolean;
  processing?: boolean;
  canAfford?: boolean;
  previewed?: boolean;
  purchaseLabel?: string;
  statusLabel?: string;
  footerNote?: string;
  preview?: ReactNode;
  onPreview?: () => void;
  onPurchaseClick?: () => void;
  onConfirmPurchase?: () => void;
  onCancelConfirm?: () => void;
  onEquip?: () => void;
};

export default function ItemCard({
  name,
  description,
  price,
  accent,
  owned = false,
  equipped = false,
  active = false,
  confirming = false,
  celebrating = false,
  processing = false,
  canAfford = true,
  previewed = false,
  purchaseLabel = "Purchase",
  statusLabel,
  footerNote,
  preview,
  onPreview,
  onPurchaseClick,
  onConfirmPurchase,
  onCancelConfirm,
  onEquip,
}: ItemCardProps) {
  return (
    <article
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onPointerDown={onPreview}
      className={`group relative overflow-hidden rounded-[1.7rem] border bg-white p-4 transition ${
        previewed
          ? "border-slate-900 shadow-[0_22px_48px_rgba(15,23,42,0.14)]"
          : "border-slate-200 shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-0.5"
      }`}
    >
      <style>{`
        @keyframes itemCardBurst {
          0% { transform: translate3d(0,0,0) scale(0.35); opacity: 0; }
          16% { opacity: 1; }
          100% { transform: translate3d(var(--item-x), var(--item-y), 0) scale(1.06); opacity: 0; }
        }
      `}</style>
      <div
        className="absolute inset-x-0 top-0 h-24 opacity-60"
        style={{
          background: `linear-gradient(180deg, ${accent}22 0%, transparent 100%)`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/70 bg-slate-50"
              style={{ boxShadow: `0 12px 30px ${accent}22` }}
            >
              {preview ?? (
                <span
                  className="h-7 w-7 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 18px ${accent}66` }}
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-900">{name}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p>
            </div>
          </div>
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Price</p>
            <p className="mt-1 text-lg font-black text-slate-900">{price}</p>
          </div>
        </div>

        {footerNote ? <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{footerNote}</p> : null}

        <div className="mt-4 flex-1" />

        <div className="relative mt-4">
          {celebrating && (
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                  style={{
                    background: accent,
                    "--item-x": `${Math.cos((index / 12) * Math.PI * 2) * (34 + (index % 3) * 12)}px`,
                    "--item-y": `${Math.sin((index / 12) * Math.PI * 2) * (34 + (index % 3) * 12)}px`,
                    animation: `itemCardBurst 560ms ease-out ${index * 12}ms forwards`,
                  } as CSSProperties}
                />
              ))}
            </div>
          )}

          {owned ? (
            <button
              type="button"
              onClick={onEquip}
              disabled={!onEquip || processing}
              className={`w-full rounded-[1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] transition ${
                equipped || active
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {statusLabel ?? (equipped ? "Equipped" : active ? "Active" : "Equip")}
            </button>
          ) : confirming ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onConfirmPurchase}
                disabled={processing}
                className="w-full rounded-[1rem] bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white"
              >
                {processing ? "Purchasing..." : `Confirm ${price} Gems`}
              </button>
              <button
                type="button"
                onClick={onCancelConfirm}
                disabled={processing}
                className="w-full rounded-[0.95rem] border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPurchaseClick}
              disabled={!canAfford || processing}
              className={`w-full rounded-[1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] transition ${
                canAfford && !processing ? "bg-slate-900 text-white hover:bg-slate-800" : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              {processing ? "Purchasing..." : canAfford ? purchaseLabel : "Not Enough Gems"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
