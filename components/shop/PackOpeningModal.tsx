"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import PackObject from "@/components/shop/PackObject";
import ThemeMiniCard from "@/components/shop/ThemeMiniCard";
import MythicThemeLayer from "@/components/theme/MythicThemeLayer";
import AmbientEffectsLayer from "@/components/theme/AmbientEffectsLayer";
import type { SuccessfulThemePackOpenResult } from "@/lib/cosmetics";
import { getPathTheme } from "@/lib/themes";
import { useMotionAllowed } from "@/lib/motion";

type PackOpeningModalProps = {
  opening: SuccessfulThemePackOpenResult | null;
  onClose: () => void;
  onEquipNow: (themeId: SuccessfulThemePackOpenResult["roll"]["themeId"]) => void;
};

type OpeningPhase =
  | "intro"
  | "tearing"
  | "card-rise"
  | "await-reveal"
  | "flip"
  | "mythic-build"
  | "mythic-blackout"
  | "mythic-event"
  | "revealed";

const RARITY_TITLE: Record<ReturnType<typeof getPathTheme>["tier"], string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getRarityTextStyle(tier: ReturnType<typeof getPathTheme>["tier"]): CSSProperties {
  if (tier === "mythic") {
    return {
      background: "linear-gradient(90deg,#f9a8d4 0%,#e9d5ff 22%,#93c5fd 48%,#fde68a 72%,#f9a8d4 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      textShadow: "0 0 30px rgba(255,255,255,0.18)",
    };
  }
  if (tier === "legendary") return { color: "#FCD34D", textShadow: "0 0 24px rgba(252,211,77,0.24)" };
  if (tier === "epic") return { color: "#D8B4FE", textShadow: "0 0 20px rgba(192,132,252,0.22)" };
  if (tier === "rare") return { color: "#93C5FD", textShadow: "0 0 18px rgba(96,165,250,0.22)" };
  return { color: "#E2E8F0" };
}

function getPackBackdrop(packId: SuccessfulThemePackOpenResult["pack"]["id"]) {
  if (packId === "basic_pack") return "linear-gradient(180deg,#0f172a 0%,#111827 52%,#0f172a 100%)";
  if (packId === "premium_pack") return "radial-gradient(circle at 50% 18%, rgba(99,102,241,0.34), transparent 26%), linear-gradient(180deg,#0b1120 0%,#131837 54%,#090d1a 100%)";
  if (packId === "legendary_pack") return "radial-gradient(circle at 50% 12%, rgba(251,191,36,0.22), transparent 24%), linear-gradient(180deg,#140f08 0%,#1f1720 36%,#0a0b15 100%)";
  return "radial-gradient(circle at 50% 18%, rgba(236,72,153,0.16), transparent 22%), linear-gradient(180deg,#010104 0%,#04050b 46%,#000000 100%)";
}

function buildLetterDelay(text: string, index: number) {
  const character = text[index];
  if (character === " ") return `${index * 55}ms`;
  return `${index * 55}ms`;
}

