# TypeScript Patterns & Type Safety Guide

This document explains the common TypeScript patterns used in Career Compass and how to solve recurring type errors.

---

## 🔧 Quick Fix Tool

Before manually fixing errors, try the automated fix script:

```bash
npm run fix:types
```

This will automatically detect and fix common TypeScript patterns:
- Array index access without optional chaining (`firstName[0]` → `firstName?.[0] ?? ''`)
- null to undefined conversions
- SQL count function syntax

---

## Quick Reference

| Error Type | Solution | Helper Function |
|------------|----------|-----------------|
| Framer Motion `ease:` array errors | Use `motionEasing` preset | `motionEasing.default` |
| Drizzle `eq()` with string variable | Use `eqLiteral` or `asX` helpers | `asPriority()`, `asCategory()` |
| Drizzle `or()` returning undefined | Use `safeOr` or `pushIfDefined` | `safeOr(cond1, cond2)` |
| Dynamic import in server component | Use wrapper component | `createClientComponent()` |
| Career phase indexing | Use `asCareerPhase` or `getFromRecord` | `asCareerPhase(value)` |

---

## 1. Framer Motion Easing

### Problem
```typescript
// ❌ TypeScript error: Type 'number[]' is not assignable to type 'Easing'
transition: {
  ease: [0.25, 0.4, 0.25, 1],  // Error!
}
```

### Solution
```typescript
import { motionEasing } from "@/lib/type-helpers";

// ✅ Use predefined easing presets
transition: {
  ease: motionEasing.default,
}
```

### Available Presets
```typescript
motionEasing.default  // [0.25, 0.4, 0.25, 1] - Smooth
motionEasing.easeIn    // [0.4, 0, 1, 1] - Fast end
motionEasing.easeOut   // [0, 0, 0.2, 1] - Fast start
motionEasing.easeInOut // [0.4, 0, 0.2, 1] - Both
motionEasing.sharp     // [0.4, 0, 0.6, 1] - Bouncy
```

---

## 2. Drizzle ORM - Equality Checks with Union Types

### Problem
```typescript
// ❌ Error: string is not assignable to "low" | "normal" | "high" | "urgent"
const priority = searchParams.get("priority");
conditions.push(eq(announcements.priority, priority));
```

### Solution 1: Use Type Assertion Helper
```typescript
import { asPriority, asCategory, asTargetAudience } from "@/lib/type-helpers";

// ✅ Use the specific helper for your column type
const priority = searchParams.get("priority");
conditions.push(eq(announcements.priority, asPriority(priority)));

// For category:
conditions.push(eq(announcements.category, asCategory(category)));

// For target audience:
conditions.push(eq(announcements.targetAudience, asTargetAudience(audience)));
```

### Solution 2: Use Generic Helper
```typescript
import { eqLiteral } from "@/lib/type-helpers";

// ✅ Generic helper for any union type
conditions.push(eqLiteral<"low" | "normal" | "high" | "urgent">(
  announcements.priority,
  priority
));
```

---

## 3. Drizzle ORM - OR/AND with Optional Conditions

### Problem
```typescript
// ❌ Error: SQL<unknown> | undefined is not assignable to SQL<unknown>
const audienceFilter = or(
  eq(table.audience, "all"),
  userType === "student" ? eq(table.audience, "students") : undefined
);
conditions.push(audienceFilter);  // Could be undefined!
```

### Solution 1: Use safeOr
```typescript
import { safeOr } from "@/lib/type-helpers";

// ✅ Returns array (empty if no conditions)
conditions.push(...safeOr(
  eq(table.audience, "all"),
  userType === "student" ? eq(table.audience, "students") : undefined
));
```

### Solution 2: Use pushIfDefined
```typescript
import { pushIfDefined } from "@/lib/type-helpers";

// ✅ Only pushes if condition exists
pushIfDefined(conditions, or(
  eq(table.audience, "all"),
  eq(table.audience, userTypeAudience)
));
```

### Solution 3: Manual Check
```typescript
// ✅ Check before pushing
const filter = or(cond1, cond2, cond3);
if (filter) {
  conditions.push(filter);
}
```

---

## 4. Dynamic Imports with SSR Disabled

