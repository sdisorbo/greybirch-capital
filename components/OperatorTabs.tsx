"use client";

import { useState } from "react";
import PitchDashboard from "./PitchDashboard";
import FundDashboard from "./FundDashboard";

const TABS = [
  { id: "pitch",  label: "Pitch Model" },
  { id: "fund",   label: "Fund Performance" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function OperatorTabs() {
  const [active, setActive] = useState<TabId>("pitch");

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-stone-300 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-5 py-2.5 text-sm font-sans tracking-wide transition-colors border-b-2 -mb-px ${
              active === t.id
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "pitch" && (
        <div>
          <div className="mb-4">
            <p className="text-xs text-stone-500 font-sans leading-relaxed">
              Live MLB game feed — half-inning pitch count predictions powered by binary LightGBM classifiers.
              Bars and +EV flags update every 30s. Bars currently show model estimates;{" "}
              <span className="text-stone-700">connect your Python predictor at <code className="bg-stone-200 px-1 text-xs">PREDICTOR_URL</code> for live ML predictions.</span>
            </p>
          </div>
          <PitchDashboard />
        </div>
      )}

      {active === "fund" && (
        <FundDashboard isOperator={true} />
      )}
    </div>
  );
}
