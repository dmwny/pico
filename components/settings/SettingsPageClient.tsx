"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <label style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", padding: "0.9rem 0" }}>
      <div>
        <div style={{ fontWeight: 700 }}>{label}</div>
        {description ? <div style={{ color: "var(--theme-text-secondary)", fontSize: "0.92rem", marginTop: "0.2rem" }}>{description}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: "52px",
          height: "30px",
          borderRadius: "999px",
          border: "1px solid var(--theme-border)",
          background: value ? "var(--theme-accent)" : "var(--theme-bg-secondary)",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "3px",
            left: value ? "25px" : "3px",
            width: "22px",
            height: "22px",
            borderRadius: "999px",
            background: "#fff",
            transition: "left 160ms ease",
          }}
        />
      </button>
    </label>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="card"
      style={{
        background: "var(--theme-bg-card)",
        border: "1px solid var(--theme-border)",
        borderRadius: "24px",
        padding: "1.2rem 1.25rem",
        boxShadow: "var(--theme-card-shadow)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{title}</h2>
      <div style={{ marginTop: "0.8rem" }}>{children}</div>
    </section>
  );
}

export default function SettingsPageClient() {
  const router = useRouter();
  const [sound, setSound] = useState(true);
  const [voice, setVoice] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [showCombo, setShowCombo] = useState(true);
  const [rivalNotifications, setRivalNotifications] = useState(true);

  useEffect(() => {
    setSound(localStorage.getItem("pico_sound") !== "false");
    setVoice(localStorage.getItem("pico_voice") === "true");
    setReduceAnimations(localStorage.getItem("pico_reduce_motion") === "true");
    setLargeText(localStorage.getItem("pico_large_text") === "true");
    setAdaptiveDifficulty(localStorage.getItem("pico_adaptive_difficulty") !== "false");
    setShowCombo(localStorage.getItem("pico_show_combo") !== "false");
    setRivalNotifications(localStorage.getItem("pico_rival_notifications") !== "false");
  }, []);

  const save = (key: string, value: boolean) => {
    localStorage.setItem(key, String(value));
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--theme-bg-primary)", color: "var(--theme-text-primary)" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "1rem 1rem 2rem" }}>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--theme-text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 0",
          }}
        >
          ← Profile
        </button>

        <h1 style={{ margin: "0.75rem 0 1.25rem", fontSize: "clamp(2rem, 3vw, 3rem)" }}>Settings</h1>

        <div style={{ display: "grid", gap: "1rem" }}>
          <SettingsSection title="Sound">
            <ToggleRow label="Sound effects" value={sound} onChange={(next) => { setSound(next); save("pico_sound", next); }} />
            <ToggleRow label="Voice narration" description="Uses the Web Speech API for question prompts." value={voice} onChange={(next) => { setVoice(next); save("pico_voice", next); }} />
          </SettingsSection>

          <SettingsSection title="Accessibility">
            <ToggleRow label="Reduce animations" value={reduceAnimations} onChange={(next) => { setReduceAnimations(next); save("pico_reduce_motion", next); document.documentElement.dataset.reduceMotion = String(next); }} />
            <ToggleRow label="Large text mode" value={largeText} onChange={(next) => { setLargeText(next); save("pico_large_text", next); document.documentElement.style.fontSize = next ? "120%" : ""; }} />
          </SettingsSection>

          <SettingsSection title="Learning">
            <ToggleRow label="Adaptive difficulty suggestions" value={adaptiveDifficulty} onChange={(next) => { setAdaptiveDifficulty(next); save("pico_adaptive_difficulty", next); }} />
            <ToggleRow label="Show combo multiplier" value={showCombo} onChange={(next) => { setShowCombo(next); save("pico_show_combo", next); }} />
          </SettingsSection>

          <SettingsSection title="Leagues">
            <ToggleRow label="Rival notifications" value={rivalNotifications} onChange={(next) => { setRivalNotifications(next); save("pico_rival_notifications", next); }} />
          </SettingsSection>

          <SettingsSection title="Data">
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem("pico_supabase_access_token");
                  const response = await fetch("/api/user/export", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  const payload = await response.json();
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "pico-data-export.json";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ border: "none", borderRadius: "999px", padding: "0.85rem 1rem", background: "var(--theme-accent)", color: "var(--theme-accent-text)", fontWeight: 700, cursor: "pointer" }}
              >
                Download my data
              </button>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm("Reset your progress? This cannot be undone.");
                  if (!confirmed) return;
                  const token = localStorage.getItem("pico_supabase_access_token");
                  await fetch("/api/user/reset", {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  window.location.reload();
                }}
                style={{ border: "1px solid var(--theme-error)", borderRadius: "999px", padding: "0.85rem 1rem", background: "transparent", color: "var(--theme-error)", fontWeight: 700, cursor: "pointer" }}
              >
                Reset progress
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>
    </main>
  );
}
