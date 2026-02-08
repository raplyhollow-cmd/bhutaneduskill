# Career Guidance Platform - Complete Architecture

## 🎯 The Vision

Build a platform that schools, teachers, and students **LOVE to use** (tempting features) while generating **valuable data** for the company.

---

## 📁 CENTRALIZED ARCHITECTURE ("Building Block" Design)

```
career-guidance/
├── src/
│   ├── lib/
│   │   ├── routing-manager.ts       # 🚦 Central "Network Manager" - ALL routing in one place
│   │   ├── data-export/             # 📦 Export ANY data in ANY format
│   │   │   └── index.ts
│   │   ├── ai-features/             # 🤖 AI features that make platform tempting
│   │   │   └── index.ts
│   │   ├── gamification/            # 🎮 Gamification for engagement
│   │   │   └── index.ts
│   │   └── db/
│   │       ├── schema.ts            # Database schema (Drizzle ORM)
│   │       └── tenant.ts            # Multi-tenancy helpers
│   │
│   ├── design-system/               # 🎨 Central design tokens (easy UX changes)
│   │   └── tokens/
│   │       └── index.ts
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── portal-sidebar.tsx   # Universal sidebar for all portals
│   │   │   └── crud-card.tsx        # Reusable CRUD component
│   │   ├── ai/
│   │   │   └── career-coach.tsx     # AI Career Coach chatbot
│   │   └── data/
│   │       └── data-manager.tsx     # Universal data manager
│   │
│   └── app/
│       ├── api/
│       │   ├── data-export/         # Export API
│       │   │   └── route.ts
│       │   ├── reports/             # Report generation
│       │   │   └── route.ts
│       │   ├── ai/
│       │   │   └── career-coach/    # AI Coach API
│       │   │       └── route.ts
│       │   └── admin/
│       │       └── insights/        # Data insights for company
│       │           └── route.ts
│       │
│       ├── student/                 # Student portal
│       ├── teacher/                 # Teacher portal
│       ├── parent/                  # Parent portal
│       ├── counselor/               # Counselor portal
│       └── admin/                   # Admin portal
```

---

## 🎲 USER ROLES & PORTALS

| Role | Portal | Main Purpose | Key Features |
|------|--------|--------------|--------------|
| **Student** | `/student/*` | Career exploration | Assessments, AI Coach, Career Matches, Study Planner, Journal |
| **Teacher** | `/teacher/*` | Class management | View student progress, Assign assessments, Class insights |
| **Parent** | `/parent/*` | Child monitoring | View child's progress, Career matches, Plans |
| **Counselor** | `/counselor/*` | Student guidance | Manage students, Generate reports, Data export |
| **Admin** | `/admin/*` | Platform management | All data access, Insights, Settings |

---

## 🤖 AI FEATURES (The Tempting Parts)

These features make students, teachers, and schools WANT to use the platform:

| Feature | Why Users Love It | Data We Get |
|---------|------------------|-------------|
| **AI Career Coach** | 24/7 chatbot for career questions | Career interests, concerns, engagement |
| **AI Career Predictor** | Shows "success probability" for careers | Career preferences, confidence levels |
| **AI Skill Gap Analyzer** | Shows exactly what skills to learn | Skill assessments, learning paths |
| **AI Essay Reviewer** | Free essay editing | Writing topics, quality metrics |
| **AI Study Planner** | Creates personalized schedules | Study patterns, optimal times |
| **AI Mood Tracker** | Emotional support | Wellness data, intervention points |
| **AI Interview Coach** | Practice without embarrassment | Interview skills, confidence |
| **AI Scholarship Matcher** | Find free money | Financial need, eligibility |

---

## 📊 DATA WE COLLECT (The Company Asset)

### Primary Data Categories

1. **Career Interest Data**
   - Which careers students explore
   - How interests change over time
   - Personality → Career correlations

