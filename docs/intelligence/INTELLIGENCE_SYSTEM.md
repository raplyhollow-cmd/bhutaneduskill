# Intelligence System Documentation

**Version:** 1.0
**Last Updated:** March 3, 2026
**Status:** ✅ Complete (All 4 Phases)

---

## Overview

The Intelligence Layer is the AI-powered brain of Bhutan EduSkill. It transforms raw student data into actionable insights for students, teachers, school administrators, and the Ministry of Education.

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │    Phase 1  │ -> │    Phase 2   │ -> │    Phase 3      │   │
│  │   Skills    │    │ Early Warning│    │ Learning Paths  │   │
│  │ Inference   │    │   System     │    │                 │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
│                                                                │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │    Phase 4  │ <- │   Data Flow  │ <- │   Cross-Portal  │   │
│  │ Predictive  │    │  & Triggers  │    │   Visibility    │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Skills Inference Engine

**File:** [`src/lib/intelligence/skills-inference-engine.ts`](../../src/lib/intelligence/skills-inference-engine.ts)

### What It Does

Analyzes existing student data to infer skills without requiring separate assessments:

| Data Source | Skills It Reveals |
|-------------|-------------------|
| **Homework Submissions** | Subject-specific skills, consistency, time management |
| **Attendance Records** | Punctuality, reliability, commitment |
| **Journal Entries** | Writing ability, self-reflection, communication (AI-analyzed) |
| **Student Portfolios** | Project-specific skills, achievements |
| **Assessment Results** | Career interests → skill categories |

### Skills Structure

```typescript
interface InferredSkill {
  id: string;
  name: string;           // "Problem Solving", "Mathematics", etc.
  category: string;       // "academic", "soft", "technical", "vocational"
  level: string;          // "beginner", "intermediate", "advanced", "expert"
  confidence: number;     // 0-100
  source: string;         // "homework", "attendance", "journal", etc.
  evidence: JSON;         // Proof (scores, dates, etc.)
  isInferred: boolean;    // true = system-detected, false = self-reported
}
```

### Categories

| Category | Examples |
|----------|----------|
| Academic | Mathematics, Science, English, Dzongkha, IT |
| Soft Skills | Communication, Teamwork, Leadership, Time Management |
| Technical/Vocational | Programming, Painting, Carpentry, Plumbing, Electrical |
| Creative | Design, Writing, Art, Music, Photography |
| Service | Customer Service, Teaching, Caregiving, Cooking |

---

## Phase 2: Early Warning System

**File:** [`src/lib/intelligence/early-warning-system.ts`](../../src/lib/intelligence/early-warning-system.ts)

### What It Detects

| Risk Factor | Detection Method | Threshold |
|-------------|------------------|-----------|
| **Homework Decline** | Score trend over 3 weeks | Drop >15% = High Risk |
| **Attendance Issues** | Present days / total days | <80% = Medium Risk |
| **Journal Distress** | Keyword analysis | "give up", "hopeless" = Critical |
| **Skills Gap** | Missing vs career requirements | >50% missing = High Risk |
| **Low Engagement** | Homework completion rate | <75% = Medium Risk |

### Risk Levels

```typescript
type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

interface AtRiskStudent {
  studentId: string;
  studentName: string;
  riskLevel: RiskLevel;
  riskScore: number;      // 0-100
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  urgentAttention: boolean;
}
```

### Intervention Recommendations

Based on risk factors, the system suggests:
- "Schedule academic support meeting"
- "Discuss attendance barriers with student"
- "URGENT: Counselor referral - distress detected"
- "Review career goals and create skill development plan"

---

## Phase 3: Learning Path Generator

**File:** [`src/lib/intelligence/learning-path-generator.ts`](../../src/lib/intelligence/learning-path-generator.ts)

### What It Creates

Personalized week-by-week learning roadmap:

