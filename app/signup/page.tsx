"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { normalizeRedirectPath } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = useMemo(
    () => normalizeRedirectPath(searchParams.get("redirect"), "/courses"),
    [searchParams],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(redirectPath);
      setLoading(false);
      return;
    }

    setMessage("Account created. Confirm your email, then log in to continue to your saved destination.");
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setMessage("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--pico-cream)] px-4 py-10">
      <div
        className="w-full max-w-md rounded-[32px] border border-[var(--pico-border)] bg-[rgba(255,255,255,0.55)] p-8"
        style={{ boxShadow: "10px 10px 0 rgba(26,26,46,0.1)" }}
      >
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--pico-border)] bg-[var(--pico-orange)] text-lg font-black text-white">
            P
          </div>
          <div>
            <div className="font-serif text-3xl leading-none text-[var(--pico-dark)]">Pico</div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "color-mix(in srgb, var(--pico-body) 68%, transparent)" }}
            >
              Signup
            </div>
          </div>
        </Link>

        <h1 className="mt-8 font-serif text-5xl leading-none text-[var(--pico-dark)]">Create account</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--pico-body)]">
          Your intended destination is saved as <span className="font-semibold">{redirectPath}</span>.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-cream)] px-5 py-4 text-[var(--pico-dark)] outline-none transition focus:border-[var(--pico-orange)]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-cream)] px-5 py-4 text-[var(--pico-dark)] outline-none transition focus:border-[var(--pico-orange)]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-[var(--pico-orange)]">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-semibold text-[var(--pico-dark)]/75">{message}</p> : null}

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-[20px] border border-[var(--pico-border)] bg-transparent px-5 py-4 font-bold text-[var(--pico-dark)] transition hover:bg-white/50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: "color-mix(in srgb, var(--pico-border) 20%, transparent)" }} />
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--pico-body)] opacity-50">or</span>
          <div className="h-px flex-1" style={{ backgroundColor: "color-mix(in srgb, var(--pico-border) 20%, transparent)" }} />
        </div>

        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="mt-4 w-full rounded-[20px] border border-[var(--pico-border)] bg-[var(--pico-dark)] px-5 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[var(--pico-orange)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading ? "Creating Account..." : "Get Started"}
        </button>

        <p className="mt-6 text-center text-sm text-[var(--pico-body)]">
          Already have an account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="font-bold text-[var(--pico-orange)]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
