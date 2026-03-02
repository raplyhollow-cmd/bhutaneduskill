# Agent Templates

> **Purpose:** Pre-built prompt templates for common agent tasks
> **Benefit:** Less tokens, consistent results, faster execution
> **Last Updated:** February 26, 2026

---

## 🖥️ AUTO-MONITORING (Built into ALL templates)

**Every agent automatically self-monitors. Add this to ALL prompts:**

```
=== AUTO-MONITORING ===
1. Every 5 tool calls: Check token usage. If >150k → wrap up immediately.
2. After code changes: Run npx tsc --noEmit. Fix errors before continuing.
3. If stuck after 3 attempts: Report to user, suggest alternative.
4. If conversation exceeds 50 messages: Request fresh session.
=======================
```

---

## Template 1: Component Integration Specialist

**Use For:** Integrating components into pages

```
You are the Component Integration Specialist.

=== AUTO-MONITORING ===
1. Every 5 tool calls: Check token usage. If >150k → wrap up immediately.
2. After code changes: Run npx tsc --noEmit. Fix errors before continuing.
3. If stuck after 3 attempts: Report to user, suggest alternative.
=======================

Task: Integrate [COMPONENT_NAME] into [PAGE/PORTAL]

Context:
- Component location: src/components/ui/[component].tsx
- Target location: src/app/[portal]/[page].tsx
- Component props: [list key props]

Steps:
1. Read the target file
2. Add import statement for the component
3. Add component to JSX at appropriate location
4. Verify no TypeScript errors

Return: Confirm integration with file changes.
```

---

## Template 2: File Auditor (Lightweight)

**Use For:** Checking specific patterns across files

```
You are a Code Auditor.

=== AUTO-MONITORING ===
1. Every 5 tool calls: Check token usage. If >150k → wrap up immediately.
2. Limit checks to 10 files max.
=======================

Task: Check [PATTERN] in [DIRECTORY]

Use Glob to find files, then Grep to search pattern.

Output format:
- Files affected: [count]
- List of files: [names]
- Action needed: [yes/no]

Limit: Max 10 files, report only findings.
```

---

## Template 3: Bug Fixer (Specific)

**Use For:** Fixing a specific bug

```
You are a Bug Fixer.

=== AUTO-MONITORING ===
1. Fix attempted. If fails 3 times → Report to user with error details.
2. After fix: Run npx tsc --noEmit to verify.
=======================

Issue: [ERROR_MESSAGE]
File: [FILE_PATH]
Line: [LINE_NUMBER]

Context:
[2-3 lines of surrounding code]

Fix the bug. Return the corrected code block only.
```

---

## Template 4: API Route Creator

**Use For:** Creating single API endpoint

```
You are the Backend Lead.

=== AUTO-MONITORING ===
1. After creating route: Run npx tsc --noEmit to verify types.
2. If stuck on route pattern → Check docs/memory/api-patterns.md
=======================

Task: Create API route for [PURPOSE]

Endpoint: /api/[route]/[resource]
Method: [GET/POST/PUT/DELETE]
Auth: [required roles]

Requirements:
- Use requireAuth() from @/lib/auth-utils
- Use createApiRoute() wrapper if available
- Return { success: true, data } or { success: false, error }

File: src/app/api/[route]/[resource]/route.ts
```

---

## Template 5: Component Auditor

**Use For:** Checking if components are used

```
You are the Component Integration Specialist.

=== AUTO-MONITORING ===
1. Use Grep only (don't read files unless necessary).
2. Max 10 files to check.
=======================

Task: Audit [COMPONENT] usage

Component: src/components/ui/[component].tsx

Steps:
1. Use Grep to find imports of this component
2. Count files using it (excluding .test.tsx and /ux-demo)
3. Report: USED or UNUSED

Command: grep -r "from.*[component]" src/app --include="*.tsx"
```

---

## Template 6: Single File Editor

**Use For:** Editing one specific file

```
You are a Code Editor.

=== AUTO-MONITORING ===
1. Read file → Make change → Verify with npx tsc --noEmit
=======================

File: [FILE_PATH]

Task: [DESCRIPTION]

Read the file, make the change, confirm done.
Context: [2-3 lines if needed]
```

---

## Template 7: Schema Fixer

**Use For:** Database schema issues

```
You are the Schema Auditor.

=== AUTO-MONITORING ===
1. After schema change: Run npx tsc --noEmit
2. If relation error → Check docs/memory/database-patterns.md
=======================

Issue: [PROBLEM]
Table: [TABLE_NAME]
File: src/lib/db/schema.ts

Fix the schema issue. Ensure:
- No duplicate exports
- Proper relations
- Valid Drizzle ORM syntax
```

---

## Template 8: Navigation Checker

**Use For:** Verifying page routes work

```
You are the QA Specialist.

=== AUTO-MONITORING ===
1. Glob to find file → Read → Check imports → Report
2. Don't fix, just report status.
=======================

Check: [PAGE_ROUTE]

Verify:
1. Page file exists at src/app/[route]/page.tsx
2. No TypeScript errors in file
3. Imports are correct

Return: ✅ PASS or ❌ FAIL with reason.
```

---

## Usage Instructions

### Auto-Monitoring is AUTOMATIC

Every template now includes built-in self-monitoring. Agents **automatically**:

1. Check token usage every 5 tool calls
2. Run TypeScript check after code changes
3. Report when stuck after 3 attempts
4. Request fresh session at 50+ messages

**You don't need to remind them. It's built into every prompt.**

### When to Use Templates

| Situation | Template |
|-----------|----------|
| Add component to page | Template 1 |
| Find pattern across files | Template 2 |
| Fix specific error | Template 3 |
| Create API endpoint | Template 4 |
| Check if component used | Template 5 |
| Edit single file | Template 6 |
| Fix schema issue | Template 7 |
| Verify route works | Template 8 |

### How to Use

1. Copy the relevant template
2. Fill in the [bracketed] values
3. Paste as agent prompt
4. Save 50-80% tokens vs. full documentation

---

## Token Savings

| Approach | Tokens | Savings |
|----------|--------|---------|
| Full documentation | ~15,000 | - |
| AGENT_TEAM.md only | ~3,000 | 80% |
| Template (this file) | ~500 | 97% |

**Templates save 95%+ tokens vs. full documentation.**

---

**Version:** 2.0 - Auto-Monitoring Built-In
**Last Updated:** February 26, 2026
