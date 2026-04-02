"use client";

import { useRouter } from "next/navigation";

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
  const meta = LANGUAGE_META[currentLanguage] ?? {
    label: currentLanguage,
    glyph: "ST",
    tone: "bg-[#2C3E50] text-[#ECF0F1]",
  };

  return (
    <button
      onClick={() => router.push("/languages")}
      className="surface-sheet w-full bg-[#F8F5F0] px-4 py-4 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center ${meta.tone} text-xs font-black`}>
            {meta.glyph}
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Language</p>
            <p className="mt-1 text-sm font-bold text-[#2C3E50]">{meta.label}</p>
          </div>
        </div>

        <span className="underline-slide text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#2C3E50]">
          Open
        </span>
      </div>
    </button>
  );
}
