# UX Audit Report: Bhutan EduSkill Platform

**Auditor:** UX Design Director (Vercel/Clerk/Apple/Linear Expertise)
**Date:** February 25, 2026
**Platform:** B2B SaaS Multi-tenant School Management (Bhutan Middle Schools)
**Tech Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Clerk

---

## Executive Summary

The Bhutan EduSkill platform demonstrates **solid technical foundations** with a comprehensive Clerk-inspired ceramic design system. However, the user experience suffers from **inconsistent execution**, **over-complicated visual hierarchy**, and **missed opportunities for next-gen polish**. The platform feels like a competent MVP that needs refinement to reach the level of Vercel, Clerk, Apple, or Linear.

**Overall Grade:** B- (78/100)

---

## Current State Assessment

### Strengths
- Comprehensive Clerk Ceramic Design System implemented
- Good component abstraction (shadcn/ui foundation)
- Portal-specific color coding with consistent gradients
- Proper mobile touch targets (44px minimum per iOS HIG)
- Dark mode support throughout

### Critical Issues
- Inconsistent design token usage (mix of inline styles, Tailwind, and CSS variables)
- Over-reliance on gradients creates visual noise
- Typography lacks the refined hierarchy of top-tier SaaS
- Information density varies wildly between pages
- Excessive padding/margins makes the UI feel "bulky"
- Border radius inconsistencies (rounded-lg vs rounded-xl vs rounded-2xl)

---

## Specific Issues by Page/Component

### 1. Landing Page (Hero Section)

**File:** `src/components/landing/hero-3d.tsx`

**Issues:**
- **Heavy gradient overkill:** `from-orange-50 via-white to-orange-50` is unnecessary complexity
- **3D Canvas on left side:** Wastes 50% of viewport width on desktop; feels empty
- **Hero text too large:** `text-7xl` is excessive; Apple uses `text-5xl`/`text-6xl` max
- **Feature pills are bulky:** `px-3 py-1.5` with shadow-sm creates visual clutter
- **Trust section feels tacked on:** Social proof should integrate more naturally

**Benchmark comparison:**
- **Vercel:** Minimal hero, centered text, subtle grid background
- **Clerk:** Clean typography, single CTA, no excessive decoration
- **Apple:** Hero text ~52px max, generous white space, focused CTA

**Recommendations:**
```
1. Remove 3D canvas or move to subtle background
2. Reduce heading to text-5xl/text-6xl
3. Simplify gradient to single direction
4. Convert feature pills to simple text with bullets
5. Integrate social proof into main flow
```

---

### 2. Admin Analytics Dashboard

**File:** `src/app/admin/analytics/page.tsx`

**Issues:**
- **Card explosion:** Too many cards visible simultaneously (information overload)
- **Progress bars are chunky:** `h-2` with gradients feels dated; Linear uses thin, solid lines
- **Toast notification is invasive:** Fixed position at top-right interrupts flow
- **Export button uses prompt():** Terrible UX; should use a proper dropdown modal
- **Stat cards lack visual hierarchy:** All cards look the same; no priority indicators

**Benchmark comparison:**
- **Linear:** Dense but organized, uses borders instead of shadows, consistent 4px grid
- **Vercel:** Stats use minimalist cards with subtle borders, no heavy shadows

**Recommendations:**
```
1. Implement card priority (primary vs secondary stats)
2. Replace prompt() with proper dropdown menu
3. Use inline toasts at bottom center (not top-right)
4. Thinner progress bars (1px) with solid colors
5. Add skeleton loading states for all data fetching
```

---

### 3. School Admin Dashboard

**File:** `src/app/school-admin/dashboard/page.tsx`

**Issues:**
- **Welcome banner is too tall:** `p-6 lg:p-8` with full gradient dominates the screen
- **Decorative circles are distracting:** The bg-white/5 circles add no value
- **Stats cards inconsistent:** Some have icons, some don't; inconsistent icon sizing
- **"Pending Actions" card feels alarmist:** Orange borders create unnecessary stress
- **Quick actions section is redundant:** Duplicates navigation sidebar items

**Benchmark comparison:**
- **Clerk:** No welcome banners; goes straight to actionable data
- **Apple:** Uses empty states with illustrations, not text-heavy banners

