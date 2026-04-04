"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppTopNav from "@/components/AppTopNav";
import { ProfileAvatar } from "@/components/ProfileFlair";
import { ChestIllustration } from "@/components/rewards/ChestIllustration";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import {
  createProfileBorderItemId,
  createTitleBadgeItemId,
} from "@/lib/cosmetics";
import {
  PROFILE_BORDER_IDS,
  TITLE_BADGE_IDS,
  getChestSkin,
  getPathTheme,
  getProfileBorder,
  getTitleBadge,
  getTrailEffect,
  withAlpha,
} from "@/lib/themes";

function formatScore(value: number) {
  return value.toLocaleString("en-US");
}

function countLessonsCompleted(completedLessons: string[] | undefined) {
  if (!completedLessons) return 0;
  return completedLessons.filter((entry) => /^\d+-\d+$/.test(entry)).length;
}

function TrailPreview({ gradient, glow }: { gradient: string; glow: string }) {
  return (
    <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
      <span
        className="absolute inset-y-1 w-[6px] rounded-full"
        style={{ background: gradient, boxShadow: `0 0 18px ${glow}` }}
      />
      {Array.from({ length: 3 }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full"
          style={{
            width: 4 + index,
            height: 4 + index,
            top: `${14 + index * 16}%`,
            left: `${38 + index * 7}%`,
            background: "rgba(255,255,255,0.9)",
            opacity: 0.86 - index * 0.18,
          }}
        />
      ))}
    </div>
  );
}

