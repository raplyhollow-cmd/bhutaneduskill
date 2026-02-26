# Sprint 1 Approval & Implementation Plan
## Bhutan EduSkill Platform - Critical Fixes & Workflow Revolution

**Date:** February 25, 2026
**Project Manager:** Project Manager Agent
**Sprint Duration:** 10 Weeks (February 25 - May 7, 2026)
**Status:** APPROVED

---

## Executive Summary

After comprehensive review of all specialist reports, this sprint plan prioritizes CRITICAL security and legal compliance issues BEFORE any feature work. The sprint is divided into 4 phases with clear dependencies and parallel work opportunities.

### Report Summary Inputs

| Report | Key Findings | Critical Issues |
|--------|--------------|-----------------|
| **Security Audit** | 3 CRITICAL vulnerabilities found | `/api/debug/` endpoints must be deleted |
| **Legal Compliance** | 52% compliance score | Privacy Policy, Terms of Service, Parental Consent REQUIRED |
| **QA Testing** | 82/100 score | 2 HIGH bugs (Admin Dashboard API, Create Student) |
| **Technical Debt** | ~5,400 lines removable | 854 `db.query` usages, 161 console.log occurrences |
| **Workflow Innovation** | 91% faster onboarding potential | Revolutionary UX patterns ready to implement |
| **Competitive Intelligence** | 5 high-impact features identified | Dark mode, push notifications, AI features |

---

## Sprint Overview Timeline

```
Week 1-2   ████████████████████ PHASE 1: CRITICAL (Security + Legal)
Week 3-6   ████████████████████████████████████████████████████████ PHASE 2: WORKFLOW
Week 7-8   ████████████████████ PHASE 3: QUICK WINS (Competitive Features)
Week 9-10  ████████████████████████████████████ PHASE 4: TECHNICAL DEBT (Foundation)
```

---

## Phase 1: CRITICAL (Week 1-2)
## MUST DO BEFORE ANYTHING ELSE

> **BLOCKER:** No feature work can begin until these security and legal issues are resolved. These are launch-blocking items.

### 1.1 Security Fixes (Week 1, Days 1-2)

| Priority | Issue | Action | Effort |
|----------|-------|--------|--------|
| **P0** | Delete `/api/debug/` endpoints | Remove all debug API routes | 2 hours |
| **P0** | Add production debug blocking | Middleware protection | 2 hours |
| **P1** | Fix session token implementation | Replace Base64 with JWT | 4 hours |
| **P1** | Add ownership validation | `requireOwnership()` helper | 6 hours |

#### Team Assignment: Security Specialist

**Tasks:**
```bash
# 1. Delete debug endpoints (CRITICAL)
rm -rf src/app/api/debug/

# 2. Add middleware protection
# File: src/middleware.ts
if (request.nextUrl.pathname.startsWith('/api/debug/')) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
}

# 3. Implement JWT session tokens
# File: src/lib/auth-utils.ts
# Replace Base64 encoding with jose JWT

# 4. Add ownership validation
# File: src/lib/auth-utils.ts
export async function requireOwnership<T>(user, resource, resourceType)
```

**Dependencies:** None (can start immediately)
**Deliverables:** Secure API routes, JWT tokens, ownership checks

---

### 1.2 Legal Compliance (Week 1, Days 3-5)

| Priority | Document | Status | Action | Effort |
|----------|----------|--------|--------|--------|
| **P0** | Privacy Policy | MISSING | Draft and publish | 8 hours |
| **P0** | Terms of Service | MISSING | Draft and publish | 8 hours |
| **P0** | Parental Consent Form | MISSING | Implement workflow | 12 hours |
| **P1** | Data Retention Policy | MISSING | Document | 2 hours |

#### Team Assignment: Legal/Compliance Specialist + Frontend Developer

**Tasks:**
```typescript
// 1. Create legal document pages
// File: src/app/privacy/page.tsx
// File: src/app/terms/page.tsx

// 2. Implement parental consent workflow
// File: src/lib/workflow/parental-consent.tsx
interface ParentalConsentConfig {
  childId: string;
  parentId: string;
  consentType: 'account' | 'assessment' | 'data_processing';
  digitalSignature: boolean;
}

// 3. Add consent checkbox to signup
// File: src/app/setup/unified/page.tsx
<Checkbox required>
  I confirm I have parental consent to use this platform
</Checkbox>
```

**Dependencies:** Security fixes must be complete first
**Deliverables:** Published legal pages, parental consent modal, consent tracking

---

### 1.3 QA HIGH Bug Fixes (Week 2, Days 1-2)

