import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes - only these require authentication
const isProtectedRoute = createRouteMatcher([
  "/student(.*)",
  "/teacher(.*)",
  "/parent(.*)",
  "/counselor(.*)",
  "/admin(.*)",
  "/school-admin(.*)",
  "/portal(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Only check auth for protected routes
  // All other routes (/, /dashboard, /about, etc.) are public
  if (isProtectedRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      // Clerk will redirect to sign in automatically
      return;
    }
  }
  // For all public routes, just return without any auth check
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
