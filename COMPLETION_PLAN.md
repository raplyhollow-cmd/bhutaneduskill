# Career Compass - Completion Plan
## Optimal Paradigm to Finish This Project

**Current Status:** ~85% Complete
**Estimated Time to MVP:** 2-3 weeks (focused work)

---

## Phase 1: Unblocking (Days 1-2)
*Goal: Make the project build and run cleanly*

### 1.1 Fix CSS Class Errors (2 hours)
Fix these 7 files - replace undefined Tailwind classes with inline styles:

| File | Issue | Fix |
|------|-------|-----|
| `src/app/school-admin/dashboard/page.tsx` | `from-hunter-green-*` | Inline style |
| `src/app/counselor/page.tsx` | `bg-ash-grey-*` | `bg-gray-50` |
| `src/components/ai/career-coach.tsx` | `from-powder-blue-*` | Inline style |
| `src/app/counselor/data-export/page.tsx` | `from-hunter-green-*` | Inline style |
| `src/app/student/dashboard/page.tsx` | | Inline style |
| `src/app/parent/layout.tsx` | `getPortalConfig()` | Remove, use inline |
| `src/app/admin/layout.tsx` | `getPortalConfig()` | Remove, use inline |

**Command for Claude:**
> "Fix all undefined Tailwind gradient classes. Use inline styles with the portal color system from .clauderules"

### 1.2 Fix Boolean Type Issues (30 min)
```typescript
// src/app/api/counselor-notes/route.ts:93
isPrivate: !!isPrivate  // not isPrivate ? 1 : 0

// src/app/api/school-admin/subjects/[id]/route.ts:64
isActive: !!isActive  // not isActive ? 1 : 0
```

**Command for Claude:**
> "Fix all boolean type assignments in API routes - use !!value instead of ternary 1/0"

### 1.3 Verify Build (15 min)
```bash
npm run build
```
Fix any remaining errors.

---

## Phase 2: Critical Features (Days 3-7)
*Goal: Ensure core user flows work end-to-end*

### 2.1 Authentication Flow (Day 3)
- [ ] Test sign-up for each role
- [ ] Test portal access permissions
- [ ] Verify role-based redirects work

### 2.2 Assessment Flow (Days 4-5)
- [ ] Test RIASEC assessment → results → career matches
- [ ] Test MBTI assessment → results
- [ ] Test DISC assessment → results
- [ ] Verify data saves correctly to DB

### 2.3 Homework Flow (Days 6-7)
- [ ] Teacher creates homework
- [ ] Student submits homework
- [ ] Teacher grades homework
- [ ] Student views graded submission

---

## Phase 3: Portal Polish (Days 8-12)
*Goal: Make each portal production-ready*

### Priority Order (Most Users → Least)
1. **Student Portal** (Day 8-9) - Primary users
2. **Teacher Portal** (Day 10) - Daily active users
3. **School Admin** (Day 11) - Power users
4. **Parent Portal** (Day 12) - View-only users
5. **Counselor Portal** (Day 12) - Niche users
6. **Platform Admin** (Day 12) - Rarely used

### Each Portal Needs:
- Loading states (skeletons)
- Empty states (no data messages)
- Error boundaries
- Mobile responsive tables
- Consistent styling

---

## Phase 4: Deployment Prep (Days 13-15)
*Goal: Ready for production*

### 4.1 Database Migration (Day 13)
```bash
# Migrate SQLite → Neon PostgreSQL
# Update .env with DATABASE_URL
```

### 4.2 Environment Setup (Day 14)
Set up free-tier services:
- [ ] Neon (database)
- [ ] Resend (emails)
- [ ] PostHog (analytics)
- [ ] Sentry (error tracking)

### 4.3 Deploy to Vercel (Day 15)
- [ ] Connect GitHub repo
- [ ] Configure environment variables
- [ ] Deploy
- [ ] Test production URL

---

## Phase 5: Soft Launch (Days 16-21)
*Goal: Real user testing*

### 5.1 Beta Testing
- Test with 1 school
- Gather feedback
- Fix critical bugs

### 5.2 Iterate
- Address top 10 user issues
- Add missing "nice-to-have" features

---

## Recommended Claude Workflow

### For Each Phase:
1. **Start fresh session** with `/clear`
2. **Reference .clauderules** - "Read .clauderules first"
3. **Use @ mentions** - "@file.ts fix line 42"
4. **Every 10 messages** - `/compact` then continue
5. **End of session** - "Update CLAUDE.md with progress"

### Task Delegation:
| Task Type | Use |
|-----------|-----|
| CSS fixes | Cline with DeepSeek (save quota) |
| Architecture changes | Claude Code (high-IQ work) |
| Boilerplate | Cursor/Ghostwriter |
| Simple edits | Any tool |

---

## Quick Start Commands

### Fix All CSS Issues Now:
```
"Read .clauderules then fix all undefined Tailwind classes in these files:
@src/app/school-admin/dashboard/page.tsx
@src/app/counselor/page.tsx
@src/components/ai/career-coach.tsx
@src/app/counselor/data-export/page.tsx
@src/app/student/dashboard/page.tsx
@src/app/parent/layout.tsx
@src/app/admin/layout.tsx

Use inline styles with the portal color RGB values from .clauderules"
```

### Fix All Boolean Types:
```
"Fix boolean type assignments in API routes:
@src/app/api/counselor-notes/route.ts
@src/app/api/school-admin/subjects/[id]/route.ts

Change 'isPrivate ? 1 : 0' to '!!isPrivate' and 'isActive ? 1 : 0' to '!!isActive'"
```

---

## Success Criteria

**MVP Complete When:**
- [ ] Project builds without errors
- [ ] All 6 portals accessible via correct roles
- [ ] RIASEC assessment works end-to-end
- [ ] Homework create→submit→grade flow works
- [ ] Deployed to Vercel
- [ ] 5 beta users can use it successfully

**Production Ready When:**
- [ ] All MVP criteria met
- [ ] Mobile responsive
- [ ] Error handling complete
- [ ] Database migrated to Neon
- [ ] Monitoring services connected
- [ ] Payment gateway tested
