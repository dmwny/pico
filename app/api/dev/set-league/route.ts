import { createClient } from "@supabase/supabase-js";
import { requireRouteUser } from "@/lib/server/supabaseRoute";

type SetLeagueBody = {
  leagueId?: number;
  leagueTier?: string;
};

function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  const { supabase, user, error } = await requireRouteUser(request);
  if (error || !user) return error;

  const body = await request.json() as SetLeagueBody;
  const leagueId = Number(body.leagueId ?? 0);
  const leagueTier = typeof body.leagueTier === "string" ? body.leagueTier.trim().toLowerCase() : "";

  if (!leagueId || !leagueTier) {
    return Response.json({ error: "Missing league selection." }, { status: 400 });
  }

  const serviceSupabase = getServiceSupabase();

  let { error: profileError } = await supabase
    .from("profiles")
    .update({
      league_tier: leagueTier,
      highest_league_tier: leagueTier,
    })
    .eq("id", user.id);

  if (profileError && serviceSupabase) {
    const fallback = await serviceSupabase
      .from("profiles")
      .update({
        league_tier: leagueTier,
        highest_league_tier: leagueTier,
      })
      .eq("id", user.id);
    profileError = fallback.error;
  }

  if (profileError) {
    return Response.json({ error: profileError.message || "Could not update the league tier." }, { status: 500 });
  }

  const membershipClient = serviceSupabase ?? supabase;
  const { data: latestMembership, error: membershipLookupError } = await membershipClient
    .from("league_memberships")
    .select("id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (membershipLookupError) {
    return Response.json({
      ok: true,
      leagueId,
      leagueTier,
      warning: "League tier updated, but the current membership could not be refreshed.",
    });
  }

  if (latestMembership?.id) {
    const { error: membershipError } = await membershipClient
      .from("league_memberships")
      .update({ league_id: leagueId })
      .eq("id", latestMembership.id);

    if (membershipError) {
      return Response.json({
        ok: true,
        leagueId,
        leagueTier,
        warning: "League tier updated, but the current league group still needs a refresh.",
      });
    }
  }

  return Response.json({
    ok: true,
    leagueId,
    leagueTier,
  });
}
