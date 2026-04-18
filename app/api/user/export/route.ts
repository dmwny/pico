import { requireRouteUser } from "@/lib/server/supabaseRoute";

export async function GET(request: Request) {
  const { supabase, user, error } = await requireRouteUser(request);
  if (error || !user) return error;

  const [profile, progress, cosmetics, bookmarks, notes, certifications] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("pico_progress").select("*").eq("user_id", user.id),
    supabase.from("pico_cosmetics").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("bookmarks").select("*").eq("user_id", user.id),
    supabase.from("lesson_notes").select("*").eq("user_id", user.id),
    supabase.from("certifications").select("*").eq("user_id", user.id),
  ]);

  return Response.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: profile.data ?? null,
    progress: progress.data ?? [],
    cosmetics: cosmetics.data ?? null,
    bookmarks: bookmarks.data ?? [],
    notes: notes.data ?? [],
    certifications: certifications.data ?? [],
  });
}
