# Plan: Connect Real AI to All Portal Dashboards

## Context

**Problem:** Portal dashboards (Teacher, Counselor, School Admin, Admin) show hardcoded AI "insights" that are static text, not personalized based on actual user data. The Parent dashboard already has working AI insights using the `generateAIInsights()` pattern.

**User Intent:** Each user should receive personalized, private AI insights based on their own data only - no data sharing between users.

**Key Discovery:**
- `/api/ai/career-coach` endpoint already exists and integrates with Google Gemini
- It takes user context (profile, assessments, career matches) and returns personalized responses
- The issue is that dashboards aren't calling this API - they have hardcoded text

## Implementation Approach

### Phase 1: Verify Gemini API Key Setup
1. **Security:** Remove exposed API key from `docs/ai-integration-complete.md:179`
2. **Vercel:** Verify `GEMINI_API_KEY` is properly set in Vercel environment variables
3. **Test:** Verify `/api/ai/career-coach` returns AI responses (not fallback)

### Phase 2: Create Shared AI Insights API Endpoint
**New file:** `src/app/api/ai/insights/route.ts`

This unified endpoint will:
- Accept `userRole` (teacher, counselor, school-admin, admin, parent, student)
- Fetch relevant data based on role using existing APIs
- Call `chatWithCareerCoach()` from `@/lib/ai/gemini` with context
- Return structured insights matching `AIInsightCard` props

**Request format:**
```json
{
  "userRole": "teacher",
  "contextData": {
    "stats": { ... },
    "recentActivity": [ ... ],
    "students": [ ... ]
  }
}
```

**Response format:**
```json
{
  "insights": [
    {
      "type": "warning" | "success" | "info" | "tip",
      "title": "At-Risk Students",
      "message": "3 students have attendance below 75%",
      "actions": [...]
    }
  ]
}
```

### Phase 3: Update Each Dashboard

**Files to modify:**

1. **Teacher Dashboard** - `src/app/teacher/dashboard/page.tsx`
   - Remove hardcoded insights (lines ~148-180)
   - Fetch from `/api/ai/insights` with teacher context
   - Display returned insights dynamically

2. **Counselor Dashboard** - `src/app/counselor/dashboard/content.tsx`
   - Remove mock `recentStudents` data
   - Fetch real counselor stats and student list
   - Call AI insights API with counselor context

3. **School Admin Dashboard** - `src/app/school-admin/dashboard/page.tsx`
   - Already has good data fetching
   - Replace static insights with AI-generated ones

4. **Admin Dashboard** - `src/app/admin/page.tsx`
   - Replace mock career trends with real data
   - Add AI insights for platform management

### Phase 4: Data Privacy & Isolation

**Privacy guarantees:**
1. Each API call includes user's Clerk `userId` in auth check
2. `requireAuth()` helper ensures only authenticated access
3. Data filtering by `schoolId` for multi-tenancy
4. AI context built from **only that user's accessible data**
5. No cross-user data leakage

### Phase 5: Testing & Verification

**Test each portal:**
1. Sign in as each user type
2. Verify insights appear with relevant, personalized content
3. Check browser network tab confirms API calls to `/api/ai/insights`
4. Verify insights change based on real data (attendance, homework, etc.)

## Critical Files to Modify

| File | Action |
|-------|--------|
| `docs/ai-integration-complete.md` | Remove exposed API key (line 179) |
| `src/app/api/ai/insights/route.ts` | **CREATE** - Unified AI insights endpoint |
| `src/app/teacher/dashboard/page.tsx` | Replace hardcoded insights with API call |
| `src/app/counselor/dashboard/content.tsx` | Replace mock data with real AI insights |
| `src/app/school-admin/dashboard/page.tsx` | Update to use AI insights API |
| `src/app/admin/page.tsx` | Update to use AI insights API |

## Reusable Components & Functions

**Already exists - use these:**
- `AIInsightCard` component - `src/components/ai/ai-insight-card.tsx`
- `chatWithCareerCoach()` - `src/lib/ai/gemini.ts` (lines 98-154)
- `requireAuth()` - `src/lib/auth-utils.ts`
- Parent dashboard's `generateAIInsights()` pattern - `src/app/parent/dashboard/page.tsx` (lines 131-200)

## Verification Checklist

- [ ] Gemini API key set in Vercel (not hardcoded)
- [ ] `/api/ai/insights` endpoint returns personalized insights
- [ ] Teacher dashboard shows at-risk student alerts based on real data
- [ ] Counselor dashboard shows intervention suggestions based on real students
- [ ] School Admin dashboard shows actionable insights based on school stats
- [ ] Admin dashboard shows platform-level insights
- [ ] Each user sees only their own data (no cross-user leakage)
- [ ] Insights update dynamically as data changes