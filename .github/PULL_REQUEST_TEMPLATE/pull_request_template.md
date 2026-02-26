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
- [ ] Pre-Implementation Checklist completed (see docs/change-control-process.md)
- [ ] Code follows project patterns (read docs/memory/ files first)
- [ ] No new `any` types (ZERO TOLERANCE)
- [ ] No `console.log` statements (use `logger`)
- [ ] All imports use `@/` alias (no relative paths)

### Database
- [ ] Uses `db.select().from().leftJoin()` pattern (NOT `db.query.*`)
- [ ] Correct column names (clerkUserId, schoolId - verified in schema.ts)
- [ ] JSON fields parsed with `parseJsonArray()` if applicable

### API
- [ ] Uses `requireAuth()` from `@/lib/auth-utils` (NOT `auth()`)
- [ ] Returns `ApiSuccess<T>` or `ApiErrorResponse` types
- [ ] Error handling with try-catch and `logger.apiError()`
- [ ] RBAC role checks included if applicable

### React
- [ ] All hooks at component top (BEFORE conditionals)
- [ ] `"use client"` directive if using hooks
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled
- [ ] Framer Motion uses `repeatType: "loop"` with `repeat: Infinity`
- [ ] No Tailwind gradient classes (use inline styles)

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
- [ ] Complex logic has comments
- [ ] Breaking changes documented
- [ ] CHANGELOG.md updated (if user-facing)

---

## Screenshots/Mockups
[Include if applicable]

## Notes for Reviewers
[Any specific areas to focus on]

---

## Automated Checks Status

| Check | Status |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | [ ] Pass / [ ] Fail |
| Build (`npm run build`) | [ ] Pass / [ ] Fail |
| No new `any` types | [ ] Pass / [ ] Fail |
| No console.log | [ ] Pass / [ ] Fail |

---

## Definition of Done
- [x] Code written
- [ ] Code reviewed (pending)
- [x] Tests passing
- [ ] Documentation approved (pending)
- [x] No new technical debt
- [x] No regressions

---

**Remember:** If this PR adds any new `any` types, it will be blocked. Fix the types or use proper typing from `@/types`.
