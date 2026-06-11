"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";

interface FundEntry { date: string; total: number }
interface FundData   { current: number; history: FundEntry[] }

interface Props {
  isOperator: boolean;
}

export default function FundDashboard({ isOperator }: Props) {
  const [data, setData]           = useState<FundData | null>(null);
  const [newTotal, setNewTotal]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState("");
  const [error, setError]         = useState("");

  async function load() {
    const res = await fetch("/api/fund");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(newTotal);
    if (isNaN(val)) { setError("Enter a valid number."); return; }
    setSaving(true); setError(""); setSavedMsg("");
    const res = await fetch("/api/fund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total: val }),
    });
    if (res.ok) {
      setData(await res.json());
      setNewTotal("");
      setSavedMsg("Updated successfully.");
      setTimeout(() => setSavedMsg(""), 4000);
    } else {
      setError("Failed to update.");
    }
    setSaving(false);
  }

  if (!data) {
    return (
      <div className="h-48 flex items-center justify-center text-stone-400 text-sm">
        Loading…
      </div>
    );
  }

  // Chart needs at least 2 points to show a line — pad if needed
  const chartData = data.history.length === 1
    ? [{ ...data.history[0], date: "Start" }, data.history[0]]
    : data.history;

  const start = data.history[0]?.total ?? data.current;
  const gain  = data.current - start;
  const gainPct = start > 0 ? (gain / start) * 100 : 0;

  // Format x-axis dates: "Jun 11"
  function fmtDate(d: string) {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return d; }
  }

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-stone-200">
        <StatCell label="Total Value" value={`$${data.current.toLocaleString()}`} large />
        <StatCell
          label="All-Time Gain"
          value={`${gain >= 0 ? "+" : ""}$${gain.toLocaleString()}`}
          sub={`${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%`}
          positive={gain >= 0}
        />
        <StatCell
          label="Inception Date"
          value={fmtDate(data.history[0]?.date ?? "")}
          sub={`${data.history.length} data point${data.history.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Chart */}
      <div className="bg-white border border-stone-200 p-6">
        <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-4 font-sans">
          Fund Total — Historical
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#f0eeec" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a8a29e" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Total"]}
              labelFormatter={fmtDate}
              contentStyle={{
                background: "#fff",
                border: "1px solid #e7e5e4",
                borderRadius: 0,
                fontSize: 12,
                color: "#44403c",
              }}
            />
            <ReferenceLine y={start} stroke="#d6d3d1" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#1c1917"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#1c1917" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="bg-white border border-stone-200">
        <div className="px-5 py-3 border-b border-stone-100">
          <p className="text-xs tracking-[0.15em] uppercase text-stone-400 font-sans">
            History
          </p>
        </div>
        <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
          {[...data.history].reverse().map((h, i) => (
            <div key={i} className="flex justify-between items-center px-5 py-2.5">
              <span className="text-sm text-stone-500 font-sans">{fmtDate(h.date)}</span>
              <span className="font-serif text-stone-800 text-sm fund-number">
                ${h.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Operator update form */}
      {isOperator && (
        <div className="bg-stone-100 border border-stone-200 p-6">
          <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-4 font-sans">
            Update Fund Total
          </p>
          <form onSubmit={handleUpdate} className="flex gap-3 items-start flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <input
                type="number"
                step="0.01"
                value={newTotal}
                onChange={(e) => setNewTotal(e.target.value)}
                placeholder="New total (e.g. 125)"
                className="w-full bg-white border border-stone-200 focus:border-stone-400 outline-none px-3 py-2.5 text-sm text-stone-800 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-stone-900 hover:bg-stone-700 text-stone-50 text-sm px-5 py-2.5 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? "Saving…" : "Submit Update"}
            </button>
          </form>
          {savedMsg && <p className="text-xs text-sage-600 mt-2">{savedMsg}</p>}
          {error   && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <p className="text-xs text-stone-400 mt-3 leading-relaxed">
            Submitting records today&apos;s date alongside the new total in the fund history.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label, value, sub, large, positive,
}: {
  label: string; value: string; sub?: string; large?: boolean; positive?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-1 font-sans">{label}</p>
      <p className={`font-serif fund-number ${large ? "text-3xl" : "text-xl"} text-stone-900`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-0.5 font-sans ${positive === false ? "text-red-500" : positive ? "text-sage-600" : "text-stone-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
