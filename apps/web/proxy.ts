import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for session token (better-auth usually uses "better-auth.session_token")
  // Or checking for the cookie presence is a fast initial check for middleware
  const tokenKey = process.env.NODE_ENV === "production" ? "__Secure-better-auth.session_token" : "better-auth.session_token"
  const sessionToken = request.cookies.get(tokenKey);

  // 1. Protected Routes: /dashboard, /code (except public assets if any)
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/code");
  
  if (isProtectedRoute && !sessionToken) {
    // If accessing protected route without session, redirect to signin
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // 2. Auth Routes: Redirect to dashboard if already logged in
  // Landing page "/" is also treated as an auth route here per user request
  // "when the user is signed in they should automatically land on /dashboard and make sure that if the user is authenticated they should not be able to go back on / landing page"
  const isAuthRoute = pathname === "/" || pathname === "/signin" || pathname === "/signup";

  if (isAuthRoute && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