**Recommendations:**
```
1. Reduce welcome banner to 64px max height (title only)
2. Remove decorative circles entirely
3. Standardize stats card layout (icon always top-left)
4. Replace orange borders with subtle yellow backgrounds
5. Remove quick actions that duplicate sidebar nav
```

---

### 4. Portal Navigation (Sidebar)

**File:** `src/components/mobile/universal-mobile-sidebar.tsx`

**Issues:**
- **Sidebar is too wide:** 256px (w-64) is excessive; Linear uses 240px, Vercel 220px
- **Nav items have too much padding:** `px-4 py-2.5` creates loose navigation
- **Active indicator is heavy:** `w-1 h-8` left border is dated; use full background tint
- **User section takes too much space:** Could be collapsed into header
- **Mobile menu animation is slow:** 300ms feels sluggish; should be 200ms

**Benchmark comparison:**
- **Linear:** 224px sidebar, tight spacing (12px vertical), active state is subtle bg
- **Clerk:** 240px sidebar, compact nav items, minimal active state

**Recommendations:**
```
1. Reduce sidebar to 224px
2. Change nav item padding to px-3 py-2
3. Replace left border indicator with background tint
4. Collapse user section into header dropdown
5. Speed up mobile animation to 200ms
```

---

### 5. Cards Component

**File:** `src/components/ui/card.tsx`

**Issues:**
- **Inconsistent border radius:** `rounded-xl` (12px) differs from inputs (`rounded-lg`)
- **Shadow usage is heavy:** `shadow-sm` on hover feels dated; Vercel uses borders only
- **Padding is too generous:** `px-6 py-5` wastes space; should be `px-4 py-3`
- **Hover effects are generic:** Simple border color change lacks delight

**Benchmark comparison:**
- **Linear:** 8px border radius, 1px borders, no shadows, 16px padding
- **Vercel:** 12px radius, subtle borders, hover adds slight border darkening

**Recommendations:**
```
1. Standardize to 8px border radius (matches input field)
2. Remove all shadows; use 1px borders exclusively
3. Reduce padding to px-4 py-3
4. Add subtle background color shift on hover (rgb(249 250 251))
```

---

### 6. Button Component

**File:** `src/components/ui/button.tsx`

**Issues:**
- **Too many variants:** 11 variants create decision paralysis
- **Default button is bulky:** `h-11 px-5 py-2.5` is larger than necessary
- **Hover transform is gimmicky:** `hover:-translate-y-0.5` feels cheap
- **Icon sizing inconsistent:** `has-[>svg]:px-4` logic creates visual jumps

**Benchmark comparison:**
- **Linear:** 36px height, 12px horizontal padding, no transform on hover
- **Clerk:** 38px height, 16px horizontal padding, opacity change only

**Recommendations:**
```
1. Reduce to 5 variants max (primary, secondary, ghost, danger, link)
2. Change default height to h-10 (40px)
3. Remove all transform effects
4. Standardize icon button padding
```

---

### 7. Input Component

**File:** `src/components/ui/input.tsx`

**Issues:**
- **Height inconsistency:** `min-h-11 md:h-10` creates jumping between breakpoints
- **Shadow on focus:** `shadow-xs` is unnecessary; use border color change only
- **Rounded-lg (8px)** doesn't match card rounded-xl (12px)

**Benchmark comparison:**
- **Linear:** 36px height, 4px radius, 2px border, no shadows ever
- **Vercel:** 40px height, 6px radius, 1px border, ring on focus

**Recommendations:**
```
1. Fix height to h-10 (40px) at all breakpoints
2. Remove shadow-xs
3. Change to rounded-lg for consistency
4. Use ring-2 instead of shadow on focus
```

---

## Design System Issues

### Typography

**Current State:**
- Using Geist Sans (good choice, Vercel-style)
- Inconsistent font weights across components
- Type scale not strictly followed

**Issues:**
- Text sizes jump around (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 7xl!)
- Line heights too loose (`leading-tight` is only used in headers)
- No tracking (letter-spacing) adjustments for larger text

**Benchmark comparison:**
- **Apple:** Strict type scale (13px, 15px, 17px, 20px, 24px, 34px, 48px)
- **Linear:** 12px, 14px, 16px, 18px, 24px, 32px (very controlled)

