# Agent Quickref - Autonomous Execution

> **Last Updated:** March 4, 2026
> **Purpose:** Single command to execute entire plan autonomously
> **Safety:** Handshake verification + agent process cleanup

---

## THE "start" COMMAND

Just say **`start`** and the system will:

1. ✅ **Pre-flight Check:** Verify system health (CPU, RAM, disk space)
2. ✅ **Handshake Test:** Spawn test agent, verify it responds properly
3. ✅ Read plan from:** `docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md`
4. ✅ Break into tasks within 200k token chunks
5. ✅ Assign 1 agent per task in NEW session (isolated context)
6. ✅ Verify each agent handshake before execution
7. ✅ Execute autonomously in background
8. ✅ **Cleanup:** Kill agent processes after task completes
9. ✅ Handoff to next agent when complete
10. ✅ Continue until ALL tasks finish OR system unsafe
11. ✅ Document everything to `docs/sessions/`

---

## ONE COMMAND IS ALL YOU NEED

```bash
user: start

🔍 Pre-flight check... ✅ (CPU: 45%, RAM: 8GB/16GB, Disk: 50GB free)
🤝 Handshake test... ✅ (agent responds in 2.3s)
📋 Plan: STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md
📊 Tasks: 47 tasks identified
🔄 Breaking into 200k token chunks...

[AGENT 1] Handshake... ✅ | Fix Assessment Report Display... ✅ 15 min
[AGENT 1] Process cleanup... ✅ (PID 12345 terminated)

[AGENT 2] Handshake... ✅ | Fix Mobile Homepage & Sign-In... ✅ 20 min
[AGENT 2] Process cleanup... ✅ (PID 12346 terminated)

[AGENT 3] Handshake... ❌ | Agent not responding
[AGENT 3] Killing zombie process... ✅ (PID 12347 killed)
[AGENT 3] Spawning replacement... ✅ | Build Intelligence Engine Core... ✅ 25 min

...continues autonomously until complete or unsafe...

🎉 ALL TASKS COMPLETE
📁 Session notes: docs/sessions/session-2026-03-04-*.md
📊 Progress: docs/sessions/ACTIVE_TASKS.md
```

---

## STATUS COMMANDS

| Command | What It Shows |
|---------|---------------|
| `status` | Current progress, active agents, system resources |
| `pause` | Pause after current task completes |
| `resume` | Continue from where paused |
| `stop` | Stop all agents and cleanup processes |
| `kill` | **KILL ALL zombie agents immediately** |
| `health` | Show system health (CPU, RAM, active processes) |

---

## SAFETY FEATURES

### Pre-flight Checks (Before Starting)
```
✅ CPU usage < 80%
✅ RAM available > 4GB
✅ Disk space > 10GB free
✅ No zombie agent processes
✅ Agent handshake responds < 5s
```

### During Execution
```
✅ Monitor system resources every 30s
✅ Kill agents if CPU > 90% for > 60s
✅ Kill agents if RAM > 14GB for > 30s
✅ Auto-pause if system unstable
✅ Cleanup agent processes after each task
```

### Agent Process Cleanup
Each agent runs in isolated process:
- **Spawn:** New node.js process for each task
- **Monitor:** Track PID and resource usage
- **Kill:** Terminate process after completion (or timeout)
- **Verify:** Confirm process is dead (force kill if needed)

---

## FILES

| File | Purpose |
|------|---------|
| **CLAUDE.md** | Root level - ALL agents read this for autonomous behavior |
| **This file** | `docs/AGENT_QUICKREF.md` - Read me first |
| **The Plan** | `docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md` - What to build |
| **Workflow** | `docs/agents/AGENT_AUTONOMOUS_WORKFLOW.md` - How it works |
| **Progress** | `docs/sessions/ACTIVE_TASKS.md` - Live progress tracker |
| **Sessions** | `docs/sessions/session-*.md` - Individual task records |

---

## HOW TO UPDATE THE PLAN

1. Edit: `docs/plans/STRATEGIC_COMPETITIVE_ADVANTAGE_PLAN.md`
2. Add/Remove tasks as needed
3. Say: `start`
4. System reads updated plan and executes

---

## AGENT BEHAVIOR

**AUTONOMOUS = ZERO APPROVALS** (after handshake verified)

> ⚠️ **CRITICAL:** When user says "start", agents are in AUTONOMOUS mode. DO NOT ask "Should I proceed?" or "Is this okay?" for ANY task listed below.

**✅ NO APPROVAL NEEDED FOR:**
- ✅ Creating files (components, pages, APIs, utils, etc.)
- ✅ Modifying files (editing code to implement features)
- ✅ Deleting dead code (removing mocks, placeholders, unused imports)
- ✅ Running tests (npm test, playwright, etc.)
- ✅ Running builds (npm run build, etc.)
- ✅ Installing dependencies (npm install packages)
- ✅ Reading files (understanding context)
- ✅ Writing documentation (session files, progress updates)
- ✅ Making git commits (local commits only)
- ✅ All typical development tasks

**🛑 ONLY ASK FOR:**
- 🛑 Git push (remote operations)
- 🛑 Destructive operations (rm -rf, drop database, etc.)
- 🛑 Production environment changes
- 🛑 **System unstable (CPU/RAM too high - auto-abort)**

**STOP SAYING "Should I proceed?" - JUST DO IT!**

---

## TASK TRACKING

All tasks documented to:
```
docs/sessions/
├── ACTIVE_TASKS.md          ← Live progress
├── session-2026-03-04-task-01-*.md
├── session-2026-03-04-task-02-*.md
├── session-2026-03-04-task-03-*.md
└── ...
```

---

## EMERGENCY COMMANDS

If system becomes unstable:
```bash
user: kill

🚨 KILLING ALL AGENT PROCESSES...
🔍 Found 3 zombie agents
💀 Killing PID 12345... ✅
💀 Killing PID 12346... ✅
💀 Killing PID 12347... ✅
✅ All agents terminated, system safe
```

Check system health:
```bash
user: health

💻 System Health:
   CPU: 42% (8 cores)
   RAM: 6.2GB / 16GB (38%)
   Disk: 45GB free
   Active agents: 1
   Zombie processes: 0
```

---

## THAT'S IT!

**Say "start" and the system does the rest.**

No more:
- ❌ Assigning tasks manually
- ❌ Waiting for each agent to finish
- ❌ Copy-pasting context between sessions
- ❌ Tracking progress manually
- ❌ **Zombie agents consuming CPU/RAM**

**Just:** `start`

---

**Reference:** `docs/agents/AGENT_AUTONOMOUS_WORKFLOW.md` for full workflow details
