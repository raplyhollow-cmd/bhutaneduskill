# AGENT STANDARD OPERATING PROCEDURES

> **MANDATORY:** All agents MUST read and follow this SOP for ALL work on this project.

> **LAST UPDATED:** 2026-03-07
> **VERSION:** 1.8
> **NEW:** Senior Auditor Debugging Methodology - Systematic approach to fixing issues

> **🎉 SPRINT 1 COMPLETE:** All 12+ agents finished successfully. Parallel agent workflow proven.

> **📊 SPRINT 1 METRICS:** 294 files modified, 43+ new files, 13 N+1 fixes (95-97% query reduction), 85 `any` types removed (28%), ~600 lines code reduced.

> **🖥️ AUTO-MONITORING:** All agents now self-monitor tokens, CPU, RAM automatically. No user reminder needed.

---

## 🖥️ AUTO-MONITORING (MANDATORY - All Agents)

**Every agent automatically self-monitors. This happens WITHOUT user reminder.**

### Self-Check Every 5 Tool Calls

```
IF token_usage > 150k:
  → Wrap up task immediately
  → Provide summary of work done
  → Request new session if more work needed

IF token_usage > 180k:
  → STOP immediately (you failed at monitoring)
```

### After Any Code Change

```
1. Run: npx tsc --noEmit
2. IF errors: Fix them before continuing
3. Only then: Report completion
```

### If Stuck

```
After 3 failed attempts:
  → Report to user with specific error
  → Suggest alternative approach
  → Don't keep trying same thing
```

### Conversation Length

```
IF messages > 50:
  → Request fresh session
  → Context is too bloated
```

---

## 👥 AGENT TEAM STRUCTURE (v1.2)

This project uses a **specialized agent team** approach where each task is assigned to the agent with the most relevant expertise.

### Quick Agent Assignment (v1.3)

| Need | Agent | Model |
|------|-------|-------|
| Create/Fix API | Backend Lead | Opus |
| Create/Fix Component | Frontend Lead | Sonnet |
| Database Query | Data Lead | Opus |
| Authentication Issue | Security Specialist | Opus |
| Common Error | Debug Specialist | Haiku |
| Performance Issue | Performance Specialist | Opus |
| Documentation | Documentation Specialist | Sonnet |
| Testing | QA Specialist | Sonnet |
| UI Component | Design System Specialist | Haiku |
| Complex Task | Project Manager | Sonnet |
| UX Review | UX Audit Specialist | Sonnet |
| Legal Check | Legal Compliance Specialist | Opus |
| Code Quality | Technical Debt Auditor | Opus |
| Breaking Change | Change Control Agent | Sonnet |
| Competitor Research | Competitive Intelligence Researcher | Sonnet |

**Full Team Structure:** See [AGENT_TEAM.md](AGENT_TEAM.md) for:
- 10 specialized agent roles with responsibilities
- Agent handoff protocols
- Parallel work strategy
- Task assignment matrix

---

## 🔍 SENIOR AUDITOR DEBUGGING METHODOLOGY (MANDATORY)

**When user reports issues, work like a senior auditor/debugger at a big company:**

### Phase 1: Full System Understanding (Before ANY Fix)

**Step 1: Map the Entire Data Flow**
```
User Action → Frontend → API Route → Database → Response → UI Update
```

**Step 2: Identify ALL Points of Failure**
- Authentication/Authorization checks
- API route handlers
- Database queries
- Response format consistency
- Client-side data transformation
- State management
- Error handling

**Step 3: Find Similar Patterns Across Codebase**
```
Grep: Find ALL files using same pattern
→ Check if they have same issue
→ Create comprehensive fix for ALL instances
```

### Phase 2: Root Cause Analysis (5 Whys Method)

```
❌ BAD: Fix one symptom at a time
"Teachers not loading → add credentials → done"
"Classes not loading → add credentials → done"

✅ GOOD: Find root cause, fix everywhere
"Why are APIs failing?" → "Missing credentials in fetch calls"
→ Find ALL fetch calls to unified API
→ Fix ALL at once
→ Verify pattern is consistent
```

### Phase 3: Systematic Fix Execution

1. **Group Issues by Root Cause**
   - Missing credentials → 14 files
   - Wrong response format → 3 files
   - Incorrect query → 2 files

2. **Create Comprehensive Fix per Group**
   - One pattern for credentials issue
   - Apply to ALL affected files

3. **Verify Fix Completeness**
   - Search codebase for remaining instances
   - Ensure zero similar issues remain

### Phase 4: Documentation