| Bug | Location | Issue | Fix | Effort |
|-----|----------|-------|-----|--------|
| **HIGH** | Admin Dashboard | `/api/admin/dashboard` missing/empty | Create endpoint | 4 hours |
| **HIGH** | Create Student | Uses setTimeout instead of API | Connect to API | 3 hours |

#### Team Assignment: Backend Developer

**Tasks:**
```typescript
// 1. Fix Admin Dashboard API
// File: src/app/api/admin/dashboard/route.ts
export async function GET(request: Request) {
  const { userId } = await requireAuth(['admin']);

  const stats = await db
    .select({
      totalSchools: count(),
      totalUsers: count(),
      // ... more stats
    })
    .from(schools);

  return Response.json({ success: true, data: stats });
}

// 2. Fix Create Student Form
// File: src/app/school-admin/students/create/page.tsx
// Remove setTimeout, connect to real API
const response = await fetch('/api/school-admin/students', {
  method: 'POST',
  body: JSON.stringify(formData)
});
```

**Dependencies:** None (can work in parallel with Legal)
**Deliverables:** Working admin dashboard, functional student creation

---

## Phase 2: WORKFLOW REVOLUTION (Week 3-6)
## Revolutionary UX Patterns

> **GOAL:** Implement the core workflow innovations that deliver 91% faster onboarding and industry-leading UX.

### 2.1 Command Palette (Week 3)

**Inspiration:** Raycast, Linear
**Impact:** 50% faster navigation for power users

#### Team Assignment: Frontend Developer (UX Specialist)

**Tasks:**
```typescript
// File: src/components/workflow/command-palette.tsx
interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
  keywords?: string[];
  category: 'navigation' | 'action' | 'create';
}

// Commands to implement:
const commands = [
  { id: 'nav-students', label: 'Go to Students', shortcut: '⌘K S' },
  { id: 'add-student', label: 'Add Student', shortcut: '⌘⇧A' },
  { id: 'create-class', label: 'Create Class', shortcut: '⌘⇧C' },
  // ... 50+ commands
];

// Keyboard shortcut: Cmd+K (global)
```

**Dependencies:** Phase 1 complete
**Deliverables:** CommandPalette component, 50+ commands, Cmd+K global shortcut

---

### 2.2 Express Add Modal (Week 4)

**Inspiration:** Vercel deployment experience
**Impact:** 60% faster entity creation

#### Team Assignment: Frontend Developer

**Tasks:**
```typescript
// File: src/components/workflow/express-add-modal.tsx
interface ExpressAddConfig<T> {
  entityType: 'student' | 'teacher' | 'class';
  fields: ExpressField[];
  smartDefaults: Partial<T>;
  detector?: (input: string) => Partial<T>;
  onSubmit: (data: T) => Promise<void>;
}

// Implement for:
// 1. Students (name, grade)
// 2. Teachers (email, subjects)
// 3. Classes (grade, section)
```

**Dependencies:** Command Palette complete
**Deliverables:** ExpressAddModal component, 3 entity types configured

---

### 2.3 Progressive Form (Week 5)

**Inspiration:** Clerk signup flow
**Impact:** 91% faster onboarding (8 min → 45 sec)

#### Team Assignment: Frontend Developer + UX Designer

**Tasks:**
```typescript
// File: src/components/workflow/progressive-form.tsx
interface ProgressiveField<T> {
  id: keyof T;
  question: string;
  type: 'input' | 'select' | 'detect';
  detect?: (context) => any;
  conditional?: (data) => boolean;
  required: boolean;
}

// Redesign: src/app/setup/unified/page.tsx
// From 5-step wizard → conversational one-field-at-a-time
const onboardingFields = [
  { id: 'name', question: "What's your name?", required: true },
  { id: 'school', question: "Which school?", detect: autoDetectSchool },
  { id: 'grade', question: "What grade?", conditional: isStudent },
];
```

**Dependencies:** Express Add complete
**Deliverables:** ProgressiveForm component, redesigned onboarding flow

---

### 2.4 In-Place Editor (Week 6)

**Inspiration:** Notion inline editing
**Impact:** 50% faster edits

#### Team Assignment: Frontend Developer

**Tasks:**
```typescript
// File: src/components/workflow/in-place-editor.tsx
interface InPlaceEditorProps<T, K> {
  value: T;
  field: K;
  display: (value: T) => ReactNode;
  edit: (value: T, onChange) => ReactNode;
  onSave: (value: T) => Promise<void>;
  editMode: 'click' | 'hover';
}

// Apply to all tables:
// - Students (name, grade, section)
// - Teachers (name, subjects, status)
// - Classes (name, capacity)
```

