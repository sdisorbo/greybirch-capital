import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Nav role={null} />

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 max-w-4xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-6 font-sans">
          Investment Advisory
        </p>
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-stone-900 leading-tight mb-8">
          Grey Birch
          <br />
          Capital
        </h1>
        <div className="w-12 h-px bg-stone-300 mb-8" />
        <p className="text-stone-500 text-lg font-light leading-relaxed max-w-xl">
          A disciplined, research-driven approach to capital allocation. We seek
          asymmetric opportunities where rigorous analysis yields durable edge.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm tracking-wide text-stone-700 border border-stone-300 px-6 py-3 hover:border-stone-600 hover:text-stone-900 transition-colors"
          >
            Our Approach
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm tracking-wide text-stone-500 px-6 py-3 hover:text-stone-800 transition-colors"
          >
            Investor Portal →
          </Link>
        </div>
      </section>

      {/* Divider section */}
      <section className="border-t border-stone-200 py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <p className="font-serif text-3xl font-medium text-stone-900 mb-3">Research-First</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Every position begins with a thesis grounded in proprietary data and systematic analysis.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl font-medium text-stone-900 mb-3">Risk Aware</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Capital preservation is our first obligation. We size positions to reflect conviction and volatility.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl font-medium text-stone-900 mb-3">Long-Term</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              We align our time horizon with the duration of our edge, not the market&apos;s noise.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-serif text-sm text-stone-400">Grey Birch Capital</p>
          <p className="text-xs text-stone-300 tracking-wide">
            Investment advisory services. Not an offer to buy or sell securities.
          </p>
        </div>
      </footer>
    </div>
  );
}
