# Hooks Error Fix - "Rendered more hooks than during the previous render"

**Date Fixed:** February 22, 2026
**Error:** `Rendered more hooks than during the previous render`
**Location:** Next.js app-router internals (app-router.tsx:207)

## Root Cause

The error was caused by **server-side layouts with early redirects** that changed the component tree structure between renders:

```tsx
// ❌ WRONG - Causes hooks mismatch
export default async function SomeLayout({ children }) {
  const authResult = await requireAuth(['some-role']);
  const { user } = authResult;

  // Early return changes component tree!
  if (!user.onboardingComplete) {
    redirect("/setup/some-role");  // No client component rendered
  }

  // Different render path = different hook count
  return <LayoutClient {...props} />;
}
```

When React renders:
1. First pass: Server checks auth, redirects, returns nothing
2. Second pass: After redirect, different component tree loads
3. **Result:** Different hook counts between renders → Error

## The Fix

Always render the same component structure, handle redirects in client-side `useEffect`:

```tsx
// ✅ CORRECT - Same structure every render
export default async function SomeLayout({ children }) {
  const authResult = await requireAuth(['some-role']);
  const { user } = authResult;

  // Pass state to client, never return early
  const needsSetup = !user.onboardingComplete;

  // ALWAYS render the same component
  return <LayoutClient needsSetup={needsSetup} {...otherProps} />;
}
```

Then handle redirect in client component:

```tsx
// ✅ Client-side redirect (inside useEffect)
export function LayoutClient({ needsSetup, ...props }) {
  const router = useRouter();

  useEffect(() => {
    if (needsSetup) {
      router.push("/setup/some-role");
      return;
    }
  }, [needsSetup, router]);

  // Always render same structure
  return <div>{children}</div>;
}
```

## Files Modified

### Server Layouts (removed early returns)
- `src/app/school-admin/layout.tsx`
- `src/app/teacher/layout.tsx`
- `src/app/student/layout.tsx`
- `src/app/counselor/layout.tsx`
- `src/app/ministry/layout.tsx`

### Client Components (added needsSetup prop)
- `src/app/school-admin/school-admin-layout-client.tsx`
- `src/app/teacher/teacher-layout-client.tsx`
- `src/app/student/student-layout-client.tsx`
- `src/app/counselor/counselor-layout-client.tsx`
- `src/app/ministry/ministry-layout-client.tsx`

### AnimatePresence Removed
- `src/components/mobile/universal-mobile-sidebar.tsx` - Removed `AnimatePresence` which was causing hook count changes

## Related Issues

### School Admin Approval Loop

School admins also had a secondary issue: `onboardingComplete` was being set back to `false` by `/api/setup/complete` because they need platform admin approval.

**Solution:** Added `isPendingApproval` prop to distinguish between:
- `needsSetup` - User hasn't completed wizard
- `isPendingApproval` - User completed wizard, awaiting approval

## Debug API Created

For testing, created debug endpoints:
- `/api/debug/fix-onboarding` - Manually set `onboardingComplete: true`
- `/api/debug/approve-school-admin` - Approve pending school admin applications

**Remember:** Remove these debug endpoints before production!

## Key Takeaway

> **React's Rules of Hooks:** Hooks must be called in the same order on every render.
>
> When using Next.js server components + client components:
> - **Never** return early from a server layout based on auth state
> - **Always** render the same client component structure
> - Handle redirects inside `useEffect` in client components
> - Avoid `AnimatePresence` with conditional children that change structure
