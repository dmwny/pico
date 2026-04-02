"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Pico from "@/components/Pico";
import MobileDock from "@/components/MobileDock";

type CodeTone = "plain" | "keyword" | "type" | "function" | "property" | "string" | "number" | "comment";

type CodeToken = {
  text: string;
  tone?: CodeTone;
};

type StackPreview = {
  id: "python" | "javascript" | "sql";
  label: string;
  badge: string;
  lane: string;
  detail: string;
  mood: "happy" | "celebrate";
  note: string;
  coachTitle: string;
  coachNote: string;
  chips: string[];
  code: CodeToken[][];
};

const TOKEN_CLASSES: Record<CodeTone, string> = {
  plain: "text-[#E8EDF2]",
  keyword: "text-[#F4C28A]",
  type: "text-[#8BD3FF]",
  function: "text-[#8CE6B4]",
  property: "text-[#F3A7C7]",
  string: "text-[#FFD8A8]",
  number: "text-[#F9E27D]",
  comment: "text-[#7C95AA]",
};

const STACK_PREVIEWS: StackPreview[] = [
  {
    id: "python",
    label: "Python",
    badge: "Guided Fundamentals",
    lane: "Turtle, loops, outputs, and verified syntax",
    detail: "Short sessions that move from first commands into real library practice.",
    mood: "happy",
    note: "Each lesson stays small on purpose: one concept, one quick check, and one visible result.",
    coachTitle: "Pico Coach",
    coachNote: "Start with a clean first step, then build rhythm with loops, movement, and fast feedback.",
    chips: ["5 minute sessions", "Placement ready", "Saved progress"],
    code: [
      [
        { text: "import", tone: "keyword" },
        { text: " " },
        { text: "turtle", tone: "type" },
      ],
      [
        { text: "pen", tone: "plain" },
        { text: " = " },
        { text: "turtle", tone: "type" },
        { text: "." },
        { text: "Turtle", tone: "function" },
        { text: "()" },
      ],
      [
        { text: "pen", tone: "plain" },
        { text: "." },
        { text: "forward", tone: "function" },
        { text: "(" },
        { text: "80", tone: "number" },
        { text: ")" },
      ],
      [
        { text: "pen", tone: "plain" },
        { text: "." },
        { text: "left", tone: "function" },
        { text: "(" },
        { text: "90", tone: "number" },
        { text: ")" },
      ],
      [
        { text: "# verified before you move on", tone: "comment" },
      ],
    ],
  },
  {
    id: "javascript",
    label: "JavaScript",
    badge: "Browser Projects",
    lane: "DOM, events, and quick app-building practice",
    detail: "Move from selecting elements to updating UI and wiring interactions that feel real.",
    mood: "celebrate",
    note: "The preview shifts with the stack so the home page feels like the product, not a static poster.",
    coachTitle: "Pico Coach",
    coachNote: "Use the browser as your playground: update the page, ship the action, then verify the result.",
    chips: ["DOM practice", "Mini labs", "Fast checks"],
    code: [
      [
        { text: "const", tone: "keyword" },
        { text: " panel = " },
        { text: "document", tone: "type" },
        { text: "." },
        { text: "querySelector", tone: "function" },
        { text: "(" },
        { text: "'.panel'", tone: "string" },
        { text: ");" },
      ],
      [
        { text: "panel", tone: "plain" },
        { text: "." },
        { text: "textContent", tone: "property" },
        { text: " = " },
        { text: "'Ship the idea'", tone: "string" },
        { text: ";" },
      ],
      [
        { text: "panel", tone: "plain" },
        { text: "." },
        { text: "classList", tone: "property" },
        { text: "." },
        { text: "add", tone: "function" },
        { text: "(" },
        { text: "'ready'", tone: "string" },
        { text: ");" },
      ],
      [
        { text: "panel", tone: "plain" },
        { text: "." },
        { text: "style", tone: "property" },
        { text: "." },
        { text: "borderColor", tone: "property" },
        { text: " = " },
        { text: "'#E67E22'", tone: "string" },
        { text: ";" },
      ],
    ],
  },
  {
    id: "sql",
    label: "SQL",
    badge: "Query Thinking",
    lane: "Readable query drills and real data patterns",
    detail: "Practice sorting, grouping, and filtering in a way that feels closer to the work itself.",
    mood: "happy",
    note: "Even the preview panel keeps the training vibe: focused, readable, and a little more high-trust.",
    coachTitle: "Pico Coach",
    coachNote: "Good query practice is less about memorizing syntax and more about seeing the structure quickly.",
    chips: ["Clear outputs", "Short loops", "Skill stacks"],
    code: [
      [
        { text: "SELECT", tone: "keyword" },
        { text: " city, " },
        { text: "COUNT", tone: "function" },
        { text: "(*)", tone: "plain" },
      ],
      [
        { text: "FROM", tone: "keyword" },
        { text: " users", tone: "plain" },
      ],
      [
        { text: "GROUP BY", tone: "keyword" },
        { text: " city", tone: "plain" },
      ],
      [
        { text: "ORDER BY", tone: "keyword" },
        { text: " " },
        { text: "COUNT", tone: "function" },
        { text: "(*) " },
        { text: "DESC", tone: "keyword" },
        { text: ";" },
      ],
    ],
  },
];