2. **Skill Gap Data**
   - What skills students need vs. have
   - Learning resource preferences
   - Training program opportunities

3. **Engagement Data**
   - When students use the platform
   - Which features are most popular
   - Session duration and frequency

4. **Academic Data**
   - Exam results and career correlations
   - Subject preferences
   - Performance trends

5. **Behavioral Data**
   - Decision-making patterns
   - Family involvement (parent portal)
   - Counselor interactions

### Data Value

```
Per Student Profile Value: $25-$50
Total Users: ~1,000 (example)
Estimated Platform Value: $25,000 - $50,000
```

### Monetization Opportunities

1. **Sell Data Insights to Colleges** - "What careers are students interested in?"
2. **Lead Generation** - Connect colleges with interested students
3. **Targeted Courses** - Sell training based on skill gaps identified
4. **Research Partnerships** - Academic institutions pay for access
5. **Recruitment Tools** - Companies hire based on assessment data

---

## 🎨 DESIGN SYSTEM (Easy UX Changes)

```typescript
// src/design-system/tokens/index.ts
export const colors = {
  primary: { ... },      // Hunter Green
  secondary: { ... },    // Powder Blue
  accent: { ... },       // Oxidized Iron
  neutral: { ... },      // Ash Grey
};

export const roleThemes = {
  student: { primary: colors.primary[600], gradient: "..." },
  teacher: { primary: colors.secondary[600], gradient: "..." },
  // etc.
};
```

**To change the entire platform design**: Edit ONE file (`tokens/index.ts`)

---

## 🚦 ROUTING MANAGER (Network Manager)

All ecosystem routing in ONE place:

```typescript
// src/lib/routing-manager.ts
export const portalConfigs = {
  student: {
    basePath: "/student",
    theme: { primary: "hunter-green", gradient: "..." },
    routes: [ ... ]
  },
  teacher: { ... },
  parent: { ... },
  counselor: { ... },
  admin: { ... },
};

// Helper functions
export function getRoutesForRole(role)
export function canAccessPath(role, path)
export function getDefaultRouteForRole(role)
```

**To change any route or navigation**: Edit ONE file (`routing-manager.ts`)

---

## 📦 DATA EXPORT (Flexible & Portable)

Export ANY data in ANY format:

```typescript
// POST /api/data-export
{
  dataSource: "riasecResults" | "users" | "careerMatches" | ...,
  format: "json" | "csv" | "xml" | "excel" | "pdf",
  fields: ["hollandCode", "traits"], // Optional: specific fields
  filters: { schoolId: "..." },      // Optional: filter
  anonymize: true                    // Optional: remove PII
}
```

**Available Data Sources** (14 total):
- users, assessments, riasecResults, mbtiResults, discResults
- workValuesResults, learningStylesResults, careerMatches
- careerPlans, examResults, journalEntries, consentRecords
- classes, tenants, schools

---

## 🎮 GAMIFICATION (Addictive Elements)

```typescript
// XP Points
- Complete assessment: +100 XP
- Ask AI Coach: +10 XP
- Study plan follow: +25 XP
- Save scholarship: +20 XP

// Levels
Explorer → Pathfinder → Navigator → Discoverer → Achiever → ...

// Badges
"First Steps", "Assessment Master", "Curious Mind", "Unstoppable"

// Daily Goals
- Take an assessment (+50 XP)
- Explore 5 careers (+30 XP)
- Ask AI 3 questions (+20 XP)
- Write journal entry (+25 XP)
```

---

## 📈 DATA INSIGHTS API

For the company to see data value:

```
GET /api/admin/insights?category=career-trends
GET /api/admin/insights?category=skill-gaps
GET /api/admin/insights?category=engagement
GET /api/admin/insights?category=regional
GET /api/admin/insights?category=academic-correlation
```

**Returns**:
- Top career interests (trending up/down)
- Skill gaps in the market
- Engagement metrics
- Regional differences
- Academic ↔ Career correlations
- Monetization opportunities

