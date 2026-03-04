# Autonomous Agent Workflow

> **Purpose:** Execute large plans autonomously with sequential agent handoffs
> **Last Updated:** March 4, 2026
> **Command:** Just say "start" - the system reads the plan and executes everything
> **Safety:** Handshake verification + process cleanup + resource monitoring

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SAYS "start"                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PRE-FLIGHT SYSTEM CHECK                         │
│         - CPU usage < 80%                                     │
│         - RAM available > 4GB                                  │
│         - Disk space > 10GB free                              │
│         - No zombie processes                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ⚠️ IF UNSAFE → STOP & ALERT
                    ✅ IF SAFE → CONTINUE
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AGENT HANDSHAKE TEST                            │
│         - Spawn test agent                                    │
│         - Send ping, wait for pong                           │
│         - Verify response < 5 seconds                        │
│         - Check no errors in handshake                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ⚠️ IF HANDSHAKE FAILS → RETRY OR ABORT
                    ✅ IF HANDSHAKE OK → CONTINUE
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         READ PLAN FROM: docs/plans/STRATEGIC_*_PLAN.md      │
│         - Parse all tasks                                    │
│         - Break into 200k token chunks                       │
│         - Create task queue                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SEQUENTIAL AGENT EXECUTION                       │
│                                                              │
│  [PRE-EACH TASK]                                            │
│       - Verify handshake                                     │
│       - Check system resources                              │
│       - Spawn agent in NEW session                          │
│                                                              │
│  Agent 1 (Task 1) ──→ HANDSHAKE ──→ Agent 2 (Task 2)        │
│       ↓                                                  ↓    │
│   Complete                                         Complete  │
│       ↓                                                  ↓    │
│   PROCESS CLEANUP ─────────────────────→ PROCESS CLEANUP  │
│       ↓                                                  ↓    │
│   Document ─────────────────────────────────→ Document     │
│       ↓                                                  ↓    │
│   Next Task ─────────────────────────────────→ Next Task   │
│                                                              │
│  [MONITORING]                                                │
│       - Check CPU/RAM every 30s                              │
│       - Kill agent if unsafe                                │
│       - Continue or abort based on system health            │
│                                                              │
│  ...continues until ALL tasks complete OR system unsafe...  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              COMPLETION REPORT                                │
│         - All tasks documented                               │
│         - All agent processes killed                         │
│         - Status logged                                      │
│         - Next steps identified                             │
└─────────────────────────────────────────────────────────────┘
```

---

## The "start" Command

### User Input
```bash
user: start
```

### System Response (Autonomous)

```typescript
// Agent reads the plan and begins execution
🚀 STARTING AUTONOMOUS EXECUTION
📋 Plan: docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md
📊 Tasks: 47 tasks identified
🔄 Breaking into 200k token chunks...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AGENT 1] Task: Fix Assessment Report Display
🎯 Goal: Students see their assessment reports
📁 Files: 7 files to create/modify
🔄 Running in background...

[AGENT 1] ✅ COMPLETE
📊 Results:
   - Created: src/app/student/assessments/[id]/report/page.tsx
   - Created: src/app/teacher/students/[id]/assessments/page.tsx
   - Modified: src/app/student/assessments/page.tsx
   - API: GET /api/student/assessments/results working
📝 Documented to: docs/sessions/session-[date]-task-1.md
🤝 Handshake: Passing to Agent 2...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AGENT 2] Task: Fix Mobile Homepage & Sign-In
🎯 Goal: Remove back-to-top button, fix mobile menu, fix sign-in
📁 Files: 3 files to modify
🔄 Running in background...

[AGENT 2] ✅ COMPLETE
📊 Results:
   - Removed: Back to top button from homepage
   - Fixed: Mobile menu organization
   - Fixed: Sign-in page (removed "Welcome Back", "Back" button)
   - Added: Press effect to mobile nav
📝 Documented to: docs/sessions/session-[date]-task-2.md
🤝 Handshake: Passing to Agent 3...

...continues until all tasks complete...
```

---

## Task Queue System

### Task Structure

Each task in the plan must have:

```markdown
## Task: [Task Name]
**Status:** ⏳ Pending | 🔄 In Progress | ✅ Complete | ❌ Failed

### Description
[What needs to be done]

### Files
- Create: [file paths]
- Modify: [file paths]

### Dependencies
- [Any tasks that must complete first]

### Acceptance Criteria
- [ ] [Criteria 1]
- [ ] [Criteria 2]

