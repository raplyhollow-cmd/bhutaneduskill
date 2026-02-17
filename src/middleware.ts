import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// ============================================================================
// ROUTE PROTECTION
// ============================================================================

// Define protected routes - only these require authentication
const isProtectedRoute = createRouteMatcher([
  "/student(.*)",
  "/teacher(.*)",
  "/parent(.*)",
  "/counselor(.*)",
  "/admin(.*)",
  "/school-admin(.*)",
  "/ministry(.*)",
  "/portal(.*)",
]);

// Portal redirect mapping based on user type
function getPortalForUserType(userType: string | null): string {
  if (!userType) return "/setup/unified";

  const portalMap: Record<string, string> = {
    student: "/student/dashboard",
    teacher: "/teacher/dashboard",
    parent: "/parent/dashboard",
    counselor: "/counselor/dashboard",
    "school-admin": "/school-admin/dashboard",
    admin: "/admin",
    ministry: "/ministry/dashboard",
  };

  return portalMap[userType] || "/setup/unified";
}

// Routes that should trigger intelligent routing
const shouldIntelligentRoute = createRouteMatcher([
  "/",
  "/dashboard",
]);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * Get allowed origins from environment variable
 * Format: comma-separated list of origins
 * Example: http://localhost:3003,https://your-domain.com
 */
function getAllowedOrigins(): string[] {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  if (!allowedOrigins) {
    // Default: localhost for development
    return ["http://localhost:3003", "http://localhost:3000"];
  }
  return allowedOrigins.split(",").map(origin => origin.trim());
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some(allowed => {
    // Allow exact match or subdomain match
    return origin === allowed || origin.endsWith(`.${allowed.replace(/^https?:\/\//, '')}`);
  });
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ============================================================================
  // 0. Intelligent Routing for authenticated users on root/dashboard
  // ============================================================================
  // If authenticated user visits root or /dashboard, route them to their portal
  if (userId && shouldIntelligentRoute(request)) {
    try {
      // Get app URL from environment or use request origin
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("host") || "http://localhost:3003";
      const baseUrl = request.headers.get("x-forwarded-proto")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host") || request.headers.get("host")}`
        : appUrl;

      // Fetch user type from our API
      const apiResponse = await fetch(`${baseUrl}/api/auth/set-role`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const targetUrl = getPortalForUserType(data.userType);

        logger.debug("Intelligent routing", {
          userId,
          userType: data.userType,
          targetUrl,
          pathname,
        });

        // Redirect to appropriate portal
        return NextResponse.redirect(new URL(targetUrl, request.url));
      } else {
        logger.warn("Failed to fetch user type for routing", {
          status: apiResponse.status,
          userId,
        });
        // If API fails, fall through to normal flow
      }
    } catch (error) {
      logger.error("Error during intelligent routing", { error, userId });
      // If routing fails, fall through to normal flow
    }
  }

  // ============================================================================
  // 1. CORS Headers (API routes only)
  // ============================================================================
  if (request.nextUrl.pathname.startsWith("/api")) {
    const origin = request.headers.get("origin");

    // Set CORS headers
    if (isOriginAllowed(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin!);
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    response.headers.set("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // ============================================================================
  // 2. Security Headers (all routes)
  // ============================================================================

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (basic - tighten in production)
  // response.headers.set("Content-Security-Policy",
  //   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  // );

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // ============================================================================
  // 3. Authentication Check (protected routes only)
  // ============================================================================
  if (isProtectedRoute(request)) {
    if (!userId) {
      // Clerk will redirect to sign in automatically
      return;
    }
  }

  // For all public routes, return the response with headers
  return response;
});

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    // Match all paths except:
    // - _next (Next.js internals)
    // - static files (images, fonts, etc.)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Include API routes
    "/(api|trpc)(.*)",
  ],
};
