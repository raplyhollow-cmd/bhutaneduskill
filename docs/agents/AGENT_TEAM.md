# Specialized Agent Team Structure

> **Purpose:** Organize AI agents into a highly specialized IT company team structure for efficient collaboration and task delegation.
> **Last Updated:** February 26, 2026
> **Version:** 2.2 - System Administrator Role Added

---

## ⚠️ CRITICAL: Read Before Spawning Agents

**NEVER spawn an agent directly for large tasks.** Always route through Project Manager first.

### Decision Tree

```
Is your task <5 files and <30k tokens?
├─ YES → Spawn specialist agent directly
└─ NO  → Start with Project Manager first
```

### Large Task Indicators (NEVER spawn directly)

- "Audit all portals"
- "Fix all components"
- "Review entire codebase"
- "Scan 50+ files"
- "Integrate across all pages"

### If You Ignore This Rule

- **Result:** Agent crashes with "exceeds context" error
- **Recovery:** Use Project Manager to break into chunks
- **Time lost:** 5-10 minutes per crash

---



## 🆕 What's New in v2.2

| Change | Reason |
|--------|--------|
| **NEW:** System Administrator Role | Monitor agents across windows, prevent 200k crashes |
| **NEW:** Token & Resource Monitoring | Auto-stop agents at critical resource levels |
| **NEW:** Agent Recovery Protocol | Clear tokens and restart crashed agents |

## 🆕 What's New in v2.1

| Change | Reason |
|--------|--------|
| **CRITICAL:** Project Manager Context Limits | Agents crashing with 190k+ token input |
| **NEW:** Context Budgeting Protocol | Each agent gets max 50k tokens of context |
| **NEW:** Subtasking Pattern** | Break large tasks into <50k chunks |
| **NEW:** File Read Limits** | Max 5-10 files per agent spawn |
| **UPDATED:** Model Selection** | Use Haiku for exploration (larger context) |

## 🆕 What's New in v2.0

Based on Sprint 1 completion and critical UX issue discovery:

| Change | Reason |
|--------|--------|
| **NEW:** Component Integration Specialist | Components were created but never integrated into live pages |
| **UPDATED:** UX Audit Specialist | Now audits LIVE pages, not component library |
| **NEW:** Implementation Verification Agent | Ensures features actually work in browser |
| **UPDATED:** Metrics | Track implementation, not just creation |
| **NEW:** Sprint Planning Process | Lessons learned from Sprint 1 |
| **NEW:** Schema Auditor | Database has 180 tables, needs dedicated oversight |

---

## Overview

This document defines the **Bhutan EduSkill AI Development Team** - a virtual IT company structure where each AI agent has a specialized role, expertise area, and clear responsibilities.

**Team Philosophy:** "Right Agent, Right Task" - Each task is assigned to the agent with the most relevant expertise.

**Critical Lesson from Sprint 1:** Creating components ≠ Integrating components. We need an agent specifically responsible for integrating new components into actual pages.

---

## 🔴 CRITICAL: Context Management Protocol (v2.1)

### The Problem (February 25, 2026)

Multiple agents failed with:
```
API Error: 400 - Request 190k-208k input tokens exceeds model's maximum context length 202750
```

**Root Cause:** Project Manager was spawning agents with entire documentation + large codebase context.

### Context Budgeting Rules

| Rule | Limit | Enforcement |
|------|-------|-------------|
| **Max context per agent** | 50,000 tokens | PM must enforce |
| **Max files to read** | 5-10 files | Use Grep/Glob first |
| **Documentation included** | Only relevant sections | Never full docs |
| **Parallel agents** | Max 3 at once | Prevents context explosion |

### Project Manager v2.1 Responsibilities

**BEFORE spawning any agent:**

1. **Estimate context size:**
   - Full DEVELOPMENT_FRAMEWORK.md ≈ 15k tokens ❌ Too large
   - One schema.ts file ≈ 25k tokens ⚠️ Use with caution
   - One component file ≈ 2-5k tokens ✅ Good
   - Grep results ≈ 1-3k tokens ✅ Good

