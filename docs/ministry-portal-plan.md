# Ministry Portal Implementation Plan

## Context

User confirmed: Ministry of Education needs access to the Bhutan EduSkill platform as a collaborator (not platform owner).

**User's Company (Platform Owner):**
- Owns the platform and collects subscription fees from schools
- Needs to keep control of billing and critical settings
- Wants Ministry to help manage platform growth

**Ministry Requirements (User Confirmed):**
- Create Schools (help expand platform coverage)
- View Analytics (national-level insights)
- Send Notifications (communicate with schools)
- View Billing (transparency on revenue)
- Make Policies (curriculum, assessments, etc.)

## Ministry Portal Architecture

**Decision: SEPARATE `/ministry` portal with type="ministry"**

### Why Separate Portal (Not Just Hide Features in Admin):

| Concern | Admin Portal (/admin) | Ministry Portal (/ministry) |
|----------|---------------------|------------------------|
| **Theme Color** | Pink/Magenta | Blue/Green (distinctive) |
| **User Type** | type: "admin" | type: "ministry" |
| **Navigation** | All features available | Limited features only |
| **Audit Trail** | Shows as "admin" | Shows as "ministry" |
| **Safety** | Can accidentally delete | Cannot access restricted features |

## Features Breakdown

### 1. Schools Management (`/ministry/schools`)

**Access Level:** CREATE + VIEW (cannot DELETE)

**Features:**
- View all schools across Bhutan (read-only list)
- Add new schools (full form to create)
- Search/filter by district, school type, level
- View school stats: students, teachers, counselors
- NO delete button (safety restriction)
- NO edit capability (prevent unauthorized changes)

**API Endpoint:** `POST /api/schools` (already exists, verified for ministry role)

### 2. Analytics Dashboard (`/ministry/analytics`)

**Access Level:** READ-ONLY

**Features:**
- National-level statistics:
  - Total schools (by district)
  - Total students enrolled
  - Assessment completion rates
  - Career interest trends
  - Monthly enrollment trends
- School performance comparison:
  - Top performing schools
  - Schools needing attention
  - Engagement metrics
- Export reports (CSV, PDF)

**Data Sources:**
- Aggregated from `/admin/analytics` (read-only access)
- Uses existing query aggregation from `schools`, `users`, `assessments` tables

### 3. Notifications Center (`/ministry/notifications`)

**Access Level:** SEND (create and send platform-wide alerts)

**Features:**
- Create announcements:
  - Target: All schools, specific districts, student/teacher/parent roles
  - Type: Info, Warning, Urgent, Success
  - Schedule: Send immediately or schedule for later
- View sent notifications:
  - Delivery status (sent, pending, failed)
  - Open rates (how many recipients read it)
- Ministry-branded templates:
  - Pre-written templates for common announcements
  - Exam schedule notifications
  - Holiday announcements
  - Policy updates

**UI Reuse:** Can reuse `/admin/notifications/page.tsx` with ministry branding

### 4. Billing Overview (`/ministry/billing`)

**Access Level:** VIEW-ONLY (cannot modify)

**Features:**
- Revenue dashboard:
  - Total monthly recurring revenue
  - New subscriptions this month
  - Growth trends (charts)
  - Payment method breakdown (RMA vs others)
- Subscription status:
  - Active schools by plan type
  - Trials expiring soon
  - Past due payments
- **NO EDIT capability** (Platform owner keeps control)
- **NO delete capability** (safety)

**Data Display:**
- Read from existing `/admin/billing` data
- Remove: Edit plan, modify pricing, delete invoice buttons
- Keep: View-only tables and charts

### 5. Policy Making (`/ministry/policies`) - NEW FEATURE

**Access Level:** CREATE (set national education policies)

**Features:**
- **Assessment Policies:**
  - Set national assessment standards
  - Configure BCSE exam parameters
  - Define grade scales (A+, A, B+, etc.)
- **Curriculum Guidelines:**
  - Define subject requirements per grade
  - Set minimum teaching hours
  - Specify practical vs theory ratios
