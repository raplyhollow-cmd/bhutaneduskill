# Sprint 1 Team Coordination Guide
## Parallel Work Streams & Handoff Protocols

**Date:** February 25, 2026
**Companion:** [sprint-1-approval-plan.md](./sprint-1-approval-plan.md)

---

## Team Structure

```
                    PROJECT MANAGER (Coordination)
                            |
        ┌──────────────────┼──────────────────┐
        |                  |                  |
    SPECIALISTS        DEVELOPERS          DESIGN
        |                  |                  |
    ┌───┴───┐       ┌─────┴─────┐         |
Security  Legal   Frontend   Backend      UX
    |      |       |          |           |
  Agent1  Agent2  Agent4-5   Agent3,6    Agent7
```

---

## Phase 1: Critical Work Streams (Week 1-2)

### Stream A: Security Fixes (Agent 1 - Security Specialist)

```
DAY 1-2: Security Fixes
├── Delete /api/debug/ endpoints [2h]
├── Add middleware protection [2h]
├── Implement JWT tokens [4h]
└── Add ownership validation [6h]

DELIVERABLES:
├── Secure API routes
├── JWT session tokens
└── requireOwnership() helper
```

**Files Modified:**
- `src/middleware.ts`
- `src/lib/auth-utils.ts`
- DELETED: `src/app/api/debug/`

**Handoff:** Security fixes complete → Legal Specialist can proceed safely

---

### Stream B: Legal Compliance (Agent 2 - Legal Specialist + Agent 4 - Frontend Dev)

```
DAY 3-5: Legal Implementation
├── Draft Privacy Policy [8h] - Agent 2
├── Draft Terms of Service [8h] - Agent 2
├── Create consent modal [12h] - Agent 4
└── Create legal pages [4h] - Agent 4

DELIVERABLES:
├── /privacy page
├── /terms page
├── Parental consent workflow
└── Consent checkbox in signup
```

**Files Created:**
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/components/workflow/parental-consent.tsx`

**Dependencies:** Security fixes must be complete (secure auth for consent tracking)

**Handoff:** Legal complete → Onboarding can proceed legally

---

### Stream C: Bug Fixes (Agent 3 - Backend Developer)

```
DAY 1-3: HIGH Bug Fixes (PARALLEL with Stream B)
├── Fix Admin Dashboard API [4h]
└── Fix Create Student API [3h]

DELIVERABLES:
├── /api/admin/dashboard returning real data
└── Create Student form connected to API
```

**Files Modified:**
- `src/app/api/admin/dashboard/route.ts`
- `src/app/school-admin/students/create/page.tsx`

**Dependencies:** None (can run parallel to Streams A & B)

**Handoff:** Admin dashboard functional → Phase 2 can reference working patterns

---

## Phase 2: Workflow Revolution (Week 3-6)

### Week 3: Command Palette (Agent 4 - Frontend Developer)

```
WEEK 3 SPRINT:
├── Day 1-2: Base component implementation
├── Day 3-4: Command registry (50+ commands)
├── Day 5: Integration with layouts

DELIVERABLES:
├── CommandPalette component
├── useKeyboardShortcuts hook
└── Global Cmd+K handler
```

**Files Created:**
- `src/components/workflow/command-palette.tsx`
- `src/hooks/workflow/use-keyboard-shortcuts.ts`

**Dependencies:** Phase 1 complete

**Handoff:** Command Palette ready → Express Add can trigger from palette

---

### Week 4: Express Add Modal (Agent 4 - Frontend Developer)

```
WEEK 4 SPRINT:
├── Day 1-2: Component implementation
├── Day 3-4: Configure for 3 entity types
├── Day 5: Integration with list pages

DELIVERABLES:
├── ExpressAddModal component
├── Student quick add
├── Teacher quick add
└── Class quick add
```

**Files Created:**
- `src/components/workflow/express-add-modal.tsx`
- `src/hooks/workflow/use-smart-defaults.ts`

**Dependencies:** Command Palette complete

**Handoff:** Express Add ready → Progressive Form can use same patterns

---

### Week 5: Progressive Form (Agent 5 - Frontend Developer)

```
WEEK 5 SPRINT:
├── Day 1-2: Component implementation
├── Day 3-4: Redesign onboarding flow
├── Day 5: Testing & refinement