function ThemeTile({
  name,
  background,
  border,
  nodeBackground,
  nodeBorder,
  nodeText,
  trailGradient,
  trailGlow,
}: {
  name: string;
  background: string;
  border: string;
  nodeBackground: string;
  nodeBorder: string;
  nodeText: string;
  trailGradient: string;
  trailGlow: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.3rem] border p-3" style={{ background, borderColor: border }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Theme</p>
        <p className="text-sm font-black text-slate-900">{name}</p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-[1rem] border-b-4"
          style={{
            background: nodeBackground,
            borderColor: nodeBorder,
            color: nodeText,
            boxShadow: "0 14px 28px rgba(15,23,42,0.12)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.8">
            <path d="M10 8l6 4-6 4V8Z" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <div className="relative h-11 w-8">
          <span
            className="absolute inset-x-1/2 h-full w-[5px] -translate-x-1/2 rounded-full"
            style={{ background: trailGradient, boxShadow: `0 0 14px ${trailGlow}` }}
          />
        </div>
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-[1rem] border-b-4"
          style={{
            background: nodeBackground,
            borderColor: nodeBorder,
            color: nodeText,
            boxShadow: "0 14px 28px rgba(15,23,42,0.12)",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const {
    cosmetics,
    appearance,
    progress,
    viewerName,
    profileStats,
    equipItem,
    streak,
    gemBalance,
    infiniteGemsEnabled,
    isHydrating,
    xp,
  } = useCosmetics();
  const [flashId, setFlashId] = useState<string | null>(null);

  const lessonsCompleted = countLessonsCompleted(progress?.completed_lessons);
  const activeTitleBadge = getTitleBadge(appearance.titleBadgeId);
  const activeBorder = getProfileBorder(appearance.profileBorderId);
  const activeTheme = getPathTheme(appearance.pathThemeId);
  const activeChestSkin = getChestSkin(appearance.chestSkinId);
  const activeTrail = getTrailEffect(appearance.trailEffectId);

  const allBadges = useMemo(
    () => TITLE_BADGE_IDS.flatMap((id) => {
      const badge = getTitleBadge(id);
      return badge ? [badge] : [];
    }),
    [],
  );
  const allBorders = useMemo(
    () => PROFILE_BORDER_IDS.flatMap((id) => {
      const border = getProfileBorder(id);
      return border ? [border] : [];
    }),
    [],
  );

  const flashEquip = (id: string) => {
    setFlashId(id);
    window.setTimeout(() => {
      setFlashId((current) => (current === id ? null : current));
    }, 900);
  };

  if (isHydrating) {
    return (
      <main className="relative min-h-screen overflow-hidden" style={{ background: activeTheme.surfaceBackground }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: activeTheme.pageOverlay, opacity: 0.92 }} />
        <AppTopNav />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <section className="rounded-[2.6rem] border border-slate-800/50 bg-slate-950 px-6 py-7 shadow-[0_36px_90px_rgba(15,23,42,0.28)] sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.62fr_0.38fr]">
              <div>
                <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
                <div className="mt-4 h-10 w-52 animate-pulse rounded-full bg-white/15" />
                <div className="mt-4 h-4 w-72 animate-pulse rounded-full bg-white/10" />
                <div className="mt-2 h-4 w-64 animate-pulse rounded-full bg-white/10" />
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                      <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
                      <div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-white/15" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/8 px-6 py-8 text-center backdrop-blur-sm">
                <div className="h-32 w-32 animate-pulse rounded-full bg-white/12" />
                <div className="mt-5 h-3 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="mt-3 h-6 w-36 animate-pulse rounded-full bg-white/15" />
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
            {Array.from({ length: 2 }).map((_, index) => (
              <section key={index} className="rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-8 w-48 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((__, innerIndex) => (
                    <div key={innerIndex} className="rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                      <div className="mt-4 h-20 animate-pulse rounded-[1rem] bg-slate-200" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: activeTheme.surfaceBackground }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: activeTheme.pageOverlay, opacity: 0.92 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 14% 16%, ${activeTheme.nodeGlow}, transparent 26%), radial-gradient(circle at 82% 22%, ${activeTheme.trailGlow}, transparent 28%)`,
        }}
      />
      <AppTopNav />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section
          className="relative overflow-hidden rounded-[2.6rem] border px-6 py-7 text-white shadow-[0_36px_90px_rgba(15,23,42,0.28)] sm:px-8"
          style={{
            borderColor: `${activeTheme.accentColor}33`,
            background: activeTheme.surfaceDark,
            boxShadow: `0 36px 90px ${activeTheme.nodeGlow}`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_24%)]" />
          <div
            className="pointer-events-none absolute inset-y-0 right-[-10%] w-[44%] blur-3xl"
            style={{
              background: activeTitleBadge?.tone ?? "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)",
              opacity: 0.2,
            }}
          />
          <div
            className="pointer-events-none absolute left-[-8%] top-[12%] h-48 w-48 rounded-full blur-3xl"
            style={{
              background: activeBorder?.gradient ?? "linear-gradient(135deg,#64748b 0%,#cbd5e1 100%)",
              opacity: 0.16,
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.62fr_0.38fr]">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-white/45">Player Card</p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">{viewerName}</h1>
              <p className="mt-3 max-w-xl text-base font-semibold leading-7 text-white/72">
                Your equipped flair, current run stats, and long-term progression all in one place.
              </p>

              {activeTitleBadge && (
                <span
                  className="mt-5 inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white"
                  style={{
                    background: activeTitleBadge.tone,
                    borderColor: "rgba(255,255,255,0.3)",
                    boxShadow: `0 16px 34px ${activeTitleBadge.glow}`,
                  }}
                >
                  {activeTitleBadge.name}
                </span>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Current Streak", value: formatScore(streak) },
                  { label: "Gems", value: infiniteGemsEnabled ? "∞" : formatScore(gemBalance) },
                  { label: "XP", value: formatScore(xp) },
                  { label: "Lessons", value: formatScore(lessonsCompleted) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-white/45">{stat.label}</p>
                    <p className="mt-3 text-2xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/8 px-6 py-8 text-center backdrop-blur-sm">
              <ProfileAvatar name={viewerName} size="hero" />
              <p className="mt-5 text-sm font-black uppercase tracking-[0.24em] text-white/48">
                {activeBorder?.name ?? "Default Border"}
              </p>
              <p className="mt-2 text-lg font-black text-white">{activeTitleBadge?.name ?? "Scholar"}</p>
              <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-white/68">
                Equipped flair shapes the look of your profile card and shows up anywhere your player identity appears.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
          <section
            className="rounded-[2rem] border p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
            style={{ borderColor: `${activeTheme.accentColor}29`, background: activeTheme.surfaceCard }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Scorecard</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: activeTheme.surfaceText }}>Progress Highlights</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Lessons Completed", value: lessonsCompleted, accent: "text-emerald-600" },
                { label: "Total XP Earned", value: xp, accent: "text-sky-600" },
                { label: "Best Streak", value: profileStats.bestStreak, accent: "text-orange-500" },
                { label: "Chests Opened", value: profileStats.chestsOpened, accent: "text-violet-600" },
                { label: "Gems Spent", value: profileStats.gemsSpent, accent: "text-fuchsia-600" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[1.4rem] border px-4 py-4" style={{ borderColor: withAlpha(activeTheme.accentColor, 0.12), background: withAlpha("#ffffff", 0.4) }}>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>{stat.label}</p>
                  <p className={`mt-3 text-3xl font-black ${stat.accent}`}>{formatScore(stat.value)}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-[2rem] border p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
            style={{ borderColor: `${activeTheme.accentColor}29`, background: activeTheme.surfaceCard }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Owned Cosmetics</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: activeTheme.surfaceText }}>Current Loadout</h2>
              </div>
              <Link href="/shop" className="text-sm font-black hover:brightness-110" style={{ color: activeTheme.accentColor }}>
                Open shop
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              <Link href="/shop" className="block rounded-[1.45rem] border p-3 transition hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: withAlpha(activeTheme.accentColor, 0.12), background: withAlpha("#ffffff", 0.38) }}>
                <ThemeTile
                  name={activeTheme.name}
                  background={activeTheme.previewBackground}
                  border={activeTheme.unitBannerBorder}
                  nodeBackground={activeTheme.nodeAvailableBackground}
                  nodeBorder={activeTheme.nodeAvailableBorder}
                  nodeText={activeTheme.nodeAvailableText}
                  trailGradient={activeTheme.trailGradient}
                  trailGlow={activeTheme.trailGlow}
                />
              </Link>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/shop" className="block rounded-[1.45rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: withAlpha(activeTheme.accentColor, 0.12), background: withAlpha("#ffffff", 0.38) }}>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Chest Skin</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black" style={{ color: activeTheme.surfaceText }}>{activeChestSkin.name}</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: withAlpha(activeTheme.surfaceText, 0.64) }}>{activeChestSkin.description}</p>
                    </div>
                    <ChestIllustration state="closed" rarity="rare" skin={appearance.chestSkinId} className="w-[4.4rem]" />
                  </div>
                </Link>

                <Link href="/shop" className="block rounded-[1.45rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: withAlpha(activeTheme.accentColor, 0.12), background: withAlpha("#ffffff", 0.38) }}>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Trail Effect</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black" style={{ color: activeTheme.surfaceText }}>{activeTrail.name}</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: withAlpha(activeTheme.surfaceText, 0.64) }}>{activeTrail.description}</p>
                    </div>
                    <TrailPreview gradient={activeTrail.gradient} glow={activeTrail.glow} />
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section
            className="rounded-[2rem] border p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
            style={{ borderColor: `${activeTheme.accentColor}29`, background: activeTheme.surfaceCard }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Title Badges</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: activeTheme.surfaceText }}>Badge Collection</h2>
              </div>
              <Link href="/shop" className="text-sm font-black hover:brightness-110" style={{ color: activeTheme.accentColor }}>
                Get more
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {allBadges.map((badge) => {
                const owned = cosmetics.owned.titleBadges.includes(badge.id);
                const equipped = appearance.titleBadgeId === badge.id;
                const highlighted = flashId === badge.id;

                return (
                  <div
                    key={badge.id}
                    className={`rounded-[1.45rem] border px-4 py-4 transition ${
                      equipped
                        ? "border-emerald-200 bg-emerald-50/80 shadow-[0_16px_34px_rgba(34,197,94,0.12)]"
                        : owned
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50/80 opacity-70"
                    } ${highlighted ? "ring-4 ring-emerald-100" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                        style={{
                          background: badge.tone,
                          boxShadow: `0 10px 24px ${badge.glow}`,
                          borderColor: "rgba(255,255,255,0.36)",
                        }}
                      >
                        {badge.name}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                        equipped
                          ? "border-emerald-200 bg-white text-emerald-700"
                          : owned
                            ? "border-slate-200 bg-slate-50 text-slate-500"
                            : "border-slate-200 bg-white/70 text-slate-400"
                      }`}>
                        {equipped ? "Equipped" : owned ? "Owned" : "Locked"}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{badge.description}</p>

                    <div className="mt-4">
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            equipItem(createTitleBadgeItemId(badge.id));
                            flashEquip(badge.id);
                          }}
                          className={`w-full rounded-[1rem] px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] transition ${
                            equipped
                              ? "bg-emerald-500 text-white"
                              : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {equipped ? "Equipped" : "Equip"}
                        </button>
                      ) : (
                        <Link
                          href="/shop"
                          className="inline-flex text-sm font-black text-emerald-600 hover:text-emerald-700"
                        >
                          Get in Shop
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            className="rounded-[2rem] border p-5 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
            style={{ borderColor: `${activeTheme.accentColor}29`, background: activeTheme.surfaceCard }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em]" style={{ color: withAlpha(activeTheme.surfaceText, 0.46) }}>Profile Borders</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: activeTheme.surfaceText }}>Border Vault</h2>
              </div>
              <Link href="/shop" className="text-sm font-black hover:brightness-110" style={{ color: activeTheme.accentColor }}>
                Get more
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {allBorders.map((border) => {
                const owned = cosmetics.owned.profileBorders.includes(border.id);
                const equipped = appearance.profileBorderId === border.id;
                const highlighted = flashId === border.id;

                return (
                  <div
                    key={border.id}
                    className={`rounded-[1.45rem] border px-4 py-4 transition ${
                      equipped
                        ? "border-emerald-200 bg-emerald-50/80 shadow-[0_16px_34px_rgba(34,197,94,0.12)]"
                        : owned
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50/80 opacity-70"
                    } ${highlighted ? "ring-4 ring-emerald-100" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-slate-900">{border.name}</p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{border.description}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                        equipped
                          ? "border-emerald-200 bg-white text-emerald-700"
                          : owned
                            ? "border-slate-200 bg-slate-50 text-slate-500"
                            : "border-slate-200 bg-white/70 text-slate-400"
                      }`}>
                        {equipped ? "Equipped" : owned ? "Owned" : "Locked"}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-center rounded-[1.25rem] bg-slate-100/80 py-4">
                      <ProfileAvatar
                        name={viewerName}
                        borderOverride={border}
                        ambient={owned}
                      />
                    </div>

                    <div className="mt-4">
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => {
                            equipItem(createProfileBorderItemId(border.id));
                            flashEquip(border.id);
                          }}
                          className={`w-full rounded-[1rem] px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] transition ${
                            equipped
                              ? "bg-emerald-500 text-white"
                              : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {equipped ? "Equipped" : "Equip"}
                        </button>
                      ) : (
                        <Link
                          href="/shop"
                          className="inline-flex text-sm font-black text-emerald-600 hover:text-emerald-700"
                        >
                          Get in Shop
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
