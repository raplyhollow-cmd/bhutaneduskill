# Design Sync Action Checklist

**Use this checklist to track migration progress.**

---

## Phase 1: Foundation (Week 1)

### Design Token Setup
- [ ] Export design tokens to CSS (`src/styles/design-tokens.css`)
- [ ] Import token CSS in `globals.css`
- [ ] Create TypeScript token utility functions
- [ ] Verify CSS variables are available in dev tools
- [ ] Test dark mode token switching

### Toast Provider Setup
- [ ] Add `ToastProvider` to app root layout
- [ ] Test basic toast with `useToast()` hook
- [ ] Test all toast variants (success, error, warning, info, loading)
- [ ] Verify toast positioning (top-right)
- [ ] Test toast stacking (multiple toasts)

### Verification
- [ ] Run `npm run build` - no errors
- [ ] Run `npm run dev` - verify toasts work
- [ ] Check dark mode with tokens

---

## Phase 2: Component Migration (Weeks 2-3)

### Badge Migration
- [ ] Update imports in all files using `ui/badge`
- [ ] Verify semantic variants work
- [ ] Check dark mode rendering
- [ ] Test dot indicator
- [ ] Remove old `ui/badge.tsx` file

### Input Migration
- [ ] Update imports in all files using `ui/input`
- [ ] Verify state variants (default, error, success)
- [ ] Test with labels
- [ ] Test with icons (left/right)
- [ ] Verify error messages display
- [ ] Remove old `ui/input.tsx` file

### Button Migration
- [ ] Update imports in all files using `ui/button`
- [ ] Verify all variants (primary, secondary, ghost, danger)
- [ ] Test loading state
- [ ] Test icon buttons
- [ ] Verify hover/active states
- [ ] Remove old `ui/button.tsx` file

### Card Migration
- [ ] Update imports in all files using `ui/card`
- [ ] Verify all variants (default, elevated, interactive, flat, bordered)
- [ ] Test padding variants
- [ ] Test with CardHeader, CardContent, CardFooter
- [ ] Remove old `ui/card.tsx` file

### Table Migration
- [ ] Update imports in all files using `ui/table`
- [ ] Test sticky headers
- [ ] Verify hover states
- [ ] Test responsive overflow
- [ ] Remove old `ui/table.tsx` file

### Dropdown Migration
- [ ] Update imports in all files using `ui/dropdown-menu`
- [ ] Test keyboard navigation
- [ ] Verify submenu behavior
- [ ] Test checkbox items
- [ ] Remove old `ui/dropdown-menu.tsx` file

### Verification
- [ ] Visual regression test (screenshots)
- [ ] Cross-browser test (Chrome, Firefox, Safari)
- [ ] Accessibility audit (keyboard, screen reader)
- [ ] Run `npm run build`

---

## Phase 3: Layout Adoption (Week 4)

### Page Container
- [ ] Add `PageContainer` to all portal pages
- [ ] Verify responsive behavior
- [ ] Test max-width variants
- [ ] Test background variants

### Page Header
- [ ] Add `PageHeader` to all portal pages
- [ ] Test breadcrumbs
- [ ] Test actions slot
- [ ] Verify responsive behavior

### Empty State
- [ ] Identify pages needing empty states
- [ ] Add `EmptyState` components
- [ ] Test with different message lengths
- [ ] Test action buttons

### Verification
- [ ] Visual regression test
- [ ] Mobile responsive test
- [ ] Run `npm run build`

---

## Phase 4: Styling Cleanup (Week 5)

### Gradient Removal
- [ ] Find all inline gradient styles
- [ ] Replace with token-based colors
- [ ] Keep only brand gradients (hero section)

### Border Radius Standardization
- [ ] Audit all border-radius values
- [ ] Replace with tokens: 6px (buttons/inputs), 8px (cards), 12px (modals)
- [ ] Remove `rounded-2xl` usage

### Shadow Cleanup
- [ ] Remove shadows from cards (use borders)
- [ ] Remove shadows from buttons
- [ ] Keep shadows only for modals/dropdowns

### Spacing Cleanup
- [ ] Audit padding values
- [ ] Reduce by ~25% per UX audit
- [ ] Align to 4px grid

### Verification
- [ ] Visual comparison (before/after)
- [ ] Run `npm run build`

---

## Phase 5: Animation Polish (Week 6)

### Duration Standardization
- [ ] Find all hardcoded durations
- [ ] Replace with token values
- [ ] Fast: 100-150ms, Normal: 200ms, Slow: 300ms

### Easing Standardization
- [ ] Replace `ease` with `ease-out` for most transitions
- [ ] Use spring tokens for appropriate animations
- [ ] Add `repeatType: "loop"` for infinite animations

### Motion Respect
- [ ] Test with `prefers-reduced-motion`
- [ ] Verify animations can be disabled
- [ ] Add duration caps

### Verification
- [ ] Performance test (60fps)
- [ ] Accessibility test
- [ ] Run `npm run build`

---

## Phase 6: Workflow Innovation (Weeks 7-10)

### Command Palette
- [ ] Create `CommandPalette` component
- [ ] Add keyboard shortcut (Cmd+K)
- [ ] Implement fuzzy search
- [ ] Add command categories
- [ ] Test with 100+ commands

### Intelligent Input
- [ ] Create `IntelligentInput` component
- [ ] Add email detection
- [ ] Add grade detection
- [ ] Add phone detection
- [ ] Test inline suggestions

### Progressive Form
- [ ] Create `ProgressiveForm` component
- [ ] Implement step-by-step flow
- [ ] Add skip functionality
- [ ] Test with student onboarding

### In-Place Editor
- [ ] Create `InPlaceEditor` component
- [ ] Add click-to-edit
- [ ] Test with table cells
- [ ] Verify save/cancel behavior

### Verification
- [ ] User acceptance testing
- [ ] Measure task completion time
- [ ] Run `npm run build`

---

## Final Verification

### Pre-Launch Checklist
- [ ] All 90+ page files migrated
- [ ] All components using design tokens
- [ ] No legacy `ui/` imports remaining
- [ ] Visual regression tests pass
- [ ] Accessibility tests pass
- [ ] Cross-browser tests pass
- [ ] Performance budget met
- [ ] Documentation updated

### Launch Checklist
- [ ] Feature flags configured
- [ ] Monitoring set up
- [ ] Rollback plan documented
- [ ] Team trained on new patterns
- [ ] User communication prepared

---

## Rollback Triggers

Monitor these metrics after each phase launch:

- [ ] Error rate < 1%
- [ ] Page load time < 2s
- [ ] No accessibility violations
- [ ] Visual regression score > 95%

**If any metric fails, trigger rollback.**

---

*Last Updated: February 25, 2026*
*Next Review: After Phase 1 completion*
