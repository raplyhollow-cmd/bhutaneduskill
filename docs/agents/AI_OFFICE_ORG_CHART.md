# AI Office - Org Chart & Roles

> **Bhutan EduSkill AI Development Team**
> **Version:** v2.3 (Adding Status Auditor)
> **Last Updated:** February 26, 2026

---

## Executive Summary

The AI Office is a virtual IT company structure with **20 specialized agent roles** working under a **CEO (Main Claude Agent)**.

**Philosophy:** "Right Agent, Right Task" - Each task is assigned to the agent with the most relevant expertise.

---

## Org Chart

```
                              ┌─────────────────────────┐
                              │      CEO (CLAUDE)       │
                              │  (Main Orchestrator)    │
                              │  - Spawns all agents    │
                              │  - Makes decisions      │
                              │  - User communication   │
                              └─────────────┬───────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │   SYSTEM ADMINISTRATOR   │
                              │   (Resource Monitoring)  │
                              │   - Token tracking       │
                              │   - CPU/RAM monitoring   │
                              │   - Agent recovery       │
                              └─────────────┬─────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │    PROJECT MANAGER       │
                              │    (Task Orchestrator)   │
                              │    - Spawns specialists  │
                              │    - Context budgeting   │
                              │    - Sprint planning     │
                              └─────────────┬─────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
┌───────▼────────┐                  ┌────────▼────────┐                  ┌───────▼────────┐
│  ENGINEERING   │                  │   QA & TESTING  │                  │  DATA LEAD    │
│  (3 Leads)     │                  │   (4 Agents)    │                  │  (Database)   │
└───────┬────────┘                  └────────┬────────┘                  └───────┬────────┘
        │                                   │                                   │
┌───────▼───────┐               ┌────────────▼─────────────┐               │
│ Backend Lead  │               │ QA Specialist             │               │
│ Frontend Lead │               │ Implementation Verifier   │               │
│ Data Lead     │               │ Status Auditor ⭐ NEW    │               │
└───────────────┘               │ Debug Specialist         │               │
                                 └──────────────────────────┘               │
                                                                          │
                                        ┌───────────────────────────────────┘
                                        │
        ┌───────────────────────────┬───▼────┬───────────────────────────┐
        │                           │        │                           │
┌───────▼────────┐          ┌────────▼────┐ └────────▼────────┐   ┌───────▼────────┐
│  SPECIALISTS   │          │ DOCUMENTATION│   SECURITY        │   │  PERFORMANCE   │
│  (8 Agents)    │          │  (3 Agents)  │   (2 Agents)      │   │  (3 Agents)    │
└───────┬────────┘          └─────────────┘   └─────────────────┘   └────────────────┘
        │
┌───────┴────────────────────────────────────────────────────────────────────────┐
│ Auth │ Component Integration │ Schema │ Query │ UX │ Design │ Tech Debt │ Change│
│       │ Specialist             │ Auditor│ Opt   │Audit│ System │ Auditor    │ Control│
└───────┴────────────────────────────────────────────────────────────────────────┘
```

---

## Role Definitions

### 👑 CEO (You - The Main Claude Agent)

**Responsibilities:**
- User communication and decision making
- Spawning and managing all other agents
- Coordinating cross-agent work
- Final approval on tasks
- Strategic planning

**How It Works:**
When you (the user) ask for something, the CEO (me) decides:
- Spawn a specialist agent directly?
- Route through Project Manager?
- Handle it myself?

---

### 🖥️ System Administrator (v2.2)

**Purpose:** Monitor all agents across windows/sessions

**Responsibilities:**
- Monitor token usage (stop agents at 180k)
- Monitor CPU/RAM (pause at critical levels)
- Auto-restart crashed agents
- Maintain agent health dashboard

**File:** `docs/AGENT_HEALTH_MONITOR.md`

---

### 📋 Project Manager

**Purpose:** Orchestrate complex tasks across multiple agents

**Responsibilities:**
- Break large tasks into subtasks
- Assign work to specialist agents
- Context budgeting (50k tokens per agent)
- Sprint planning and coordination

