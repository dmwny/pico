"use client";

import { useRouter } from "next/navigation";

const PYTHON_ICON = (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M24 4C17 4 17.5 7 17.5 7L17.51 10.12H24.13V11H13.5C13.5 11 10 10.6 10 17.67C10 24.74 13.05 24.5 13.05 24.5H15V21.26C15 21.26 14.84 18.21 17.93 18.21H24.5C24.5 18.21 27.35 18.26 27.35 15.5V8.5C27.35 8.5 27.81 4 24 4Z" fill="#3b82f6"/>
    <path d="M24.5 44C31.5 44 31 41 31 41L30.99 37.88H24.37V37H35C35 37 38.5 37.4 38.5 30.33C38.5 23.26 35.45 23.5 35.45 23.5H33.5V26.74C33.5 26.74 33.66 29.79 30.57 29.79H24C24 29.79 21.15 29.74 21.15 32.5V39.5C21.15 39.5 20.69 44 24.5 44Z" fill="#facc15"/>
    <circle cx="21" cy="8" r="1.5" fill="white"/>
    <circle cx="27.5" cy="40" r="1.5" fill="white"/>
  </svg>
);

const JS_ICON = (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <rect x="4" y="4" width="40" height="40" rx="6" fill="#facc15"/>
    <path d="M20 32.5C20 34.5 18.9 35.5 17.3 35.5C15.8 35.5 14.9 34.6 14.5 33.5L12.5 34.7C13.2 36.4 14.8 38 17.4 38C20.2 38 22.3 36.4 22.3 32.4V22H20V32.5Z" fill="#1a1a1a"/>
    <path d="M27.5 35.5C25.7 35.5 25 34.4 24.4 33.2L22.4 34.5C23.2 36.2 24.9 38 27.6 38C30.5 38 32.5 36.3 32.5 33.5C32.5 30.9 31 29.7 28.5 28.6L27.7 28.3C26.4 27.7 25.8 27.3 25.8 26.3C25.8 25.5 26.4 24.9 27.3 24.9C28.2 24.9 28.8 25.3 29.3 26.2L31.2 24.9C30.3 23.3 29.1 22.6 27.3 22.6C24.9 22.6 23.3 24.2 23.3 26.4C23.3 28.9 24.8 30.1 27 31.1L27.8 31.4C29.3 32.1 30 32.5 30 33.7C30 34.7 29.1 35.5 27.5 35.5Z" fill="#1a1a1a"/>
  </svg>
);

const LANGUAGE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  python: { label: "Python", icon: PYTHON_ICON },
  javascript: { label: "JavaScript", icon: JS_ICON },
};

interface LanguageSwitcherProps {
  currentLanguage: string;
}

export default function LanguageSwitcher({ currentLanguage }: LanguageSwitcherProps) {
  const router = useRouter();
  const meta = LANGUAGE_META[currentLanguage] ?? {
    label: currentLanguage,
    icon: (
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  };

  return (
    <button
      onClick={() => router.push("/languages")}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-150 group"
    >
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        {meta.icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Learning</p>
        <p className="text-sm font-bold text-gray-800">{meta.label}</p>
      </div>
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
  );
}