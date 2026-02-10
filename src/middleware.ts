import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",
  "/api/assessments/riasec", // For demo purposes
]);

// ============================================================================
// ROLE-BASED ROUTE MATCHERS
// ============================================================================

const isStudentRoute = createRouteMatcher(["/student/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);
const isParentRoute = createRouteMatcher(["/parent/(.*)"]);
const isCounselorRoute = createRouteMatcher(["/counselor/(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin/(.*)"]);
const isSchoolAdminRoute = createRouteMatcher(["/school-admin/(.*)"]);

// Legacy route matchers (for backward compatibility during migration)
const isDashboardRoute = createRouteMatcher(["/dashboard/(.*)"]);
const isPortalRoute = createRouteMatcher(["/portal/(.*)"]);

// ============================================================================
// MIDDLEWARE
// ============================================================================

export default clerkMiddleware(async (auth, request) => {
  const { userId } = auth();

  // For public routes, let them through
  if (isPublicRoute(request)) {
    return;
  }

  // Not authenticated - Clerk will handle redirect
  if (!userId) {
    return;
  }

  const { pathname } = request.nextUrl;

  // ========================================================================
  // SERVER-SIDE ROLE VALIDATION (Security fix for cookie manipulation)
  // ========================================================================

  try {
    // Lazy load auth-utils to avoid edge runtime issues with better-sqlite3
    const { getUserRole, validateRouteAccess, logAuthEvent, getDashboardForRole } = await import("@/lib/auth-utils");

    // Get user's actual role from database (not from cookies)
    const roleInfo = await getUserRole(userId);

    // Validate route access based on user's actual role
    const accessValidation = validateRouteAccess(pathname, userRole);

    if (!accessValidation.allowed) {
      // User is trying to access a route they don't have permission for
      logAuthEvent('unauthorized_access', {
        clerkUserId: userId,
        actualRole: userRole,
        pathname,
      });

      // Redirect to their proper dashboard
      const redirectPath = accessValidation.redirectPath || getDashboardForRole(userRole);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // ========================================================================
    // LEGACY ROUTE HANDLING (Migration support)
    // ========================================================================

    // If accessing legacy routes, check if we should redirect to new routes
    if (isDashboardRoute(request) || isPortalRoute(request)) {
      let newPath = pathname;

      // Convert legacy path to new portal path based on user's actual role
      if (pathname.startsWith("/dashboard")) {
        const rest = pathname.slice("/dashboard".length);
        newPath = `/${userRole}${rest || "/dashboard"}`;
      } else if (pathname.startsWith("/portal/student")) {
        newPath = pathname.replace("/portal/student", "/student");
      } else if (pathname.startsWith("/portal/teacher")) {
        newPath = pathname.replace("/portal/teacher", "/teacher");
      } else if (pathname.startsWith("/portal/parent")) {
        newPath = pathname.replace("/portal/parent", "/parent");
      } else if (pathname.startsWith("/portal/counselor")) {
        newPath = pathname.replace("/portal/counselor", "/counselor");
      }

      if (newPath !== pathname) {
        const url = request.nextUrl.clone();
        url.pathname = newPath;
        return NextResponse.redirect(url);
      }
    }

    // ========================================================================
    // CROSS-PORTAL ACCESS PREVENTION
    // ========================================================================

    // Additional check: Prevent students from accessing teacher routes, etc.
    // This is defense-in-depth beyond the validateRouteAccess check above
    if (isStudentRoute(request) && userRole !== "student") {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
    if (isTeacherRoute(request) && userRole !== "teacher") {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
    if (isParentRoute(request) && userRole !== "parent") {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
    if (isCounselorRoute(request) && !["counselor", "admin"].includes(userRole)) {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
    if (isAdminRoute(request) && userRole !== "admin") {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
    if (isSchoolAdminRoute(request) && userRole !== "school-admin") {
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }

  } catch (error) {
    // If database query fails, log but don't block access
    // This prevents database issues from breaking the entire app
    console.error('[Middleware] Role validation error:', error);
  }

  return;
});

// ============================================================================
// CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  // Note: runtime: "nodejs" removed to allow Next.js to auto-detect
  // This improves compatibility with Next.js 16.1.6 and Turbopack
};