**Create Debug Report:**
```
## Issue: [Title]
### Root Cause: [Technical explanation]
### Files Affected: [List]
### Fix Applied: [Code pattern]
### Verification: [How to confirm fix works]
### Related Issues: [References to similar fixes]
```

### Anti-Patterns to Avoid

❌ **"Whack-a-Mole" Debugging**
- Fix one issue, move to next
- Don't look for patterns
- Leave similar issues unfixed

❌ **Surface-Level Fixes**
- Fix symptoms, not root cause
- Don't understand data flow
- Break other things

✅ **Senior Auditor Approach**
- Understand full system first
- Find root cause
- Fix ALL instances at once
- Document pattern for future
- Verify no regressions

### Example: Unified API Credentials Fix

**Initial Report:** "Teachers not loading in dropdown"

**Senior Auditor Process:**
1. ✅ Mapped data flow: Frontend → /api/resources/users → Database
2. ✅ Found root cause: Missing `credentials: "include"` in fetch
3. ✅ Searched for ALL similar fetch calls (14 files found)
4. ✅ Fixed ALL instances systematically
5. ✅ Documented pattern for future

**Files Fixed in One Batch:**
- teachers/page.tsx
- classes/page.tsx
- timetable/assign/page.tsx
- setup/school-admin/page.tsx
- route/page.tsx
- parent/parent-layout-client.tsx
- parent/link-child/page.tsx
- ministry/ministry-layout-client.tsx
- counselor/counselor-layout-client.tsx
- counselor/intervention/create/page.tsx
- admin/admin-layout-client.tsx
- dashboard/page.tsx
- hooks/use-portal-auth.ts
- (3 more...)

**Result:** One systematic fix resolved 14 potential failure points.

---

## PRE-WORK CHECKLIST (MANDATORY)

Before writing ANY code, agent MUST:

1. [ ] **Load QUICKREF.md** (~100 tokens) - Token-efficient quick rules
2. [ ] **Read relevant docs/memory/ files** for the task area (ONLY what's needed!)
   - Database work → `docs/memory/database-patterns.md`
   - API routes → `docs/memory/api-patterns.md`
   - React components → `docs/memory/react-patterns.md`
   - First time on project? Read `CLAUDE.md` TOR section

3. [ ] **Check docs/debug/DEBUG.md** for recent errors in this area

4. [ ] **Find 2-3 working examples** from the codebase to copy patterns from
   - Use `Grep` to find existing implementations
   - Copy the EXACT pattern that works

5. [ ] **Plan the approach** before coding

**⚠️ TOKEN EFFICIENCY:** Don't read everything! Read ONLY what you need for YOUR task.

**TIME SPENT:** 5-10 minutes
**SAVES:** 2-5 hours of debugging

---

## CRITICAL RULES (NEVER VIOLATE)

### Database Queries
```typescript
// ✅ CORRECT
await db.select().from(users).where(eq(users.clerkUserId, id))

// ❌ FORBIDDEN
await db.query.users.findFirst()  // Doesn't work with our driver!
await db.select('*').from(users)  // Don't use *
```

### Authentication
```typescript
// ✅ CORRECT - Use requireAuth helper
import { requireAuth } from "@/lib/auth-utils";
const { userId } = await requireAuth(['admin']);

// ❌ FORBIDDEN
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth()  // Returns wrong ID type
```

### Field Names
```typescript
// ✅ CORRECT
clerkUserId, schoolId, lastLogin, emailVerified

// ❌ WRONG
clerkId, school_id, lastLoginAt, isEmailVerified
```

### React Hooks
```tsx
// ✅ CORRECT
function Component() {
  const [state] = useState();
  useEffect(() => {}, []);
  if (condition) return <div />;
}

// ❌ WRONG
function Component() {
  if (condition) return null;
  const [state] = useState();  // CRASH!
}
```

### 🔴 DO NOT BREAK EXISTING FUNCTIONALITY

**CRITICAL:** When fixing one issue, DO NOT create another issue.

**Before any change:**
1. Run `npx tsc --noEmit` → ensure 0 errors
2. Test the affected page → ensure it works
3. Make your change

**After your change:**
1. Run `npx tsc --noEmit` → must still be 0 errors
2. If you broke something → FIX IT immediately
3. Do NOT report "done" until build is clean

**If you accidentally break something:**
- Own it
- Fix it before saying you're done
- Don't leave it for the user to fix

```typescript
// ❌ WRONG: Fixes issue A, breaks issue B
// (Then says "done" and leaves)

// ✅ CORRECT: Fixes issue A, verifies B still works
// If B breaks, fix B too before reporting done
```

### Imports
```typescript
// ✅ CORRECT
import { X } from "@/lib/...";
import { Y } from "@/components/...";

// ❌ WRONG
import { X } from "../../lib/..."
```

---

## API ROUTE DEVELOPMENT (UPDATED v1.1)

### ✅ PREFERRED: Use createApiRoute Wrapper

**For ALL new API routes**, use the wrapper pattern to eliminate duplicate code:

```typescript
import { NextRequest } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user, userId } = auth;

    // Your route logic here
    const data = await someOperation(userId);

    return successResponse({ data });
  },
  ['admin', 'school-admin']  // Allowed roles (optional)
);
```

**Benefits:**
- ✅ Automatic authentication check
- ✅ Automatic error handling and logging
- ✅ Type-safe role-based access control
- ✅ Eliminates ~80 lines of duplicate code per route

### Alternative: Manual Auth (Legacy)

Only use this pattern if the wrapper doesn't fit your needs:

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    const { userId, user } = await requireAuth(['admin']);

    // Route logic
    const data = await someOperation();

    logger.info("Route executed", { route: "/api/endpoint", userId });

    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });
    return Response.json(
      { success: false, error: "Error message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
```

### Response Helper Functions

Use these standardized response helpers:

```typescript
import {
  successResponse,      // 200
  createdResponse,      // 201
  updatedResponse,      // 200
  deletedResponse,      // 200
  errorResponse,        // 500 (customizable)
  badRequestResponse,   // 400
  unauthorizedResponse, // 401
  forbiddenResponse,    // 403
  notFoundResponse,     // 404
  conflictResponse      // 409
} from "@/lib/api/response-helpers";
```

### N+1 Query Prevention (UPDATED v1.4)

**Sprint 1 Results:** 13 N+1 problems fixed across 6 files with 95-97% query reduction.

**❌ WRONG:** Query inside loop (N+1 problem)
```typescript
const items = await db.select().from(items);
for (const item of items) {
  const related = await db.select().from(relatedTable)
    .where(eq(relatedTable.itemId, item.id)); // N queries!
}
```

**✅ CORRECT:** Batch query using `inArray()` with Map lookup
```typescript
import { inArray } from "drizzle-orm";

const items = await db.select().from(items);

// Collect all IDs
const itemIds = items.map(i => i.id);

// Single batch query
const relatedItems = await db.select()
  .from(relatedTable)
  .where(inArray(relatedTable.itemId, itemIds));

// Create Map for O(1) lookup
const relatedMap = new Map(relatedItems.map(r => [r.itemId, r]));

// Combine data (no additional queries)
const result = items.map(item => ({
  ...item,
  related: relatedMap.get(item.id)
}));
```

**Sprint 1 Files Fixed:**
- `src/lib/api/student.ts` - Student fee history
- `src/lib/api/school-admin.ts` - Teacher assignments
- `src/app/api/teacher/reports/route.ts` - Class reports
- `src/app/api/transport/allocations/route.ts` - Transport links
- `src/app/api/parent/homework/route.ts` - Homework attachments
- `src/app/api/classes/route.ts` - Teacher/School lookups

See `docs/memory/code-optimization-patterns.md` for complete patterns.

---

## SECURITY PATTERNS (NEW v1.3)

### Critical Security Rules

1. **NEVER create `/api/debug/*` endpoints** - They become production vulnerabilities
2. **NEVER use Base64 for session tokens** - Use JWT with cryptographic signing
3. **ALWAYS verify ownership** in dynamic routes (IDOR prevention)
4. **ALWAYS use `requireAuth()`** with appropriate roles
5. **NEVER log sensitive data** - Use `logger.info()` with safe context only
6. **ALWAYS validate parent-child relationships** - Parents can only access their children
7. **NEVER expose stack traces** in production API responses

### Security Checklist for New Routes

```typescript
// ✅ CORRECT - Secure API Route
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, unauthorizedResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { userId, user, schoolId } = getAuth(request);
    const { id } = await params;

    // Ownership check (CRITICAL for IDOR prevention)
    const resource = await getResource(id);
    if (resource.schoolId !== schoolId && user.type !== 'admin') {
      return unauthorizedResponse("Resource not found");
    }

    // Safe logging - no sensitive data
    logger.info("Resource accessed", { userId, resourceId: id });

    return successResponse({ data: resource });
  },
  ['school-admin']  // Role restriction
);
```

### Security Resources

- `docs/security-audit-report.md` - Complete security assessment
- `docs/change-control-process.md` - Security review requirements
- AGENT_TEAM.md - Security Specialist role

---

## FORBIDDEN PATTERNS (STRICTLY PROHIBITED)

1. **NEVER use `db.query.*` API** - Use `db.select().from().leftJoin()` instead
2. **NEVER use `clerkId`** - Use `clerkUserId`
3. **NEVER use relative imports** - Use `@/` alias only
4. **NEVER add new `any` types** - Use proper type definitions
5. **NEVER put hooks after conditionals** - Always declare at top of component
6. **NEVER use `repeat: Infinity` without `repeatType: "loop"`**
7. **NEVER use Tailwind gradient classes** - Use inline styles
8. **NEVER define new relations** in schema.ts - All are disabled
9. **NEVER use `console.log`** - Use `logger.info()` instead
10. **NEVER skip error handling** - Always wrap in try-catch (unless using `createApiRoute`)

---

## VERIFICATION CHECKLIST

Before claiming work is "complete" or "done", agent MUST verify:

### Backend (API/Database)
- [ ] Code compiles without errors: `npx tsc --noEmit`
- [ ] Query returns actual data: Test with database connection
- [ ] Error handling works: Test with invalid input
- [ ] Database transaction is atomic: All-or-nothing
- [ ] For new API routes: Used `createApiRoute` wrapper

### Frontend (UI/Components)
- [ ] Page loads without console errors
- [ ] Empty state shows helpful message to user
- [ ] Loading state shows during data fetch
- [ ] Success/error feedback appears to user after actions
- [ ] Navigation works after actions (redirects correctly)

### Integration
- [ ] Full user flow works end-to-end
- [ ] Data persists correctly in database after refresh
- [ ] Multiple agents can use same patterns successfully

---

## CONTEXT MANAGEMENT (To Avoid Token Limit)

### Token-Efficient Agent Strategy

**⚠️ CRITICAL: ALWAYS load QUICKREF.md first** (~100 tokens) instead of full documentation.

| Task | Load Only | Token Cost |
|------|-----------|------------|
| **ANY work** | QUICKREF.md | ~100 tokens |
| Database queries | + docs/memory/database-patterns.md | ~2k tokens |
| API routes | + docs/memory/api-patterns.md | ~2k tokens |
| React components | + docs/memory/react-patterns.md | ~3k tokens |
| Stuck on error | + docs/ERRORS_AND_FIXES.md | ~5k tokens |
| New to project | + CLAUDE.md | ~8k tokens |

**❌ WRONG:** Load everything at once (~20k+ tokens)
**✅ RIGHT:** Load QUICKREF.md + only what you need (~3k tokens max)

### When Approaching 150k+ Tokens

1. **Use general-purpose agent (medium model)** for exploration
2. **Spawn specialized agents** for specific implementation
3. **Each agent focuses on one area:** Database, UI, API, etc.
4. **Cross-agent communication via documentation** - not context transfer
5. **Start fresh agent** when hitting 180k tokens

### Agent Handoff Pattern

When passing to another agent, use this template:
```markdown
@agent-task: [task description]

Context:
- Used QUICKREF.md for quick rules
- Relevant patterns: [link to docs/memory/ file]
- Files modified: [list]
- Errors encountered: [link to debug doc if created]
```

---

## ERROR DOCUMENTATION

When agent discovers a NEW error pattern:

1. **Document it** in `docs/debug/[error-name].md` with:
   - Error signature
   - Root cause
   - Fix applied
   - Files modified

2. **Add to** `docs/ERRORS_AND_FIXES.md`

3. **Update** this SOP with new forbidden pattern if needed

4. **Share solution** so other agents don't repeat the mistake

---

## QUALITY STANDARDS

### Code Must:
- ✅ Compile without TypeScript errors (`npx tsc --noEmit`)
- ✅ Follow existing patterns in the codebase
- ✅ Include error handling with `logger` (or use `createApiRoute`)
- ✅ Use proper TypeScript types (no new `any` types)
- ✅ Be documented in relevant docs/memory/ file if it's a new pattern
- ✅ Use `createApiRoute` wrapper for new API routes

### Code Must NOT:
- ❌ Add new `console.log` statements (use `logger.info()`)
- ❌ Use `any` types without justification
- ❌ Break existing functionality
- ❌ Introduce new dependencies without discussion
- ❌ Copy patterns from tutorials without verifying compatibility with our stack
- ❌ Claim work is "done" without verification

---

## WORKING EXAMPLES (Reference These)

### API Route with createApiRoute Wrapper
**File:** `src/app/api/classes/route.ts` - Migrated + N+1 fix

### Database Query with Join
**File:** `src/lib/api/school-admin.ts` (line ~550)

### API Route with Manual Auth
**File:** `src/app/api/auth/set-role/route.ts`

### React Component with Hooks
**File:** `src/app/student/dashboard/page.tsx`

### Server Action with CRUD
**File:** `src/app/school-admin/_actions.ts` (line ~812)

---

## GETTING STARTED (First Task on This Project?)

1. **Read QUICKREF.md** - Token-efficient quick rules (~100 tokens)
2. **Read AGENT_TEAM.md** - Understand your role and the team structure
3. **Read docs/system-flow-diagram.md** - Understand the system flow
4. Then read ONLY what you need:
   - Database work → `docs/memory/database-patterns.md`
   - API work → `docs/memory/api-patterns.md`
   - React work → `docs/memory/react-patterns.md`
5. Start your task with proper patterns

**First time on project?** Then read CLAUDE.md and docs/DEVELOPMENT_FRAMEWORK.md

---

## TASK HANDOFF (When Passing to Another Agent)

When another agent takes over, include in your summary:

1. What patterns were used
2. What files were modified
3. What errors were encountered and how they were fixed
4. What documentation needs to be updated

This ensures continuity and prevents repeated mistakes.

---

## PROJECT STATUS (Feb 25, 2026 - Sprint 1 COMPLETE) 🎉

| Area | Status | Notes |
|------|--------|-------|
| API Routes | ✅ Wrapper available | 5/100+ routes migrated, ~95 remaining |
| Database Queries | ✅ N+1 fixed | All 13 problems fixed, 95-97% reduction |
| Portals | ✅ All 7 audited | Platform Admin: 90%, others 90-100% |
| TypeScript | ✅ Clean build | 0 errors, 222 `any` types remaining |
| Documentation | ✅ Comprehensive | See docs/ folder |
| Design System | ✅ Tokens created | 800+ tokens in design-tokens.ts |
| Mobile UX | ✅ Responsive | All 7 portal layouts, 5 new components |
| Legal Pages | ✅ Complete | Privacy Policy, Terms of Service |
| AI Career Coach | ✅ Complete | Gemini integration with rate limiting |
| Mock Data | ✅ Removed | All critical mock data eliminated |
| Agent Team | ✅ 16 roles defined | Full specialist team available |

**Sprint 1 COMPLETE - All 12+ Agents Finished:**
1. Query Optimization: 13 N+1 fixes (95-97% query reduction)
2. Type Safety: 85 `any` types eliminated (28%)
3. Documentation: CHANGELOG v2.0.0, AGENT_SOP v1.6, FRAMEWORK v1.3
4. Project Manager: Knowledge base updated
5. Diagram Specialist: All Mermaid diagrams fixed
6. Ministry GNH: Real metrics with formulas
7. Mobile UX: 5 components, responsive layouts
8. AI Career Coach: Gemini API integration
9. Testing & QA: Test infrastructure, 8 bugs fixed
10. Mock Data Eliminator: All critical data removed
11. Legal Specialist: Privacy Policy, Terms of Service
12. Data Lead: Schema verification, FERPA check

**Sprint 1 Final Metrics:**
- 294 files modified
- 43+ new files created
- 13 N+1 problems fixed (100%)
- 85 `any` types removed (28%)
- ~600 lines of code reduced
- 95-97% query reduction

**Sprint 2 Backlog (Ready to Execute):**
1. API Route Migration - 95 more routes (~1,600 lines savings)
2. Type Safety - 172 more `any` types to eliminate (target: <50)
3. Security Fixes - Remove debug endpoints, implement JWT
4. Parent Chat Interface - Parent-teacher messaging (competitive gap)
5. Component Library Rebuild with design tokens
6. Tier 1 UX Fixes from audit

**Known Gaps (Lower Priority):**
- 95+ API routes can be migrated to `createApiRoute` wrapper (~1,600 lines savings)
- 222 `any` types remaining (target: <50)
- Counselor: Cross-portal integration needed
- Security: Some issues documented in audit

---

**Remember:** The docs/ folder and memory.md exist to prevent repeated mistakes. USE THEM!

---

**For questions or clarifications, check:**
- `AGENT_TEAM.md` - Specialized agent team structure (NEW!)
- `docs/DEVELOPMENT_FRAMEWORK.md` - Development framework
- `docs/ERRORS_AND_FIXES.md` - Error documentation
- `docs/debug/DEBUG.md` - Recent debug notes
- `docs/memory/api-patterns.md` - API route templates
