// frontend/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const userRoleRaw = req.cookies.get("userRole")?.value;
  const userRole = userRoleRaw?.toLowerCase();
  const { pathname, search } = req.nextUrl; // Get search params too

  console.log("🔍 Middleware check:", {
    pathname,
    search, // Log search params
    hasAccessToken: !!accessToken,
    userRole,
    cookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  });

  // ========== UNAUTHENTICATED ROUTE BLOCK ==========
  const protectedRoutes = ["/dashboard/explorer", "/dashboard/influencer"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  
  if (!accessToken && isProtectedRoute) {
    console.log("🚫 Redirecting to login - no access token");
    const loginUrl = new URL("/login", req.url);
    // Preserve the intended destination with query params
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // ========== ROLE-BASED GUARD ==========
  // Only apply role-based redirects if user is authenticated
  if (accessToken && userRole) {
    if (pathname.startsWith("/dashboard/explorer") && userRole !== "explorer") {
      console.log("🔄 Redirecting explorer route to influencer dashboard");
      const redirectUrl = new URL("/dashboard/influencer/live", req.url);
      // Preserve query parameters when redirecting
      redirectUrl.search = search;
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/dashboard/influencer") && userRole !== "influencer") {
      console.log("🔄 Redirecting influencer route to explorer dashboard");
      const redirectUrl = new URL("/dashboard/explorer/live", req.url);
      // Preserve query parameters when redirecting
      redirectUrl.search = search;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ========== REVERSE GUARD (ALREADY LOGGED IN) ==========
  const unauthenticatedPages = ["/login", "/explorer/sign-up", "/influencer/sign-up"];
  const isOnUnauthPage = unauthenticatedPages.some((unauth) =>
    pathname.startsWith(unauth)
  );

  if (accessToken && userRole && isOnUnauthPage) {
    console.log("🔄 Redirecting authenticated user to dashboard");
    const redirectUrl = new URL(`/dashboard/${userRole}/live`, req.url);
    // Don't preserve query params for this redirect as they might not be relevant
    return NextResponse.redirect(redirectUrl);
  }

  // ========== HANDLE MISSING USER ROLE ==========
  // If user has access token but no role, they might need to complete registration
  if (accessToken && !userRole && isProtectedRoute) {
    console.log("⚠️ User has token but no role - redirecting to login");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  console.log("✅ Middleware passed - continuing to route");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/explorer/sign-up",
    "/influencer/sign-up",
  ],
};