export default function PackOpeningModal({ opening, onClose, onEquipNow }: PackOpeningModalProps) {
  const motionAllowed = useMotionAllowed();
  const [phase, setPhase] = useState<OpeningPhase>("intro");
  const [interactive, setInteractive] = useState(false);
  const [cardShown, setCardShown] = useState(false);
  const [cardFaceUp, setCardFaceUp] = useState(false);
  const [showEquip, setShowEquip] = useState(false);
  const [showThemeAtmosphere, setShowThemeAtmosphere] = useState(false);
  const [showPackShell, setShowPackShell] = useState(true);
  const [mythicFlash, setMythicFlash] = useState(false);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  const theme = useMemo(
    () => (opening ? opening.roll.theme ?? getPathTheme(opening.pack.heroThemeId) : null),
    [opening],
  );

  useEffect(() => {
    if (!opening) return undefined;
    const resetId = window.setTimeout(() => {
      setPhase("intro");
      setInteractive(false);
      setCardShown(false);
      setCardFaceUp(false);
      setShowEquip(false);
      setShowThemeAtmosphere(false);
      setShowPackShell(true);
      setMythicFlash(false);
    }, 0);
    const timeoutId = window.setTimeout(() => setInteractive(true), 1500);
    return () => {
      window.clearTimeout(resetId);
      window.clearTimeout(timeoutId);
    };
  }, [opening]);

  if (!opening || !theme) return null;

  const isMythicPack = opening.pack.id === "mythic_pack";
  const isPremiumPack = opening.pack.id === "premium_pack";
  const isLegendaryPack = opening.pack.id === "legendary_pack";
  const isBasicPack = opening.pack.id === "basic_pack";
  const isVoid = theme.id === "the_void";
  const isCelestial = theme.id === "celestial";
  const duplicate = !opening.roll.theme;
  const canOpenPack = interactive && phase === "intro";
  const canRevealCard = interactive && phase === "await-reveal";
  const canAdvanceResult = interactive && phase === "revealed";

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(canOpenPack || canRevealCard || canAdvanceResult)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void handlePrimaryAction();
    }
  };

  const handleRevealFlip = async () => {
    setInteractive(false);
    setPhase("flip");
    if (isMythicPack) {
      await wait(800);
      setCardFaceUp(true);
      setMythicFlash(true);
      await wait(150);
      setMythicFlash(false);
      setPhase("mythic-event");
      setShowThemeAtmosphere(true);
      await wait(3000);
      setPhase("revealed");
      await wait(220);
      setShowEquip(true);
      setInteractive(true);
      return;
    }

    await wait(isLegendaryPack ? 620 : isPremiumPack ? 420 : 250);
    setCardFaceUp(true);
    setShowThemeAtmosphere(true);
    setPhase("revealed");
    await wait(isLegendaryPack ? 1000 : 240);
    setShowEquip(true);
    setInteractive(true);
  };

  const handlePrimaryAction = async () => {
    if (!interactive) return;

    if (phase === "revealed") {
      onClose();
      return;
    }

    if (phase === "await-reveal") {
      await handleRevealFlip();
      return;
    }

    if (phase !== "intro") return;

    setInteractive(false);
    setPhase(isMythicPack ? "mythic-build" : "tearing");

    if (isMythicPack) {
      await wait(600);
      setShowPackShell(false);
      await wait(200);
      setPhase("mythic-blackout");
      await wait(200);
      setCardShown(true);
      setCardFaceUp(true);
      setPhase("mythic-event");
      setShowThemeAtmosphere(true);
      await wait(3000);
      setPhase("revealed");
      await wait(260);
      setShowEquip(true);
      setInteractive(true);
      return;
    }

    await wait(isLegendaryPack ? 800 : 800);
    setShowPackShell(false);
    setCardShown(true);
    setPhase("card-rise");
    await wait(isLegendaryPack ? 800 : isPremiumPack ? 760 : 600);

    if (isBasicPack) {
      await handleRevealFlip();
      return;
    }

    setPhase("await-reveal");
    await wait(1000);
    setInteractive(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMythicPack) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-black"
      onPointerMove={handlePointerMove}
    >
      <style>{`
        @keyframes packOpeningPrompt {
          0%, 100% { transform: translateY(0); opacity: 0.44; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        @keyframes packOpeningTearDust {
          0% { transform: translate3d(0,0,0) scale(0.4); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translate3d(var(--pack-dust-x), var(--pack-dust-y), 0) scale(1); opacity: 0; }
        }
        @keyframes packHalfLeft {
          0% { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(-110px, 220px, 0) rotate(-18deg); opacity: 0; }
        }
        @keyframes packHalfRight {
          0% { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(110px, 240px, 0) rotate(18deg); opacity: 0; }
        }
        @keyframes packCardRise {
          0% { transform: translateY(42px) scale(0.82); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes packCardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes packCardFlip {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes packLegendaryDust {
          0% { transform: translate3d(0,-14px,0); opacity: 0; }
          22% { opacity: 0.9; }
          100% { transform: translate3d(0,18px,0); opacity: 0; }
        }
        @keyframes packMythicImplode {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          100% { transform: scale(0.08); opacity: 0; filter: blur(10px); }
        }
        @keyframes packMythicCrack {
          0% { transform: scaleX(0.6); opacity: 0; }
          25% { opacity: 0.9; }
          100% { transform: scaleX(1.08); opacity: 0; }
        }
        @keyframes packMythicPoint {
          0% { transform: scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes packTitleCrash {
          0% { transform: translateY(18px) scale(0.82); opacity: 0; filter: blur(12px); }
          66% { transform: translateY(-4px) scale(1.06); opacity: 1; filter: blur(0px); }
          100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes packVoidLetter {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes packCelestialLine {
          0% { transform: scaleX(0.2); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes packEquipOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="absolute inset-0" style={{ background: getPackBackdrop(opening.pack.id) }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_48%)]" />

      {showThemeAtmosphere ? (
        theme.id === "celestial" || theme.id === "the_void" ? (
          <MythicThemeLayer
            themeId={theme.id}
            className={phase === "mythic-event" ? "opacity-100" : "opacity-70"}
          />
        ) : (
          <AmbientEffectsLayer effects={theme.ambientEffects} enabled preview={false} className="opacity-40" />
        )
      ) : null}

      {mythicFlash ? <div className="absolute inset-0 bg-white" style={{ opacity: 0.95 }} /> : null}

      {phase === "mythic-blackout" ? <div className="absolute inset-0 bg-black" /> : null}
      {phase === "mythic-build" ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/50" />
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-px"
              style={{
                left: `${12 + index * 9}%`,
                top: `${16 + (index % 5) * 14}%`,
                width: `${16 + (index % 3) * 6}%`,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                boxShadow: "0 0 12px rgba(255,255,255,0.3)",
                transform: `rotate(${-18 + index * 7}deg)`,
                animation: `packMythicCrack ${1 + (index % 3) * 0.18}s ease-out ${index * 0.08}s forwards`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        {phase === "intro" ? (
          <div className="pointer-events-none absolute top-16 text-center">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.36em] text-white/42">Pack Opening</p>
            <h2 className="mt-4 text-4xl font-black text-white">{opening.pack.name}</h2>
          </div>
        ) : null}

        <div className="relative flex w-full max-w-4xl flex-1 items-center justify-center">
          {showPackShell ? (
            <div
              className={`relative flex h-full max-h-[32rem] w-full items-center justify-center ${
                canOpenPack ? "cursor-pointer touch-manipulation" : ""
              }`}
              onClick={canOpenPack ? () => void handlePrimaryAction() : undefined}
              onKeyDown={handleStageKeyDown}
              role={canOpenPack ? "button" : undefined}
              tabIndex={canOpenPack ? 0 : undefined}
              aria-label={canOpenPack ? "Open pack" : undefined}
              style={{
                animation: phase === "mythic-build" ? (motionAllowed ? "packMythicImplode 620ms cubic-bezier(0.6,0,0.3,1) forwards" : "none") : "none",
              }}
            >
              {phase === "tearing" && !isLegendaryPack ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <span
                      key={index}
                      className="absolute h-2 w-2 rounded-full bg-white/90"
                      style={{
                        "--pack-dust-x": `${Math.cos((index / 14) * Math.PI * 2) * (56 + (index % 3) * 20)}px`,
                        "--pack-dust-y": `${Math.sin((index / 14) * Math.PI * 2) * (44 + (index % 2) * 28)}px`,
                        animation: "packOpeningTearDust 620ms ease-out forwards",
                      } as CSSProperties}
                    />
                  ))}
                </div>
              ) : null}

              {phase === "tearing" ? (
                <div className="relative flex items-center justify-center">
                  <div className="absolute" style={{ clipPath: "inset(0 50% 0 0)", animation: phase === "tearing" ? "packHalfLeft 780ms ease-in forwards" : undefined }}>
                    <PackObject packId={opening.pack.id} presentation="opening" interactive={false} className="max-w-[17rem]" />
                  </div>
                  <div className="absolute" style={{ clipPath: "inset(0 0 0 50%)", animation: phase === "tearing" ? "packHalfRight 780ms ease-in forwards" : undefined }}>
                    <PackObject packId={opening.pack.id} presentation="opening" interactive={false} className="max-w-[17rem]" />
                  </div>
                  {isLegendaryPack ? (
                    <div className="pointer-events-none absolute inset-0">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <span
                          key={index}
                          className="absolute h-2 w-2 rounded-full bg-amber-200"
                          style={{
                            left: `${24 + index * 5}%`,
                            top: `${18 + (index % 4) * 8}%`,
                            boxShadow: "0 0 14px rgba(252,211,77,0.75)",
                            animation: "packLegendaryDust 2.8s linear infinite",
                            animationDelay: `${index * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <PackObject packId={opening.pack.id} presentation="opening" interactive={isPremiumPack || isMythicPack} className="max-w-[17rem]" />
              )}
            </div>
          ) : null}

          {cardShown ? (
            <div
              className={`relative flex flex-col items-center ${
                canRevealCard || canAdvanceResult ? "cursor-pointer touch-manipulation" : ""
              }`}
              onClick={canRevealCard || canAdvanceResult ? () => void handlePrimaryAction() : undefined}
              onKeyDown={handleStageKeyDown}
              role={canRevealCard || canAdvanceResult ? "button" : undefined}
              tabIndex={canRevealCard || canAdvanceResult ? 0 : undefined}
              aria-label={
                canRevealCard
                  ? "Reveal card"
                  : canAdvanceResult
                    ? "Close pack opening"
                    : undefined
              }
              style={{
                animation:
                  phase === "card-rise" || phase === "await-reveal" || phase === "mythic-event" || phase === "revealed"
                    ? `${phase === "card-rise" ? "packCardRise 600ms cubic-bezier(0.22,0.9,0.26,1) forwards, " : ""}${motionAllowed ? "packCardFloat 4.8s ease-in-out infinite" : ""}`
                    : "none",
              }}
            >
              {!cardFaceUp ? (
                <div className="relative h-[24rem] w-[16rem] rounded-[1.9rem] border border-white/20 bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] shadow-[0_36px_90px_rgba(2,6,23,0.48)]">
                  <div
                    className="absolute inset-[10px] rounded-[1.45rem] border border-white/14"
                    style={{
                      background:
                        theme.tier === "mythic"
                          ? `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.24), transparent 36%), linear-gradient(135deg,#120619 0%,#1e1b4b 44%,#030712 100%)`
                          : theme.tier === "legendary"
                            ? "linear-gradient(135deg,#3f1c08 0%,#7c2d12 38%,#f59e0b 100%)"
                            : theme.tier === "epic"
                              ? "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 58%,#0f172a 100%)"
                              : theme.tier === "rare"
                                ? "linear-gradient(135deg,#082f49 0%,#1d4ed8 58%,#0f172a 100%)"
                                : "linear-gradient(135deg,#cbd5e1 0%,#94a3b8 52%,#475569 100%)",
                    }}
                  >
                    <div className="absolute inset-x-6 top-8 h-px bg-white/18" />
                    <div className="absolute inset-x-6 bottom-8 h-px bg-white/14" />
                    <div
                      className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18"
                      style={{
                        boxShadow: `0 0 28px ${theme.tier === "mythic" ? "rgba(236,72,153,0.28)" : theme.tier === "legendary" ? "rgba(245,158,11,0.3)" : theme.tier === "epic" ? "rgba(168,85,247,0.26)" : theme.tier === "rare" ? "rgba(59,130,246,0.26)" : "rgba(255,255,255,0.18)"}`,
                      }}
                    />
                    <p className="absolute inset-x-0 top-[46%] -translate-y-1/2 text-center text-[0.72rem] font-black uppercase tracking-[0.34em] text-white/56">
                      Pico
                    </p>
                    <p className="absolute inset-x-0 bottom-10 text-center text-sm font-black uppercase tracking-[0.3em] text-white/68">
                      {RARITY_TITLE[theme.tier]}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="relative"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {isMythicPack ? (
                    <div
                      className="absolute inset-0 rounded-[1.8rem] border border-white/18"
                      style={{
                        background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.28), transparent 34%)`,
                        mixBlendMode: "screen",
                        filter: "blur(2px)",
                      }}
                    />
                  ) : null}
                  <ThemeMiniCard themeId={theme.id} size="reveal" className="relative z-10" />
                </div>
              )}

              {phase === "await-reveal" ? (
                <p className="mt-6 text-[0.72rem] font-black uppercase tracking-[0.34em] text-white/70" style={{ animation: "packOpeningPrompt 1.8s ease-in-out infinite" }}>
                  Tap To Reveal
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {phase === "intro" ? (
          <p
            className="mt-6 text-[0.72rem] font-black uppercase tracking-[0.38em] text-white/64"
            style={{ animation: "packOpeningPrompt 1.8s ease-in-out infinite" }}
          >
            Tap To Open
          </p>
        ) : null}

        {(phase === "mythic-event" || phase === "revealed") && cardFaceUp ? (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-20 px-6">
            <div className="mx-auto max-w-4xl">
              {isVoid ? (
                <div className="flex justify-center gap-1 text-4xl font-black tracking-[0.16em] text-white sm:text-5xl">
                  {theme.name.split("").map((letter, index) => (
                    <span
                      key={`${letter}-${index}`}
                      style={{
                        animation: "packVoidLetter 320ms ease-out forwards",
                        animationDelay: buildLetterDelay(theme.name, index),
                        opacity: 0,
                      }}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    {isCelestial ? (
                      <span
                        className="h-px w-16 origin-left bg-white/70"
                        style={{ animation: "packCelestialLine 420ms cubic-bezier(0.22,1,0.36,1) forwards" }}
                      />
                    ) : null}
                    <h2
                      className="text-4xl font-black tracking-[0.14em] text-white sm:text-5xl"
                      style={{
                        ...getRarityTextStyle(theme.tier),
                        animation: "packTitleCrash 520ms cubic-bezier(0.22,1,0.36,1) forwards",
                      }}
                    >
                      {theme.name}
                    </h2>
                    {isCelestial ? (
                      <span
                        className="h-px w-16 origin-right bg-white/70"
                        style={{ animation: "packCelestialLine 420ms cubic-bezier(0.22,1,0.36,1) forwards" }}
                      />
                    ) : null}
                  </div>
                </div>
              )}
              <p className="mt-4 text-center text-[0.72rem] font-black uppercase tracking-[0.34em]" style={getRarityTextStyle(theme.tier)}>
                {duplicate ? "Already In Collection" : RARITY_TITLE[theme.tier]}
              </p>
            </div>
          </div>
        ) : null}

        {showEquip ? (
          <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-3">
            {!duplicate ? (
              <button
                type="button"
                onClick={() => onEquipNow(opening.roll.themeId)}
                className="relative overflow-hidden rounded-full bg-white px-7 py-3 text-sm font-black uppercase tracking-[0.26em] text-slate-950 shadow-[0_24px_60px_rgba(255,255,255,0.12)]"
              >
                {isCelestial ? (
                  <span
                    className="pointer-events-none absolute inset-[-6px] rounded-full border border-white/28"
                    style={{ animation: "packEquipOrbit 6s linear infinite" }}
                  />
                ) : null}
                <span className="relative z-10">Equip Now</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/16 bg-white/6 px-6 py-3 text-sm font-black uppercase tracking-[0.24em] text-white/72"
            >
              {duplicate ? "Continue" : "Keep Browsing"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