```
Student: Tashi | Target: Carpenter
┌─────────────────────────────────────────┐
│  Readiness: 45%                          │
│  Estimated: 10 weeks                     │
├─────────────────────────────────────────┤
│  ✅ Skills You Have (3)                 │
│     Mathematics (Intermediate)           │
│     Woodworking Basics (Beginner)        │
│     Teamwork (Intermediate)              │
│                                         │
│  🔧 Skills to Develop (5)               │
│     Blueprint Reading (Critical)         │
│     Advanced Carpentry (High)            │
│                                         │
│  📅 Week 1-4: Build Foundation Skills   │
│     Resources: YouTube, TVET courses     │
│     Project: Build a Small Stool        │
│                                         │
│  📅 Week 5-8: Blueprint Reading         │
│     Resources: WikiHow, tutorials        │
│     Project: Draw Your Room Plan        │
└─────────────────────────────────────────┘
```

### Bhutan-Specific Resources

| Skill Type | Resources Included |
|------------|-------------------|
| **Vocational** | Carpentry, Painting, Electrical, Plumbing, Welding, Tailoring, Weaving |
| **Digital** | NIEIT courses, Khan Academy, YouTube tutorials |
| **Academic** | Mathematics, English, Communication (Coursera, Duolingo) |
| **Service** | Customer Service, Sales, Teaching (HubSpot, local programs) |

### Learning Path API

**Endpoint:** `GET /api/student/learning-path`

**Response:**
```json
{
  "studentId": "xxx",
  "targetCareer": "Painter",
  "currentReadiness": 45,
  "estimatedWeeks": 10,
  "steps": [
    {
      "week": 1,
      "title": "Build Foundation Skills",
      "description": "Start with core skills",
      "skills": ["Color Theory", "Basic Techniques"],
      "resources": [
        { "title": "Painting Fundamentals", "provider": "YouTube", "free": true }
      ],
      "projects": [
        { "title": "Create a Color Wheel", "estimatedTime": "1 day" }
      ]
    }
  ]
}
```

---

## Phase 4: Predictive Engine

**File:** [`src/lib/intelligence/predictive-engine.ts`](../../src/lib/intelligence/predictive-engine.ts)

### What It Predicts

#### 1. Dropout Risk Prediction

**Endpoint:** `GET /api/analytics/predictions?type=dropout&studentId=xxx`

**Response:**
```json
{
  "studentName": "Tashi Wangyel",
  "riskLevel": "high",
  "riskScore": 62,
  "probability": 0.62,
  "primaryRiskFactors": [
    "Attendance declining",
    "Grades declining rapidly"
  ],
  "predictedDropoutDate": "2026-08-15",
  "interventionImpact": {
    "ifIntervened": 32,
    "potentialImprovement": 30
  }
}
```

#### 2. Career Success Prediction

**Endpoint:** `GET /api/analytics/predictions?type=career&studentId=xxx`

**Response:**
```json
{
  "studentName": "Karma Dorji",
  "targetCareer": "Painter",
  "successProbability": 78,
  "confidence": 85,
  "predictedTimeToReadiness": 6, // months
  "successFactors": [
    { "factor": "Skills Match", "impact": "positive", "weight": 30 }
  ],
  "barriers": ["Significant skills gap"],
  "strengths": ["Strong foundation of relevant skills"]
}
```

#### 3. Workforce Projections (Ministry)

**Endpoint:** `GET /api/analytics/predictions?type=workforce&region=xxx`

**Response:**
```json
{
  "year": 2030,
  "skillDemand": [
    { "skill": "Digital Literacy", "demandLevel": "critical_shortage", "gap": 340 }
  ],
  "careerOutlook": [
    { "career": "Software Developer", "growthRate": 25, "projectedOpenings": 150 }
  ],
  "recommendedPrograms": [
    { "programType": "Skill Development", "focus": "Digital Literacy", "urgency": "high" }
  ]
}
```

---

## Database Schema

### student_skills Table

