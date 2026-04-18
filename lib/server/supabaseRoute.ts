import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export function createRouteSupabase(request: Request) {
  const token = getBearerToken(request);
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  return {
    token,
    supabase: createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: headers ? { headers } : undefined,
    }),
  };
}

export async function requireRouteUser(request: Request) {
  const { supabase, token } = createRouteSupabase(request);

  if (!token) {
    return {
      supabase,
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user, error: null };
}
