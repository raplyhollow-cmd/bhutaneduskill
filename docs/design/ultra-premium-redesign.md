# Engineer Premium Design Overhaul
## Vercel/Clerk-Inspired Precision UI

**Date:** March 1, 2026
**Status:** Ready for Implementation
**Type:** Complete Visual Transformation
**Reference:** Vercel.com, Clerk.com

---

## The Problem

**Current State: Traditional, Outdated**
- Standard Tailwind components (basic shadcn)
- Flat colors, minimal depth
- Compact spacing (feels dated)
- Minimal micro-interactions
- No premium feeling
- Looks like a generic admin panel

**Desired State: Engineer Premium SaaS**
- Reference: Vercel, Clerk - "Minimalist Powerhouse"
- Dual-layer micro-borders ("milled" look)
- Precise gray scaling typography
- Information-dense spacing
- 150ms snappy animations
- Clean, functional design
- Monochrome + portal accent gradients

---

## What Changes

| Element | Current (Boring) | Target (Engineer Premium) |
|---------|-----------------|---------------------------|
| **Cards** | Flat, border only | Dual-layer micro-borders, inner highlight |
| **Buttons** | Flat colors | Portal gradients + subtle glow |
| **Inputs** | Basic borders | Floating labels, keyboard-only focus rings |
| **Modals** | Centered zoom | Slide from right, subtle backdrop |
| **Navigation** | Flat list | Collapsible sections, clean indicators |
| **Typography** | Standard tailwind | Geist + precise grays (#000, #666, #888) |
| **Spacing** | Compact (16px) | Information-dense (24px) |
| **Colors** | 2-stop gradients | Monochrome + 1 portal accent |
| **Shadows** | Black heavy | Subtle dual-layer (inner + outer) |
| **Animations** | Basic | 150ms snappy spring |
| **Radius** | Mixed | Consistent 8px (cards), 6px (buttons) |

---

## User Decisions

✅ **Typography:** Add premium font (Geist)
✅ **Mode:** Light and dark together
✅ **Animation:** 150ms snappy (Vercel-style)
✅ **Approach:** Engineer Premium only (no spotlight effect)

---

## 🎯 DESIGN PHILOSOPHY: Engineer Premium

**"The Minimalist Powerhouse"** - Vercel/Clerk approach where UI is extremely quiet until you interact with it.

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Precision over Blur** | Dual-layer borders, not glassmorphism |
| **Information Density** | 24px padding, not 32-40px |
| **Snappy Feedback** | 150ms animations, feels instantaneous |
| **Precise Typography** | #000, #666, #888 grays (not Tailwind defaults) |
| **Tight Radius** | 8px cards, 6px buttons (confident, not rounded) |
| **Subtle Depth** | Inner highlight + outer shadow combo |
| **Keyboard-First Focus** | Focus rings only on keyboard navigation |

### The "Milled" Border Effect

Vercel's signature look - dual-layer borders that simulate machined hardware:

```css
/* Single-layer (boring) */
border: 1px solid #e5e5e5;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);

/* Dual-layer "milled" (Vercel-style) */
border: 1px solid rgba(0, 0, 0, 0.08);
box-shadow:
  0 0 0 1px rgba(255, 255, 255, 0.8) inset,  /* Inner highlight */
  0 1px 2px rgba(0, 0, 0, 0.05);             /* Outer shadow */
```

---

## Phase 1: Design Token Enhancement

### File: `src/styles/design-tokens.ts`

**Add Premium Tokens:**

```typescript
// ============================================================================
// ULTRA PREMIUM TOKENS
// ============================================================================

/**
 * GLASSMORPHISM - The foundation of modern premium UI
 */
export const glass = {
  // Subtle glass for cards
  card: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropBlur: 'blur(20px) saturate(180%)',
    border: 'border border-white/40',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  // Strong glass for elevated elements
  elevated: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropBlur: 'blur(24px) saturate(200%)',
    border: 'border border-white/60',
    shadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
  },
  // Sidebar glass
  sidebar: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropBlur: 'blur(16px)',
    border: 'border-r border-gray-200/60',
  },
  // Modal overlay
  overlay: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropBlur: 'blur(8px)',
  },
} as const;

/**
 * RICH MULTI-STOP GRADIENTS
 * Three and four color gradients for depth
 */
export const richGradient = {
  student: {
    primary: 'linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 70%, #c2410c 100%)',
    subtle: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.25) 0%, transparent 60%)',
  },
  teacher: {
    primary: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 40%, #2563eb 70%, #1d4ed8 100%)',
    subtle: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
  },
  parent: {
    primary: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 40%, #4b5563 70%, #374151 100%)',
    subtle: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(107, 114, 128, 0.25) 0%, transparent 60%)',
  },
  counselor: {
    primary: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #9333ea 70%, #7e22ce 100%)',
    subtle: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
  },
  admin: {
    primary: 'linear-gradient(135deg, #f472b6 0%, #ec4899 40%, #db2777 70%, #be185d 100%)',
    subtle: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(236, 72, 153, 0.25) 0%, transparent 60%)',
  },
  schoolAdmin: {
    primary: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #7c3aed 70%, #6d28d9 100%)',
    subtle: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.25) 0%, transparent 60%)',
  },
  ministry: {
    primary: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #0d9488 70%, #0f766e 100%)',
    subtle: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 50%, #5eead4 100%)',
    glow: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.25) 0%, transparent 60%)',
  },
} as const;

/**
 * PREMIUM SHADOWS - Colored and layered
 */
export const premiumShadow = {
  // Soft ambient shadow
  soft: '0 2px 16px rgba(0, 0, 0, 0.04)',
  // Medium elevation
  medium: '0 8px 32px rgba(0, 0, 0, 0.06)',
  // High elevation
  high: '0 16px 64px rgba(0, 0, 0, 0.08)',
  // Colored glow shadows
  glow: {
    orange: '0 4px 24px rgba(249, 115, 22, 0.2)',
    blue: '0 4px 24px rgba(59, 130, 246, 0.2)',
    purple: '0 4px 24px rgba(139, 92, 246, 0.2)',
    pink: '0 4px 24px rgba(236, 72, 153, 0.2)',
    teal: '0 4px 24px rgba(20, 184, 166, 0.2)',
  },
  // Inner shadow for depth
  inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
} as const;

/**
 * LUXURY SPACING - More breathing room
 */
export const luxury = {
  padding: {
    compact: '1rem',      // 16px
    comfortable: '1.5rem', // 24px - New default
    spacious: '2rem',     // 32px
    grand: '2.5rem',      // 40px
    maxWidth: '3rem',     // 48px
  },
  gap: {
    tight: '0.75rem',     // 12px
    normal: '1rem',       // 16px
    relaxed: '1.5rem',    // 24px
    airy: '2rem',         // 32px
  },
  section: {
    mobile: '2rem',
    tablet: '3rem',
    desktop: '4rem',
    large: '6rem',
  },
} as const;

/**
 * MODERN BORDER RADIUS - Confident curves
 */
export const modernRadius = {
  button: '0.75rem',     // 12px
  input: '0.75rem',      // 12px
  card: '1rem',          // 16px
  cardLarge: '1.25rem',  // 20px
  modal: '1.5rem',       // 24px
  pill: '9999px',
} as const;

/**
 * PREMIUM MICRO-INTERACTIONS
 */
export const micro = {
  hover: {
    lift: 'translateY(-2px)',
    scale: 'scale(1.01)',
    glow: '0 0 24px currentColor',
  },
  active: {
    press: 'scale(0.99)',
  },
  transition: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;
```

---

## Phase 2: Component Transformation

### 2.1 Card Component - Engineer Premium

**File:** `src/components/ui/card.tsx`

```tsx
// BEFORE (Boring)
<div className="border rounded-lg shadow-sm bg-white p-6">

// AFTER (Engineer Premium - Vercel Style)
<div className="
  relative overflow-hidden
  bg-white/70
  border border-gray-200/60
  /* DUAL-LAYER BORDER - Vercel's milled look */
  shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_1px_2px_rgba(0,0,0,0.05)]
  rounded-[8px]
  p-6
  /* Hover - subtle lift, not dramatic */
  hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)_inset,0_4px_12px_rgba(0,0,0,0.08)]
  hover:-translate-y-0.5
  transition-all duration-150 ease-out
">
  {/* Content */}
</div>
```

### 2.2 Button Component - Portal Gradients + Subtle Glow

### 2.2 Button Component - Portal Gradients + Subtle Glow

**File:** `src/components/ui/button.tsx`

```tsx
// BEFORE (Flat)
<Button className="bg-blue-500 text-white">

// AFTER (Engineer Premium - Portal Gradient + Subtle)
<Button className="
  relative overflow-hidden
  bg-gradient-to-r from-orange-500 to-orange-600
  text-white font-medium
  px-5 py-2.5
  rounded-[6px]
  /* Subtle shadow with portal color tint */
  shadow-[0_1px_2px_rgba(0,0,0,0.1)]
  hover:shadow-[0_2px_8px_rgba(249,115,22,0.15)]
  hover:-translate-y-0.5
  active:translate-y-0
  transition-all duration-150 ease-out
">
  {children}
</Button>

// Secondary button (monochrome)
<Button variant="secondary" className="
  bg-white
  border border-gray-200
  /* Dual-layer border */
  shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_1px_2px_rgba(0,0,0,0.05)]
  text-gray-700
  px-5 py-2.5
  rounded-[6px]
  hover:bg-gray-50
  hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)_inset,0_2px_4px_rgba(0,0,0,0.08)]
  transition-all duration-150 ease-out
">
  {children}
</Button>
```

### 2.3 Input Component - Floating Labels + Keyboard Focus

**File:** `src/components/ui/input.tsx`

```tsx
// BEFORE (Basic)
<input className="border rounded-md px-3 py-2" />

// AFTER (Engineer Premium - Floating label + keyboard-only focus)
<div className="relative">
  <input
    className="
      peer w-full
      bg-white
      border border-gray-200
      /* Dual-layer border */
      shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset]
      rounded-[6px]
      px-3 py-2.5
      text-[#000000]
      placeholder-transparent
      /* Focus - subtle, not overwhelming */
      focus:border-gray-400
      focus:shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_0_0_2px_rgba(0,0,0,0.1)]
      focus:bg-white
      transition-all duration-150
      /* Keyboard-only focus ring (hidden for mouse users) */
      focus-visible:ring-2 focus-visible:ring-black/10
    "
    placeholder="Label"
  />
  <label className="
    absolute left-3 -top-2
    bg-white px-1
    text-xs text-[#888888]
    peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#888888] peer-placeholder-shown:top-2.5
    peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#666666]
    transition-all
  ">
    Label
  </label>
</div>
```

### 2.4 Dialog/Modal - Slide from Right

### 2.4 Dialog/Modal - Slide from Right

**File:** `src/components/ui/dialog.tsx`

```tsx
// BEFORE (Basic centered overlay)
<DialogOverlay className="bg-black/50" />
<DialogContent className="bg-white rounded-lg p-6">

// AFTER (Engineer Premium - Slide from right)
<DialogOverlay className="
  bg-black/20
  transition-opacity duration-150
" />

<DialogContent className="
  bg-white
  border border-gray-200
  /* Dual-layer border */
  shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_8px_32px_rgba(0,0,0,0.12)]
  rounded-[8px]
  p-6
  /* Slide from right animation */
  animate-in fade-in slide-in-from-right-4
  duration-150 ease-out
">
```

---

---

## Phase 3: Layout & Navigation

### 3.1 Sidebar - Clean, Minimal

```tsx
// BEFORE (Solid)
<div className="w-64 bg-white border-r">

// AFTER (Engineer Premium)
<div className="
  w-64
  bg-white
  border-r border-gray-200/60
  /* Subtle shadow on left */
  shadow-[4px_0_24px_rgba(0,0,0,0.02)]
">
```

### 3.2 Navigation Items - Clean Indicators

```tsx
// BEFORE
<a className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-100">

// AFTER (Engineer Premium)
<a className="
  group relative
  flex items-center gap-3
  px-3 py-2 rounded-[6px]
  hover:bg-gray-50
  transition-colors duration-150
">
  {/* Icon - clean, no glow */}
  <div className="
    p-1.5 rounded-[4px]
    text-gray-500
    group-hover:text-gray-900
    transition-colors duration-150
  ">
    <Icon className="w-4 h-4" />
  </div>

  {/* Active indicator - subtle left border */}
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-900 opacity-0 group-[.active]:opacity-100 rounded-r-full" />

  <span className="text-sm font-medium text-[#666666] group-hover:text-[#000000]">{label}</span>
</a>
```

### 3.3 Top Bar / Header - Minimal & Functional

**File:** Various header components across portals

```tsx
// BEFORE (Heavy, distracting)
<header className="bg-white border-b px-6 py-4 shadow-md">

// AFTER (Engineer Premium - Vercel-style)
<header className="
  sticky top-0 z-10
  bg-white/80 backdrop-blur-md
  border-b border-gray-200/60
  /* Dual-layer border */
  shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset]
  h-14
  px-4
  flex items-center justify-between
">

  {/* ==================== LEFT SECTION ==================== */}
  <div className="flex items-center gap-3">
    {/* Burger Menu - Mobile only */}
    <button className="
      lg:hidden p-1.5 -ml-1.5
      rounded-[6px]
      text-gray-500
      hover:bg-gray-100
      hover:text-gray-900
      transition-colors duration-150
    ">
      <Menu className="w-5 h-5" />
    </button>

    {/* Logo - hidden on mobile if burger shows */}
    <a href="/dashboard" className="hidden sm:block">
      <Logo className="h-6 w-6" />
    </a>

    {/* Page Title Group */}
    <div className="hidden sm:flex flex-col">
      <h1 className="text-[15px] font-semibold text-[#000000] leading-tight">
        {pageTitle}
      </h1>
      {subtitle && (
        <span className="text-[13px] text-[#888888]">
          {subtitle}
        </span>
      )}
    </div>
  </div>

  {/* ==================== CENTER SECTION (Optional) ==================== */}
  {/* Search bar - shown on desktop only */}
  <div className="hidden md:flex flex-1 max-w-md mx-8">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="search"
        placeholder="Search..."
        className="
          w-full h-9 pl-9 pr-4
          bg-gray-50
          border border-gray-200
          rounded-[6px]
          text-sm text-[#000000]
          placeholder:text-gray-400
          focus:bg-white
          focus:border-gray-400
          focus:outline-none
          transition-all duration-150
        "
      />
    </div>
  </div>

  {/* ==================== RIGHT SECTION ==================== */}
  <div className="flex items-center gap-1.5">
    {/* Help/Docs - subtle icon */}
    <button className="
      hidden sm:flex p-2
      rounded-[6px]
      text-gray-500
      hover:bg-gray-100
      hover:text-gray-900
      transition-colors duration-150
      " title="Help">
      <HelpCircle className="w-4 h-4" />
    </button>

    {/* Notifications - with badge */}
    <button className="
      relative p-2
      rounded-[6px]
      text-gray-500
      hover:bg-gray-100
      hover:text-gray-900
      transition-colors duration-150
    ">
      <Bell className="w-4 h-4" />
      {notificationCount > 0 && (
        <span className="
          absolute top-1.5 right-1.5
          w-2 h-2
          bg-red-500
          rounded-full
        " />
      )}
    </button>

    {/* Divider */}
    <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" />

    {/* User Badge/Avatar */}
    <button className="
      flex items-center gap-2
      pl-2 pr-3 py-1
      rounded-[6px]
      hover:bg-gray-100
      transition-colors duration-150
    ">
      {/* Avatar circle - portal gradient */}
      <div className="
        w-7 h-7
        rounded-full
        bg-gradient-to-br from-orange-400 to-orange-600
        text-white text-[13px] font-medium
        flex items-center justify-center
      ">
        {userInitials}
      </div>

      {/* User info - desktop only */}
      <div className="hidden lg:block text-left">
        <p className="text-[13px] font-medium text-[#000000] leading-tight">
          {userName}
        </p>
        <p className="text-[11px] text-[#888888] leading-tight">
          {userRole}
        </p>
      </div>

      {/* Chevron */}
      <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
    </button>
  </div>
</header>
```

**Header Layout Grid:**

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──┐  Logo   Title          [Search]          Help Bell User ▼   │
│  │☰│  Logo   Subtitle                           (2)  John Doe  │
│  └──┘                                                          │
└────────────────────────────────────────────────────────────────────┘
   ↑      ↑                                               ↑
   36px   120px (logo+title)                        180px (actions)
```

**Exact Spacing:**

| Element | Width/Size | Spacing | Notes |
|---------|-----------|---------|-------|
| **Header height** | 56px (h-14) | - | Fixed across all pages |
| **Burger button** | 40px × 40px | gap 12px from logo | Hidden on desktop (lg+) |
| **Logo** | 24px × 24px | gap 12px from title | Hidden on mobile (sm-) |
| **Title** | max 150px | - | H1: 15px semibold #000 |
| **Subtitle** | - | - | Optional, 13px #888 |
| **Search** | flex-1, max-w-md | mx-32 | Hidden on mobile/tablet |
| **Action buttons** | 36px × 36px | gap 6px | Help, notifications |
| **Divider** | 1px × 20px | - | Gray-200 vertical line |
| **Avatar** | 28px × 28px | - | Portal gradient circle |
| **User info** | max 120px | - | Hidden on tablet (lg-) |

**Mobile Layout (< 640px):**

```
┌─────────────────────────────────────────┐
│  ┌──┐ Title                  Bell User │
│  │☰│ Page Title            (2)  JD ▼ │
│  └──┘                                  │
└─────────────────────────────────────────┘
```

**Mobile adjustments:**
- Logo hidden (burger only)
- Title larger, no subtitle
- Search hidden
- Help button hidden
- User name hidden (only avatar + chevron)

**Responsive Breakpoints:**

| Breakpoint | Visible Elements |
|------------|-----------------|
| **mobile** < 640px | Burger, Title, Bell, Avatar+Chevron |
| **tablet** ≥ 640px | Logo, Title, Bell, Help, Avatar+Info |
| **desktop** ≥ 1024px | All elements + Search |

**Key Principles:**
- **Height:** Fixed 56px (h-14) - consistent across all pages
- **Background:** Semi-transparent with backdrop blur (content shows through)
- **Border:** Single bottom border, dual-layer shadow for depth
- **No heavy shadows** - Vercel avoids heavy header shadows
- **Left-to-right flow:** Burger → Logo → Title → (Search) → Actions → User

### 3.4 Breadcrumbs - Clean, Subtle

```tsx
// BEFORE (Heavy, pill-shaped)
<div className="bg-gray-100 rounded-full px-4 py-2">

// AFTER (Engineer Premium - Vercel-style)
<nav className="flex items-center gap-1.5 text-sm">
  {/* Home */}
  <a href="/dashboard" className="
    text-gray-400
    hover:text-gray-600
    transition-colors duration-150
  ">
    <Home className="w-4 h-4" />
  </a>

  {/* Separator */}
  <span className="text-gray-300">/</span>

  {/* Level 1 */}
  <a href="/classes" className="
    text-gray-500
    hover:text-gray-700
    transition-colors duration-150
  ">
    Classes
  </a>

  {/* Separator */}
  <span className="text-gray-300">/</span>

  {/* Current page - no link */}
  <span className="text-[#000000] font-medium">
    Class Details
  </span>
</nav>
```

**Breadcrumb Styles:**

| State | Color | Font |
|-------|-------|------|
| **Home icon** | #9ca3af (gray-400) | - |
| **Clickable** | #6b7280 (gray-500) | Regular |
| **Current** | #000000 | Medium |
| **Separator** | #d1d5db (gray-300) | - |

### 3.5 Command Palette (Cmd+K) - Vercel-Style Search

**File:** `src/components/ui/command-palette.tsx`

This is the signature "super search" that Vercel/Clerk use - accessible via Cmd+K (Mac) or Ctrl+K (Windows).

```tsx
"use client";

import { Command } from "cmdk";
import { useState, useEffect } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      {/* Backdrop overlay */}
      <Command.Overlay className="
        fixed inset-0
        bg-black/20
        backdrop-blur-sm
        z-50
        transition-opacity duration-150
      " />

      {/* Command dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <Command.Content className="
          w-full max-w-lg mx-4
          bg-white
          border border-gray-200
          /* Dual-layer border */
          shadow-[0_0_0_1px_rgba(255,255,255,0.8)_inset,0_16px_48px_rgba(0,0,0,0.15)]
          rounded-[8px]
          overflow-hidden
          animate-in fade-in slide-in-from-top-4
          duration-150 ease-out
        ">
          {/* Search input */}
          <div className="flex items-center border-b border-gray-100 px-4">
            <Search className="w-4 h-4 text-gray-400" />
            <Command.Input
              placeholder="Search anything..."
              className="
                flex-1 h-12 px-3
                bg-transparent
                border-none
                text-[15px]
                text-[#000000]
                placeholder:text-gray-400
                focus:outline-none
              "
            />
            {/* Keyboard hint */}
            <kbd className="
              hidden sm:inline-flex
              items-center gap-1
              px-2 py-0.5
              bg-gray-100
              border border-gray-200 rounded
              text-[11px] text-gray-500
            ">
              <span>⌘</span><span>K</span>
            </kbd>
          </div>

          {/* Results list */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            {/* Group: Navigation */}
            <Command.Group heading={
              <div className="px-2 py-1.5 text-[13px] font-medium text-gray-500">
                Navigation
              </div>
            }>
              <Command.Item className="
                group flex items-center gap-3
                px-3 py-2
                rounded-[6px]
                text-[14px] text-gray-700
                cursor-pointer
                hover:bg-gray-100
                data-[selected=true]:bg-gray-100
                transition-colors duration-75
              ">
                <LayoutDashboard className="w-4 h-4 text-gray-400" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item className="
                group flex items-center gap-3
                px-3 py-2
                rounded-[6px]
                text-[14px] text-gray-700
                cursor-pointer
                hover:bg-gray-100
                data-[selected=true]:bg-gray-100
              ">
                <Users className="w-4 h-4 text-gray-400" />
                <span>Students</span>
              </Command.Item>
            </Command.Group>

            {/* Group: Actions */}
            <Command.Group heading={
              <div className="px-2 py-1.5 text-[13px] font-medium text-gray-500">
                Actions
              </div>
            }>
              <Command.Item className="
                group flex items-center gap-3
                px-3 py-2
                rounded-[6px]
                text-[14px] text-gray-700
                cursor-pointer
                hover:bg-gray-100
                data-[selected=true]:bg-gray-100
              ">
                <Plus className="w-4 h-4 text-gray-400" />
                <span>Create New</span>
              </Command.Item>
            </Command.Group>

            {/* No results */}
            <Command.Empty className="py-8 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>
          </Command.List>

          {/* Footer - keyboard navigation hint */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-[12px] text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
                <span>to select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">esc</kbd>
                <span>to close</span>
              </span>
            </div>
          </div>
        </Command.Content>
      </div>
    </Command.Dialog>
  );
}
```

**Command Palette Specs:**

| Element | Spec |
|---------|------|
| **Trigger** | `Cmd+K` (Mac) / `Ctrl+K` (Windows) |
| **Position** | Fixed, 20% from top, centered horizontally |
| **Max width** | 512px (max-w-lg) |
| **Animation** | Fade in + slide from top (20px), 150ms |
| **Border** | Dual-layer "milled" effect |
| **Shadow** | Deep layer for floating feel |
| **Radius** | 8px (consistent with cards) |
| **Backdrop** | 20% black blur, 8px blur |

**Search Input:**

| Element | Spec |
|---------|------|
| **Height** | 48px (h-12) |
| **Font size** | 15px |
| **Placeholder** | "Search anything..." |
| **Icon** | Search, 16px, gray-400 |
| **Hint badge** | ⌘K, 11px, gray-500, gray-100 bg |

**Results Item:**

| State | Background | Text |
|-------|------------|------|
| **Default** | Transparent | 14px, gray-700 |
| **Hover/Selected** | gray-100 | gray-700 |
| **Icon** | - | 16px, gray-400 |
| **Height** | 36px (py-2) |

**Footer Keyboard Hints:**

```
┌─────────────────────────────────────────────────────┐
│  ↑↓ to navigate    ↵ to select    esc to close   │
└─────────────────────────────────────────────────────┘
```

| Hint | Style |
|------|-------|
| **Keys** | 12px, gray-100 bg, gray-200 border |
| **Text** | 12px, gray-400 |
| **Gap** | 16px between hints |

**Trigger Button (optional, in header):**

```tsx
<button
  onClick={() => setOpen(true)}
  className="
    flex items-center gap-2
    px-3 py-1.5
    bg-gray-50
    border border-gray-200
    rounded-[6px]
    text-sm text-gray-500
    hover:bg-gray-100
    hover:text-gray-700
    transition-colors duration-150
  "
>
  <Search className="w-4 h-4" />
  <span>Search...</span>
  <kbd className="ml-auto text-[11px] text-gray-400">
    ⌘K
  </kbd>
</button>
```

**Key Principles:**
- **Keyboard-first** - fully navigable with arrow keys
- **Fast** - 150ms animations, feels instant
- **Clean** - minimal styling, no distraction
- **Grouped** - navigation, actions, settings sections
- **No results state** - helpful message when empty

---

## Phase 4: Typography & Fonts

### Premium Font: Geist

**Install:**
```bash
npm install geist
```

**Add to `src/app/globals.css`:**
```css
@import "geist/font";

:root {
  --font-sans: 'Geist Sans', -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}

body {
  font-family: var(--font-sans);
}
```

### Premium Typography Classes

**Engineer Premium Gray Scaling (Vercel/Clerk Style):**

```css
/* Add to globals.css */
:root {
  /* Precise gray scaling - NOT Tailwind defaults */
  --text-primary: #000000;      /* Pure black for headings */
  --text-secondary: #666666;    /* Medium gray for body */
  --text-tertiary: #888888;     /* Light gray for labels */
  --text-muted: #a0a0a0;        /* Subtle/disabled text */
}

.prose-engineer {
  /* Better tracking for headings */
  h1, h2, h3, h4, h5, h6 {
    letter-spacing: -0.02em;
    font-weight: 600;
    color: var(--text-primary);
  }

  /* Body with proper secondary gray */
  p {
    line-height: 1.7;
    color: var(--text-secondary);
  }

  /* Labels with tertiary gray */
  label, .label {
    color: var(--text-tertiary);
    font-size: 14px;
    font-weight: 500;
  }

  /* Muted text */
  .text-muted {
    color: var(--text-muted);
  }
}

/* Subtle gradient text option (Designer Premium) */
.text-gradient {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, currentColor 0%, rgba(0,0,0,0.7) 100%);
}
```

**Typography Hierarchy:**

| Element | Size | Weight | Color | Use Case |
|---------|------|--------|-------|----------|
| **H1** | 32px | 600 | #000000 | Page titles |
| **H2** | 24px | 600 | #000000 | Section headers |
| **H3** | 18px | 600 | #000000 | Card titles |
| **Body** | 14px | 400 | #666666 | Primary content |
| **Small** | 13px | 400 | #888888 | Secondary info |
| **Label** | 14px | 500 | #888888 | Form labels |

---

## Phase 5: Animations & Motion

### Animation Timing - Two Speeds

**Engineer Premium (Vercel/Clerk): 150ms**
```css
/* Snappy, feels instantaneous - use for functional UI */
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring for micro-interactions */
transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Designer Premium (Linear/Notion): 300ms**
```css
/* Smooth, deliberate - use for marketing/hero sections */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring for page transitions */
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Motion Token Updates

```typescript
export const motion = {
  // Engineer Premium - Snappy (Vercel style)
  snappy: {
    duration: 0.15,  // 150ms
    ease: [0.4, 0, 0.2, 1],
  },
  microSpring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },

  // Designer Premium - Smooth (Linear style)
  smooth: {
    duration: 0.3,   // 300ms
    ease: [0.4, 0, 0.2, 1],
  },
  pageSpring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
} as const;
```

### Smooth Page Transitions

```tsx
// Add to layout files - Engineer Premium (150ms)
<motion.main
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
>
  {children}
</motion.main>

// OR Designer Premium (300ms) for landing pages
<motion.main
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
  {children}
</motion.main>
```

### Staggered List Animations

```tsx
<motion.div
  variants={{
    container: {
      animate: {
        transition: {
          staggerChildren: 0.1,
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
    }
  }}
>
  {items.map(item => (
    <motion.div key={item.id} variants="item">
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## Light & Dark Mode Together

Each component gets both modes:

```tsx
className={cn(
  // Light mode
  "bg-white/60 backdrop-blur-xl border-gray-200/60",
  // Dark mode
  "dark:bg-gray-900/60 dark:backdrop-blur-xl dark:border-gray-700/60"
)}
```

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Install dependencies (Geist font, cmdk) | `package.json` |
| 2 | Add Engineer Premium tokens | `src/styles/design-tokens.ts` |
| 3 | Update globals.css with gray scaling | `src/app/globals.css` |
| 4 | Create Command Palette component | `src/components/ui/command-palette.tsx` |
| 5 | Transform Card component | `src/components/ui/card.tsx` |
| 6 | Transform Button component | `src/components/ui/button.tsx` |
| 7 | Transform Input component | `src/components/ui/input.tsx` |
| 8 | Transform Dialog/Modal | `src/components/ui/dialog.tsx` |
| 9 | Update Sidebar navigation | Sidebar components |
| 10 | Update Header component | Header components across portals |
| 11 | Update typography styles | `globals.css` |
| 12 | Add 150ms page transitions | Layout files |

---

## Dependencies to Install

```bash
# Premium font
npm install geist

# Command palette (Vercel-style Cmd+K search)
npm install cmdk
```

---

## Verification

1. **Visual Check:** Does it look like Linear/Vercel/Notion?
2. **Animation Check:** Are transitions smooth (60fps)?
3. **Spacing Check:** Is there generous whitespace?
4. **Depth Check:** Is there glassmorphism/shadows?
5. **Responsive Check:** Does it work on mobile?
6. **Build Check:** `npx tsc --noEmit && npm run build`

---

## Files to Modify

**Dependencies:**
- `package.json` - Add `geist`, `cmdk`

**Core (Start Here):**
- `src/styles/design-tokens.ts` - Add Engineer Premium tokens
- `src/app/globals.css` - Add premium utilities + Geist font + gray scaling
- `src/components/ui/card.tsx` - Dual-layer borders
- `src/components/ui/button.tsx` - Portal gradients + secondary variant
- `src/components/ui/input.tsx` - Floating labels + keyboard-only focus
- `src/components/ui/dialog.tsx` - Glass overlay + slide from right
- `src/components/ui/command-palette.tsx` - **NEW** Cmd+K search

**Navigation:**
- `src/components/**/*sidebar*.tsx` - Clean minimal borders
- `src/components/**/*header*.tsx` - Engineer Premium header layout
- `src/config/portal-config.ts` - Collapsible sections, reorganized

**Typography:**
- `src/app/globals.css` - Geist font + gray scaling

---

## Summary

**From:** Traditional admin panel
**To:** Engineer Premium (Vercel/Clerk-inspired)

### Key Changes

| Category | Change |
|----------|--------|
| **Borders** | Dual-layer micro-borders (inner highlight + outer shadow) |
| **Typography** | Geist font + precise grays (#000, #666, #888) |
| **Spacing** | Information-dense (24px padding) |
| **Animations** | 150ms snappy (feels instantaneous) |
| **Radius** | Consistent 8px cards, 6px buttons |
| **Colors** | Monochrome + portal accent gradients |
| **Focus** | Keyboard-only rings (cleaner for mouse) |
| **Depth** | Subtle dual-layer shadows, not heavy blur |

### Visual Comparison

```
┌─────────────────────────────────────────────────────┐
│          BEFORE (Traditional)                       │
├─────────────────────────────────────────────────────┤
│  - Standard Tailwind components                     │
│  - Flat borders, no depth                           │
│  - Mixed border radius (8px, 12px, 16px)            │
│  - Slow animations (300ms+)                         │
│  - Generic gray colors                              │
│  - Heavy shadows                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          AFTER (Engineer Premium)                   │
├─────────────────────────────────────────────────────┤
│  - Dual-layer "milled" borders                      │
│  - Inner highlight + outer shadow                   │
│  - Consistent 8px/6px radius                        │
│  - 150ms snappy animations                          │
│  - Precise #000/#666/#888 grays                     │
│  - Subtle, functional shadows                       │
│  - Keyboard-only focus rings                        │
└─────────────────────────────────────────────────────┘
```

### Portal Gradient Accents (Preserved)

While most UI is monochrome, portal identity uses gradients:

| Portal | Gradient |
|--------|----------|
| Student | Orange `from-orange-500 to-orange-600` |
| Teacher | Blue `from-blue-500 to-blue-600` |
| Parent | Gray `from-gray-500 to-gray-600` |
| Counselor | Purple `from-purple-500 to-purple-600` |
| Admin | Pink `from-pink-500 to-pink-600` |
| School-Admin | Violet `from-violet-500 to-violet-600` |
| Ministry | Teal `from-teal-500 to-teal-600` |