DELIVERABLES:
├── ProgressiveForm component
├── Redesigned /setup/unified
└── 91% faster onboarding
```

**Files Created:**
- `src/components/workflow/progressive-form.tsx`
- Modified: `src/app/setup/unified/page.tsx`

**Dependencies:** Express Add complete

**Handoff:** Progressive Form ready → In-Place Editor uses similar patterns

---

### Week 6: In-Place Editor (Agent 5 - Frontend Developer)

```
WEEK 6 SPRINT:
├── Day 1-2: Component implementation
├── Day 3-4: Apply to all tables
├── Day 5: Testing & refinement

DELIVERABLES:
├── InPlaceEditor component
├── All tables editable inline
└── 50% faster edits
```

**Files Created:**
- `src/components/workflow/in-place-editor.tsx`

**Dependencies:** Progressive Form complete

**Handoff:** Phase 2 complete → Phase 3 can reference all workflow patterns

---

## Phase 3: Quick Wins (Week 7-8)

### Parallel Feature Development

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL WORK STREAMS                        │
├─────────────────────────────────────┬───────────────────────────┤
│ Agent 5: Frontend                   │ Agent 6: Full Stack        │
├─────────────────────────────────────┼───────────────────────────┤
│ WEEK 7:                             │ WEEK 7:                    │
│ • Dark Mode (8h)                    │ • AI Study Assistant (20h) │
│ • Push Notifications (12h)          │                           │
├─────────────────────────────────────┼───────────────────────────┤
│ WEEK 8:                             │ WEEK 8:                    │
│ • Bulk Operations (8h)              │ • Student Portfolios (16h) │
│                                     │                           │
└─────────────────────────────────────┴───────────────────────────┘
```

**Dependencies:** Phase 2 complete (workflow patterns available)

**Handoff:** All features ready → Phase 4 technical debt cleanup

---

## Phase 4: Technical Debt (Week 9-10)

### Week 9: Database Query Refactoring (Agent 3 - Backend Developer)

```
WEEK 9: db.query → db.select migration
├── Priority 1: src/lib/api/*.ts files (500+ occurrences)
├── Priority 2: API routes (300+ occurrences)
└── Priority 3: Services and utilities (50+ occurrences)

DELIVERABLES:
└── All 854 db.query usages replaced
```

**Pattern:**
```typescript
// FIND: db.query.users.findFirst(...)
// REPLACE: db.select().from(users).where(...).limit(1)
```

---

### Week 10: Logging & Anti-Patterns (Agent 3 - Backend Developer)

```
WEEK 10: Code cleanup
├── Replace console.log with logger (79 files)
├── Fix relative imports (82 files)
└── Run full type check

DELIVERABLES:
├── Zero console.log occurrences
├── Zero relative imports
└── Clean TypeScript compilation
```

**Pattern:**
```typescript
// FIND: console.log(...)
// REPLACE: logger.info(...)
// FIND: import from "../../../lib"
// REPLACE: import from "@/lib"
```

---

## Synchronization Matrix

| Week | Agent 1 (Security) | Agent 2 (Legal) | Agent 3 (Backend) | Agent 4 (Frontend) | Agent 5 (Frontend) | Agent 6 (Full Stack) | Agent 7 (UX) |
|------|-------------------|-----------------|------------------|-------------------|-------------------|---------------------|-------------|
| **1** | Security fixes | Privacy draft | Bug fixes | - | - | - | - |
| **2** | - | ToS + consent | - | - | - | - | - |
| **3** | - | - | - | Command Palette | - | - | Review |
| **4** | - | - | - | Express Add | - | - | Review |
| **5** | - | - | - | - | Progressive Form | - | Review |
| **6** | - | - | - | - | In-Place Editor | - | Review |
| **7** | - | - | - | - | Dark + Push | AI Assistant | - |
| **8** | - | - | - | - | Bulk Ops | Portfolios | - |
| **9** | - | - | db.query fix | - | - | - | - |
| **10** | - | - | Logging fix | - | - | - | - |

---

## Handoff Protocols

### Security → Legal Handoff (After Week 1, Day 2)

**Checklist:**
- [ ] `/api/debug/` endpoints deleted
- [ ] Middleware blocking added
- [ ] JWT tokens implemented
- [ ] `requireOwnership()` helper created

**Verification:**
```bash
# Run these tests
curl https://staging.api/debug/fix-onboarding  # Should return 404
npm run test:security  # All security tests pass
```

---

### Legal → Bug Fixes Handoff (After Week 1, Day 5)

