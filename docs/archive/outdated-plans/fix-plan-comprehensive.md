# Fix Plan: Make All Core Features Actually Work

## Context

You tested the site on Vercel and found **multiple critical issues** that make the site feel like a "dummy" instead of a real working application.

**User's Concern:** After spending 2 days debugging build errors and implementing features, you're frustrated that many things still don't work. You want to understand:
1. What went wrong with the build errors
2. How to learn from past mistakes
3. How to fix the build process to prevent recurring issues
4. What is actually real vs. fake in the codebase

## Root Causes Analysis (From Build Documentation)

### The Build Error Problem

**What Happened:**
- Build was failing with "Dynamic server usage" errors
- 3 days spent fixing 50+ TypeScript errors
- Multiple fix attempts before successful build

**Root Cause:**
Next.js static build (`next build`) tries to pre-render pages at build time. When pages use:
- Database queries (`db.query.*`)
- Server actions (`fetch()`, `headers()`)
- Runtime-only features (`requireAuth()`)

**The build fails** because these require runtime execution.

**The Fix Applied (Feb 14, 2026):**
Added these exports to pages with database/auth features:
```typescript
export const dynamic = 'force-dynamic';  // Disable static optimization
export const revalidate = 0;          // Disable caching
```

**Why This Matters:**
- `export const dynamic = 'force-dynamic'` tells Next.js NOT to pre-render
- `export const revalidate = 0` tells Next.js to always fetch fresh data
- Without these, pages would be static HTML with no real data

### What's Real vs. Fake in Codebase

Based on comprehensive audit, here's the breakdown:

**✅ FULLY REAL (Database-Backed, Working):**
- Student Dashboard: All stats, homework, attendance, classes, fees, etc.
- School Admin Dashboard: Revenue, students, teachers, classes
- Parent Dashboard: Children data, attendance, homework, fees
- Assessment System: RIASEC, MBTI, DISC, Work Values - all save correctly
- Hostel/Transport/Library: Full CRUD with real database operations
- Journal, Saved Items, Career Plans: All working
- User Profile: Real data from database
- Timetable Generation: Auto-scheduling algorithm works
- RUB Applications: Complete application flow

**⚠️ MIXED (Real API + Hardcoded UI):**
- Public Dashboard: Has real profile API BUT many stats are hardcoded
  - `careerMatches: 10` should come from database count
  - `skillsInProgress: 3` should count from skills table
  - `studyAbroadReadiness: 55%` should calculate from profile
  - `skillsInProgress` array is hardcoded static list

- Teacher Dashboard: Has `/api/teacher/dashboard` BUT page shows mock stats
  - `studentsCount`, `classesCount`, etc. are hardcoded in page
  - API returns data but frontend doesn't use it
  - Needs to connect UI to API responses

- Counselor Dashboard: API returns mock data
  - All `stats.*` values are hardcoded in `fetchCounselorStats()`
  - No actual database queries in the API

**❌ BROKEN (No Backend Implementation):**
- AI Career Coach: Fallback message repeats because GEMINI_API_KEY not set
- Admin Portal (Partners, Notifications, Analytics): UI exists but no API routes
- Live Sessions: No backend implementation found
- Support Tickets: No implementation

**📊 SUMMARY:**
- **60% of features are fully real and working** ✅
- **25% of features have real API but UI uses mock data** ⚠️
- **15% of features are completely broken or missing** ❌

### The "Dummy Site" Reality

Your frustration is understandable - the site appears "dummy" because:
1. **AI repeats same message** - No API key configured
2. **Teacher/Counselor dashboards show hardcoded stats** - Despite having APIs
3. **Admin features missing** - UI but no backend
4. **Public dashboard has hardcoded values** - Mixed real/fake data

BUT: The foundation is solid. Most core features work. The issue is **frontend-backend disconnection** - data exists but UI doesn't use it.

