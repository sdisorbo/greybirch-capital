import Nav from "@/components/Nav";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Nav role={null} />

      <main className="pt-36 pb-24 px-6 max-w-3xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-5 font-sans">
          About
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium text-stone-900 mb-10 leading-snug">
          Investment Advisory
        </h1>

        <div className="w-8 h-px bg-stone-300 mb-10" />

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

        <div className="mt-14 border-t border-stone-200 pt-10">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-6 font-sans">
            Principles
          </p>
          <div className="space-y-6">
            {[
              ["Edge Before Execution", "We only act when our models show a statistically meaningful advantage, accounting for friction and variance."],
              ["Transparency", "Investors receive clear, honest reporting on performance, methodology, and the limits of our approach."],
              ["Capital Efficiency", "We optimize for risk-adjusted return, not absolute size. Protecting downside is the precondition for any upside."],
            ].map(([title, body]) => (
              <div key={title} className="grid grid-cols-[1fr_2fr] gap-8 items-start">
                <p className="font-serif text-stone-800 font-medium text-sm pt-0.5">{title}</p>
                <p className="text-stone-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-stone-200 pt-8">
          <p className="text-xs text-stone-400 leading-relaxed">
            Grey Birch Capital provides investment advice. Past performance does not
            guarantee future results. All investments carry risk including the possible
            loss of principal.
          </p>
        </div>
      </main>
    </div>
  );
}
