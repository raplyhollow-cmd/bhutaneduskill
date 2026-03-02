# Change Control Process

> **PURPOSE:** Define the review and approval process for keeping technical debt at ZERO
> **LAST UPDATED:** 2026-02-25
> **STATUS:** Active - All agents and developers MUST follow this process

---

## Table of Contents

1. [Overview](#1-overview)
2. [Pre-Implementation Checklist](#2-pre-implementation-checklist)
3. [Code Review Checklist](#3-code-review-checklist)
4. [Automated Checks](#4-automated-checks)
5. [Approval Process](#5-approval-process)
6. [Definition of Done](#6-definition-of-done)
7. [Blocking Criteria](#7-blocking-criteria)
8. [Templates](#8-templates)
9. [Emergency Procedures](#9-emergency-procedures)

---

## 1. Overview

### Goal
Once we reach zero technical debt, it STAYS at zero. No new `any` types, no broken patterns, no regressions.

### Current Metrics
| Metric | Value | Target | Trend |
|--------|-------|--------|-------|
| TypeScript Errors | 0 | 0 | Stable |
| `any` types | ~307 | <50 | Decreasing |
| Build Status | Passing | Passing | Stable |
| Test Coverage | TBD | >80% | Increasing |

### Who Must Follow This
- All AI agents working on the codebase
- All human developers
- All code reviewers
- All merge approvals

---

## 2. Pre-Implementation Checklist

> **BEFORE writing any code, complete these steps:**

### 2.1 Design Review

| Task | Required? | Owner |
|------|-----------|-------|
| Feature/design documented | Yes | Developer |
| API endpoints designed | Yes (if applicable) | Developer |
| Database changes identified | Yes (if applicable) | Developer |
| Breaking changes noted | Yes (if applicable) | Developer |

### 2.2 Pattern Verification

Before implementing, verify the pattern exists in the codebase:

```
1. Search for similar implementations in the codebase
2. Read the relevant docs/memory/ file
3. Copy the working pattern
4. Only THEN modify for your use case
```

### 2.3 Database Change Review

If modifying database schema:

| Check | Status |
|-------|--------|
| Schema change documented in migration | [ ] |
| Backwards compatible? | [ ] Yes / [ ] No (requires data migration) |
| Column names verified in schema.ts | [ ] |
| RBAC implications considered | [ ] |
| Multi-tenant isolation verified | [ ] |

### 2.4 API Design Review

If creating new API endpoints:

| Check | Status |
|-------|--------|
| Endpoint documented | [ ] |
| Uses `requireAuth()` | [ ] |
| Uses `ApiSuccess<T>` / `ApiErrorResponse` types | [ ] |
| Error handling with `logger.apiError()` | [ ] |
| RBAC roles specified | [ ] |

---

## 3. Code Review Checklist

> **REVIEWERS: Use this checklist for EVERY PR**

### 3.1 TypeScript (BLOCKING if failed)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No new `any` types | [ ] | Zero tolerance |
| All types properly imported from `@/types` | [ ] | |
| `npx tsc --noEmit` passes | [ ] | Must run |
| No `@ts-ignore` or `@ts-expect-error` | [ ] | Unless approved |
| Proper type guards for unknown data | [ ] | |

### 3.2 API Routes (BLOCKING if failed)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Uses `requireAuth()` from `@/lib/auth-utils` | [ ] | Never `auth()` directly |
| Returns `ApiSuccess<T>` or `ApiErrorResponse` | [ ] | |
| Error handling with try-catch | [ ] | |
| Uses `logger.apiError()` for errors | [ ] | |
| RBAC checks with role requirements | [ ] | If applicable |
| No hardcoded secrets | [ ] | |

### 3.3 Database Operations (BLOCKING if failed)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Uses `db.select().from().leftJoin()` pattern | [ ] | NO `db.query.*` |
| Correct column names (clerkUserId, schoolId) | [ ] | Verified in schema.ts |
| JSON fields parsed with `parseJsonArray()` | [ ] | If applicable |
| Transaction used for multi-table operations | [ ] | If applicable |
| Proper error handling | [ ] | |

### 3.4 React Components (BLOCKING if failed)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| All hooks at component top (before conditionals) | [ ] | Critical |
| `"use client"` if using hooks | [ ] | |
| Loading state handled | [ ] | |
| Error state handled | [ ] | |
| Empty state handled | [ ] | |
| `repeat: Infinity` has `repeatType: "loop"` | [ ] | If using Framer Motion |
| No Tailwind gradient classes | [ ] | Use inline styles |

### 3.5 Authentication & Authorization (BLOCKING if failed)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Uses `requireAuth()` not `auth()` | [ ] | |
| Returns database `userId` not Clerk ID | [ ] | |
| RBAC roles checked | [ ] | If applicable |
| Platform admin bypass implemented | [ ] | If applicable |

### 3.6 Code Quality

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No `console.log` statements | [ ] | Use `logger` |
| No commented-out code | [ ] | |
| Imports use `@/` alias | [ ] | No relative paths |
| Functions are <50 lines | [ ] | Split if longer |
| Meaningful variable names | [ ] | |

### 3.7 Documentation

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Complex logic has comments | [ ] | |
| API route documented | [ ] | If new endpoint |
| Breaking changes documented | [ ] | If applicable |
| CHANGELOG.md updated | [ ] | For user-facing changes |

---

## 4. Automated Checks

> **These MUST pass before any merge**

### 4.1 Pre-Commit Hook (Required)

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Type check
echo "TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "TypeScript errors found. Aborting commit."
  exit 1
fi

# Check for console.log
echo "Checking for console.log..."
if grep -r "console\.log" src/ --exclude-dir=node_modules | grep -v "logger"; then
  echo "Found console.log. Use logger instead."
  exit 1
fi

# Check for new any types
echo "Checking for new 'any' types..."
NEW_ANY=$(git diff --cached | grep -E "^\+.*: any" | grep -v "^+++")
if [ ! -z "$NEW_ANY" ]; then
  echo "Found new 'any' type. This is blocking."
  echo "$NEW_ANY"
  exit 1
fi

echo "All checks passed!"
```

### 4.2 Pre-Merge Checklist

```bash
# MUST run before merging
npm run build           # Must pass
npx tsc --noEmit        # Must have 0 errors
npm run test           # Must pass (when tests exist)
```

### 4.3 Continuous Integration (Future)

| Check | Status |
|-------|--------|
| TypeScript type check | Pending CI setup |
| Build verification | Pending CI setup |
| Linting | Pending CI setup |
| Unit tests | Pending CI setup |
| Integration tests | Pending CI setup |

---

## 5. Approval Process

### 5.1 Approval Levels

| Change Type | Reviewers Required | Approval Needed |
|-------------|-------------------|-----------------|
| Typo fix | 1 | Self-approved after review |
| Bug fix (non-breaking) | 1 | Another developer |
| New feature | 2 | Senior developer + Tech lead |
| Database schema change | 2 | Tech lead + DBA/Architect |
| Breaking change | 3 | Team lead + Tech lead + Architect |
| Authentication/Authorization | 2 | Security review required |

### 5.2 What Can Be Auto-Approved

| Scenario | Conditions |
|----------|------------|
| Documentation updates | No code changes |
| Test updates | Only test files changed |
| Dependency updates | Patch/minor version only, tests pass |

### 5.3 Approval Workflow

```
1. Developer creates feature branch from main
2. Complete Pre-Implementation Checklist
3. Implement changes following patterns
4. Complete Code Review Checklist (self-review)
5. Create PR with template (see Templates section)
6. Automated checks run
7. Reviewer(s) assigned based on Approval Levels
8. Address review feedback
9. All checks pass + approvals received
10. Merge to main
```

### 5.4 Reviewer Responsibilities

| Responsibility | Owner |
|----------------|-------|
| Code quality | Reviewer |
| Pattern adherence | Reviewer |
| No new technical debt | Reviewer |
| Tests adequate | Reviewer |
| Documentation updated | Reviewer |

---

## 6. Definition of Done

A change is COMPLETE only when:

### 6.1 Code Requirements

- [x] Code written
- [x] Code reviewed
- [x] All tests passing
- [x] No TypeScript errors
- [x] Build succeeds

### 6.2 Quality Requirements

- [x] No new technical debt
- [x] No regressions
- [x] Follows project patterns
- [x] No console.log statements
- [x] Proper error handling

### 6.3 Documentation Requirements

- [x] Code is self-documenting (clear names)
- [x] Complex logic has comments
- [x] API routes documented
- [x] Breaking changes documented
- [x] CHANGELOG.md updated (if user-facing)

### 6.4 Verification Requirements

- [x] Manual testing completed
- [x] Edge cases tested
- [x] Error conditions tested
- [x] Performance acceptable

---

## 7. Blocking Criteria

> **These BLOCK a merge - no exceptions**

### 7.1 Critical Blockers

| Issue | Action |
|-------|--------|
| New `any` type | Fix immediately or use proper type |
| TypeScript errors | Fix all errors |
| Build failures | Fix build |
| `console.log` in production code | Replace with `logger` |
| Missing `requireAuth()` on protected route | Add authentication |
| Hooks after conditionals | Move hooks to top |
| `db.query.*` usage | Convert to `db.select().from()` |

### 7.2 What Requires Rework

| Issue | Action |
|-------|--------|
| Missing error handling | Add try-catch with `logger.apiError()` |
| Missing loading states | Add loading UI |
| No empty state | Add empty state component |
| Relative imports | Convert to `@/` alias |
| Tailwind gradient classes | Convert to inline styles |
| Framer Motion without `repeatType` | Add `repeatType: "loop"` |

### 7.3 Acceptable Technical Debt (Rare)

Technical debt is ONLY acceptable when:

1. **Documented with ticket:** Create issue tracking the debt
2. **Time-bounded:** Must be resolved within [X] days
3. **Approved by Tech Lead:** Explicit approval required
4. **Non-blocking:** Doesn't affect critical paths

```markdown
## Technical Debt Exception

**Date:** 2026-XX-XX
**File:** path/to/file.ts
**Issue:** Brief description
**Reason:** Why this is temporarily acceptable
**Timeline:** When it will be fixed
**Approved by:** @tech-lead
```

---

## 8. Templates

### 8.1 Feature Request Template

```markdown
## Feature Request: [Title]

**Priority:** P1 (Critical) / P2 (High) / P3 (Medium) / P4 (Low)
**Status:** Proposed / Approved / In Progress / Completed

### Problem Statement
What problem does this solve? Why is it needed?

### Proposed Solution
How should this work? Include:

- User stories
- UI/UX considerations
- API endpoints needed
- Database changes needed

### Alternatives Considered
What other approaches were considered? Why rejected?

### Impact Assessment
- Breaking changes: Yes/No
- Database migration required: Yes/No
- Performance impact: None/Low/Medium/High
- Security considerations: [Describe]

### Dependencies
- Depends on: [Issue/Ticket numbers]
- Blocks: [Issue/Ticket numbers]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Documentation updated

### Notes
Additional context, mockups, references
```

### 8.2 Pull Request Template

```markdown
## [Type] Title

**Type:** feat / fix / refactor / docs / test / chore
**Related Issue:** #issue_number
**Breaking Changes:** Yes / No

---

## Summary
Brief description of changes (1-2 sentences)

---

## Changes Made

### Code Changes
- [ ] List major code changes
- [ ] Include file paths for easy review

### Database Changes
- [ ] Migration file: path/to/migration.sql
- [ ] Schema changes: [Describe]

### API Changes
- [ ] New endpoint: `GET /api/endpoint`
- [ ] Modified endpoint: `PATCH /api/endpoint`
- [ ] Deprecated endpoint: `DELETE /api/endpoint`

### Documentation Updates
- [ ] CHANGELOG.md updated
- [ ] API documentation updated
- [ ] New patterns documented

---

## Checklist

### Development
- [ ] Pre-Implementation Checklist completed
- [ ] Code follows project patterns
- [ ] No new `any` types
- [ ] No `console.log` statements
- [ ] All imports use `@/` alias

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases tested

### Code Review
- [ ] Self-reviewed using Code Review Checklist
- [ ] All automated checks pass
- [ ] `npx tsc --noEmit` shows 0 errors
- [ ] `npm run build` succeeds

### Documentation
- [ ] Complex logic commented
- [ ] Breaking changes documented
- [ ] CHANGELOG.md updated (if user-facing)

---

## Screenshots/Mockups
[Include if applicable]

## Notes for Reviewers
[Any specific areas to focus on]

---

## Definition of Done
- [x] Code written
- [ ] Code reviewed (pending)
- [x] Tests passing
- [ ] Documentation approved (pending)
- [x] No new technical debt
- [x] No regressions
```

### 8.3 Bug Report Template

```markdown
## Bug Report: [Title]

**Severity:** P1 (Critical) / P2 (High) / P3 (Medium) / P4 (Low)
**Status:** Reported / Confirmed / In Progress / Fixed / Verified

---

## Description
Clear description of the bug

---

## Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll to...
4. See error

---

## Expected Behavior
What should happen

---

## Actual Behavior
What actually happens

---

## Environment
- Browser: [Chrome/Firefox/Safari/Edge + version]
- Portal: [Student/Teacher/Admin/etc.]
- URL: [Where the bug occurs]
- User Role: [Student/Teacher/Admin/etc.]

---

## Error Messages
```
Paste error messages here
```

---

## Screenshots
[Attach screenshots]

---

## Workaround
Is there a workaround? If so, what is it?

---

## Additional Context
[Any other relevant information]

---

## Console Output
```bash
Paste relevant console output here
```
```

### 8.4 Code Review Template

```markdown
## Code Review: [PR Title]

**Reviewer:** @username
**Date:** YYYY-MM-DD
**Verdict:** Approve / Request Changes / Reject

---

## Summary
[Brief summary of what this PR does]

---

## Review Checklist

### TypeScript
- [ ] No new `any` types
- [ ] Proper types used
- [ ] Type safety maintained

### Code Quality
- [ ] Follows project patterns
- [ ] No code duplication
- [ ] Clear variable/function names
- [ ] Appropriate complexity

### Database
- [ ] Correct query patterns
- [ ] No `db.query.*` usage
- [ ] Proper column names
- [ ] Transaction handling if needed

### API
- [ ] Uses `requireAuth()`
- [ ] Proper response types
- [ ] Error handling
- [ ] RBAC checks

### React
- [ ] Hooks at top
- [ ] Loading states
- [ ] Error states
- [ ] Framer Motion correct

### Security
- [ ] No hardcoded secrets
- [ ] Proper authorization
- [ ] Input validation
- [ ] SQL injection prevention

### Testing
- [ ] Tests included
- [ ] Tests pass
- [ ] Edge cases covered

### Documentation
- [ ] Complex logic explained
- [ ] API documented
- [ ] Changes documented

---

## Issues Found

### Must Fix (Blocking)
1. [Description]

### Should Fix (Non-blocking but recommended)
1. [Description]

### Nice to Have
1. [Description]

---

## Questions/Clarifications
[Any questions for the author]

---

## Overall Feedback
[General comments on the PR]
```

---

## 9. Emergency Procedures

### 9.1 Hotfix Process

For critical production issues:

```
1. Create hotfix branch from main
2. Minimal fix only (no refactoring)
3. Add tests for the fix
4. Fast-track review (1 reviewer)
5. Merge to main
6. Tag release
7. Deploy
8. Create follow-up ticket for proper fix if needed
```

### 9.2 Rollback Process

If a merge causes issues:

```
1. Identify the problematic commit
2. Revert the commit on main
3. Deploy revert immediately
4. Create ticket for proper fix
5. Fix in new branch (not hotfix)
6. Full review process
```

### 9.3 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Tech Lead | [Contact] | [Hours] |
| DevOps | [Contact] | [Hours] |
| Security | [Contact] | Always |

---

## 10. Metrics & Reporting

### 10.1 Weekly Metrics (Track These)

| Metric | This Week | Last Week | Target |
|--------|-----------|-----------|--------|
| `any` types added | 0 | 0 | 0 |
| `any` types removed | [X] | [Y] | Trend up |
| TypeScript errors | 0 | 0 | 0 |
| Build failures | 0 | 0 | 0 |
| PRs with issues | [X] | [Y] | Trend down |
| Avg PR review time | [X]h | [Y]h | <24h |

### 10.2 Monthly Review

At month-end, review:
- Technical debt trends
- Process effectiveness
- Pattern documentation updates needed
- Training needs identified

---

## 11. References

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT_FRAMEWORK.md](DEVELOPMENT_FRAMEWORK.md) | Coding rules and patterns |
| [docs/memory/database-patterns.md](memory/database-patterns.md) | Database query rules |
| [docs/memory/api-patterns.md](memory/api-patterns.md) | API route templates |
| [docs/memory/react-patterns.md](memory/react-patterns.md) | React component rules |
| [docs/memory/common-mistakes.md](memory/common-mistakes.md) | Anti-patterns to avoid |
| [docs/ERRORS_AND_FIXES.md](ERRORS_AND_FIXES.md) | Error documentation |

---

## Appendix A: Quick Reference Card

### Before Coding
1. Read relevant docs/memory/ file
2. Find working example in codebase
3. Copy pattern
4. Modify for your use case

### Before Committing
1. `npx tsc --noEmit` - must pass
2. `npm run build` - must succeed
3. No new `any` types
4. No `console.log`

### Before Merging
1. All checklist items complete
2. At least 1 approval
3. All automated checks pass
4. Documentation updated

---

**Document Version:** 1.0
**Last Updated:** 2026-02-25
**Next Review:** 2026-03-25
**Maintainer:** Development Team
