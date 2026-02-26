# Agent Task Assignments - Phase 1 Optimization

> **Created:** February 25, 2026
> **Status:** Ready for Assignment
> **Context Budget:** Each task <50k tokens, max 5-10 files

---

## PM Analysis Summary

**Current State:**
- 116 files using `createApiRoute` wrapper ✅
- 236 files using manual `requireAuth()` pattern ⚠️ (need migration)
- Adoption: ~33%

**Available Agents:**
1. Backend Lead - API route migration
2. Type Safety Agent - `any` type elimination
3. Schema Auditor - Schema duplication issues

---

## Task Batch 1: School Admin Routes (5 files)

**Assigned to:** Backend Lead Agent
**Model:** Sonnet 4.6
**Context Estimate:** ~15k tokens
**Files to migrate:**

| File | Lines | Est. Savings |
|------|-------|--------------|
| `src/app/api/school-admin/hostels/allocate/route.ts` | 414 | ~40 lines |
| `src/app/api/school-admin/bcse-registrations/route.ts` | TBD | ~40 lines |
| `src/app/api/school-admin/departments/route.ts` | TBD | ~40 lines |
| `src/app/api/school-admin/fees/generate/route.ts` | TBD | ~40 lines |
| `src/app/api/school-admin/medical/route.ts` | TBD | ~40 lines |

**Migration Pattern:**
```typescript
// BEFORE (manual pattern)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    // ... business logic
  } catch (error) {
    logger.apiError(error, { route, method });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// AFTER (wrapper pattern)
export const POST = createApiRoute(
  async (request) => {
    const { user, userId } = getAuth(request);
    // ... business logic
    return successResponse(data);
  },
  ['school-admin']
);
```

**Instructions for Backend Lead:**
1. Read each file (5 files max)
2. Convert `requireAuth` pattern to `createApiRoute` wrapper
3. Replace manual error handling with response helpers
4. Keep business logic unchanged
5. Run `npx tsc --noEmit` after each file
6. Report: lines saved, issues found

---

## Task Batch 2: Parent Portal Routes (5 files)

**Assigned to:** Backend Lead Agent
**Model:** Sonnet 4.6
**Context Estimate:** ~15k tokens
**Files to migrate:**

| File | Lines | Est. Savings |
|------|-------|--------------|
| `src/app/api/parent/fees/route.ts` | TBD | ~40 lines |
| `src/app/api/parent/documents/route.ts` | TBD | ~40 lines |
| `src/app/api/parent/transport/route.ts` | TBD | ~40 lines |
| `src/app/api/parent/contacts/route.ts` | TBD | ~40 lines |
| `src/app/api/parent/behavior-logs/route.ts` | TBD | ~40 lines |

**Same migration pattern as Batch 1.**

---

## Task Batch 3: Type Safety - API Types (10 files)

**Assigned to:** Type Safety Agent
**Model:** Sonnet 4.6
**Context Estimate:** ~20k tokens
**Files to improve:**
1. Add missing types to `src/types/index.ts`
2. Replace `any` in 10 highest-usage API files

**Pattern:**
```typescript
// BEFORE
const data: any = await db.select(...);

// AFTER
interface ClassListResponse {
  id: string;
  name: string;
  grade: number;
}
const data: ClassListResponse[] = await db.select(...);
```

**Target:** Reduce `any` count from 222 → <200

---

## Task Batch 4: Schema Duplication Audit

**Assigned to:** Schema Auditor
**Model:** Opus 4.6
**Context Estimate:** ~30k tokens
**Files to audit:**
- `src/lib/db/schema.ts` (main schema)
- `src/lib/db/subscription-schema.ts`
- `src/lib/db/tenancy-schema.ts`
- `src/lib/db/timetable-schema.ts`
- `src/lib/db/hostel-schema.ts`

**Goal:** Identify and document:
1. Duplicate table exports (10 known)
2. Redundant tables that could merge
3. Missing indexes

---

## Execution Order (PM Orchestration)

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Spawn Backend Lead → Batch 1 (5 files)         │
│  Wait for completion (est. 10 min)                      │
├─────────────────────────────────────────────────────────┤
│  Step 2: Spawn Backend Lead → Batch 2 (5 files)         │
│  Wait for completion (est. 10 min)                      │
├─────────────────────────────────────────────────────────┤
│  Step 3: Spawn Type Safety Agent → Batch 3              │
│  Wait for completion (est. 15 min)                      │
├─────────────────────────────────────────────────────────┤
│  Step 4: Spawn Schema Auditor → Batch 4                 │
│  Wait for completion (est. 15 min)                      │
├─────────────────────────────────────────────────────────┤
│  Step 5: Compile Results → Update Plan                  │
│  Run npx tsc --noEmit (verify)                          │
│  Update MEMORY.md with progress                         │
└─────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Current | Target After Phase 1 |
|--------|---------|---------------------|
| Wrapper adoption | 116/352 (33%) | 126/352 (36%) |
| `any` types | 222 | <200 |
| Lines saved | 0 | ~200 |
| Schema duplicates documented | No | Yes |

---

## PM Notes

**Context Management:**
- Each agent gets max 5-10 files
- Never send entire DEVELOPMENT_FRAMEWORK.md
- Quote only relevant rules (3-4 lines max)
- Use Haiku for initial exploration if needed

**Fallback:**
- If agent crashes, reduce batch size to 3 files
- If type errors persist, report to PM for review
- Keep log of files successfully migrated

**Next Phase (after Phase 1 complete):**
- Setup API consolidation (6 files → 1 helper)
- Portal layout consolidation (7 files → 1 component)
- Remaining 200 API route migrations