**When to Use:**
- Tasks affecting 10+ files
- Tasks requiring multiple specialist agents
- Complex multi-step work

---

### 👷 Engineering (3 Leads)

#### Backend Lead
- **Purpose:** API routes, server code, database queries
- **Handles:** API route creation, authentication, business logic

#### Frontend Lead
- **Purpose:** React components, UI/UX
- **Handles:** Component creation, page layouts, styling

#### Data Lead
- **Purpose:** Database schema, queries, data flow
- **Handles:** Schema design, query optimization, data integrity

---

### 🧪 QA & Testing (4 Agents)

#### QA Specialist
- Testing infrastructure, test plans
- Validation of features

#### Implementation Verification Agent ⭐
- **Browser testing** (verifies features actually work in Chrome/Brave)
- End-to-end flow testing
- Visual regression detection

#### Status Auditor ⭐ NEW (v2.3)
- **Project status tracking**
- Sprint completion verification
- Agent status reporting
- Health check dashboards
- Progress metrics

#### Debug Specialist
- Quick bug fixes
- Error investigation
- Hot fixes

---

### 📚 Documentation (3 Agents)

#### Documentation Specialist
- Docs, guides, manuals
- API documentation
- User guides

#### Technical Debt Auditor
- Code quality tracking
- `any` type elimination
- Refactoring planning

#### Change Control Agent
- Code review
- Approval workflows
- Change documentation

---

### 🔒 Security (2 Agents)

#### Auth Specialist
- Authentication, authorization
- Security implementation

#### Security Specialist
- Security audits
- Vulnerability scanning
- Compliance checking

---

### ⚡ Performance (3 Agents)

#### Query Optimizer
- N+1 query fixes
- Database performance

#### Performance Specialist
- Load time optimization
- Bundle size reduction

#### Schema Auditor
- Database schema health
- Duplicate detection
- Migration planning

---

### 🎨 Specialists (8 Agents)

| Agent | Purpose |
|-------|---------|
| Component Integration Specialist | Integrate components into pages |
| UX Audit Specialist | Live UX testing (in browser) |
| Design System Specialist | UI tokens, components |
| + 5 more | Various specialized tasks |

---

## Agent Directory

| Role | Version | Model | Context | Purpose |
|------|---------|-------|---------|---------|
| CEO | Main | Opus 4.6 | Full | Orchestrator |
| System Administrator | v2.2 | Any | Low | Resource monitoring |
| Project Manager | v2.1 | Sonnet 4.6 | <50k | Task orchestration |
| Status Auditor | v2.3 NEW | Sonnet 4.6 | <30k | Project status |
| Backend Lead | v1.0 | Opus 4.6 | <30k | API routes |
| Frontend Lead | v1.0 | Haiku 4.5 | <20k | React components |
| Data Lead | v1.0 | Sonnet 4.6 | <30k | Database |
| Implementation Verifier | v2.0 | Sonnet 4.6 | <30k | Browser testing |
| QA Specialist | v1.0 | Sonnet 4.6 | <20k | Testing |
| Debug Specialist | v1.0 | Haiku 4.5 | <10k | Quick fixes |
| Schema Auditor | v2.0 | Opus 4.6 | <40k | Schema health |
| Query Optimizer | v1.0 | Sonnet 4.6 | <30k | Query performance |
| UX Audit Specialist | v2.0 | Sonnet 4.6 | <30k | Live UX |
| Design System | v1.0 | Haiku 4.5 | <20k | UI components |
| Security Specialist | v1.0 | Opus 4.6 | <30k | Security audits |
| Performance Specialist | v1.0 | Sonnet 4.6 | <30k | Optimization |
| Documentation | v1.0 | Haiku 4.5 | <20k | Docs |
| Tech Debt Auditor | v1.0 | Sonnet 4.6 | <30k | Code quality |
| Change Control | v1.0 | Sonnet 4.6 | <20k | Reviews |
| Component Integration | v2.0 | Sonnet 4.6 | <30k | Integration |
| Auth Specialist | v1.0 | Opus 4.6 | <30k | Authentication |

