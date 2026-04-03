"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPathTheme } from "@/lib/themes";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { ProfileFlair } from "@/components/ProfileFlair";

const NAV_LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/shop", label: "Shop" },
  { href: "/daily", label: "Daily" },
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
  const { xp, gemBalance, infiniteGemsEnabled, streak, streakFreezeCount, xpBoostCountdown, loading, viewerName } = useCosmetics();
  const defaultTheme = getPathTheme("default");

  return (
    <nav className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(255,255,255,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
              style={{ background: defaultTheme.unitBannerBackground }}
            >
              Pi
            </div>
            <p className="hidden font-display text-2xl font-black text-slate-900 sm:block">Pico</p>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    active ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                  style={active ? { background: defaultTheme.unitBannerBackground } : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden xl:block">
          {!loading && <ProfileFlair name={viewerName} compact subtitle="Equipped flair" />}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <div
            title={`${xp.toLocaleString("en-US")} XP`}
            className="inline-flex min-w-[5.25rem] shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">XP</span>
            <span className="text-sm font-black text-emerald-700">{formatCompactStat(xp)}</span>
          </div>
          <div
            title={infiniteGemsEnabled ? "Infinite gems enabled" : `${gemBalance.toLocaleString("en-US")} gems`}
            className="inline-flex min-w-[5.5rem] shrink-0 items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-500">Gems</span>
            <span className="text-sm font-black text-sky-700">{infiniteGemsEnabled ? "∞" : formatCompactStat(gemBalance)}</span>
          </div>
          <div
            title={`${streak.toLocaleString("en-US")} streak`}
            className="inline-flex min-w-[6.2rem] shrink-0 items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Streak</span>
            <span className="text-sm font-black text-orange-600">{formatCompactStat(streak)}</span>
            {streakFreezeCount > 0 && (
              <span className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-sky-700">
                Freeze {streakFreezeCount}
              </span>
            )}
          </div>
          {xpBoostCountdown && (
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-500">2x XP</span>
              <span className="text-sm font-black text-fuchsia-700">{xpBoostCountdown}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
