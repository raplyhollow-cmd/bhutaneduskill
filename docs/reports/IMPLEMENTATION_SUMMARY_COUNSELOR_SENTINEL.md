# Counselor Portal - "The GNH Sentinel" Implementation Summary

## Overview
Implemented three core features for the Bhutan EduSkill Counselor Portal aligned with Gross National Happiness (GNH) philosophy.

---

## Features Implemented

### 1. Red Flag System (AI Early Warning)
**AI-powered pattern detection for at-risk students**

**Files Created:**
- `src/app/api/counselor/red-flags/scan/route.ts` - AI scanner with pattern detection
- `src/app/api/counselor/red-flags/route.ts` - List and update red flags
- `src/app/counselor/red-flags/page.tsx` - Dashboard with severity filtering

**How It Works:**
1. Scans `teacher_behavior_logs`, `attendance`, and `exam_results_enhanced` tables
2. Detects patterns: attendance < 75%, 3+ lates, marks < 60%, high-severity incidents
3. Uses Gemini AI to analyze patterns and determine severity
4. Flags students: critical, high, medium, low
5. Suggests GNH-aligned interventions

**Thresholds:**
- Attendance rate below 75%
- 3+ lates in past 30 days
- Average marks below 60%
- 2+ high-severity behavior incidents

---

### 2. Wellness Compass (Private Session Logging)
**Confidential session tracking with Ministry anonymization**

**Files Created:**
- `src/app/api/counselor/wellness-log/route.ts` - Session logging API
- `src/app/counselor/wellness-compass/page.tsx` - 4-step wizard

**How It Works:**
1. Select student and session type (individual, group, family, crisis)
2. Choose concerns and GNH domains addressed
3. Write private session notes (counselor-only, NOT shared with Ministry)
4. Review anonymized data that WILL be shared with Ministry:
   - Dzongkhag
   - School level
   - Session type
   - Intervention category (anonymized)
   - Outcome category
5. Optional: Send parent notification ("A well-being session was conducted today")

**Privacy Controls:**
- Confidentiality levels: standard, high, critical
- Ministry anonymization: NO personal identifiers exported
- Parent notification: Simple, non-alarming message

---

### 3. Career Alignment (Human Approval for Scholarships)
**Counselor approval for AI career roadmaps before RUB scholarships**

**Files Created:**
- `src/app/api/counselor/career-approve/route.ts` - Approval API
- `src/app/counselor/career-alignment/page.tsx` - Review dashboard

**How It Works:**
1. View student's AI-generated career matches
2. Assess suitability (0-100 score slider)
3. Evaluate academic alignment
4. Identify skills gaps
5. Select GNH principles supported by this career
6. Match to RUB colleges and scholarships
7. Approve/Approve with Reservations/Not Recommended

**RUB Integration:**
- Matches to CST, CNR, GCBS, Sherubtse, Paro College, Samtse College
- Links scholarship recommendations
- Valid for 1 year from approval

---

### 4. Ministry Wellbeing Pulse API
**Anonymized national well-being monitoring**

**Files Created:**
- `src/app/api/ministry/wellbeing-pulse/route.ts` - Aggregated well-being data

**Data Provided:**
- By dzongkhag: total students, sessions completed, crisis interventions
- By school level: middle, higher secondary
- Red flags by severity and location
- Top concerns (anonymized word cloud)
- Trend analysis (increasing/decreasing/stable)

---

## Database Schema Changes

**New Tables Added to `src/lib/db/schema.ts`:**

### `redFlags` Table
```sql
- id, studentId, counselorId, schoolId
- severity: low|medium|high|critical
- flagType: attendance|behavior|academic|wellness|combined
- patternDetected (JSON)
- aiRecommendation, gnhPrinciple
- behaviorLogIds (JSON array)
- attendanceData (JSON)
- academicData (JSON)
- status, reviewedAt, reviewedBy, interventionId
- createdAt, updatedAt
```

### `careerApprovals` Table
```sql
- id, studentId, counselorId, careerMatchId
- careerTitle, careerField
- targetRUBCollege, targetProgram
- approvalStatus, suitabilityScore, counselorNotes, reservations
- academicAlignment, skillsGap (JSON), recommendedPreparation (JSON)
- scholarshipReady, recommendedScholarships (JSON)
- approvedAt, validUntil
- gnhAlignment (JSON array)
- createdAt, updatedAt
```

---

## AI Prompts Added

**File:** `src/lib/ai/prompts.ts`

- `RED_FLAG_ANALYZER_SYSTEM` - Pattern detection with GNH principles
- `COUNSELOR_WELLNESS_SYSTEM` - Session documentation guidance
- `CAREER_ALIGNMENT_SYSTEM` - Career assessment for counselors

---

## Dashboard Updates

**File:** `src/app/counselor/dashboard/content.tsx`

Added header buttons:
- Red Flags (with Shield icon)
- Wellness Compass (with Heart icon)
- Career Alignment (with Stamp icon)

Added 5th stats card for Red Flags count.

---

## GNH Domains Integrated

All features reference Gross National Happiness principles:
- **Psychological Wellbeing** - Mental health, emotional balance
- **Community Vitality** - Relationships, belonging, support
- **Time Use** - Balance between academics and personal growth
- **Cultural Diversity** - Cultural preservation, identity
- **Ecological Resilience** - Environment connection
- **Good Governance** - Fair treatment in school

---

## Portal Color Theme

Purple gradient: `rgb(168 85 247) → rgb(147 51 234)`

Severity colors:
- Critical: Red (`bg-red-100 text-red-700`)
- High: Orange (`bg-orange-100 text-orange-700`)
- Medium: Yellow (`bg-yellow-100 text-yellow-700`)
- Low: Blue (`bg-blue-100 text-blue-700`)

---

## Next Steps (Not Implemented)

1. **Push database migration** - Run `npm run db:push` to create new tables
2. **Add counselors to schools** - Assign counselors via counselor_assignments table
3. **Create teacher behavior logs** - For red flag detection to work
4. **Test AI scanning** - Requires GEMINI_API_KEY environment variable
5. **Parent notifications** - Integrate SMS/email service
6. **RUB scholarship sync** - Import actual RUB scholarship data

---

## File Structure Summary

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts (added redFlags, careerApprovals tables)
│   │   └── teacher-logs-schema.ts (existing)
│   └── ai/
│       └── prompts.ts (added 3 new system prompts)
│
├── app/
│   ├── counselor/
│   │   ├── red-flags/page.tsx (NEW)
│   │   ├── wellness-compass/page.tsx (NEW)
│   │   ├── career-alignment/page.tsx (NEW)
│   │   └── dashboard/content.tsx (UPDATED)
│   │
│   └── api/
│       ├── counselor/
│       │   ├── red-flags/scan/route.ts (NEW)
│       │   ├── red-flags/route.ts (NEW)
│       │   ├── wellness-log/route.ts (NEW)
│       │   └── career-approve/route.ts (NEW)
│       │
│       └── ministry/
│           └── wellbeing-pulse/route.ts (NEW)
```

---

## Testing Checklist

- [ ] Database push: `npm run db:push`
- [ ] Type check: `npx tsc --noEmit`
- [ ] Build: `npm run build`
- [ ] Red Flags page loads at `/counselor/red-flags`
- [ ] Wellness Compass wizard works at `/counselor/wellness-compass`
- [ ] Career Alignment page loads at `/counselor/career-alignment`
- [ ] Dashboard buttons link to new pages
- [ ] Ministry API returns data at `/api/minity/wellbeing-pulse`

---

## Implementation Complete: February 22, 2026