- **Academic Calendar:**
  - Set national academic calendar
  - Define term dates
  - Holiday schedules
- **Career Education Standards:**
  - RIASEC assessment guidelines
  - Career counseling requirements
  - Work-internship policies

**Storage:**
- New table: `ministry_policies`
  - Fields: id, category, title, description, effectiveDate, createdBy
- New table: `curriculum_standards`
  - Fields: id, subject, grade, hoursRequired, topics

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/ministry/page.tsx` | Ministry dashboard (overview) |
| `src/app/ministry/layout.tsx` | Ministry layout with sidebar |
| `src/app/ministry/schools/page.tsx` | Schools management (create + view) |
| `src/app/ministry/analytics/page.tsx` | National analytics dashboard |
| `src/app/ministry/notifications/page.tsx` | Notification center |
| `src/app/ministry/billing/page.tsx` | Billing overview (view-only) |
| `src/app/ministry/policies/page.tsx` | Policy making (NEW) |
| `src/app/setup/ministry/page.tsx` | Ministry setup wizard |
| `src/app/api/setup/ministry/route.ts` | Ministry setup API |
| `src/components/shared/ministry-sidebar.tsx` | Ministry navigation sidebar |

## Files to Modify

| File | Changes |
|------|----------|
| `src/lib/db/schema.ts` | Add `ministry_policies`, `curriculum_standards` tables |
| `src/middleware.ts` | Add `/ministry` route protection for type="ministry" |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Add "Ministry" portal card |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Add "Ministry" portal card |

## Implementation Order

1. **Database Schema** - Add policy tables
2. **Setup Wizard** - Create `/setup/ministry` with Ministry verification
3. **Layout & Sidebar** - Create Ministry layout with blue/green theme
4. **Dashboard** - Overview with national stats
5. **Schools Page** - Reuse admin schools with create-only
6. **Analytics Page** - Reuse admin analytics (read-only)
7. **Notifications Page** - Reuse admin notifications
8. **Billing Page** - Reuse admin billing (remove edit buttons)
9. **Policies Page** - NEW feature for policy making
10. **Sign-Up Integration** - Add Ministry portal card
11. **Authentication** - Update middleware for ministry role
12. **Testing** - End-to-end Ministry user flow

## Ministry vs Platform Admin Feature Matrix

| Feature | Platform Admin | Ministry |
|----------|---------------|----------|
| **Create Schools** | ✅ Full CRUD | ✅ Create + View only |
| **Delete Schools** | ✅ Yes | ❌ No |
| **View Analytics** | ✅ Full access | ✅ Read-only |
| **Send Notifications** | ✅ Yes | ✅ Yes |
| **Manage Billing** | ✅ Edit plans, modify pricing | ✅ View-only |
| **Manage Users** | ✅ Add/remove admins | ❌ No |
| **Platform Settings** | ✅ Full access | ❌ No |
| **Make Policies** | ✅ Yes | ✅ Yes |
| **Delete Platform** | ✅ Yes (owner) | ❌ No |

## Color Scheme

**Platform Admin:** Pink/Magenta gradient (`rgb(236 72 153) → rgb(219 39 119)`)

**Ministry:** Purple/Violet gradient (`rgb(168 85 247) → rgb(147 51 234)`)
- Purple: Royal, administrative, authority
- Violet: Dignity, wisdom, leadership

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

**Current Issues:**
- No way for platform admin to directly create school admin accounts

**Fix:**
- Add "Create School Admin" button on school detail page
- Modal form: Name, Email, Position (Principal/Vice Principal/Admin Officer)
- Creates user account with type="school-admin" and links to school
- Sends invitation email with signup link (optional)

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

## Implementation Order

1. First: Fix Platform Admin Setup (remove school creation)
2. Second: Create "Add School" modal for `/admin/schools`
3. Third: Create `/setup/school-admin/page.tsx`
4. Fourth: Update school-admin layout redirect
5. Fifth: Test complete flow end-to-end
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
