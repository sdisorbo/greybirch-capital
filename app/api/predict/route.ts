/**
 * Local dev proxy — in production Vercel routes /api/predict
 * directly to api/predict.py (this file is never hit on Vercel).
 */
import { NextRequest, NextResponse } from "next/server";

const PREDICTOR_URL = process.env.PREDICTOR_URL;

export async function POST(req: NextRequest) {
  if (!PREDICTOR_URL) {
    // No local predictor configured — return 503 so the UI shows "offline" gracefully
    return NextResponse.json({ error: "PREDICTOR_URL not set for local dev" }, { status: 503 });
  }
  try {
    const res = await fetch(`${PREDICTOR_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      signal: AbortSignal.timeout(8000),
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