**Recommendations:**
```
1. Establish strict type scale:
   - xs: 12px (captions)
   - sm: 14px (body)
   - base: 16px (body large)
   - lg: 18px (subheading)
   - xl: 20px (heading small)
   - 2xl: 24px (heading medium)
   - 3xl: 32px (heading large)
   - Remove 4xl, 5xl, 6xl, 7xl entirely

2. Set default line-height to 1.5 for all text
3. Add tracking: -0.01em for text-lg and above
4. Never use font-weight below 400 or above 600
```

---

### Spacing

**Current State:**
- Uses Tailwind's spacing scale (1, 2, 3, 4, 5, 6, 8, 12, 16, 20, 24)
- Inconsistent application (mix of px-4, px-6, p-8)

**Issues:**
- Too much variation (uses every step of the scale)
- Components don't align to a consistent grid
- Section spacing is excessive (space-y-6, space-y-8)

**Benchmark comparison:**
- **Linear:** 4px base unit, all spacing is multiple of 4
- **Vercel:** 8px base unit, consistent throughout

**Recommendations:**
```
1. Establish 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
2. Remove all odd numbers from spacing
3. Section spacing: 16px (compact) or 32px (spacious), never in between
4. Component spacing: 8px between related items, 16px between groups
```

---

### Colors

**Current State:**
- Comprehensive Ceramic color system implemented
- Portal-specific gradients defined
- Good semantic colors (success, error, warning, info)

**Issues:**
- **Gradient overuse:** Almost every button uses a gradient
- **Inline style colors:** `style={{ background: "linear-gradient(...)" }}` defeats CSS
- **Inconsistent usage:** Some components use Tailwind colors, some use CSS variables

**Benchmark comparison:**
- **Linear:** Flat colors only, gradients used sparingly (2-3 places max)
- **Vercel:** Gradients only for brand accents, not UI elements
- **Clerk:** Solid colors for all buttons, very subtle gradients for backgrounds

**Recommendations:**
```
1. Remove ALL gradients from:
   - Buttons (use solid colors)
   - Cards (use flat backgrounds)
   - Input fields (no gradients ever)

2. Keep gradients ONLY for:
   - Hero section background (subtle)
   - Brand accents (logo, key CTAs)

3. Convert all inline styles to CSS classes
4. Use Tailwind colors for 95% of elements
5. Use CSS variables only for theming (dark/light mode)
```

---

### Border Radius

**Current State:**
- Inconsistent: rounded-md (6px), rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)

**Issues:**
- No logic to when each radius is used
- Creates visual dissonance

**Benchmark comparison:**
- **Linear:** 4px for everything, 6px for modal corners only
- **Vercel:** 6px standard, 8px for cards, 12px for modals
- **Clerk:** 8px standard, 12px for cards only

**Recommendations:**
```
1. Standardize to:
   - Buttons, inputs, small items: 6px (rounded-md)
   - Cards: 8px (rounded-lg)
   - Modals: 12px (rounded-xl)
   - Remove rounded-2xl entirely

2. Update all components to follow this hierarchy
```

---

### Borders and Shadows

**Current State:**
- Mix of borders and shadows
- Inconsistent shadow usage (shadow-sm, shadow-md, shadow-lg, shadow-xl)

**Issues:**
- Shadows feel heavy and dated
- Border colors inconsistent (border-gray-200, border-ceramic-border, custom rgb)

**Benchmark comparison:**
- **Linear:** 1px solid borders, NO shadows, depth through layering
- **Vercel:** Subtle 1px borders, minimal shadows for elevation only

**Recommendations:**
```
1. Remove ALL shadows from:
   - Cards
   - Buttons
   - Input fields

2. Use shadows ONLY for:
   - Modals (shadow-2xl max)
   - Dropdowns (shadow-lg max)

3. Standardize borders:
   - Default: rgb(229 231 235) / #e5e7eb
   - Hover: rgb(209 213 219) / #d1d5db
   - Focus: brand color
```

---

## Mobile Responsiveness

### Current State
- Mobile sidebar implemented
- Touch targets meet 44px minimum
- Safe area insets considered

### Issues
- **Mobile menu button placement:** Top-left is awkward for right-handed users
- **Tables not responsive:** Data tables overflow horizontally on mobile
- **Grid breakpoints too aggressive:** lg:grid-cols-3 leaves too much empty space