2. **Select files carefully:**
   ```bash
   # WRONG - Reading everything
   "Read the entire codebase and audit all portals"  # 200k+ tokens 💀

   # RIGHT - Targeted exploration
   "Use Glob to find counselor portal files, then read 3 most important"
   ```

3. **Break large tasks:**
   ```
   ❌ "Audit all 7 portals (354 APIs, 218 components)"
   ✅ "Audit counselor portal only (15 pages)"
   ✅ "Then spawn separate agents for other portals"
   ```

### Model Selection by Context Needs

| Task | Model | Context Window | When to Use |
|------|-------|----------------|-------------|
| **Exploration/Search** | Haiku 4.5 | 200k | Finding files, grep searches |
| **Implementation** | Sonnet 4.6 | 200k | Writing code, <50k context |
| **Complex Planning** | Opus 4.6 | 200k | Architecture, <30k context |
| **Batch Processing** | Haiku 4.5 | 200k | Multiple parallel agents |

### Subtasking Pattern (How to Break Down Tasks)

**Pattern 1: Sequential Portal Audit**
```
Step 1: List all files for counselor portal (Glob)
Step 2: Spawn Agent A → Read 5 critical files, report findings
Step 3: Spawn Agent B → Read 5 more files, continue audit
Step 4: Compile combined report
```

**Pattern 2: Divide and Conquer**
```
Task: "Fix 50 files with deprecated imports"
Step 1: Grep to find all affected files → returns 50 files
Step 2: Spawn Agent A → Fix files 1-10
Step 3: Spawn Agent B → Fix files 11-20
Step 4: (Continue with more agents in batches of 3)
```

**Pattern 3: Documentation On-Demand**
```
❌ DON'T: "Here's DEVELOPMENT_FRAMEWORK.md (15k tokens) + AGENT_SOP.md + ERROR fixes..."
✅ DO: "Follow these 3 critical rules from docs:
   1. Use db.select().from(), never db.query.*
   2. Field name is clerkUserId, not clerkId
   3. Check schema.ts before using columns"
```

### Agent Launch Checklist (PM MUST Use)

| Check | Question | Pass/Fail |
|-------|----------|-----------|
| Context size | "Is this <50k tokens?" | ☐ |
| File count | "Am I reading <10 files?" | ☐ |
| Documentation | "Only including relevant sections?" | ☐ |
| Parallel count | "Are <3 agents running?" | ☐ |
| Fallback | "If agent crashes, what's Plan B?" | ☐ |

**If any check fails:** REDUCE scope or break into subtasks.

---

## Team Structure Diagram (v2.2)

```
                    ┌─────────────────────────────────┐
                    │      SYSTEM ADMINISTRATOR ⭐     │
                    │      (Resource Monitoring)       │
                    │      - Monitors tokens          │
                    │      - Monitors CPU/RAM         │
                    │      - Auto-restarts agents     │
                    └──────────────────┬──────────────┘
                                       │
                    ┌──────────────────▼──────────────┐
                    │   PROJECT MANAGER               │
                    │   (Orchestrator Agent)          │
                    └───────────┬─────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│  BACKEND LEAD  │    │  FRONTEND LEAD  │    │  DATA LEAD      │
│  (API Agent)   │    │  (UI Agent)     │    │  (DB Agent)     │
└───────┬────────┘    └────────┬────────┘    └────────┬────────┘
        │                      │                      │
┌───────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│ Auth Specialist│    │ Component Int.  │    │ Query Optimizer │
│ (Security)     │    │ Specialist ⭐   │    │ (Performance)   │
└────────────────┘    └─────────────────┘    └─────────────────┘
                                                    │
                                      ┌─────────────┴─────────────┐
                                      │                           │
                              ┌───────▼────────┐        ┌────────▼────────┐
                              │ Impl. Verify   │        │ Schema Auditor  │
                              │ Agent ⭐        │        │                 │
                              └────────────────┘        └─────────────────┘

⭐ = NEW in v2.0/v2.2
```

