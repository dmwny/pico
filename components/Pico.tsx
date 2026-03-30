"use client";

import { useEffect, useState } from "react";

interface PicoProps {
  size?: number;        // width in px, height scales proportionally
  mood?: "happy" | "sad" | "dead" | "celebrate";
  className?: string;
}

export default function Pico({ size = 120, mood = "happy", className = "" }: PicoProps) {
  const [blinking, setBlinking] = useState(false);

  // Random blink every 2–5 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 3000;
      return setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          timer = scheduleNext();
        }, 160);
      }, delay);
    };
    let timer = scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  const isSad      = mood === "sad";
  const isDead     = mood === "dead";
  const isCelebrate = mood === "celebrate";

  // Eye shape: normal = circle, dead = X lines, sad = half-closed
  const eyeSize    = isDead ? 0 : blinking ? 1 : 12;
  const pupilSize  = blinking ? 0 : 6;
  const eyeOffsetY = isSad ? 4 : 0;

  // Beak: open wider when celebrating
  const beakOpen   = isCelebrate ? 14 : 8;

  // Body color shifts for mood
  const bodyFill   = isDead ? "#9ca3af" : "#22c55e";
  const bellyFill  = isDead ? "#d1d5db" : "#86efac";
  const wingFill   = isDead ? "#6b7280" : "#16a34a";
  const wingDark   = isDead ? "#4b5563" : "#15803d";

  const animClass  = isDead
    ? "pico-dead"
    : isCelebrate
    ? "pico-celebrate"
    : "pico-bob";

  return (
    <>
      <style>{`
        @keyframes pico-bob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%       { transform: translateY(-6px) rotate(-1.5deg); }
          75%       { transform: translateY(-3px) rotate(1.5deg); }
        }
        @keyframes pico-celebrate {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          20%       { transform: translateY(-12px) rotate(-6deg) scale(1.08); }
          40%       { transform: translateY(-8px) rotate(6deg) scale(1.08); }
          60%       { transform: translateY(-14px) rotate(-4deg) scale(1.1); }
          80%       { transform: translateY(-6px) rotate(4deg) scale(1.05); }
        }
        @keyframes pico-dead {
          0%, 100% { transform: rotate(0deg); }
          25%       { transform: rotate(-8deg); }
          75%       { transform: rotate(8deg); }
        }
        .pico-bob       { animation: pico-bob 2.4s ease-in-out infinite; }
        .pico-celebrate { animation: pico-celebrate 0.7s ease-in-out infinite; }
        .pico-dead      { animation: pico-dead 1.8s ease-in-out infinite; }
      `}</style>

      <div
        className={`inline-block ${animClass} ${className}`}
        style={{ width: size, lineHeight: 0 }}
      >
        <svg
          viewBox="0 0 230 540"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* TAIL */}
          <ellipse cx="95"  cy="470" rx="14" ry="52" fill={isDead ? "#6b7280" : "#1d4ed8"} transform="rotate(-18,95,470)"/>
          <ellipse cx="110" cy="478" rx="12" ry="58" fill={isDead ? "#9ca3af" : "#2563eb"} transform="rotate(-6,110,478)"/>
          <ellipse cx="125" cy="478" rx="12" ry="58" fill={isDead ? "#9ca3af" : "#3b82f6"} transform="rotate(6,125,478)"/>
          <ellipse cx="140" cy="470" rx="14" ry="52" fill={isDead ? "#6b7280" : "#1d4ed8"} transform="rotate(18,140,470)"/>

          {/* BODY */}
          <ellipse cx="115" cy="370" rx="78" ry="100" fill={bodyFill}/>
          <ellipse cx="115" cy="390" rx="46"  ry="68"  fill={bellyFill}/>

          {/* WINGS */}
          <ellipse cx="48"  cy="360" rx="28" ry="72" fill={wingFill}  transform="rotate(-10,48,360)"/>
          <ellipse cx="44"  cy="345" rx="14" ry="36" fill={wingDark}  transform="rotate(-10,44,345)"/>
          <ellipse cx="182" cy="360" rx="28" ry="72" fill={wingFill}  transform="rotate(10,182,360)"/>
          <ellipse cx="186" cy="345" rx="14" ry="36" fill={wingDark}  transform="rotate(10,186,345)"/>

          {/* NECK */}
          <ellipse cx="115" cy="278" rx="44" ry="36" fill={bodyFill}/>

          {/* HEAD */}
          <circle cx="115" cy="235" r="72" fill={bodyFill}/>

          {/* CROWN */}
          {!isDead && (
            <>
              <ellipse cx="115" cy="178" rx="38" ry="22" fill="#3b82f6"/>
              <ellipse cx="95"  cy="162" rx="9"  ry="20" fill="#2563eb" transform="rotate(-12,95,162)"/>
              <ellipse cx="115" cy="158" rx="9"  ry="22" fill="#1d4ed8"/>
              <ellipse cx="135" cy="162" rx="9"  ry="20" fill="#2563eb" transform="rotate(12,135,162)"/>
            </>
          )}

          {/* CHEEKS */}
          <ellipse cx="68"  cy={240 + eyeOffsetY} rx="22" ry="18" fill={isDead ? "#d1d5db" : "#fbbf24"}/>
          <ellipse cx="162" cy={240 + eyeOffsetY} rx="22" ry="18" fill={isDead ? "#d1d5db" : "#fbbf24"}/>

          {/* EYES */}
          {isDead ? (
            <>
              <line x1="72" y1="212" x2="92" y2="232" stroke="#374151" strokeWidth="4" strokeLinecap="round"/>
              <line x1="92" y1="212" x2="72" y2="232" stroke="#374151" strokeWidth="4" strokeLinecap="round"/>
              <line x1="136" y1="212" x2="156" y2="232" stroke="#374151" strokeWidth="4" strokeLinecap="round"/>
              <line x1="156" y1="212" x2="136" y2="232" stroke="#374151" strokeWidth="4" strokeLinecap="round"/>
            </>
          ) : isSad ? (
            <>
              <circle cx="82"  cy={222 + eyeOffsetY} r="18" fill="white"/>
              <circle cx="148" cy={222 + eyeOffsetY} r="18" fill="white"/>
              <path d={`M64 ${214 + eyeOffsetY} Q82 ${207 + eyeOffsetY} 100 ${214 + eyeOffsetY}`} fill="#22c55e"/>
              <path d={`M130 ${214 + eyeOffsetY} Q148 ${207 + eyeOffsetY} 166 ${214 + eyeOffsetY}`} fill="#22c55e"/>
              <circle cx="86"  cy={224 + eyeOffsetY} r={blinking ? 1 : 11} fill="#1e293b"/>
              <circle cx="152" cy={224 + eyeOffsetY} r={blinking ? 1 : 11} fill="#1e293b"/>
              <circle cx="88"  cy={220 + eyeOffsetY} r={blinking ? 0 : 4}  fill="white"/>
              <circle cx="154" cy={220 + eyeOffsetY} r={blinking ? 0 : 4}  fill="white"/>
            </>
          ) : (
            <>
              <circle cx="82"  cy="222" r="18" fill="white"/>
              <circle cx="148" cy="222" r="18" fill="white"/>
              <circle cx="86"  cy="224" r={eyeSize}  fill="#1e293b"/>
              <circle cx="152" cy="224" r={eyeSize}  fill="#1e293b"/>
              <circle cx="86"  cy="224" r={blinking ? 0 : 6}  fill="#111827"/>
              <circle cx="152" cy="224" r={blinking ? 0 : 6}  fill="#111827"/>
              <circle cx="91"  cy="219" r={blinking ? 0 : 3}  fill="white"/>
              <circle cx="157" cy="219" r={blinking ? 0 : 3}  fill="white"/>
            </>
          )}

          {/* BEAK */}
          <path
            d={`M98 252 Q115 ${252 + beakOpen} 132 252 Q126 240 115 238 Q104 240 98 252Z`}
            fill="#f59e0b"
          />
          <path
            d={`M101 257 Q115 ${257 + beakOpen - 2} 129 257 Q122 ${260 + beakOpen} 115 ${261 + beakOpen} Q108 ${260 + beakOpen} 101 257Z`}
            fill="#d97706"
          />

          {isCelebrate && (
            <ellipse cx="115" cy={264 + beakOpen} rx="8" ry="5" fill="#ef4444"/>
          )}

          {/* FEET */}
          <g fill="#d97706">
            <rect x="82"  y="462" width="8" height="22" rx="4"/>
            <rect x="70"  y="480" width="22" height="7"  rx="3"/>
            <rect x="66"  y="476" width="8"  height="14" rx="3" transform="rotate(-20,66,476)"/>
            <rect x="89"  y="476" width="8"  height="14" rx="3" transform="rotate(20,89,476)"/>
            <rect x="126" y="462" width="8" height="22" rx="4"/>
            <rect x="114" y="480" width="22" height="7"  rx="3"/>
            <rect x="110" y="476" width="8"  height="14" rx="3" transform="rotate(-20,110,476)"/>
            <rect x="133" y="476" width="8"  height="14" rx="3" transform="rotate(20,133,476)"/>
          </g>

          {/* PERCH */}
          <rect x="40" y="483" width="150" height="16" rx="8" fill="#92400e"/>
          <rect x="40" y="483" width="150" height="6"  rx="3" fill="#b45309"/>
        </svg>
      </div>
    </>
  );
}
