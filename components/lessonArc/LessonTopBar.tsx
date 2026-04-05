"use client";

function HeartIcon({
  filled,
  flash,
}: {
  filled: boolean;
  flash: boolean;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
        filled
          ? "border-rose-400/50 bg-rose-500/18 text-rose-300"
          : "border-white/10 bg-white/5 text-white/25"
      } ${flash ? "animate-[lessonHeartLoss_420ms_ease-in-out]" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-6.7-4.35-9.2-8.37C.91 9.56 2.2 5.5 5.88 4.53A5.16 5.16 0 0 1 12 7.14a5.16 5.16 0 0 1 6.12-2.61c3.68.97 4.97 5.03 3.08 8.1C18.7 16.65 12 21 12 21Z" />
      </svg>
    </span>
  );
}

export default function LessonTopBar({
  accentColor,
  lessonIndex,
  totalLessons,
  currentQuestion,
  totalQuestions,
  hearts,
  unlimitedHearts,
  onClose,
  lossFlashKey,
}: {
  accentColor: string;
  lessonIndex: number;
  totalLessons: number;
  currentQuestion: number;
  totalQuestions: number;
  hearts: number;
  unlimitedHearts: boolean;
  onClose: () => void;
  lossFlashKey: number;
}) {
  const progressPercent = totalQuestions <= 0 ? 0 : Math.min(100, Math.round((currentQuestion / totalQuestions) * 100));

  return (
    <div className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/70 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl">
      <style>{`
        @keyframes lessonHeartLoss {
          0% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.65; }
        }
      `}</style>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:bg-white/10"
          aria-label="Close lesson"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: accentColor,
                  boxShadow: `0 0 18px ${accentColor}`,
                }}
              />
            </div>
            <p className="min-w-[3.3rem] text-right text-xs font-black tracking-[0.18em] text-white/75">
              {Math.min(totalQuestions, currentQuestion)} / {totalQuestions}
            </p>
          </div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-white/58">
            Lesson {lessonIndex} of {totalLessons} · Question {Math.min(totalQuestions, currentQuestion)} / {totalQuestions}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unlimitedHearts ? (
            <div className="flex h-11 min-w-[4.25rem] items-center justify-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 text-white">
              <span className="text-rose-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 21s-6.7-4.35-9.2-8.37C.91 9.56 2.2 5.5 5.88 4.53A5.16 5.16 0 0 1 12 7.14a5.16 5.16 0 0 1 6.12-2.61c3.68.97 4.97 5.03 3.08 8.1C18.7 16.65 12 21 12 21Z" />
                </svg>
              </span>
              <span className="text-lg font-black">∞</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <HeartIcon
                  key={`${index}-${lossFlashKey}`}
                  filled={index < hearts}
                  flash={lossFlashKey > 0 && index === hearts}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
