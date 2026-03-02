# Documentation TOR (Table of Rules)
# Bhutan EduSkill Project

**Last Updated:** March 2, 2026 - **POST REORGANIZATION**
**Total Files Catalogued:** 200+ MD files
**Purpose:** Single source of truth for ALL project documentation with metadata

---

## 📁 NEW FOLDER STRUCTURE (March 2, 2026)

```
docs/
├── TOR_DOCUMENTATION_INDEX.md  ← YOU ARE HERE (MAIN TOR)
├── core/           (12 files) - Core framework, README, CLAUDE, MEMORY
├── agents/         (9 files)  - Agent docs, AI office, handshake
├── reports/        (29 files) - Sprint/office/status reports
├── sessions/       (11 files) - Session handoffs, progress tracking
├── testing/        (7 files)  - Test reports
├── qa/             (8 files)  - QA audits & reports
├── debug/          (10 files) - Error logs, fixes, scalability prediction
├── design/         (14 files) - UX, design sync
├── audits/         (4 files)  - Security, technical debt, legal audits
├── competitive/    (3 files)  - Competitive analysis
├── workflow/       (4 files)  - Workflow specs & diagrams
├── integration/    (4 files)  - Integration docs
├── flows/          (2 files)  - Flow diagrams
├── ai/             (1 file)   - AI strategy
├── database/       (2 files)  - Database docs
├── deployment/     (2 files)  - Deployment guides
├── guides/         (7 files)  - User guides
├── plans/          (16 files) - Roadmaps
├── architecture/   (8 files)  - System architecture
├── memory/         (5 files)  - Code patterns & anti-patterns
├── legal/          (4 files)  - Privacy, terms, consent
└── archive/        (35+ files)- Historical docs
```

---

## Quick Navigation

