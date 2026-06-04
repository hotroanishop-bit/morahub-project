import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // ========== CORS PREFLIGHT ==========
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ========== PUBLIC ROUTES ==========
  const publicRoutes = ["/", "/login", "/register", "/pricing", "/docs"];
  const publicApiRoutes = [
    "/api/auth",
    "/api/plans",
    "/api/models",
    "/api/v1/models",
    "/api/telegram/webhook",
    "/api/announcements",
  ];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route));

  // ========== SECURITY HEADERS (ALL RESPONSES) ==========
  const response = NextResponse.next();

  // CORS
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ckey.vn https://api.telegram.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  // ========== API ROUTES ==========
  if (pathname.startsWith("/api/")) {
    // Check session cookie for non-public API routes
    if (!isPublicApi) {
      const sessionToken =
        request.cookies.get("__Secure-authjs.session-token")?.value ||
        request.cookies.get("authjs.session-token")?.value;

      if (!sessionToken && !pathname.startsWith("/api/v1/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return response;
  }

  // ========== PAGE ROUTES ==========
  if (isPublicRoute || isPublicApi) {
    return response;
  }

  // Check session cookie
  const sessionToken =
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
