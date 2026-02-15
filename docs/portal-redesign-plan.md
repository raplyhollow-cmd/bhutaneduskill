# Fix Portal Flow: Platform Admin vs. School Admin Hierarchy

## Context

The user identified a critical design flaw in how the portal system works. Currently:

**WRONG CURRENT FLOW:**
1. Platform Admin setup wizard creates ONE school automatically
2. School Admin setup asks for school code (that doesn't exist yet!)
3. Both portals can "create schools" - confusing and wrong

**THE PROBLEM:**
- Platform Admin (`/admin`) should be the ONLY one who can create schools and generate school codes
- School Admin (`/school-admin`) should ONLY be able to sign up using an EXISTING school code
- The current setup wizard for school-admin uses `/setup/school` which is confusing
- The `/admin/schools` page has "Add School" button but no actual form to create schools

**CORRECT FLOW SHOULD BE:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PLATFORM ADMIN (/admin)                        │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Platform Admin signs up → Creates their account (NO school)      │
│ 2. Goes to /admin/schools → Clicks "Add School"                  │
│ 3. Fills form: School Name, District, Address, etc.               │
│ 4. System generates SCHOOL CODE automatically                        │
│ 5. Shares school code with school principal/admin                    │
│ 6. Can create MULTIPLE schools (one per form submission)           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        Share School Code
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHOOL ADMIN (/school-admin)                        │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Principal/Admin receives school code from Platform Admin          │
│ 2. Goes to /sign-up → Selects "School Admin" portal               │
│ 3. Signs up via Clerk                                              │
│ 4. Setup wizard: Enter SCHOOL CODE (verification step)              │
│ 5. Setup wizard: Personal details (name, email, position)          │
│ 6. Account created and LINKED to that school                       │
│ 7. Can now manage students, teachers, classes for THEIR school only  │
└─────────────────────────────────────────────────────────────────────┘
```

## User Requirements (Confirmed)

1. **Platform Admin Setup:** Should NOT create any school during setup. ALL schools (including first one) must be created via `/admin/schools` "Add School" button.

2. **School Admin Creation:** BOTH methods should work:
   - Platform Admin can directly create school admin accounts
   - School admins can self-signup using school code

## Critical Changes Needed

### 1. Fix Platform Admin Setup Wizard
**File:** `src/app/setup/admin/page.tsx`

**Current Issues:**
- Creates ONE first school during setup (should NOT create any school)
- School creation should only happen via `/admin/schools` page

**Fix:**
- Remove Step 3 "First School" from platform admin setup
- Platform admin setup should ONLY create: Organization + Admin account
- Add message: "After setup, go to Schools page to create schools"

### 2. Create "Add School" Modal/Form for Platform Admin
**File:** `src/app/admin/schools/page.tsx`

**Current Issues:**
- "Add School" button exists but doesn't open any form
- No way to actually create schools from the UI

**Fix:**
- Create modal dialog for adding schools
- Fields: School Name, District, Type, Level, Address, Contact Email, Contact Phone
- Auto-generate school code: `{First3Letters}-{DistrictCode}-{Year}`
- Example: "RHS-THI-2026" for Royal High School Thimphu 2026
- POST to `/api/schools` on submit

### 3. Fix School Admin Setup Wizard
**Files:**
- `src/app/setup/school-admin/page.tsx` (NEEDS TO BE CREATED)
- `src/app/setup/school/page.tsx` (should be REMOVED or RENAMED)

**Current Issues:**
- `/setup/school` is used for school-admin (confusing naming)
- No dedicated `/setup/school-admin` page

**Fix:**
- Create `/setup/school-admin/page.tsx` with these steps:
  1. **Enter School Code** - Verify code exists in database
  2. **Personal Details** - Name, email, phone, position (Principal/Vice Principal)
  3. **Complete** - Account created and linked to school
- Remove or rename `/setup/school` to avoid confusion

### 4. Update School Admin Layout
**File:** `src/app/school-admin/layout.tsx`

**Current Issues:**
- Redirects to `/setup/school` (wrong)

**Fix:**
- Change redirect to `/setup/school-admin`

### 5. API Updates (if needed)
**File:** `src/app/api/schools/route.ts`

**Verify:**
- POST endpoint works for creating schools
- Auto-generates unique school codes
- Returns created school with ID

### 6. Create School Admin Direct Creation (NEW)
**File:** `src/app/admin/schools/[id]/page.tsx` or create new route

**Current Issues:**
- No way for platform admin to directly create school admin accounts

**Fix:**
- Add "Create School Admin" button on school detail page
- Modal form: Name, Email, Position (Principal/Vice Principal/Admin Officer)
- Creates user account with type="school-admin" and links to school
- Sends invitation email with signup link (optional)

### 7. Create Ministry Portal (NEW - Recommended)
**Files:**
- `src/app/ministry/page.tsx` - Ministry dashboard
- `src/app/ministry/layout.tsx` - Ministry layout with sidebar
- `src/app/setup/ministry/page.tsx` - Ministry setup wizard
- `src/app/api/setup/ministry/route.ts` - Ministry setup API
- `src/components/shared/ministry-sidebar.tsx` - Ministry navigation

**Ministry Capabilities:**
- View all schools (read-only)
- Create new schools
- View analytics and reports
- Send platform notifications
- View billing records (read-only - cannot modify)

**Ministry Limitations:**
- Cannot delete schools
- Cannot modify billing/payments
- Cannot manage platform admins
- Cannot access platform owner billing settings

## Files to Modify

| File | Action | Reason |
|------|--------|--------|
| `src/app/setup/admin/page.tsx` | Remove Step 3 | Platform admin shouldn't create school during setup |
| `src/app/setup/admin/page.tsx` | Update API call | Remove school data from setup API call |
| `src/app/api/setup/admin/route.ts` | Remove school creation logic | Remove lines 192-235 |
| `src/app/admin/schools/page.tsx` | Add "Add School" modal | Create form for adding schools |
| `src/app/admin/schools/page.tsx` | Make "Add School" button functional | Open modal on click |
| `src/app/setup/school-admin/page.tsx` | CREATE NEW FILE | Dedicated setup for school admin |
| `src/app/setup/school/page.tsx` | DELETE or RENAME | Avoid confusion with school-admin setup |
| `src/app/school-admin/layout.tsx` | Update redirect | Point to `/setup/school-admin` |
| `src/components/admin/add-school-modal.tsx` | CREATE NEW FILE | Reusable modal for adding schools |
| `src/app/admin/schools/[id]/page.tsx` | CREATE/UPDATE | Add "Create School Admin" functionality |
| `src/app/ministry/page.tsx` | CREATE NEW FILE | Ministry dashboard |
| `src/app/ministry/layout.tsx` | CREATE NEW FILE | Ministry layout with sidebar |
| `src/app/setup/ministry/page.tsx` | CREATE NEW FILE | Ministry setup wizard |
| `src/app/api/setup/ministry/route.ts` | CREATE NEW FILE | Ministry setup API |
| `src/components/shared/ministry-sidebar.tsx` | CREATE NEW FILE | Ministry navigation sidebar |

## Verification

After changes, verify this flow works:

1. **Platform Admin Flow:**
   - Sign up as platform admin → Setup wizard (no school creation)
   - Go to /admin/schools → Click "Add School"
   - Fill form → School created with code
   - See school in list with generated code

2. **School Admin Flow:**
   - Receive school code from platform admin
   - Sign up as school admin → Setup wizard
   - Enter school code → Code verified
   - Enter personal details → Account created
   - Dashboard shows school name and data

3. **Permission Check:**
   - School admin can only see THEIR school
   - Platform admin can see ALL schools
   - School admin CANNOT create new schools

4. **School Admin Creation (Both Methods):**
   - Self-signup: School admin signs up with school code ✓
   - Direct creation: Platform admin creates school admin account directly (NEW)

5. **Ministry Access (NEW - Recommended):**
   - Ministry users have separate portal (`/ministry`)
   - Can create schools, view analytics, send notifications, view billing
   - Cannot delete schools, modify billing, or access owner settings

## Implementation Status

**COMPLETED (February 15, 2026):**

✅ **1. Platform Admin Setup Fixed** - Step 3 "First School" removed from wizard
✅ **2. "Add School" Modal Created** - Functional modal for `/admin/schools` page
✅ **3. School Admin Setup Wizard Created** - New `/setup/school-admin/page.tsx` with 3 steps
✅ **4. School Admin Layout Updated** - Redirect changed to `/setup/school-admin`
✅ **5. School Code Verification API Created** - New `/api/schools/verify-code/route.ts`

## Implementation Order (Original)

1. First: Fix Platform Admin Setup (remove school creation) ✅
2. Second: Create "Add School" modal for `/admin/schools` ✅
3. Third: Create `/setup/school-admin/page.tsx` ✅
4. Fourth: Update school-admin layout redirect ✅
5. Fifth: Test complete flow end-to-end ✅
6. OPTIONAL (if user approves): Create Ministry portal with controlled access

## Additional Consideration: How Many Platform Admins?

**User Context:** User is the platform owner. Their company manages the SaaS.

**Standard Practice Question:** How many platform admin accounts should exist?

**Standard B2B SaaS Practice:**
- **Initial Setup:** ONE primary platform admin (super admin) who sets up the platform
- **Additional Platform Admins:** Can be added later by existing platform admins
- **Platform Admins:** Should be VERY FEW (1-3 typically) - these are platform owners/developers
- **Not Multi-Tenant Per Admin:** Unlike school admins who manage ONE school, platform admins manage the ENTIRE platform

**Current Code Analysis:**
- `/setup/admin` creates ONE platform admin account
- No mechanism to add more platform admins
- Platform admins have type="admin" in users table

**Recommended Approach:**
1. Initial platform setup creates ONE super admin (you - the owner)
2. That super admin can invite/add other company staff as platform admins via `/admin/users` or `/admin/settings`
3. All platform admins have full access to ALL schools and data
4. No limit on number of platform admins, but should be kept minimal for security
5. **Ministry users get separate "ministry" role (not full platform admin)** - see below

## NEW: Ministry of Education Access

**User Context:**
- User owns the platform (company manages SaaS)
- Platform collects subscription fees from schools
- Ministry of Education needs access to collaborate

**Ministry Requirements (User Confirmed):**
- Create Schools
- View Analytics
- Send Notifications
- View Billing

**Design Question:** Separate Ministry Role vs. Platform Admin?

### Option A: Ministry as Platform Admin (SIMPLER)
```
Ministry users → type: "admin" (same as platform owner)
→ Full access to everything
→ No new code needed
→ Just add Ministry staff as platform admins
```

**Pros:**
- Simple implementation
- Ministry has full access to help manage
- No new user type needed

**Cons:**
- Ministry can accidentally delete things
- No audit trail for Ministry actions
- Ministry can access billing (might be sensitive - you collect money, they view)

### Option B: New "ministry" User Type (RECOMMENDED)
```
Ministry users → type: "ministry" (NEW role)
→ Separate portal: /ministry
→ Capabilities: Create schools, view analytics, send notifications, VIEW billing
→ Limitations: Cannot delete schools, cannot modify billing, platform owner keeps control
```

**Pros:**
- Controlled access - Ministry can help but not break things
- Clear separation of concerns
- Audit trail for Ministry actions
- You keep control of billing and critical functions

**Cons:**
- More code to write
- New portal to maintain

### RECOMMENDATION: Option B (New Ministry Role)

For a B2B SaaS where you collect payments, I recommend a SEPARATE ministry role because:
1. **Payment Collection:** You own the revenue, Ministry should only VIEW
2. **Safety:** Prevent accidental deletion of schools/data
3. **Professional:** Clear separation between platform owner and government partner
4. **Scalable:** Easy to add different permissions later
