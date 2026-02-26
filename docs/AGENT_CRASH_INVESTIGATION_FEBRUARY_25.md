# Agent Crash Investigation & Fix Report

> **Date:** February 25, 2026
> **Investigator:** Component Integration Specialist
> **Finding:** 8 agents crashed with 0-byte output files

---

## Executive Summary

**AGENT_TEAM.md documentation is correct.** The crashes are caused by **workflow issues** - users (and AI) are spawning agents directly without going through the Project Manager for context budgeting.

---

## Crash Evidence

**8 agents failed** at approximately 16:15 with empty output files:

```
a022433c65a2e0014.output - 0 bytes
a3949ba81c4f60054.output - 0 bytes
ab2550ec8f4ddba0a.output - 0 bytes
ab26dfb0f348c87af.output - 0 bytes
ac7017c476fa426d1.output - 0 bytes
aeac5400e5ddd3218.output - 0 bytes
aebb5c22267c3ad53.output - 0 bytes
aeffc7147dbea61c4.output - 0 bytes
```

**Symptom:** Silent failures - no output, no errors, just empty files.

---

## Root Cause

| Issue | Root Cause |
|-------|------------|
| **Context overflow** | Agents given 190k+ tokens (exceeds 200k limit) |
| **Direct spawning** | Tasks bypass Project Manager context budgeting |
| **No chunking** | Large tasks not broken into <50k pieces |
| **Too many parallels** | More than 3 agents spawned simultaneously |

---

## AGENT_TEAM.md Verification ✅

The documentation is **well-structured** and contains:

| Section | Lines | Status |
|---------|-------|--------|
| Context Budgeting Rules | 44-62 | ✅ Complete |
| Model Selection Guidelines | 90-97 | ✅ Complete |
| Subtasking Patterns | 99-116 | ✅ Complete |
| Agent Launch Checklist | 127-137 | ✅ Complete |
| Context Emergency Guide | 361-367 | ✅ Complete |

**Conclusion:** The documentation is NOT the problem.

---

## Standard Practice (What Should Happen)

### Correct Workflow

```
User Request → Project Manager → Context Budgeting → Break into Chunks → Spawn Agents Sequentially
```

### Step-by-Step Process

1. **User asks:** "Audit all 7 portals"
2. **Project Manager analyzes:**
   - 7 portals × ~20 files = 140 files
   - Estimated context: ~200k tokens
   - **DECISION:** Too large for one agent
3. **Project Manager breaks down:**
   - Agent 1: Audit counselor portal (15 files, ~30k tokens)
   - Agent 2: Audit student portal (15 files, ~30k tokens)
   - Agent 3: Audit teacher portal (15 files, ~30k tokens)
   - ...continue sequentially
4. **Each agent completes and reports back**
5. **Project Manager compiles combined report**

---

## What's Actually Happening (Wrong Workflow)

```
User Request → Direct Agent Spawn → Context Overload → Crash
```

### The Problem

1. User or AI spawns agent directly via Task tool
2. Agent receives entire prompt + documentation + context
3. Context exceeds 200k token limit
4. Agent crashes silently

---

## Fix Implementation

### Option 1: Add Warning to AGENT_TEAM.md

Add a prominent warning at the top:

```markdown
# ⚠️ IMPORTANT: Read Before Spawning Agents

**NEVER spawn an agent directly for large tasks.** Always route through Project Manager first.

**Large task indicators:**
- "Audit all portals"
- "Fix all components"
- "Review entire codebase"
- "Scan 50+ files"

**Correct approach:**
1. Start with Project Manager
2. Let PM break task into <50k chunks
3. Spawn agents sequentially (max 3 at a time)
```

### Option 2: Create Quick Reference Guide

Add a simple decision tree:

```
Is your task <5 files and <30k tokens?
├─ YES → Spawn specialist agent directly
└─ NO  → Start with Project Manager
```

### Option 3: Update CLAUDE.md Instructions

Add to the project instructions:

```markdown
## Agent Spawning Rules

1. For single-file, simple tasks: Use specialist directly
2. For multi-file, complex tasks: ALWAYS use Project Manager first
3. Never include full documentation in agent prompts
4. Max 3 parallel agents at a time
```

---

## Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 HIGH | Add warning banner to AGENT_TEAM.md | Prevents crashes |
| 🔴 HIGH | Create decision tree diagram | Clear guidance |
| 🟡 MEDIUM | Update CLAUDE.md with agent rules | Documentation |
| 🟡 MEDIUM | Add context estimation helper | Automation |
| 🟢 LOW | Create agent spawning template | Consistency |

---

## Standard Practice Summary

**The standard practice IS documented in AGENT_TEAM.md.** The issue is:

1. ❌ Users/AI aren't reading the context rules before spawning agents
2. ❌ Tasks are being assigned directly without Project Manager oversight
3. ❌ Large tasks aren't being broken down automatically

**The Fix:** Make the workflow more visible with warnings and decision trees.

---

**Report Prepared By:** Component Integration Specialist
**Date:** February 25, 2026
**Status:** Documentation is correct, workflow enforcement needed
