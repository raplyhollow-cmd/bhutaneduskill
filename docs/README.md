# Bhutan EduSkill Documentation

Welcome to the Bhutan EduSkill documentation. This is a B2B SaaS multi-tenant school management platform with integrated career guidance for Bhutan middle schools (Class 6-12).

---

## Quick Start

| Document | Description |
|----------|-------------|
| **[Development Framework](DEVELOPMENT_FRAMEWORK.md)** | **READ THIS FIRST** - Single source of truth for all coding rules and patterns |
| [Setup Guide](guides/setup.md) | Environment setup and first run instructions |
| [Changelog](CHANGELOG.md) | Version history and notable changes |

---

## Documentation Index

### 📚 Guides

How-to guides for common development tasks.

| Document | Description |
|----------|-------------|
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
| [Portal Routes](architecture/portal-routes.md) | All portal routes and pages |
| [File Structure](architecture/file-structure.md) | Project file organization |
| [Vision Objectives](architecture/vision-objectives.md) | Project vision and goals |

---

### 🎨 Design

UI/UX standards and design system.

| Document | Description |
|----------|-------------|
| [UX Standards](design/ux-standards.md) | UX design standards |
| [Portal Colors](design/portal-colors.md) | Color schemes for each portal |
| [Component Patterns](design/component-patterns.md) | Component usage patterns |
| [Advanced UX/UI](design/advanced-ux-ui.md) | Premium UX patterns |

---

### 📋 Plans

Active implementation plans and roadmap.

| Document | Description |
|----------|-------------|
| [Roadmap](plans/roadmap.md) | Feature roadmap and priorities |
| [AI Features](plans/ai-features.md) | AI integration plan |
| [Ministry Portal](plans/ministry-portal.md) | Ministry portal implementation |
| [Mobile App](plans/mobile-app.md) | Mobile app progress |
| [Mobile Progress](plans/mobile-progress.md) | Mobile implementation status |
| [AI Insights](plans/ai-insights.md) | AI dashboard integration |

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
| **Database** | 90+ tables |
| **API Routes** | 50+ protected routes |

---

## Key Resources

| Resource | Location |
|----------|----------|
| Development Framework | [docs/DEVELOPMENT_FRAMEWORK.md](DEVELOPMENT_FRAMEWORK.md) |
| CLAUDE.md (Project Rules) | [CLAUDE.md](../CLAUDE.md) |
| MEMORY.md (Project Memory) | [MEMORY.md](../MEMORY.md) |
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

**Last Updated:** 2026-02-16