**Dependencies:** Progressive Form complete
**Deliverables:** InPlaceEditor component, all table columns editable

---

## Phase 3: QUICK WINS (Week 7-8)
## Competitive Features

> **GOAL:** Implement high-impact features from competitive research to match/exceed market standards.

### 3.1 Feature Implementation (Week 7-8)

| Feature | Inspiration | Impact | Effort |
|---------|-------------|--------|--------|
| Dark Mode | ClassDojo, Google Classroom | User preference | 8 hours |
| Push Notifications | Remind, ClassDojo | Engagement | 12 hours |
| Bulk Operations | Google Classroom | Power user efficiency | 8 hours |
| Student Portfolios | Seesaw | Parent engagement | 16 hours |
| AI Study Assistant | Gradient, Khan Academy | Learning outcomes | 20 hours |

#### Team Assignment: Full Stack Developer

**Tasks:**
```typescript
// 1. Dark Mode
// File: src/hooks/use-theme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // Apply to document.documentElement
}

// 2. Push Notifications
// File: src/lib/push-notifications.ts
export async function subscribeToPush() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Subscribe to web push
  }
}

// 3. Bulk Operations
// File: src/components/workflow/bulk-actions.tsx
// Select multiple rows → apply action

// 4. Student Portfolios
// File: src/app/student/portfolio/page.tsx
// Multimedia showcase of work

// 5. AI Study Assistant
// File: src/app/api/ai/tutor/route.ts
export async function POST(request: Request) {
  const { question, context } = await request.json();
  const answer = await generateAnswer(question, context);
  return Response.json({ answer });
}
```

**Dependencies:** Phase 2 complete
**Deliverables:** 5 competitive features deployed

---

## Phase 4: TECHNICAL DEBT (Week 9-10)
## Foundation Cleanup

> **GOAL:** Address critical technical debt to ensure long-term maintainability and performance.

### 4.1 Database Query Fixes (Week 9)

**Issue:** 854 occurrences of forbidden `db.query` API (neon-http incompatible)

#### Team Assignment: Backend Developer

**Tasks:**
```typescript
// BEFORE (WRONG):
const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

// AFTER (CORRECT):
const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// Files to fix (highest priority):
// - src/lib/api/school-admin.ts (200+ occurrences)
// - src/lib/api/counselor.ts (150+ occurrences)
// - src/lib/api/student.ts (100+ occurrences)
// - All API routes
```

**Effort:** 40 hours
**Deliverables:** All `db.query` usages replaced with `db.select()`

---

### 4.2 Logging & Anti-Patterns (Week 10)

**Issue:** 161 `console.log` occurrences, 82 relative imports

#### Team Assignment: Backend Developer

**Tasks:**
```typescript
// Replace console.log with logger
// BEFORE:
console.log("User data:", user);
console.error("Database error:", error);

// AFTER:
logger.info('User action', { userId: user.id, action: 'login' });
logger.error(error, { context: 'database', userId });

// Fix relative imports
// BEFORE:
import { db } from "../../../lib/db";

// AFTER:
import { db } from "@/lib/db";
```

**Effort:** 14 hours
**Deliverables:** Zero console.log occurrences, zero relative imports

---

## Team Assignments Summary

| Role | Team Member | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|-------------|---------|---------|---------|---------|
| **Security Specialist** | Agent 1 | Debug deletion, JWT | - | - | - |
| **Legal/Compliance Specialist** | Agent 2 | Legal docs, consent | - | - | - |
| **Backend Developer** | Agent 3 | Bug fixes | - | - | db.query, logging |
| **Frontend Developer (UX)** | Agent 4 | - | Command Palette, Express Add | - | - |
| **Frontend Developer** | Agent 5 | - | Progressive Form, In-Place | Dark mode, push | - |
| **Full Stack Developer** | Agent 6 | - | - | AI features, portfolios | - |
| **UX Designer** | Agent 7 | - | Review & refine | Design review | - |

---

## Parallel Work Schedule

