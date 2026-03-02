# Bhutan EduSkill Documentation

Welcome to the Bhutan EduSkill documentation. This is a B2B SaaS multi-tenant school management platform with integrated career guidance for Bhutan middle schools (Class 6-12).

---

## Quick Start

| Document | Description |
|----------|-------------|
| **[Development Framework](DEVELOPMENT_FRAMEWORK.md)** | **READ THIS FIRST** - Single source of truth for all coding rules and patterns |
| **[Change Control Process](change-control-process.md)** | **NEW** - Review and approval process for zero technical debt |
| [Setup Guide](guides/setup.md) | Environment setup and first run instructions |
| [Changelog](CHANGELOG.md) | Version history and notable changes |

---

## Documentation Index

### 📚 Guides

How-to guides for common development tasks.

| Document | Description |
|----------|-------------|
| [Change Control Process](change-control-process.md) | Code review and approval workflow for zero technical debt |
| [Setup](guides/setup.md) | Environment setup and installation |
| [Authentication](guides/authentication.md) | Authentication patterns and RBAC |
| [API Development](guides/api-development.md) | Creating API routes |
| [Deployment](guides/deployment.md) | Deployment procedures |

---

### 🏗️ Architecture

Technical architecture documentation.

| Document | Description |
|----------|-------------|
| [Overview](architecture/overview.md) | Platform ecosystem overview |
| [Technology Stack](architecture/technology-stack.md) | Complete technology stack |
| [Database Schema](architecture/database-schema.md) | 90+ database tables |
| [Database Schema Audit](DATABASE_SCHEMA_AUDIT_2026.md) | **NEW** - Complete schema analysis (180 tables, evolve not redo) |
| [Database Schema Reference](database-schema-reference.md) | Quick reference for 21 core tables |
| [Portal Routes](architecture/portal-routes.md) | All portal routes and pages |
| [File Structure](architecture/file-structure.md) | Project file organization |
| [Vision Objectives](architecture/vision-objectives.md) | Project vision and goals |

---

### 🎨 Design

UI/UX standards and design system.

| Document | Description |
|----------|-------------|
| [UX Audit Report](ux-audit-report.md) | Original UX analysis (B- grade, 78/100) |
| [UX Audit - February 2026](UX_AUDIT_FEBRUARY_2026.md) | **NEW** - Updated audit (B+ grade, 85/100) - 50+ new components |
| [UX Revolution Components](UX_REVOLUTION_COMPONENTS.md) | Clerk-style "no-save-button" components |
| [Database Schema Reference](database-schema-reference.md) | Quick reference for 21 core tables |
| [UX Standards](design/ux-standards.md) | UX design standards |
| [Portal Colors](design/portal-colors.md) | Color schemes for each portal |
| [Component Patterns](design/component-patterns.md) | Component usage patterns |
| [Advanced UX/UI](design/advanced-ux-ui.md) | Premium UX patterns |

**Design System Files:**
| File | Description |
|------|-------------|
| `src/styles/design-tokens.ts` | Complete design token library (colors, typography, spacing, animations) |
| `docs/ux-audit-report.md` | Full UX audit with competitor benchmarks and fix recommendations |

---

### 📋 Plans

Active implementation plans and roadmap.

| Document | Description |
|----------|-------------|
| [Roadmap](plans/roadmap.md) | Feature roadmap and priorities |
| [API & Schema Optimization](plans/api-schema-optimization.md) | **NEW** - Make project smaller, smarter, faster (~2,200 lines reduction) |
| [AI Features](plans/ai-features.md) | AI integration plan |
| [Ministry Portal](plans/ministry-portal.md) | Ministry portal implementation |
| [Mobile App](plans/mobile-app.md) | Mobile app progress |
| [Mobile Progress](plans/mobile-progress.md) | Mobile implementation status |
| [AI Insights](plans/ai-insights.md) | AI dashboard integration |

---

### 📊 Competitive Intelligence

Market research and competitive analysis.