### Handoff
- Next Task: [Task name]
- Output: [What next agent needs]
```

---

## Agent Handshake Protocol

### What is a Handshake?

A **handshake** is a verification step before each agent executes a task. It ensures:
- The agent is responsive and can communicate
- The agent understands the task requirements
- System resources are sufficient for execution
- The agent can be properly tracked and cleaned up

### Pre-Task Handshake (Before Agent Starts)

```typescript
// 1. System Health Check
checkSystemHealth(): {
  cpu: number;      // Must be < 80%
  ram: number;      // Must have > 4GB free
  disk: number;     // Must have > 10GB free
  zombies: number; // Must be 0
}

// 2. Agent Handshake Test
testAgentHandshake(): {
  spawn: () => Agent;           // Create test agent
  ping: "AGENT_PING_REQUEST";    // Send ping
  pong: "AGENT_PONG_RESPONSE";  // Expect pong
  timeout: 5000;                // Must respond < 5s
  verify: (response) => {
    response.agentId !== undefined &&
    response.status === "ready" &&
    response.errors === undefined
  };
}

// 3. If handshake fails
handleHandshakeFailure(): {
  retry: true;                   // Retry once
  retryDelay: 2000;             // Wait 2s
  abortAfter: 3;                // Abort after 3 failures
  killZombieProcesses: true;    // Cleanup any stuck processes
}
```

### From Agent A to Agent B

**Agent A (Completing):**
```markdown
## HANDOVER REPORT

### Task Completed: [Task Name]
### Status: ✅ Complete

### What Was Done:
- [List of actions taken]

### Files Created/Modified:
- [File paths]

### Testing Performed:
- [How it was verified]

### Known Issues:
- [Any issues found]

### Process Info:
- Agent PID: [Process ID for cleanup]
- Started: [Time]
- Completed: [Time]
- Duration: [Minutes]

### Handoff to Agent B:
- Task: [Next task name]
- Context: [What Agent B needs to know]
- Artifacts: [Files/outputs Agent B can use]

### Documentation:
📝 Session notes: docs/sessions/session-[date]-[task-name].md
```

**Agent B (Starting):**
```markdown
## HANDOVER RECEIVED

### From: Agent A
### Task: [Current task name]

### Context Received:
✅ [Confirming what was received]

### Dependencies Satisfied:
✅ [Confirming prerequisites are done]

### Handshake Verification:
✅ Agent ID: [UUID]
✅ Status: Ready
✅ System: CPU < 80%, RAM > 4GB free

### Starting Work:
- Reading relevant files...
- Implementing [task description]...
```

---

## Process Cleanup & Monitoring

### Why Cleanup Matters

Zombie agent processes cause:
- 🚨 High CPU usage (node.js processes stuck in loops)
- 🚨 High RAM usage (memory leaks, large contexts)
- 🚨 System instability (crashes, freezes)
- 🚨 Resource exhaustion (no capacity for new agents)

### Process Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. SPAWN                                                   │
│     - Create new node.js process for agent                  │
│     - Record PID (Process ID)                               │
│     - Set timeout monitor (10 min max)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. MONITOR                                                 │
│     - Check CPU/RAM every 30s                              │
│     - Ping agent for heartbeat                              │
│     - Log resource usage                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ⚠️ UNHEALTHY? → KILL
                    ✅ HEALTHY → CONTINUE
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. COMPLETE OR TIMEOUT                                     │
│     - Agent finishes task OR timeout (10 min)               │
│     - Send termination signal                               │
│     - Wait for graceful shutdown (5s)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CLEANUP                                                 │
│     - SIGTERM (graceful shutdown)                          │
│     - Wait 5 seconds                                        │
│     - If alive: SIGKILL (force kill)                       │
│     - Verify process is dead                                 │
│     - Log PID and status                                    │
└─────────────────────────────────────────────────────────────┘
```

### Kill Commands

```bash
# Kill specific agent by PID
kill -TERM <PID>        # Graceful shutdown
kill -KILL <PID>        # Force kill

# Kill all agent processes
pkill -f "claude-agent"  # Kill all Claude agent processes
taskkill /F /IM node.exe  # Windows force kill

# Manual cleanup (emergency)
user: kill

🚨 KILLING ALL AGENT PROCESSES...
🔍 Found 3 zombie agents
💀 Killing PID 12345... ✅
💀 Killing PID 12346... ✅
💀 Killing PID 12347... ✅
✅ All agents terminated, system safe
```

### System Health Thresholds

| Metric | Safe | Warning | Critical | Action |
|--------|------|--------|----------|--------|
| CPU | < 70% | 70-85% | > 85% | Pause new agents |
| RAM | < 10GB | 10-14GB | > 14GB | Pause new agents |
| Active Agents | < 3 | 3-5 | > 5 | Kill oldest agents |
| Zombie Processes | 0 | 0 | > 0 | Kill immediately |

