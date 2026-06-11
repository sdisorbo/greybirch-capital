"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HeroSection() {
  const heroRef   = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Photo fades out as you scroll — fully gone by 400px
  const photoOpacity = Math.max(0, 1 - scrollY / 400);
  // Photo moves up slightly (parallax feel)
  const photoTranslate = scrollY * 0.35;

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-[#3C443D] pt-40 pb-28 px-6 min-h-[80vh] flex items-center">

      {/* Background photo — fades and shifts on scroll */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: photoOpacity * 0.38 }}
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/grey_birch.jpg')",
            transform: `translateY(${photoTranslate}px) scale(1.1)`,
            transformOrigin: "center top",
          }}
        />
      </div>

      {/* Gradient overlay — keeps text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(60,68,61,0.85) 40%, rgba(60,68,61,0.4) 100%)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <p
          className="text-xs tracking-[0.2em] uppercase font-sans mb-6"
          style={{ color: "rgba(231,220,70,0.75)" }}
        >
          Investment Advisory
        </p>
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-tight mb-8">
          Grey Birch
          <br />
          Capital
        </h1>
        <div className="w-12 h-px mb-8" style={{ background: "rgba(231,220,70,0.4)" }} />
        <p className="text-stone-200 text-lg font-light leading-relaxed max-w-xl">
          A disciplined, research-driven approach to capital allocation. We seek
          asymmetric opportunities where rigorous analysis yields durable edge.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm tracking-wide text-white border border-white/30 px-6 py-3 hover:border-[#E7DC46] hover:text-[#E7DC46] transition-colors"
          >
            Our Approach
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm tracking-wide px-6 py-3 transition-colors"
            style={{ color: "#E7DC46" }}
          >
            Investor Portal →
          </Link>
        </div>
      </div>

      {/* Bottom fade to white */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #fff)" }}
        aria-hidden
      />
    </section>
  );
}
