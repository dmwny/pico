import { requireRouteUser } from "@/lib/server/supabaseRoute";

export async function DELETE(request: Request) {
  const { supabase, user, error } = await requireRouteUser(request);
  if (error || !user) return error;

  await Promise.all([
    supabase.from("pico_progress").delete().eq("user_id", user.id),
    supabase.from("bookmarks").delete().eq("user_id", user.id),
    supabase.from("lesson_notes").delete().eq("user_id", user.id),
    supabase.from("certifications").delete().eq("user_id", user.id),
    supabase.from("boss_battles").delete().eq("user_id", user.id),
    supabase.from("topic_accuracy").delete().eq("user_id", user.id),
    supabase
      .from("profiles")
      .update({
        total_xp: 0,
        weekly_xp: 0,
        streak_days: 0,
        hearts: 5,
        coins: 0,
        level: 1,
        active_power_ups: [],
        total_questions_answered: 0,
        total_correct_answers: 0,
      })
      .eq("id", user.id),
  ]);

  return Response.json({ ok: true });
}
