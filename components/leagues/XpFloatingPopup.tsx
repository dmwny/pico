"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DISPLAY_FONT = "\"Playfair Display\", serif";
const SANS_FONT = "\"Source Sans 3\", sans-serif";

type PopupPosition = {
  x: number;
  y: number;
};

type PopupItem = {
  id: number;
  amount: number;
  bonusLabel?: string;
  position: PopupPosition;
};

type XpPopupContextValue = {
  triggerXpPopup: (amount: number, bonusLabel?: string, position?: PopupPosition) => void;
};

const XpPopupContext = createContext<XpPopupContextValue | null>(null);

export function useXpFloatingPopup() {
  const context = useContext(XpPopupContext);
  if (!context) {
    throw new Error("useXpFloatingPopup must be used within XpFloatingPopup.");
  }

  return context;
}

export default function XpFloatingPopup({ children }: { children: ReactNode }) {
  const idRef = useRef(0);
  const [popups, setPopups] = useState<PopupItem[]>([]);

  const triggerXpPopup = useCallback(
    (amount: number, bonusLabel?: string, position?: PopupPosition) => {
      const id = idRef.current + 1;
      idRef.current = id;

      const basePosition = position ?? {
        x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
        y: typeof window === "undefined" ? 0 : window.innerHeight / 2,
      };

      const popup: PopupItem = {
        id,
        amount,
        bonusLabel,
        position: {
          x: basePosition.x + (Math.random() * 40 - 20),
          y: basePosition.y + (Math.random() * 16 - 8),
        },
      };

      setPopups((current) => [...current, popup]);

      window.setTimeout(() => {
        setPopups((current) => current.filter((entry) => entry.id !== id));
      }, 1250);
    },
    [],
  );

  const value = useMemo<XpPopupContextValue>(() => ({ triggerXpPopup }), [triggerXpPopup]);

  return (
    <XpPopupContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 280,
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes leagueXpPopupFloat {
            0% {
              transform: translate3d(-50%, 0, 0) scale(0.92);
              opacity: 0;
            }
            12% {
              transform: translate3d(-50%, -6px, 0) scale(1);
              opacity: 1;
            }
            66% {
              transform: translate3d(-50%, -38px, 0) scale(1.03);
              opacity: 1;
            }
            100% {
              transform: translate3d(-50%, -60px, 0) scale(0.98);
              opacity: 0;
            }
          }
        `}</style>
        {popups.map((popup) => (
          <div
            key={popup.id}
            style={{
              position: "absolute",
              left: popup.position.x,
              top: popup.position.y,
              transform: "translateX(-50%)",
              animation: "leagueXpPopupFloat 1200ms ease-out forwards",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: 20,
                fontWeight: 900,
                lineHeight: 1,
                color: "#e8820c",
                textShadow: "0 10px 20px rgba(232,130,12,0.16)",
              }}
            >
              +{popup.amount} XP
            </div>
            {popup.bonusLabel ? (
              <div
                style={{
                  marginTop: 4,
                  fontFamily: SANS_FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(232,130,12,0.72)",
                  textTransform: "uppercase",
                }}
              >
                {popup.bonusLabel}!
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </XpPopupContext.Provider>
  );
}
