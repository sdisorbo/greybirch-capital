import Link from "next/link";
import Nav from "@/components/Nav";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav role={null} />

      <HeroSection />

      {/* Pillars */}
      <section className="border-b border-stone-100 py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            ["Research-First", "Every position begins with a thesis grounded in proprietary data and systematic analysis."],
            ["Risk Aware",     "Capital preservation is our first obligation. We size positions to reflect conviction and volatility."],
            ["Long-Term",      "We align our time horizon with the duration of our edge, not the market's noise."],
          ].map(([title, body]) => (
            <div key={title}>
              <div className="w-6 h-1 bg-[#3C443D] mb-4 rounded-full" />
              <p className="font-serif text-2xl font-medium text-stone-900 mb-3">{title}</p>
              <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3C443D] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-serif text-sm text-white/60">Grey Birch Capital</p>
          <p className="text-xs text-white/30 tracking-wide">
            Investment advisory services. Not an offer to buy or sell securities.
          </p>
        </div>
      </footer>
    </div>
  );
}
