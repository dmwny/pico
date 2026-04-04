"use client";

import { useRouter } from "next/navigation";
import { useThemeContext } from "@/contexts/ThemeContext";
import { withAlpha } from "@/lib/themes";

const LANGUAGE_META: Record<string, { label: string; glyph: string; tone: string }> = {
  python: { label: "Python", glyph: "PY", tone: "bg-[#3776AB] text-white" },
  javascript: { label: "JavaScript", glyph: "JS", tone: "bg-[#F7DF1E] text-[#1D2730]" },
  typescript: { label: "TypeScript", glyph: "TS", tone: "bg-[#3178C6] text-white" },
  java: { label: "Java", glyph: "JV", tone: "bg-[#EA7A2F] text-white" },
  csharp: { label: "C#", glyph: "C#", tone: "bg-[#7C3AED] text-white" },
  rust: { label: "Rust", glyph: "RS", tone: "bg-[#2F2B28] text-white" },
  lua: { label: "Lua", glyph: "LU", tone: "bg-[#000080] text-white" },
};

interface LanguageSwitcherProps {
  currentLanguage: string;
}

export default function LanguageSwitcher({ currentLanguage }: LanguageSwitcherProps) {
  const router = useRouter();
  const { pathTheme } = useThemeContext();
  const meta = LANGUAGE_META[currentLanguage] ?? {
    label: currentLanguage,
    glyph: "ST",
    tone: "bg-[#2C3E50] text-[#ECF0F1]",
  };

  return (
    <button
      onClick={() => router.push("/languages")}
      className="w-full rounded-[1.7rem] border px-4 py-4 text-left shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
      style={{
        borderColor: withAlpha(pathTheme.accentColor, 0.22),
        background: pathTheme.surfaceCard,
        color: pathTheme.surfaceText,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center ${meta.tone} text-xs font-black`}>
            {meta.glyph}
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em]" style={{ color: withAlpha(pathTheme.surfaceText, 0.62) }}>Language</p>
            <p className="mt-1 text-sm font-bold" style={{ color: pathTheme.surfaceText }}>{meta.label}</p>
          </div>
        </div>

        <span className="text-[0.68rem] font-bold uppercase tracking-[0.24em]" style={{ color: pathTheme.accentColor }}>
          Open
        </span>
      </div>
    </button>
  );
}
