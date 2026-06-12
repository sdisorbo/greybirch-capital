import { NextRequest, NextResponse } from "next/server";
import { getSession, authenticate } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const user = authenticate(username ?? "", password ?? "");
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.user = user;
    await session.save();

    return NextResponse.json({ role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