---

## System Administrator Dashboard (v2.2)

### Current Agent Status

| Window/Session | Agent | Task | Tokens | CPU | RAM | Status |
|----------------|-------|------|--------|-----|-----|--------|
| (Main) | System Admin | Monitoring all agents | ~5k | Low | Low | ✅ Active |
| - | - | - | - | - | - | - |

### Resource Usage

```
CPU Usage:  ▓▓░░░░░░░░ 25%
RAM Usage:  ▓▓▓▓░░░░░░ 40%
Token Budget: Available (0 agents approaching limit)
```

### Recent Agent Actions

| Time | Action | Agent | Result |
|------|--------|-------|--------|
| Feb 26 | Build verification | Main | ✅ Passed |
| - | - | - | - |

---

---

## NEW: Sprint 2 Specialist Agents

### 🧩 Component Integration Specialist ⭐

**Model:** Sonnet 4.6

**Created After:** Sprint 1 Critical Issue - "UX/UI team didn't do the job"

**The Problem:**
- 50+ components CREATED in `src/components/ui/`
- 0 components INTEGRATED into actual pages
- UX audit graded component library, not live implementation
- User feedback: "still old one, all disorganize"

**Responsibilities:**
- Integrate new components into actual pages (not just create them)
- Update portal layouts to use new components
- Replace legacy components with new ones
- Ensure consistent component usage across portals
- Fix visual issues (header transparency, badge alignment)

**Files Owned:**
- `src/app/[portal]/layout.tsx` - All 7 portal layouts
- `src/components/mobile/universal-mobile-sidebar.tsx` - Header fixes
- Component integration tracking

**Required Reading:**
- `docs/plans/idempotent-dreaming-pelican.md` - A+ grade plan with line numbers
- `docs/UX_REVOLUTION_COMPONENTS.md` - Available components

**Immediate Tasks (Sprint 2):**
| Task | File | Line | Time |
|------|------|------|------|
| Fix header transparency | `universal-mobile-sidebar.tsx` | 502 | 10 min |
| Fix badge alignment | `universal-mobile-sidebar.tsx` | 553 | 10 min |
| Fix title contrast | `universal-mobile-sidebar.tsx` | 511 | 10 min |
| Integrate NotificationBell | `admin-layout-client.tsx` | All | 30 min |
| Add Command Palette | All portal layouts | All | 1 hour |

**Critical Success Metric:** Components are USED in pages, not just CREATED

---

### ✅ Implementation Verification Agent ⭐

**Model:** Sonnet 4.6

**Created After:** Need to verify features actually work in browser

**Responsibilities:**
- Verify features work in actual browser (not just code compiles)
- Check for console errors
- Test user flows end-to-end
- Visual regression detection
- Report "works in code but not in browser" issues

**Verification Checklist:**
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Visuals match design
- [ ] User flows work
- [ ] Components are interactive
- [ ] Responsive on mobile

**Critical Success Metric:** Zero "works on my machine" issues

---

### 🗄️ Schema Auditor ⭐

**Model:** Opus 4.6

**Created After:** Sprint 1 discovered 180 tables with 10 duplicate exports

**Responsibilities:**
- Audit schema for issues
- Identify duplicate exports
- Plan schema evolution
- Document table relationships
- Track migration needs

**Files Owned:**
- `docs/DATABASE_SCHEMA_AUDIT_2026.md` - Schema health (7.5/10)
- `src/lib/db/schema.ts` - All 180 tables

**Sprint 1 Track Record:** ✅ Identified 10 duplicate table exports, evolution plan ready

**Sprint 2 Tasks:**
| Priority | Task | Time |
|----------|------|------|
| 🔴 URGENT | Fix 10 duplicate table exports | 1 day |
| 🟡 HIGH | Add composite indexes | 1 day |
| 🟢 MEDIUM | Document table relationships | 2 hours |

---

