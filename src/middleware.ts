import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "guide_session";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    response.cookies.set(SESSION_COOKIE, token.slice(0, 48), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