### Problem
```typescript
// ❌ Error: ssr: false not allowed in Server Components
const Component = dynamic(
  () => import("./component"),
  { ssr: false }
);
```

### Solution: Create a Client Wrapper

**Step 1:** Create a client component wrapper (`wrapper.tsx`):
```typescript
"use client";

import { createClientComponent } from "@/lib/type-helpers";

export const ComponentWrapper = createClientComponent(
  () => import("./component").then(m => m.Component),
  { loading: <div>Loading...</div> }
);
```

**Step 2:** Import wrapper in your server component:
```typescript
// ✅ Works in server components
import { ComponentWrapper } from "./wrapper";

export default function ServerPage() {
  return <ComponentWrapper prop={value} />;
}
```

---

## 5. Career Phase Indexing

### Problem
```typescript
// ❌ Error: string can't be used to index CAREER_PHASES
const currentPhase = user.phase;  // Type: string
const phaseInfo = CAREER_PHASES[currentPhase];  // Error!
```

### Solution 1: Type Assertion
```typescript
import { asCareerPhase } from "@/lib/type-helpers";

// ✅ Assert the type first
const phaseInfo = CAREER_PHASES[asCareerPhase(user.phase)];
```

### Solution 2: Generic Helper
```typescript
import { getFromRecord } from "@/lib/type-helpers";

// ✅ Use helper that handles the assertion
const phaseInfo = getFromRecord(CAREER_PHASES, user.phase);
```

### Solution 3: Inline Assertion
```typescript
// ✅ Inline keyof assertion
const phaseInfo = CAREER_PHASES[user.phase as keyof typeof CAREER_PHASES];
```

---

## 6. Portal Color Gradients

### Problem
```typescript
// ❌ Don't use Tailwind gradient classes (they don't exist)
<div className="from-hunter-green-to-orange-500">  // Wrong!
```

### Solution: Always Use Inline Styles
```typescript
// ✅ Use inline styles with RGB values
<div style={{
  background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)'
}}>
```

### Portal Color Reference
```typescript
const portalColors = {
  student:     'rgb(249 115 22) → rgb(194 65 12)',    // Orange
  teacher:     'rgb(59 130 246) → rgb(37 99 235)',    // Blue
  parent:      'rgb(107 114 128) → rgb(75 85 99)',    // Gray
  counselor:   'rgb(168 85 247) → rgb(147 51 234)',   // Purple
  admin:       'rgb(236 72 153) → rgb(219 39 119)',   // Pink
  schoolAdmin: 'rgb(139 92 246) → rgb(124 58 237)',   // Violet
};
```

---

## TypeScript Config Summary

The project already has these optimizations enabled:

```json
{
  "compilerOptions": {
    "skipLibCheck": true  // ✅ Skips node_modules type checking (faster builds)
  }
}
```

This means:
- Dependencies' types aren't checked (saves time)
- Your project's types are still checked
- Build times are 30-60 seconds faster

---

## Common Type Patterns

### Empty File Pages
All page files must export a default component:

```typescript
// ✅ Correct - even for simple pages
export default function PageName() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Page Title</h1>
      <p className="text-gray-600">Description</p>
    </div>
  );
}
```

### Boolean for PostgreSQL
```typescript
// ✅ PostgreSQL handles boolean natively
isPublished: value === true,
isActive: value === true,
```

---

## Quick Fix Checklist

When you see a TypeScript error:

1. **Framer Motion ease array?** → Use `motionEasing`
2. **Drizzle eq() with variable?** → Use `asPriority()`, `asCategory()`, or `eqLiteral()`
3. **Drizzle or() undefined?** → Use `safeOr()`, `pushIfDefined()`, or manual check
4. **Dynamic import ssr: false?** → Create client wrapper component
5. **Indexing CAREER_PHASES?** → Use `asCareerPhase()` or `getFromRecord()`
6. **Portal gradient?** → Use inline style with RGB values

---

## Adding New Helpers

To add a new helper to `src/lib/type-helpers.ts`:

```typescript
/**
 * Description of what the helper does.
 *
 * @example
 * const result = helperName(value);
 */
export const helperName = <T extends string>(value: string): T => {
  return value as T;
};
```

Then document it in this file under the appropriate section.
