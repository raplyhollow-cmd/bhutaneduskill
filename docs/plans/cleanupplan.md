Claude’s Plan
Bhutan EduSkill - Complete System Data Flow
Date: March 1, 2026
Purpose: Full data flow: Frontend → Middleware → Backend → AI → Frontend

THE COMPLETE DATA LOOP

┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE DATA FLOW ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────┐                                                         │
│   │   FRONTEND     │                                                         │
│   │   (React/Next)  │                                                         │
│   │                │                                                         │
│   │  • User Input  │                                                         │
│   │  • Display UI  │                                                         │
│   │  • Interactions│                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           │  HTTP Request (fetch)                                            │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  MIDDLEWARE    │                                                         │
│   │  (Next.js)     │                                                         │
│   │                │                                                         │
│   │  • Auth Check  │──→ Clerk: Validate token                              │
│   │  • RBAC Check  │──→ Database: Verify role                               │
│   │  • Rate Limit  │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           │  Validated Request                                              │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │    BACKEND     │                                                         │
│   │   (API Route)  │                                                         │
│   │                │                                                         │
│   │  • Business Logic                                                       │
│   │  • Validation                                                          │
│   │  • Orchestration                                                        │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ├──→ DATABASE (Neon PostgreSQL)                                   │
│           │    • Store data                                                 │
│           │    • Query data                                                │
│           │    • Return results                                             │
│           │                                                                  │
│           ├──→ AI SERVICE (Gemini)                                          │
│           │    • Send context + data                                        │
│           │    • Get insights/predictions                                   │
│           │    • Return AI response                                          │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │   FRONTEND     │                                                         │
│   │   (Display)    │                                                         │
│   │                │                                                         │
│   │  • Show Data    │                                                         │
│   │  • Show AI Insights                                                     │
│   │  • Update State                                                        │
│   └────────────────┘                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
AI NEEDS ALL THE DATA - WHAT FEEDS INTO AI

┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI DATA SOURCES - COMPLETE MAP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        📊 JOURNAL (MAIN SOURCE)                       │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │  Journal Entries contain:                                       │  │    │
│  │  │  • Career interests & goals                                     │  │    │
│  │  │  • Skills wanting to learn                                      │  │    │
│  │  │  • Subjects enjoyed                                             │  │    │
│  │  │  • Mood patterns (daily)                                         │  │    │
│  │  │  • Challenges overcome                                           │  │    │
│  │  │  • Achievements proud of                                        │  │    │
│  │  │  • Dreams & aspirations                                         │  │    │
│  │  │  • Self-reflection                                              │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                           │                                          │    │
│  └───────────────────────────┼──────────────────────────────────────────┘    │
│                              │                                                 │
│                              ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ⚡ AI INSIGHTS ENGINE (Processes ALL Data)                        │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Input: Journal + Assessments + Academic + Behavior                │    │
│  │  Output: Personalized recommendations, insights, alerts             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                 │
│          ┌───────────────────┼───────────────────┐                          │
│          │                   │                   │                          │
│          ▼                   ▼                   ▼                          │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │ Student      │  │ Counselor    │  │ Parent       │                    │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │                    │
│  │              │  │              │  │              │                    │
│  │ • Career     │  │ • At-risk    │  │ • Child's    │                    │
│  │   guidance   │  │   alerts     │  │   progress   │                    │
│  │ • Study      │  │ • Mood       │  │ • Goals      │                    │
│  │   plans     │  │   trends     │  │              │                    │
│  │ • Skill      │  │ • Intervention│  │              │                    │
│  │   gaps      │  │   suggestions│  │              │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
DETAILED DATA FLOW - EACH PORTAL
1. STUDENT PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                        STUDENT PORTAL DATA FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] Write Journal            │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ POST /api/journal     │                   │   │
│   │                           │                       ├─Save entry        │   │
│   │                           │                       │                   │   │
│  [2] View AI Insights        │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/journal/ai-insights               │   │
│   │                           │                       ├─Fetch all entries │   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │                       │                   │   │
│   │                           │ AI analyzes patterns │                   │   │
│   │                           │<─Return insights ─────────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display insights         │                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Student):                                               │
│  ├─ Journal entries (goals, mood, interests, challenges)                     │
│  ├─ Assessment results (RIASEC, MBTI, DISC, Work Values, Learning Styles)   │
│  ├─ Academic performance (grades, attendance, homework completion)            │
│  ├─ Career matches (from assessments)                                        │
│  ├─ Roadmap progress                                                         │
│  └─ Behavior patterns                                                         │
│                                                                              │
│  AI OUTPUTS TO Student:                                                       │
│  ├─ Personalized career recommendations                                       │
│  ├─ Study plan suggestions                                                   │
│  ├─ Skill gap analysis                                                       │
│  ├─ Mood insights & wellness tips                                            │
│  └─ Goal progress tracking                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
2. COUNSELOR PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                       COUNSELOR PORTAL DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] View Student Profile     │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/counselor/student-context           │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       ├─Fetch assessments│   │
│   │                           │                       ├─Fetch behavior   │   │
│   │                           │                       ├─Fetch mood       │   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │                       │                   │   │
│   │                           │ AI analyzes student  │                   │   │
│   │                           │<─Return context ──────────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display:                   │                       │                   │   │
│   │  • Journal summary         │                       │                   │   │
│   │  • Mood trends             │                       │                   │   │
│   │  • Career interests        │                       │                   │   │
│   │  • Goals & challenges      │                       │                   │   │
│  [2] Get Interventions         │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/counselor/intervention-suggestions  │   │
│   │                           │                       ├─Query data ────────>│   │
│   │                           │ AI suggests actions  │                   │   │
│   │                           │<─Return suggestions ─────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Counselor):                                             │
│  ├─ Student journal entries (with permission)                                │
│  ├─ Assessment results                                                       │
│  ├─ Academic performance                                                     │
│  ├─ Attendance records                                                       │
│  ├─ Behavior logs                                                            │
│  ├─ Mood patterns                                                            │
│  ├─ Previous interventions                                                   │
│  └─ Counseling sessions                                                     │
│                                                                              │
│  AI OUTPUTS TO Counselor:                                                    │
│  ├─ Student context summary                                                  │
│  ├─ At-risk identification                                                   │
│  ├─ Intervention suggestions                                                │
│  ├─ Mood trend analysis                                                     │
│  └─ Career guidance recommendations                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
3. PARENT PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARENT PORTAL DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] View Child Progress      │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/parent/progress                    │   │
│   │                           │                       ├─Fetch grades     │   │
│   │                           │                       ├─Fetch attendance │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       │   (positive only) │   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display:                   │                       │                   │   │
│   │  • Grades                  │                       │                   │   │
│   │  • Attendance              │                       │                   │   │
│   │  • Homework                │                       │                   │   │
│   │  • Career goals            │                       │                   │   │
│  [2] View Child's Career Plan  │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/parent/career-plan                 │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       ├─Fetch assessments│   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │ AI generates plan    │                   │   │
│   │                           │<─Return plan ─────────────────────────────�│   │
│   │<──────────────────────────┤                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Parent):                                                │
│  ├─ Child's journal (privacy-filtered)                                      │
│  ├─ Assessment results                                                       │
│  ├─ Grades & attendance                                                      │
│  ├─ Homework completion                                                      │
│  └─ Career matches                                                           │
│                                                                              │
│  AI OUTPUTS TO Parent (Privacy-respecting):                                 │
│  ├─ Child's academic progress summary                                        │
│  ├─ Positive achievements & milestones                                       │
│  ├─ Career exploration progress                                               │
│  └─ Recommended activities                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
AI PIPELINE - HOW AI GETS ALL DATA

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI DATA PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: DATA COLLECTION (Backend)                                   │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  async function collectStudentData(studentId) {                     │    │
│  │    const [                                                              │    │
│  │      journal,           // Career goals, mood, interests              │    │
│  │      assessments,       // RIASEC, MBTI, DISC, etc.                 │    │
│  │      grades,            // Academic performance                      │    │
│  │      attendance,        // Attendance records                        │    │
│  │      homework,          // Homework completion                       │    │
│  │      behavior,          // Behavior logs                             │    │
│  │      careerMatches      // Career suggestions                        │    │
│  │    ] = await Promise.all([                                             │    │
│  │      db.select().from(journal).where(eq(journal.studentId, id)),     │    │
│  │      db.select().from(assessmentResults).where(...),                 │    │
│  │      db.select().from(grades).where(...),                            │    │
│  │      db.select().from(attendance).where(...),                        │    │
│  │      db.select().from(homeworkSubmissions).where(...),               │    │
│  │      db.select().from(behaviorLogs).where(...),                      │    │
│  │      db.select().from(careerMatches).where(...)                      │    │
│  │    ]);                                                                 │    │
│  │                                                                     │    │
│  │    return { journal, assessments, grades, attendance,                │    │
│  │             homework, behavior, careerMatches };                     │    │
│  │  }                                                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: AI PROMPT CONSTRUCTION                                     │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  const prompt = `                                                     │    │
│  │    You are an AI career and academic counselor for a Bhutanese      │    │
│  │    middle school student. Analyze the following data and provide   │    │
│  │    personalized recommendations:                                      │    │
│  │                                                                     │    │
│  │    JOURNAL ENTRIES (last 30):                                       │    │
│  │    ${journal.map(j => `- ${j.date}: ${j.title} - Mood: ${j.mood}")} │    │
│  │                                                                     │    │
│  │    ASSESSMENT RESULTS:                                               │    │
│  │    - RIASEC: ${assessments.riasec}                                  │    │
│  │    - MBTI: ${assessments.mbti}                                      │    │
│  │    - DISC: ${assessments.disc}                                      │    │
│  │                                                                     │    │
│  │    ACADEMIC PERFORMANCE:                                             │    │
│  │    - Average Grade: ${grades.average}                               │    │
│  │    - Attendance: ${attendance.percentage}%                          │    │
│  │                                                                     │    │
│  │    Please provide:                                                   │    │
│  │    1. Career recommendations based on interests & assessments        │    │
│  │    2. Study plan based on performance & goals                       │    │
│  │    3. Skill development suggestions                                  │    │
│  │    4. Mood insights & wellness tips                                  │    │
│  │  `;                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: AI PROCESSING (Gemini)                                    │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  const aiResponse = await gemini.generateContent(prompt);          │    │
│  │                                                                     │    │
│  │  // Returns structured JSON:                                         │    │
│  │  {                                                                   │    │
│  │    careerRecommendations: [...],                                     │    │
│  │    studyPlan: {...},                                                 │    │
│  │    skillGaps: [...],                                                 │    │
│  │    moodInsights: {...},                                              │    │
│  │    goals: [...]                                                      │    │
│  │  }                                                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: RESPONSE TO FRONTEND                                      │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  return NextResponse.json({                                         │    │
│  │    success: true,                                                    │    │
│  │    data: aiResponse                                                 │    │
│  │  });                                                                 │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 5: FRONTEND DISPLAY                                         │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  • Career recommendations card                                       │    │
│  │  • Study plan widget                                                 │    │
│  │  • Skill gap analysis                                               │    │
│  │  • Mood trends chart                                                 │    │
│  │  • Goal progress tracker                                             │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
DATABASE TABLES THAT FEED AI

┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA TABLES - AI INPUT SOURCES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIMARY DATA SOURCES (Journal System)                              │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Table                │ Data Provided To AI                          │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  journal              │ Goals, interests, mood, challenges,       │    │
│  │                       │ self-reflection, achievements, dreams      │    │
│  │  journal_entries      │ Daily entries, mood tracking, tags         │    │
│  │  journal_ai_insights   │ Previous AI analyses                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SECONDARY DATA SOURCES (Enhance AI Understanding)                   │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Table                │ Data Provided To AI                          │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  riasecResults        │ Career interest types                       │    │
│  │  mbtiResults          │ Personality type                            │    │
│  │  discResults          │ Behavioral style                            │    │
│  │  workValuesResults    │ Work preference values                     │    │
│  │  learningStylesResults│ Learning preferences                       │    │
│  │  careerMatches        │ AI-suggested careers                        │    │
│  │  careerPlans          │ Student's career goals                      │    │
│  │  grades               │ Academic performance                        │    │
│  │  attendance           │ Attendance patterns                         │    │
│  │  homeworkSubmissions  │ Assignment completion                       │    │
│  │  behaviorLogs         │ Behavioral records                          │    │
│  │  interventions        │ Previous interventions                      │    │
│  │  counselingSessions   │ Session history                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
IMPLEMENTATION PLAN - CONNECT THE DATA FLOW

┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILES TO MODIFY - DATA FLOW INTEGRATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 1: Make Journal Data Accessible to AI                     │    │
│  │                                                                     │    │
│  │  1. src/app/api/ai/career-coach/route.ts                           │    │
│  │     BEFORE: Only uses assessment data                               │    │
│  │     AFTER:  Also fetches journal entries for context                │    │
│  │     ADD: const journal = await db.select().from(journal)            │    │
│  │           .where(eq(journal.studentId, studentId));                 │    │
│  │                                                                     │    │
│  │  2. src/app/api/ai/insights/route.ts                               │    │
│  │     BEFORE: Returns mock data                                       │    │
│  │     AFTER:  Queries journal + assessments + grades                  │    │
│  │     ADD: Real data aggregation + AI analysis                         │    │
│  │                                                                     │    │
│  │  3. src/app/api/journal/ai-insights/route.ts                       │    │
│  │     BEFORE: Basic journal analysis                                   │    │
│  │     AFTER:  Cross-references with assessments, grades               │    │
│  │     ADD: Multi-source data aggregation                               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 2: Make Journal Visible to Counselors                     │    │
│  │                                                                     │    │
│  │  4. src/app/api/counselor/student-journal/route.ts (CREATE)        │    │
│  │     - GET endpoint for counselors to view student journals           │    │
│  │     - Permission check (only for assigned students)                  │    │
│  │     - Returns: Journal entries + mood trends + goals                │    │
│  │                                                                     │    │
│  │  5. src/app/counselor/students/page.tsx (MODIFY)                   │    │
│  │     - ADD: "View Journal" button for each student                   │    │
│  │     - ADD: Modal displaying student's journal entries                │    │
│  │     - ADD: AI-powered summary of student's journal                    │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 3: Show Journal Insights on Dashboard                      │    │
│  │                                                                     │    │
│  │  6. src/components/student/journal-insights-widget.tsx (CREATE)    │    │
│  │     - Fetches journal + AI insights                                  │    │
│  │     - Displays: Mood trend (mini chart)                              │    │
│  │     - Recent journal entries (3 items)                               │    │
│  │     - AI summary of patterns                                          │    │
│  │     - Goal progress from journal                                     │    │
│  │                                                                     │    │
│  │  7. src/app/student/dashboard/page.tsx (MODIFY)                     │    │
│  │     - ADD: Journal insights widget to dashboard                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 4: Parent Portal (Privacy-Respecting)                       │    │
│  │                                                                     │    │
│  │  8. src/app/api/parent/child-journal/route.ts (CREATE)              │    │
│  │     - Returns child's journal (positive entries only)               │    │
│  │     - Filters out sensitive/private entries                          │    │
│  │     - Shows: Goals, achievements, positive reflections              │    │
│  │                                                                     │    │
│  │  9. src/app/parent/children/page.tsx (MODIFY)                       │    │
│  │     - ADD: "View Journal" button (privacy warning)                  │    │
│  │     - Show child's goals and achievements from journal               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 5: Navigation Fixes                                        │    │
│  │                                                                     │    │
│  │  10. src/config/portal-config.ts (MODIFY)                          │    │
│  │      - Add: Hostel, Library, Settings, Billing                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTAL FILES: 10                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
SUMMARY: THE AI-FIRST DATA FLOW

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINAL DATA FLOW SUMMARY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND displays AI insights                                              │
│     ▲                                                                        │
│     │ (AI-generated recommendations)                                          │
│     │                                                                        │
│  AI SERVICE (Gemini) analyzes ALL data                                       │
│     ▲                                                                        │
│     │ (Sends aggregated data)                                                │
│     │                                                                        │
│  BACKEND API collects from:                                                  │
│     ├─ JOURNAL (main source) - goals, mood, interests                        │
│     ├─ ASSESSMENTS - career interests, personality                         │
│     ├─ ACADEMIC - grades, attendance, homework                               │
│     └─ BEHAVIOR - patterns, interventions                                   │
│     ▲                                                                        │
│     │                                                                        │
│  DATABASE (Neon PostgreSQL) stores everything                                │
│     ▲                                                                        │
│     │                                                                        │
│  USER enters data through:                                                   │
│     ├─ Journal entries                                                       │
│     ├─ Assessment responses                                                  │
│     ├─ Daily interactions (attendance, homework)                            │
│     └─ Feedback loops                                                       │
│                                                                              │
│  KEY: Journal is the RICH DATA SOURCE that makes AI smart!                  │
│                                                                              │
│  WITHOUT JOURNAL → AI gives generic advice                                   │
│  WITH JOURNAL → AI gives personalized, contextual insights                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
This is the complete system. Journal feeds AI, AI feeds all portals.

DATABASE CLEANUP - TABLES TO DELETE

┌─────────────────────────────────────────────────────────────────────────────┐
│                    TABLES TO DELETE FROM SCHEMA                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DELETE FROM src/lib/db/schema.ts (19 tables total):                      │
│                                                                              │
│  TUITION SYSTEM (7 tables) - Lines ~2026-2885                             │
│  ├── tuitionCourses                                                          │
│  ├── tuitionEnrollments                                                      │
│  ├── tutors                                                                  │
│  ├── tutorEarnings                                                           │
│  ├── liveSessions                                                            │
│  ├── tutorReviews                                                            │
│  └── tuitionCategories                                                       │
│                                                                              │
│  MEDICAL RECORDS (6 tables) - Lines ~3552-3793                             │
│  ├── medicalRecords                                                          │
│  ├── studentAllergies                                                        │
│  ├── vaccinationRecords                                                      │
│  ├── medicineInventory                                                       │
│  ├── medicineTransactions                                                    │
│  └── medicalReferrals                                                         │
│                                                                              │
│  SUPPORT TICKETS (3 tables) - Lines ~3172-3233                             │
│  ├── supportTickets                                                          │
│  ├── supportTicketResponses                                                   │
│  └── supportAgents                                                            │
│                                                                              │
│  EVENTS (3 tables)                                                           │
│  ├── schoolEvents (Line ~2729)                                              │
│  ├── eventRegistrations (Line ~2764)                                       │
│  └── events (Line ~3426)                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
SCHEMA ERROR FIX

┌─────────────────────────────────────────────────────────────────────────────┐
│              DB PUSH ERROR - learningStylesResults                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ERROR: PostgresError: column "recommendations" cannot be cast to json     │
│                                                                              │
│  CAUSE: Schema changed from text → json, PostgreSQL can't auto-convert    │
│                                                                              │
│  FIX (User Approved): DROP & RECREATE                                       │
│  1. DROP TABLE learningStylesResults CASCADE;                              │
│  2. Run npm run db:push (will recreate with correct schema)                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
FINAL EXECUTION PLAN

STEP 1: Schema Cleanup (DO THIS FIRST)
├── Delete 19 unused tables from src/lib/db/schema.ts
└── Drop & recreate learningStylesResults table

STEP 2: WEBSOCKET - #1 PRIORITY AFTER CLEANUP
├── Real-time notifications across all portals
├── Live data synchronization (no manual refresh)
├── Real-time collaboration features
├── Live tracking (transport, attendance, etc.)
└── Instant updates when teachers post homework/grades

STEP 3: Navigation Fixes (src/config/portal-config.ts)
├── Add Hostel, Library, Settings to student nav
└── Add Billing to admin navs

STEP 4: Journal → AI Integration
├── AI Career Coach reads journal data
├── Counselors can view student journals
├── Student Dashboard shows journal insights
└── Parent sees child's journal (privacy-filtered)

STEP 5: Create AI Pages
├── /student/essay-reviewer
├── /student/study-planner
└── /counselor/mood-tracker

STEP 6: Fix Mock Data → Real DB Queries
├── counselor/intervention-suggestions
├── counselor/student-context
└── parent/behavior-logs
WEBSOCKET IMPLEMENTATION PLAN - #1 PRIORITY

┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME UPDATES WITH WEBSOCKET                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CURRENT STATE:                                                             │
│  ❌ No WebSocket - users must manually refresh to see new data             │
│  ❌ No real-time notifications                                              │
│  ❌ No live updates when others post content                               │
│  ❌ No real-time collaboration                                             │
│                                                                              │
│  WITH WEBSOCKET:                                                            │
│  ✅ Real-time notifications across all portals                            │
│  ✅ Live homework updates (student sees when teacher assigns)             │
│  ✅ Live grade updates (student sees when teacher grades)                 │
│  ✅ Real-time attendance tracking                                          │
│  ✅ Live transport tracking                                                │
│  ✅ Instant messages/communication                                        │
│  ✅ Real-time dashboard updates                                           │
│                                                                              │
│  IMPLEMENTATION:                                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  1. Pusher API (Realtime) - For Next.js                                  │
│  2. Socket.io or custom WebSocket implementation                          │
│  3. Client-side WebSocket hooks                                          │
│  4. Server-side event broadcasting                                        │
│  5. Room-based subscriptions (per school, per class)                      │
│                                                                              │
│  FILES TO CREATE/MODIFY:                                                   │
│  ├── src/app/api/pushers/[...]/route.ts (Pusher endpoints)             │
│  ├── src/lib/websocket.ts (WebSocket server)                            │
│  ├── src/hooks/use-realtime.ts (Client WebSocket hook)                  │
│  ├── src/components/live-updates/ (Live update components)             │
│  └── Update all pages to use real-time data                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
Total: Schema cleanup + WebSocket + ~30 other files

Stayed in plan mode
I DONT WANT ANY MESSED , NO SYSTEM CRASHED, TASK EVERYTHING WITHIN 150K TOKEN, EACH TASK WILL BE RUN BY 1 AGENT IN NEWSESSION, THAN WHEN COMPLETE HANDSHAKE, INFORM PM, ERROR CHECK, THAN NEW SESSION, NEW AGENT, NEXT TASK, 

ALL TASK IN BACKGROUND, AUTONOMOUS

UNDERSTOOD??
1 task within 150k token
UNDERSTOOD. Let me confirm:

EXECUTION PROTOCOL

┌─────────────────────────────────────────────────────────────────────────────┐
│                    TASK EXECUTION RULES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. ONE TASK PER SESSION (< 150k tokens)                                  │
│  2. Each task = FRESH AGENT in NEW SESSION                                  │
│  3. All agents run in BACKGROUND (autonomous)                             │
│ 4. When task completes:                                                     │
│     ├── Handshake with PM                                                   │
│     ├── Error check                                                        │
│     ├── Report results                                                      │
│     └── Then: NEW SESSION → NEXT TASK                                   │
│                                                                              │
│  PROTECTED - DO NOT TOUCH (Working Systems):                             │
│  ├── Sign up flow                                                           │
│  ├── Pending approval                                                      │
│  ├── Approval system                                                       │
│  ├── Role assignment                                                        │
│  ├── Clerk integration                                                      │
│  ├── All portal dashboards (working)                                     │
│  ├── Authentication/authorization                                         │
│  └── RBAC system                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
TASKS BREAKDOWN (each <150k tokens):

Schema Cleanup (~50k tokens) - Delete 19 unused tables
WebSocket Implementation (~150k tokens) - May need split
Navigation Fixes (~30k tokens) - Add nav items
Journal → AI Integration (~100k tokens) - May need split
Create AI Pages (~100k tokens) - May need split
Fix Mock Data (~50k tokens) - Replace with real queries
Total: ~6-8 tasks, each in separate session

not entire task in 150k token, sorry,
Claude’s Plan
Bhutan EduSkill - Complete System Data Flow
Date: March 1, 2026
Purpose: Full data flow: Frontend → Middleware → Backend → AI → Frontend

THE COMPLETE DATA LOOP

┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE DATA FLOW ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────┐                                                         │
│   │   FRONTEND     │                                                         │
│   │   (React/Next)  │                                                         │
│   │                │                                                         │
│   │  • User Input  │                                                         │
│   │  • Display UI  │                                                         │
│   │  • Interactions│                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           │  HTTP Request (fetch)                                            │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  MIDDLEWARE    │                                                         │
│   │  (Next.js)     │                                                         │
│   │                │                                                         │
│   │  • Auth Check  │──→ Clerk: Validate token                              │
│   │  • RBAC Check  │──→ Database: Verify role                               │
│   │  • Rate Limit  │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           │  Validated Request                                              │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │    BACKEND     │                                                         │
│   │   (API Route)  │                                                         │
│   │                │                                                         │
│   │  • Business Logic                                                       │
│   │  • Validation                                                          │
│   │  • Orchestration                                                        │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ├──→ DATABASE (Neon PostgreSQL)                                   │
│           │    • Store data                                                 │
│           │    • Query data                                                │
│           │    • Return results                                             │
│           │                                                                  │
│           ├──→ AI SERVICE (Gemini)                                          │
│           │    • Send context + data                                        │
│           │    • Get insights/predictions                                   │
│           │    • Return AI response                                          │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │   FRONTEND     │                                                         │
│   │   (Display)    │                                                         │
│   │                │                                                         │
│   │  • Show Data    │                                                         │
│   │  • Show AI Insights                                                     │
│   │  • Update State                                                        │
│   └────────────────┘                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
AI NEEDS ALL THE DATA - WHAT FEEDS INTO AI

┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI DATA SOURCES - COMPLETE MAP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        📊 JOURNAL (MAIN SOURCE)                       │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │  Journal Entries contain:                                       │  │    │
│  │  │  • Career interests & goals                                     │  │    │
│  │  │  • Skills wanting to learn                                      │  │    │
│  │  │  • Subjects enjoyed                                             │  │    │
│  │  │  • Mood patterns (daily)                                         │  │    │
│  │  │  • Challenges overcome                                           │  │    │
│  │  │  • Achievements proud of                                        │  │    │
│  │  │  • Dreams & aspirations                                         │  │    │
│  │  │  • Self-reflection                                              │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                           │                                          │    │
│  └───────────────────────────┼──────────────────────────────────────────┘    │
│                              │                                                 │
│                              ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ⚡ AI INSIGHTS ENGINE (Processes ALL Data)                        │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Input: Journal + Assessments + Academic + Behavior                │    │
│  │  Output: Personalized recommendations, insights, alerts             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                 │
│          ┌───────────────────┼───────────────────┐                          │
│          │                   │                   │                          │
│          ▼                   ▼                   ▼                          │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │ Student      │  │ Counselor    │  │ Parent       │                    │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │                    │
│  │              │  │              │  │              │                    │
│  │ • Career     │  │ • At-risk    │  │ • Child's    │                    │
│  │   guidance   │  │   alerts     │  │   progress   │                    │
│  │ • Study      │  │ • Mood       │  │ • Goals      │                    │
│  │   plans     │  │   trends     │  │              │                    │
│  │ • Skill      │  │ • Intervention│  │              │                    │
│  │   gaps      │  │   suggestions│  │              │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
DETAILED DATA FLOW - EACH PORTAL
1. STUDENT PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                        STUDENT PORTAL DATA FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] Write Journal            │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ POST /api/journal     │                   │   │
│   │                           │                       ├─Save entry        │   │
│   │                           │                       │                   │   │
│  [2] View AI Insights        │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/journal/ai-insights               │   │
│   │                           │                       ├─Fetch all entries │   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │                       │                   │   │
│   │                           │ AI analyzes patterns │                   │   │
│   │                           │<─Return insights ─────────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display insights         │                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Student):                                               │
│  ├─ Journal entries (goals, mood, interests, challenges)                     │
│  ├─ Assessment results (RIASEC, MBTI, DISC, Work Values, Learning Styles)   │
│  ├─ Academic performance (grades, attendance, homework completion)            │
│  ├─ Career matches (from assessments)                                        │
│  ├─ Roadmap progress                                                         │
│  └─ Behavior patterns                                                         │
│                                                                              │
│  AI OUTPUTS TO Student:                                                       │
│  ├─ Personalized career recommendations                                       │
│  ├─ Study plan suggestions                                                   │
│  ├─ Skill gap analysis                                                       │
│  ├─ Mood insights & wellness tips                                            │
│  └─ Goal progress tracking                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
2. COUNSELOR PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                       COUNSELOR PORTAL DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] View Student Profile     │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/counselor/student-context           │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       ├─Fetch assessments│   │
│   │                           │                       ├─Fetch behavior   │   │
│   │                           │                       ├─Fetch mood       │   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │                       │                   │   │
│   │                           │ AI analyzes student  │                   │   │
│   │                           │<─Return context ──────────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display:                   │                       │                   │   │
│   │  • Journal summary         │                       │                   │   │
│   │  • Mood trends             │                       │                   │   │
│   │  • Career interests        │                       │                   │   │
│   │  • Goals & challenges      │                       │                   │   │
│  [2] Get Interventions         │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/counselor/intervention-suggestions  │   │
│   │                           │                       ├─Query data ────────>│   │
│   │                           │ AI suggests actions  │                   │   │
│   │                           │<─Return suggestions ─────────────────────│   │
│   │<──────────────────────────┤                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Counselor):                                             │
│  ├─ Student journal entries (with permission)                                │
│  ├─ Assessment results                                                       │
│  ├─ Academic performance                                                     │
│  ├─ Attendance records                                                       │
│  ├─ Behavior logs                                                            │
│  ├─ Mood patterns                                                            │
│  ├─ Previous interventions                                                   │
│  └─ Counseling sessions                                                     │
│                                                                              │
│  AI OUTPUTS TO Counselor:                                                    │
│  ├─ Student context summary                                                  │
│  ├─ At-risk identification                                                   │
│  ├─ Intervention suggestions                                                │
│  ├─ Mood trend analysis                                                     │
│  └─ Career guidance recommendations                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
3. PARENT PORTAL - Data Flow

┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARENT PORTAL DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                  API                    DATABASE               AI│
│   │                           │                       │                   │   │
│  [1] View Child Progress      │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/parent/progress                    │   │
│   │                           │                       ├─Fetch grades     │   │
│   │                           │                       ├─Fetch attendance │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       │   (positive only) │   │
│   │<──────────────────────────┤                       │                   │   │
│   │  Display:                   │                       │                   │   │
│   │  • Grades                  │                       │                   │   │
│   │  • Attendance              │                       │                   │   │
│   │  • Homework                │                       │                   │   │
│   │  • Career goals            │                       │                   │   │
│  [2] View Child's Career Plan  │                       │                   │   │
│   ├─────────────────────────>│                       │                   │   │
│   │                           │ GET /api/parent/career-plan                 │   │
│   │                           │                       ├─Fetch journal    │   │
│   │                           │                       ├─Fetch assessments│   │
│   │                           │                       ├─Send to AI ────────>│   │
│   │                           │ AI generates plan    │                   │   │
│   │                           │<─Return plan ─────────────────────────────�│   │
│   │<──────────────────────────┤                       │                   │   │
│                                                                              │
│  DATA SOURCES FOR AI (Parent):                                                │
│  ├─ Child's journal (privacy-filtered)                                      │
│  ├─ Assessment results                                                       │
│  ├─ Grades & attendance                                                      │
│  ├─ Homework completion                                                      │
│  └─ Career matches                                                           │
│                                                                              │
│  AI OUTPUTS TO Parent (Privacy-respecting):                                 │
│  ├─ Child's academic progress summary                                        │
│  ├─ Positive achievements & milestones                                       │
│  ├─ Career exploration progress                                               │
│  └─ Recommended activities                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
AI PIPELINE - HOW AI GETS ALL DATA

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI DATA PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: DATA COLLECTION (Backend)                                   │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  async function collectStudentData(studentId) {                     │    │
│  │    const [                                                              │    │
│  │      journal,           // Career goals, mood, interests              │    │
│  │      assessments,       // RIASEC, MBTI, DISC, etc.                 │    │
│  │      grades,            // Academic performance                      │    │
│  │      attendance,        // Attendance records                        │    │
│  │      homework,          // Homework completion                       │    │
│  │      behavior,          // Behavior logs                             │    │
│  │      careerMatches      // Career suggestions                        │    │
│  │    ] = await Promise.all([                                             │    │
│  │      db.select().from(journal).where(eq(journal.studentId, id)),     │    │
│  │      db.select().from(assessmentResults).where(...),                 │    │
│  │      db.select().from(grades).where(...),                            │    │
│  │      db.select().from(attendance).where(...),                        │    │
│  │      db.select().from(homeworkSubmissions).where(...),               │    │
│  │      db.select().from(behaviorLogs).where(...),                      │    │
│  │      db.select().from(careerMatches).where(...)                      │    │
│  │    ]);                                                                 │    │
│  │                                                                     │    │
│  │    return { journal, assessments, grades, attendance,                │    │
│  │             homework, behavior, careerMatches };                     │    │
│  │  }                                                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: AI PROMPT CONSTRUCTION                                     │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  const prompt = `                                                     │    │
│  │    You are an AI career and academic counselor for a Bhutanese      │    │
│  │    middle school student. Analyze the following data and provide   │    │
│  │    personalized recommendations:                                      │    │
│  │                                                                     │    │
│  │    JOURNAL ENTRIES (last 30):                                       │    │
│  │    ${journal.map(j => `- ${j.date}: ${j.title} - Mood: ${j.mood}")} │    │
│  │                                                                     │    │
│  │    ASSESSMENT RESULTS:                                               │    │
│  │    - RIASEC: ${assessments.riasec}                                  │    │
│  │    - MBTI: ${assessments.mbti}                                      │    │
│  │    - DISC: ${assessments.disc}                                      │    │
│  │                                                                     │    │
│  │    ACADEMIC PERFORMANCE:                                             │    │
│  │    - Average Grade: ${grades.average}                               │    │
│  │    - Attendance: ${attendance.percentage}%                          │    │
│  │                                                                     │    │
│  │    Please provide:                                                   │    │
│  │    1. Career recommendations based on interests & assessments        │    │
│  │    2. Study plan based on performance & goals                       │    │
│  │    3. Skill development suggestions                                  │    │
│  │    4. Mood insights & wellness tips                                  │    │
│  │  `;                                                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: AI PROCESSING (Gemini)                                    │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  const aiResponse = await gemini.generateContent(prompt);          │    │
│  │                                                                     │    │
│  │  // Returns structured JSON:                                         │    │
│  │  {                                                                   │    │
│  │    careerRecommendations: [...],                                     │    │
│  │    studyPlan: {...},                                                 │    │
│  │    skillGaps: [...],                                                 │    │
│  │    moodInsights: {...},                                              │    │
│  │    goals: [...]                                                      │    │
│  │  }                                                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: RESPONSE TO FRONTEND                                      │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  return NextResponse.json({                                         │    │
│  │    success: true,                                                    │    │
│  │    data: aiResponse                                                 │    │
│  │  });                                                                 │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 5: FRONTEND DISPLAY                                         │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                     │    │
│  │  • Career recommendations card                                       │    │
│  │  • Study plan widget                                                 │    │
│  │  • Skill gap analysis                                               │    │
│  │  • Mood trends chart                                                 │    │
│  │  • Goal progress tracker                                             │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
DATABASE TABLES THAT FEED AI

┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA TABLES - AI INPUT SOURCES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIMARY DATA SOURCES (Journal System)                              │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Table                │ Data Provided To AI                          │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  journal              │ Goals, interests, mood, challenges,       │    │
│  │                       │ self-reflection, achievements, dreams      │    │
│  │  journal_entries      │ Daily entries, mood tracking, tags         │    │
│  │  journal_ai_insights   │ Previous AI analyses                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SECONDARY DATA SOURCES (Enhance AI Understanding)                   │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Table                │ Data Provided To AI                          │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  riasecResults        │ Career interest types                       │    │
│  │  mbtiResults          │ Personality type                            │    │
│  │  discResults          │ Behavioral style                            │    │
│  │  workValuesResults    │ Work preference values                     │    │
│  │  learningStylesResults│ Learning preferences                       │    │
│  │  careerMatches        │ AI-suggested careers                        │    │
│  │  careerPlans          │ Student's career goals                      │    │
│  │  grades               │ Academic performance                        │    │
│  │  attendance           │ Attendance patterns                         │    │
│  │  homeworkSubmissions  │ Assignment completion                       │    │
│  │  behaviorLogs         │ Behavioral records                          │    │
│  │  interventions        │ Previous interventions                      │    │
│  │  counselingSessions   │ Session history                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
IMPLEMENTATION PLAN - CONNECT THE DATA FLOW

┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILES TO MODIFY - DATA FLOW INTEGRATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 1: Make Journal Data Accessible to AI                     │    │
│  │                                                                     │    │
│  │  1. src/app/api/ai/career-coach/route.ts                           │    │
│  │     BEFORE: Only uses assessment data                               │    │
│  │     AFTER:  Also fetches journal entries for context                │    │
│  │     ADD: const journal = await db.select().from(journal)            │    │
│  │           .where(eq(journal.studentId, studentId));                 │    │
│  │                                                                     │    │
│  │  2. src/app/api/ai/insights/route.ts                               │    │
│  │     BEFORE: Returns mock data                                       │    │
│  │     AFTER:  Queries journal + assessments + grades                  │    │
│  │     ADD: Real data aggregation + AI analysis                         │    │
│  │                                                                     │    │
│  │  3. src/app/api/journal/ai-insights/route.ts                       │    │
│  │     BEFORE: Basic journal analysis                                   │    │
│  │     AFTER:  Cross-references with assessments, grades               │    │
│  │     ADD: Multi-source data aggregation                               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 2: Make Journal Visible to Counselors                     │    │
│  │                                                                     │    │
│  │  4. src/app/api/counselor/student-journal/route.ts (CREATE)        │    │
│  │     - GET endpoint for counselors to view student journals           │    │
│  │     - Permission check (only for assigned students)                  │    │
│  │     - Returns: Journal entries + mood trends + goals                │    │
│  │                                                                     │    │
│  │  5. src/app/counselor/students/page.tsx (MODIFY)                   │    │
│  │     - ADD: "View Journal" button for each student                   │    │
│  │     - ADD: Modal displaying student's journal entries                │    │
│  │     - ADD: AI-powered summary of student's journal                    │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 3: Show Journal Insights on Dashboard                      │    │
│  │                                                                     │    │
│  │  6. src/components/student/journal-insights-widget.tsx (CREATE)    │    │
│  │     - Fetches journal + AI insights                                  │    │
│  │     - Displays: Mood trend (mini chart)                              │    │
│  │     - Recent journal entries (3 items)                               │    │
│  │     - AI summary of patterns                                          │    │
│  │     - Goal progress from journal                                     │    │
│  │                                                                     │    │
│  │  7. src/app/student/dashboard/page.tsx (MODIFY)                     │    │
│  │     - ADD: Journal insights widget to dashboard                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 4: Parent Portal (Privacy-Respecting)                       │    │
│  │                                                                     │    │
│  │  8. src/app/api/parent/child-journal/route.ts (CREATE)              │    │
│  │     - Returns child's journal (positive entries only)               │    │
│  │     - Filters out sensitive/private entries                          │    │
│  │     - Shows: Goals, achievements, positive reflections              │    │
│  │                                                                     │    │
│  │  9. src/app/parent/children/page.tsx (MODIFY)                       │    │
│  │     - ADD: "View Journal" button (privacy warning)                  │    │
│  │     - Show child's goals and achievements from journal               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRIORITY 5: Navigation Fixes                                        │    │
│  │                                                                     │    │
│  │  10. src/config/portal-config.ts (MODIFY)                          │    │
│  │      - Add: Hostel, Library, Settings, Billing                       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTAL FILES: 10                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
SUMMARY: THE AI-FIRST DATA FLOW

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINAL DATA FLOW SUMMARY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FRONTEND displays AI insights                                              │
│     ▲                                                                        │
│     │ (AI-generated recommendations)                                          │
│     │                                                                        │
│  AI SERVICE (Gemini) analyzes ALL data                                       │
│     ▲                                                                        │
│     │ (Sends aggregated data)                                                │
│     │                                                                        │
│  BACKEND API collects from:                                                  │
│     ├─ JOURNAL (main source) - goals, mood, interests                        │
│     ├─ ASSESSMENTS - career interests, personality                         │
│     ├─ ACADEMIC - grades, attendance, homework                               │
│     └─ BEHAVIOR - patterns, interventions                                   │
│     ▲                                                                        │
│     │                                                                        │
│  DATABASE (Neon PostgreSQL) stores everything                                │
│     ▲                                                                        │
│     │                                                                        │
│  USER enters data through:                                                   │
│     ├─ Journal entries                                                       │
│     ├─ Assessment responses                                                  │
│     ├─ Daily interactions (attendance, homework)                            │
│     └─ Feedback loops                                                       │
│                                                                              │
│  KEY: Journal is the RICH DATA SOURCE that makes AI smart!                  │
│                                                                              │
│  WITHOUT JOURNAL → AI gives generic advice                                   │
│  WITH JOURNAL → AI gives personalized, contextual insights                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
This is the complete system. Journal feeds AI, AI feeds all portals.

DATABASE CLEANUP - TABLES TO DELETE

┌─────────────────────────────────────────────────────────────────────────────┐
│                    TABLES TO DELETE FROM SCHEMA                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DELETE FROM src/lib/db/schema.ts (19 tables total):                      │
│                                                                              │
│  TUITION SYSTEM (7 tables) - Lines ~2026-2885                             │
│  ├── tuitionCourses                                                          │
│  ├── tuitionEnrollments                                                      │
│  ├── tutors                                                                  │
│  ├── tutorEarnings                                                           │
│  ├── liveSessions                                                            │
│  ├── tutorReviews                                                            │
│  └── tuitionCategories                                                       │
│                                                                              │
│  MEDICAL RECORDS (6 tables) - Lines ~3552-3793                             │
│  ├── medicalRecords                                                          │
│  ├── studentAllergies                                                        │
│  ├── vaccinationRecords                                                      │
│  ├── medicineInventory                                                       │
│  ├── medicineTransactions                                                    │
│  └── medicalReferrals                                                         │
│                                                                              │
│  SUPPORT TICKETS (3 tables) - Lines ~3172-3233                             │
│  ├── supportTickets                                                          │
│  ├── supportTicketResponses                                                   │
│  └── supportAgents                                                            │
│                                                                              │
│  EVENTS (3 tables)                                                           │
│  ├── schoolEvents (Line ~2729)                                              │
│  ├── eventRegistrations (Line ~2764)                                       │
│  └── events (Line ~3426)                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
SCHEMA ERROR FIX

┌─────────────────────────────────────────────────────────────────────────────┐
│              DB PUSH ERROR - learningStylesResults                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ERROR: PostgresError: column "recommendations" cannot be cast to json     │
│                                                                              │
│  CAUSE: Schema changed from text → json, PostgreSQL can't auto-convert    │
│                                                                              │
│  FIX (User Approved): DROP & RECREATE                                       │
│  1. DROP TABLE learningStylesResults CASCADE;                              │
│  2. Run npm run db:push (will recreate with correct schema)                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
FINAL EXECUTION PLAN

STEP 1: Schema Cleanup (DO THIS FIRST)
├── Delete 19 unused tables from src/lib/db/schema.ts
└── Drop & recreate learningStylesResults table

STEP 2: WEBSOCKET - #1 PRIORITY AFTER CLEANUP
├── Real-time notifications across all portals
├── Live data synchronization (no manual refresh)
├── Real-time collaboration features
├── Live tracking (transport, attendance, etc.)
└── Instant updates when teachers post homework/grades

STEP 3: Navigation Fixes (src/config/portal-config.ts)
├── Add Hostel, Library, Settings to student nav
└── Add Billing to admin navs

STEP 4: Journal → AI Integration
├── AI Career Coach reads journal data
├── Counselors can view student journals
├── Student Dashboard shows journal insights
└── Parent sees child's journal (privacy-filtered)

STEP 5: Create AI Pages
├── /student/essay-reviewer
├── /student/study-planner
└── /counselor/mood-tracker

STEP 6: Fix Mock Data → Real DB Queries
├── counselor/intervention-suggestions
├── counselor/student-context
└── parent/behavior-logs
WEBSOCKET IMPLEMENTATION PLAN - #1 PRIORITY

┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME UPDATES WITH WEBSOCKET                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CURRENT STATE:                                                             │
│  ❌ No WebSocket - users must manually refresh to see new data             │
│  ❌ No real-time notifications                                              │
│  ❌ No live updates when others post content                               │
│  ❌ No real-time collaboration                                             │
│                                                                              │
│  WITH WEBSOCKET:                                                            │
│  ✅ Real-time notifications across all portals                            │
│  ✅ Live homework updates (student sees when teacher assigns)             │
│  ✅ Live grade updates (student sees when teacher grades)                 │
│  ✅ Real-time attendance tracking                                          │
│  ✅ Live transport tracking                                                │
│  ✅ Instant messages/communication                                        │
│  ✅ Real-time dashboard updates                                           │
│                                                                              │
│  IMPLEMENTATION:                                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  1. Pusher API (Realtime) - For Next.js                                  │
│  2. Socket.io or custom WebSocket implementation                          │
│  3. Client-side WebSocket hooks                                          │
│  4. Server-side event broadcasting                                        │
│  5. Room-based subscriptions (per school, per class)                      │
│                                                                              │
│  FILES TO CREATE/MODIFY:                                                   │
│  ├── src/app/api/pushers/[...]/route.ts (Pusher endpoints)             │
│  ├── src/lib/websocket.ts (WebSocket server)                            │
│  ├── src/hooks/use-realtime.ts (Client WebSocket hook)                  │
│  ├── src/components/live-updates/ (Live update components)             │
│  └── Update all pages to use real-time data                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
Total: Schema cleanup + WebSocket + ~30 other files

User approved the plan
Update Todos

Delete 19 unused tables (Tuition, Medical, Support, Events) from schema

Drop & recreate learningStylesResults table to fix JSON cast error

Add Hostel, Library, Settings to student navigation

Add Billing to Platform Admin & School Admin navigation

Add WebSocket for real-time notifications and updates (split into sub-tasks)

Create Essay reviewer, Study planner, Mood tracker pages

Connect Journal data to AI Career Coach, Counselor, Dashboard

Replace mock data with real database queries