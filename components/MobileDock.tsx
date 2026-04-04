"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeContext } from "@/contexts/ThemeContext";
import { withAlpha } from "@/lib/themes";

const NAV_ITEMS = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/learn", label: "Learn", short: "Learn" },
  { href: "/shop", label: "Shop", short: "Shop" },
  { href: "/daily", label: "Daily", short: "Daily" },
  { href: "/profile", label: "Profile", short: "Profile" },
];

export default function MobileDock() {
  const pathname = usePathname();
  const { pathTheme } = useThemeContext();

  return (
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-40 overflow-hidden rounded-[1.8rem] border shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl"
      style={{
        borderColor: withAlpha(pathTheme.accentColor, 0.24),
        background: pathTheme.surfaceDark,
        color: pathTheme.surfaceText,
      }}
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.22em]"
              style={{ color: active ? pathTheme.accentColor : withAlpha(pathTheme.surfaceText, 0.76) }}
            >
              {active && <span className="absolute left-3 right-3 top-0 h-[2px]" style={{ background: pathTheme.accentColor }} />}
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
