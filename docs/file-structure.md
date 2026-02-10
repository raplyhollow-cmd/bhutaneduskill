# Project File Structure

## Overview

Next.js 16 App Router project with TypeScript, organized by feature and functionality.

---

## Directory Structure

```
career-guidance/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Auth routes
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── admin/                   # Platform admin
│   │   ├── counselor/               # Counselor portal
│   │   ├── dashboard/               # Public dashboard
│   │   │   ├── assessment/          # Assessment pages
│   │   │   ├── careers/             # Career exploration
│   │   │   ├── plan/                # Career planning
│   │   │   └── [feature pages]
│   │   ├── parent/                  # Parent portal
│   │   ├── portal/                  # Generic portals
│   │   ├── school-admin/            # School admin portal
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── classes/
│   │   │   ├── subjects/
│   │   │   ├── attendance/
│   │   │   ├── homework/
│   │   │   ├── results/
│   │   │   ├── fees/
│   │   │   ├── tuition/
│   │   │   ├── analytics/
│   │   │   └── counselors/
│   │   ├── student/                 # Student portal
│   │   │   ├── dashboard/
│   │   │   ├── homework/
│   │   │   ├── learning/
│   │   │   ├── tuition/
│   │   │   ├── attendance/
│   │   │   └── fees/
│   │   ├── teacher/                 # Teacher portal
│   │   │   ├── homework/
│   │   │   ├── learning/
│   │   │   └── attendance/
│   │   ├── api/                     # API routes
│   │   ├── about/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── assessment/              # Assessment components
│   │   ├── attendance/              # Attendance components
│   │   ├── fees/                    # Fee components
│   │   ├── homework/                # Homework components
│   │   ├── learning/                # Learning components
│   │   ├── tuition/                 # Tuition components
│   │   ├── ai/                      # AI features
│   │   ├── data/                    # Data management
│   │   ├── shared/                  # Shared components
│   │   └── theme-toggle.tsx
│   │
│   ├── lib/
│   │   ├── db/                      # Database
│   │   │   ├── schema.ts            # Main schema (40+ tables)
│   │   │   ├── schema-content.ts    # Content schemas
│   │   │   └── [schema files]
│   │   ├── assessments/             # Assessment algorithms
│   │   │   ├── riasec.ts
│   │   │   ├── mbti.ts
│   │   │   ├── disc.ts
│   │   │   └── [others]
│   │   ├── payment/                 # Payment integration
│   │   │   └── rma-gateway.ts       # RMA Bhutan
│   │   ├── auth-utils.ts            # Auth helpers
│   │   ├── riasec.ts                # RIASEC calculations
│   │   ├── tenant.ts                # Multi-tenancy
│   │   ├── rate-limit.ts            # API rate limiting
│   │   ├── validation.ts            # Input validation
│   │   ├── bcse/                    # BCSE integration
│   │   ├── data-export/             # Data export utilities
│   │   ├── ai-features/             # AI features
│   │   └── [utilities]
│   │
│   └── types/                       # TypeScript types
│
├── scripts/                          # Utility scripts
│   ├── setup-db.ts
│   └── migrate-db.ts
│
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
└── drizzle.config.ts                 # Drizzle config
```

---

## Component Organization

### UI Components (`src/components/ui/`)
shadcn-inspired reusable components (buttons, inputs, cards, etc.)

### Feature Components
- `assessment/` - RIASEC, MBTI, DISC test components
- `attendance/` - Attendance tracking, reports
- `homework/` - Creation, grading, submission
- `learning/` - Module viewer, creator, certificates
- `fees/` - Fee management, payments
- `tuition/` - Course listings, tutor profiles

### Shared Components (`src/components/shared/`)
- `portal-sidebar.tsx` - Main sidebar for all portals
- `portal-header.tsx` - Header component
- `crud-card.tsx` - Generic CRUD operations

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout (Clerk auth wrapper) |
| `src/lib/db/schema.ts` | Database schema (40+ tables) |
| `src/components/shared/portal-sidebar.tsx` | Main sidebar component |
