"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signInWithPassword() {
    if (!email || !password) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  async function signInWithGoogle() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,

        scopes:
          "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
            <Sparkles size={30} />
          </div>

          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            NEXORA AI
          </p>

          <h1 className="mt-4 text-4xl font-bold">
            Sign In
          </h1>

          <p className="mt-3 text-slate-400">
            Access your AI automation workspace.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mb-5 w-full rounded-2xl border border-white/10 bg-white px-5 py-4 font-semibold text-slate-900 transition hover:bg-slate-200 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs uppercase tracking-wide text-slate-500">
            or
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
          />

          <button
            onClick={signInWithPassword}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}