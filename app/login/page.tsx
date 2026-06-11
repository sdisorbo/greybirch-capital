"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Minimal header */}
      <header className="px-6 h-16 flex items-center">
        <Link href="/" className="font-serif text-base font-semibold text-stone-700 hover:text-stone-900 transition-colors">
          Grey Birch Capital
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-3 font-sans">
              Investor Portal
            </p>
            <h1 className="font-serif text-3xl font-medium text-stone-900">
              Sign in
            </h1>
            <div className="w-6 h-px bg-stone-300 mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-1.5 font-sans">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-stone-200 focus:border-stone-400 outline-none px-4 py-3 text-stone-800 text-sm transition-colors"
                placeholder="username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-1.5 font-sans">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-stone-200 focus:border-stone-400 outline-none px-4 py-3 text-stone-800 text-sm transition-colors"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-700 text-stone-50 text-sm tracking-wide py-3 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-stone-400 text-center leading-relaxed">
            Restricted access. Authorized investors only.
          </p>
        </div>
      </div>
    </div>
  );
}
