"use client";

function StatRing({ ratio, label }: { ratio: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const dash = 282.74;
  const offset = dash * (1 - clamped);
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#lesson-ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="lesson-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#58CC02" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{Math.round(clamped * 100)}%</span>
        <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/55">{label}</span>
      </div>
    </div>
  );
}

export function LessonCompleteScreen({
  lessonLabel,
  xpEarned,
  correctCount,
  totalQuestions,
  perfect,
  streakExtended,
  onContinue,
}: {
  lessonLabel: string;
  xpEarned: number;
  correctCount: number;
  totalQuestions: number;
  perfect: boolean;
  streakExtended: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/96 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/18 text-emerald-300 shadow-[0_0_60px_rgba(88,204,2,0.22)]">
          <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.28em] text-white/45">{lessonLabel}</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">Lesson complete!</h1>
        <p className="mt-3 max-w-xl text-lg text-white/70">
          {perfect ? "Perfect run. Clean execution all the way through." : "Progress locked in. The next lesson in the arc is ready."}
        </p>

        <div className="mt-10 grid w-full gap-5 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 text-left">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-white/45">XP earned</p>
            <p className="mt-3 text-6xl font-black text-[#58CC02]">+{xpEarned}</p>
            {perfect ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-amber-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2l2.95 5.98L21.55 9l-4.78 4.66 1.13 6.6L12 17.2l-5.9 3.06 1.13-6.6L2.45 9l6.6-.99L12 2Z" />
                </svg>
                Perfect +25
              </div>
            ) : null}
            {streakExtended ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-orange-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2s4 2.64 4 7.1c0 2.1-.91 3.88-2.34 5.1 0-2.12-.88-3.3-1.66-4.24-.82 1.18-2 2.62-2 5.04A4 4 0 0 0 18 15c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-5.34 3.64-8.65 6-13Z" />
                </svg>
                Streak extended
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 p-6">
            <StatRing ratio={totalQuestions > 0 ? correctCount / totalQuestions : 0} label="accuracy" />
            <p className="mt-4 text-sm font-semibold text-white/70">
              You got {correctCount}/{totalQuestions} correct
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 flex h-14 w-full max-w-xl items-center justify-center rounded-[1.4rem] bg-[#58CC02] text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(88,204,2,0.28)] transition active:scale-[0.985]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export function ArcCompleteScreen({
  nodeTitle,
  totalArcXp,
  streakExtended,
  onContinue,
}: {
  nodeTitle: string;
  totalArcXp: number;
  streakExtended: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/96 px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 70 }).map((_, index) => (
          <span
            key={index}
            className="absolute top-[-10%] h-3 w-3 rounded-full bg-emerald-300/70"
            style={{
              left: `${(index * 13) % 100}%`,
              animation: `lessonArcConfetti ${1.3 + (index % 6) * 0.18}s linear ${index * 40}ms forwards`,
            }}
          />
        ))}
        <style>{`
          @keyframes lessonArcConfetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500/18 text-emerald-300 shadow-[0_0_90px_rgba(88,204,2,0.28)]">
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.28em] text-white/40">Arc complete</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">{nodeTitle}</h1>
        <p className="mt-3 max-w-xl text-lg text-white/72">Five lessons down. The node is complete, the chest is unlocked, and the path can advance.</p>

        <div className="mt-10 w-full rounded-[2rem] border border-white/10 bg-white/6 p-7">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center">
            <div>
              <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-white/45">Arc XP</p>
              <p className="mt-2 text-5xl font-black text-[#58CC02]">+{totalArcXp}</p>
            </div>
            {streakExtended ? (
              <div className="rounded-[1.2rem] border border-orange-300/20 bg-orange-400/10 px-5 py-4">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-orange-100/80">Streak</p>
                <p className="mt-2 text-xl font-black text-orange-100">Extended!</p>
              </div>
            ) : null}
            <div className="rounded-[1.2rem] border border-amber-300/20 bg-amber-400/10 px-5 py-4">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-amber-100/80">Reward</p>
              <p className="mt-2 text-xl font-black text-amber-100">Chest unlocked</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 flex h-14 w-full max-w-xl items-center justify-center rounded-[1.4rem] bg-[#58CC02] text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(88,204,2,0.28)] transition active:scale-[0.985]"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

export function LessonFailedScreen({
  currentQuestion,
  totalQuestions,
  hasHeartRefill,
  onRetry,
  onUseHeartRefill,
}: {
  currentQuestion: number;
  totalQuestions: number;
  hasHeartRefill: boolean;
  onRetry: () => void;
  onUseHeartRefill: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/96 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/6 text-white/70">
          <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-6.7-4.35-9.2-8.37C.91 9.56 2.2 5.5 5.88 4.53A5.16 5.16 0 0 1 12 7.14a5.16 5.16 0 0 1 6.12-2.61c3.68.97 4.97 5.03 3.08 8.1C18.7 16.65 12 21 12 21Z" />
            <path d="M8 15c1-1 2-1.4 4-1.4s3 .4 4 1.4" />
          </svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight">You ran out of hearts</h1>
        <p className="mt-3 max-w-xl text-lg text-white/70">Don&apos;t give up. You were on question {currentQuestion}/{totalQuestions}.</p>

        <div className="mt-10 w-full space-y-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex h-14 w-full items-center justify-center rounded-[1.4rem] bg-[#58CC02] text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(88,204,2,0.28)] transition active:scale-[0.985]"
          >
            Practice again
          </button>
          <button
            type="button"
            onClick={onUseHeartRefill}
            disabled={!hasHeartRefill}
            className={`flex h-14 w-full items-center justify-center rounded-[1.4rem] border text-base font-black uppercase tracking-[0.18em] transition active:scale-[0.985] ${
              hasHeartRefill
                ? "border-white/14 bg-white/8 text-white"
                : "cursor-not-allowed border-white/8 bg-white/5 text-white/35"
            }`}
          >
            Use a heart refill
          </button>
          {!hasHeartRefill ? (
            <p className="text-sm font-semibold text-white/48">Hearts refill tomorrow.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
