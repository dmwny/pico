"use client";

type CelestialNodeProps = {
  completed: boolean;
  current: boolean;
  available: boolean;
  className?: string;
  animateBurst?: boolean;
};

type VoidNodeProps = {
  completed: boolean;
  current: boolean;
  available: boolean;
  className?: string;
  emerging?: boolean;
};

type ConnectorProps = {
  active?: boolean;
  animateDraw?: boolean;
  className?: string;
};

export function CelestialUnitBanner({
  unitId,
  title,
  description,
  completedLessons,
  totalLessons,
  onReview,
}: {
  unitId: number;
  title: string;
  description: string;
  completedLessons: number;
  totalLessons: number;
  onReview: () => void;
}) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[1.9rem] border border-sky-200/16 bg-[linear-gradient(135deg,rgba(7,14,33,0.92),rgba(10,18,40,0.9))] px-5 py-4 shadow-[0_24px_60px_rgba(2,6,23,0.36)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(148,163,184,0.06),transparent_55%)]" />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
      <div className="absolute right-5 top-4 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sky-100/70">
        Sector {unitId.toString().padStart(2, "0")}
      </div>
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-sky-100/46">Observatory Route</p>
          <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-white/58">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-100/78">
            {completedLessons}/{totalLessons}
          </div>
          <button
            type="button"
            onClick={onReview}
            className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/84"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}

export function VoidUnitBanner({
  title,
  description,
  onReview,
}: {
  title: string;
  description: string;
  onReview: () => void;
}) {
  return (
    <div className="relative mb-5 px-3 py-2.5">
      <style>{`
        @keyframes voidBannerFlicker {
          0%, 100% { opacity: 0.88; }
          48% { opacity: 0.78; }
          50% { opacity: 0.46; }
          54% { opacity: 0.9; }
        }
      `}</style>
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.34em] text-white/26" style={{ animation: "voidBannerFlicker 5.6s step-end infinite" }}>
            Unstable Zone
          </p>
          <h3 className="mt-2 text-lg font-black text-white" style={{ textShadow: "1px 0 rgba(59,130,246,0.18), -1px 0 rgba(244,63,94,0.16)" }}>
            {title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-white/46">{description}</p>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/74"
        >
          Review
        </button>
      </div>
    </div>
  );
}

export function CelestialNode({
  completed,
  current,
  available,
  className = "",
  animateBurst = false,
}: CelestialNodeProps) {
  return (
    <div className={`relative flex h-14 w-14 items-center justify-center ${className}`}>
      <style>{`
        @keyframes celestialNodePulse {
          0%, 100% { transform: scale(1); opacity: 0.72; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes celestialOrbitRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes celestialSupernova {
          0% { transform: scale(0.65); opacity: 0.74; }
          100% { transform: scale(1.85); opacity: 0; }
        }
      `}</style>
      {completed ? (
        <span
          className="absolute inset-[-5px] rounded-full border border-sky-100/70"
          style={{ animation: `celestialSupernova ${animateBurst ? "1.4s" : "3.2s"} ease-out infinite` }}
        />
      ) : null}
      <span
        className="absolute inset-[-4px] rounded-full border border-sky-100/42"
        style={{ animation: "celestialOrbitRing 8s linear infinite" }}
      />
      <span
        className="absolute inset-[-7px] rounded-full border border-white/10"
        style={{ animation: "celestialOrbitRing 11s linear infinite reverse" }}
      />
      <div
        className="relative h-10 w-10 rounded-full"
        style={{
          background: completed
            ? "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(147,197,253,0.9) 36%, rgba(59,130,246,0.22) 72%, transparent 78%)"
            : current
              ? "radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(196,181,253,0.88) 36%, rgba(99,102,241,0.22) 74%, transparent 78%)"
              : available
                ? "radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(191,219,254,0.7) 36%, rgba(59,130,246,0.16) 74%, transparent 78%)"
                : "radial-gradient(circle, rgba(226,232,240,0.6) 0%, rgba(148,163,184,0.44) 34%, rgba(51,65,85,0.28) 74%, transparent 82%)",
          boxShadow: completed || current ? "0 0 26px rgba(191,219,254,0.88)" : available ? "0 0 16px rgba(191,219,254,0.46)" : "0 0 12px rgba(148,163,184,0.24)",
          animation: !completed ? "celestialNodePulse 3.8s ease-in-out infinite" : undefined,
        }}
      />
    </div>
  );
}

