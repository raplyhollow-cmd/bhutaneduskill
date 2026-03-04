# Intelligent School Admin Portal - Data-Driven Guidance Plan

## Vision

**Transform the system into a personal assistant that uses existing data to provide ultra hyper-specific guidance to every individual.**

Not just data display. **Actionable insights** based on what the system already knows.

- Each student gets personalized career roadmap based on MBTI + RIASEC + Skills
- Each teacher gets teaching resources matched to their class's performance
- Each counselor gets at-risk alerts based on attendance + grades + behavior
- Each parent gets specific guidance to help their child succeed

**Goals**: Fast, Smart, Organized, World-class teaching & learning.

---

## Phase 0: Critical Bug Fix (MUST DO FIRST)

### Problem: Classes Don't Show in Teacher Portal

**Root Cause**: Schema field mismatch
- Assignment API sets: `classTeacherId`
- Teacher portal queries: `teacherId`
- Result: Classes don't appear for assigned teachers!

### Fix

**Files to modify:**
1. `src/lib/db/schema.ts` - Remove confusing `teacherId` field (keep only `classTeacherId`)
2. `src/app/teacher/dashboard/_actions.ts` - Change query to use `classTeacherId`
3. `src/app/teacher/students/[id]/page.tsx` - Change query to use `classTeacherId`
4. `src/app/teacher/classes/page.tsx` - Change query to use `classTeacherId`
5. `src/app/teacher/my-classes/page.tsx` - Change query to use `classTeacherId`

### Problem: Teacher Assignment Not Working in Teacher Portal

**Root Cause**: Mismatch between schema fields:
- Assignment API sets: `classTeacherId`
- Teacher portal queries: `teacherId`
- Result: Classes don't appear for teachers!

### Solution: Unify Teacher Assignment Schema

**File: `src/lib/db/schema.ts`** (MODIFY - Classes table)

```sql
-- REMOVE these confusing fields:
-- teacherId (legacy)
-- classTeacherId (ambiguous)
-- homeroomTeacherId (redundant)

-- REPLACE with clear, semantic fields:
classTeacherId text("class_teacher_id").references(() => users.id),
classTeacherName text("class_teacher_name").notNull(),
```

**Migration Script:**
```sql
-- Migrate existing data
UPDATE classes
SET class_teacher_id = COALESCE(teacher_id, homeroom_teacher_id, class_teacher_id),
    class_teacher_name = COALESCE(
        (SELECT firstName || ' ' || lastName FROM users WHERE id = teacher_id),
        (SELECT firstName || ' ' || lastName FROM users WHERE id = homeroom_teacher_id),
        (SELECT firstName || ' ' || lastName FROM users WHERE id = class_teacher_id),
        'Not Assigned'
    );
```

### Fix Teacher Portal Queries

**Files to Modify:**
- `src/app/teacher/dashboard/_actions.ts` - Line 96
- `src/app/teacher/students/[id]/page.tsx` - Line 91
- `src/app/teacher/classes/page.tsx`
- `src/app/teacher/my-classes/page.tsx`

**Change:**
```typescript
// OLD (broken):
.where(eq(classes.teacherId, userId))

// NEW (fixed):
.where(eq(classes.classTeacherId, userId))
```

### Standard Practice

- **Class Teacher (Homeroom)**: 1 teacher → 1 class (primary)
- **Subject Teacher**: 1 teacher → multiple classes (can teach many)
- Validation: Don't assign same teacher as class teacher to multiple classes

---

## Phase 1: The Core - Personal Guidance for Each Role

### 1.1 Student Guidance (Using THEIR Data)

**Data we already have:**
- MBTI personality type
- RIASEC career interests
- Work Values preferences
- Skills assessment results
- Academic performance (grades by subject)
- Attendance records

**What we give back (Hyper-specific):**

```
For Student Karma (INTJ, IAS code, Math 72%, Science 85%, Attendance 82%):

🎯 YOUR CAREER ROADMAP
Based on your MBTI (INTJ) + RIASEC (Investigative-Artistic-Social):
→ Top 5 careers: Data Scientist, Software Architect, Research Scientist,
  UX Designer, Technical Writer
→ Each career has: Bhutan job market outlook, required skills, roadmap

📚 YOUR LEARNING PLAN
→ Math: 72% - Weak in Algebra. Here are 5 specific YouTube tutorials
→ Science: 85% - Strong! Try advanced projects
→ Attendance: 82% - Low. Improving to 95% can boost grades by ~10%

💪 YOUR SKILLS DEVELOPMENT
→ You're strong in: Critical Thinking, Problem Solving
→ To develop: Communication, Teamwork
→ Specific activities for each skill
```

**File:** `src/app/api/student/guidance/route.ts` (NEW)

**What it does:**
1. Fetch student's MBTI, RIASEC, Work Values results
2. Match against career database
3. Analyze academic performance
4. Generate personalized roadmap
5. Recommend specific learning resources

