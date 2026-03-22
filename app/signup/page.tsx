"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/verify");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm p-10 max-w-md w-full">
        <a href="/" className="text-2xl font-extrabold text-green-500 block mb-8">Pico</a>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 font-semibold mb-8">Start learning Python for free.</p>

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
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-500 text-white font-extrabold py-4 rounded-2xl hover:bg-green-600 transition shadow-md disabled:opacity-50 mb-4"
        >
          {loading ? "Creating account..." : "Get Started"}
        </button>

        <p className="text-center text-gray-500 font-semibold text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-green-500 font-extrabold hover:underline">Log in</a>
        </p>
      </div>
    </main>
  );
}