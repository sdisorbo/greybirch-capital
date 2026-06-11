"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    const { role } = await res.json();
    router.push(role === "operator" ? "/operator" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#3C443D] flex flex-col">
      {/* Minimal header */}
      <header className="px-6 h-16 flex items-center">
        <Link href="/" className="font-serif text-base font-semibold text-white/80 hover:text-white transition-colors">
          Grey Birch Capital
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-xs tracking-[0.2em] uppercase text-[#E7DC46]/70 mb-3 font-sans">
              Investor Portal
            </p>
            <h1 className="font-serif text-3xl font-medium text-white">Sign in</h1>
            <div className="w-6 h-1 bg-[#E7DC46] mt-4 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-sans">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/20 focus:border-[#E7DC46]/60 outline-none px-4 py-3 text-white text-sm transition-colors placeholder:text-white/20"
                placeholder="username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-sans">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/20 focus:border-[#E7DC46]/60 outline-none px-4 py-3 text-white text-sm transition-colors placeholder:text-white/20"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-xs text-red-400 tracking-wide">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E7DC46] hover:bg-[#d4ca3c] text-[#3C443D] font-semibold text-sm tracking-wide py-3 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-white/25 text-center leading-relaxed">
            Restricted access. Authorized investors only.
          </p>
        </div>
      </div>
    </div>
  );
}