---

## 🔒 MULTI-TENANCY & SECURITY

```typescript
// src/lib/db/tenant.ts
export async function requireAuth()
export function canAccessSchool(user, schoolId)
export function canAccessResource(user, resourceTenantId, allowedRoles)
```

Every API route uses these helpers to ensure:
- Users only see their own data (or their school's)
- Role-based access control
- Tenant isolation

---

## 🚀 HOW TO EXTEND (Easy Upgrades)

### Add a New Portal (e.g., "Alumni")
1. Add role to `UserRole` type
2. Add config to `portalConfigs` in `routing-manager.ts`
3. Create `/src/app/alumni/layout.tsx`
4. Done! Navigation, theme, everything auto-configured

### Add a New Data Source for Export
1. Add to `dataSources` in `data-export/index.ts`
2. Table name, fields, everything defined there
3. Automatically available in DataManager component

### Add a New AI Feature
1. Add to `aiFeatures` array in `ai-features/index.ts`
2. Define data points it captures
3. Add "tempt factor" description

### Change Entire Platform Design
1. Edit `src/design-system/tokens/index.ts`
2. Change colors, spacing, typography
3. Updates everywhere automatically

---

## 📋 ASSESSMENT TYPES

| Assessment | Target | Purpose |
|------------|--------|---------|
| RIASEC | All | Holland Code (R-I-A-S-E-C) |
| MBTI | Grade 11+ | Personality Types (16 types) |
| DISC | All | Behavioral Style (D-I-S-C) |
| Work Values | Grade 10+ | What matters in a job |
| Learning Styles | All | VARK (Visual, Auditory, Read/Write, Kinesthetic) |
| Career Spark Lite | Grade 8- | World of work exploration |
| Career Spark Basic | Grade 9-10 | Stream/subject selection |
| Career Spark Advanced | Grade 11-12 | College/career decisions |

---

## 🎯 KEY FILES SUMMARY

| File | Purpose | Edit For |
|------|---------|----------|
| `lib/routing-manager.ts` | All routing config | Add routes, change navigation |
| `design-system/tokens/index.ts` | Design tokens | Change colors, fonts, spacing |
| `lib/data-export/index.ts` | Data export config | Add data sources, formats |
| `lib/ai-features/index.ts` | AI features config | Add AI capabilities |
| `lib/gamification/index.ts` | Gamification config | Change XP, levels, badges |
| `lib/db/schema.ts` | Database schema | Add tables, fields |
| `lib/db/tenant.ts` | Security helpers | Add access rules |
| `components/shared/portal-sidebar.tsx` | Universal sidebar | Sidebar appearance |
| `components/shared/crud-card.tsx` | Reusable CRUD | Data management UI |

---

## 💡 THE STRATEGY

1. **Make it Tempting** - AI features that students actually want to use
2. **Make it Addictive** - Gamification keeps them coming back
3. **Make it Flexible** - Export data in any format, easy to upgrade
4. **Make it Valuable** - Every interaction generates data insights
5. **Make it Centralized** - One place to change routing, design, data sources

**Result**: Schools love the platform → Students use it daily → We collect valuable data → Company grows

---

## 🔄 DATA FLOW

```
User Action (e.g., "Ask AI about careers")
    ↓
API Route (e.g., /api/ai/career-coach)
    ↓
AI Processing + User Profile Context
    ↓
Response + Interaction Tracking
    ↓
Data Stored (for insights)
    ↓
Admin Can View Insights
    ↓
Admin Can Export Data
```

---

This architecture ensures:
- ✅ Easy to upgrade (modular design)
- ✅ Easy to change design (centralized tokens)
- ✅ Easy to add features (routing manager)
- ✅ Data is portable (export system)
- ✅ Data is valuable (insights API)
- ✅ Users are engaged (AI + gamification)
