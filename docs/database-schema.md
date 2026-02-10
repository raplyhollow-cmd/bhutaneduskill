# Database Schema

## Overview

This project uses Drizzle ORM with SQLite (local) and Neon (production). The main schema is defined in `src/lib/db/schema.ts` with 40+ tables.

---

## Core Tables

### Users & Authentication

```
users                    # All user types
├── id, tenant_id, school_id
├── type (student/teacher/parent/admin/counselor)
├── email, phone
├── first_name, last_name
├── clerk_user_id (Clerk integration)
└── role-specific fields
```

### School Structure

```
tenants                  # Multi-tenant organizations
schools                  # Individual schools
districts                # Bhutan districts
classes                  # School classes
subjects                 # School subjects
academic_terms           # Semesters/terms
```

### Assessments

```
assessments              # Assessment instances
assessment_types         # Assessment templates
questions                # Assessment questions
riasec_results           # RIASEC results
mbti_results             # MBTI results
disc_results             # DISC results
work_values_results      # Work values results
learning_styles_results  # Learning styles results
```

### School Operations

```
homework                  # Homework assignments
homework_submissions     # Student submissions
attendance               # Attendance records
attendance_sessions      # Kiosk sessions
exam_results             # Exam results
exam_results_enhanced    # Detailed results
```

### Learning

```
learning_modules         # Online courses
module_progress          # Student progress
```

### Tuition

```
tuition_categories       # Subject categories
tutors                   # Teacher profiles
tuition_courses          # Course listings
tuition_enrollments      # Student enrollments
live_sessions            # Live class sessions
tutor_reviews            # Reviews
tutor_earnings           # Payment tracking
physical_tuition_requests # Location-based requests
```

### Fees

```
fee_structures           # Fee templates
student_fees             # Student fee records
fee_payments             # Payment transactions
```

### Career & Content

```
careers                  # Career database
career_matches           # Assessment-career matching
colleges                 # College information
rub_programs             # RUB programs
scholarships             # Scholarship database
career_plans             # Student career plans
counselor_notes          # Counselor notes
```

---

## Key Schema Files

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Main schema (40+ tables) |
| `src/lib/db/schema-content.ts` | Content schemas |
| `src/lib/db/index.ts` | Database connection |
