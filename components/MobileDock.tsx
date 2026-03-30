"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/learn", label: "Learn", short: "Learn" },
  { href: "/daily", label: "Daily", short: "Daily" },
  { href: "/achievements", label: "Awards", short: "Awards" },
];

export default function MobileDock() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 surface-sheet border-[rgba(44,62,80,0.24)] bg-[rgba(44,62,80,0.96)] text-[#ECF0F1]">
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] ${
                active ? "text-[#F4C28A]" : "text-[#D7DEE3]"
              }`}
            >
              {active && <span className="absolute left-3 right-3 top-0 h-[2px] bg-[#E67E22]" />}
              {item.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