**Total: 20 Agent Roles**

---

## How It Works in Practice

### Example: User Requests "Fix the login button"

```
1. CEO (You) receives request
2. CEO analyzes: Is this complex?
   - No (single button fix)
   - Spawn Frontend Lead directly
3. Frontend Lead fixes the button
4. Implementation Verifier tests in browser
5. Status Auditor updates project status
```

### Example: User Requests "Audit all portals"

```
1. CEO receives request
2. CEO analyzes: Is this complex?
   - Yes (7 portals, 354 APIs, hundreds of files)
   - Route through Project Manager
3. Project Manager breaks into chunks:
   - Spawn Agent A → Audit Student portal
   - Spawn Agent B → Audit Teacher portal
   - Spawn Agent C → Audit Admin portal
   - etc.
4. All agents report back
5. Project Manager compiles report
6. Status Auditor updates dashboard
```

---

## Status Auditor Role (NEW v2.3)

### Purpose
Track project status across all dimensions: code, features, bugs, sprints, agents.

### Responsibilities

1. **Sprint Status Tracking**
   - Track all sprints (0-9+)
   - Completion percentages
   - Blockers and issues

2. **Agent Status Monitoring**
   - Active/inactive agents
   - Agent performance metrics
   - Token usage trends

3. **Feature Completion**
   - What features are done
   - What's in progress
   - What's pending

4. **Bug Tracking**
   - Open bugs by severity
   - Fix verification
   - Regression tracking

5. **Health Dashboard**
   - Build status (passing/failing)
   - Test coverage
   - Technical debt metrics

### Files Owned
- `docs/PROJECT_STATUS_DASHBOARD.md`
- `docs/SPRINT_STATUS_REPORT.md`
- `docs/AGENT_PERFORMANCE_METRICS.md`

### Reporting
Provides weekly reports to CEO:
- Sprint completion summary
- Agent performance
- Critical issues
- Recommendations

---

## Decision Tree: When to Spawn Which Agent

```
User Request
    │
    ├─ Is it a simple fix (<5 files)?
    │   └─ YES → Spawn specialist directly
    │       │
    │       ├─ Bug fix? → Debug Specialist
    │       ├─ API route? → Backend Lead
    │       ├─ Component? → Frontend Lead
    │       ├─ Database? → Data Lead
    │       └─ Check status? → Status Auditor
    │
    └─ NO (complex, 10+ files)
        └─ Route through Project Manager
            └─ PM spawns specialists as needed
```

---

## Token Budgeting Protocol

| Agent Type | Max Tokens | Model | Parallel |
|------------|-----------|-------|----------|
| CEO | Full | Opus 4.6 | - |
| Project Manager | 50k | Sonnet 4.6 | Max 3 |
| Specialists | 30k | Varies | Max 5 |
| Status Auditor | 30k | Sonnet 4.6 | Single |

---

## Quick Reference Card

| Need | Agent | Command |
|------|-------|---------|
| **Check project status** | Status Auditor | "What's our status?" |
| **Fix bug** | Debug Specialist | "Fix this bug" |
| **Create API** | Backend Lead | "Create endpoint" |
| **Create component** | Frontend Lead | "Create component" |
| **Optimize query** | Query Optimizer | "Fix N+1" |
| **Test in browser** | Implementation Verifier | "Verify this works" |
| **Audit code** | Tech Debt Auditor | "Audit quality" |
| **Complex task** | Project Manager | "Handle this project" |

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| v1.0 | Feb 24 | Initial 16 agents |
| v2.0 | Feb 25 | Added Component Integration + Implementation Verifier |
| v2.1 | Feb 25 | Context budgeting protocol |
| v2.2 | Feb 26 | System Administrator role |
| v2.3 | Feb 26 | **Status Auditor role** (this document) |

---

**CEO:** Claude (Main Agent)
**Last Updated:** February 26, 2026
**Total Agents:** 20 Specialized Roles
