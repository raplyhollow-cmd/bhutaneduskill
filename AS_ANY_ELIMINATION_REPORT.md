# `as any` Type Elimination Report

**Date:** February 28, 2026
**Task:** Eliminate ALL remaining `as any` types from the codebase
**Starting Count:** ~326 occurrences across 137 files
**Current Count:** ~238 occurrences across 130 files
**Fixed:** 88 occurrences (27% reduction)

## Summary

This session focused on systematically eliminating `as any` type casts from the Bhutan EduSkill codebase. The work prioritized highest-impact files first - those with the most occurrences and critical functionality.

## Files Fixed (88 occurrences total)

### 1. Motion System Files (32 occurrences)

#### `/src/lib/motion/loading.ts` (24 occurrences)
**Fixed:** Created `AnimationVariants` type to properly type Framer Motion variants
```typescript
interface CustomVariants {
  [key: string]: TargetProps | ((props: VariantProps) => TargetProps);
}
type AnimationVariants = Variants & CustomVariants;
```
**Impact:** All loading animations now properly typed

#### `/src/components/ui/toaster/animations.tsx` (8 occurrences)
**Fixed:** Created `ToastVariants` type and proper `Easing` imports
```typescript
import { Easing } from "framer-motion"
type ToastVariants = Variants & CustomVariants;
```
**Impact:** Toast notification animations properly typed

#### `/src/components/motion/progress-indicator.tsx` (4 occurrences)
**Fixed:** Changed `as any` to `as React.CSSProperties` for style props
**Impact:** Progress indicators properly typed

#### `/src/components/motion/pressable.tsx` (4 occurrences)
**Fixed:** Created `WhileTapOptions` and `WhileHoverOptions` interfaces
```typescript
interface WhileTapOptions {
  scale?: number;
  filter?: string;
  transition?: Transition;
}
```
**Impact:** Pressable components properly typed

### 2. PDF Generation (13 occurrences)

#### `/src/lib/report-cards/pdf-generator.ts` (13 occurrences)
**Fixed:** Created `ColorMap` type and properly typed color array accesses
```typescript
interface ColorRGB {
  0: number;
  1: number;
  2: number;
}
type ColorMap = Record<string, number[]>;
```
**Impact:** PDF generation properly typed, all color accesses use proper types

### 3. API Routes (22 occurrences)

#### `/src/app/api/teacher/payslips/[id]/pdf/route.ts` (22 occurrences)
**Fixed:** Extended `PayslipRecord` interface with all optional properties
```typescript
interface PayslipRecord {
  // ... existing fields
  paymentStatus?: string;
  designation?: string;
  department?: string;
  bankName?: string;
  gradePay?: number;
  totalEarnings?: number;
  totalDeductions?: number;
  netPay?: number;
}
```
**Impact:** Payslip generation properly typed

### 4. Data Processing (7 occurrences)

#### `/src/lib/sentinel/sitrep-generator.ts` (7 occurrences)
**Fixed:** Used indexed access types for SITREPData
```typescript
growth: record.growthData as SITREPData["growth"],
revenue: record.revenueData as SITREPData["revenue"],
activity: record.activityData as SITREPData["activity"],
```
**Impact:** SITREP data properly typed using indexed access

### 5. Push Notifications (6 occurrences)

#### `/src/lib/push/push-sender.ts` (6 occurrences)
**Fixed:** Created `WebPushAPI` interface and proper default values
```typescript
interface WebPushAPI {
  sendNotification: (subscription, payload) => Promise<void>;
  setVapidDetails: (subject, publicKey, privateKey) => void;
}
data: data || {},
vibrate: vibrate || [],
```
**Impact:** Push notification system properly typed

## Remaining Work (238 occurrences)

### Distribution by Category

#### API Routes (~100 occurrences)
- Transport routes (vehicles, routes, drivers, allocations)
- Assessment routes (riasec, mbti, disc, work-values, learning-styles)
- Homework routes (teacher, student submissions)
- Communication routes (announcements)
- File management routes
- Various other API endpoints

#### UI Components (~40 occurrences)
- Legal content components (terms, privacy, cookies)
- Teacher components (behavior-log-modal, leave page)
- Student components (tuition, assessment, medical)
- Parent components
- School admin components (fees, events, homework)
- Form components (auto-save-form, field-validation)
- Layout components (sidebar, empty-state)
- Motion components (animated-wrapper, hover)

#### Library Files (~50 occurrences)
- AI services (gemini-server)
- Data export/import
- ID card generation
- RBAC system
- Database utilities (seed, migrate, tenant)
- Auth utilities
- Career matching services
- Progress service
- Various other utilities

#### Page Components (~48 occurrences)
- Admin pages
- School admin pages
- Teacher pages
- Student pages
- Parent pages
- Counselor pages

## Common Patterns Remaining

### 1. Framer Motion Props
```typescript
// Current:
whileTap={variants.whileTap as any}

// Should be:
whileTap={variants.whileTap}
```

### 2. Style Props
```typescript
// Current:
style={{ height } as any}

// Should be:
style={{ height } as React.CSSProperties}
```

### 3. Database JSON Fields
```typescript
// Current:
data: record.jsonData as any

// Should be:
data: record.jsonData as SpecificType
```

### 4. External Library Types
```typescript
// Current:
import { Library } from 'library';
const value = lib.method() as any;

// Should be:
import { Library, LibraryType } from 'library';
const value: LibraryType = lib.method();
```

## Recommendations for Continued Work

### Priority 1: API Routes (100 occurrences)
1. Create proper response type interfaces for each route
2. Use indexed access types for database records
3. Create shared types for common patterns (pagination, filtering, etc.)

### Priority 2: Motion System (20+ occurrences)
1. Create a centralized `MotionProps` type
2. Use `React.CSSProperties` for all style props
3. Create variant type factories for common patterns

### Priority 3: Database Operations (30+ occurrences)
1. Create strict types for JSON columns
2. Use Drizzle's generated types where possible
3. Create utility types for common database operations

### Priority 4: Component Props (40+ occurrences)
1. Create proper prop interfaces for all components
2. Use discriminated unions for variant props
3. Create reusable component prop type utilities

## Type Safety Improvements Achieved

### Before
```typescript
export const spinnerVariants: Variants = {
  // ...
} as any; // ❌ No type checking
```

### After
```typescript
export const spinnerVariants: AnimationVariants = {
  // ...
}; // ✅ Fully type checked
```

## Build Status

All changes maintain type safety and the build continues to succeed. No new TypeScript errors were introduced during this refactoring.

## Next Steps

1. Continue with API routes (highest remaining count)
2. Create shared type utilities for common patterns
3. Document type patterns in docs/memory/types-patterns.md
4. Run `npx tsc --noEmit` after each batch of changes
5. Consider enabling strict mode incrementally

## Files Created

This report documents the work completed and provides a roadmap for continuing the type safety improvements.

---

**Session Notes:**
- Focused on highest-impact files first (most occurrences per file)
- Created reusable type patterns that can be applied to remaining files
- Maintained backward compatibility while improving type safety
- No breaking changes to functionality
- All changes verified with TypeScript compiler
