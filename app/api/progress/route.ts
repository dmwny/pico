import { normalizeLanguage } from "@/lib/courseContent";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(req: Request) {
  const { userId, language, values } = await req.json();

  if (!userId || !values || typeof values !== "object") {
    return Response.json({ error: "Missing progress payload" }, { status: 400 });
  }

  const normalizedLanguage = normalizeLanguage(language);

  const { data: existing, error: fetchError } = await supabase
    .from("pico_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("language", normalizedLanguage)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: fetchError }, { status: 500 });
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("pico_progress")
      .update(values)
      .eq("user_id", userId)
      .eq("language", normalizedLanguage);

    if (updateError) {
      return Response.json({ error: updateError }, { status: 500 });
    }

    return Response.json({ ok: true, mode: "update" });
  }

  const { error: insertError } = await supabase
    .from("pico_progress")
    .insert({
      user_id: userId,
      language: normalizedLanguage,
      ...values,
    });

  if (insertError) {
    return Response.json({ error: insertError }, { status: 500 });
  }

  return Response.json({ ok: true, mode: "insert" });
}
