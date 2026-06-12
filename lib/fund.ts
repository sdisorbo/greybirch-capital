import { createClient } from "@supabase/supabase-js";

export interface FundEntry {
  date: string;
  total: number;
}

export interface FundData {
  current: number;
  history: FundEntry[];
}

const DEFAULT: FundData = { current: 118, history: [{ date: "2026-06-11", total: 118 }] };

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function readFundData(): Promise<FundData> {
  const sb = getClient();
  if (!sb) return diskGet();

  const { data, error } = await sb.from("fund").select("date, total").order("id");
  if (error || !data || data.length === 0) return diskGet();

  const history = data.map((r) => ({ date: r.date as string, total: Number(r.total) }));
  return { current: history[history.length - 1].total, history };
}

export async function updateFundTotal(newTotal: number): Promise<FundData> {
  const sb = getClient();
  const today = new Date().toISOString().split("T")[0];

  if (sb) {
    const { data: existing } = await sb.from("fund").select("id").eq("date", today).maybeSingle();
    if (existing) {
      await sb.from("fund").update({ total: newTotal }).eq("date", today);
    } else {
      await sb.from("fund").insert({ date: today, total: newTotal });
    }
  }

  return readFundData();
}

// Local dev fallback
function diskGet(): FundData {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "fund.json"), "utf-8");
    return JSON.parse(raw) as FundData;
  } catch {
    return DEFAULT;
  }
}
