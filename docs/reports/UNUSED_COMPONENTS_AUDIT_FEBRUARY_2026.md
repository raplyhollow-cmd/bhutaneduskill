# UNUSED COMPONENTS AUDIT REPORT

> **Date:** February 25, 2026
> **Agent:** Component Integration Specialist
> **Trigger:** User request - "so many things were created but never used"
> **Finding:** 35% of UI components (17 of 48) are completely unused

---

## Executive Summary

**Sprint 1 "UX Revolution" created 50+ components, but only 50% are actually used in the application.**

The "B+" UX audit graded based on COMPONENT EXISTENCE, not ACTUAL INTEGRATION. This audit reveals the true scope of the integration gap.

---

## Critical Finding: Demo Page Trap

**4 Main UX Components Only Exist in `/ux-demo`:**

| Component | Status | Problem |
|-----------|--------|---------|
| `express-add-modal.tsx` | 🔴 Demo only | Quick-add feature shown on demo page, never integrated |
| `in-place-editor.tsx` | 🔴 Demo only | Click-to-edit feature shown on demo page, never integrated |
| `progressive-form.tsx` | 🔴 Demo only | Typeform-style wizard shown on demo page, never integrated |
| `command-palette.tsx` | 🟡 Partial | Only in admin portal, missing from 6 other portals |

**Root Cause:** Components were created, demoed at `/ux-demo`, but never migrated to production pages.

---

## Components Created But NEVER Used (17 total)

| Component | Location | Notes |
|-----------|----------|-------|
| **ceramic-table.tsx** | `src/components/ui/` | Only in docs patterns |
| **ceramic-navigation.tsx** | `src/components/ui/` | Only in docs patterns |
| **ceramic-callout.tsx** | `src/components/ui/` | Only in docs patterns |
| **express-add-modal.tsx** | `src/components/ui/` | **ONLY in `/ux-demo` page** |
| **in-place-editor.tsx** | `src/components/ui/` | **ONLY in `/ux-demo` page** |
| **progressive-form.tsx** | `src/components/ui/` | **ONLY in `/ux-demo` page** |
| **feature-card.tsx** | `src/components/ui/` | Only in docs |
| **user-button.tsx** | `src/components/ui/` | Only in docs patterns |
| **form-input.tsx** | `src/components/ui/` | **UNUSED - uses standard input instead** |
| **label.tsx** | `src/components/ui/` | **UNUSED** |
| **error-message.tsx** | `src/components/ui/` | **UNUSED** |
| **empty-state.tsx** | `src/components/ui/` | Only references itself |
| **separator.tsx** | `src/components/ui/` | **UNUSED** |
| **scroll-area.tsx** | `src/components/ui/` | **UNUSED** |
| **card-skeleton.tsx** | `src/components/ui/skeleton/` | **UNUSED** |
| **list-skeleton.tsx** | `src/components/ui/skeleton/` | **UNUSED** |
| **table-skeleton.tsx** | `src/components/ui/skeleton/` | **UNUSED** |

---

## Experimental Directory (100% Unused)

**`src/components/ui-next/`** - NOT FOUND in codebase:
- Documentation referenced this folder, but it never existed in the repository
- No `*next.tsx` files found anywhere in the codebase
- Git history shows no commits for this directory
- STATUS: Task CI-208 completed - Folder never existed, no action needed

---

## Only in Demo/Docs (7 components)

These exist, work, but are only shown in demo pages or documentation:

| Component | Demo Location | Should Be In |
|-----------|---------------|--------------|
| ExpressAddModal | `/ux-demo` | Student/Teacher quick-add modals |
| InPlaceEditor | `/ux-demo` | Grade editing, name editing |
| ProgressiveForm | `/ux-demo` | Onboarding wizards |
| CeramicTable | `/docs` | Data tables across portals |
| FeatureCard | `/docs` | Pricing, feature highlights |
| UserButton | `/docs` | Account switching |
| FullScreenModal | `/docs` | Mobile flows |

---

## Toaster System Paradox

**Two toast systems exist:**

| System | Location | Usage |
|--------|----------|-------|
| `toast.tsx` | `src/components/ui/` | ✅ ACTUALLY USED (simple) |
| `toaster/` folder | `src/components/ui/toaster/` | ❌ UNUSED (full-featured Clerk-style) |

**The better, more complete toast system exists but isn't integrated!**

---

## Skeleton Components Not Deployed

| Component | Status | Should Be Used In |
|-----------|--------|-------------------|
| `card-skeleton.tsx` | Unused | Dashboard loading, card grids |
| `list-skeleton.tsx` | Unused | Student lists, teacher lists |
| `table-skeleton.tsx` | Unused | Data tables everywhere |
| `shimmer-skeleton.tsx` | Self-reference | Should be imported by others |

---

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total UI component files** | 48 | 100% |
| **Actively used in app** | 24 | 50% |
| **Only in demo/docs** | 7 | 15% |
| **Completely unused** | 17 | 35% |

---

## Why This Happened

1. **Component Creation ≠ Integration**: Sprint 1 focused on CREATING components, not INTEGRATING them
2. **Demo Page Trap**: `/ux-demo` became a graveyard for "showcase" components
3. **No Owner**: Before v2.0, no agent was responsible for integration
4. **Audit Gap**: UX audit checked component existence, not actual usage

---

## Recommendations (Priority Order)

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 HIGH | Integrate ExpressAddModal for quick-add flows | Faster UX |
| 🔴 HIGH | Deploy Command Palette to all 7 portals | Cmd+K everywhere |
| 🟡 MEDIUM | Replace toast.tsx with toaster/ system | Better notifications |
| 🟡 MEDIUM | Add InPlaceEditor to grade/name editing | Edit where you read |
| 🟡 MEDIUM | Deploy skeleton loaders | Better loading states |
| 🟢 LOW | Use ProgressiveForm for onboarding | Better conversion |
| 🟢 LOW | Delete unused ceramic-* components | Reduce bundle size |
| 🟢 LOW | Archive ui-next/ or integrate it | Clean up experimental |

---

## Office Action Required

**Agent:** Component Integration Specialist
**Task:** Begin integration of highest-value unused components
**Timeline:** Sprint 2 Phase 3

**Phase 3 Priorities:**
1. ExpressAddModal integration (30 min each × 5 forms)
2. Command Palette deployment to remaining 6 portals (1 hour)
3. Skeleton loader deployment (30 min)
4. Toaster system migration (1 hour)

---

**Report Prepared:** February 25, 2026
**Agent ID:** a0344c74b97f5476b
**Audit Duration:** 8.5 minutes
**Files Scanned:** 91 tool uses across 48 components
