import { NextRequest, NextResponse } from "next/server";
import { readFundData, updateFundTotal } from "@/lib/fund";
import { getSession } from "@/lib/session";

export async function GET() {
  const data = await readFundData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.user?.role !== "operator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { total } = await req.json();
  if (typeof total !== "number" || isNaN(total)) {
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  }

  const updated = await updateFundTotal(total);
  return NextResponse.json(updated);
}
