# AI Implementation Plan for Bhutan EduSkill SaaS

## Context

The Bhutan EduSkill platform has a solid AI foundation with Google Gemini API integration, but the AI features are not fully functional or integrated across the platform. Key issues:

1. **AI Career Coach component exists** but isn't added to any portal layout
2. **Client-side `chatWithCareerCoach()` uses fallback only** - doesn't actually call Gemini API
3. **Server-side `/api/ai/career-coach` exists** but may have auth issues (uses wrong `requireAuth`)
4. **Dashboard insights are mostly hardcoded** - only Teacher and Admin dashboards use `/api/ai/insights`
5. **10 AI system prompts exist** but only Career Coach is implemented

**User Requirements:**
- Add AI Career Coach to **Global Root Layout** (available app-wide)
- **Full AI implementation** - enable real Gemini API + connect all dashboard insights
- **Implement all 10 AI features** (Career Coach, Career Predictor, Skill Gap Analyzer, Study Planner, Essay Reviewer, Interview Coach, RUB Predictor, Class Insights, Scholarship Matcher, Mood Tracker)

---

## Implementation Plan

### Phase 1: Fix Core AI Integration (Foundation)

#### 1.1 Fix Client-Side Gemini Integration
**File:** `src/lib/ai/gemini.ts`

**Current Issue:** Client-side function always returns `fallback: true` to avoid SSR issues. Gemini API calls should only happen server-side via API routes.

**Action:** Keep current pattern (client-side fallback, server-side API). This is correct architecture. The issue is that the server-side API route may not be properly calling Gemini.

#### 1.2 Fix Server-Side AI API Route
**File:** `src/app/api/ai/career-coach/route.ts`

**Issues Found:**
- Line 11: Uses `requireAuth()` from `@/lib/db/tenant` instead of `@/lib/auth-utils`
- This is inconsistent with the rest of the codebase

**Action:**
- Change `import { requireAuth } from "@/lib/db/tenant"` to `import { requireAuth } from "@/lib/auth-utils"`
- Ensure the route actually calls Gemini API with the API key from environment

#### 1.3 Create Server-Side Gemini Service
**New File:** `src/lib/ai/gemini-server.ts`

Create a server-only Gemini service that:
- Imports Google Gemini SDK (server-side safe)
- Uses `GEMINI_API_KEY` from environment
- Implements `chatWithGemini()` function
- Has proper error handling and fallback

```typescript
// Server-side only Gemini integration
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function chatWithGemini(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  // Implementation
}
```

---

### Phase 2: Integrate AI Career Coach UI

#### 2.1 Add AI Career Coach to Root Layout
**File:** `src/app/layout.tsx`

**Action:**
- Import `AICareerCoach` component
- Add it to the root layout so it's available throughout the app
- This makes the floating chat button available on all pages

#### 2.2 Verify AI Career Coach Component
**File:** `src/components/ai/career-coach.tsx`

**Check:**
- Ensure it properly calls `/api/ai/career-coach` endpoint
- Verify conversation history persistence
- Check mobile responsiveness
- Ensure floating button doesn't interfere with navigation

---

### Phase 3: Connect All Dashboard Insights

#### 3.1 Student Dashboard
**File:** `src/app/student/dashboard/page.tsx`

**Current:** Hardcoded AI insights

**Action:**
- Add `useEffect` to fetch from `/api/ai/insights` with student role
- Display returned insights using `AIInsightCard` component
- Pass student-specific context (assessments, homework, attendance)

#### 3.2 Parent Dashboard
**File:** `src/app/parent/dashboard/page.tsx`

**Current:** Local `generateAIInsights()` function

**Action:**
- Replace local function with API call to `/api/ai/insights`
- Pass child data as context
- Display dynamic insights

#### 3.3 Counselor Dashboard
**File:** `src/app/counselor/dashboard/page.tsx` or `content.tsx`

**Current:** Mock data only

**Action:**
- Fetch real counselor stats from API
- Call `/api/ai/insights` with counselor context
- Replace mock `recentStudents` with real data
- Display AI-generated intervention suggestions

