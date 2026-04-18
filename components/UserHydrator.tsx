"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/themes/useTheme";
import { useUserStore } from "@/store/userStore";

const FIVE_MINUTES = 5 * 60 * 1000;

function getDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const value = [
    metadata.full_name,
    metadata.name,
    metadata.username,
    user.email?.split("@")[0],
  ].find((entry) => typeof entry === "string" && entry.trim().length > 0);

  return typeof value === "string" ? value.trim() : "Pico learner";
}

export default function UserHydrator() {
  useTheme();

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      useUserStore.getState().setFetching(true);

      const [
        { data: sessionData },
        { data: userData },
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      const accessToken = sessionData.session?.access_token ?? null;
      if (accessToken && typeof window !== "undefined") {
        window.localStorage.setItem("pico_supabase_access_token", accessToken);
      }

      const user = userData.user;

      if (!user) {
        if (!active) return;
        useUserStore.getState().hydrate({
          userId: null,
          displayName: "",
          isHydrated: true,
        });
        return;
      }

      try {
        const response = await fetch("/api/user/me", {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (!active) return;

        if (response.ok) {
          const payload = await response.json();
          useUserStore.getState().hydrate(payload);
          return;
        }
      } catch {
        return;
      } finally {
        if (active) {
          useUserStore.getState().setFetching(false);
        }
      }

      if (!active) return;

      useUserStore.getState().hydrate({
        userId: user.id,
        displayName: getDisplayName(user),
        isHydrated: true,
      });
    };

    void hydrate();

    const interval = window.setInterval(() => {
      useUserStore.getState().tickHeartRegen();
    }, FIVE_MINUTES);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
