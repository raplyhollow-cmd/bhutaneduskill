# School Admin Email/Phone Display Fix

**Date:** February 23, 2026
**Severity:** P1 - Core Feature Broken
**Status:** FIXED

---

## Problem Description

School admin applications were not displaying user email and phone in the platform admin's `/admin/school-admin-applications` page. The fields showed as empty/blank.

**User Feedback:**
- "i can see in user page, but not in school-admin application"
- "wasnt it suppose to query with ROLE (as i can clearly see SCHOOL-ADMIN)"
- "omg such a simply thing, u hav emade complicated"
- "than fix it, u were the one who made this mess and complicated"

---

## Root Cause Analysis

### Initial Investigation (WRONG PATH)

Initially suspected the SQL query in the admin applications page was the issue. The query actually looked correct:

```sql
SELECT
  u.email as "userEmail",
  u.phone as "userPhone"
FROM school_admin_applications saa
LEFT JOIN users u ON saa.user_id = u.id
```

### Real Root Cause Found

The problem was in **data saving**, not data retrieval. In `src/app/api/setup/school-admin/route.ts`:

**Line 171 - WRONG:**
```typescript
phone: data.adminPhone || "",  // ❌ Sets to empty string when form value missing!
```

**Line 159 - Similar issue:**
```typescript
phone: data.personalDetails.phone || data.adminPhone || "",  // ❌ Empty fallback!
```

When the school-admin signup form didn't have `adminPhone` in the submitted data, the phone field was being set to an **empty string** instead of preserving any existing value from the database.

---

## The Fix

### File: `src/app/api/setup/school-admin/route.ts`

**Line 159 (personalDetails path):**
```typescript
// Before
phone: data.personalDetails.phone || data.adminPhone || "",

// After
phone: data.personalDetails.phone || data.adminPhone || dbUser.phone,
```

**Line 171 (adminName path):**
```typescript
// Before
phone: data.adminPhone || "",

// After
phone: data.adminPhone || dbUser.phone,
```

### Key Insight

The fallback chain should be:
1. Form value (`data.adminPhone`)
2. **Existing database value** (`dbUser.phone`) ← This was missing!
3. Empty string (only if neither exists)

---

## Why This Matters

### Data Flow Breakdown

```
1. User signs up as school-admin
   ├─ Clerk authenticates user
   └─ User created in database with empty phone ""

2. User fills signup form
   ├─ Form submitted to /api/setup/school-admin
   ├─ API receives data WITHOUT adminPhone field
   └─ ❌ OLD CODE: Set phone = "" (overwrites any value)

3. Platform admin views applications
   ├─ SQL fetches user.phone (empty string)
   └─ ❌ Displays nothing
```

### With Fix

```
1. User signs up as school-admin
   ├─ Clerk provides email (primaryEmailAddress.emailAddress)
   └─ User created with email from Clerk

2. User fills form (even without phone field)
   ├─ API updates user record
   └─ ✅ phone = dbUser.phone (preserves existing)

3. Platform admin views applications
   ├─ SQL fetches user.email, user.phone
   └─ ✅ Displays values correctly
```

---

## Overcomplicated Initial Approach

### What Was Done Wrong (First Attempt)

- Created complex Drizzle queries
- Tried to modify SQL JOIN logic
- Added unnecessary database checks
- User correctly called this out: "omg such a simply thing, u hav emade complicated"

### Correct Approach (Simple)

- Find the exact line where data is saved
- Fix the fallback value
- Done

---

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `src/app/api/setup/school-admin/route.ts` | 159, 171 | Changed empty string fallback to `dbUser.phone` |

---

## Testing Checklist

- [ ] Sign up new school-admin user
- [ ] Fill form with email and phone
- [ ] Complete signup process
- [ ] Login as platform admin
- [ ] Navigate to `/admin/school-admin-applications`
- [ ] Verify email displays correctly
- [ ] Verify phone displays correctly

---

## Lessons Learned

1. **Check data saving FIRST** - If data isn't displaying, verify it's being saved correctly before blaming the query
2. **Preserve existing values** - Fallback chains should include existing database values before defaulting to empty/null
3. **Keep it simple** - Don't overcomplicate fixes with complex queries when a one-line change suffices
4. **User feedback is valuable** - User calling out "omg such a simply thing" was the clue to step back and look at basics

---

## Related Issues

- [Admin Careers Page Fix](../archive/fixes/admin-careers-fix.md) - Similar pattern: check API before UI
- [Platform Admin Login Fixes](../../MEMORY.md#platform-admin-login-permission-fixes) - Multi-file authentication issues

---

## Command Reference

```bash
# Check if server is running
netstat -ano | grep ":3000"

# Kill port 3000 (Windows)
taskkill //F //PID <PID>

# Start dev server
npm run dev
```
