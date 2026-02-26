# AI Strategy for Bhutan EduSkill

> **Version:** 1.0
> **Last Updated:** February 25, 2026
> **Status:** Strategic Framework

---

## Executive Summary

Bhutan EduSkill is a 7-portal school management platform serving middle schools (Class 6-12) in Bhutan. This document defines how artificial intelligence will bring the platform's mission and vision to life through intelligent, context-aware features that serve students, teachers, counselors, parents, school administrators, and ministry officials.

**Current State:** The platform has a solid AI foundation with Google Gemini API integration, 14+ AI features implemented, and a unified AI assistant framework. However, AI features need better integration, data flow optimization, and privacy safeguards.

**Vision:** AI should feel like a personalized guide for every user role - helping students discover their path, teachers improve outcomes, counselors provide early intervention, and administrators make data-driven decisions.

---

## Table of Contents

1. [Current AI Audit](#current-ai-audit)
2. [Data Pipeline Architecture](#data-pipeline-architecture)
3. [AI Use Cases by Portal](#ai-use-cases-by-portal)
4. [Implementation Approach](#implementation-approach)
5. [Data Privacy & Ethics](#data-privacy--ethics)
6. [Success Metrics](#success-metrics)
7. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Current AI Audit

### 1.1 AI Infrastructure Inventory

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Gemini API Integration** | ✅ Active | `src/lib/ai/gemini-server.ts` | Server-side, model: gemini-2.5-flash |
| **AI Prompts Library** | ✅ Complete | `src/lib/ai/prompts.ts` | 15+ system prompts for different features |
| **Interaction Tracking** | ✅ Implemented | `src/lib/ai/track-interaction.ts` | Stores in `ai_interactions` table |
| **Journal AI Helpers** | ✅ Active | `src/lib/ai/journal-helpers.ts` | Prompts, tags, feedback generation |
| **Unified AI Assistant** | ⚠️ Disabled | `src/components/ai/unified-ai-assistant.tsx` | Hooks mismatch - needs fix |
| **Platform Assistant** | ✅ Active | `src/components/ai/platform-assistant.tsx` | Multi-role chat interface |

### 1.2 AI API Endpoints

| Endpoint | Feature | Status | Notes |
|----------|---------|--------|-------|
| `/api/ai/career-coach` | Career chatbot | ✅ Active | Full Gemini integration |
| `/api/ai/insights` | Dashboard insights | ✅ Active | All 7 portal roles |
| `/api/ai/career-predictor` | Career prediction | ✅ Active | Probability analysis |
| `/api/ai/skill-gap` | Skill analysis | ✅ Active | With learning resources |
| `/api/ai/study-planner` | Study schedules | ✅ Active | Personalized plans |
| `/api/ai/essay-reviewer` | Essay feedback | ✅ Active | Writing improvement |
| `/api/ai/interview-coach` | Mock interviews | ✅ Active | Practice sessions |
| `/api/ai/rub-predictor` | RUB admission | ✅ Active | College eligibility |
| `/api/ai/scholarships` | Scholarship matching | ✅ Active | Financial aid |
| `/api/ai/mood-tracker` | Wellness insights | ✅ Active | Emotional support |
| `/api/ai/platform-assistant` | Technical help | ✅ Active | For platform admins |
| `/api/counselor/red-flags/scan` | At-risk detection | ✅ Active | AI-powered analysis |
| `/api/counselor/intervention-suggestions` | Intervention planning | ✅ Active | GNH-aligned |

### 1.3 AI Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `AICareerPredictor` | Display career predictions | ✅ Complete |
| `AISkillGapAnalyzer` | Skill gap visualization | ✅ Complete |
| `AIStudyPlanner` | Study schedule generation | ✅ Complete |
| `AIEssayReviewer` | Essay feedback UI | ✅ Complete |
| `AIInterviewCoach` | Interview practice UI | ✅ Complete |
| `AIRUBPredictor` | College admission predictor | ✅ Complete |
| `AIScholarshipMatcher` | Scholarship finder | ✅ Complete |
| `AIMoodTracker` | Wellness journal | ✅ Complete |
| `PlatformAssistant` | Multi-role chat | ✅ Complete |
| `UnifiedAIAssistant` | Global assistant | ⚠️ Disabled (hooks issue) |

### 1.4 Current Issues

1. **Unified AI Assistant Disabled** - The main AI assistant component is disabled due to React hooks issues
2. **Data Silos** - AI features don't fully leverage cross-portal data (e.g., journal data not used for career coaching)
3. **Fallback Over-reliance** - Many features use hardcoded fallbacks instead of AI
4. **No Pre-computation** - All AI is on-demand; could pre-compute insights for faster load times
5. **Limited GNH Integration** - Gross National Happiness principles not fully embedded in AI recommendations

---

## 2. Data Pipeline Architecture

### 2.1 Data Collection Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
├─────────────────────────────────────────────────────────────────────┤
│  Student Data          │  Teacher Data        │  School Data        │
│  - Assessments         │  - Class performance │  - Enrollment       │
│  - Journal entries     │  - Homework          │  - Attendance       │
│  - Career interests    │  - Lesson plans      │  - Fees             │
│  - Academic records    │  - Behavior logs     │  - Staff            │
│  - Mood/tracking       │  - Student feedback  │  - Resources        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANONYMIZATION & PRIVACY LAYER                    │
├─────────────────────────────────────────────────────────────────────┤
│  • Strip PII for AI processing (names, exact IDs)                   │
│  • Use anonymized IDs (user_hash_1234)                              │
│  • Aggregate sensitive data (e.g., age ranges not exact DOB)        │
│  • Encrypt AI interaction logs                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AI CONTEXT BUILDER                             │
├─────────────────────────────────────────────────────────────────────┤
│  Build rich context for each AI call:                               │
│  • Student profile (assessments, grades, interests)                 │
│  • Recent activity (journal moods, homework completion)             │
│  • Trends (academic progress, attendance patterns)                  │
│  • Portal role (for role-appropriate responses)                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GEMINI API CALLS                               │
├─────────────────────────────────────────────────────────────────────┤
│  • System prompts from src/lib/ai/prompts.ts                        │
│  • Context-aware queries                                            │
│  • Response parsing & structuring                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE & STORAGE                               │
├─────────────────────────────────────────────────────────────────────┤
│  • Cache responses (Redis/Vercel KV) for performance                │
│  • Store interactions in ai_interactions table                      │
│  • Trigger follow-up actions (notifications, alerts)                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data to Collect by AI Feature

| AI Feature | Primary Data | Secondary Data | Update Frequency |
|------------|--------------|----------------|------------------|
| **Career Coach** | Assessments (RIASEC, MBTI) | Journal moods, goals | On-demand |
| **Career Predictor** | All assessments, grades | Career interests, journal | On-demand |
| **Skill Gap Analyzer** | Target career, current skills | Completed subjects, grades | On-demand |
| **Study Planner** | Subjects, availability | Homework, exam dates, weak areas | Weekly |
| **Essay Reviewer** | Essay text | Writing history, grade level | On-demand |
| **Interview Coach** | Career goal | Assessment results, strengths | On-demand |
| **RUB Predictor** | Class 10/12 marks | Subject combinations | On-demand |
| **Scholarship Matcher** | Academic performance | Family income, career goals | Monthly |
| **Mood Tracker** | Daily mood, stress | Journal entries, sleep, exercise | Daily |
| **Red Flags (Counselor)** | Attendance, behavior, grades | Historical trends | Daily (batch) |
| **Class Insights (Teacher)** | Class roster, assessments | Homework, attendance | Weekly |
| **Dashboard Insights** | Portal stats | Role-specific activity | On-demand |

### 2.3 Data Anonymization Rules

```typescript
// Anonymization Pipeline Example
interface AIUserData {
  // Anonymized
  userId: string;           // Hashed: hash_abc123
  ageGroup: string;         // "13-15" instead of exact age
  gradeLevel: string;       // "Class 10" is fine
  schoolRegion: string;     // Dzongkhag, not exact school

  // Aggregated
  averageGrades: number;    // Average, not individual scores
  attendanceRate: number;   // Percentage, not raw days
  assessmentTrends: string; // "improving", "stable", "declining"

  // Excluded from AI
  fullName: never;          // NEVER send to AI
  exactAddress: never;       // NEVER send to AI
  phone: never;              // NEVER send to AI
  email: never;              // NEVER send to AI
  clerkUserId: never;        // NEVER send to AI
}
```

---

## 3. AI Use Cases by Portal

### 3.1 Student Portal (Primary Focus)

**Mission:** Empower every student to discover their path, build skills, and achieve their goals.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **Career Discovery** | Career Coach Chat | Assessments, interests, journal | Personalized career guidance |
| **Success Prediction** | Career Predictor | All assessments, grades | Career match probabilities |
| **Skill Development** | Skill Gap Analyzer | Target career, current skills | Learning roadmap |
| **Study Planning** | Study Planner | Subjects, availability, weak areas | Personalized schedule |
| **College Prep** | RUB Predictor | Class 10/12 marks | Admission chances |
| **Financial Aid** | Scholarship Matcher | Grades, family income, goals | Matched scholarships |
| **Emotional Support** | Mood Tracker | Daily moods, journal | Wellness insights |
| **Essay Writing** | Essay Reviewer | Draft essays | Writing improvement |
| **Interview Practice** | Interview Coach | Career goal, strengths | Confidence building |

**Data Flow:**
```
Student Activities → Journal → Assessments → Goals
        ↓                ↓          ↓         ↓
    AI Context Builder → Career Coach → Personalized Guidance
```

### 3.2 Teacher Portal

**Mission:** Help teachers understand their students and improve learning outcomes.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **Class Insights** | Class Analyzer | Roster assessments, grades | Teaching strategies |
| **At-Risk Detection** | Red Flags | Attendance, behavior, homework | Early intervention |
| **Lesson Planning** | Lesson Generator | Subject, topic, class level | Custom lesson plans |
| **Homework Creation** | Assignment Generator | Topic, difficulty | Personalized homework |
| **Student Support** | Individual Insights | Student data | Tailored support |

**Data Flow:**
```
Class Performance Data → AI Analysis → Actionable Insights → Teacher Actions
```

### 3.3 Counselor Portal

**Mission:** Enable early intervention and support student well-being through GNH principles.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **At-Risk Detection** | Red Flag Scanner | Attendance, behavior, grades | Priority list |
| **Intervention Planning** | Intervention AI | Student profile, GNH domains | Action plans |
| **Career Counseling** | Career Coach | Assessments, interests | Guidance sessions |
| **Wellness Monitoring** | Mood Journal Analysis | Journal moods, topics | Emotional trends |

**Special GNH Integration:**
```javascript
// GNH Domains mapped to AI recommendations
const GNH_DOMAINS = {
  psychologicalWellbeing: ["counseling", "mindfulness", "stress management"],
  timeUse: ["balance", "study-life integration", "prioritization"],
  communityVitality: ["peer support", "group activities", "belonging"],
  culturalDiversity: ["identity", "values", "traditions"],
  goodGovernance: ["fair treatment", "rights", "voice"],
  ecologicalResilience: ["nature connection", "environmental stewardship"]
};
```

### 3.4 Parent Portal

**Mission:** Keep parents informed and engaged in their child's education.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **Progress Insights** | Child Progress | Grades, homework, attendance | Actionable updates |
| **Learning Gaps** | Skill Analysis | Child's skills, requirements | Support strategies |
| **Fee Planning** | Payment Assistant | Balance, due dates | Reminders & plans |

### 3.5 School Admin Portal

**Mission:** Enable data-driven school management and resource optimization.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **Enrollment Forecasting** | Prediction AI | Historical enrollment | Staffing planning |
| **Resource Allocation** | Optimization AI | Class sizes, subjects | Timetable optimization |
| **Fee Collection** | Insights AI | Payment patterns | Collection strategies |
| **Teacher Performance** | Analytics AI | Class outcomes | Development plans |

### 3.6 Platform Admin Portal

**Mission:** Provide system-level insights and technical assistance.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **System Status** | Platform Assistant | Usage metrics, errors | Health monitoring |
| **Technical Help** | Code Assistant | Documentation, codebase | Quick answers |
| **Feature Usage** | Analytics AI | Interaction logs | Product insights |
| **School Support** | Flagging AI | School metrics | Proactive support |

### 3.7 Ministry Portal

**Mission:** Enable national-level education monitoring and policy decisions.

| Use Case | AI Feature | Data Needed | Outcome |
|----------|------------|-------------|---------|
| **National Analytics** | Trends AI | Aggregated school data | Policy insights |
| **School Monitoring** | Performance AI | School rankings | Intervention targets |
| **Career Trends** | Analysis AI | Student interests | Curriculum alignment |
| **Compliance** | Monitoring AI | Required submissions | Compliance status |

---

## 4. Implementation Approach

### 4.1 AI Invocation Strategy

| Strategy | When to Use | Examples |
|----------|-------------|----------|
| **On-Demand** | User requests specific feature | Career coach chat, skill gap analysis |
| **Pre-computed** | Heavy computation, frequent access | Dashboard insights, red flag scans |
| **Real-time** | Immediate feedback needed | Essay review, interview coach |
| **Batch** | Periodic processing, low urgency | Daily mood analysis, scholarship matching |

### 4.2 Caching Strategy

```typescript
// Cache Configuration
const AI_CACHE_CONFIG = {
  // Fast responses (1 hour)
  careerPredictor: { ttl: 3600 },  // Re-assess rarely needed
  rubPredictor: { ttl: 3600 },      // Marks don't change daily

  // Medium responses (15 minutes)
  dashboardInsights: { ttl: 900 },  // Update occasionally
  classInsights: { ttl: 900 },      // Teacher dashboard

  // Slow responses (5 minutes)
  careerCoach: { ttl: 300 },        // Conversational, more dynamic
  skillGap: { ttl: 300 },           // User-specific

  // No cache (real-time only)
  essayReviewer: { ttl: 0 },        // Each essay unique
  interviewCoach: { ttl: 0 },       // Interactive session
};
```

### 4.3 Fallback Strategy

All AI features should have intelligent fallbacks:

```typescript
// Fallback Hierarchy
1. Gemini API (primary)
2. Cached previous response (if recent)
3. Rule-based logic (deterministic)
4. Static default response (worst case)
```

### 4.4 Error Handling

```typescript
// AI Error Categories
const AI_ERRORS = {
  API_KEY_MISSING: "fallback",
  RATE_LIMITED: "retry_with_backoff",
  TIMEOUT: "use_cache_or_fallback",
  INVALID_RESPONSE: "fallback_with_log",
  CONTEXT_MISSING: "request_more_data"
};
```

---

## 5. Data Privacy & Ethics

### 5.1 Privacy Principles

1. **Minimize Data Exposure**
   - Only send necessary data to AI
   - Anonymize before external API calls
   - Never send PII (names, emails, IDs)

2. **Student Data Protection**
   - Minors require special handling
   - Parental consent for AI features
   - Age-appropriate responses only

3. **Transparency**
   - Always indicate when AI is used
   - Show "AI-generated" badges
   - Explain data usage in accessible language

4. **Data Retention**
   - AI interactions: 90 days default
   - Journal analysis: 1 year (for trends)
   - Red flag data: Until resolved + 1 year

### 5.2 Ethical Guidelines

1. **No Bias Amplification**
   - Monitor for gender/role stereotypes
   - Ensure equal career opportunity presentation
   - Test for cultural bias in Bhutan context

2. **No Manipulation**
   - Don't use persuasive AI for commercial gain
   - Present options neutrally
   - Respect student agency

3. **Well-being First**
   - Mood tracker detects distress → Recommend human counselor
   - AI never replaces professional help
   - Clear disclaimers about AI limitations

### 5.3 Compliance Checklist

- [ ] Parental consent flow for AI features
- [ ] Data retention policy implemented
- [ ] "AI-generated" badges on all AI content
- [ ] Easy opt-out mechanism for AI
- [ ] Age-appropriate content filters
- [ ] No PII in external API calls
- [ ] Encryption for AI logs
- [ ] Privacy policy updated for AI

---

## 6. Success Metrics

### 6.1 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AI Feature Adoption** | 70% of students | Active users / total users |
| **Career Coach Usage** | 3+ chats/student | Average interactions |
| **Assessment Completion** | 80% after AI prompt | Conversion rate |
| **Journal Retention** | 50% weekly active | DAU/WAU |
| **Dashboard Views** | Daily for 60% of users | Page views per user |

### 6.2 Outcome Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Career Clarity** | +40% self-reported | Pre/post surveys |
| **Skill Development** | +30% skills gained | Pre/post assessments |
| **Study Efficiency** | +25% grades (for users) | Academic performance |
| **Early Intervention** | 80% of flagged students improve | Red flag outcomes |
| **Parent Engagement** | +50% portal logins | Active parents |

### 6.3 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **AI Response Time** | <3 seconds P95 | API latency |
| **Cache Hit Rate** | >60% | Redis/Vercel KV stats |
| **Fallback Rate** | <10% | Error tracking |
| **Cost per User** | <$0.10/month | Gemini API spend |

### 6.4 Qualitative Metrics

- Student satisfaction with AI guidance
- Teacher perceived value of class insights
- Counselor effectiveness with AI support
- Parent trust in AI recommendations

---

## 7. Implementation Roadmap

### Phase 1: Foundation Strengthening (Weeks 1-2)

**Goal:** Ensure AI infrastructure is solid and reliable.

| Task | Owner | Priority |
|------|-------|----------|
| Fix UnifiedAIAssistant hooks issue | Frontend | P0 |
| Add error boundary to all AI components | Frontend | P0 |
| Implement caching layer (Vercel KV) | Backend | P1 |
| Add comprehensive error logging | Backend | P1 |
| Create AI monitoring dashboard | Admin | P2 |

**Deliverables:**
- Working unified AI assistant
- Cached AI responses
- Error tracking dashboard

### Phase 2: Data Integration (Weeks 3-4)

**Goal:** Connect data silos for richer AI context.

| Task | Owner | Priority |
|------|-------|----------|
| Connect journal data to career coach | Backend | P0 |
| Aggregate class data for teacher insights | Backend | P1 |
| Build student profile API for AI context | Backend | P1 |
| Implement data anonymization pipeline | Backend | P0 |
| Add consent flow for parents | Frontend | P2 |

**Deliverables:**
- Journal-aware career coaching
- Rich AI context for all features
- Privacy-compliant data flow

### Phase 3: Feature Enhancement (Weeks 5-6)

**Goal:** Make existing AI features smarter with more data.

| Task | Owner | Priority |
|------|-------|----------|
| Enhance dashboard insights with full context | Backend | P1 |
| Add GNH principles to counselor AI | Backend | P1 |
| Improve RUB predictor with real admission data | Backend | P2 |
| Add Bhutan-specific scholarships to matcher | Backend | P2 |
| Create pre-computed insights cron job | Backend | P1 |

**Deliverables:**
- Smarter dashboard insights
- GNH-aligned recommendations
- Pre-computed daily insights

### Phase 4: New Features (Weeks 7-8)

**Goal:** Add high-impact new AI capabilities.

| Task | Owner | Priority |
|------|-------|----------|
| AI homework generator for teachers | Backend | P1 |
| AI lesson plan creator | Backend | P2 |
| AI report card comment writer | Backend | P2 |
| AI fee payment planner for parents | Backend | P2 |
| AI career path visualizer | Frontend | P1 |

**Deliverables:**
- 5 new AI features launched
- Teacher time saved on admin tasks

### Phase 5: Optimization & Analytics (Weeks 9-10)

**Goal:** Measure, optimize, and improve.

| Task | Owner | Priority |
|------|-------|----------|
| Implement all success metrics tracking | Backend | P1 |
| A/B test AI prompt variations | Backend | P2 |
| Optimize prompt engineering | Backend | P1 |
| Create AI usage analytics dashboard | Admin | P1 |
| User feedback collection | Frontend | P1 |

**Deliverables:**
- Metrics dashboard
- Optimized prompts
- User feedback loop

---

## 8. AI Opportunities Identified

### 8.1 High Impact (Implement First)

1. **Journal-Integrated Career Coaching**
   - Connect mood journal to career guidance
   - "You mentioned feeling stressed about math - here are careers that use less math"
   - Data: Journal entries + career assessments

2. **Pre-computed Dashboard Insights**
   - Generate insights nightly via cron job
   - Instant dashboard load with fresh insights
   - Data: All user data aggregated

3. **Teacher Homework Assistant**
   - AI generates homework based on curriculum
   - Auto-creates for different difficulty levels
   - Data: Subject, topic, class level

4. **Red Flag Early Warning System**
   - Scan all students daily for risk patterns
   - Notify counselors before problems escalate
   - Data: Attendance, behavior, grades

### 8.2 Medium Impact

1. **RUB College Path Navigator**
   - Step-by-step guide to each RUB college
   - Prerequisite tracking and progress
   - Data: Student grades, RUB requirements

2. **Parent Progress Digest**
   - Weekly AI summary of child's progress
   - Actionable suggestions for support
   - Data: Child's academic, behavioral data

3. **Study Group Matcher**
   - AI matches students with complementary skills
   - Facilitates peer learning
   - Data: Assessments, skills, location

### 8.3 Strategic Impact

1. **National Education Trends**
   - Ministry dashboard with AI insights
   - Policy recommendations based on data
   - Data: Anonymized national data

2. **Career Path Evolution Tracking**
   - How student interests change over time
   - Early identification of emerging trends
   - Data: Historical assessments, interests

3. **AI-Powered Curriculum Alignment**
   - Match teaching to student interests
   - Suggest curriculum updates based on trends
   - Data: Career interests, job market

---

## 9. Conclusion

Bhutan EduSkill has a strong AI foundation. The strategy going forward is:

1. **Fix foundational issues** (unified assistant, caching)
2. **Connect data silos** for richer AI context
3. **Enhance existing features** with better data
4. **Add high-impact new features** (homework generator, red flags)
5. **Measure and optimize** based on real usage

The key differentiator will be **GNH-aligned AI** - artificial intelligence that respects Bhutanese values, promotes well-being, and helps every student discover their unique path to success.

---

## Appendices

### A. File Structure Reference

```
src/
├── lib/
│   └── ai/
│       ├── gemini.ts              # Client-side (fallback only)
│       ├── gemini-server.ts       # Server-side Gemini API
│       ├── prompts.ts             # 15+ system prompts
│       ├── journal-helpers.ts     # Journal AI functions
│       └── track-interaction.ts   # Usage tracking
├── components/
│   └── ai/
│       ├── unified-ai-assistant.tsx    # Global assistant (disabled)
│       ├── platform-assistant.tsx      # Multi-role chat
│       ├── career-predictor.tsx        # Career prediction UI
│       ├── skill-gap-analyzer.tsx      # Skill analysis UI
│       ├── study-planner.tsx           # Study schedule UI
│       ├── essay-reviewer.tsx          # Writing feedback UI
│       ├── interview-coach.tsx         # Interview practice UI
│       ├── rub-predictor.tsx           # College admission UI
│       ├── scholarship-matcher.tsx     # Scholarship finder UI
│       ├── mood-tracker.tsx            # Wellness journal UI
│       └── ai-insights-section.tsx     # Dashboard insights
└── app/
    └── api/
        └── ai/
            ├── career-coach/route.ts       # Career chat API
            ├── insights/route.ts            # Dashboard insights API
            ├── career-predictor/route.ts    # Career prediction API
            ├── skill-gap/route.ts           # Skill analysis API
            ├── study-planner/route.ts       # Study planning API
            ├── essay-reviewer/route.ts      # Essay feedback API
            ├── interview-coach/route.ts     # Interview practice API
            ├── rub-predictor/route.ts       # RUB admission API
            ├── scholarships/route.ts        # Scholarship API
            ├── mood-tracker/route.ts        # Wellness API
            └── platform-assistant/route.ts  # Technical help API
```

### B. Database Schema for AI

```sql
-- AI Interactions Table
CREATE TABLE ai_interactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  feature_id TEXT NOT NULL,
  interaction_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example interaction_data structure
{
  "message": "What careers suit me?",
  "responseLength": 450,
  "hasSuggestions": true,
  "interests": ["technology", "design"],
  "concerns": ["math difficulty"],
  "mentionedCareers": ["software engineer"],
  "conversationTurn": 3
}
```

### C. Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for caching)
REDIS_URL=your_redis_url
VERCEL_KV_URL=your_vercel_kv_url

# Optional (for monitoring)
AI_LOG_LEVEL=info  # debug, info, warn, error
AI_FALLBACK_ENABLED=true
```

---

**Document Owner:** AI Strategy Team
**Review Cycle:** Quarterly
**Next Review:** May 2026
