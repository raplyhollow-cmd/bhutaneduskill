# Design Sync & Migration Plan
## Bhutan EduSkill Platform - UX/UI Coordination

**Date:** February 25, 2026
**Status:** Strategic Planning
**Coordinator:** UX/UI Sync Team

---

## Executive Summary

Multiple design teams have been working in parallel on the Bhutan EduSkill platform. This document assesses the current state, identifies integration gaps, and provides a structured migration plan to synchronize all design work into a cohesive system.

**Overall Assessment:** Teams are partially aligned but have created parallel systems that need integration.

**Critical Finding:** We have 3 parallel design systems that need to be unified:
1. **Legacy `ui/` components** - Using shadcn/ui + Ceramic variables
2. **New `ui-next/` components** - Modern Clerk-inspired design
3. **Design tokens** (`design-tokens.ts`) - Comprehensive but underutilized

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Design Team Outputs](#design-team-outputs)
3. [Gap Analysis](#gap-analysis)
4. [Consistency Issues](#consistency-issues)
5. [Migration Phases](#migration-phases)
6. [File-by-File Migration List](#file-by-file-migration-list)
7. [Testing Checklist](#testing-checklist)
8. [Rollback Plan](#rollback-plan)

---

## Current State Assessment

### Design Assets Inventory

| Category | Location | Count | Status |
|----------|----------|-------|--------|
| **Design Tokens** | `src/styles/design-tokens.ts` | 800+ lines | ✅ Created, underutilized |
| **New Components** | `src/components/ui-next/` | 6 components | ✅ Created, unused |
| **Layout Components** | `src/components/layouts/` | 7 components | ✅ Created, unused |
| **Motion Components** | `src/components/motion/` | 5 components | ✅ Created, partially used |
| **Legacy Components** | `src/components/ui/` | 32 components | 🔄 In production |
| **Toast System** | `src/components/ui/toast.tsx` | Clerk-style | ✅ Production-ready |
| **Portal Layouts** | `src/app/*/layout.tsx` | 7 portals | 🔄 Mixed patterns |

### Design Systems Comparison

| Aspect | Legacy (`ui/`) | New (`ui-next/`) | Design Tokens |
|--------|---------------|------------------|---------------|
| **Color System** | CSS variables | RGB values | Both (inconsistent) |
| **Spacing** | Tailwind classes | Tailwind classes | Token-based |
| **Border Radius** | `rounded-lg` (8px) | `rounded-xl` (12px) | Token-based |
| **Shadows** | CSS variables | Inline values | Token-based |
| **Animation** | Framer Motion | Framer Motion | Token-based |
| **Typography** | Tailwind classes | Tailwind classes | Token-based |

---

## Design Team Outputs

### 1. UX Audit Team
**File:** `docs/ux-audit-report.md`

**Key Findings:**
- Overall Grade: B- (78/100)
- Inconsistent design token usage
- Over-reliance on gradients
- Border radius inconsistencies
- Excessive padding/margins
- Too many button variants (11 vs recommended 5)

**Recommendations:**
- Standardize to 5 button variants
- Remove all gradients from non-brand elements
- Fix border radius hierarchy (6/8/12px)
- Reduce card padding by 25%
- Use 4px base unit for spacing

### 2. Design Tokens Team
**File:** `src/styles/design-tokens.ts`

**What Was Created:**
- 800+ lines of comprehensive design tokens
- Color palettes (semantic, neutral, dark, portal-specific)
- Typography system (fonts, sizes, weights, line heights)
- Spacing system (4px base unit)
- Border radius scale
- Shadow system (light and dark mode)
- Animation tokens (durations, easing, springs, transitions)
- Z-index scale
- Layout tokens (containers, breakpoints, sidebar widths)

**Status:** Created but not integrated into components

### 3. Component Library Team
**Location:** `src/components/ui-next/`

**Components Created:**
1. `button-next.tsx` - Modern button with proper variants (4 variants, not 11)
2. `card-next.tsx` - Card with 5 variants and proper padding
3. `table-next.tsx` - Table with proper styling and sticky headers
4. `badge-next.tsx` - Badge with semantic variants
5. `dropdown-next.tsx` - Dropdown menu with Radix UI
6. `input-next.tsx` - Input with states and accessibility

**Design Principles Applied:**
- Clerk-inspired ceramic design
- Proper border radius (8px cards, 6px buttons)
- Minimal shadows (borders over shadows)
- Fast animations (150ms)
- Compact spacing

### 4. Layout System Team
**Location:** `src/components/layouts/`

**Components Created:**
1. `page-container.tsx` - Responsive content wrapper
2. `sidebar-layout.tsx` - Sidebar layout component
3. `header.tsx` - Page header component
4. `empty-state.tsx` - Empty state component
5. `grid.tsx` - Grid layout component
6. `stack.tsx` - Stack layout component
7. `cluster.tsx` - Cluster layout component

**Status:** Created but not adopted in pages

### 5. Motion System Team
**Location:** `src/components/motion/`

**Components Created:**
1. `animated-wrapper.tsx` - Animated wrapper component
2. `hover-card.tsx` - Card with hover effects
3. `pressable.tsx` - Pressable interaction
4. `progress-indicator.tsx` - Progress indicator
5. `success-toast.tsx` - Success toast with confetti

**Status:** Partially used

### 6. Toast Notification Team
**Location:** `src/components/ui/toast.tsx`

**What Was Created:**
- Clerk-style toast system
- Top-right positioning
- Smooth slide-in animation (200ms)
- Progress bar for auto-dismiss
- Stacked toasts (max 5 visible)
- Multiple variants (success, error, warning, info, loading)
- `useToast()` hook with convenience methods
- `useUnsavedChangesToast()` hook

**Status:** Production-ready but needs provider setup

### 7. Workflow Innovation Team
**File:** `docs/workflow-innovation-report.md`

**Proposed Patterns:**
1. Command Palette (Raycast-style)
2. Intelligent Input (Linear-style)
3. Progressive Form (Clerk-style)
4. In-Place Editor (Notion-style)
5. Action Bar (Vercel-style)

**Status:** Strategic proposal only

---

## Gap Analysis

### Critical Integration Gaps

| Gap | Impact | Effort |
|-----|--------|--------|
| Design tokens not imported in components | HIGH | Medium |
| `ui-next/` components unused in production | HIGH | Low |
| Inconsistent border radius across systems | MEDIUM | Low |
| Two parallel component systems (`ui/` and `ui-next/`) | HIGH | High |
| Layout components not adopted | MEDIUM | Medium |
| Toast provider not set up in app root | MEDIUM | Low |
| Animation tokens not used | LOW | Low |

### Component Mapping

| Legacy Component | New Component | Action Required |
|-----------------|---------------|-----------------|
| `ui/button.tsx` | `ui-next/button-next.tsx` | Migrate all usages |
| `ui/card.tsx` | `ui-next/card-next.tsx` | Migrate all usages |
| `ui/input.tsx` | `ui-next/input-next.tsx` | Migrate all usages |
| `ui/badge.tsx` | `ui-next/badge-next.tsx` | Migrate all usages |
| `ui/dropdown-menu.tsx` | `ui-next/dropdown-next.tsx` | Migrate all usages |
| `ui/table.tsx` | `ui-next/table-next.tsx` | Migrate all usages |
| N/A | `layouts/page-container.tsx` | Adopt in all pages |
| N/A | `layouts/empty-state.tsx` | Adopt where needed |

---

## Consistency Issues

### 1. Border Radius Inconsistency

| Component | Current Radius | Should Be |
|-----------|---------------|-----------|
| `ui/button.tsx` | `rounded-lg` (8px) | 6px (rounded-md) |
| `ui-next/button-next.tsx` | Hardcoded `0.375rem` (6px) | Use token |
| `ui/card.tsx` | `rounded-xl` (12px) | 8px (rounded-lg) |
| `ui-next/card-next.tsx` | Hardcoded `0.5rem` (8px) | Use token |
| `ui/input.tsx` | `rounded-lg` (8px) | 6px (rounded-md) |
| `ui-next/input-next.tsx` | `rounded-lg` (8px) | 6px (rounded-md) |

### 2. Color System Inconsistency

**Issue:** Three different ways to specify colors across the codebase.

| Method | Example | Usage |
|--------|---------|-------|
| CSS Variables | `var(--ceramic-purple-600)` | Legacy `ui/` components |
| RGB Values | `rgb(132, 107, 255)` | `ui-next/` components |
| Design Tokens | `semantic.primary.DEFAULT` | `design-tokens.ts` |

**Recommendation:** Migrate to design tokens for consistency.

### 3. Shadow Usage Inconsistency

**Current State:**
- Legacy: Uses `shadow-sm`, `shadow-md`, `shadow-lg`
- New: Uses inline RGB shadow values
- Tokens: Comprehensive shadow system defined but unused

**Recommendation:** Use design token shadows exclusively.

### 4. Animation Timing Inconsistency

**Current State:**
- Some animations: 200ms (Clerk-style)
- Some animations: 300ms (default)
- Some animations: 600ms (too slow)

**Recommendation:** Standardize to 150ms (fast), 200ms (normal), 300ms (slow).

---

## Migration Phases

### Phase 1: Foundation (Week 1)
**Goal:** Establish design token integration foundation

**Tasks:**
1. Create `src/styles/design-tokens.css` from `design-tokens.ts`
2. Import design tokens CSS in `globals.css`
3. Create TypeScript utility functions for accessing tokens
4. Set up ToastProvider in app root layout

**Files to Modify:**
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/lib/utils.ts` (add token utilities)

**Success Criteria:**
- Design tokens available as CSS variables
- Toast provider functional
- No breaking changes to existing UI

---

### Phase 2: Component Migration (Weeks 2-3)
**Goal:** Replace legacy components with new `ui-next/` components

**Migration Order:**
1. **Badge** (safest, low impact)
2. **Input** (medium impact, high visibility)
3. **Button** (high impact, critical)
4. **Card** (high impact, critical)
5. **Table** (medium impact)
6. **Dropdown** (medium impact)

**Migration Pattern:**
```typescript
// Before
import { Button } from "@/components/ui/button"

// After
import { Button } from "@/components/ui-next/button-next"
```

**Files to Migrate:** 80+ page files

**Success Criteria:**
- All new pages use `ui-next/` components
- Visual regression tests pass
- No functionality loss

---

### Phase 3: Layout Adoption (Week 4)
**Goal:** Standardize page layouts using new layout components

**Tasks:**
1. Adopt `PageContainer` in all page files
2. Adopt `PageHeader` for page titles
3. Adopt `EmptyState` where appropriate
4. Standardize sidebar width across portals

**Files to Modify:**
- All `src/app/*/page.tsx` files (100+ files)

**Success Criteria:**
- Consistent page structure
- Responsive containers
- Proper empty states

---

### Phase 4: Styling Cleanup (Week 5)
**Goal:** Remove redundant styling and apply design tokens

**Tasks:**
1. Remove inline gradient styles (per UX audit)
2. Apply border radius standards
3. Remove excessive shadows
4. Reduce padding by 25%
5. Standardize spacing to 4px grid

**Files to Modify:**
- All page files with inline styles
- All component files with hardcoded values

**Success Criteria:**
- No inline gradient styles
- Consistent border radius
- Minimal shadow usage
- Compact, efficient spacing

---

### Phase 5: Animation Polish (Week 6)
**Goal:** Standardize animations using design tokens

**Tasks:**
1. Replace hardcoded animation durations
2. Use easing tokens
3. Apply spring tokens where appropriate
4. Ensure `repeatType: "loop"` for infinite animations

**Files to Modify:**
- All motion components
- Page transitions
- Hover/interaction states

**Success Criteria:**
- Consistent animation timing
- Smooth, purposeful motion
- Accessibility respected (prefers-reduced-motion)

---

### Phase 6: Workflow Innovation (Weeks 7-10)
**Goal:** Implement revolutionary UX patterns from Workflow Innovation Report

**Tasks:**
1. Implement Command Palette
2. Create Intelligent Input component
3. Build Progressive Form system
4. Add In-Place Editor
5. Create Action Bar component

**Success Criteria:**
- Measured UX improvements
- User satisfaction increase
- Task completion time reduction

---

## File-by-File Migration List

### Priority 1: Foundation Files

| File | Action | Complexity |
|------|--------|------------|
| `src/app/globals.css` | Import design tokens CSS | Low |
| `src/app/layout.tsx` | Add ToastProvider | Low |
| `src/lib/utils.ts` | Add token utility functions | Medium |
| `src/styles/design-tokens.ts` | Add CSS export | Low |

### Priority 2: Component Files (Legacy -> Next)

| Legacy File | New File | Migration Type |
|------------|----------|---------------|
| `src/components/ui/badge.tsx` | `ui-next/badge-next.tsx` | Replace import |
| `src/components/ui/button.tsx` | `ui-next/button-next.tsx` | Replace import |
| `src/components/ui/card.tsx` | `ui-next/card-next.tsx` | Replace import |
| `src/components/ui/input.tsx` | `ui-next/input-next.tsx` | Replace import |
| `src/components/ui/dropdown-menu.tsx` | `ui-next/dropdown-next.tsx` | Replace import |
| `src/components/ui/table.tsx` | `ui-next/table-next.tsx` | Replace import |

### Priority 3: Page Files (Layout Adoption)

**Admin Portal (10 pages):**
- `src/app/admin/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/schools/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/roles/page.tsx`
- `src/app/admin/permissions/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/reports/page.tsx`
- `src/app/admin/counselors/page.tsx`
- `src/app/admin/content/*/page.tsx`

**School Admin Portal (18 pages):**
- `src/app/school-admin/page.tsx`
- `src/app/school-admin/dashboard/page.tsx`
- `src/app/school-admin/students/create/page.tsx`
- `src/app/school-admin/teachers/create/page.tsx`
- `src/app/school-admin/classes/create/page.tsx`
- (and 13 more)

**Teacher Portal (12 pages):**
- `src/app/teacher/page.tsx`
- `src/app/teacher/dashboard/page.tsx`
- `src/app/teacher/students/page.tsx`
- (and 9 more)

**Student Portal (10 pages):**
- `src/app/student/page.tsx`
- `src/app/student/classes/page.tsx`
- (and 8 more)

**Parent Portal (8 pages):**
- `src/app/parent/page.tsx`
- `src/app/parent/children/page.tsx`
- (and 6 more)

**Counselor Portal (15 pages):**
- `src/app/counselor/page.tsx`
- `src/app/counselor/students/page.tsx`
- (and 13 more)

**Ministry Portal (17 pages):**
- `src/app/ministry/page.tsx`
- `src/app/ministry/schools/page.tsx`
- (and 15 more)

**Total: ~90 page files to migrate**

---

## Testing Checklist

### Visual Regression Testing

- [ ] All portals render correctly with new components
- [ ] Dark mode works consistently
- [ ] Mobile responsive design preserved
- [ ] Portal-specific colors maintained
- [ ] No visual glitches during transitions

### Functional Testing

- [ ] All buttons trigger correct actions
- [ ] All forms submit properly
- [ ] All navigation works
- [ ] Toast notifications appear and dismiss
- [ ] Modals open and close correctly
- [ ] Dropdowns function properly

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels present

### Performance Testing

- [ ] No increase in bundle size
- [ ] Animations run at 60fps
- [ ] No layout thrashing
- [ ] Fast initial render

### Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Rollback Plan

### Trigger Conditions

Rollback may be triggered if:
1. Critical bugs affect >10% of users
2. Performance degradation >20%
3. Accessibility violations introduced
4. Visual regression in production

### Rollback Steps

1. **Immediate Revert** (if deployed)
   ```bash
   git revert <migration-commit>
   npm run build
   npm start
   ```

2. **Partial Rollback** (if in progress)
   - Revert current phase changes
   - Keep completed phases
   - Document issues for later fix

3. **Code Rollback** (if not deployed)
   - Use git to reset to pre-migration state
   - Cherry-pick any safe commits
   - Branch for fixes

### Mitigation Strategies

1. **Feature Flags**
   - Implement feature flags for new components
   - Enable for internal users first
   - Gradual rollout

2. **A/B Testing**
   - Run old and new versions side-by-side
   - Measure user engagement
   - Data-driven decision

3. **Staged Rollout**
   - Phase 1: Internal team
   - Phase 2: Beta users
   - Phase 3: 10% of users
   - Phase 4: Full rollout

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Foundation | 1 week | Week 1 | Week 1 |
| Phase 2: Component Migration | 2 weeks | Week 2 | Week 3 |
| Phase 3: Layout Adoption | 1 week | Week 4 | Week 4 |
| Phase 4: Styling Cleanup | 1 week | Week 5 | Week 5 |
| Phase 5: Animation Polish | 1 week | Week 6 | Week 6 |
| Phase 6: Workflow Innovation | 4 weeks | Week 7 | Week 10 |
| **Total** | **10 weeks** | | |

---

## Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Design token usage | 5% | 95% | Code analysis |
| Component consistency | 40% | 100% | Component audit |
| Border radius violations | ~50 | 0 | Automated test |
| Bundle size | Baseline | ≤ Baseline | Build analysis |
| Animation duration variance | High | Low | Code analysis |

### Qualitative Metrics

- Visual consistency score (heuristic evaluation)
- Developer satisfaction (survey)
- Design system documentation completeness
- Code maintainability rating

---

## Critical Dependencies

### Must Complete Before Migration Starts

1. **Design Tokens CSS Export**
   - Need to convert TypeScript tokens to CSS variables
   - File: `src/styles/design-tokens.css`

2. **Token Utility Functions**
   - Need helper functions for accessing tokens in TypeScript
   - File: `src/lib/token-utils.ts`

3. **Component Compatibility Check**
   - Verify `ui-next/` components match `ui/` component APIs
   - Document any breaking changes

### Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Inconsistent component APIs | High | Create adapter layer |
| Missing design token exports | High | Create token system |
| No visual regression tests | Medium | Set up testing |
| No feature flag system | Medium | Implement flags |

---

## Recommended First Steps

1. **Create Migration Branch**
   ```bash
   git checkout -b feature/design-sync-migration
   ```

2. **Set Up Design Token System**
   - Export design tokens to CSS
   - Import in globals.css
   - Create utility functions

3. **Enable Toast Provider**
   - Add to app root layout
   - Test with existing toasts

4. **Migrate One Component**
   - Start with Badge (safest)
   - Test thoroughly
   - Document process

5. **Create Migration Script**
   - Automated find/replace for imports
   - Manual verification step

---

## Conclusion

The design teams have created excellent foundation work. The path forward requires:

1. **Integration** - Bringing parallel systems together
2. **Standardization** - One way to do things
3. **Migration** - Moving to the new system
4. **Cleanup** - Removing legacy code

The estimated effort is 10 weeks for full migration, with value delivered incrementally throughout the process.

---

**Next Action:** Schedule design sync meeting to review this plan and assign ownership.

---

*Document Version: 1.0*
*Last Updated: February 25, 2026*
