import fs from "fs";
import path from "path";

export interface FundEntry {
  date: string;
  total: number;
}

export interface FundData {
  current: number;
  history: FundEntry[];
}

const DATA_PATH = path.join(process.cwd(), "data", "fund.json");

export function readFundData(): FundData {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as FundData;
}

export function writeFundData(data: FundData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function updateFundTotal(newTotal: number): FundData {
  const data = readFundData();
  const today = new Date().toISOString().split("T")[0];
  const last = data.history[data.history.length - 1];

  if (last?.date === today) {
    last.total = newTotal;
  } else {
    data.history.push({ date: today, total: newTotal });
  }
  data.current = newTotal;
  writeFundData(data);
  return data;
}
