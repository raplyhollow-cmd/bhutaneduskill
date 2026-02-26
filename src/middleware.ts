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
  // They can only access specific endpoints needed for setup
  if (userId && request.nextUrl.pathname.startsWith("/api")) {
    const allowedPaths = [
      "/api/user/profile",
      "/api/auth/set-role",
      "/api/auth/",
      "/api/setup/",
      "/api/schools/search", // For school search in setup
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
        // Check user's onboarding status from database
        const userRecords = await db
          .select({ onboardingStatus: users.onboardingStatus })
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);

        if (userRecords.length > 0) {
          const { onboardingStatus } = userRecords[0];

          // Block access for restricted and pending_approval users
          if (onboardingStatus === "restricted" || onboardingStatus === "pending_approval") {
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
          if (onboardingStatus === "rejected") {
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
  // This avoids API calls during build time which caused Vercel timeouts
  if (userId && shouldIntelligentRoute(request)) {
    const userTypeCookie = request.cookies.get("userType")?.value;
    if (userTypeCookie) {
      // User has a userType cookie - redirect to their portal
      const portalMap: Record<string, string> = {
        student: "/student",
        teacher: "/teacher",
        parent: "/parent",
        counselor: "/counselor",
        "school-admin": "/school-admin",
        admin: "/admin",
        ministry: "/ministry",
      };
      const redirectPath = portalMap[userTypeCookie];
      if (redirectPath && request.nextUrl.pathname !== redirectPath) {
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
    // If no userType cookie, let the page handle routing (via /api/auth/set-role)
  }

  // ============================================================================
  // Authentication Check (protected routes only)
  // ============================================================================
  if (isProtectedRoute(request)) {
    if (!userId) {
      // Clerk will redirect to sign in automatically
      return;
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
