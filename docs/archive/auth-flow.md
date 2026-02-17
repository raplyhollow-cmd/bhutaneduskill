# Authentication & Sign-Up Flow

## Overview

How users join and access the Career Compass platform.

---

## User Registration Options

### Option A: School Code (Recommended) ⭐
```
1. School Admin creates account first → generates unique SCHOOL CODE
2. Teachers/Students sign up with:
   - School code (e.g., "RHS-2026")
   - Email
   - Password
```

### Option B: Admin-Generated Accounts
```
1. Only School Admin can create users
2. Admin enters: name, email, role
3. System sends invite email with setup link
4. User sets password on first visit
```

### Option C: Email Domain Verification
```
1. Sign up with school email only
2. System verifies email domain matches registered school
3. Auto-assigns to correct school
```

### Option D: School Setup Wizard
```
1. New school visits site → "Register My School"
2. Wizard flow:
   - School name, location
   - Admin contact info
   - Number of students
   - Generate school code
```

---

## Recommended Approach: Hybrid

| User Type | Registration Method |
|-----------|-------------------|
| **Platform Admin** | Sign up normally (creates schools) |
| **School Admin** | Invited by platform admin OR register with wizard |
| **Teachers** | School code self-register OR admin-created |
| **Students** | School code self-register OR admin-created |
| **Parents** | Invited by school OR linked via student code |

---

## Implementation Notes

- Use **Clerk** for authentication (already integrated)
- Add **school_code** field to users table
- Create **invite system** for admin-generated accounts
- Add **school verification** step during signup