### 🖥️ System Administrator ⭐ (v2.2)

**Model:** Any (Monitoring Role)

**Created After:** Need to monitor agents across multiple windows/sessions

**The Problem:**
- Agents crash when approaching 200k token limit
- Multiple agents running simultaneously exhaust CPU & RAM
- No oversight of resource usage across windows
- Crashed agents waste time and tokens

**Responsibilities:**
- Monitor all agents across different windows/sessions
- Stop agents approaching 200k token limit → clear tokens → restart
- Monitor CPU & RAM usage → stop agents at critical levels
- Restart agents when resources become available
- Maintain agent health dashboard

**Monitoring Thresholds:**

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| **Token Usage** | 150k | 180k | Stop, clear, restart |
| **CPU Usage** | 80% | 95% | Pause non-urgent agents |
| **RAM Usage** | 80% | 90% | Stop agents, restart later |
| **Parallel Agents** | 3 | 5 | Queue new tasks |

**Agent Recovery Protocol:**

```bash
# When agent approaches 200k tokens:
1. STOP the agent immediately
2. CLEAR conversation context (start fresh)
3. RESTART with reduced scope
4. DOCUMENT where it stopped (for handoff)

# When CPU/RAM critical:
1. IDENTIFY lowest priority agents
2. STOP those agents
3. WAIT for resources to free up
4. RESTART agents in priority order
```

**Commands Used for Monitoring:**

```bash
# Check running tasks
ls "D:\TEMP\claude\d--VS-STUDIO-PROJECT-bhutaneduskill\tasks"

# Check system resources (Windows)
wmic cpu get loadpercentage
wmic OS get FreePhysicalMemory

# Check TypeScript build status
npx tsc --noEmit
```

**Priority Order for Restarting:**

1. 🔴 CRITICAL: Build-breaking fixes
2. 🟡 HIGH: User-facing features
3. 🟢 MEDIUM: Documentation/refactoring
4. 🔵 LOW: Nice-to-have improvements

**Files Owned:**
- `docs/AGENT_HEALTH_MONITOR.md` - Agent status dashboard (to be created)
- Agent crash logs and recovery reports

**Critical Success Metric:** Zero agent crashes from token overflow or resource exhaustion

---

## Updated Agent Roles

### 🔍 UX Audit Specialist (UPDATED v2.0)

**Model:** Sonnet 4.6

**Critical Change from v1.0:**

| v1.0 (WRONG) | v2.0 (CORRECT) |
|--------------|----------------|
| Audited component library files | Audits LIVE pages in browser |
| Gave B+ grade based on existence | Found critical issues on login |
| Counted components created | Checked components actually used |

**New Process:**
1. Login to actual dashboard
2. Navigate through pages
3. Document visual issues
4. Check component integration
5. Report implementation gaps

---

## Task Assignment Matrix (Updated v2.0)

| Task Type | Primary Agent | Secondary Agent | Model |
|-----------|--------------|-----------------|-------|
| Create API endpoint | Backend Lead | Security Specialist | Opus |
| Create React component | Design System Specialist | Frontend Lead | Haiku |
| **Integrate component into pages** | **Component Integration Specialist** ⭐ | Frontend Lead | Sonnet |
| **Verify feature in browser** | **Implementation Verification Agent** ⭐ | QA Specialist | Sonnet |
| **Audit LIVE UX** | **UX Audit Specialist** ⭐ | Component Integration | Sonnet |
| Fix schema duplicates | Schema Auditor ⭐ | Data Lead | Opus |
| Complex multi-step task | Project Manager | Spawns specialists | Sonnet |

---

## Sprint Planning Process (NEW v2.0)

### Sprint Kickoff

1. Project Manager reviews previous sprint completion report
2. Identifies critical issues from **user feedback**
3. Creates sprint plan with:
   - Critical fixes (from user feedback)
   - Planned improvements (from roadmap)
   - Stretch goals (if capacity allows)

### During Sprint

