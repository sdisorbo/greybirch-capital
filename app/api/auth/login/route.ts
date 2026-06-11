import { NextRequest, NextResponse } from "next/server";
import { getSession, authenticate } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = authenticate(username ?? "", password ?? "");
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.user = user;
  await session.save();

  return NextResponse.json({ role: user.role });
}
