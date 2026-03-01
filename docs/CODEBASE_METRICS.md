# Bhutan EduSkill - Codebase Metrics
**Last Updated:** March 1, 2026

---

## 📊 Overview

| Metric | Count |
|--------|-------|
| **API Routes** | 378 |
| **Components** | 250 |
| **Page Routes** | 231 |
| **Schema Tables** | 109 |
| **Foreign Keys** | 100+ |
| **Lines of Code** | ~50,000+ |

---

## 🔌 API Routes (378 total)

| Portal | APIs | Pages |
|--------|------|-------|
| Student | 36 | 49 |
| Teacher | 27 | 23 |
| Parent | 24 | 18 |
| Counselor | 18 | 17 |
| Admin | 58 | 31 |
| School Admin | 50 | 47 |
| Ministry | 12 | 13 |
| **Shared** | **153** | **33** |

---

## 🎨 Components (250 total)

| Category | Count |
|----------|-------|
| UI Components (shadcn/ui) | 46 |
| Admin Components | 33 |
| Student Components | 5 |
| Teacher Components | 3 |
| Other/Shared | 163+ |

---

## 🗄️ Database Schema (109 tables)

### Core Tables
- `users` - User accounts
- `schools` - School records
- `students` - Student profiles
- `teachers` - Teacher profiles
- `parents` - Parent profiles
- `counselors` - Counselor profiles
- `classes` - Class/section records
- `enrollments` - Student-class enrollment
- `subjects` - Subject catalog
- `assessments_*` - Assessment results (RIASEC, MBTI, DISC, etc.)

### RBAC Tables
- `user_roles` - User role assignments
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mapping

### Key Relationships
```
users ─┬─→ students, teachers, parents, counselors, school_admins
schools ←─ students, teachers, classes
classes ←─ enrollments, homework, attendance
users (parents) ←─ parent_to_student ─→ users (students)
```

---

## 🔐 Authentication & Authorization

| Component | Technology |
|-----------|------------|
| Auth Provider | Clerk |
| RBAC | Custom (`user_roles`, `permissions`) |
| Middleware | `src/middleware.ts` |
| Auth Helper | `src/lib/auth-utils.ts` (`requireAuth()`) |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (109 tables) |
| `src/config/portal-config.ts` | Portal navigation config |
| `src/lib/auth-utils.ts` | Authentication helpers |
| `src/middleware.ts` | CORS + security headers |
| `drizzle.config.ts` | Drizzle ORM config |

---

## 🆕 Recent Additions (March 1, 2026)

| Item | Route |
|------|-------|
| Essay Reviewer | `/student/essay-reviewer` |
| Study Planner | `/student/study-planner` |
| Mood Tracker | `/counselor/mood-tracker` |
| Parent Journal API | `/api/parent/journal` |