1. Component Integration Specialist ensures components are USED
2. Implementation Verification Agent tests in browser
3. Documentation Specialist updates progress

### Sprint Retrospective

1. Review what was completed vs planned
2. Document lessons learned
3. Update team structure if needed

---

## Sprint 2 Priorities

Based on Sprint 1 critical UX issue:

| Priority | Task | Agent | Time |
|----------|------|-------|------|
| 🔴 CRITICAL | Fix header transparency | Component Integration | 10 min |
| 🔴 CRITICAL | Fix badge alignment | Component Integration | 10 min |
| 🔴 CRITICAL | Fix title contrast | Component Integration | 10 min |
| 🟡 HIGH | Integrate NotificationBell | Component Integration | 30 min |
| 🟡 HIGH | Add Command Palette | Component Integration | 1 hour |
| 🟡 HIGH | Fix duplicate schema exports | Schema Auditor | 2 hours |
| 🟢 MEDIUM | Migrate 50 API routes | Backend Lead | 1 week |
| 🟢 MEDIUM | Reduce `any` types to <50 | Technical Debt Auditor | 3 days |

---

## Quick Reference Card (v2.1)

| Need | Agent | Model | Context Limit |
|------|-------|-------|---------------|
| "Create API" | Backend Lead | Opus | <30k tokens |
| "Fix hooks error" | Frontend Lead | Sonnet | <50k tokens |
| **"Integrate component"** | **Component Integration Specialist** ⭐ | Sonnet | <50k tokens |
| **"Verify in browser"** | **Implementation Verification Agent** ⭐ | Sonnet | <30k tokens |
| **"Audit live UX"** | **UX Audit Specialist** ⭐ | Sonnet | <50k tokens |
| "Schema issues" | Schema Auditor ⭐ | Opus | <30k tokens |
| "Find files" | Explorer Agent | Haiku | 100k+ tokens |
| **"Large task (needs breaking down)"** | **Project Manager** ⭐ | Sonnet | Break into <50k chunks |

**Context Emergency:**
| Symptom | Fix |
|---------|-----|
| Agent crashes with "exceeds context" | PM failed to budget context |
| Task too big for one agent | Break into subtasks, spawn sequentially |
| Too many parallel agents | Max 3 at a time |
| Full docs included | Only relevant sections |

---

## Critical Lessons Learned (Sprint 1 → Sprint 2)

| Lesson | Impact | Sprint 2 Change |
|--------|--------|-----------------|
| Components ≠ Integration | UX grade based on library, not live pages | NEW: Component Integration Specialist |
| Code ≠ Working | Features work in code but not browser | NEW: Implementation Verification Agent |
| Audits need live testing | UX audit missed critical issues | UPDATED: UX Audit Specialist audits live pages |
| Schema has duplicates | 10 duplicate table exports found | NEW: Schema Auditor role |
| User feedback critical | Discovered issues audits missed | Sprint planning starts with user feedback |
| **Context overflow crashes agents** | **PM gave agents 190k+ tokens** | **NEW: Context Budgeting Protocol** |

---

## Team Metrics

| Metric | v1.0 | v2.0 | v2.2 |
|--------|------|------|------|
| Total Agents | 16 | **18** | **19** |
| Component Integration | Not tracked | **NEW metric** |
| Live Verification | Not tracked | **NEW metric** |
| UX Audit Method | File-based | **Browser-based** |
| Sprint Planning | Ad-hoc | **Structured process** |

---

**Version History:**
- v1.0 (February 25, 2026) - Initial structure
- v2.0 (February 25, 2026) - Post-Sprint 1 evolution
- v2.1 (February 25, 2026) - Context management fix after agent crashes
- v2.2 (February 26, 2026) - System Administrator role added for resource monitoring

**Remember:**
1. Creating components ≠ Integrating components. Use Component Integration Specialist to bridge the gap.
2. **CRITICAL:** Context budgeting prevents crashes. Max 50k tokens per agent.
3. **When in doubt:** Start with Project Manager to analyze and delegate (with context limits).
