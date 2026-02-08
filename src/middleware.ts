import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes - no authentication required
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

// Role-specific route matchers
const isStudentRoute = createRouteMatcher(["/student/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);
const isParentRoute = createRouteMatcher(["/parent/(.*)"]);
const isCounselorRoute = createRouteMatcher(["/counselor/(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin/(.*)"]);

// Legacy route matchers (for backward compatibility during migration)
const isDashboardRoute = createRouteMatcher(["/dashboard/(.*)"]);
const isPortalRoute = createRouteMatcher(["/portal/(.*)"]);

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

  // Check if user is trying to access their correct portal
  // For now, we'll store user type in a cookie and redirect accordingly
  // This will be enhanced with proper database lookup

  // If accessing legacy routes, check if we should redirect to new routes
  if (isDashboardRoute(request) || isPortalRoute(request)) {
    const userType = request.cookies.get("userType")?.value;

    if (userType) {
      let newPath = pathname;

      // Convert legacy path to new portal path
      if (pathname.startsWith("/dashboard")) {
        const rest = pathname.slice("/dashboard".length);
        newPath = `/${userType}${rest || "/dashboard"}`;
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
  }

  // Role-based access control
  // This will be enhanced with database lookup
  const userType = request.cookies.get("userType")?.value;

  // Prevent cross-portal access
  if (userType) {
    if (isStudentRoute(request) && userType !== "student") {
      return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
    }
    if (isTeacherRoute(request) && userType !== "teacher") {
      return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
    }
    if (isParentRoute(request) && userType !== "parent") {
      return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
    }
    if (isCounselorRoute(request) && userType !== "counselor") {
      return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
    }
    if (isAdminRoute(request) && userType !== "admin") {
      return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
    }
  }

  return;
});