#### 3.4 School Admin Dashboard
**File:** `src/app/school-admin/dashboard/page.tsx`

**Current:** Hardcoded insights with real school stats

**Action:**
- Keep existing data fetching (it's good)
- Replace hardcoded insights with API call to `/api/ai/insights`
- Pass school-specific context as stats

#### 3.5 Admin Dashboard
**File:** `src/app/admin/page.tsx`

**Current:** Already uses `/api/ai/insights` ✅

**Action:**
- Verify it's working correctly
- Add more context data for better insights

#### 3.6 Ministry Dashboard
**File:** `src/app/ministry/page.tsx`

**Current:** Completely mock data

**Action:**
- Create `/api/ministry/dashboard` endpoint
- Fetch real national statistics
- Connect to `/api/ai/insights` for ministry-specific insights

---

### Phase 4: Implement Remaining 9 AI Features

#### 4.1 Career Path Predictor
**New API Route:** `src/app/api/ai/career-predictor/route.ts`

**Implementation:**
- Use `CAREER_PREDICTOR_SYSTEM` prompt from `src/lib/ai/prompts.ts`
- Accept user assessment results (RIASEC, MBTI, grades)
- Return career success predictions with probabilities
- Suggest backup options

**UI Component:** `src/components/ai/career-predictor.tsx`
- Display on student career plan page
- Show match probabilities for different careers

#### 4.2 Skill Gap Analyzer
**New API Route:** `src/app/api/ai/skill-gap/route.ts`

**Implementation:**
- Use `SKILL_GAP_SYSTEM` prompt
- Accept target career and current skills
- Return skill gap analysis with learning resources

**UI Component:** `src/components/ai/skill-gap-analyzer.tsx`
- Add to student dashboard or career plan page

#### 4.3 AI Study Planner
**New API Route:** `src/app/api/ai/study-planner/route.ts`

**Implementation:**
- Use `STUDY_PLANNER_SYSTEM` prompt
- Accept subjects, available hours, weak/strong areas
- Return personalized weekly study schedule

**UI Component:** `src/components/ai/study-planner.tsx`
- Add to student dashboard or dedicated `/student/study-planner` page

#### 4.4 Essay Reviewer
**New API Route:** `src/app/api/ai/essay-reviewer/route.ts`

**Implementation:**
- Use `ESSAY_REVIEWER_SYSTEM` prompt
- Accept essay text and prompt type
- Return structured feedback (rating, strengths, improvements)

**UI Component:** `src/components/ai/essay-reviewer.tsx`
- Add to college application section

#### 4.5 Interview Coach
**New API Route:** `src/app/api/ai/interview-coach/route.ts`

**Implementation:**
- Use `INTERVIEW_COACH_SYSTEM` prompt
- Interactive mock interview flow
- Return feedback after each answer

**UI Component:** `src/components/ai/interview-coach.tsx`
- Add as standalone practice feature

#### 4.6 RUB Admission Predictor
**New API Route:** `src/app/api/ai/rub-predictor/route.ts`

**Implementation:**
- Use `RUB_PREDICTOR_SYSTEM` prompt
- Accept Class 10/12 marks and subject combinations
- Return admission probabilities for all RUB colleges
- Check eligibility requirements

**UI Component:** `src/components/ai/rub-predictor.tsx`
- Add to college exploration section

#### 4.7 Class Insights (For Teachers)
**Enhanced Route:** `src/app/api/ai/insights/route.ts`

**Implementation:**
- Use `CLASS_INSIGHTS_SYSTEM` prompt for teacher insights
- Accept class roster and assessment data
- Return teaching suggestions and at-risk student alerts

**Already exists** in teacher dashboard flow - enhance with more context

#### 4.8 Scholarship Matcher
**New API Route:** `src/app/api/ai/scholarships/route.ts`

**Implementation:**
- Use `SCHOLARSHIP_SYSTEM` prompt
- Accept academic performance, family income, career goals
- Return matched scholarships with eligibility and deadlines

**UI Component:** `src/components/ai/scholarship-matcher.tsx`
- Add to student finance section

#### 4.9 Mood Tracker
**New API Route:** `src/app/api/ai/mood-tracker/route.ts`

**Implementation:**
- Use `MOOD_TRACKER_SYSTEM` prompt
- Accept daily mood ratings, stress levels, concerns
- Return pattern analysis and wellness recommendations
- **Important:** Recommend counselor contact for serious distress

**UI Component:** `src/components/ai/mood-tracker.tsx`
- Add to student wellness section

---

### Phase 5: Data Collection & Personalization

#### 5.1 Create AI Interactions Table
**Migration:** `drizzle/XXXX_ai_interactions.sql`

**Schema:**
```sql
CREATE TABLE ai_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature_id TEXT NOT NULL,
  interaction_data JSON,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5.2 Track All AI Interactions
**Action:** Update all AI API routes to save interactions for:
- Analytics and usage tracking
- Personalization improvement
- Data insights for platform optimization

#### 5.3 Gamification Integration
**Action:** Award XP and badges for AI interactions:
- +10 XP for first AI chat
- +5 XP per assessment completed
- Badges for career exploration milestones

---

## Critical Files Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/ai/gemini-server.ts` | Server-side Gemini API integration |
| `src/app/api/ai/career-predictor/route.ts` | Career prediction API |
| `src/app/api/ai/skill-gap/route.ts` | Skill gap analysis API |
| `src/app/api/ai/study-planner/route.ts` | Study planner API |
| `src/app/api/ai/essay-reviewer/route.ts` | Essay review API |
| `src/app/api/ai/interview-coach/route.ts` | Interview practice API |
| `src/app/api/ai/rub-predictor/route.ts` | RUB admission prediction API |
| `src/app/api/ai/scholarships/route.ts` | Scholarship matching API |
| `src/app/api/ai/mood-tracker/route.ts` | Mood tracking API |
| `src/components/ai/career-predictor.tsx` | Career predictor UI |
| `src/components/ai/skill-gap-analyzer.tsx` | Skill gap UI |
| `src/components/ai/study-planner.tsx` | Study planner UI |
| `src/components/ai/essay-reviewer.tsx` | Essay reviewer UI |
| `src/components/ai/interview-coach.tsx` | Interview coach UI |
| `src/components/ai/rub-predictor.tsx` | RUB predictor UI |
| `src/components/ai/scholarship-matcher.tsx` | Scholarship matcher UI |
| `src/components/ai/mood-tracker.tsx` | Mood tracker UI |
| `drizzle/XXXX_ai_interactions.sql` | AI interactions table |
| `src/lib/db/schema.ts` | Add ai_interactions table export |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Add `<AICareerCoach />` component |
| `src/app/api/ai/career-coach/route.ts` | Fix import, ensure Gemini API is called |
| `src/app/student/dashboard/page.tsx` | Connect to `/api/ai/insights` |
| `src/app/parent/dashboard/page.tsx` | Replace local function with API call |
| `src/app/counselor/dashboard/page.tsx` | Replace mock data with real API calls |
| `src/app/school-admin/dashboard/page.tsx` | Connect to `/api/ai/insights` |
| `src/app/ministry/page.tsx` | Create dashboard API and connect AI |
| `src/app/api/ministry/dashboard/route.ts` | Create new endpoint |

---

## Reusable Components & Utilities

**Already exists - use these:**
- `AIInsightCard` - `src/components/ai/ai-insight-card.tsx`
- `AICareerCoach` - `src/components/ai/career-coach.tsx`
- System prompts - `src/lib/ai/prompts.ts` (all 10 prompts ready)
- `/api/ai/insights` - `src/app/api/ai/insights/route.ts` (unified endpoint)
- `/api/ai/career-coach` - `src/app/api/ai/career-coach/route.ts` (needs fix)
- `requireAuth()` - `src/lib/auth-utils.ts`

---

## Environment Configuration

**Required in `.env` and Vercel:**
```
GEMINI_API_KEY=your_key_here
```

**Get key from:** https://aistudio.google.com/app/apikey

**Free tier limits:**
- 1,500 requests/day
- 15 requests/minute
- Sufficient for ~100+ active students

---

## Verification & Testing

### Testing Checklist

**Phase 1 - Core Integration:**
- [ ] `GEMINI_API_KEY` is set in environment (not hardcoded)
- [ ] `/api/ai/career-coach` returns actual AI responses (not fallback)
- [ ] Import path fixed to use `@/lib/auth-utils`

**Phase 2 - AI Coach UI:**
- [ ] Floating chat button appears on all pages
- [ ] Chat sends messages to API
- [ ] Responses are personalized with user data
- [ ] Conversation history persists
- [ ] Mobile responsive

**Phase 3 - Dashboard Insights:**
- [ ] Student dashboard shows personalized career insights
- [ ] Parent dashboard shows child-specific alerts
- [ ] Counselor dashboard shows real student intervention needs
- [ ] School Admin dashboard shows actionable school insights
- [ ] Admin dashboard shows platform-level AI insights
- [ ] Ministry dashboard shows national education insights

**Phase 4 - All AI Features:**
- [ ] Career Predictor returns match probabilities
- [ ] Skill Gap Analyzer identifies missing skills
- [ ] Study Planner creates weekly schedules
- [ ] Essay Reviewer provides constructive feedback
- [ ] Interview Coach conducts mock interviews
- [ ] RUB Predictor checks admission eligibility
- [ ] Scholarship Matcher finds relevant opportunities
- [ ] Mood Tracker provides wellness support
- [ ] Class Insights help teachers

**Phase 5 - Data & Gamification:**
- [ ] AI interactions are tracked in database
- [ ] XP awarded for AI interactions
- [ ] Badges awarded for milestones
- [ ] Insights improve over time

### Manual Testing Steps

1. **Sign in as each user type** (student, teacher, parent, counselor, school-admin, admin, ministry)
2. **Verify AI insights appear** on each dashboard with relevant content
3. **Test AI Career Coach** - ask "What careers suit me?"
4. **Verify responses are personalized** (uses your name, assessments, etc.)
5. **Test each AI feature** with sample data
6. **Check browser Network tab** confirms API calls to AI endpoints
7. **Verify no cross-user data leakage**

---

## Implementation Order

**Priority 1 (Do First):**
1. Fix `/api/ai/career-coach` import issue
2. Create `src/lib/ai/gemini-server.ts` for server-side Gemini
3. Add `AICareerCoach` to root layout
4. Verify AI Career Coach actually works

**Priority 2 (Core Value):**
5. Connect all 7 dashboard insights to `/api/ai/insights`
6. Implement Career Predictor (high student value)
7. Implement RUB Admission Predictor (Bhutan-specific value)

**Priority 3 (Extended Features):**
8. Skill Gap Analyzer
9. Study Planner
10. Scholarship Matcher
11. Class Insights enhancement

**Priority 4 (Nice to Have):**
12. Essay Reviewer
13. Interview Coach
14. Mood Tracker
15. Gamification integration

---

## Security Considerations

- ✅ All AI endpoints require `requireAuth()`
- ✅ User data filtered by `schoolId` for multi-tenancy
- ✅ No cross-user data leakage
- ✅ API key stored in environment (not hardcoded)
- ⚠️ Remove any exposed API keys from documentation
- ⚠️ Add rate limiting for AI endpoints (prevent abuse)

---

## Estimated Effort

| Phase | Files | Complexity | Time |
|-------|-------|------------|------|
| Phase 1: Core Integration | 3 files | Medium | 2-3 hours |
| Phase 2: AI Coach UI | 2 files | Low | 1 hour |
| Phase 3: Dashboard Insights | 7 files | Medium | 3-4 hours |
| Phase 4: 9 AI Features | 18 files | High | 8-12 hours |
| Phase 5: Data & Gamification | 3 files | Medium | 2-3 hours |
| **Total** | **33 files** | | **16-23 hours** |
