# Architecture Documentation

This section contains technical architecture documentation for the Bhutan EduSkill platform.

## Documents

| Document | Description |
|----------|-------------|
| [Overview](overview.md) | Platform ecosystem and architecture overview |
| [Technology Stack](technology-stack.md) | Complete technology stack and dependencies |
| [Database Schema](database-schema.md) | 90+ database tables and relationships |
| [Portal Routes](portal-routes.md) | All portal routes and pages |
| [File Structure](file-structure.md) | Project file organization |
| [Vision Objectives](vision-objectives.md) | Project vision and goals |
| [Database Testing](database-testing.md) | Database test coverage and procedures |

## Quick Reference

### Portals
- Student (`/student`) - Orange gradient
- Teacher (`/teacher`) - Blue gradient
- Parent (`/parent`) - Gray gradient
- Counselor (`/counselor`) - Purple gradient
- School Admin (`/school-admin`) - Violet gradient
- Platform Admin (`/admin`) - Pink gradient
- Ministry (`/ministry`) - Purple/Violet gradient

### Database
- **Tables:** 90+
- **Key Tables:** users, schools, assessments, careers, user_roles
- **Type:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM

### Tech Stack
- **Framework:** Next.js 16
- **Language:** TypeScript
- **Auth:** Clerk
- **Hosting:** Vercel
