import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/operator"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected  = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const cookie = req.cookies.get("greybirch_session");
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/operator/:path*"],
};