const UI_FONT_STACK = {
  fontFamily: '"Inter", "SF Pro Display", "Segoe UI Variable", "Source Sans 3", sans-serif',
} as const;

const PAPER_TEXTURE_STYLE = {
  backgroundImage: `
    radial-gradient(circle at top left, rgba(230,126,34,0.12), transparent 24%),
    radial-gradient(circle at 85% 12%, rgba(44,62,80,0.08), transparent 18%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 1px, transparent 1px, transparent 16px),
    repeating-linear-gradient(90deg, rgba(44,62,80,0.03) 0px, rgba(44,62,80,0.03) 1px, transparent 1px, transparent 18px)
  `,
} as const;

function countCodeCharacters(code: CodeToken[][]) {
  return code.reduce(
    (total, line) => total + line.reduce((lineTotal, token) => lineTotal + token.text.length, 0),
    0,
  );
}

function renderTypedCode(code: CodeToken[][], visibleChars: number) {
  let consumedChars = 0;

  return code.map((line, lineIndex) => {
    const lineLength = line.reduce((total, token) => total + token.text.length, 0);
    const lineVisibleChars = Math.max(0, Math.min(lineLength, visibleChars - consumedChars));
    const lineStarted = lineVisibleChars > 0;
    const lineActive = lineVisibleChars > 0 && lineVisibleChars < lineLength;
    let tokenConsumed = 0;

    consumedChars += lineLength;

    return (
      <div
        key={lineIndex}
        className={`grid grid-cols-[2rem_1fr] gap-4 transition-opacity duration-300 ${
          lineStarted ? "opacity-100" : "opacity-35"
        }`}
      >
        <span className="select-none text-right text-[#6D8497]">{lineIndex + 1}</span>
        <span className="min-h-7">
          {line.map((token, tokenIndex) => {
            const tokenVisibleChars = Math.max(0, Math.min(token.text.length, lineVisibleChars - tokenConsumed));
            tokenConsumed += token.text.length;

            if (tokenVisibleChars === 0) {
              return null;
            }

            return (
              <span key={`${lineIndex}-${tokenIndex}`} className={TOKEN_CLASSES[token.tone ?? "plain"]}>
                {token.text.slice(0, tokenVisibleChars)}
              </span>
            );
          })}
          {lineActive ? <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 bg-[#F4C28A] animate-pulse" /> : null}
        </span>
      </div>
    );
  });
}

function PreviewOutputStage({
  previewId,
  running,
}: {
  previewId: StackPreview["id"];
  running: boolean;
}) {
  if (previewId === "python") {
    return (
      <div
        className="rounded-[1.45rem] border border-[rgba(236,240,241,0.08)] bg-[linear-gradient(180deg,rgba(12,20,29,0.94),rgba(9,16,24,0.98))] p-4"
        style={running ? { animation: "homepageRunGlow 2.6s ease-in-out" } : undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#92A5B7]">Output</span>
          <span className="rounded-full border border-[rgba(140,230,180,0.18)] bg-[rgba(140,230,180,0.08)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#8CE6B4]">
            {running ? "drawing" : "ready"}
          </span>
        </div>
        <svg viewBox="0 0 260 176" className="mt-4 h-[150px] w-full">
          <rect x="10" y="10" width="240" height="156" rx="20" fill="#111B27" stroke="rgba(236,240,241,0.06)" />
          <path d="M32 134 H228" stroke="rgba(139,211,255,0.12)" strokeWidth="2" strokeDasharray="4 7" />
          <path d="M40 56 H220" stroke="rgba(139,211,255,0.08)" strokeWidth="2" strokeDasharray="4 10" />
          <path
            d="M54 128 L168 128 L168 62 L92 62 L92 144"
            fill="none"
            stroke="#56D6FF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="390"
            strokeDashoffset="390"
          >
            <animate attributeName="stroke-dashoffset" from="390" to="0" dur="2.1s" fill="freeze" />
          </path>
          <circle r="7" fill="#F4C28A">
            <animateMotion dur="2.1s" fill="freeze" path="M54 128 L168 128 L168 62 L92 62 L92 144" />
          </circle>
          <circle cx="92" cy="144" r="6" fill="#8CE6B4">
            <animate attributeName="opacity" values="0;1;1" dur="2.2s" fill="freeze" />
          </circle>
        </svg>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#D6E0E8]">
          The preview types first, then the turtle path runs.
        </p>
      </div>
    );
  }

  if (previewId === "javascript") {
    return (
      <div
        className="rounded-[1.45rem] border border-[rgba(236,240,241,0.08)] bg-[linear-gradient(180deg,rgba(12,20,29,0.94),rgba(9,16,24,0.98))] p-4"
        style={running ? { animation: "homepageRunGlow 2.6s ease-in-out" } : undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#92A5B7]">Output</span>
          <span className="rounded-full border border-[rgba(244,194,138,0.18)] bg-[rgba(244,194,138,0.08)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#F4C28A]">
            {running ? "updated" : "ready"}
          </span>
        </div>
        <div className="mt-4 rounded-[1.1rem] border border-[rgba(236,240,241,0.05)] bg-[#0D1722] p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#485B6E]" />
            <span className="h-2 w-2 rounded-full bg-[#485B6E]" />
            <span className="h-2 w-2 rounded-full bg-[#485B6E]" />
          </div>
          <div
            className="rounded-[1rem] border bg-[linear-gradient(180deg,#172434_0%,#132130_100%)] px-4 py-4"
            style={{ animation: "homepageJsPanel 0.9s ease-out both" }}
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#92A5B7]">.panel</p>
            <p className="mt-3 text-2xl font-black text-[#F4F7FB]">Ship the idea</p>
            <div
              className="mt-4 inline-flex rounded-full border border-[rgba(140,230,180,0.22)] bg-[rgba(140,230,180,0.1)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#8CE6B4]"
              style={{ animation: "homepageJsBadge 0.7s ease-out 180ms both" }}
            >
              ready
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#D6E0E8]">
          DOM changes update the panel, badge, and border state.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[1.45rem] border border-[rgba(236,240,241,0.08)] bg-[linear-gradient(180deg,rgba(12,20,29,0.94),rgba(9,16,24,0.98))] p-4"
      style={running ? { animation: "homepageRunGlow 2.6s ease-in-out" } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#92A5B7]">Output</span>
        <span className="rounded-full border border-[rgba(139,211,255,0.18)] bg-[rgba(139,211,255,0.08)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#8BD3FF]">
          {running ? "ranked" : "ready"}
        </span>
      </div>
      <div className="mt-4 space-y-3 rounded-[1.1rem] border border-[rgba(236,240,241,0.05)] bg-[#0D1722] px-4 py-4">
        {[
          { city: "Austin", total: "42", width: "84%", delay: "0ms" },
          { city: "Denver", total: "31", width: "62%", delay: "140ms" },
          { city: "Seattle", total: "24", width: "48%", delay: "280ms" },
        ].map((row) => (
          <div key={row.city} className="space-y-1.5">
            <div className="flex items-center justify-between text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#C9D5DF]">
              <span>{row.city}</span>
              <span>{row.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#8BD3FF,#F4C28A)]"
                style={{
                  width: row.width,
                  animation: `homepageSqlBar 0.9s ease-out ${row.delay} both`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#D6E0E8]">
        Query results land as readable counts instead of raw syntax only.
      </p>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [previewRunning, setPreviewRunning] = useState(false);
  const [runSeed, setRunSeed] = useState(0);
  const [outputCycle, setOutputCycle] = useState(0);
  const [previewHovered, setPreviewHovered] = useState(false);
  const [mascotHovered, setMascotHovered] = useState(false);
  const [pointerState, setPointerState] = useState({ x: 68, y: 26, nx: 0, ny: 0 });
  const previewPanelRef = useRef<HTMLElement | null>(null);

  const preview = STACK_PREVIEWS[previewIndex];
  const totalChars = countCodeCharacters(preview.code);
  const typingProgress = totalChars === 0 ? 100 : Math.max(8, (typedChars / totalChars) * 100);
  const previewStatus = previewRunning ? "running" : typedChars < totalChars ? "typing" : "ready";
  const mascotMood = previewRunning ? "celebrate" : previewHovered || mascotHovered ? "happy" : preview.mood;

  function restartPreview(nextIndex?: number) {
    setTypedChars(0);
    setPreviewRunning(false);

    if (typeof nextIndex === "number" && nextIndex !== previewIndex) {
      setPreviewIndex(nextIndex);
      return;
    }

    setRunSeed((seed) => seed + 1);
  }

  useEffect(() => {
    const typeSpeed = preview.id === "sql" ? 16 : 22;
    const typeStep = preview.id === "sql" ? 3 : 2;
    const runDelay = Math.max(720, totalChars * typeSpeed);

    const typingTimer = window.setInterval(() => {
      setTypedChars((current) => {
        if (current >= totalChars) {
          window.clearInterval(typingTimer);
          return totalChars;
        }

        return Math.min(totalChars, current + typeStep);
      });
    }, typeSpeed);

    const runTimer = window.setTimeout(() => {
      setPreviewRunning(true);
      setOutputCycle((cycle) => cycle + 1);
    }, runDelay);

    const settleTimer = window.setTimeout(() => {
      setPreviewRunning(false);
    }, runDelay + 2200);

    return () => {
      window.clearInterval(typingTimer);
      window.clearTimeout(runTimer);
      window.clearTimeout(settleTimer);
    };
  }, [preview.id, runSeed, totalChars]);

  function handlePreviewPointer(clientX: number, clientY: number) {
    const rect = previewPanelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relativeY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const nextPointer = {
      x: Math.round(relativeX * 100),
      y: Math.round(relativeY * 100),
      nx: Number(((relativeX - 0.5) * 2).toFixed(2)),
      ny: Number(((relativeY - 0.42) * 2).toFixed(2)),
    };

    setPointerState((current) => {
      if (
        Math.abs(current.x - nextPointer.x) < 2 &&
        Math.abs(current.y - nextPointer.y) < 2
      ) {
        return current;
      }

      return nextPointer;
    });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden mobile-dock-pad" style={UI_FONT_STACK}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-70" style={PAPER_TEXTURE_STYLE} />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.46),transparent)]" />
      </div>

      <div className="relative">
        <nav className="sticky top-0 z-40 border-b border-[rgba(44,62,80,0.12)] bg-[rgba(246,243,238,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-[1.4rem] border border-[rgba(44,62,80,0.1)] bg-[rgba(255,255,255,0.56)] p-2 shadow-[0_8px_24px_rgba(44,62,80,0.08)]">
              <Pico size={46} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#2C3E50]">Pico</p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#556675]">Code Training</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/language" className="underline-slide text-sm font-semibold text-[#2C3E50]">
              Open Courses
            </Link>
            <Link href="/login" className="underline-slide text-sm font-semibold text-[#2C3E50]">
              Login
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden border border-[rgba(44,62,80,0.18)] bg-[#F8F5F0] px-3 py-3 text-[#2C3E50]"
            aria-label="Open navigation"
          >
            <span className="block h-[2px] w-6 bg-current" />
            <span className="mt-1.5 block h-[2px] w-4 bg-current" />
            <span className="mt-1.5 block h-[2px] w-5 bg-current" />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[rgba(44,62,80,0.12)] bg-[#F8F5F0] md:hidden">
            <div className="mx-auto grid max-w-6xl gap-2 px-4 py-4">
              <Link
                href="/language"
                onClick={() => setMenuOpen(false)}
                className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-3 text-sm font-semibold text-[#2C3E50]"
              >
                Open Courses
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-3 text-sm font-semibold text-[#2C3E50]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="carrot-button px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em]"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
        </nav>

        <section className="mx-auto max-w-[1460px] px-4 pb-18 pt-10 sm:px-6 sm:pt-16">
          <div className="grid gap-10 xl:grid-cols-[1fr_1.04fr] xl:items-start">
            <article className="surface-sheet relative overflow-hidden rounded-[2.3rem] px-6 py-10 shadow-[0_24px_52px_rgba(44,62,80,0.09)] sm:px-12 sm:py-14 xl:px-16 xl:py-16">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(230,126,34,0.18),_transparent_72%)]" />
            <div className="absolute bottom-0 left-0 h-24 w-24 border-r border-t border-[rgba(44,62,80,0.08)] bg-[rgba(44,62,80,0.03)]" />
            <div className="absolute right-6 top-6 hidden rounded-[1.5rem] border border-[rgba(44,62,80,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 shadow-[0_14px_28px_rgba(44,62,80,0.08)] lg:block">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#A95A15]">Pico note</p>
              <p className="mt-2 max-w-[14rem] text-sm font-semibold leading-6 text-[#4F6271]">
                Learn in a way that feels guided, not crowded.
              </p>
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <p className="editorial-kicker">Pico</p>
                <span className="rounded-full border border-[rgba(200,104,18,0.28)] bg-[rgba(230,126,34,0.08)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#A95A15]">
                  Guided practice
                </span>
              </div>

              <h1 className="mt-8 max-w-[44rem] text-5xl font-black leading-[0.9] tracking-[-0.045em] text-[#223548] sm:text-6xl xl:text-[5.2rem]">
                Learn code in small bursts that still leave room to think.
              </h1>

              <p className="mt-8 max-w-[36rem] text-[1.06rem] font-semibold leading-8 text-[#556675]">
                Start with one clear action, keep your place, and move from first syntax into docs-backed labs without the page feeling busy or generic.
              </p>

              <div className="mt-8 flex flex-col items-start gap-4">
                <Link
                  href="/signup"
                  className="carrot-button px-7 py-4 text-sm font-bold uppercase tracking-[0.18em] text-center"
                  style={{ animation: "homepageCtaGlow 3.4s ease-in-out infinite" }}
                >
                  Start Your First 2-Minute Lesson
                </Link>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#556675]">
                  <Link href="/login" className="underline-slide text-[#2C3E50]">
                    I already have an account
                  </Link>
                  <Link href="/language" className="underline-slide text-[#2C3E50]">
                    Browse courses first
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid max-w-[42rem] gap-4 rounded-[1.8rem] border border-[rgba(44,62,80,0.1)] bg-[rgba(255,255,255,0.72)] px-5 py-5 shadow-[0_18px_36px_rgba(44,62,80,0.06)] sm:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Lesson 1 unlocked</p>
                    <span className="rounded-full border border-[rgba(200,104,18,0.2)] bg-[rgba(230,126,34,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#A95A15]">
                      2 minutes
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7DFD5]">
                    <div className="relative h-full w-[34%] rounded-full bg-[linear-gradient(90deg,#E67E22,#F4C28A)]">
                      <span
                        className="absolute inset-y-0 w-16 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
                        style={{ animation: "homepageProgressSweep 2.6s linear infinite" }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5A6A79]">
                    One concept, one quick check, one visible result.
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-[rgba(44,62,80,0.08)] bg-[rgba(241,236,229,0.78)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">Daily streak</p>
                    <span className="text-sm font-black text-[#2C3E50]">3 days</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {["M", "T", "W"].map((day, index) => (
                      <span
                        key={day}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          index === 2
                            ? "bg-[#2C3E50] text-white"
                            : "border border-[rgba(44,62,80,0.12)] bg-white text-[#2C3E50]"
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5A6A79]">
                    The page hints at progress before you even sign in.
                  </p>
                </div>
              </div>

              <div className="mt-14 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="grid gap-5">
                  <div className="rounded-[2.1rem] border border-[rgba(44,62,80,0.12)] bg-[rgba(245,239,231,0.9)] px-7 py-8 shadow-[0_18px_40px_rgba(44,62,80,0.06)]">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#556675]">5 minute sessions</p>
                    <p className="mt-4 max-w-[18rem] text-4xl font-black leading-[1.01] tracking-[-0.04em] text-[#243648]">
                      Short enough to start. Structured enough to stick.
                    </p>
                    <p className="mt-4 max-w-[22rem] text-base font-semibold leading-7 text-[#617181]">
                      Quick lessons with visible outputs instead of long passive screens and crowded onboarding.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[0.92fr_1.08fr]">
                    <div className="rounded-[1.9rem] border border-[rgba(200,104,18,0.18)] bg-[rgba(255,248,241,0.88)] px-5 py-7 shadow-[0_16px_30px_rgba(200,104,18,0.09)] sm:-rotate-[1deg]">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#A95A15]">Placement</p>
                      <p className="mt-3 text-[2rem] font-black leading-[1.03] tracking-[-0.035em] text-[#25374A]">Start where you actually are.</p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[#617181]">
                        Skip repeated basics when you already know the material.
                      </p>
                    </div>

                    <div className="rounded-[1.9rem] border border-[rgba(44,62,80,0.12)] bg-[rgba(255,255,255,0.68)] px-5 py-7 shadow-[0_12px_28px_rgba(44,62,80,0.05)] sm:translate-y-7">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#556675]">Feedback</p>
                      <p className="mt-3 text-[1.9rem] font-black leading-[1.06] tracking-[-0.035em] text-[#2C3E50]">Verified answers, saved streaks, and mini-course maps.</p>
                    </div>
                  </div>
                </div>

                <div className="relative lg:translate-y-10">
                  <div className="pointer-events-none absolute inset-x-8 -bottom-3 top-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,_rgba(66,110,173,0.26),_transparent_70%)] blur-3xl" />
                  <div className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(25,41,58,0.18)] bg-[linear-gradient(180deg,#203247_0%,#142131_100%)] px-6 py-8 text-[#ECF0F1] shadow-[0_26px_48px_rgba(19,32,49,0.24)]">
                  <div className="absolute -right-8 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(244,194,138,0.24),_transparent_70%)]" />
                  <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(244,194,138,0.52),transparent)]" />
                  <p className="relative text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#F2B76F]">Libraries</p>
                  <p className="relative mt-4 max-w-[12rem] text-[3rem] font-black leading-[0.93] tracking-[-0.045em] text-[#F4F7FB]">
                    Docs-backed labs.
                  </p>
                  <p className="relative mt-5 max-w-[16rem] text-base font-semibold leading-8 text-[#DCE6EE]">
                    Move beyond syntax drills into Turtle, Pygame, Fetch, Canvas, and the APIs you actually want to use.
                  </p>
                  <div className="relative mt-8 flex flex-wrap gap-2">
                    {["Turtle", "Pygame", "Fetch", "Canvas"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[rgba(236,240,241,0.16)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#ECF0F1]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm font-semibold text-[#5A6A79]">
                <span>Verified answers</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#C86812]" />
                <span>Saved progress</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#C86812]" />
                <span>Friendly coach feedback</span>
              </div>
            </div>
            </article>

          <div className="grid gap-6">
            <article
              ref={previewPanelRef}
              onMouseEnter={() => setPreviewHovered(true)}
              onMouseMove={(event) => handlePreviewPointer(event.clientX, event.clientY)}
              onMouseLeave={() => {
                setPreviewHovered(false);
                setMascotHovered(false);
                setPointerState({ x: 68, y: 26, nx: 0, ny: 0 });
              }}
              className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(22,38,56,0.2)] bg-[linear-gradient(180deg,#172332_0%,#101925_100%)] px-5 py-5 text-[#ECF0F1] shadow-[0_24px_56px_rgba(16,25,37,0.22)] transition-transform duration-300 sm:-ml-8 sm:px-6 sm:py-6"
            >
              <div className="pointer-events-none absolute inset-x-10 top-12 h-48 rounded-full bg-[radial-gradient(circle,_rgba(84,137,214,0.22),_transparent_72%)] blur-3xl" />
              <div
                className="pointer-events-none absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(244,194,138,0.2),_transparent_68%)] blur-3xl transition-all duration-300"
                style={{
                  left: `calc(${pointerState.x}% - 5.5rem)`,
                  top: `calc(${pointerState.y}% - 5.5rem)`,
                }}
              />
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(244,194,138,0.7),transparent)]" />
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(139,211,255,0.18),_transparent_70%)]" />
              <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,211,255,0.08),transparent_32%)] transition-opacity duration-500 ${previewRunning ? "opacity-100" : "opacity-60"}`} />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#F4C28A]">Live preview</p>
                    <h2 className="mt-2 text-4xl font-black text-[#ECF0F1]">{preview.label} workspace</h2>
                    <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#C9D5DF]">{preview.lane}</p>
                  </div>

                  <div
                    className="relative"
                    onMouseEnter={() => setMascotHovered(true)}
                    onMouseLeave={() => setMascotHovered(false)}
                  >
                    {(mascotHovered || previewHovered) ? (
                      <div
                        className="absolute -bottom-11 right-0 rounded-full border border-[rgba(236,240,241,0.12)] bg-[rgba(12,20,29,0.92)] px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#F4C28A]"
                        style={{ animation: "homepageTooltipIn 220ms ease-out both" }}
                      >
                        Try running the code
                      </div>
                    ) : null}
                    <div
                      className={`rounded-[1.6rem] border border-[rgba(236,240,241,0.12)] bg-[rgba(255,255,255,0.04)] p-3 transition-transform duration-300 ${
                        previewRunning ? "scale-[1.04]" : mascotHovered ? "-translate-y-1" : ""
                      }`}
                    >
                      <Pico
                        size={72}
                        mood={mascotMood}
                        lookX={pointerState.nx * 0.85}
                        lookY={pointerState.ny * 0.7}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
                  <div className="rounded-[1.95rem] border border-[rgba(236,240,241,0.08)] bg-[linear-gradient(180deg,#0f1721_0%,#101821_100%)] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[rgba(236,240,241,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#92A5B7]">
                          Live workspace
                        </span>
                        <span className="rounded-full border border-[rgba(139,211,255,0.16)] bg-[rgba(139,211,255,0.06)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#B8E6FF]">
                          {preview.badge}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => restartPreview()}
                        className="rounded-full border border-[rgba(244,194,138,0.28)] bg-[rgba(244,194,138,0.08)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#F4C28A] transition hover:border-[#F4C28A] hover:bg-[rgba(244,194,138,0.14)]"
                        style={previewRunning ? { animation: "homepageCtaGlow 1.6s ease-in-out" } : undefined}
                      >
                        Run preview
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#92A5B7]">
                        {previewStatus}
                      </p>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#F4C28A,#8BD3FF)] transition-[width] duration-300"
                          style={{ width: `${typingProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                      <div className="rounded-[1.45rem] border border-[rgba(236,240,241,0.05)] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.005))] px-4 py-5 font-mono text-[0.92rem] leading-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
                        {renderTypedCode(preview.code, typedChars)}
                      </div>

                      <PreviewOutputStage
                        key={`${preview.id}-${outputCycle}`}
                        previewId={preview.id}
                        running={previewRunning}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.9rem] border border-[rgba(236,240,241,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#F4C28A]">{preview.coachTitle}</p>
                      <p className="mt-3 text-2xl font-black leading-[1.08] text-[#ECF0F1]">{preview.detail}</p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[#D6E0E8]">{preview.coachNote}</p>
                      <div className="mt-4 rounded-[1.1rem] border border-[rgba(236,240,241,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#8BD3FF]">Hook</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#D6E0E8]">
                          The code types itself, then the demo actually runs.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.9rem] border border-[rgba(236,240,241,0.1)] bg-[rgba(255,255,255,0.03)] p-5">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#8BD3FF]">Rhythm</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {preview.chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-[rgba(236,240,241,0.12)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#E6EEF5]"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-6 max-w-2xl text-sm font-semibold leading-6 text-[#D6E0E8]">{preview.note}</p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {STACK_PREVIEWS.map((item, index) => {
                    const active = previewIndex === index;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => restartPreview(index)}
                        className={`rounded-full border px-4 py-2.5 text-left ${
                          active
                            ? "border-[#E67E22] bg-[#E67E22] text-[#FFF8F1] shadow-[0_12px_32px_rgba(200,104,18,0.26)]"
                            : "border-[rgba(236,240,241,0.14)] bg-[rgba(255,255,255,0.03)] text-[#E8EDF2] hover:border-[#F4C28A]"
                        }`}
                      >
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] opacity-90">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[1.65rem] border border-[rgba(236,240,241,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#8BD3FF]">Current stack</p>
                    <p className="mt-2 text-xl font-black text-[#ECF0F1]">{preview.lane}</p>
                  </div>

                  <div className="rounded-[1.65rem] border border-[rgba(236,240,241,0.08)] bg-[rgba(255,255,255,0.025)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#F4C28A]">Lesson 1</p>
                      <span className="rounded-full border border-[rgba(140,230,180,0.18)] bg-[rgba(140,230,180,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8CE6B4]">
                        Unlocked
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-[#ECF0F1]">Visible output in the first session.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="surface-sheet relative overflow-hidden rounded-[2.05rem] px-6 py-7 lg:ml-12 lg:px-7">
              <div className="absolute right-0 top-0 h-24 w-24 bg-[radial-gradient(circle,_rgba(230,126,34,0.12),_transparent_70%)]" />
              <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="border-l-[3px] border-[#E67E22] pl-4">
                  <p className="editorial-kicker">Why it feels calmer</p>
                  <h3 className="mt-2 text-3xl font-black text-[#2C3E50]">Less dashboard. More room for the eye to land.</h3>
                </div>

                <div className="grid gap-3 text-sm font-semibold leading-6 text-[#5A6A79]">
                  <p>The hero is more asymmetrical now, so every block does not compete at the same volume.</p>
                  <p>The preview controls are compact tabs instead of three more heavy cards, which opens up the right side.</p>
                  <Link href="/language" className="underline-slide mt-1 text-sm font-bold uppercase tracking-[0.18em] text-[#2C3E50]">
                    Explore courses
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>

        <section className="mt-14 grid gap-7 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="surface-sheet rounded-[2.15rem] px-6 py-8 sm:px-9">
            <p className="editorial-kicker">What It Feels Like</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black text-[#2C3E50]">Designed to feel more like a good desk setup than a templated funnel.</h2>

            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div className="md:border-r md:border-[rgba(44,62,80,0.12)] md:pr-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#A95A15]">01</p>
                <p className="mt-3 text-2xl font-black text-[#2C3E50]">One clear start</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#5A6A79]">
                  The page leads with one main action instead of surrounding you with equal-weight buttons and boxes.
                </p>
              </div>
              <div className="md:border-r md:border-[rgba(44,62,80,0.12)] md:px-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">02</p>
                <p className="mt-3 text-2xl font-black text-[#2C3E50]">A real product surface</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#5A6A79]">
                  The code panel now feels closer to an editor and less like a marketing placeholder with a pre block pasted in.
                </p>
              </div>
              <div className="md:pl-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#556675]">03</p>
                <p className="mt-3 text-2xl font-black text-[#2C3E50]">Breathing room</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#5A6A79]">
                  The composition uses more stagger, fewer repeated boxes, and more negative space so it reads like something designed by a person.
                </p>
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(200,104,18,0.22)] bg-[linear-gradient(180deg,#fff3e5_0%,#f8e1c5_100%)] px-6 py-8 shadow-[0_18px_42px_rgba(200,104,18,0.12)] sm:px-9">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(200,104,18,0.16),_transparent_70%)]" />
            <p className="editorial-kicker text-[#8B4B11]">Pico Energy</p>
            <h2 className="mt-3 max-w-md text-4xl font-black leading-[0.98] text-[#2C3E50]">Sharper hierarchy. Cooler rhythm. Less AI gloss.</h2>
            <p className="mt-5 max-w-md text-base font-semibold leading-8 text-[#5E554B]">
              The goal here was not “more components.” It was a page with more personality, clearer pacing, and fewer moments where every panel shouts at once.
            </p>

            <div className="mt-8 space-y-3 text-sm font-bold uppercase tracking-[0.22em] text-[#7D5834]">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#C86812]" />
                Asymmetrical feature layout
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#C86812]" />
                Compact preview controls
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#C86812]" />
                More editorial copy and spacing
              </div>
            </div>
          </article>
        </section>
        </section>
      </div>

      <MobileDock />
    </main>
  );
}
