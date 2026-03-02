# Build Error Report - 2026-02-25

**Priority**: HIGH (Build Blocking)
**Status**: Identified - Fix Documented
**File**: `src/styles/design-tokens.ts`

---

## Error

```
Ecmascript file had an error: the name `semantic` is defined multiple times
Line: 255, Column: 14
```

---

## Cause

Duplicate export of `semantic` constant:
1. Lines 28-148: Full color palette
2. Lines 255-276: Gradient-only version

---

## Fix Options

### Option 1: Rename Second Export
```typescript
// Line 255: Change to
export const semanticGradients = {
```

### Option 2: Merge into First Export
Add gradients to existing `semantic` export, delete duplicate

### Option 3: Delete Unused Export
Remove lines 255-276 if unused

---

## Verification

```bash
npx tsc --noEmit
npm run build
```

---

## Documented In

`docs/ERRORS_AND_FIXES.md` - Section 8
