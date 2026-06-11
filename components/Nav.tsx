"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface NavProps {
  role?: "operator" | "investor" | null;
}

export default function Nav({ role }: NavProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href
      ? "text-[#E7DC46]"
      : "text-stone-300 hover:text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#3C443D]/97 backdrop-blur-sm shadow-[0_1px_0_0_rgba(231,220,70,0.15)]"
          : "bg-[#3C443D]"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-white">
          Grey Birch Capital
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-sm tracking-wide transition-colors ${isActive("/")}`}>Home</Link>
          <Link href="/about" className={`text-sm tracking-wide transition-colors ${isActive("/about")}`}>About</Link>
          {role ? (
            <>
              <Link href="/dashboard" className={`text-sm tracking-wide transition-colors ${isActive("/dashboard")}`}>
                Fund
              </Link>
              {role === "operator" && (
                <Link href="/operator" className={`text-sm tracking-wide transition-colors ${isActive("/operator")}`}>
                  Pitch Model
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm tracking-wide text-stone-400 hover:text-stone-200 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm tracking-wide px-4 py-1.5 border border-[#E7DC46]/40 hover:border-[#E7DC46] text-[#E7DC46] hover:bg-[#E7DC46]/10 rounded transition-colors"
            >
              Investor Login
            </Link>
          )}
        </div>

        {/* Mobile button */}
        <button className="md:hidden text-stone-300" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#3C443D] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link href="/"       className="text-sm text-stone-200" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/about"  className="text-sm text-stone-200" onClick={() => setMenuOpen(false)}>About</Link>
          {role ? (
            <>
              <Link href="/dashboard" className="text-sm text-stone-200" onClick={() => setMenuOpen(false)}>Fund</Link>
              {role === "operator" && (
                <Link href="/operator" className="text-sm text-stone-200" onClick={() => setMenuOpen(false)}>Pitch Model</Link>
              )}
              <button onClick={handleLogout} className="text-sm text-stone-400 text-left">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-[#E7DC46]" onClick={() => setMenuOpen(false)}>Investor Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
