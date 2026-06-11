import Nav from "@/components/Nav";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Nav role={null} />

      {/* Hero with aspen photo */}
      <div className="relative overflow-hidden bg-[#3C443D] pt-32 pb-20 px-6 min-h-[52vh] flex items-end">
        {/* Aspen photo at reduced opacity */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/aspen.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            opacity: 0.28,
          }}
          aria-hidden
        />
        {/* Gradient — heavier at bottom to fade into white body */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(60,68,61,0.6) 0%, rgba(60,68,61,0.3) 50%, rgba(255,255,255,0) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-28"
          style={{ background: "linear-gradient(to bottom, transparent, #ffffff)" }}
          aria-hidden
        />

        {/* Text content */}
        <div className="relative z-10 max-w-3xl mx-auto w-full pb-4">
          <p className="text-xs tracking-[0.2em] uppercase font-sans mb-4" style={{ color: "rgba(231,220,70,0.8)" }}>
            About
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white leading-snug">
            Investment Advisory
          </h1>
        </div>
      </div>

      <main className="pb-24 px-6 max-w-3xl mx-auto">
        <div className="w-8 h-1 bg-[#E7DC46] mb-10 rounded-full" />

        <div className="space-y-6 text-stone-600 text-base leading-relaxed font-light">
          <p>
            Grey Birch Capital is an investment advisory firm dedicated to identifying
            high-conviction opportunities across alternative markets. Our process is
            built on systematic research, quantitative modeling, and disciplined risk
            management — not intuition or momentum.
          </p>
          <p>
            We operate at the intersection of proprietary data science and financial
            expertise. Our models are built from first principles, rigorously backtested,
            and continuously refined against live market conditions. We believe that
            sustainable alpha is generated through repeatable processes, not one-time
            insights.
          </p>
          <p>
            Our advisory mandates are selective. We work with a limited number of
            investors who share our commitment to long-term compounding and our
            tolerance for a measured, evidence-driven approach to the markets.
          </p>
        </div>

        <div className="mt-14 border-t border-stone-100 pt-10">
          <p className="text-xs tracking-[0.2em] uppercase text-[#3C443D] mb-6 font-sans font-semibold">
            Principles
          </p>
          <div className="space-y-6">
            {[
              ["Edge Before Execution", "We only act when our models show a statistically meaningful advantage, accounting for friction and variance."],
              ["Transparency",          "Investors receive clear, honest reporting on performance, methodology, and the limits of our approach."],
              ["Capital Efficiency",    "We optimize for risk-adjusted return, not absolute size. Protecting downside is the precondition for any upside."],
            ].map(([title, body]) => (
              <div key={title} className="grid grid-cols-[1fr_2fr] gap-8 items-start">
                <p className="font-serif text-stone-800 font-medium text-sm pt-0.5">{title}</p>
                <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-stone-100 pt-8">
          <p className="text-xs text-stone-400 leading-relaxed">
            Grey Birch Capital provides investment advice. Past performance does not
            guarantee future results. All investments carry risk including the possible
            loss of principal.
          </p>
        </div>
      </main>

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