### Auto-Recovery Rules

```typescript
IF system_unstable:
    1. Pause new agent spawns
    2. Kill zombie processes
    3. Wait for resources to free up
    4. Resume if healthy, abort if still unhealthy
```

---

## Error Handling with Process Cleanup

### On Agent Failure

```typescript
IF agent fails OR times out:
    1. Kill agent process (SIGTERM)
    2. Wait 3 seconds for graceful shutdown
    3. If still alive: Force kill (SIGKILL)
    4. Verify process is dead (check PID)
    5. Log error and cleanup status
    6. Add to ACTIVE_TASKS.md under Issues
    7. Determine retry strategy:
       - Transient error → Retry with same agent
       - Code issue → Retry with different approach
       - Blocker → Skip and continue with next task
    8. Check system health before continuing
    9. Continue with next task IF system healthy
```

### Zombie Process Detection

```typescript
// Detect zombie agents
detectZombieAgents(): ProcessInfo[] {
  const running = getRunningProcesses();
  const zombies = running.filter(p =>
    p.name === "node" &&
    p.cmd.includes("claude") &&
    p.age > 15 * 60 * 1000 &&  // Running > 15 min
    !p.hasRecentActivity()
  );
  return zombies;
}

// Auto-kill zombies
if (zombies.length > 0) {
  log.warn(`Found ${zombies.length} zombie agents, killing...`);
  zombies.forEach(z => z.kill(SIGKILL));
}
```

---

## 200k Token Chunking Strategy

### Breaking Large Tasks

```
IF Task > 200k tokens:
    Split into sub-tasks
    Each sub-task < 180k tokens (buffer)
    Execute sequentially
ELSE:
    Execute as single task
```

### Chunking Example

```markdown
## Original Task: Build Intelligence Layer (Too Large)

### Split Into:

**Task 1A: Intelligence Engine Core** (~150k tokens)
- Create: src/lib/intelligence/engine.ts
- Create: src/lib/intelligence/triggers.ts
- Create: src/lib/db/schema/intelligence.ts
- Test: Basic trigger works

**Task 1B: Insight APIs** (~120k tokens)
- Create: src/app/api/student/insights/route.ts
- Create: src/app/api/teacher/insights/route.ts
- Create: src/app/api/school-admin/insights/route.ts
- Test: All APIs return data

**Task 1C: Insight Display Components** (~140k tokens)
- Create: src/components/intelligence/insight-card.tsx
- Create: src/components/intelligence/insight-dashboard.tsx
- Test: Components render correctly

**Task 1D: Dashboard Integration** (~130k tokens)
- Modify: src/app/student/page.tsx
- Modify: src/app/teacher/page.tsx
- Modify: src/app/school-admin/page.tsx
- Test: Insights appear on dashboards
```

---

## Background Execution Rules

### ⚠️ CRITICAL: AUTONOMOUS MEANS NO APPROVALS

> **When user types "start", agents are in AUTONOMOUS mode.**
> **DO NOT ask for approval. DO NOT say "Should I proceed?"**
> **JUST EXECUTE THE TASK.**

```
┌─────────────────────────────────────────────────────────────┐
│  ❌ WRONG: "Should I create this file?"                     │
│  ❌ WRONG: "Is it okay if I modify this component?"         │
│  ❌ WRONG: "Do you want me to run the tests?"               │
│  ❌ WRONG: "Ready to proceed, just say yes"                 │
│                                                             │
│  ✅ CORRECT: "Creating component..."                        │
│  ✅ CORRECT: "Modifying file to implement feature..."       │
│  ✅ CORRECT: "Running tests..."                             │
│  ✅ CORRECT: Just do it, report results when done           │
└─────────────────────────────────────────────────────────────┘
```

### Agent Behavior (Autonomous)

```typescript
AGENT_RULES = {
    // PRE-FLIGHT CHECKS
    pre_flight_check: true,
    handshake_required: true,
    system_health_check: true,

    // ⚠️ CRITICAL: ZERO APPROVALS IN AUTONOMOUS MODE
    ask_for_approval: false,
    never_say_should_i_proceed: true,
    never_ask_is_it_okay: true,
    just_execute_the_task: true,

    // WORK IN BACKGROUND
    run_in_background: true,

    // TIME LIMIT PER TASK
    max_duration: "10 minutes",
    timeout_action: "kill_and_cleanup",

    // RESOURCE LIMITS
    max_cpu_per_agent: "80%",
    max_ram_per_agent: "2GB",
    max_total_agents: 3,

    // MONITORING
    monitor_interval: "30 seconds",
    health_check_interval: "1 minute",

    // ON ERROR
    on_error: "log_cleanup_and_continue",

    // ON COMPLETION
    on_complete: "document_cleanup_handoff",

    // CLEANUP
    kill_process_after: true,
    verify_process_dead: true,
    force_kill_if_stuck: true,
    force_kill_timeout: "5 seconds"
}
```