```sql
CREATE TABLE student_skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,        -- academic, soft, technical, creative, service, vocational
  level TEXT NOT NULL,           -- beginner, intermediate, advanced, expert
  source TEXT NOT NULL,          -- inferred, self_report, teacher_assigned
  evidence JSONB,                -- Proof of skill
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  validated_by TEXT,
  confidence INTEGER,            -- 0-100 for inferred skills
  is_inferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### student_progress_analytics Updates

```sql
-- New fields added:
skills_last_updated TIMESTAMP,
skills_gap_analysis JSONB,      -- Career skills gap data
risk_level TEXT,                 -- low, medium, high, critical
risk_factors JSONB              -- Array of risk reasons
```

---

## Cross-Portal Visibility

| Portal | What They See |
|--------|---------------|
| **Student** | Own skills, career gaps, learning path, resources |
| **Teacher** | Class skills overview, at-risk alerts, intervention recommendations, parent meeting prep |
| **School Admin** | School-wide skills dashboard, at-risk student list, pending skill validations |
| **Platform Admin** | Nationwide skills analytics, demand gaps, regional distribution |
| **Ministry** | Workforce projections, emerging skills, regional readiness, training program recommendations |

---

## Event Triggers

Skills and insights update automatically when:

| Event | Triggered By | Updates |
|-------|--------------|---------|
| Homework graded | Teacher | Skills recalc, trend analysis |
| Journal entry added | Student | AI sentiment analysis |
| Portfolio item added | Student | Skills inference |
| Assessment completed | Student | Career matches, learning paths |
| Attendance marked | Teacher | Risk analysis, reliability score |

---

## Usage Examples

### For Students

1. Go to `/student/skills`
2. See inferred skills from your activities
3. View your learning path to your target career
4. Access free/paid learning resources
5. Add self-reported skills (farming, weaving, etc.)

### For Teachers

1. Go to Teacher Dashboard
2. View "Class Intelligence" widget
3. See at-risk students with urgent alerts
4. Get teaching recommendations based on class data
5. Access parent meeting prep with talking points

### For Ministry

1. Go to `/ministry/skills-workforce`
2. View national skills distribution
3. See emerging skills and shortages
4. Access workforce projections for 2030
5. Get training program recommendations

---

## Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `skills-inference-engine.ts` | 300+ | Analyze 5 data sources for skills |
| `early-warning-system.ts` | 450+ | At-risk detection, intervention recommendations |
| `ai-insights-generator.ts` | 550+ | Teacher insights, class intelligence, grouping |
| `learning-path-generator.ts` | 600+ | Personalized roadmaps, Bhutan-specific resources |
| `predictive-engine.ts` | 500+ | Dropout risk, career success, workforce projections |

---

## API Quick Reference

```
# Skills
GET  /api/student/skills/inferred
POST /api/student/skills/self-report

# Learning Paths
GET  /api/student/learning-path
POST /api/student/learning-path (update progress)

# Teacher Intelligence
GET  /api/teacher/intelligence?classId=xxx
GET  /api/teacher/intelligence?studentId=xxx (parent meeting prep)
POST /api/teacher/intelligence (refresh)

# Interventions
GET  /api/teacher/interventions?studentId=xxx
GET  /api/teacher/interventions?classId=xxx
POST /api/teacher/interventions (record intervention)

# Predictions
GET  /api/analytics/predictions?type=dropout&studentId=xxx
GET  /api/analytics/predictions?type=career&studentId=xxx
GET  /api/analytics/predictions?type=workforce&region=xxx

# Ministry Workforce
GET  /api/ministry/skills-workforce
```

---

## Future Enhancements

| Priority | Feature | Description |
|----------|---------|-------------|
| High | Real-time skill updates | WebSocket-based skill recalculation |
| High | Peer learning matching | Auto-match students for peer tutoring |
| Medium | Employer portal integration | Connect students with apprenticeships |
| Medium | Skill certification tracking | Track external certifications |
| Low | AI career chatbot | Chat interface for career guidance |

---

**END OF INTELLIGENCE SYSTEM DOCUMENTATION**
