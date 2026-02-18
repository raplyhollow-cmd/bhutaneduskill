import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  // Authentication Check (protected routes only)
  // ============================================================================
  if (isProtectedRoute(request)) {
    if (!userId) {
      // Clerk will redirect to sign in automatically
      return;
    }
  }

  // For all routes, return the response with headers
  // Note: Intelligent routing moved to client-side (dashboard page) to prevent Vercel timeouts
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
