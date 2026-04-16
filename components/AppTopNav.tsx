"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { ProfileFlair } from "@/components/ProfileFlair";
import { mixHex, withAlpha } from "@/lib/themes";
import { StreakFlame } from "@/components/streak/StreakFlame";

const NAV_LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/shop", label: "Shop" },
  { href: "/daily", label: "Daily" },
  { href: "/leagues", label: "Leagues" },
  { href: "/achievements", label: "Achievements" },
  { href: "/profile", label: "Profile" },
];

function formatCompactStat(value: number) {
  if (value < 1_000) return value.toString();
  if (value < 10_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (value < 1_000_000) return `${Math.round(value / 100) / 10}k`.replace(".0k", "k");
  return `${Math.round(value / 100_000) / 10}m`.replace(".0m", "m");
}

export default function AppTopNav() {
  const pathname = usePathname();
  const { xp, gemBalance, infiniteGemsEnabled, streak, streakFreezeCount, xpBoostCountdown, loading, isHydrating, viewerName } = useCosmetics();
  const { pathTheme } = useThemeContext();
  const usingDefaultTheme = pathTheme.id === "default";
  const navReadableText = usingDefaultTheme ? "#F8FAFC" : pathTheme.surfaceText;
  const navIdleText = usingDefaultTheme ? withAlpha("#F8FAFC", 0.82) : withAlpha(pathTheme.surfaceText, 0.74);

  const navStyle = {
    background: pathTheme.surfaceDark,
    borderColor: withAlpha(pathTheme.accentColor, 0.22),
    color: navReadableText,
  };
  const activeLinkStyle = {
    background: `linear-gradient(135deg, ${pathTheme.accentColor} 0%, ${mixHex(pathTheme.accentColor, pathTheme.previewHighlight, 0.38)} 100%)`,
    color: "#ffffff",
    boxShadow: `0 16px 34px ${withAlpha(pathTheme.accentColor, usingDefaultTheme ? 0.34 : 0.24)}`,
  };
  const idleLinkStyle = {
    color: navIdleText,
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl" style={navStyle}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              style={{ background: usingDefaultTheme ? "linear-gradient(135deg,#86EFAC 0%,#4ADE80 100%)" : pathTheme.unitBannerBackground }}
            >
              Pi
            </div>
            <p className="hidden font-display text-2xl font-black sm:block" style={{ color: navReadableText }}>
              Pico
            </p>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-black transition hover:brightness-110"
                  style={active ? activeLinkStyle : idleLinkStyle}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden xl:block">
          {!loading && (
            isHydrating ? (
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-white/15" />
                </div>
              </div>
            ) : (
              <ProfileFlair name={viewerName} compact subtitle="Equipped flair" />
            )
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <div
            title={`${xp.toLocaleString("en-US")} XP`}
            className="inline-flex min-w-[5.25rem] shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/72">XP</span>
            <span className="text-sm font-black">{formatCompactStat(xp)}</span>
          </div>
          <div
            title={infiniteGemsEnabled ? "Infinite gems enabled" : `${gemBalance.toLocaleString("en-US")} gems`}
            className="inline-flex min-w-[5.5rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-white"
            style={{
              borderColor: withAlpha(pathTheme.accentColor, 0.36),
              background: withAlpha(pathTheme.accentColor, 0.18),
              boxShadow: `0 12px 26px ${withAlpha(pathTheme.accentColor, 0.18)}`,
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: withAlpha("#ffffff", 0.74) }}>
              Gems
            </span>
            <span className="text-sm font-black">{infiniteGemsEnabled ? "∞" : formatCompactStat(gemBalance)}</span>
          </div>
          <div className="group relative">
            <div
              title={`${streak.toLocaleString("en-US")} day streak • ${streakFreezeCount} freeze(s) remaining`}
              className="inline-flex min-w-[6.4rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-white"
              style={{
                borderColor: streak > 0 ? withAlpha("#fb923c", 0.22) : withAlpha(pathTheme.surfaceText, 0.12),
                background: streak > 0 ? "rgba(251,146,60,0.12)" : withAlpha("#ffffff", 0.06),
                boxShadow: streak > 0 ? "0 12px 26px rgba(251,146,60,0.14)" : "none",
              }}
            >
              <StreakFlame streak={streak} freezeCount={streakFreezeCount} size={18} />
              <span className="text-sm font-black">{formatCompactStat(streak)}</span>
            </div>
            <div className="pointer-events-none absolute right-0 top-[calc(100%+0.55rem)] hidden min-w-[13rem] rounded-[1rem] border border-white/10 bg-slate-950/92 px-3 py-2 text-xs font-semibold text-white/80 shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur group-hover:block group-focus-within:block">
              <p className="font-black text-white">{streak.toLocaleString("en-US")} day streak</p>
              <p className="mt-1">{streakFreezeCount} freeze{streakFreezeCount === 1 ? "" : "s"} remaining</p>
            </div>
          </div>
          {xpBoostCountdown && (
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1.5 text-fuchsia-100">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200/72">2x XP</span>
              <span className="text-sm font-black">{xpBoostCountdown}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