---

### 1.2 Teacher Guidance (Using THEIR Class Data)

**Data we already have:**
- Classes assigned to teacher
- Students in each class with their performance
- Subjects teacher teaches
- Assessment results

**What we give back:**

```
For Mr. Dorji teaching Math Class 10A:

📊 CLASS INSIGHTS
→ Average Math score: 68% (below school average: 75%)
→ Top 3 struggling students: Karma (52%), Pema (58%), Tshering (61%)
→ Top 3 performers: Sonam (92%), Dechen (89%), Yangchen (87%)

🎓 TEACHING METHODS FOR THIS CLASS
→ Class needs: Visual learning + Practice problems
→ Recommended methods: [Khan Academy style][NCERT exemplar videos]
→ Specific YouTube videos for each topic

📋 LESSON PLANS
→ Chapter 4: Algebra - Class struggles here (avg 52%)
   → Use these 3 teaching methods
   → Practice worksheets: [Link]
   → Video explanations: [Link]
```

**File:** `src/app/api/teacher/guidance/route.ts` (NEW)

**What it does:**
1. Fetch teacher's classes and student performance data
2. Identify weak students and weak topics
3. Match teaching resources to class needs
4. Suggest specific methods per subject/topic

---

### 1.3 Counselor Guidance (Using Risk Data)

**Data we already have:**
- All student attendance
- All student grades
- Assessment results showing distress
- Behavior records

**What we give back:**

```
AT-RISK STUDENTS ALERT (Needs your attention TODAY):

🚨 HIGH PRIORITY
→ Karma Wangdi (Class 10A)
   • Attendance dropped: 92% → 78% (last month)
   • Math score dropped: 72% → 58%
   • MBTI: INTJ (may withdraw when stressed)
   • RIASEC: IAS (needs intellectual stimulation)
   • Action: Talk about study stress, connect with math tutoring

⚠️ MEDIUM PRIORITY
→ Pema Choki (Class 10B)
   • Attendance: 82% (consistently low)
   • Skills: High creativity, low discipline
   • Action: Mentorship program
```

**File:** `src/app/api/counselor/guidance/route.ts` (NEW)

---

### 1.4 Parent Guidance (Using Their Child's Data)

**Data we already have:**
- Their child's all data (assessments, grades, attendance)

**What we give back:**

```
For Karma's Parent:

🌟 Karma's Strengths
→ High in: Problem solving, Critical thinking
→ Strong subjects: Science (85%), Computer (90%)

📈 Areas to Improve
→ Math (72%): Needs Algebra practice - [Resources here]
→ Attendance (82%): Set up morning routine

💡 How You Can Help
→ Specific conversation starters for Karma's personality type
→ Study techniques that match INTJ learning style
→ Career path discussions based on IAS interests
```

---

## Phase 2: One Unified Guidance API

Instead of 344 separate API endpoints, create ONE smart endpoint:

```
/api/guidance?role=student&id=123
/api/guidance?role=teacher&id=456
/api/guidance?role=counselor
/api/guidance?role=parent&studentId=123
```

**File:** `src/app/api/guidance/route.ts` (NEW)

**Benefits:**
- Single place for all guidance logic
- Easy to add new guidance types
- Uses existing data - no new schema
- Fast (single query joins existing tables)

---

## Phase 3: Frontend - Show Guidance In Context

### 3.1 GoogleDataTable Row Expansion

When user expands a row (student, class, teacher), show:

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Karma Wangdi    │ Class 10A │ 72% │ INTJ │ IAS        │ ⋮ │
├─────────────────────────────────────────────────────────────┤
│ ┌─ PERSONALIZED GUIDANCE ───────────────────────────────┐  │
│ │ 🎯 Career Match: Data Scientist (92% fit)           │  │
│ │    → Bhutan market: Growing demand                   │  │
│ │    → Roadmap: [View step-by-step]                    │  │
│ │                                                       │  │
│ │ 📚 Focus Areas:                                      │  │
│ │    → Math (Algebra): Watch [Video 1][Video 2]       │  │
│ │    → Communication: Join [Debate Club]              │  │
│ │                                                       │  │
│ │ 💡 Next Steps:                                       │  │
│ │    → This week: Complete Algebra tutorial            │  │
│ │    → This month: Join coding club                    │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Teaching Resources Panel (For Teachers)