export function VoidNode({
  completed,
  current,
  available,
  className = "",
  emerging = false,
}: VoidNodeProps) {
  return (
    <div className={`relative flex h-14 w-14 items-center justify-center ${className}`}>
      <style>{`
        @keyframes voidNodeEmerge {
          0% { transform: scale(0.2); opacity: 0; filter: blur(10px); }
          55% { transform: scale(1.18); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes voidNodeDissolve {
          0%, 100% { opacity: 0.14; transform: translateY(0); }
          50% { opacity: 0.32; transform: translateY(-6px); }
        }
      `}</style>
      {completed ? (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="absolute rounded-full bg-white"
              style={{
                width: 2 + (index % 2),
                height: 2 + (index % 2),
                left: `${20 + index * 14}%`,
                top: `${18 + index * 12}%`,
                opacity: 0.18,
                animation: `voidNodeDissolve ${2.6 + index * 0.35}s ease-in-out ${index * 0.2}s infinite`,
              }}
            />
          ))}
        </>
      ) : null}
      <div
        className="relative h-10 w-10 rounded-full"
        style={{
          background: completed || current || available
            ? "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(91,33,182,0.9) 28%, rgba(26,10,46,0.88) 56%, rgba(0,0,0,0.14) 78%, transparent 82%)"
            : "radial-gradient(circle, rgba(203,213,225,0.52) 0%, rgba(148,163,184,0.34) 28%, rgba(15,23,42,0.46) 62%, transparent 82%)",
          boxShadow: completed || current || available ? "0 0 18px rgba(255,255,255,0.2)" : "0 0 10px rgba(148,163,184,0.18)",
          animation: emerging ? "voidNodeEmerge 600ms cubic-bezier(0.22,1,0.36,1) forwards" : undefined,
        }}
      />
    </div>
  );
}

export function CelestialConnector({ active = true, animateDraw = false, className = "" }: ConnectorProps) {
  return (
    <div className={`relative flex h-6 w-[6px] items-center justify-center ${className}`}>
      <style>{`
        @keyframes celestialConnectorDraw {
          0% { transform: scaleY(0); opacity: 0; }
          26% { transform: scaleY(0.78); opacity: 1; }
          68% { transform: scaleY(0.9); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes celestialConnectorLight {
          0% { transform: translateY(-12%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(118%); opacity: 0; }
        }
      `}</style>
      <span
        className="absolute inset-0 origin-top rounded-full bg-[linear-gradient(180deg,#dbeafe_0%,#c4b5fd_56%,#22d3ee_100%)]"
        style={{
          background: active ? "linear-gradient(180deg,#dbeafe 0%,#c4b5fd 56%,#22d3ee 100%)" : "linear-gradient(180deg,#cbd5e1 0%,#94a3b8 100%)",
          boxShadow: active ? "0 0 18px rgba(191,219,254,0.62)" : "0 0 0 1px rgba(148,163,184,0.2), 0 6px 14px rgba(15,23,42,0.12)",
          animation: animateDraw ? "celestialConnectorDraw 760ms cubic-bezier(0.7,0.04,0.25,1) forwards" : undefined,
        }}
      />
      <span className="absolute top-[16%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]" style={{ opacity: active ? 1 : 0.52 }} />
      <span className="absolute bottom-[18%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]" style={{ opacity: active ? 1 : 0.52 }} />
      <span
        className="absolute h-3 w-[5px] rounded-full bg-white"
        style={{ animation: active ? "celestialConnectorLight 2.2s linear infinite" : undefined, opacity: active ? 1 : 0 }}
      />
    </div>
  );
}

export function VoidConnector({ active = true, className = "" }: ConnectorProps) {
  return (
    <div className={`relative flex h-6 w-[6px] items-center justify-center ${className}`}>
      <style>{`
        @keyframes voidConnectorTravel {
          0% { transform: translateY(-12%); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: translateY(118%); opacity: 0; }
        }
      `}</style>
      <span className="absolute inset-0 rounded-full" style={{ background: active ? "#ffffff" : "#CBD5E1", opacity: active ? 1 : 0.9, boxShadow: active ? "none" : "0 0 0 1px rgba(148,163,184,0.18), 0 6px 14px rgba(15,23,42,0.12)" }} />
      <span className="absolute inset-0 translate-x-[1px] rounded-full bg-fuchsia-500/20 blur-[1px]" style={{ opacity: active ? 1 : 0.3 }} />
      <span className="absolute inset-0 -translate-x-[1px] rounded-full bg-sky-400/18 blur-[1px]" style={{ opacity: active ? 1 : 0.3 }} />
      <span className="absolute top-0 h-3 w-[5px] rounded-full bg-white/92" style={{ animation: active ? "voidConnectorTravel 1.9s linear infinite" : undefined, opacity: active ? 1 : 0 }} />
    </div>
  );
}