```
WEEK 1:                                   WEEK 2:
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ Security Specialist             │       │ Backend Developer               │
│ • Delete debug endpoints (Day 1)│       │ • Fix Admin Dashboard API       │
│ • Add middleware blocking (Day 1)│       │ • Fix Create Student API        │
│ • Implement JWT tokens (Day 2)   │       │                                 │
└─────────────────────────────────┘       └─────────────────────────────────┘
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ Legal Specialist                │ PARALLEL│ Legal/Compliance Specialist    │
│ • Draft Privacy Policy (Day 3)  │ ───────│ • Implement consent workflow    │
│ • Draft Terms of Service (Day 4)│       │ • Create legal pages            │
└─────────────────────────────────┘       └─────────────────────────────────┘

WEEK 3-6: SEQUENTIAL (each component depends on previous)
Command Palette → Express Add → Progressive Form → In-Place Editor

WEEK 7-8: PARALLEL
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ Frontend Developer              │       │ Full Stack Developer            │
│ • Dark Mode                     │ PARALLEL│ • AI Study Assistant            │
│ • Push Notifications            │ ───────│ • Student Portfolios            │
└─────────────────────────────────┘       └─────────────────────────────────┘

WEEK 9-10: SEQUENTIAL
Database Query Fixes → Logging & Anti-Patterns
```

---

## Critical Path

```
START
 │
 ├── [Security Fixes] ─┐
 │                    │
 ├── [Legal Compliance] ─┤
 │                     │
 └── [Bug Fixes] ───────┤
                       │
                 PHASE 1 COMPLETE
                       │
              [Command Palette] ─┐
                       │         │
                [Express Add] ───┤
                       │         │
                 [Progressive Form] ┤
                       │         │
                  [In-Place Editor] ─┐
                                  │
                            PHASE 2 COMPLETE
                                  │
                        [Quick Wins] ─┐
                                  │  │
                                  └──┤
                                     │
                               PHASE 3 COMPLETE
                                     │
                          [Technical Debt] ─┐
                                     │      │
                                     └──────┤
                                            │
                                      SPRINT COMPLETE
```

**Total Duration:** 10 weeks
**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 (sequential)
**Parallel Opportunities:** Phase 1 tasks can run in parallel; Phase 3 features can be parallel

---

## Synchronization Points

| Week | Milestone | Review Gates |
|------|-----------|--------------|
| **2** | Phase 1 Complete | Security audit re-scan, Legal review |
| **4** | Command Palette & Express Add | UX testing with 5 users |
| **6** | Phase 2 Complete | Full onboarding flow test |
| **8** | Phase 3 Complete | Feature acceptance testing |
| **10** | Sprint Complete | Final QA, Production deployment |

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] All `/api/debug/` endpoints removed
- [ ] Privacy Policy and Terms of Service published
- [ ] Parental consent workflow implemented
- [ ] Admin Dashboard API returning real data
- [ ] Create Student form connected to API

### Phase 2 Success Criteria
- [ ] Command Palette with 50+ commands
- [ ] Onboarding time reduced from 8 min to <60 sec
- [ ] Express Add modal implemented for 3 entity types
- [ ] All table columns support in-place editing

### Phase 3 Success Criteria
- [ ] Dark mode toggle functional
- [ ] Push notifications subscribed
- [ ] Bulk operations working
- [ ] Student portfolio page created
- [ ] AI Study Assistant responding

### Phase 4 Success Criteria
- [ ] Zero `db.query` usages in codebase
- [ ] Zero `console.log` occurrences
- [ ] Zero relative imports
- [ ] TypeScript compilation clean

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Phase 1 security issues found | Delay sprint | Medium | Add 1 week buffer |
| Legal documents require legal review | Delay Phase 2 | High | Engage legal consultant Week 1 |
| Workflow components take longer | Reduce scope | Medium | Cut In-Place Editor if needed |
| db.query refactoring breaks features | Regression bugs | High | Comprehensive testing plan |
| Team availability issues | Delay delivery | Medium | Cross-train team members |

---

## Dependencies

### External Dependencies
- Legal consultant for Privacy Policy/ToS review
- Bhutanese legal counsel for compliance verification
- Clerk authentication (already integrated)
- Neon PostgreSQL (already provisioned)

### Internal Dependencies
- Phase 2 requires Phase 1 completion
- Phase 3 requires Phase 2 completion
- Phase 4 can run in parallel with Phase 3 (if needed)

---

## Rollout Plan

### Week 1-2: Staging Deployment
- Deploy Phase 1 fixes to staging environment
- Security audit re-scan
- Legal document review

### Week 3-6: Beta Testing
- Deploy Phase 2 to 5% of users (canary release)
- Monitor metrics
- Collect feedback

### Week 7-8: General Release
- Deploy Phase 3 to 100% of users
- Monitor performance
- Fix critical issues

### Week 9-10: Production Hardening
- Deploy Phase 4 (technical debt)
- Full regression testing
- Production deployment

---

