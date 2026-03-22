"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/learn");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm p-10 max-w-md w-full">
        <a href="/" className="text-2xl font-extrabold text-green-500 block mb-8">Pico</a>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 font-semibold mb-8">Continue your Python journey.</p>

        <input
          type="email"
          placeholder="Email"
          className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-semibold mb-4 focus:outline-none focus:border-green-400 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-semibold mb-6 focus:outline-none focus:border-green-400 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 font-semibold mb-4 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-50 mb-4"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-gray-500 font-semibold text-sm">
          No account yet?{" "}
          <a href="/signup" className="text-green-500 font-extrabold hover:underline">Sign up free</a>
        </p>
      </div>
    </main>
  );
}