```
┌─────────────────────────────────────────────────────────────┐
│ ▼ Class 10A Math │ Mr. Dorji │ 28/32 │ Avg 68%          │ ⋮ │
├─────────────────────────────────────────────────────────────┤
│ ┌─ CLASS GUIDANCE ──────────────────────────────────────┐  │
│ │ 📊 Class Performance: 68% (needs improvement)        │  │
│ │    → Struggling topic: Algebra (52%)                 │  │
│ │                                                       │  │
│ │ 🎓 Recommended Teaching Methods:                     │  │
│ │    → Visual learning approach [Watch method]         │  │
│ │    → NCERT Exemplar problems [Download]              │  │
│ │    → Khan Academy style videos [Playlist]            │  │
│ │                                                       │  │
│ │ 👥 Students Needing Help:                            │  │
│ │    → Karma (52%): One-on-one tutoring needed         │  │
│ │    → Pema (58%): Practice worksheets [Link]          │  │
│ │    → Tshering (61%): Peer study group                │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Resource Database (Curated, Not AI-generated)

### What We Need

**File:** `src/lib/data/teaching-resources.ts` (NEW)

A curated database of:
- Teaching methods per subject
- YouTube videos per topic
- NCERT links per chapter
- Practice worksheets
- Career information per RIASEC/MBTI combination

**Structure:**
```typescript
const teachingResources = {
  math: {
    algebra: {
      methods: ["Visual method", "Practice problem method"],
      videos: [
        { title: "Algebra basics", url: "youtube.com/...", duration: "15:30" },
        { title: "Solving equations", url: "youtube.com/...", duration: "12:00" }
      ],
      ncert: "https://ncert.nic.in/textbook/chapter4",
      worksheets: ["algebra-practice-1.pdf", "algebra-practice-2.pdf"]
    }
    // ... more topics
  }
  // ... more subjects
}

const careerGuidance = {
  "INTJ-IAS": {
    careers: ["Data Scientist", "Software Architect", "Research Scientist"],
    bhutanOutlook: "Growing - IT sector expanding",
    skills: ["Python", "Statistics", "Machine Learning"],
    roadmap: "Step 1: Learn Python → Step 2: Statistics → ..."
  }
  // ... more combinations
}
```

This is **curated once**, then used by the guidance API.

---

## Files to Modify/Create

### Critical Fix (Phase 0)
| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Remove `teacherId`, keep only `classTeacherId` |
| `src/app/teacher/dashboard/_actions.ts` | Query `classTeacherId` instead of `teacherId` |
| `src/app/teacher/students/[id]/page.tsx` | Query `classTeacherId` instead of `teacherId` |
| `src/app/teacher/classes/page.tsx` | Query `classTeacherId` instead of `teacherId` |
| `src/app/teacher/my-classes/page.tsx` | Query `classTeacherId` instead of `teacherId` |

### New Guidance APIs (Phase 1-2)
| File | Purpose |
|------|---------|
| `src/app/api/guidance/route.ts` | Unified guidance API for all roles |
| `src/app/api/student/guidance/route.ts` | Student-specific guidance |
| `src/app/api/teacher/guidance/route.ts` | Teacher-specific guidance |
| `src/app/api/counselor/guidance/route.ts` | At-risk student alerts |
| `src/lib/data/teaching-resources.ts` | Curated resources database |
| `src/lib/data/career-guidance.ts` | Career roadmap data |

### Component Enhancements (Phase 3)
| File | Change |
|------|--------|
| `src/components/admin/google-data-table.tsx` | Add row expansion with guidance panel |
| `src/components/admin/guidance-panel.tsx` | NEW: Show personalized guidance |
| `src/components/admin/teaching-resources-panel.tsx` | NEW: Show teaching resources |

---

## Implementation Order

### Step 1: Fix Critical Bug (Day 1)
- Fix schema field mismatch
- Fix all teacher portal queries
- Verify classes show up in teacher portal

### Step 2: Create Resource Database (Day 2-3)
- Curate YouTube videos per subject/topic
- Add NCERT links
- Create career guidance data per MBTI/RIASEC
- Add teaching methods

### Step 3: Build Guidance API (Day 4-5)
- Create unified `/api/guidance` endpoint
- Implement student guidance (career roadmap + learning plan)
- Implement teacher guidance (class insights + resources)
- Implement counselor alerts (at-risk detection)

### Step 4: Frontend Integration (Day 6-7)
- Add row expansion to GoogleDataTable
- Show guidance panel in expanded rows
- Add teaching resources for teachers
- Add at-risk alerts for counselors

---

## How This Uses Existing Data

| Data Source | How It's Used for Guidance |
|-------------|---------------------------|
| **MBTI Results** | Match careers, suggest learning style, communication tips |
| **RIASEC Results** | Career roadmap, skill development path |
| **Work Values** | Career satisfaction factors, work environment matches |
| **Skills Assessment** | Strengths to build on, gaps to fill |
| **Academic Grades** | Identify weak subjects, recommend specific tutorials |
| **Attendance** | At-risk detection, performance correlation |
| **Teacher Assignments** | Class insights, teaching resource matching |

**No new data needed. We just USE what we have.**

---

## Verification

After implementation:
1. Teacher logs in → Sees class insights + teaching resources
2. Student logs in → Sees career roadmap + learning plan
3. Counselor logs in → Sees at-risk students with specific actions
4. Parent logs in → Sees child's strengths + how to help

All guidance is **hyper-specific to the individual** based on their actual data.