## Approval Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Project Manager** | Project Manager Agent | _________________ | ______ |
| **Security Lead** | Security Specialist | _________________ | ______ |
| **Legal/Compliance** | Legal Specialist | _________________ | ______ |
| **Engineering Lead** | Backend Developer | _________________ | ______ |
| **UX Lead** | UX Designer | _________________ | ______ |

---

## Appendix A: File Checklist

### Phase 1 Files
- [ ] `src/middleware.ts` - Add debug blocking
- [ ] `src/lib/auth-utils.ts` - JWT implementation
- [ ] `src/app/privacy/page.tsx` - Privacy policy page
- [ ] `src/app/terms/page.tsx` - Terms of service page
- [ ] `src/components/workflow/parental-consent.tsx` - Consent modal
- [ ] `src/app/api/admin/dashboard/route.ts` - Fix dashboard
- [ ] `src/app/school-admin/students/create/page.tsx` - Fix API connection

### Phase 2 Files
- [ ] `src/components/workflow/command-palette.tsx` - Command palette
- [ ] `src/components/workflow/express-add-modal.tsx` - Quick add
- [ ] `src/components/workflow/progressive-form.tsx` - Conversational form
- [ ] `src/components/workflow/in-place-editor.tsx` - Inline editing
- [ ] `src/hooks/workflow/use-keyboard-shortcuts.ts` - Keyboard handlers
- [ ] `src/hooks/workflow/use-smart-defaults.ts` - Default values

### Phase 3 Files
- [ ] `src/hooks/use-theme.ts` - Dark mode
- [ ] `src/lib/push-notifications.ts` - Push notifications
- [ ] `src/components/workflow/bulk-actions.tsx` - Bulk operations
- [ ] `src/app/student/portfolio/page.tsx` - Student portfolios
- [ ] `src/app/api/ai/tutor/route.ts` - AI assistant

### Phase 4 Files
- [ ] All files with `db.query` usage (~215 files)
- [ ] All files with `console.log` (~79 files)
- [ ] All files with relative imports (~82 files)

---

## Appendix B: Command List

### Command Palette Commands (50+)

#### Navigation (20)
- Go to Students (`⌘K S`)
- Go to Teachers (`⌘K T`)
- Go to Classes (`⌘K C`)
- Go to Dashboard (`⌘K D`)
- Go to Reports (`⌘K R`)
- Go to Settings (`⌘K ,`)
- Go to Homework (`⌘K H`)
- Go to Attendance (`⌘K A`)
- Go to Fees (`⌘K F`)
- Go to Library (`⌘K L`)
- Go to Transport (`⌘K T`)
- Go to Hostel (`⌘K H`)
- Go to Assessments (`⌘K A`)
- Go to Career Guidance (`⌘K C`)
- Go to Rub (Wellness) (`⌘K W`)
- Go to Progress (`⌘K P`)
- Go to Plan (`⌘K P`)
- Go to Schedule (`⌘K S`)
- Go to Certificates (`⌘K C`)
- Go to Profile (`⌘K P`)

#### Creation (15)
- Add Student (`⌘⇧A S`)
- Add Teacher (`⌘⇧A T`)
- Add Class (`⌘⇧A C`)
- Add Subject (`⌘⇧A U`)
- Add Homework (`⌘⇧A H`)
- Add Assessment (`⌘⇧A A`)
- Add Fee (`⌘⇧A F`)
- Add Event (`⌘⇧A E`)
- Add Notice (`⌘⇧A N`)
- Add Holiday (`⌘⇧A H`)
- Add Transport (`⌘⇧A T`)
- Add Hostel (`⌘⇧A H`)
- Add Library Book (`⌘⇧A L`)
- Add Announcement (`⌘⇧A A`)
- Add Report Card (`⌘⇧A R`)

#### Actions (15)
- Export Data (`⌘E`)
- Import Data (`⌘I`)
- Print Report (`⌘P`)
- Send Message (`⌘M`)
- Schedule Meeting (`⌘S`)
- Create Invoice (`⌘I`)
- Record Payment (`⌘P`)
- Approve Application (`⌘⇧A`)
- Reject Application (`⌘⇧R`)
- Generate Certificate (`⌘G`)
- Run Backup (`⌘B`)
- Sync Data (`⌘D`)
- Toggle Dark Mode (`⌘D`)
- Show Help (`⌘/`)
- Show Keyboard Shortcuts (`⌘?`)

---

**This Sprint Plan is hereby APPROVED for immediate execution.**

**Next Step:** Assemble specialist teams and begin Phase 1, Task 1.1 (Security Fixes).

---

*Document Version: 1.0*
*Last Updated: February 25, 2026*
*Project Manager: Project Manager Agent*
