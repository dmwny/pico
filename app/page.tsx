"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Flame,
  Gift,
  LockKeyhole,
  PenTool,
  ShoppingBag,
  Sparkles,
  Trophy,
  Waypoints,
} from "lucide-react";
import { useMemo, useRef } from "react";

import { navigateWithAuth } from "@/lib/auth";
import {
  getFirstBoardColumns,
  getLandingCourseSummaries,
  getLandingHeroLanguages,
  type LandingBoardColumn,
} from "@/lib/landing";

function formatList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

const COURSE_SUMMARIES = getLandingCourseSummaries();
const BOARD_COLUMNS = getFirstBoardColumns("python", 6);
const TOTAL_LESSONS = COURSE_SUMMARIES.reduce((total, course) => total + course.lessonCount, 0);
const HERO_LANGUAGE_COPY = formatList(getLandingHeroLanguages());
const STREAK_LEARNERS = 4200;

function PicoMark() {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--pico-border)] bg-[var(--pico-orange)] text-lg font-black text-white"
      style={{ boxShadow: "4px 4px 0 var(--pico-dark)" }}
    >
      P
    </div>
  );
}

function useProtectedRoutes() {
  const router = useRouter();

  return useMemo(
    () => ({
      board: () => void navigateWithAuth(router, "/board", "/learn"),
      courses: () => void navigateWithAuth(router, "/courses", "/languages"),
      shop: () => void navigateWithAuth(router, "/shop"),
      signup: () => router.push("/signup"),
    }),
    [router],
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-3 rounded-full border border-[var(--pico-border)] bg-[var(--pico-dark)] px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--pico-orange)] ${className}`}
      style={{ boxShadow: "0 10px 24px rgba(26,26,46,0.12)" }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-3 rounded-full border border-[var(--pico-border)] bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)] transition hover:-translate-y-0.5 hover:bg-[var(--pico-dark)] hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

function LandingNav() {
  const routes = useProtectedRoutes();

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--pico-border)] backdrop-blur"
      style={{ backgroundColor: "color-mix(in srgb, var(--pico-cream) 95%, transparent)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <PicoMark />
          <div>
            <div className="font-serif text-2xl leading-none text-[var(--pico-dark)]">Pico</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--pico-body)] opacity-70">
              Code Training
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <button
            type="button"
            onClick={routes.courses}
            className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)] transition hover:text-[var(--pico-orange)]"
          >
            Courses
          </button>
          <button
            type="button"
            onClick={routes.shop}
            className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)] transition hover:text-[var(--pico-orange)]"
          >
            Shop
          </button>
          <Link
            href="/docs"
            className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)] transition hover:text-[var(--pico-orange)]"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)] transition hover:text-[var(--pico-orange)]"
          >
            Login
          </Link>
        </nav>

        <PrimaryButton onClick={routes.signup} className="px-5 py-2.5 text-[11px]">
          Create Account
        </PrimaryButton>
      </div>
    </header>
  );
}

function HeroBoardCard() {
  const router = useRouter();
  const primaryBoard = BOARD_COLUMNS[0];
  const completedLessons = primaryBoard.lessons.filter((lesson) => lesson.state === "done").length;
  const progress = Math.round((completedLessons / Math.max(primaryBoard.lessons.length, 1)) * 100);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => router.push("/signup")}
        className="absolute -left-3 -top-5 z-10 rounded-full border border-[var(--pico-border)] bg-[var(--pico-orange)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.26em] text-white"
        style={{ transform: "rotate(-3deg)", boxShadow: "4px 4px 0 var(--pico-dark)" }}
      >
        Free Trial
      </button>

      <div
        className="rounded-[32px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-6"
        style={{ boxShadow: "10px 10px 0 var(--pico-dark)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--pico-body)] opacity-70">
              First board preview
            </div>
            <div className="mt-2 font-serif text-3xl leading-none text-[var(--pico-dark)]">
              {primaryBoard.unitTitle}
            </div>
          </div>
          <span className="rounded-full bg-[var(--pico-orange)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white">
            Active
          </span>
        </div>

        <div className="mt-6 rounded-[26px] border border-[var(--pico-border)] bg-[rgba(255,255,255,0.45)] p-4">
          <div className="flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pico-body)] opacity-70">
            <span>Progress</span>
            <span>{progress}% complete</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(26,26,46,0.08)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-[var(--pico-orange)]"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {primaryBoard.lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + index * 0.06, duration: 0.35 }}
              className="flex items-center gap-3 rounded-[22px] border border-[var(--pico-border)] px-4 py-3"
              style={{
                background:
                  lesson.state === "done"
                    ? "var(--pico-tile-done)"
                    : "var(--pico-tile-empty)",
                color: lesson.state === "done" ? "#ffffff" : "var(--pico-dark)",
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.24em]">
                {index + 1}
              </span>
              <span className="font-mono text-sm">{lesson.lessonTitle}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[var(--pico-body)]">
          <span className="font-semibold">{STREAK_LEARNERS.toLocaleString()} learners on a streak today</span>
          <span className="text-[var(--pico-body)] opacity-70">Real board content from Pico&apos;s Python path</span>
        </div>
      </div>

      <div
        className="absolute -bottom-4 right-3 rounded-[18px] border border-[var(--pico-border)] px-4 py-3 text-sm font-semibold text-[var(--pico-dark)]"
        style={{
          background: "var(--pico-sticky-yellow)",
          boxShadow: "6px 6px 0 rgba(26,26,46,0.12)",
        }}
      >
        No card · cancel anytime
      </div>
    </div>
  );
}

function HeroSection() {
  const routes = useProtectedRoutes();

  return (
    <section className="border-b border-[var(--pico-border)] bg-[var(--pico-cream)]">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--pico-border)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pico-dark)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pico-orange)]" />
            V1 · 2026 · Now in early access
          </div>

          <h1 className="mt-7 font-serif text-6xl leading-[0.92] text-[var(--pico-dark)] md:text-7xl xl:text-8xl">
            Learn on a board.
            <br />
            Build with{" "}
            <span className="text-[var(--pico-orange)] underline decoration-[var(--pico-orange)] decoration-[3px] underline-offset-8">
              momentum
            </span>
            .
          </h1>

          <p className="mt-7 max-w-2xl text-xl leading-relaxed text-[var(--pico-body)] md:text-2xl">
            Pico teaches {HERO_LANGUAGE_COPY}. Every landing-page promise now matches the real
            course catalog and the real board data shipping in the app.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton onClick={routes.board}>
              Open The Board <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <SecondaryButton onClick={routes.courses}>Open Courses</SecondaryButton>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--pico-border)] bg-white/50 px-4 py-3 text-sm text-[var(--pico-body)]">
              <Flame className="h-4 w-4 text-[var(--pico-orange)]" />
              {STREAK_LEARNERS.toLocaleString()} learners on a streak today
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--pico-border)] bg-white/50 px-4 py-3 text-sm text-[var(--pico-body)]">
              <BookOpenText className="h-4 w-4 text-[var(--pico-orange)]" />
              {TOTAL_LESSONS.toLocaleString()} live lessons across the platform
            </div>
          </div>
        </div>

        <HeroBoardCard />
      </div>

      <div
        className="pb-8 text-center text-[11px] font-bold uppercase tracking-[0.28em]"
        style={{ color: "color-mix(in srgb, var(--pico-body) 65%, transparent)" }}
      >
        Scroll to ride the board
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: STREAK_LEARNERS.toLocaleString(), label: "learners on a streak today" },
    { value: String(COURSE_SUMMARIES.length), label: "live course paths" },
    { value: TOTAL_LESSONS.toLocaleString(), label: "real lessons in the catalog" },
    { value: String(getLandingHeroLanguages().length), label: "languages shipping now" },
  ];

  return (
    <section className="border-b border-[var(--pico-border)] bg-[rgba(255,255,255,0.42)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:grid-cols-4 md:px-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="rounded-[26px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-5"
            style={{ boxShadow: "6px 6px 0 rgba(26,26,46,0.08)" }}
          >
            <div className="font-serif text-5xl leading-none text-[var(--pico-dark)]">{stat.value}</div>
            <div
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "color-mix(in srgb, var(--pico-body) 72%, transparent)" }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CoursesSection() {
  const routes = useProtectedRoutes();

  return (
    <section className="border-b border-[var(--pico-border)] bg-[var(--pico-cream)] py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pico-orange)]">
              Real Courses
            </div>
            <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-[1] text-[var(--pico-dark)] md:text-6xl">
              Every course on the landing page is pulled from Pico&apos;s actual catalog.
            </h2>
          </div>

          <SecondaryButton onClick={routes.courses}>Open Courses</SecondaryButton>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {COURSE_SUMMARIES.map((course, index) => (
            <motion.button
              key={course.id}
              type="button"
              onClick={routes.courses}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="group rounded-[30px] border border-[var(--pico-border)] bg-[rgba(255,255,255,0.46)] p-6 text-left transition hover:-translate-y-1"
              style={{ boxShadow: "8px 8px 0 rgba(26,26,46,0.09)" }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-[var(--pico-border)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pico-dark)]">
                  {course.tag}
                </span>
                {course.placement ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pico-orange)]">
                    Placement
                  </span>
                ) : (
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "color-mix(in srgb, var(--pico-body) 55%, transparent)" }}
                  >
                    Open path
                  </span>
                )}
              </div>

              <h3 className="mt-6 font-serif text-4xl leading-none text-[var(--pico-dark)]">
                {course.title}
              </h3>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-3">
                  <div className="font-serif text-2xl text-[var(--pico-dark)]">{course.lessonCount}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pico-body)] opacity-70">
                    Lessons
                  </div>
                </div>
                <div className="rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-3">
                  <div className="font-serif text-2xl text-[var(--pico-dark)]">{course.unitCount}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pico-body)] opacity-70">
                    Units
                  </div>
                </div>
                <div className="rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-3">
                  <div className="font-serif text-2xl text-[var(--pico-dark)]">{course.miniCourseCount}</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pico-body)] opacity-70">
                    Builds
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-[var(--pico-body)]">
                <div>
                  <span className="font-bold text-[var(--pico-dark)]">Starts in:</span> {course.firstUnitTitle}
                </div>
                <div>
                  <span className="font-bold text-[var(--pico-dark)]">First lesson:</span> {course.firstLessonTitle}
                </div>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-[var(--pico-orange)]">
                Open path <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Waypoints,
      title: "Pick a board",
      description: "Choose a course path and Pico lays out a real board built from live units and lessons.",
    },
    {
      icon: PenTool,
      title: "Complete lessons",
      description: "Answer questions, type code, and keep pushing across the board one lesson tile at a time.",
    },
    {
      icon: Trophy,
      title: "Earn XP & unlock rewards",
      description: "Progress turns into XP, hearts matter, and the shop keeps pace with what you unlock.",
    },
  ];

  return (
    <section className="border-b border-[var(--pico-border)] bg-[rgba(255,255,255,0.35)] py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pico-orange)]">
          How It Works
        </div>
        <h2 className="mt-3 max-w-2xl font-serif text-5xl leading-[1] text-[var(--pico-dark)] md:text-6xl">
          Pick a board, finish lessons, stack XP.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-[30px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-7"
                style={{ boxShadow: "8px 8px 0 rgba(26,26,46,0.08)" }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--pico-border)] bg-[var(--pico-orange)] text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pico-orange)]">
                  Step {index + 1}
                </div>
                <h3 className="mt-3 font-serif text-4xl leading-none text-[var(--pico-dark)]">
                  {step.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-[var(--pico-body)]">{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BoardColumnCard({
  column,
  index,
}: {
  column: LandingBoardColumn;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="w-[290px] shrink-0 rounded-[30px] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-5"
      style={{ boxShadow: "8px 8px 0 rgba(26,26,46,0.08)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pico-body)] opacity-70">
            Unit {index + 1}
          </div>
          <div className="mt-2 font-serif text-3xl leading-none text-[var(--pico-dark)]">{column.unitTitle}</div>
        </div>
        <Sparkles className="h-5 w-5 text-[var(--pico-orange)]" />
      </div>

      <div className="mt-5 grid gap-3">
        {column.lessons.map((lesson, lessonIndex) => {
          const completed = lesson.state === "done";

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.3, delay: lessonIndex * 0.05 }}
              className="rounded-[20px] border border-[var(--pico-border)] px-4 py-3"
              style={{
                background: completed ? "var(--pico-tile-done)" : "var(--pico-tile-empty)",
                color: completed ? "#ffffff" : "var(--pico-dark)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-sm">{lesson.lessonTitle}</div>
                {completed ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em]">Done</span>
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.article>
  );
}

function BoardRideSection() {
  const routes = useProtectedRoutes();
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 130, damping: 22, mass: 0.18 });
  const boardX = useTransform(smoothProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "-42%"]);
  const boardY = useTransform(smoothProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "-9%"]);
  const ctaOpacity = useTransform(smoothProgress, [0.62, 0.9], [0, 1]);
  const ctaY = useTransform(smoothProgress, [0.62, 0.9], [24, 0]);
  const rideColumns = [...BOARD_COLUMNS, ...BOARD_COLUMNS].map((column, index) => ({
    ...column,
    id: `${column.id}-${index}`,
    lessons: column.lessons.map((lesson) => ({ ...lesson, id: `${lesson.id}-${index}` })),
  }));

  return (
    <section ref={sectionRef} className="border-b border-[var(--pico-border)] bg-[var(--pico-cream)]">
      <div className="mx-auto max-w-7xl px-5 pt-[4.5rem] md:px-8">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pico-orange)]">
            Scroll To Ride The Board
          </div>
          <h2 className="mt-3 font-serif text-5xl leading-[1] text-[var(--pico-dark)] md:text-6xl">
            The board now scrolls through real lesson tiles from Pico&apos;s first course path.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--pico-body)]">
            Completed tiles stay orange, locked tiles stay muted, and the whole preview pans across
            the actual board data instead of placeholder cards.
          </p>
        </div>
      </div>

      <div className="md:hidden px-5 pb-14 pt-10 md:px-8">
        <div className="grid gap-4">
          {BOARD_COLUMNS.map((column, index) => (
            <BoardColumnCard key={column.id} column={column} index={index} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-[32px] border border-[var(--pico-border)] bg-[rgba(255,255,255,0.45)] p-6">
          <div className="font-serif text-3xl text-[var(--pico-dark)]">Your board is waiting →</div>
          <PrimaryButton onClick={routes.signup}>Create Account</PrimaryButton>
        </div>
      </div>

      <div className="relative hidden h-[300vh] md:block">
        <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,98,42,0.12),transparent_34%)]" />

          <div className="absolute left-8 top-10 z-20 flex items-center gap-3 rounded-full border border-[var(--pico-border)] bg-[rgba(255,255,255,0.58)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pico-dark)]">
            <Waypoints className="h-4 w-4 text-[var(--pico-orange)]" />
            Scroll to ride the board
          </div>

          <motion.div
            style={{ x: boardX, y: boardY }}
            className="absolute left-[6vw] top-[18vh] flex items-start gap-6"
          >
            {rideColumns.map((column, index) => (
              <BoardColumnCard key={column.id} column={column} index={index} />
            ))}
          </motion.div>

          <motion.div
            style={{ opacity: ctaOpacity, y: ctaY }}
            className="absolute bottom-10 left-8 z-20 max-w-md rounded-[32px] border border-[var(--pico-border)] bg-[var(--pico-dark)] p-7 text-white"
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--pico-orange)]">
              End Of The Ride
            </div>
            <div className="mt-4 font-serif text-4xl leading-none">Your board is waiting →</div>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              Sign up, restore the guarded redirect, and open the real board instead of a preview.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={routes.signup}
                className="inline-flex items-center gap-3 rounded-full border border-[var(--pico-orange)] bg-[var(--pico-orange)] px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:-translate-y-0.5 hover:bg-transparent"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  const routes = useProtectedRoutes();

  const items = [
    { icon: Gift, label: "Free trial sticker opens signup" },
    { icon: ShoppingBag, label: "Shop stays auth-gated" },
    { icon: Flame, label: "Redirect target is preserved after signup" },
  ];

  return (
    <section className="border-b border-[var(--pico-border)] bg-[var(--pico-dark)] py-20 text-white">
      <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--pico-orange)]">
          Early Access
        </div>
        <h2 className="mt-4 font-serif text-5xl leading-[0.96] md:text-7xl">
          Start the board.
          <br />
          Keep the streak.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
          The landing page is now wired into the real app flow: public docs stay public, core routes
          stay protected, and every major CTA resolves through the same auth redirect utility.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <PrimaryButton onClick={routes.signup} className="bg-[var(--pico-orange)] hover:bg-transparent">
            Create Account
          </PrimaryButton>
          <SecondaryButton onClick={routes.board} className="border-white text-white hover:bg-white hover:text-[var(--pico-dark)]">
            Open The Board
          </SecondaryButton>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <Icon className="h-4 w-4 text-[var(--pico-orange)]" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const routes = useProtectedRoutes();

  return (
    <footer className="bg-[var(--pico-cream)] py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 md:px-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <PicoMark />
            <div>
              <div className="font-serif text-3xl leading-none text-[var(--pico-dark)]">Pico</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pico-body)] opacity-70">
                Code Training On A Board
              </div>
            </div>
          </div>
          <p className="mt-5 text-base leading-relaxed text-[var(--pico-body)]">
            Public docs stay open. Boards, courses, and the shop stay protected until the player is
            authenticated.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "color-mix(in srgb, var(--pico-body) 65%, transparent)" }}
            >
              Product
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <button type="button" onClick={routes.board} className="text-left font-serif text-xl text-[var(--pico-dark)]">
                Board
              </button>
              <button type="button" onClick={routes.courses} className="text-left font-serif text-xl text-[var(--pico-dark)]">
                Courses
              </button>
              <button type="button" onClick={routes.shop} className="text-left font-serif text-xl text-[var(--pico-dark)]">
                Shop
              </button>
            </div>
          </div>

          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "color-mix(in srgb, var(--pico-body) 65%, transparent)" }}
            >
              Access
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/login" className="font-serif text-xl text-[var(--pico-dark)]">
                Login
              </Link>
              <Link href="/signup" className="font-serif text-xl text-[var(--pico-dark)]">
                Create account
              </Link>
              <Link href="/docs" className="font-serif text-xl text-[var(--pico-dark)]">
                Docs
              </Link>
            </div>
          </div>

          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "color-mix(in srgb, var(--pico-body) 65%, transparent)" }}
            >
              Live Catalog
            </div>
            <div className="mt-4 flex flex-col gap-3 text-[var(--pico-body)]">
              {COURSE_SUMMARIES.slice(0, 4).map((course) => (
                <div key={course.id} className="font-serif text-xl text-[var(--pico-dark)]">
                  {course.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Index() {
  return (
    <main className="min-h-screen bg-[var(--pico-cream)] text-[var(--pico-dark)]">
      <LandingNav />
      <HeroSection />
      <StatsStrip />
      <CoursesSection />
      <HowItWorksSection />
      <BoardRideSection />
      <ClosingSection />
      <Footer />
    </main>
  );
}