### What Agents Can Do WITHOUT ASKING

✅ **Create files** - Any new files needed (components, pages, APIs, utils, etc.)
✅ **Modify files** - Edit existing files to implement features
✅ **Delete code** - Remove dead code, mocks, placeholders, unused imports
✅ **Run commands** - npm install, npm test, npm run build, etc.
✅ **Read files** - Read any file to understand context
✅ **Write documentation** - Document progress, issues, decisions
✅ **Make git commits** - Local commits only (not push)

### ONLY Stop and Ask For These

🛑 `git push` - Pushing to remote repository
🛑 `rm -rf` - Destructive delete operations on multiple files
🛑 `npm install -g` - Global package installs
🛑 Environment changes - .env modifications
🛑 Database migrations - Running schema changes on production
🛑 **System unsafe** - CPU/RAM too high (auto-abort)

### NEVER Say These Phrases

```
❌ "Should I proceed?"
❌ "Is it okay if I..."
❌ "Do you want me to..."
❌ "Ready to start, just confirm..."
❌ "Shall I continue?"
❌ "Would you like me to..."
❌ "Please confirm..."

✅ Instead, just say: "Creating [file]..." or "Implementing [feature]..."
```

---

### 🎯 AUTONOMOUS EXECUTION MEANS:

| Action | Autonomous? | Notes |
|--------|-------------|-------|
| Create new component | ✅ JUST DO IT | Don't ask |
| Edit existing file | ✅ JUST DO IT | Don't ask |
| Delete dead code | ✅ JUST DO IT | Don't ask |
| Run tests | ✅ JUST DO IT | Don't ask |
| Install packages | ✅ JUST DO IT | Don't ask |
| Make git commit | ✅ JUST DO IT | Local only, don't ask |
| Git push | 🛑 ASK FIRST | Remote operation |

### Resource Monitoring Rules

```typescript
// Check before spawning agent
CAN_SPAWN_AGENT(): boolean {
    const cpu = getCurrentCPUUsage();
    const ram = getAvailableRAM();
    const active = getActiveAgentCount();
    const zombies = getZombieProcessCount();

    if (cpu > 80) return false;  // CPU too high
    if (ram < 4096) return false; // Less than 4GB free
    if (active >= 3) return false;  // Too many agents
    if (zombies > 0) {
        killZombies();  // Clean up first
        return checkAgain();  // Then re-check
    }
    return true;
}

// Monitor during execution
MONITOR_AGENT(agent): void {
    setInterval(() => {
        const health = checkAgentHealth(agent);

        if (health.unhealthy) {
            log.warn(`Agent ${agent.id} unhealthy: ${health.reason}`);
            killAgent(agent.id);
            return;
        }

        // Log resource usage
        log.info(`Agent ${agent.id}: CPU=${health.cpu}%, RAM=${health.ram}MB`);
    }, 30000);  // Every 30 seconds
}
```

---

## Documentation System

### Session Files

Each agent creates a session file:

```
docs/sessions/
├── session-2026-03-03-task-01-assessment-reports.md
├── session-2026-03-03-task-02-mobile-fixes.md
├── session-2026-03-03-task-03-intelligence-engine.md
├── session-2026-03-03-task-04-intelligence-apis.md
└── ...
```

### Session File Template

```markdown
# Session: [Task Name]

**Date:** [Date]
**Agent:** Agent #[Number]
**Task:** [Task name]
**Status:** ✅ Complete | ❌ Failed

---

## Task Description
[What was asked to do]

---

## What Was Done
- [Action 1]
- [Action 2]
- [Action 3]

---

## Files Created
- `path/to/file1.ts` - [Purpose]
- `path/to/file2.tsx` - [Purpose]

---

## Files Modified
- `path/to/file3.ts` - [Changes made]

---

## Testing
- [Test performed]
- [Test performed]
- [Result]

---

## Issues Found
- [Any issues encountered]

---

## Handoff
- Next Agent: Agent #[Number]
- Next Task: [Task name]
- Context: [What next agent needs]

---

## Time Taken
- Started: [Time]
- Completed: [Time]
- Duration: [Minutes]
```

---

## Progress Tracking

### Active Tasks File

The system maintains `docs/sessions/ACTIVE_TASKS.md`:

```markdown
# Active Tasks - Autonomous Execution

**Started:** March 3, 2026
**Plan:** docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md
**Total Tasks:** 47
**Completed:** 12
**In Progress:** 1
**Pending:** 34

---

## Completed Tasks ✅

- ✅ Task 1: Fix Assessment Report Display (Agent 1) - 15 min
- ✅ Task 2: Fix Mobile Homepage & Sign-In (Agent 2) - 20 min
- ✅ Task 3: Build Intelligence Engine Core (Agent 3) - 25 min
- ...

---

## In Progress 🔄

- 🔄 Task 4: Build Insight APIs (Agent 4) - Started 10:45 AM

---

## Pending ⏳

- ⏳ Task 5: Build Insight Display Components
- ⏳ Task 6: Dashboard Integration
- ...

---

## Issues ❌

- ❌ Task 7: [Failed task description]
   - Error: [Error message]
   - Retry scheduled: [Time]
```

---

## Error Handling

### On Agent Failure

```typescript
IF agent fails:
    1. Log error to session file
    2. Add to ACTIVE_TASKS.md under Issues
    3. Determine retry strategy:
       - Transient error → Retry with same agent
       - Code issue → Retry with different approach
       - Blocker → Skip and continue with next task
    4. Document decision
    5. Continue with next task
```

### Retry Rules

```
Error Type                    Action
─────────────────────────────────────────────────────
Network timeout               Retry (3 attempts)
API rate limit                Wait 60s, retry
File not found                Create file, continue
Token limit exceeded          Split task, continue
Code error (bug)              Log, skip, continue with next
Dependency missing            Skip, retry at end
```

---

## Completion Report

### When All Tasks Complete

```markdown
# 🎉 AUTONOMOUS EXECUTION COMPLETE

**Plan:** STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md
**Started:** March 3, 2026 10:00 AM
**Completed:** March 3, 2026 6:30 PM
**Duration:** 8 hours 30 minutes

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 47 |
| Completed | 44 |
| Failed | 2 |
| Skipped | 1 |
| Success Rate | 94% |

---

## Completed Tasks ✅

- ✅ Fix Assessment Report Display
- ✅ Fix Mobile Homepage & Sign-In
- ✅ Build Intelligence Engine Core
- ✅ Build Insight APIs
- ✅ Build Insight Display Components
- ✅ Dashboard Integration
- ... (38 more)

---

## Failed Tasks ❌

- ❌ [Failed task 1] - Reason: [Error]
- ❌ [Failed task 2] - Reason: [Error]

**Action Needed:** Manual review required

---

## Next Steps

1. Review failed tasks
2. Manual testing of critical flows
3. Deploy to staging for QA
4. Address any issues found

---

## Documentation

All session notes saved to: `docs/sessions/`

Progress tracked in: `docs/sessions/ACTIVE_TASKS.md`
```

---

## Quick Reference

### For the User

| Command | What Happens |
|---------|--------------|
| `start` | Begin autonomous execution (with health & handshake checks) |
| `status` | Show current progress, active agents, system resources |
| `health` | Show system health (CPU, RAM, disk, active agents, zombies) |
| `pause` | Pause after current task completes |
| `resume` | Continue from where paused |
| `stop` | Stop all agents gracefully |
| `kill` | **KILL ALL agent processes immediately (emergency)** |

### Health Check Output

```bash
user: health

💻 System Health:
   CPU: 42% (8 cores) ✅
   RAM: 6.2GB / 16GB (38%) ✅
   Disk: 45GB free ✅
   Active agents: 1 ✅
   Zombie processes: 0 ✅
   Status: HEALTHY - Can spawn new agents
```

### Emergency Kill

```bash
user: kill

🚨 KILLING ALL AGENT PROCESSES...
🔍 Found 3 zombie agents
💀 Killing PID 12345... ✅
💀 Killing PID 12346... ✅
💀 Killing PID 12347... ✅
✅ All agents terminated, system safe
```

### Starting a New Plan

1. Update `docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md`
2. Say: `start`
3. System runs pre-flight checks
4. If healthy: executes autonomously
5. If unhealthy: stops and alerts you

### Modifying Plan During Execution

1. Say: `pause`
2. System waits after current task completes
3. Edit the plan file
4. Say: `resume`
5. Continues with updated plan

---

**Remember:** The goal is FULLY autonomous execution WITH safety. The system will:
- ✅ Verify handshake before each agent
- ✅ Monitor system resources continuously
- ✅ Kill and cleanup agent processes automatically
- ⚠️ Stop if system becomes unsafe
- 🚨 Emergency kill available with `kill` command
