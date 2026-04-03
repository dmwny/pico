"use client";

import { useState } from "react";
import Link from "next/link";
import Pico from "@/components/Pico";
import MobileDock from "@/components/MobileDock";

const STACK_PREVIEWS = [
  {
    label: "Python",
    badge: "Data Science",
    code: "import turtle\npen = turtle.Turtle()\npen.forward(80)\npen.left(90)",
    note: "Use Turtle, variables, loops, and functions.",
  },
  {
    label: "JavaScript",
    badge: "Web Development",
    code: "const panel = document.querySelector('.panel');\npanel.textContent = 'Ship the idea';\npanel.style.borderColor = '#E67E22';",
    note: "Use DOM APIs, events, and browser logic.",
  },
  {
    label: "SQL",
    badge: "Database Queries",
    code: "SELECT city, COUNT(*)\nFROM users\nGROUP BY city\nORDER BY COUNT(*) DESC;",
    note: "Use SELECT, GROUP BY, and query filters.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const preview = STACK_PREVIEWS[previewIndex];

  return (
    <main className="min-h-screen mobile-dock-pad">
      <nav className="sticky top-0 z-40 border-b border-[rgba(44,62,80,0.12)] bg-[rgba(246,243,238,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Pico size={52} />
            <div>
              <p className="font-display text-2xl font-black text-[#2C3E50]">Pico</p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#556675]">Code Training</p>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/language" className="underline-slide text-sm font-semibold text-[#2C3E50]">
              Open Courses
            </Link>
            <Link href="/shop" className="underline-slide text-sm font-semibold text-[#2C3E50]">
              Open Shop
            </Link>
            <Link href="/login" className="underline-slide text-sm font-semibold text-[#2C3E50]">
              Open Login
            </Link>
            <Link href="/signup" className="carrot-button px-5 py-3 text-sm font-bold uppercase tracking-[0.18em]">
              Create Account
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
              <Link href="/language" className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-3 text-sm font-semibold text-[#2C3E50]">
                Open Courses
              </Link>
              <Link href="/shop" className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-3 text-sm font-semibold text-[#2C3E50]">
                Open Shop
              </Link>
              <Link href="/login" className="border border-[rgba(44,62,80,0.12)] bg-[#F1ECE5] px-4 py-3 text-sm font-semibold text-[#2C3E50]">
                Open Login
              </Link>
              <Link href="/signup" className="carrot-button px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-center">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="surface-sheet relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
            <div className="absolute right-0 top-0 h-20 w-20 border-l border-b border-[rgba(44,62,80,0.08)] bg-[rgba(230,126,34,0.08)]" />
            <p className="editorial-kicker">Pico</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.98] text-[#2C3E50] sm:text-6xl">
              Select.
              <span className="mt-2 block text-[#E67E22]">Practice. Verify.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#556675]">
              Learn Python or JavaScript in short timed lessons.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="ink-button px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-center">
                Create Account
              </Link>
              <Link href="/language" className="underline-slide px-1 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[#2C3E50]">
                Open Courses
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="border border-[rgba(44,62,80,0.14)] bg-[#F1ECE5] p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#556675]">Sessions</p>
                <p className="mt-3 text-3xl font-black text-[#2C3E50]">Run 5 minutes</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#617181]">
                  Complete short lessons and keep progress saved.
                </p>
              </div>
              <div className="border border-[rgba(44,62,80,0.14)] bg-[#2C3E50] p-4 text-[#ECF0F1] sm:translate-y-8">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#F4C28A]">Placement</p>
                <p className="mt-3 text-3xl font-black text-[#ECF0F1]">Start accurately</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#F3F6F8]">
                  Skip repeated basics when prior knowledge exists.
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-5">
            <article className="border border-[rgba(44,62,80,0.18)] bg-[#2C3E50] px-5 py-5 text-[#ECF0F1] shadow-[0_16px_42px_rgba(44,62,80,0.18)] sm:-ml-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#F4C28A]">Preview</p>
                  <h2 className="mt-2 text-4xl font-black text-[#ECF0F1]">Open {preview.label}</h2>
                </div>
                <Pico size={72} mood="celebrate" />
              </div>

              <div className="mt-5 border border-[rgba(236,240,241,0.18)] bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#FFFFFF]">{preview.badge}</p>
                <pre className="mt-3 whitespace-pre-wrap font-mono text-sm leading-6 text-[#FFF8F1]">
                  {preview.code}
                </pre>
              </div>

              <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-[#FFFFFF]">{preview.note}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {STACK_PREVIEWS.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={`border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${
                      previewIndex === index
                        ? "border-[#E67E22] bg-[#E67E22] text-[#FFF8F1]"
                        : "border-[rgba(236,240,241,0.18)] text-[#FFFFFF] hover:border-[#F4C28A] hover:text-[#FFF8F1]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </article>

            <article className="surface-sheet grid gap-4 px-5 py-5 lg:ml-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-l-[3px] border-[#E67E22] pl-4">
                <p className="editorial-kicker">Functions</p>
                <h3 className="mt-2 text-3xl font-black text-[#2C3E50]">Open technical tools.</h3>
              </div>
              <div className="grid gap-3 text-sm font-semibold leading-6 text-[#5A6A79]">
                <p>
                  Use lessons, placement, and library modules.
                </p>
                <p>
                  Open Turtle, Fetch, Canvas, and similar APIs.
                </p>
                <Link href="/language" className="underline-slide mt-2 text-sm font-bold uppercase tracking-[0.18em] text-[#2C3E50]">
                  Open Courses
                </Link>
              </div>
            </article>
          </div>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr_1fr]">
          <article className="surface-sheet px-5 py-6">
            <p className="editorial-kicker">Lessons</p>
            <h2 className="mt-3 text-4xl font-black text-[#2C3E50]">Use short lessons.</h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#586878]">
              Practice syntax, outputs, challenges, and libraries.
            </p>
          </article>

          <article className="border border-[rgba(200,104,18,0.35)] bg-[#E67E22] px-5 py-6 text-[#FFF8F1] shadow-[0_16px_42px_rgba(200,104,18,0.18)] lg:-mt-10">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#343434]">APIs</p>
            <p className="mt-4 text-3xl font-black text-[#FFF8F1]">Open Turtle modules now.</p>
          </article>

          <article className="surface-sheet px-5 py-6 lg:mt-10">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#556675]">Account</p>
            <p className="mt-3 text-2xl font-black text-[#2C3E50]">Create your account.</p>
          </article>
        </section>
      </section>

      <MobileDock />
    </main>
  );
}
