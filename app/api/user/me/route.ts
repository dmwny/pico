import { requireRouteUser } from "@/lib/server/supabaseRoute";

type ProfileRow = {
  username: string | null;
  weekly_xp: number | null;
  total_xp: number | null;
  league_tier: string | null;
  highest_league_tier: string | null;
  streak_days: number | null;
  last_active_date: string | null;
  last_heart_regen_at: string | null;
  hearts: number | null;
  coins: number | null;
  level: number | null;
  unlocked_themes: string[] | null;
  equipped_theme: string | null;
  active_power_ups: unknown[] | null;
};

export async function GET(request: Request) {
  const { supabase, user, error } = await requireRouteUser(request);
  if (error || !user) return error;

  const [{ data: profile }, { data: progressRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, weekly_xp, total_xp, league_tier, highest_league_tier, streak_days, last_active_date, last_heart_regen_at, hearts, coins, level, unlocked_themes, equipped_theme, active_power_ups")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("pico_progress")
      .select("xp")
      .eq("user_id", user.id),
  ]);

  const totalProgressXp = (progressRows ?? []).reduce((sum, row) => sum + Number((row as { xp?: number | null }).xp ?? 0), 0);
  const displayName =
    profile?.username
    ?? (typeof user.user_metadata?.username === "string" ? user.user_metadata.username : null)
    ?? (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null)
    ?? user.email?.split("@")[0]
    ?? "Pico learner";

  return Response.json({
    userId: user.id,
    displayName,
    xp: Number(profile?.total_xp ?? totalProgressXp ?? 0),
    weeklyXP: Number(profile?.weekly_xp ?? 0),
    coins: Number(profile?.coins ?? 0),
    hearts: Number(profile?.hearts ?? 5),
    maxHearts: 5,
    streak: Number(profile?.streak_days ?? 0),
    level: Number(profile?.level ?? 1),
    lastActiveDate: profile?.last_active_date ?? null,
    lastHeartRegenAt: profile?.last_heart_regen_at ? Date.parse(profile.last_heart_regen_at) : null,
    leagueTier: profile?.league_tier ?? "bronze",
    highestLeagueTier: profile?.highest_league_tier ?? "bronze",
    unlockedThemes: profile?.unlocked_themes?.length ? profile.unlocked_themes : ["default"],
    equippedTheme: profile?.equipped_theme ?? "default",
    activePowerUps: Array.isArray(profile?.active_power_ups) ? profile.active_power_ups : [],
    comboCount: 0,
    comboMultiplier: 1,
    isHydrated: true,
    isFetching: false,
  });
}
