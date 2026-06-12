export interface FundEntry {
  date: string;
  total: number;
}

export interface FundData {
  current: number;
  history: FundEntry[];
}

const DEFAULT: FundData = { current: 118, history: [{ date: "2026-06-11", total: 118 }] };

// On Vercel, KV_REST_API_URL is set automatically when a KV store is linked.
// Locally, falls back to reading data/fund.json from disk.
async function kvGet(): Promise<FundData | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/fund`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.result ? (JSON.parse(json.result) as FundData) : null;
}

async function kvSet(data: FundData): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/fund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(data)),
  });
}

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

function diskSet(data: FundData): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    fs.writeFileSync(path.join(process.cwd(), "data", "fund.json"), JSON.stringify(data, null, 2));
  } catch { /* read-only in production */ }
}

export async function readFundData(): Promise<FundData> {
  return (await kvGet()) ?? diskGet();
}

export async function updateFundTotal(newTotal: number): Promise<FundData> {
  const data = await readFundData();
  const today = new Date().toISOString().split("T")[0];
  const last = data.history[data.history.length - 1];
  if (last?.date === today) {
    last.total = newTotal;
  } else {
    data.history.push({ date: today, total: newTotal });
  }
  data.current = newTotal;
  await kvSet(data);
  diskSet(data);
  return data;
}