| Document | Description |
|----------|-------------|
| [Competitive Intelligence Report](competitive-intelligence-report.md) | **NEW** - Global school management platform analysis (15+ competitors) |
| [Feature Comparison Matrix](competitive-feature-matrix.md) | **NEW** - Detailed feature-by-feature comparison with competitors |
| [Quick Wins Implementation Guide](competitive-quick-wins-guide.md) | **NEW** - Fast-track implementation specs for 5 high-impact features |

---

### ⚖️ Legal & Compliance

Legal documentation and compliance templates.

| Document | Description |
|----------|-------------|
| [Legal Compliance Audit](legal-compliance-audit.md) | **NEW** - Complete legal compliance audit (52% score) |
| [Legal Templates](legal/README.md) | **NEW** - Privacy policy, ToS, parental consent templates |

---

### 📊 Reports

Audits, assessments, and monthly reports.

| Document | Description |
|----------|-------------|
| [Monthly Report - February 2026](MONTHLY_REPORT_FEBRUARY_2026.md) | **NEW** - Complete project status, achievements, roadmap |

---

### 📦 Archive

Historical documents and completed work.

| Folder | Contents |
|--------|----------|
| [archive/build-reports](archive/build-reports/) | Old build success reports |
| [archive/change-logs](archive/change-logs/) | Historical change records |
| [archive/session-logs](archive/session-logs/) | Development session summaries |
| [archive/outdated-plans](archive/outdated-plans/) | Completed implementation plans |

---

## Project Overview

| Property | Value |
|----------|-------|
| **Type** | B2B SaaS |
| **Target** | Bhutan Middle Schools (Class 6-12) |
| **Model** | Subscription-based (per user/seat) |
| **Portals** | 7 (Student, Teacher, Parent, Counselor, School Admin, Platform Admin, Ministry) |
| **Tech Stack** | Next.js 16, TypeScript, Neon PostgreSQL, Clerk, Vercel |
| **Database** | 145+ tables |
| **API Routes** | 350+ protected routes |
| **Design System** | 800+ line design token library |

---

## Key Resources

| Resource | Location |
|----------|----------|
| Development Framework | [docs/DEVELOPMENT_FRAMEWORK.md](DEVELOPMENT_FRAMEWORK.md) |
| Change Control Process | [docs/change-control-process.md](change-control-process.md) |
| CLAUDE.md (Project Rules) | [CLAUDE.md](../CLAUDE.md) |
| MEMORY.md (Project Memory) | [MEMORY.md](../MEMORY.md) |
| Agent Team Structure | [AGENT_TEAM.md](../AGENT_TEAM.md) |
| Agent Activity Log | [docs/agent-activity-log.md](agent-activity-log.md) |
| Project Status Summary | [docs/project-status-summary.md](project-status-summary.md) |
| Project README | [README.md](../README.md) |

---

## Quick Reference

### Portal Routes

| Portal | Route | Color |
|--------|-------|-------|
| Student | `/student` | Orange |
| Teacher | `/teacher` | Blue |
| Parent | `/parent` | Gray |
| Counselor | `/counselor` | Purple |
| School Admin | `/school-admin` | Violet |
| Platform Admin | `/admin` | Pink |
| Ministry | `/ministry` | Purple/Violet |

### Common Commands

```bash
npm run dev          # Start dev server (port 3003)
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npx tsc --noEmit     # Type check without build
```

---

## Documentation Standards

When contributing documentation:

1. **Use clear headings** - Markdown `##` for sections
2. **Include code examples** - Use proper syntax highlighting
3. **Add cross-references** - Link to related docs
4. **Update the changelog** - Document notable changes
5. **Follow naming conventions** - kebab-case for filenames

---

## Need Help?

- Check the [Development Framework](DEVELOPMENT_FRAMEWORK.md) first
- Search the [Troubleshooting section](DEVELOPMENT_FRAMEWORK.md#11-troubleshooting)
- Review archived [session logs](archive/session-logs/) for similar issues

---

**Last Updated:** 2026-02-25
