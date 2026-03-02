# Sprint 1 Quick Reference Card
## For All Team Members

**Print this. Keep it visible. Reference daily.**

---

## TL;DR - Sprint Overview

```
PHASE 1 (Week 1-2): Fix CRITICAL security and legal issues
PHASE 2 (Week 3-6): Revolutionary UX patterns (Command Palette, etc.)
PHASE 3 (Week 7-8): Competitive features (Dark mode, AI, etc.)
PHASE 4 (Week 9-10): Technical debt cleanup
```

---

## Phase 1: CRITICAL (Must Do First)

### Week 1 Day 1-2: Delete Debug Endpoints
```bash
# RUN THIS IMMEDIATELY
rm -rf src/app/api/debug/
```

### Week 1 Day 3-5: Legal Documents
- Privacy Policy → `src/app/privacy/page.tsx`
- Terms of Service → `src/app/terms/page.tsx`
- Parental Consent → `src/components/workflow/parental-consent.tsx`

### Week 2 Day 1-2: Fix HIGH Bugs
- Admin Dashboard API → `src/app/api/admin/dashboard/route.ts`
- Create Student Form → Connect to real API

---

## Phase 2: Workflow Revolution

### Week 3: Command Palette
**Component:** `src/components/workflow/command-palette.tsx`
**Shortcut:** Cmd+K
**Commands:** 50+ navigation, creation, and actions

### Week 4: Express Add Modal
**Component:** `src/components/workflow/express-add-modal.tsx`
**Use:** Quick add students, teachers, classes
**Benefit:** 60% faster creation

### Week 5: Progressive Form
**Component:** `src/components/workflow/progressive-form.tsx`
**Use:** Student onboarding redesign
**Benefit:** 8 min → 45 sec (91% faster)

### Week 6: In-Place Editor
**Component:** `src/components/workflow/in-place-editor.tsx`
**Use:** Edit tables inline
**Benefit:** 50% faster edits

---

## Phase 3: Quick Wins

### Week 7-8: 5 Competitive Features
1. Dark Mode - `src/hooks/use-theme.ts`
2. Push Notifications - `src/lib/push-notifications.ts`
3. Bulk Operations - `src/components/workflow/bulk-actions.tsx`
4. Student Portfolios - `src/app/student/portfolio/page.tsx`
5. AI Study Assistant - `src/app/api/ai/tutor/route.ts`

---

## Phase 4: Technical Debt

### Week 9: Fix Database Queries
```typescript
// WRONG:
db.query.users.findFirst(...)

// CORRECT:
db.select().from(users).where(...).limit(1)
```

### Week 10: Fix Anti-Patterns
```typescript
// WRONG:
console.log(...)
import from "../../../lib"

// CORRECT:
logger.info(...)
import from "@/lib"
```

---

## Command Palette Commands (Top 20)

| Shortcut | Command |
|----------|---------|
| `⌘K S` | Go to Students |
| `⌘K T` | Go to Teachers |
| `⌘K C` | Go to Classes |
| `⌘K D` | Go to Dashboard |
| `⌘⇧A` | Quick Add |
| `⌘⇧S` | Save |
| `⌘E` | Export |
| `⌘P` | Print |
| `⌘/` | Show Help |
| `⌘?` | Show Shortcuts |
| `⌘D` | Toggle Dark Mode |
| `⌘K` | Open Command Palette |
| `Esc` | Close Modal |
| `Enter` | Submit Form |
| `Tab` | Next Field |

---

## Handoff Checklist

### Phase 1 Complete → Phase 2 Can Start
- [ ] Debug endpoints deleted
- [ ] JWT tokens implemented
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Parental consent implemented
- [ ] Admin Dashboard API working
- [ ] Create Student API working

### Phase 2 Complete → Phase 3 Can Start
- [ ] Command Palette deployed
- [ ] Express Add deployed
- [ ] Progressive Form deployed
- [ ] In-Place Editor deployed

### Phase 3 Complete → Phase 4 Can Start
- [ ] Dark mode deployed
- [ ] Push notifications deployed
- [ ] Bulk operations deployed
- [ ] Portfolios deployed
- [ ] AI Assistant deployed

---

## Daily Standup Format (15 min max)

**Your Name:**
**Yesterday:** What I did
**Today:** What I'll do
**Blockers:** What's blocking me

---

## Who to Contact

| Issue | Contact |
|-------|---------|
| Security vulnerability | Agent 1 (Security) |
| Legal/compliance | Agent 2 (Legal) |
| Backend bug | Agent 3 (Backend) |
| Frontend component | Agent 4-5 (Frontend) |
| Full stack feature | Agent 6 (Full Stack) |
| UX/design question | Agent 7 (UX) |
| Project escalation | Project Manager |

---

## Quick Commands

```bash
# Run security check
npm run test:security

# Run type check
npx tsc --noEmit

# Find console.log usages
grep -r "console\." src/ --include="*.ts" --include="*.tsx"

# Find db.query usages
grep -r "db\.query" src/ --include="*.ts"

# Run tests
npm run test

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Sprint Timeline

```
Week 1-2:  ██████  CRITICAL (Security + Legal)
Week 3-4:  ████████████  WORKFLOW (Command Palette + Express Add)
Week 5-6:  ████████████  WORKFLOW (Progressive Form + In-Place Edit)
Week 7-8:  ██████  QUICK WINS (5 features)
Week 9-10: ██████  TECHNICAL DEBT (Cleanup)
```

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Onboarding Time | 8 min | 45 sec |
| Form Abandonment | 35% | 5% |
| Security Score | 80% | 95% |
| Legal Compliance | 52% | 80% |
| db.query Usages | 854 | 0 |
| console.log | 161 | 0 |

---

## REMEMBER

1. **Phase 1 MUST be complete before Phase 2 starts**
2. **Test every PR before merging**
3. **Never add `any` types**
4. **Always use `@/` imports, never relative**
5. **Use `logger.info()` never `console.log()`**
6. **Use `db.select()` never `db.query()`**

---

**Keep this visible. Reference daily. Ask questions.**

*Print Date: February 25, 2026*
*Sprint Duration: 10 Weeks*
