import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

// Routes that should trigger intelligent routing via cookie
const shouldIntelligentRoute = createRouteMatcher([
  "/",
  "/route",
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
  const response = NextResponse.next();

  // ============================================================================
  // CORS Headers (API routes only)
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
  // Security Headers (all routes)
  // ============================================================================

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // ============================================================================
  // Zero Data Access Enforcement for Restricted/Pending Users
  // ============================================================================
  // Block API access for users with restricted or pending approval status
  // CRITICAL: Platform admins (type='admin') BYPASS all these checks - they own the platform
  if (userId && request.nextUrl.pathname.startsWith("/api")) {
    const allowedPaths = [
      "/api/user/profile",
      "/api/auth/set-role",
      "/api/auth/",
      "/api/setup/",
      "/api/schools/search", // For school search in setup
      "/api/admin/setup-admin", // Platform admin setup endpoint
      "/api/notifications/", // Allow notifications API
      "/api/debug/", // Allow debug endpoints
    ];

    const isAllowedPath = allowedPaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    );

    // Always allow these public pages
    const isPublicPage = [
      "/restricted",
      "/pending-approval",
      "/rejected",
      "/setup/",
    ].some(path => request.nextUrl.pathname.startsWith(path));

    if (!isAllowedPath && !isPublicPage) {
      try {
        console.log("[Middleware] Checking API access for:", request.nextUrl.pathname);
        // Check user's type and onboarding status from database
        // Platform admins bypass ALL restrictions
        const userRecords = await db
          .select({
            type: users.type,
            onboardingStatus: users.onboardingStatus
          })
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);

        if (userRecords.length > 0) {
          const { type, onboardingStatus } = userRecords[0];

          // PLATFORM ADMIN BYPASS: Skip all restrictions for platform admins
          if (type === 'admin') {
            console.log("[Middleware] Platform admin bypass - allowing full access to:", request.nextUrl.pathname);
            // Platform admin has full access - continue to route handler
          }
          // Block access for restricted, pending_approval, and pending_enrollment users
          else if (onboardingStatus === "restricted" ||
                   onboardingStatus === "pending_approval" ||
                   onboardingStatus === "pending_enrollment") {
            return NextResponse.json(
              {
                error: onboardingStatus === "restricted"
                  ? "Complete your profile to access this feature"
                  : "Your application is pending approval",
                redirectTo: onboardingStatus === "restricted" ? "/restricted" : "/pending-approval",
              },
              { status: 403 }
            );
          }

          // Redirect rejected users to rejected page
          else if (onboardingStatus === "rejected") {
            return NextResponse.json(
              {
                error: "Your application was not approved",
                redirectTo: "/rejected",
              },
              { status: 403 }
            );
          }
        }
      } catch (error) {
        // SECURITY: Log database errors without exposing sensitive details
        // Fail-open to prevent middleware from breaking the app
        // In production, consider monitoring these events separately
        const isDevelopment = process.env.NODE_ENV === "development";
        if (isDevelopment) {
          console.error("Middleware database check failed:", error);
        } else {
          // In production, log generic error without exposing internals
          console.error("Middleware: Database check failed for user:", userId?.slice(0, 8) + "...");
        }
      }
    }
  }

  // ============================================================================
  // Cookie-based Intelligent Routing (for root and /route)
  // ============================================================================
  // Check if user has a userType cookie and redirect accordingly
  // ALWAYS verify against database - cookie alone is not trustworthy
  // This prevents loops from stale cookies when DB records are deleted
  if (userId && shouldIntelligentRoute(request)) {
    try {
      const userRecords = await db
        .select({
          type: users.type,
          onboardingStatus: users.onboardingStatus
        })
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (userRecords.length === 0) {
        // No user in database - redirect to setup regardless of cookie
        // Clear any stale cookie
        const redirectResponse = NextResponse.redirect(new URL("/setup/unified", request.url));
        redirectResponse.cookies.delete("userType");
        return redirectResponse;
      }

      const { type, onboardingStatus } = userRecords[0];

      // If user is restricted, pending approval, or pending enrollment, redirect to pending-approval page
      if (onboardingStatus === "restricted" ||
          onboardingStatus === "pending_approval" ||
          onboardingStatus === "pending_enrollment") {
        const redirectResponse = NextResponse.redirect(new URL("/pending-approval", request.url));
        redirectResponse.cookies.delete("userType");
        return redirectResponse;
      }

      // If user exists with valid type, set cookie and redirect to their portal
      if (type) {
        const portalMap: Record<string, string> = {
          student: "/student",
          teacher: "/teacher",
          parent: "/parent",
          counselor: "/counselor",
          "school-admin": "/school-admin",
          admin: "/admin",
          ministry: "/ministry",
        };
        const redirectPath = portalMap[type];
        if (redirectPath && request.nextUrl.pathname !== redirectPath) {
          // Set the cookie for future requests (sync with DB truth)
          const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url));
          redirectResponse.cookies.set("userType", type, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
          return redirectResponse;
        }
      }
    } catch (error) {
      // On database error, fail open and let the page handle routing
      const isDevelopment = process.env.NODE_ENV === "development";
      if (isDevelopment) {
        console.error("[Middleware] Intelligent routing database check failed:", error);
      }
    }
  }

  // ============================================================================
  // HARD PROTECTION - Portal routes require authentication
  // ============================================================================
  // CRITICAL: This MUST come before any other logic to ensure protected routes
  // cannot be accessed without authentication.
  if (isProtectedRoute(request)) {
    if (!userId) {
      // HARD REDIRECT: Immediately redirect to sign-in without loading any page content
      // This prevents the E2E test "authentication bypass" issue
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has pending approval status - redirect to pending page
    // This applies to all portal routes except the pending-approval page itself
    if (!request.nextUrl.pathname.startsWith("/pending-approval")) {
      try {
        const userRecords = await db
          .select({
            onboardingStatus: users.onboardingStatus
          })
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);

        if (userRecords.length > 0) {
          const { onboardingStatus } = userRecords[0];
          // Redirect pending users to pending-approval page
          if (onboardingStatus === "pending_approval" || onboardingStatus === "pending_enrollment") {
            return NextResponse.redirect(new URL("/pending-approval", request.url));
          }
          // Redirect restricted users to setup
          if (onboardingStatus === "restricted") {
            return NextResponse.redirect(new URL("/setup/unified", request.url));
          }
        }
      } catch (error) {
        // On DB error, fail open and let the page handle it
        const isDevelopment = process.env.NODE_ENV === "development";
        if (isDevelopment) {
          console.error("[Middleware] Pending approval check failed:", error);
        }
      }
    }
  }

  // For all routes, return the response with headers
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
