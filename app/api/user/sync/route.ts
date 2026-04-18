import { requireRouteUser } from "@/lib/server/supabaseRoute";

type SyncBody = {
  userId?: string;
  xp?: number;
  weeklyXP?: number;
  coins?: number;
  hearts?: number;
  streak?: number;
  level?: number;
  lastHeartRegenAt?: number | null;
  equippedTheme?: string;
  unlockedThemes?: string[];
  activePowerUps?: unknown[];
  leagueTier?: string;
  highestLeagueTier?: string;
  lastActiveDate?: string | null;
  comeback_bonus_claimed_at?: string | null;
};

export async function PATCH(request: Request) {
  const { supabase, user, error } = await requireRouteUser(request);
  if (error || !user) return error;

  const body = (await request.json()) as SyncBody;

  if (body.userId && body.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.xp === "number") updates.total_xp = body.xp;
  if (typeof body.weeklyXP === "number") updates.weekly_xp = body.weeklyXP;
  if (typeof body.coins === "number") updates.coins = body.coins;
  if (typeof body.hearts === "number") updates.hearts = body.hearts;
  if (typeof body.streak === "number") updates.streak_days = body.streak;
  if (typeof body.level === "number") updates.level = body.level;
  if (typeof body.lastHeartRegenAt === "number") updates.last_heart_regen_at = new Date(body.lastHeartRegenAt).toISOString();
  if (typeof body.equippedTheme === "string") updates.equipped_theme = body.equippedTheme;
  if (Array.isArray(body.unlockedThemes)) updates.unlocked_themes = body.unlockedThemes;
  if (Array.isArray(body.activePowerUps)) updates.active_power_ups = body.activePowerUps;
  if (typeof body.leagueTier === "string") updates.league_tier = body.leagueTier;
  if (typeof body.highestLeagueTier === "string") updates.highest_league_tier = body.highestLeagueTier;
  if (typeof body.lastActiveDate === "string" || body.lastActiveDate === null) updates.last_active_date = body.lastActiveDate;
  if (Object.prototype.hasOwnProperty.call(body, "comeback_bonus_claimed_at")) {
    updates.comeback_bonus_claimed_at = body.comeback_bonus_claimed_at;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