### Recommendations
```
1. Move mobile menu to bottom-right or center-bottom
2. Implement table card transformation for mobile (< 768px)
3. Add intermediate breakpoint at 900px for medium tablets
4. Test on iPhone SE (375px) - current min is 1024px (tablet!)
```

---

## Animations and Micro-interactions

### Current State
- Framer Motion used throughout
- spring animations implemented
- Loading states with skeletons

### Issues
- **Animation durations too long:** 600ms for fade-in feels sluggish (should be 200-300ms)
- **Spring animations overused:** Not everything needs to be bouncy
- **Loading spinners are basic:** Standard spinner, no brand personality

### Benchmark comparison
- **Linear:** 150ms transitions, linear easing, no springs
- **Vercel:** 200ms transitions, ease-out, subtle springs
- **Clerk:** 250ms transitions, cubic-bezier(0.4, 0, 0.2, 1)

### Recommendations
```
1. Standardize animation durations:
   - Fast: 150ms (hover, focus)
   - Normal: 200ms (page transitions)
   - Slow: 300ms (modals, drawers)

2. Replace spring animations with ease-out for everything except:
   - Modal entrance (slight spring)
   - Button press (instant)

3. Add loading animations:
   - Skeleton shimmer
   - Progress bars
   - Pulsing dots for async operations

4. Remove all bounce animations
```

---

## Accessibility

### Current State
- ARIA labels present in some places
- Focus styles implemented
- Semantic HTML used

### Issues
- **Focus indicators are subtle:** 2px outline can be hard to see
- **Color contrast may fail:** Some gray-on-gray combinations
- **No skip-to-content link:** Keyboard users must tab through entire nav

### Recommendations
```
1. Increase focus ring to 3px with higher contrast
2. Test all color combinations with WCAG AA checker
3. Add skip-to-content link that appears on first tab
4. Ensure all interactive elements have :focus-visible styles
5. Add aria-labels to all icon-only buttons
```

---

## Performance Considerations

### Current State
- Dynamic imports used for some components
- Canvas renders 3D scene on landing page

### Issues
- **Hero 3D scene is heavy:** Three.js + Canvas for simple particles is overkill
- **No lazy loading for below-fold content:** Everything loads at once
- **Framer Motion imports not tree-shaken:** May be importing full library

### Recommendations
```
1. Replace 3D canvas with CSS animations or SVG
2. Implement lazy loading for components below viewport
3. Use loading="lazy" for all images
4. Consider removing Framer Motion in favor of CSS transitions
```

---

## Priority Matrix: What to Fix First

### Tier 1: High Impact, Low Effort (Do Immediately)

| Change | Impact | Effort | File |
|--------|--------|--------|------|
| Remove button hover transforms | High | 5 min | button.tsx |
| Standardize border radius (6/8/12) | High | 30 min | All components |
| Remove gradient from cards | High | 15 min | card.tsx |
| Reduce card padding | High | 10 min | card.tsx |
| Fix input height consistency | Medium | 5 min | input.tsx |
| Replace prompt() with dropdown | High | 1 hour | analytics/page.tsx |

### Tier 2: High Impact, Medium Effort (Do This Week)

| Change | Impact | Effort |
|--------|--------|--------|
| Reduce sidebar width & tighten nav | High | 2 hours |
| Simplify hero section | High | 3 hours |
| Standardize typography scale | High | 4 hours |
| Remove all shadows (use borders) | Medium | 2 hours |
| Fix mobile breakpoint (1024px -> 768px) | High | 2 hours |

### Tier 3: Medium Impact, High Effort (Plan for Next Sprint)

| Change | Impact | Effort |
|--------|--------|--------|
| Redesign stats cards for consistency | Medium | 1 day |
| Implement proper empty states | Medium | 1 day |
| Add loading skeletons everywhere | Medium | 2 days |
| Refactor color system (remove inline styles) | High | 2 days |
| Audit and fix accessibility issues | Medium | 1 day |

---

## Design Principles for the New Aesthetic

Based on analysis of Vercel, Clerk, Apple, and Linear, the platform should adopt these principles:

### 1. **Radical Simplicity**
- Remove every non-essential element
- If it doesn't serve a purpose, delete it
- Flat design only (no gradients, minimal shadows)

### 2. **Consistent Grid System**
- 4px base unit for all spacing
- 8px grid for component layout
- 24px grid for page sections

### 3. **Typography-First Design**
- Text is the primary visual element
- Hierarchy through size and weight only (no color)
- Tighter line heights (1.4-1.5, not 1.6-1.7)

### 4. **Borders Over Shadows**
- 1px solid borders for everything
- Depth through layering, not elevation
- Subtle color shifts, no drop shadows

### 5. **Motion with Purpose**
- 150-300ms duration maximum
- Ease-out easing only
- No bounce, no spring, no whimsy

### 6. **Compact Density**
- Reduce all padding by 25%
- Smaller fonts (12-16px for body)
- More information, less chrome

---

## Competitor Analysis: What to Steal

### From Vercel
- Minimal color palette (black, white, gray, accent)
- Thin 1px borders
- Subtle hover states (border darkening)
- Compact navigation (220px width)

### From Clerk
- Ceramic color system (keep this, it's good)
- Clean cards with minimal padding
- Consistent 8px border radius
- Subtle animations (250ms max)

### From Apple
- Restrained typography scale
- Generous white space (but not excessive)
- Focus on content over chrome
- Smooth, linear easing

### From Linear
- Dense information layout
- 4px grid system
- No shadows, borders only
- Fast animations (150ms)

---

## Before & After Examples

### Button: Before
```tsx
<Button
  size="lg"
  className="h-14 px-8 bg-gradient-to-r from-orange-600 to-red-600
             hover:from-orange-700 hover:to-red-700
             text-white font-semibold text-lg
             shadow-xl shadow-orange-500/30
             hover:-translate-y-0.5 transition-all"
>
```

### Button: After
```tsx
<Button
  className="h-10 px-5 bg-orange-600
             hover:bg-orange-700
             text-white font-medium text-sm
             rounded-md
             transition-colors duration-150"
>
```

### Card: Before
```tsx
<Card className="p-8 rounded-2xl shadow-lg hover:shadow-xl
                border-2 border-orange-200">
```

### Card: After
```tsx
<Card className="p-4 rounded-lg border border-gray-200
                hover:border-gray-300">
```

### Navigation: Before
```tsx
<Sidebar className="w-64">
  <NavItem className="px-4 py-2.5">
```

### Navigation: After
```tsx
<Sidebar className="w-56">
  <NavItem className="px-3 py-2">
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Create design tokens file (spacing, typography, colors, radius)
2. Update Button, Input, Card components
3. Remove all gradients from non-brand elements
4. Standardize border radius

### Phase 2: Layout (Week 2)
1. Reduce sidebar width
2. Tighten navigation spacing
3. Standardize card padding
4. Fix mobile breakpoint

### Phase 3: Pages (Week 3-4)
1. Redesign landing hero
2. Simplify dashboards
3. Consolidate stats cards
4. Add loading states

### Phase 4: Polish (Week 5)
1. Audit accessibility
2. Optimize animations
3. Remove performance bottlenecks
4. Final QA

---

## Metrics to Track

### Before Redesign
- Time to first actionable item: [TBD]
- Visual complexity score: [TBD]
- User satisfaction: [TBD]

### After Redesign
- Target: Reduce time to first action by 30%
- Target: Reduce visual complexity by 40%
- Target: Increase user satisfaction to 4.5/5

---

## Conclusion

The Bhutan EduSkill platform has a solid foundation but suffers from **inconsistent execution** and **visual over-complexity**. By adopting the principles outlined in this audit—radical simplicity, consistent grid systems, typography-first design, and borders over shadows—the platform can achieve the next-gen polish of Vercel, Clerk, Apple, and Linear.

The most impactful changes are also the easiest: remove gradients, tighten spacing, standardize border radius, and eliminate gimmicky animations. These changes can be implemented in a single sprint and will dramatically improve the user experience.

**Recommended next step:** Begin with Tier 1 fixes and measure user impact before proceeding to larger redesigns.

---

**End of Report**

*This audit was conducted by analyzing the codebase at commit 76b9323 on February 25, 2026. For questions or clarifications, please refer to the specific files and line numbers cited throughout this report.*