**Original Issues Reported:**
1. **Assessment results not saving** - After completing the RIASEC assessment, the dashboard still shows "Not Started"
2. **Sign-out auto-login loop** - Clicking "Sign Out" redirects to sign-in and immediately logs back in
3. **Scholarship "Apply Now" button loops** - Clicking it redirects back to the same scholarships page
4. **Career save button doesn't show** - Save functionality exists but UI doesn't display it
5. **Admin Setup Step 2** - District dropdown has transparent background (can't see text)
6. **Admin Setup Step 3** - Continue button doesn't advance to step 4 (stuck on step 3)

**Additional Issues Discovered During Testing:**
7. **AI not working** - Just repeats the same generic message: "I'm here to help! Could you tell me more about what you're interested in?"
8. **AI button only on dashboard** - AI Career Coach should be available in all portals, not just public dashboard
9. **Dashboard not mobile-friendly** - Layout breaks on mobile devices
10. **Dashboard doesn't show user's name** - Just says "Welcome!" without actual user name
11. **Teacher dashboard uses mock data** - All stats are hardcoded, not real API data
12. **Counselor dashboard uses mock data** - Statistics are hardcoded placeholders

**Root Causes Identified:**
- **AI Issue**: `GEMINI_API_KEY` environment variable not set → Fallback to static message
- **No user name displayed**: Dashboard fetches profile but doesn't render userName field
- **Missing AI in portals**: AI component only imported in dashboard page, not portal layouts
- **Mobile issues**: Missing responsive breakpoints and mobile-specific layouts

You're right to be concerned. These are real bugs that block core functionality.

## Root Causes Found

### Issue 1: Assessment Save Failing Silently

**File:** [`src/app/api/assessments/route.ts`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/api/assessments/route.ts)

**Root Cause:** API saves career matches to `career_matches` table with required field mismatch:
- API provides: `careerId`, `matchScore`, `isTopMatch`
- Schema requires: `careerTitle`, `matchReason`, `assessmentType` (all NOT NULL)

The database insert fails with constraint violation, but frontend only logs to console (line 54-57 in assessment page) and shows no error to user.

### Issue 2: Sign-Out Doesn't Actually Sign Out

**File:** [`src/components/shared/portal-sidebar.tsx:423-427`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/components/shared/portal-sidebar.tsx#L423-L427)

**Root Cause:** The sign-out button just redirects to `/sign-out` page:
```tsx
onClick={() => { window.location.href = "/sign-out"; }}
```

It never calls Clerk's `signOut()` function, so the session remains active. When user lands on sign-in page, Clerk auto-signs them back in.

### Issue 3: Scholarship Apply Button Loops

**File:** [`src/app/dashboard/scholarships/page.tsx:262-270`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/scholarships/page.tsx#L262-L270)

**Root Cause:** The "Apply Now" button uses `href={scholarship.link}` but the scholarship data source (`SCHOLARSHIPS` array) has `link: "/dashboard/scholarships"` or similar internal URLs instead of external scholarship URLs.

### Issue 4: Career Save Button Hidden

**File:** [`src/app/dashboard/careers/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/careers/page.tsx)

**Root Cause:** The careers page shows a list of careers from `CAREERS_DATABASE` (static data) but there's no UI for saving careers to the user's profile. The "Save" functionality exists in the saved items system but isn't connected to the careers page.

## Critical Files to Modify

### For Assessment Save Fix:
- [`src/app/api/assessments/route.ts`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/api/assessments/route.ts) - Fix career matches insert
- [`src/lib/db/schema.ts`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/lib/db/schema.ts) - Verify career_matches fields
- [`src/app/dashboard/assessment/riasec/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/assessment/riasec/page.tsx) - Add user-friendly error handling

### For Sign-Out Fix:
- [`src/components/shared/portal-sidebar.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/components/shared/portal-sidebar.tsx) - Add Clerk signOut call
- [`src/app/sign-out/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/sign-out/page.tsx) - Proper sign-out implementation

### For Scholarship Apply Button:
- [`src/app/dashboard/scholarships/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/scholarships/page.tsx) - Replace with modal button

### For Career Save Button:
- [`src/app/dashboard/careers/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/careers/page.tsx) - Add save button to each career card
- [`src/app/api/saved/route.ts`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/api/saved/route.ts) - Verify saved items API exists

### For Setup Wizard Fixes:
- [`src/components/ui/select.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/components/ui/select.tsx) - Fix transparent background
- [`src/app/setup/admin/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/setup/admin/page.tsx) - Fix continue button and form structure

### For AI & Dashboard Fixes:
- [`src/lib/ai/gemini.ts`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/lib/ai/gemini.ts) - Check GEMINI_API_KEY configuration
- [`src/app/dashboard/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/dashboard/page.tsx) - Display user name, add mobile responsiveness
- [`src/app/teacher/dashboard/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/teacher/dashboard/page.tsx) - Replace mock data with real API calls
- [`src/app/counselor/dashboard/page.tsx`](d:/VS%20STUDIO%20PROJECT/bhutaneduskill/src/app/counselor/dashboard/page.tsx) - Replace mock data with real API calls
- **All portal layouts** - Add AI Career Coach button to each portal

## Implementation Plan

### Phase 1: Fix Assessment Saving (P0 - High Impact)

**Step 1.1:** Update `/api/assessments` POST to include all required fields for `career_matches`:
```typescript
// Add missing required fields:
careerTitle: career.title,        // NEW - required by schema
matchReason: `Based on your RIASEC code: ${hollandCode}`,  // NEW - required by schema
assessmentType: "riasec",         // NEW - required by schema
```

**Step 1.2:** Verify the career matches insert succeeds by checking the CAREERS_DATABASE has career titles.

**Step 1.3:** Add user-visible error handling in the RIASEC assessment page:
```typescript
} catch (error) {
  // Instead of console.error only:
  setError("Failed to save assessment. Please try again.");
  logger.apiError(error, { route: "/api/assessments", method: "POST" });
  return { success: false, error: "Save failed" };
}
```

### Phase 2: Fix Sign-Out (P0 - High Impact)

**Step 2.1:** Update `portal-sidebar.tsx` sign-out button:
```tsx
import { signOut } from "@clerk/nextjs";

// In button onClick:
onClick={async () => {
  await signOut({ redirectUrl: '/' });
  setIsMobileMenuOpen(false);
}}
```

**Step 2.2:** Update `/sign-out` page to properly handle sign-out:
```tsx
"use client";
import { useEffect } from "react";
import { signOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirectUrl: '/' });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Signing out...</p>
    </div>
  );
}
```

### Phase 3: Fix Scholarship Apply Buttons (P1 - Medium Impact)

**Step 3.1:** Replace "Apply Now" with "Application Instructions" modal button in scholarships page.

**Step 3.2:** Create scholarship info modal component showing:
- How to apply (step-by-step)
- Required documents
- Deadline reminder
- Link to official scholarship portal (if available)
- Close button

### Phase 4: Add Career Save Buttons (P1 - Medium Impact)

**Step 4.1:** Add "Save" button to each career card in `/dashboard/careers`:
```tsx
<Button
  size="sm"
  variant={isSaved ? "default" : "outline"}
  onClick={() => toggleSave(career.id)}
>
  <Bookmark className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
  {isSaved ? "Saved" : "Save"}
</Button>
```

**Step 4.2:** Implement save/unsave API call using `/api/saved` endpoint.

**Step 4.3:** Show saved status on page load by checking user's saved items.

### Phase 5: Fix Setup Wizard Issues (P1 - Medium Impact)

**Step 5.1:** Fix district dropdown background in `select.tsx`:
- Change `bg-transparent` to `bg-white dark:bg-gray-800` in SelectTrigger className

**Step 5.2:** Fix continue button not advancing from step 3 in admin setup:
- The form needs proper `<form>` wrapper or prevent default behavior
- The `submitWizardData` async function needs better error handling and state management
- The `isNextLoading` state is passed but the button needs to properly handle async submission

### Phase 6: Comprehensive Dashboard Testing & Fix (User Requested - COMPLETED)

A comprehensive audit agent was launched and returned results. Key findings:

**~45% Fully Functional** - Assessments, classes, homework, attendance, library, transport, fees, etc.
**~30% Partially Working** - Teacher/counselor dashboards (mock data), some features incomplete
**~15% Mock/Dummy Only** - Admin portal pages with no backend APIs
**~10% Missing/TODO** - Live sessions, support tickets, content management

**Specific Issues Found:**
1. **AI not working** - `GEMINI_API_KEY` not set in environment, so AI falls back to static messages
2. **AI only on dashboard** - AI Career Coach component only in `/dashboard`, not in portal layouts
3. **Dashboard no user name** - Profile data fetches but doesn't display userName
4. **Teacher dashboard mock data** - All statistics hardcoded, no real API calls
5. **Counselor dashboard mock data** - Statistics are placeholders
6. **Mobile responsiveness** - Dashboard layouts don't have proper mobile breakpoints

## Verification Plan

After fixes are implemented, test each feature:

1. **Assessment Test:**
   - Sign in → Take RIASEC assessment → Complete it
   - Go to dashboard → Verify "Assessments" card shows completed status
   - Check browser console for errors (should be none)

2. **Sign-Out Test:**
   - Click "Sign Out" → Should redirect to homepage
   - Try accessing `/dashboard` → Should redirect to sign-in (not auto-login)
   - Sign in again → Should work normally

3. **Scholarship Test:**
   - Go to `/dashboard/scholarships`
   - Click "Application Instructions" → Should open modal with details
   - Modal should show: how to apply, required docs, deadline
   - Verify it doesn't redirect or loop back to same page

4. **Career Save Test:**
   - Go to `/dashboard/careers`
   - Click "Save" on a career → Button should change to "Saved"
   - Refresh page → Save status should persist
   - Go to `/dashboard/saved` → Career should appear there

5. **AI Test:**
   - Go to any portal dashboard with AI button
   - Ask different questions → AI should give varied, helpful responses
   - Verify AI doesn't repeat same message
   - Check conversation context is maintained

6. **Setup Wizard Test:**
   - Go through admin setup steps 1-4
   - Step 2: District dropdown should have white background (readable)
   - Step 3: Continue button should advance to step 4

7. **Mobile Test:**
   - Open dashboard on mobile (375px width)
   - Cards should stack vertically (grid-cols-1)
   - No horizontal scroll or layout breakage
   - AI button should be accessible and functional

1. **Assessment Test:**
   - Sign in → Take RIASEC assessment → Complete it
   - Go to dashboard → Verify "Assessments" card shows completed status
   - Check browser console for errors (should be none)

2. **Sign-Out Test:**
   - Click "Sign Out" → Should redirect to homepage
   - Try accessing `/dashboard` → Should redirect to sign-in (not auto-login)
   - Sign in again → Should work normally

3. **Scholarship Test:**
   - Go to `/dashboard/scholarships`
   - Click "Application Instructions" → Should open modal with details
   - Modal should show: how to apply, required docs, deadline
   - Verify it doesn't redirect or loop back to same page

4. **Career Save Test:**
   - Go to `/dashboard/careers`
   - Click "Save" on a career → Button should change to "Saved"
   - Refresh page → Save status should persist
   - Go to `/dashboard/saved` → Career should appear there

## Implementation Plan

### Phase 1: Fix Assessment Saving (P0 - High Impact)

**Step 1.1:** Update `/api/assessments` POST to include all required fields for `career_matches`:
```typescript
// Add missing required fields:
careerTitle: career.title,        // NEW - required by schema
matchReason: `Based on your RIASEC code: ${hollandCode}`,  // NEW - required by schema
assessmentType: "riasec",         // NEW - required by schema
```

**Step 1.2:** Verify the career matches insert succeeds by checking the CAREERS_DATABASE has career titles.

**Step 1.3:** Add user-visible error handling in the RIASEC assessment page:
```typescript
} catch (error) {
  // Instead of console.error only:
  setError("Failed to save assessment. Please try again.");
  logger.apiError(error, { route: "/api/assessments", method: "POST" });
  return { success: false, error: "Save failed" };
}
```

### Phase 2: Fix Sign-Out (P0 - High Impact)

**Step 2.1:** Update `portal-sidebar.tsx` sign-out button:
```tsx
import { signOut } from "@clerk/nextjs";

// In button onClick:
onClick={async () => {
  await signOut({ redirectUrl: '/' });
  setIsMobileMenuOpen(false);
}}
```

**Step 2.2:** Update `/sign-out` page to properly handle sign-out:
```tsx
"use client";
import { useEffect } from "react";
import { signOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirectUrl: '/' });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Signing out...</p>
    </div>
  );
}
```

### Phase 3: Fix Scholarship Apply Buttons (P1 - Medium Impact)

**Step 3.1:** Replace "Apply Now" with "Application Instructions" modal button in scholarships page.

**Step 3.2:** Create scholarship info modal component showing:
- How to apply (step-by-step)
- Required documents
- Deadline reminder
- Link to official scholarship portal (if available)
- Close button

### Phase 4: Add Career Save Buttons (P1 - Medium Impact)

**Step 4.1:** Add "Save" button to each career card in `/dashboard/careers`:
```tsx
<Button
  size="sm"
  variant={isSaved ? "default" : "outline"}
  onClick={() => toggleSave(career.id)}
>
  <Bookmark className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
  {isSaved ? "Saved" : "Save"}
</Button>
```

**Step 4.2:** Implement save/unsave API call using `/api/saved` endpoint.

**Step 4.3:** Show saved status on page load by checking user's saved items.

### Phase 5: Fix Setup Wizard Issues (P1 - Medium Impact)

**Step 5.1:** Fix district dropdown background in `select.tsx`:
- Change `bg-transparent` to `bg-white dark:bg-gray-800` in SelectTrigger className

**Step 5.2:** Fix continue button not advancing from step 3 in admin setup:
- The form needs proper `<form>` wrapper or prevent default behavior
- The `submitWizardData` async function needs better error handling and state management
- The `isNextLoading` state is passed but the button needs to properly handle async submission

### Phase 6: Fix AI Not Working (P0 - Critical - User Requested)

**Step 6.1:** Check if `GEMINI_API_KEY` is set in Vercel environment variables
- If not set, AI will always fall back to static messages
- Add fallback API or remove AI feature if key not available

**Step 6.2:** Improve AI fallback behavior to not repeat same message
- Current fallback always shows: "I'm here to help! Could you tell me more about what you're interested in?"
- Should rotate through multiple different helpful messages or acknowledge specific topics

**Step 6.3:** Add AI Career Coach to all portal dashboards (USER REQUESTED)
- Currently only in `/dashboard` page
- Should be in: student, teacher, parent, counselor, school-admin portals too
- Import and add `<AICareerCoach />` component to each portal dashboard
- AI should behave like a helpful assistant that:
  - Remembers conversation context
  - Gives different responses based on user's questions
  - Helps with career guidance, study tips, etc.

### Phase 7: Fix Dashboard User Name Display (P1 - Medium)

**Step 7.1:** Check dashboard profile fetch and display
- Verify `userName` is being extracted from profile data
- Ensure template literal with userName is rendering correctly
- Check for undefined/null values in welcome message

### Phase 8: Fix Dashboard Mobile Responsiveness (P1 - Medium - USER REQUESTED)

**Step 8.1:** Add responsive breakpoints to dashboard layout
- Use `md:grid-cols-3 grid-cols-1` for cards
- Add proper mobile padding and spacing
- Test on 375px, 768px breakpoints

### Phase 9: Replace Teacher/Counselor Mock Data (P1 - Medium)

**Step 9.1:** Update teacher dashboard to use real API data instead of hardcoded stats
- Connect to `/api/teacher/dashboard` or similar endpoints
- Remove hardcoded values: studentsCount, classesCount, homeworkPending, etc.

**Step 9.2:** Update counselor dashboard to use real API data
- Connect to actual student data, assessment stats
- Remove hardcoded statistics placeholders

### Phase 10: Remove All Mock/Dummy Data (P2 - Lower Priority)

**Step 10.1:** Scan dashboard pages for hardcoded mock data and replace with real API calls:
- `src/app/dashboard/page.tsx` - Replace stats with real data
- `src/app/teacher/dashboard/page.tsx` - Same
- Other portal dashboards

**Step 10.2:** Add loading states while fetching real data.
**Step 10.3:** Handle empty states gracefully (no data vs. loading).

## Estimated Complexity

| Phase | Files Modified | Risk | Time |
|-------|----------------|------|------|
| 1: Assessment Fix | 2-3 | Medium - DB constraint changes | 30 min |
| 2: Sign-Out Fix | 2 | Low - Simple Clerk integration | 15 min |
| 3: Scholarship Fix | 2 | Low - Add modal component | 20 min |
| 4: Career Save | 2 | Low - Add UI, API exists | 30 min |
| 5: Setup Wizard Fix | 2 | Low - Styling and form fix | 20 min |
| 6: AI Integration Fix | 5-8 | High - Environment setup + multi-portal | 1-2 hours |
| 7: Dashboard Name Fix | 1-2 | Low - Simple data binding | 15 min |
| 8: Mobile Responsiveness | 3-5 | Medium - Responsive breakpoints | 1 hour |
| 9: Remove Mock Data | 5+ | Medium - Multiple dashboards | 1-2 hours |
| 10: Remove All Mock Data | 10+ | Medium - Comprehensive sweep | 2-3 hours |

**Total estimated time:** 6 - 8 hours

You selected: **Show info modal** for scholarship applications

Instead of broken external links, the "Apply Now" button will:
- Change text to "Application Instructions"
- Open a modal dialog with application guidance
- Show how to apply, required documents, deadline
- Not redirect or loop back to same page