**Checklist:**
- [ ] Privacy Policy published at `/privacy`
- [ ] Terms of Service published at `/terms`
- [ ] Parental consent modal created
- [ ] Consent tracking in database

**Verification:**
```bash
# Test consent flow
npm run test:consent  # All consent tests pass
```

---

### Phase 1 → Phase 2 Handoff (After Week 2)

**Checklist:**
- [ ] All Phase 1 tasks complete
- [ ] Security audit passed
- [ ] Legal review approved
- [ ] QA acceptance tests passed

**Gate Meeting:** All specialists attend Phase 2 kickoff

---

### Phase 2 → Phase 3 Handoff (After Week 6)

**Checklist:**
- [ ] Command Palette deployed
- [ ] Express Add modal deployed
- [ ] Progressive Form deployed
- [ ] In-Place Editor deployed
- [ ] UX testing passed

**Gate Meeting:** Review onboarding metrics (target: <60 sec)

---

### Phase 3 → Phase 4 Handoff (After Week 8)

**Checklist:**
- [ ] Dark mode deployed
- [ ] Push notifications deployed
- [ ] Bulk operations deployed
- [ ] Student portfolios deployed
- [ ] AI Study Assistant deployed

**Gate Meeting:** Feature acceptance testing

---

## Communication Channels

### Daily Standups (15 minutes)
- **Time:** 9:00 AM UTC
- **Format:** Yesterday, Today, Blockers
- **Attendees:** All active agents

### Weekly Sync (1 hour)
- **Time:** Friday 3:00 PM UTC
- **Format:** Demo, Metrics, Retro
- **Attendees:** All agents + Project Manager

### Gate Reviews (2 hours)
- **Time:** Phase transitions
- **Format:** Presentation, Q&A, Sign-off
- **Attendees:** All specialists + Stakeholders

---

## Escalation Matrix

| Issue Type | Escalate To | Response Time |
|------------|-------------|---------------|
| Security vulnerability | Project Manager | 1 hour |
| Legal compliance issue | Legal Specialist + PM | 2 hours |
| Blocker for another agent | Project Manager | 4 hours |
| Technical disagreement | Engineering Lead | 8 hours |
| Scope change request | Project Manager | 24 hours |

---

## Risk Dashboard

| Risk | Owner | Status | Mitigation | Updated |
|------|-------|--------|------------|---------|
| Security issues found | Agent 1 | 🟢 Monitored | Weekly scans | Daily |
| Legal review delay | Agent 2 | 🟡 On Track | Engaged consultant | Weekly |
| Component complexity | Agent 4 | 🟢 On Track | Daily check-ins | Daily |
| Performance regression | Agent 3 | 🟢 Monitored | Perf budget tracking | Daily |
| User adoption | Agent 7 | 🟡 On Track | Beta testing | Weekly |

---

## Success Metrics Dashboard

### Phase 1 Metrics
```
Security Score:          [████████░░] 80% → 95%
Legal Compliance:        [████░░░░░░] 52% → 80%
QA Score:                [████████░░] 82% → 90%
```

### Phase 2 Metrics
```
Onboarding Time:         [████████████████████████████████░] 8 min → 45 sec
Form Abandonment:        [███████████████████████░░░░░] 35% → 5%
Command Palette Usage:   [░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0% → 40%
```

### Phase 3 Metrics
```
Dark Mode Adoption:      [░░░░░░░░░░░░░░░░░░░░░░░░░░░] Target: 30%
Push Notification Rate:  [░░░░░░░░░░░░░░░░░░░░░░░░░░░] Target: 60%
AI Assistant Usage:      [░░░░░░░░░░░░░░░░░░░░░░░░░░░] Target: 20%
```

### Phase 4 Metrics
```
db.query Usages:         [██████████████████████████████] 854 → 0
console.log Occurrences: [███████████░░░░░░░░░░░░░░░░░░] 161 → 0
Relative Imports:       [██████░░░░░░░░░░░░░░░░░░░░░░░] 82 → 0
```

---

## Next Steps

1. **TODAY:** Assemble specialist teams, assign roles
2. **WEEK 1 DAY 1:** Agent 1 begins security fixes
3. **WEEK 1 DAY 3:** Agent 2 begins legal documents (parallel with Agent 1 completion)
4. **WEEK 2 DAY 5:** Phase 1 gate review
5. **WEEK 3:** Phase 2 kickoff

---

**All teams are hereby authorized to begin work per this plan.**

---

*Document Version: 1.0*
*Last Updated: February 25, 2026*
