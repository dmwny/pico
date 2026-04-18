"use client";

/**
 * Lesson end screens — cream/ink editorial.
 * No emojis. No confetti characters. Geometric motion only.
 */

function StatRing({ ratio, label }: { ratio: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const r = 44;
  const dash = 2 * Math.PI * r;
  const offset = dash * (1 - clamped);
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-24 w-24 place-items-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="#1a181522" strokeWidth="6" fill="none" />
          <circle
            cx="50"
            cy="50"
            r={r}
            stroke="#e8761c"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <span className="absolute font-serif text-2xl text-[#1a1815] tabular-nums">{Math.round(clamped * 100)}%</span>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1a1815]/55">{label}</span>
    </div>
  );
}

function ArcSegmentStrip({ completedCount }: { completedCount: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`${completedCount} of 5 lessons complete`}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${i < completedCount ? "bg-[#e8761c]" : "bg-[#1a1815]/12"}`}
        />
      ))}
    </div>
  );
}

function Shell({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf5ec] px-6 py-12">
      <div className="mx-auto flex max-w-[680px] flex-col gap-8 rounded-2xl border-2 border-[#1a1815] bg-[#faf5ec] p-10 shadow-[8px_8px_0_0_#1a1815]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#e8761c]">{kicker}</div>
        {children}
      </div>
    </div>
  );
}

export function LessonCompleteScreen({
  lessonLabel,
  lessonNumber,
  completedLessonCount,
  xpEarned,
  correctCount,
  totalQuestions,
  perfect,
  streakExtended,
  reviewMode,
  onContinue,
}: {
  lessonLabel: string;
  lessonNumber: number;
  completedLessonCount: number;
  xpEarned: number;
  correctCount: number;
  totalQuestions: number;
  perfect: boolean;
  streakExtended: boolean;
  reviewMode: boolean;
  onContinue: () => void;
}) {
  const remaining = Math.max(0, 5 - completedLessonCount);
  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

  return (
    <Shell kicker={reviewMode ? "Review · complete" : `Lesson ${lessonNumber} of 5`}>
      <h1 className="font-serif text-5xl leading-[0.95] text-[#1a1815]">{lessonLabel}</h1>
      <p className="-mt-4 max-w-md font-serif text-lg text-[#1a1815]/70">
        {reviewMode
          ? "Review locked in. Reduced XP, full credit toward retention."
          : perfect
            ? "A clean run. Every answer landed."
            : "Solid work. The next lesson in the arc is unlocked."}
      </p>

      {!reviewMode ? (
        <div className="space-y-2">
          <ArcSegmentStrip completedCount={completedLessonCount} />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1a1815]/55">
            {remaining > 0 ? `${remaining} lesson${remaining === 1 ? "" : "s"} until the chest unlocks` : "Chest is ready"}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 border-t-2 border-[#1a1815]/10 pt-6 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#1a1815]/55">XP earned</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-serif text-5xl text-[#1a1815] tabular-nums">+{xpEarned}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {perfect ? (
              <span className="rounded-full border border-[#1a1815] bg-[#1a1815] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#faf5ec]">
                Perfect +25
              </span>
            ) : null}
            {streakExtended ? (
              <span className="rounded-full border border-[#e8761c] bg-[#e8761c]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c95f10]">
                Streak extended
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <StatRing ratio={accuracy} label="accuracy" />
          <p className="font-mono text-[11px] text-[#1a1815]/60">
            {correctCount} of {totalQuestions} correct
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="inline-flex h-13 items-center justify-center gap-2 self-stretch rounded-full bg-[#1a1815] px-8 py-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[#faf5ec] transition-colors hover:bg-[#e8761c]"
      >
        Continue
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </Shell>
  );
}

export function ArcCompleteScreen({
  nodeTitle,
  totalArcXp,
  streakExtended,
  arcBonusXp,
  onContinue,
}: {
  nodeTitle: string;
  totalArcXp: number;
  streakExtended: boolean;
  arcBonusXp: number;
  onContinue: () => void;
}) {
  return (
    <Shell kicker="Arc · complete">
      <style>{`@keyframes arcRise{0%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1}}`}</style>

      <div style={{ animation: "arcRise 700ms cubic-bezier(0.16,1,0.3,1)" }}>
        <h1 className="font-serif text-5xl leading-[0.95] text-[#1a1815]">Arc complete</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#e8761c]">{nodeTitle}</p>
      </div>

      <p className="font-serif text-lg text-[#1a1815]/70">
        Five lessons down. The node is sealed, the chest is unlocked, the path moves on.
      </p>

      {/* geometric "chest" — pure SVG, no emoji */}
      <div className="grid place-items-center py-2">
        <svg viewBox="0 0 200 140" className="h-32 w-44" style={{ animation: "arcRise 900ms 200ms both cubic-bezier(0.16,1,0.3,1)" }}>
          <rect x="20" y="50" width="160" height="80" rx="6" fill="#f1e9d4" stroke="#1a1815" strokeWidth="3" />
          <path d="M20 70 Q100 10 180 70" fill="#e8761c" stroke="#1a1815" strokeWidth="3" />
          <rect x="88" y="78" width="24" height="28" rx="3" fill="#1a1815" />
          <circle cx="100" cy="90" r="3" fill="#e8761c" />
        </svg>
      </div>

      <div className="grid gap-4 border-t-2 border-[#1a1815]/10 pt-6 sm:grid-cols-3">
        <Stat label="Arc XP" value={`+${totalArcXp}`} />
        <Stat label="Arc bonus" value={`+${arcBonusXp}`} />
        <Stat label={streakExtended ? "Streak" : "Reward"} value={streakExtended ? "Extended" : "Chest"} />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="inline-flex h-13 items-center justify-center gap-2 self-stretch rounded-full bg-[#e8761c] px-8 py-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[#faf5ec] transition-colors hover:bg-[#c95f10]"
      >
        Claim and continue
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#1a1815]/55">{label}</div>
      <div className="mt-1 font-serif text-2xl text-[#1a1815]">{value}</div>
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
    <Shell kicker="Out of hearts">
      <h1 className="font-serif text-5xl leading-[0.95] text-[#1a1815]">Take a breath.</h1>
      <p className="font-serif text-lg text-[#1a1815]/70">
        You were on question {currentQuestion} of {totalQuestions}. Restart fresh, or spend a refill to keep going.
      </p>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#1a1815] px-6 font-mono text-[12px] uppercase tracking-[0.22em] text-[#faf5ec] transition-colors hover:bg-[#e8761c]"
        >
          Practice again
        </button>
        <button
          type="button"
          onClick={onUseHeartRefill}
          disabled={!hasHeartRefill}
          className="inline-flex h-12 items-center justify-center rounded-full border-2 border-[#1a1815] bg-[#faf5ec] px-6 font-mono text-[12px] uppercase tracking-[0.22em] text-[#1a1815] transition-colors hover:bg-[#f1e9d4] disabled:cursor-not-allowed disabled:border-[#1a1815]/20 disabled:text-[#1a1815]/30"
        >
          Use a heart refill
        </button>
        {!hasHeartRefill ? (
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[#1a1815]/45">
            Hearts refill tomorrow
          </p>
        ) : null}
      </div>
    </Shell>
  );
}
