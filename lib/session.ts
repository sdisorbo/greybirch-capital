import { getIronSession, IronSessionData } from "iron-session";
import { cookies } from "next/headers";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      role: "operator" | "investor";
      username: string;
    };
  }
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || "greybirch-capital-secret-key-32ch",
  cookieName: "greybirch_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  return getIronSession<IronSessionData>(await cookies(), sessionOptions);
}

// Hardcoded users — extend as needed
const USERS: Record<string, { password: string; role: "operator" | "investor" }> = {
  greybirch: { password: "greybirch1", role: "operator" },
  investor:  { password: "greybirch1", role: "investor" },
};

export function authenticate(username: string, password: string) {
  const user = USERS[username.toLowerCase()];
  if (!user || user.password !== password) return null;
  return { username: username.toLowerCase(), role: user.role };
}
