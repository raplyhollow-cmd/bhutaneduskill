# Career Counseling System - Terms of Reference (TOR)

**Project:** Bhutan EduSkill - AI-Powered Career Counseling
**Last Updated:** March 5, 2026
**Status:** Comprehensive Analysis Complete

---

## Executive Summary

This document serves as the complete Terms of Reference for the AI-Powered Career Counseling System - the **primary feature** of the Bhutan EduSkill platform. This system aims to provide the most intelligent, personalized career guidance for Bhutanese middle school students (Class 6-12).

### Vision Statement
> "Every Bhutanese student deserves personalized career guidance that understands their unique abilities, dreams, and context - powered by AI but guided by human expertise."

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [System Architecture](#3-system-architecture)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Data Models](#5-data-models)
6. [User Workflows](#6-user-workflows)
7. [Technical Specifications](#7-technical-specifications)
8. [Integration Points](#8-integration-points)
9. [Success Metrics](#9-success-metrics)

---

## 1. Project Overview

### 1.1 Objectives

| Objective | Description | Priority |
|-----------|-------------|----------|
| **Holistic Understanding** | Assess students across multiple dimensions: personality, interests, values, skills, academics | ⭐⭐⭐ |
| **Accurate Matching** | Match students to careers using advanced multi-factor algorithms | ⭐⭐⭐ |
| **Real Opportunities** | Connect career recommendations to real options: RUB colleges, TVET, scholarships | ⭐⭐⭐ |
| **Continuous Guidance** | Provide 24/7 AI coach that learns and adapts | ⭐⭐ |
| **Human Oversight** | Ensure counselor, teacher, and parent involvement | ⭐⭐⭐ |
| **Bhutan Context** | Incorporate GNH values, local job market, cultural relevance | ⭐⭐⭐ |

### 1.2 Target Users

| User Role | Primary Need | Key Features |
|-----------|--------------|--------------|
| **Student (Class 6-12)** | Understand strengths, find career path, plan for college | Assessments, AI coach, roadmap, portfolio |
| **Counselor** | Guide multiple students efficiently, track progress | Review queue, planning tools, analytics |
| **Teacher** | Understand student interests, provide subject guidance | Student profiles, career alignment insights |
| **Parent** | Support child's career journey, understand options | View plans, schedule sessions, track progress |
| **School Admin** | Track outcomes, manage counselors | Analytics dashboards, reporting |
| **Ministry** | National workforce planning, policy insights | Aggregated data, trends |

### 1.3 Bhutan-Specific Considerations

1. **RUB Integration**: Complete integration with Royal University of Bhutan colleges and programs
2. **GNH Alignment**: Career paths aligned with Gross National Happiness principles
3. **Local Job Market**: Focus on careers relevant to Bhutan's economy
4. **Cultural Values**: Respect for traditions while guiding toward modern careers
5. **Regional Access**: Consider students from all 20 dzongkhags
6. **Scholarship Awareness**: Information about available scholarships

---

## 2. Current State Analysis

### 2.1 What Exists (Strong Foundation)

#### Assessment System ✅
| Assessment | Location | Status |
|------------|----------|--------|
| RIASEC Holland Code | [src/lib/riasec.ts](src/lib/riasec.ts) | Complete |
| MBTI Personality | [src/lib/assessments/mbti.ts](src/lib/assessments/mbti.ts) | Complete |
| DISC | [src/lib/assessments/disc.ts](src/lib/assessments/disc.ts) | Complete |
| Work Values | [src/lib/assessments/work-values.ts](src/lib/assessments/work-values.ts) | Complete |
| Learning Styles (VARK) | [src/lib/assessments/learning-styles.ts](src/lib/assessments/learning-styles.ts) | Complete |
| Spark (Lite/Advanced) | [src/lib/assessments/questions/](src/lib/assessments/questions/) | Complete |

#### Career Matching Engine ✅
- **File**: [src/lib/services/career-matching.service.ts](src/lib/services/career-matching.service.ts)
- **Lines**: 1,093
- **Features**:
  - RIASEC, MBTI, DISC, Work Values matching
  - Compatibility scoring (0-100)
  - Skills gap analysis
  - Learning path recommendations
  - RUB college matching

#### AI Career Coach ✅
- **API**: [src/app/api/ai/career-coach/route.ts](src/app/api/ai/career-coach/route.ts)
- **Integration**: Google Gemini
- **Features**:
  - Context-aware conversations
  - Uses assessment results
  - Journal entry integration
  - Interaction tracking

#### RUB Schema ✅
- **File**: [src/lib/db/rub-schema.ts](src/lib/db/rub-schema.ts)
- **Tables**: 8
  - `rub_colleges` - College information
  - `rub_programs` - Academic programs
  - `rub_applications` - Student applications
  - `rub_scholarships` - Available scholarships
  - `rub_scholarship_applications` - Student scholarship applications
  - `rub_counseling_records` - Counseling sessions
  - `rub_admission_stats` - School statistics
  - `rub_api_config` - API settings

#### Student Skills System ✅
- **File**: [src/features/student-skills.feature.ts](src/features/student-skills.feature.ts)
- **Features**:
  - Skill categories: academic, soft, technical, creative, service, vocational
  - Proficiency levels: beginner → expert
  - Sources: inferred, self-report, teacher-assigned
  - Validation workflow

#### Intelligence Engine ✅
- **File**: [src/lib/intelligence/engine.ts](src/lib/intelligence/engine.ts)
- **Features**:
  - Auto-generates insights on assessment completion
  - Early warning for at-risk students
  - Grade trend analysis
  - Attendance pattern detection

### 2.2 What's Missing (Gaps)

| Gap | Priority | Impact |
|-----|----------|--------|
| RUB colleges data (EMPTY tables) | ⭐⭐⭐ Critical | No college matching |
| Multi-factor matching algorithm | ⭐⭐⭐ High | Single-assessment matching only |
| Proactive AI guidance | ⭐⭐⭐ High | AI is reactive only |
| Visual career roadmap | ⭐⭐ Medium | No timeline visualization |
| Counselor workflow full implementation | ⭐⭐⭐ High | Basic approval only |
| Portfolio system | ⭐⭐ Medium | No evidence collection |
| Labor market data | ⭐⭐ Medium | No demand forecasting |

---

## 3. System Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Bhutan EduSkill Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Student   │  │  Counselor  │  │   Teacher   │  Portals     │
│  │   Portal    │  │   Portal    │  │   Portal    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Unified API Layer                     │    │
│  │  /api/resources/*  /api/ai/*  /api/student/*            │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                        │
│                           ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Feature Definitions                      │   │
│  │  careers  student-skills  skill-gaps  counselor-notes    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                        │
│                           ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Service Layer                             │   │
│  │  Career Matching  AI Coach  RUB Matcher  Skills Engine  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                        │
│         ┌─────────────────┼─────────────────┐                    │
│         ▼                 ▼                 ▼                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  Drizzle   │  │   Gemini   │  │    RUB     │                │
│  │  Database  │  │     AI     │  │    API     │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
Student Activity
       │
       ├─► Complete Assessment ──► Assessment Results
       │                                │
       ├─► Submit Homework ────────────┤
       │                                │
       ├─► Chat with AI ────────────────┤
       │                                │
       └─► Update Skills ───────────────┤
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  Intelligence   │
                              │     Engine      │
                              └────────┬────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     │                 │                 │
                     ▼                 ▼                 ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │   Career    │  │     AI      │  │   Skills    │
            │  Matching   │  │   Coach     │  │    Gap      │
            └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                   │                │                │
                   └────────────────┴────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   Dashboard     │
                          │  Recommendations│
                          │   Roadmap       │
                          └─────────────────┘
```

---

## 4. Implementation Roadmap

### Phase 1: Data Foundation (1-2 days)
**Goal**: Complete data infrastructure

| Task | File | Details |
|------|------|---------|
| RUB colleges data | `src/lib/data/rub-colleges.ts` | 5 colleges, 20+ programs, requirements, fees |
| Expanded careers | `src/lib/data/careers-expanded.ts` | 100+ careers with Bhutan relevance |
| Skills ontology | `src/lib/data/skills-ontology.ts` | Hierarchical skill mapping |

### Phase 2: Advanced Matching (2-3 days)
**Goal**: Multi-factor career matching

| Task | File | Details |
|------|------|---------|
| Advanced matching service | `src/lib/services/advanced-career-matching.service.ts` | Multi-factor algorithm |
| Interest tracker | `src/lib/services/career-interest-tracker.ts` | Temporal tracking |
| Enhanced API | `src/app/api/student/career-matches/advanced/route.ts` | New endpoint |

### Phase 3: Enhanced AI Coach (2-3 days)
**Goal**: Proactive, intelligent guidance

| Task | File | Details |
|------|------|---------|
| Proactive briefings | `src/app/api/ai/career-coach/v2/route.ts` | Daily/weekly insights |
| Interview coach | `src/app/api/ai/interview-coach/route.ts` | Mock interviews |
| Resume builder | `src/app/api/ai/resume-builder/route.ts` | CV generation |

### Phase 4: Counselor Workflow (2 days)
**Goal**: Complete review system

| Task | File | Details |
|------|------|---------|
| Enhanced career alignment | `src/app/counselor/career-alignment/page.tsx` | Full workflow |
| Career planning sessions | `src/app/counselor/sessions/career-planning/page.tsx` | Templates |
| Parent approval | `src/app/parent/career-plans/page.tsx` | Parent portal |

### Phase 5: Visual Roadmap (2-3 days)
**Goal**: Interactive timeline

| Task | File | Details |
|------|------|---------|
| Timeline component | `src/components/career/career-roadmap-timeline.tsx` | Visualization |
| Roadmap page | `src/app/student/roadmap/page.tsx` | Student view |
| Portfolio page | `src/app/student/portfolio/page.tsx` | Evidence showcase |

### Phase 6: Labor Market (1-2 days)
**Goal**: Real-world connections

| Task | File | Details |
|------|------|---------|
| Labor market data | `src/lib/data/labor-market-data.ts` | Job market stats |
| Demand forecaster | `src/lib/services/skills-demand-forecaster.ts` | Predictions |

### Phase 7: Advanced Features (Future)
- Peer comparison (privacy-protected)
- Alumni tracking & mentorship
- Virtual job shadowing

---

## 5. Data Models

### 5.1 Career Match Profile

```typescript
interface CareerMatchProfile {
  // Assessments (40%)
  assessments: {
    riasec?: RIASECResult;
    mbti?: MBTIResult;
    disc?: DISCResult;
    workValues?: WorkValuesResult;
  };

  // Academic (25%)
  academics: {
    subjects: SubjectGrade[];
    overallPercentage: number;
    classRank?: number;
    attendanceRate: number;
  };

  // Skills (20%)
  skills: {
    validated: StudentSkill[];
    inferred: InferredSkill[];
  };

  // Interests (15%)
  interests: {
    stated: string[];
    journalTopics: string[];
    careerGoals: string[];
    savedCareers: string[];
  };

  // Context
  context: {
    grade: number; // 6-12
    school: string;
    location: string;
    gender?: string;
  };
}
```

### 5.2 Career Match Result

```typescript
interface CareerMatchResult {
  // Basic Info
  careerId: string;
  careerTitle: string;
  matchScore: number; // 0-100
  confidence: "high" | "medium" | "low";

  // Score Breakdown
  scores: {
    assessment: number;
    academic: number;
    skills: number;
    interests: number;
  };

  // RUB Connection
  rubPrograms?: {
    collegeId: string;
    collegeName: string;
    programName: string;
    matchScore: number;
    admissionProbability: number;
    requirements: {
      minPercentage: number;
      requiredSubjects: string[];
    };
  }[];

  // Skills Analysis
  skillsGap: {
    missing: string[];
    have: string[];
    readiness: number; // 0-100
  };

  // Next Steps
  nextSteps: string[];
  resources: Resource[];

  // Bhutan Context
  bhutanDemand: "high" | "medium" | "low";
  bhutanOutlook: "Growing" | "Stable" | "Declining" | "Emerging";
  salaryRange: string;
}
```

### 5.3 Career Roadmap

```typescript
interface CareerRoadmap {
  id: string;
  studentId: string;

  // Target
  targetCareer: {
    careerId: string;
    careerTitle: string;
    matchScore: number;
  };

  targetCollege?: {
    collegeId: string;
    collegeName: string;
    programName: string;
  };

  // Timeline
  phases: RoadmapPhase[];

  // Status
  status: "active" | "achieved" | "changed" | "archived";
  counselorApproved: boolean;
  parentApproved: boolean;

  // Tracking
  createdAt: Date;
  updatedAt: Date;
}

interface RoadmapPhase {
  grade: number;
  phase: string;
  milestones: Milestone[];
  recommendations: Recommendation[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: "pending" | "in-progress" | "completed" | "missed";
  category: "academic" | "assessment" | "skill" | "application";
}

interface Recommendation {
  type: "action" | "explore" | "prepare";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}
```

---

## 6. User Workflows

### 6.1 Student Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    Student Career Journey                        │
└─────────────────────────────────────────────────────────────────┘

Class 6-8: Discovery Phase
  ├─► Take RIASEC + Work Values assessments
  ├─► Explore broad career categories
  ├─► Begin skill tracking
  └─► AI coach introduces career concepts

Class 9-10: Exploration Phase
  ├─► Take MBTI + DISC assessments
  ├─► Narrow down to 3-5 career interests
  ├─► Explore RUB colleges and programs
  ├─► Start building portfolio
  └─► Discuss with counselor and parents

Class 11-12: Planning Phase
  ├─► Finalize career choice
  ├─► Create detailed roadmap
  ├─► Complete RUB application preparation
  ├─► Build portfolio for applications
  ├─► Interview preparation with AI coach
  └─► Submit applications and track progress
```

### 6.2 Counselor Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Counselor Workflow                            │
└─────────────────────────────────────────────────────────────────┘

Daily Tasks:
  ├─► Review Queue
  │   ├─► See AI-recommended career matches
  │   ├─► Review student readiness scores
  │   └─► Prioritize students needing attention

Weekly Tasks:
  ├─► Career Planning Sessions
  │   ├─► Use AI-prepared session briefs
  │   ├─► Discuss student's assessment results
  │   ├─► Review career options together
  │   └─► Document recommendations

  ├─► Parent Meetings
  │   ├─► Share student's career profile
  │   ├─► Explain AI recommendations
  │   ├─► Address concerns
  │   └─► Get approval for career path

  ├─► Teacher Coordination
  │   ├─► Share student career interests
  │   ├─► Recommend subject selections
  │   └─► Discuss skill development

Monthly Tasks:
  ├─► Review Outcomes
  │   ├─► Analyze application success rates
  │   ├─► Identify patterns
  │   └─► Adjust recommendations
```

### 6.3 Parent Involvement

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parent Involvement                            │
└─────────────────────────────────────────────────────────────────┘

View Only:
  ├─► Child's assessment results
  ├─► AI-recommended careers
  ├─► Career roadmap
  └─► Progress tracking

Interactive:
  ├─► Approve career plans
  ├─► Schedule counselor sessions
  ├─► Ask questions via AI coach
  └─► Receive progress updates
```

---

## 7. Technical Specifications

### 7.1 Career Matching Algorithm

```typescript
// Multi-factor scoring formula
function calculateCareerMatch(
  profile: CareerMatchProfile,
  career: Career
): CareerMatchResult {

  // Assessment Match (40%)
  const assessmentScore = calculateAssessmentMatch(
    profile.assessments,
    career
  );

  // Academic Fit (25%)
  const academicScore = calculateAcademicFit(
    profile.academics,
    career.requirements
  );

  // Skills Readiness (20%)
  const skillsScore = calculateSkillsReadiness(
    profile.skills,
    career.requiredSkills
  );

  // Interest Alignment (15%)
  const interestScore = calculateInterestAlignment(
    profile.interests,
    career
  );

  // Weighted Composite Score
  const matchScore =
    (assessmentScore * 0.40) +
    (academicScore * 0.25) +
    (skillsScore * 0.20) +
    (interestScore * 0.15);

  return {
    careerId: career.id,
    matchScore: Math.round(matchScore),
    confidence: calculateConfidence(profile),
    scores: {
      assessment: assessmentScore,
      academic: academicScore,
      skills: skillsScore,
      interests: interestScore
    },
    // ... other fields
  };
}
```

### 7.2 AI Coach Prompt Structure

```typescript
const CAREER_COACH_SYSTEM_PROMPT = `
You are an AI Career Coach for Bhutanese students (Class 6-12).

Your Role:
- Provide personalized career guidance
- Help students understand their assessment results
- Connect interests to career paths
- Guide toward RUB colleges and programs
- Align recommendations with GNH values

Guidelines:
1. Always consider the student's grade level
2. Be encouraging but realistic
3. Highlight Bhutan-specific opportunities
4. Suggest actionable next steps
5. Recommend human counselor consultation for major decisions

Context Available:
- Student's RIASEC Holland Code
- Student's MBTI personality type
- Academic performance
- Skills profile
- Career interests
- Journal topics (recent)

DO NOT:
- Make promises about admission
- Dismiss student interests
- Ignore cultural context
- Provide financial/legal advice
`;
```

### 7.3 RUB Integration

```typescript
// RUB Admission Probability Calculator
function calculateAdmissionProbability(
  student: StudentProfile,
  program: RUBProgram
): number {
  let probability = 50; // Base probability

  // Academic factor (60%)
  if (student.overallPercentage >= program.minPercentage + 20) {
    probability += 30;
  } else if (student.overallPercentage >= program.minPercentage + 10) {
    probability += 20;
  } else if (student.overallPercentage >= program.minPercentage) {
    probability += 10;
  } else {
    probability -= 20;
  }

  // Subject match factor (20%)
  const subjectMatch = calculateRequiredSubjectsMatch(
    student.subjects,
    program.requiredSubjects
  );
  probability += (subjectMatch * 20) - 10;

  // RIASEC fit factor (10%)
  const riasecFit = calculateRIASECFit(
    student.riasec,
    program.riasecCodes
  );
  probability += (riasecFit * 10) - 5;

  // School historical performance (10%)
  // Based on rub_admission_stats data

  return Math.max(0, Math.min(100, probability));
}
```

---

## 8. Integration Points

### 8.1 RUB API Integration

```
Bhutan EduSkill Platform
        │
        ├─► Programs Sync
        │   └─► GET /rub/programs (daily)
        │
        ├─► Application Submission
        │   └─► POST /rub/applications
        │
        ├─► Results Fetch
        │   └─► GET /rub/results/{application_id}
        │
        └─► Scholarship Status
            └─► GET /rub/scholarships/{student_id}
```

### 8.2 Ministry of Labour Data

```
External Data Sources
        │
        ├─► Job Market Statistics
        │   └─► Annual in-demand careers list
        │
        ├─► Salary Data
        │   └─► Career salary ranges by level
        │
        └─► Industry Projections
            └─► 5-year growth forecasts
```

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Assessment Completion Rate | 80% | Students completing all assessments |
| AI Coach Engagement | 5+ sessions/student | Average conversations per student |
| Career Plan Creation | 70% | Students with active career plan |
| Counselor Review Time | -50% | Time spent on basic guidance |
| RUB Admission Rate | +20% | Students admitted to preferred programs |
| User Satisfaction | 4.5/5 | Student/parent/counselor feedback |

### 9.2 Outcome Tracking

| Outcome | Description | Timeline |
|---------|-------------|----------|
| Career Clarity | Student can articulate 3 career options | Class 8 |
| Subject Selection | Choices align with career goals | Class 9-10 |
| RUB Application | Complete application with backup options | Class 12 |
| College Admission | Admitted to matched program | Post-Class 12 |

---

## Appendix: File Reference

### Key Files

| Purpose | File Path |
|---------|-----------|
| Career Matching Service | [src/lib/services/career-matching.service.ts](src/lib/services/career-matching.service.ts) |
| AI Career Coach API | [src/app/api/ai/career-coach/route.ts](src/app/api/ai/career-coach/route.ts) |
| RUB Schema | [src/lib/db/rub-schema.ts](src/lib/db/rub-schema.ts) |
| RUB Matcher | [src/lib/intelligence/rub-matcher.ts](src/lib/intelligence/rub-matcher.ts) |
| Student Skills Feature | [src/features/student-skills.feature.ts](src/features/student-skills.feature.ts) |
| Intelligence Engine | [src/lib/intelligence/engine.ts](src/lib/intelligence/engine.ts) |
| Career Guidance Data | [src/lib/data/career-guidance.ts](src/lib/data/career-guidance.ts) |
| Counselor Career Alignment | [src/app/counselor/career-alignment/page.tsx](src/app/counselor/career-alignment/page.tsx) |
| Student Career Coach | [src/app/student/career-coach/page.tsx](src/app/student/career-coach/page.tsx) |

---

**Document Version:** 1.0
**Last Updated:** March 5, 2026
**Next Review:** After Phase 1 completion