| Category | Files | Priority | Path |
|----------|-------|----------|------|
| **[Core Framework](#category-core-framework-critical)** | 12 | ⭐⭐⭐ | `docs/core/` |
| **[Agent Documentation](#category-agent-documentation)** | 9 | ⭐⭐ | `docs/agents/` |
| **[Reports](#category-reports)** | 29 | ⭐⭐ | `docs/reports/` |
| **[Sessions](#category-sessions)** | 11 | ⭐⭐ | `docs/sessions/` |
| **[Testing](#category-testing)** | 7 | ⭐ | `docs/testing/` |
| **[QA](#category-qa)** | 8 | ⭐⭐ | `docs/qa/` |
| **[Debug & Errors](#category-debug--errors)** | 10 | ⭐⭐⭐ | `docs/debug/` |
| **[Design](#category-design)** | 14 | ⭐ | `docs/design/` |
| **[Audits](#category-audits)** | 4 | ⭐⭐ | `docs/audits/` |
| **[Competitive](#category-competitive)** | 3 | ⭐ | `docs/competitive/` |
| **[Workflow](#category-workflow)** | 4 | ⭐ | `docs/workflow/` |
| **[Integration](#category-integration)** | 4 | ⭐ | `docs/integration/` |
| **[Flows](#category-flows)** | 2 | ⭐ | `docs/flows/` |
| **[AI](#category-ai)** | 1 | ⭐ | `docs/ai/` |
| **[Database](#category-database)** | 2 | ⭐⭐ | `docs/database/` |
| **[Deployment](#category-deployment)** | 2 | ⭐ | `docs/deployment/` |
| **[Guides](#category-guides)** | 7 | ⭐ | `docs/guides/` |
| **[Plans](#category-plans)** | 16 | ⭐ | `docs/plans/` |
| **[Memory](#category-memory-patterns)** | 5 | ⭐⭐⭐ | `docs/memory/` |
| **[Architecture](#category-architecture)** | 8 | ⭐⭐ | `docs/architecture/` |
| **[Legal](#category-legal)** | 4 | ⭐⭐ | `docs/legal/` |
| **[Archive](#category-archive)** | 35+ | ⚪ | `docs/archive/` |

---

## Category: Core Framework (CRITICAL)

**Priority:** ⭐⭐⭐ READ FIRST - Before any work
**Location:** `docs/core/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| **DEVELOPMENT_FRAMEWORK.md** | 27KB | **Single source of truth** for all coding patterns |
| **README.md** | 17KB | Project overview, setup, quick start |
| **CLAUDE.md** | 17KB | Project instructions for Claude agents |
| **MEMORY.md** | 26KB | Project memory with sprint history |
| **CHANGELOG.md** | 110KB | Version history and all changes |
| **QUICKREF.md** | 3KB | Quick reference for commands |
| REMAINING_TASKS.md | 2KB | Outstanding tasks list |
| TASKS.md | 3KB | Task documentation |
| CEO_VIBE_CHECK.md | 4KB | CEO status check |
| sprint-1-approval-plan.md | 5KB | Sprint 1 approval plan |
| sprint-1-quickref.md | 2KB | Sprint 1 quick reference |
| sprint-1-team-coordination.md | 4KB | Sprint 1 team coordination |

**Critical Rules from Core Framework:**
1. **Database:** NEVER use `db.query.*` API - Use `db.select().from().leftJoin()`
2. **Field Names:** Use `clerkUserId`, `schoolId` - NEVER `clerkId`, `school_id`
3. **Authentication:** Use `requireAuth()` from `@/lib/auth-utils` - NEVER `auth()` from Clerk
4. **React Hooks:** ALL hooks at component top, BEFORE any conditionals
5. **Framer Motion:** `repeat: Infinity` MUST have `repeatType: "loop"`
6. **Imports:** Use `@/` imports only - NEVER relative paths
7. **TypeScript:** No new `any` types - Build after each file

---

## Category: Agent Documentation

**Priority:** ⭐⭐ Reference for AI agent work
**Location:** `docs/agents/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| **AGENT_TEAM.md** | 20KB | **AI Office Org Chart** - 20 specialized agent roles |
| **AGENT_SOP.md** | 18KB | Standard Operating Procedures for agents |
| **PARALLEL_AGENT_WORKFLOW.md** | 11KB | Parallel work strategy for agents |
| AGENT_TEMPLATES.md | 6KB | Agent response templates |
| AGENT_HEALTH_MONITOR.md | 3KB | Live agent status dashboard |
| AGENT_HANDSHAKE_PROTOCOL.md | 5KB | Agent-to-agent handoff system |
| AGENT_PROGRESS_LOG.md | 4KB | Agent work tracking log |
| AGENT_CRASH_INVESTIGATION_FEBRUARY_25.md | 5KB | Agent crash investigation report |
| AI_OFFICE_ORG_CHART.md | 14KB | Complete AI office structure |

---

## Category: Reports

**Priority:** ⭐⭐ Reference for project status
**Location:** `docs/reports/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| ALL_SPRINTS_STATUS_REPORT.md | 23KB | All sprints completion status |
| AS_ANY_ELIMINATION_REPORT.md | 7KB | `any` type elimination report |
| ROUTE_MIGRATION_PROGRESS.md | 9KB | API route migration progress |
| AUDIT_REPORT_FEB27.md | 14KB | February 27 audit report |
| DATABASE_SCHEMA_AUDIT_2026.md | 8KB | Database schema audit |
| ERROR_REPORT_2026-02-25.md | 5KB | Error report |
| FINAL_HANDOFF.md | 4KB | Final handoff notes |
| HANDOFF_SIMPLE.md | 3KB | Simple handoff |
| IMPLEMENTATION_STATUS.md | 6KB | Implementation status |
| MONTHLY_REPORT_FEBRUARY_2026.md | 12KB | February 2026 monthly report |
| OFFICE_COMPLETION_REPORT_FEBRUARY_2026.md | 18KB | Office completion report |
| OFFICE_EVOLUTION_SPRINT_2.md | 8KB | Sprint 2 office evolution |
| OFFICE_REPORT_FEB27_2026.md | 15KB | February 27 office report |
| PROJECT_MANAGER_REPORT_FEBRUARY_25.md | 10KB | Project manager report |
| SESSION_SUMMARY_FEBRUARY_25.md | 8KB | February session summary |
| SPRINT_2_COMPLETE_FEBRUARY_25.md | 6KB | Sprint 2 completion |
| SPRINT_2_SESSION_LOG_FEBRUARY_25.md | 5KB | Sprint 2 session log |
| SPRINT_2_STATUS_FEBRUARY_25.md | 4KB | Sprint 2 status |
| SPRINT_HANDOFF.md | 5KB | Sprint handoff |
| UNUSED_COMPONENTS_AUDIT_FEBRUARY_2026.md | 9KB | Unused components audit |
| UX_AUDIT_FEBRUARY_2026.md | 12KB | February UX audit |
| agent-activity-log.md | 12KB | Complete agent activity history |
| CODEBASE_METRICS.md | 6KB | Codebase metrics |
| IMPLEMENTATION_PROCESS.md | 3KB | Implementation process |
| IMPLEMENTATION_SUMMARY_COUNSELOR_SENTINEL.md | 4KB | Counselor sentinel implementation |
| IMPLEMENTATION_SUMMARY_PHASE1.md | 5KB | Phase 1 implementation summary |
| JOURNAL_INDEX.md | 3KB | Journal index |
| PROMPT_BLOAT_MANAGEMENT.md | 5KB | Prompt bloat management |
| WHAT_WORKS.md | 4KB | What works summary |

---

## Category: Sessions

**Priority:** ⭐⭐ Reference for session tracking
**Location:** `docs/sessions/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| BATCH_FILE_LIST.md | 3KB | Batch file list |
| NEW_SESSION_EXECUTION_PLAN.md | 9KB | New session execution plan |
| PROGRESS_TRACKER.md | 5KB | Progress tracking |
| PROGRESS_UPDATE_FEB27_SESSION2.md | 5KB | Session 2 progress update |
| SESSIONS_4-5_HANDOFF.md | 8KB | Sessions 4-5 handoff |
| SESSION_3_PROGRESS_FEB27.md | 3KB | Session 3 progress |
| SESSION_COMPLETE_FEB27.md | 3KB | Session complete |
| SESSION_HANDOFF_FEB27.md | 11KB | Session handoff |
| STATUS_FEB27.md | 1KB | February 27 status |
| STATUS_FEB27_SESSION2.md | 6KB | Session 2 status |
| STATUS_SESSION_FINAL_FEB27.md | 2KB | Final session status |

---

## Category: Testing

**Priority:** ⭐ Reference for test documentation
**Location:** `docs/testing/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| admin-portal-qa-report.md | 9KB | Admin portal QA report |
| admin-routes-test-report.md | 5KB | Admin routes test report |
| school-admin-qa-report.md | 9KB | School admin QA report |
| setup-wizard-test-report.md | 7KB | Setup wizard test report |
| sign-in-test-report.md | 2KB | Sign in test report |
| toast-test-report.md | 4KB | Toast notification test report |
| page-status-report.md | 8KB | Page status report |

---

## Category: QA

**Priority:** ⭐⭐ Reference for QA processes
**Location:** `docs/qa/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| QA_AUDIT_PROCESS.md | 3KB | QA audit process documentation |
| QA_COMPREHENSIVE_AUDIT_REPORT.md | 15KB | Comprehensive QA audit |
| QA_IMPLICIT_ANY_ERRORS.md | 2KB | Implicit any errors report |
| QA_QUICK_REFERENCE.md | 4KB | QA quick reference |
| STUDENT_PORTAL_QA_REPORT.md | 8KB | Student portal QA report |
| STUDENT_PORTAL_QA_SUMMARY.md | 5KB | Student portal QA summary |
| TEACHER_PORTAL_MCP_TEST_REPORT.md | 6KB | Teacher portal MCP test |
| qa-test-report.md | 5KB | General QA test report |

---

## Category: Debug & Errors (CRITICAL)

**Priority:** ⭐⭐⭐ CRITICAL - When debugging issues
**Location:** `docs/debug/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| **ERRORS_AND_FIXES.md** | 53KB | **Comprehensive error documentation** |
| **PRODUCTION_ERROR_LOG.md** | 27KB | **Production error log with dates & fixes** |
| **SCALABILITY_ERROR_PREDICTION.md** | 39KB | **Future error prediction (500+ schools)** |
| **TOR_DOCUMENTATION_INDEX.md** | 23KB | **This file - Documentation TOR** |
| DEBUG.md | 6KB | Quick debug reference |
| DEBUG-2.md | 4KB | Debug notes 2 |
| troubleshooting-database-schema-sync.md | 5KB | Database sync troubleshooting |

**Error Categories Documented:**
1. **React Hooks Errors** - "Rendered more hooks than during the previous render"
2. **TypeScript Type Errors** - Type mismatches and `any` type issues
3. **Database/Drizzle ORM Errors** - `referencedTable` errors, query API issues
4. **Authentication Errors** - User not found, permission errors
5. **Framer Motion Errors** - Animation iteration errors
6. **Build/Compilation Errors** - Memory issues, gradient errors
7. **API Response Errors** - Nested data access patterns

---

## Category: Memory (Patterns)

**Priority:** ⭐⭐⭐ CRITICAL - Before writing code
**Location:** `docs/memory/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| **common-mistakes.md** | 8KB | **Common mistakes to avoid** |
| **database-patterns.md** | 6KB | **Database query patterns and rules** |
| **api-patterns.md** | 4KB | **API route templates and patterns** |
| **react-patterns.md** | 3KB | **React component patterns and rules** |

**Key Patterns:**
- **Database:** Use `db.select().from().leftJoin()` - NEVER `db.query.*`
- **API Routes:** Use `createApiRoute` wrapper for consistency
- **React:** Hooks at top, "use client" for hooks, handle redirects in useEffect
- **Authentication:** `requireAuth()` returns database userId
- **Imports:** Always use `@/` alias

---

## Category: Audits

**Priority:** ⭐⭐ Reference for quality assurance
**Location:** `docs/audits/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| security-audit-report.md | 12KB | Security audit (B+ grade) |
| technical-debt-audit.md | 8KB | Technical debt audit |
| legal-compliance-audit.md | 6KB | Legal compliance audit |
| vulnerability-inventory.md | 4KB | Vulnerability inventory |

---

## Category: Design

**Priority:** ⭐ Reference for UI/UX work
**Location:** `docs/design/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| design/README.md | 1KB | Design system index |
| design/portal-colors.md | 2KB | Portal color definitions (RGB) |
| design/ux-standards.md | 8KB | UX standards and guidelines |
| design/component-patterns.md | 4KB | Component design patterns |
| design/advanced-ux-ui.md | 3KB | Advanced UX/UI techniques |
| design/portal-redesign-plan.md | 5KB | Portal redesign roadmap |
| design/CLERK_DESIGN_SYSTEM.md | 4KB | Clerk authentication design |
| UX_REVOLUTION_COMPONENTS.md | 10KB | UX revolution components |
| design-sync-checklist.md | 3KB | Design sync checklist |
| design-sync-diagram.md | 4KB | Design sync diagram |
| design-sync-migration-plan.md | 6KB | Design sync migration |
| design-sync-summary.md | 5KB | Design sync summary |
| ux-audit-report.md | 22KB | UX audit (Grade: B-) |

**Portal Colors:**
- Student: `rgb(249 115 22) → rgb(194 65 12)`
- Teacher: `rgb(59 130 246) → rgb(37 99 235)`
- Parent: `rgb(107 114 128) → rgb(75 85 99)`
- Counselor: `rgb(168 85 247) → rgb(147 51 234)`
- Admin: `rgb(236 72 153) → rgb(219 39 119)`
- School Admin: `rgb(139 92 246) → rgb(124 58 237)`

---

## Category: Competitive

**Priority:** ⭐ Reference for market analysis
**Location:** `docs/competitive/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| competitive-intelligence-report.md | 10KB | Competitive intelligence |
| competitive-feature-matrix.md | 5KB | Competitive feature comparison |
| competitive-quick-wins-guide.md | 4KB | Competitive quick wins |

---

## Category: Workflow

**Priority:** ⭐ Reference for workflow docs
**Location:** `docs/workflow/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| workflow-component-specs.md | 6KB | Workflow component specs |
| workflow-implementation-roadmap.md | 5KB | Workflow implementation |
| workflow-innovation-report.md | 5KB | Workflow innovation |
| workflow-interaction-diagrams.md | 4KB | Workflow diagrams |

---

## Category: Integration

**Priority:** ⭐ Reference for integration docs
**Location:** `docs/integration/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| auto-toast-integration.md | 8KB | Toast notification integration |
| master-sync-plan.md | 6KB | Master sync plan |
| notifications-usage.md | 4KB | Notifications usage |
| push-notifications.md | 5KB | Push notification docs |

---

## Category: Flows

**Priority:** ⭐ Reference for flow diagrams
**Location:** `docs/flows/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| TEACHER_CLASS_FLOW.md | 4KB | Teacher class flow |
| TEACHER_CLASS_SUBJECT_FLOW.md | 4KB | Teacher class subject flow |

---

## Category: AI

**Priority:** ⭐ Reference for AI strategy
**Location:** `docs/ai/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| ai-strategy.md | 5KB | AI features strategy |

---

## Category: Database

**Priority:** ⭐⭐ Reference for database work
**Location:** `docs/database/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| database-schema-reference.md | 27KB | Database schema reference |
| query-optimizations.md | 9KB | N+1 query fixes |

---

## Category: Deployment

**Priority:** ⭐ Reference for deployment
**Location:** `docs/deployment/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| DEPLOYMENT.md | 16KB | Deployment guide |
| BROWSER_MCP_SETUP.md | 4KB | Browser MCP setup |

---

## Category: Guides

**Priority:** ⭐ Reference for users
**Location:** `docs/guides/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| USER_MANUAL.md | 25KB | Comprehensive user manual |
| change-control-process.md | 17KB | Zero technical debt process |
| system-flow-diagram.md | 5KB | System flow diagram |
| tasklist-implementation.md | 3KB | Task list implementation |
| guides/README.md | 1KB | Guides index |
| guides/deployment.md | 4KB | Deployment guide |

---

## Category: Plans

**Priority:** ⭐ Reference for future work
**Location:** `docs/plans/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| plans/roadmap.md | 5KB | Project roadmap |
| plans/mobile-app.md | 3KB | Mobile application plan |
| plans/mobile-progress.md | 2KB | Mobile development progress |
| plans/ministry-portal.md | 4KB | Ministry portal plan |
| plans/ai-features.md | 5KB | AI features plan |
| plans/ai-insights.md | 4KB | AI insights plan |
| plans/hierarchical-ecosystem.md | 3KB | Hierarchical ecosystem |
| plans/hierarchical-progress.md | 2KB | Hierarchical progress |
| optimization-roadmap.md | 4KB | Optimization roadmap |
| project-status-summary.md | 8KB | Project status |
| project-task-backlog.md | 6KB | Task backlog |

---

## Category: Architecture

**Priority:** ⭐⭐ Reference for system design
**Location:** `docs/architecture/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| architecture/README.md | 1KB | Architecture index |
| architecture/overview.md | 9KB | System architecture overview |
| architecture/database-schema.md | 4KB | Database schema docs |
| architecture/database-testing.md | 5KB | Database testing |
| architecture/file-structure.md | 6KB | File organization |
| architecture/portal-routes.md | 1KB | Portal routes |
| architecture/technology-stack.md | 13KB | Technology stack |
| architecture/vision-objectives.md | 9KB | Vision & objectives |

---

## Category: Legal

**Priority:** ⭐⭐ Reference for legal requirements
**Location:** `docs/legal/`
**Last Updated:** March 2, 2026

| File | Size | Purpose |
|------|------|---------|
| legal/README.md | 1KB | Legal documentation index |
| legal/privacy-policy-template.md | 8KB | Privacy policy template |
| legal/terms-of-service-template.md | 6KB | Terms of service template |
| legal/parental-consent-template.md | 3KB | Parental consent template |

---

## Category: Archive

**Priority:** ⚪ Historical reference only
**Location:** `docs/archive/`
**Last Updated:** March 2, 2026

| Subfolder | Files | Purpose |
|-----------|-------|---------|
| archive/root-files/ | 8 | Historical root files |
| archive/outdated-plans/ | 12 | Outdated implementation plans |
| archive/build-reports/ | 3 | Build success reports |
| archive/build-logs/ | 1 | Historical build logs |
| archive/change-logs/ | 2 | Historical changelogs |
| archive/session-logs/ | 1 | Session logs |
| archive/api-routes.md | 1 | Historical API routes |
| archive/auth-flow.md | 1 | Historical auth flow |

---

## Documentation Statistics

**Total Files:** 200+ MD files
**Total Size:** ~1.5 MB
**Active Documentation:** 120+ files (60%)
**Archive Documentation:** 80+ files (40%)

**Documentation by Status:**
- 🟢 Active: 120+ files (60%)
- 🟡 Partial: 35 files (18%)
- ⚪ Archived: 80+ files (40%)

---

## Most Critical Files (Read First)

1. `docs/core/DEVELOPMENT_FRAMEWORK.md` - Single source of truth
2. `docs/debug/ERRORS_AND_FIXES.md` - All error fixes
3. `docs/debug/PRODUCTION_ERROR_LOG.md` - Production errors with dates
4. `docs/debug/SCALABILITY_ERROR_PREDICTION.md` - Future error prediction
5. `docs/memory/database-patterns.md` - Database rules
6. `docs/memory/api-patterns.md` - API patterns
7. `docs/memory/common-mistakes.md` - Anti-patterns
8. `docs/core/README.md` - Project overview
9. `docs/core/CLAUDE.md` - Agent instructions
10. `docs/core/MEMORY.md` - Project memory

---

## END OF TOR

**This is the MAIN TOR file for all Bhutan EduSkill documentation.**

*Last Updated: March 2, 2026 - Post Reorganization*
*Next Review: April 2, 2026*
*Maintainer: Documentation Specialist Agent*
