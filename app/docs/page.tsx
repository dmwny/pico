import Link from "next/link";
import { getLandingCourseSummaries } from "@/lib/landing";

const courses = getLandingCourseSummaries();

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[var(--pico-cream)] px-6 py-14 text-[var(--pico-dark)]">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--pico-border)] bg-white/60 p-8 shadow-[8px_8px_0_0_var(--pico-border)] backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--pico-border)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]">
          <span className="h-2 w-2 rounded-full bg-[var(--pico-orange)]" />
          Pico Docs
        </div>
        <h1 className="mt-5 font-serif text-5xl leading-[0.95]">What Pico already ships</h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--pico-body)]">
          Pico currently ships real learning paths across seven languages, lesson arcs, streaks,
          hearts, XP, achievements, a cosmetics shop, and live mini-courses tied to specific
          tools and libraries.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-3xl">Live Course Catalog</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-[1.4rem] border border-[var(--pico-border)] bg-[var(--pico-cream)] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-2xl">{course.title}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--pico-body)]/70">
                      {course.tag}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--pico-orange)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">
                    {course.lessonCount} lessons
                  </span>
                </div>
                <p className="mt-4 text-sm text-[var(--pico-body)]">
                  {course.unitCount} units, {course.miniCourseCount} live mini-course
                  {course.miniCourseCount === 1 ? "" : "s"}, starts with {course.firstUnitTitle}.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Board Flow",
              body: "The main product route is the board at /learn, with five-lesson arcs, hearts, XP, and streak-linked progression.",
            },
            {
              title: "Labs",
              body: "Mini-courses already include Turtle, Roblox Studio, and multiple API/library-focused tracks.",
            },
            {
              title: "Cosmetics",
              body: "Themes, chest skins, trails, node effects, badges, and borders are already backed by the cosmetics system.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.4rem] border border-[var(--pico-border)] bg-white/70 p-5"
            >
              <h3 className="font-serif text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm text-[var(--pico-body)]">{item.body}</p>
            </article>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-[var(--pico-dark)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white"
          >
            Create Account
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--pico-border)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em]"
          >
            Back To Landing
          </Link>
        </div>
      </div>
    </main>
  );
}
