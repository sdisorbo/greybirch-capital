"use client";

import { useState } from "react";
import PitchDashboard, { ReferenceTable } from "./PitchDashboard";
import FundDashboard from "./FundDashboard";

const TABS = [
  { id: "pitch", label: "Pitch Model" },
  { id: "fund",  label: "Fund Performance" },
] as const;
type TabId = typeof TABS[number]["id"];

const GREEN  = "#3C443D";
const YELLOW = "#E7DC46";

export default function OperatorTabs() {
  const [active, setActive] = useState<TabId>("pitch");

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Tab bar */}
      <div className="flex gap-0 border-b-2 border-stone-200 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="px-5 py-2.5 text-sm font-sans tracking-wide transition-all border-b-2 -mb-[2px]"
            style={{
              borderColor:   active === t.id ? GREEN : "transparent",
              color:         active === t.id ? GREEN : "#78716c",
              fontWeight:    active === t.id ? 600   : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "pitch" && (
        <div>
          <p className="text-xs text-stone-400 font-sans leading-relaxed mb-6">
            Live MLB game feed — half-inning pitch count predictions powered by binary LightGBM classifiers.
            Refreshes every 30s.{" "}
            <span className="text-stone-500">
              Connect your Python predictor at{" "}
              <code className="bg-stone-100 px-1 text-[10px] rounded">PREDICTOR_URL</code>{" "}
              for live ML output.
            </span>
          </p>
          <PitchDashboard />
          <ReferenceTable />
        </div>
      )}

      {active === "fund" && (
        <FundDashboard isOperator={true} />
      )}
    </div>
  );
}
