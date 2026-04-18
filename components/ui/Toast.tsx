"use client";

import { useEffect, useMemo, useState } from "react";
import type { ToastItem, ToastType } from "@/lib/toast";
import { toast } from "@/lib/toast";

const COLORS: Record<ToastType, { background: string; border: string; text: string }> = {
  success: { background: "rgba(16,185,129,0.14)", border: "var(--theme-success)", text: "var(--theme-text-primary)" },
  error: { background: "rgba(239,68,68,0.14)", border: "var(--theme-error)", text: "var(--theme-text-primary)" },
  info: { background: "rgba(59,130,246,0.14)", border: "#3B82F6", text: "var(--theme-text-primary)" },
  warning: { background: "rgba(245,158,11,0.14)", border: "var(--theme-warning)", text: "var(--theme-text-primary)" },
  rival: { background: "rgba(232,98,42,0.14)", border: "var(--theme-accent)", text: "var(--theme-text-primary)" },
  combo: { background: "linear-gradient(135deg, rgba(234,179,8,0.22), rgba(239,68,68,0.16))", border: "var(--theme-warning)", text: "var(--theme-text-primary)" },
  "level-up": { background: "rgba(139,92,246,0.18)", border: "var(--theme-xp-color)", text: "var(--theme-text-primary)" },
};

type LiveToast = ToastItem & {
  leaving?: boolean;
};

export function ToastContainer() {
  const [items, setItems] = useState<LiveToast[]>([]);

  useEffect(() => {
    return toast.onToast((nextToast) => {
      setItems((current) => [...current.slice(-4), nextToast]);

      window.setTimeout(() => {
        setItems((current) => current.map((item) => item.id === nextToast.id ? { ...item, leaving: true } : item));
      }, nextToast.duration ?? 3000);

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== nextToast.id));
      }, (nextToast.duration ?? 3000) + 260);
    });
  }, []);

  const visibleItems = useMemo(() => items.slice(-5), [items]);

  return (
    <>
      <style>{`
        @keyframes pico-toast-in {
          from { opacity: 0; transform: translateX(120%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pico-toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(120%); }
        }
      `}</style>
      <div
        aria-live="polite"
        role="status"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          width: "min(360px, calc(100vw - 2rem))",
          pointerEvents: "none",
        }}
      >
        {visibleItems.map((item) => {
          const color = COLORS[item.type];
          return (
            <div
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
              style={{
                pointerEvents: "auto",
                borderRadius: "var(--theme-radius-lg)",
                border: `1px solid ${color.border}`,
                background: color.background,
                color: color.text,
                boxShadow: "0 12px 34px rgba(0,0,0,0.16)",
                padding: "0.9rem 1rem",
                animation: `${item.leaving ? "pico-toast-out" : "pico-toast-in"} 220ms ease forwards`,
                backdropFilter: "blur(16px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ fontSize: "1rem", lineHeight: 1.2 }}>{item.icon ?? ""}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  {item.message ? (
                    <div style={{ marginTop: "0.2rem", color: "var(--theme-text-secondary)", fontSize: "0.92rem" }}>
                      {item.message}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
