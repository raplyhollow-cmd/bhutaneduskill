# Sessions Folder

**Purpose:** Individual task execution logs from autonomous agents

---

## How It Works

When you say **`start`**:

1. Each task gets its own session file: `session-YYYY-MM-DD-task-name.md`
2. Agent logs what they did, files created/modified, issues found
3. On completion, hands off to next task
4. Progress tracked in `ACTIVE_TASKS.md`

---

## Files

| File | Purpose |
|------|---------|
| `ACTIVE_TASKS.md` | Live progress tracker |
| `session-YYYY-MM-DD-*.md` | Individual task records |

---

## Session File Template

```markdown
# Session: [Task Name]

**Date:** [Date]
**Agent:** Agent #[Number]
**Task:** [Task name]
**Status:** ✅ Complete | ❌ Failed

## What Was Done
- [Actions]

## Files Created
- [File paths]

## Files Modified
- [File paths]

## Testing
- [Tests performed]

## Issues Found
- [Any issues]

## Handoff
- Next Agent: Agent #[Number]
- Next Task: [Task name]

## Time Taken
- Duration: [Minutes]
```

---

**Reference:** [`docs/agents/AGENT_AUTONOMOUS_WORKFLOW.md`](../agents/AGENT_AUTONOMOUS_WORKFLOW.md)
