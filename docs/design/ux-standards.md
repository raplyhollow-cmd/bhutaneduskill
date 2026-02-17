# UX/UI Design System

## Overview

Clerk-inspired premium design system with focus on accessibility, animations, and mobile-first responsive design.

---

## Layout Patterns

### Bento Grid Layout
**Clerk's signature card grid layout**
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards with different sizes */}
  <div className="md:col-span-2">Feature highlight</div>
  <div>Stat card</div>
  <div>Small feature</div>
</div>
```

### Two-Column Feature Sections
**Alternating left-right content**
```tsx
<section className="py-24">
  <div className="mx-auto max-w-7xl px-6">
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <h2>Feature title</h2>
        <p>Description...</p>
      </div>
      <div className="rounded-xl border border-gray-200 p-8">
        {/* Visual/demo */}
      </div>
    </div>
  </div>
</section>
```

---

## Premium Component Patterns

### 1. Card with Integrated Action
```tsx
<div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg">
  <div className="p-6">
    <h3 className="text-xl font-bold">Feature</h3>
    <p className="mt-2 text-gray-600">Description</p>
  </div>
  <div className="border-t border-gray-100 p-4">
    <button className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
      Learn more
    </button>
  </div>
</div>
```

### 2. Code Block with Copy
```tsx
<div className="rounded-xl border border-gray-200 bg-gray-900 p-4">
  <div className="mb-4 flex items-center justify-between">
    <span className="text-sm text-gray-400">Code</span>
    <button className="text-xs text-gray-400 hover:text-white">Copy</button>
  </div>
  <pre className="overflow-x-auto"><code className="text-sm">...</code></pre>
</div>
```

### 3. Feature List with Icons
```tsx
<ul className="space-y-4">
  {features.map((feature) => (
    <li key={feature.title} className="flex items-start gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100">
        <Check className="h-4 w-4 text-purple-600" />
      </div>
      <div>
        <h4 className="font-semibold">{feature.title}</h4>
        <p className="text-sm text-gray-600">{feature.description}</p>
      </div>
    </li>
  ))}
</ul>
```

### 4. Comparison Table
```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="py-3 text-left text-sm font-medium">Feature</th>
      <th className="py-3 text-center text-sm font-medium">Free</th>
      <th className="py-3 text-center text-sm font-medium bg-purple-50">Pro</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((row) => (
      <tr key={row.feature} className="border-b border-gray-100">
        <td className="py-3 text-sm">{row.feature}</td>
        <td className="py-3 text-center">
          {row.free ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-gray-300" />}
        </td>
        <td className="py-3 text-center bg-purple-50/50">
          {row.pro ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-gray-300" />}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 5. Badge/Tag Styles
```tsx
// Primary badge
<span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
  New
</span>

// Success badge
<span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
  Active
</span>

// Outline badge
<span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
  Beta
</span>
```

### 6. Alert/Notification Banners
```tsx
<div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
  <div className="flex items-start gap-3">
    <Info className="h-5 w-5 text-purple-600 mt-0.5" />
    <div>
      <h4 className="font-medium text-purple-900">New feature</h4>
      <p className="mt-1 text-sm text-purple-700">Description of the new feature...</p>
    </div>
    <button className="ml-auto text-purple-400 hover:text-purple-600">
      <X className="h-4 w-4" />
    </button>
  </div>
</div>
```

### 7. Tabs Navigation
```tsx
<div className="border-b border-gray-200">
  <nav className="-mb-px flex gap-8" aria-label="Tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={cn(
          "border-b-2 py-4 text-sm font-medium transition-colors",
          activeTab === tab.id
            ? "border-purple-600 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        )}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

### 8. Accordion/Collapsible
```tsx
<div className="rounded-xl border border-gray-200">
  {items.map((item, i) => (
    <div key={i} className="border-b border-gray-200 last:border-0">
      <button className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-gray-50">
        {item.title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="p-4 pt-0 text-sm text-gray-600">
          {item.content}
        </div>
      )}
    </div>
  ))}
</div>
```

---

## Interaction States

### Button States
```tsx
<button className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
  Button
</button>
```

### Link States
```tsx
<a className="text-purple-600 underline-offset-4 hover:text-purple-700 hover:underline">
  Link text
</a>
```

### Input Focus States
```tsx
<input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:bg-gray-100" />
```

---

## Mobile-Specific Patterns

### Bottom Sheet (Mobile)
```tsx
<div className="fixed inset-x-0 bottom-0 rounded-t-2xl border border-gray-200 bg-white p-6 shadow-2xl md:hidden">
  <div className="mb-4 flex items-center justify-center">
    <div className="h-1 w-12 rounded-full bg-gray-300" />
  </div>
  {/* Content */}
</div>
```

### Mobile Navigation Drawer
```tsx
{/* Overlay */}
<div className={cn("fixed inset-0 bg-black/50 transition-opacity", isOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={close} />

{/* Drawer */}
<div className={cn("fixed right-0 top-0 h-full w-80 bg-white shadow-xl transition-transform", isOpen ? "translate-x-0" : "translate-x-full")}>
  {/* Nav content */}
</div>
```

---

## Dark Mode Patterns

```tsx
// Use CSS variables for theming
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 262.1 83.3% 57.3%;
  --border: 214.3 31.8% 91.4%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
}
```

---

## Performance Optimizations

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={630}
  priority
  className="rounded-2xl"
/>
```

### Lazy Loading Components
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded" />,
})
```

---

## Copywriting Patterns (Clerk Style)

### Hero Headlines
- "More than authentication, Complete User Management"
- "Plans for every stage"
- "Start now, no strings attached"

### Value Propositions
- Clear: "The easiest way to add authentication"
- Specific: "50,000 monthly retained users included"
- Trust: "Trusted by fast-growing companies"

### Button Copy
- Action-oriented: "Start building", "Get started"
- Clear value: "View pricing", "Read documentation"
- Low friction: "Sign in", "Create account"

---

## UI Components Library

**Status: February 10, 2026 - 98% Complete ✅**

### Core Form Components
| Component | Status | Notes |
|-----------|--------|-------|
| Button | ✅ Enhanced | 44x44px touch targets, variants: default/ghost/outline/destructive/link |
| Input | ✅ | Standard text input with variants |
| Label | ✅ Enhanced | Form labels with proper spacing |
| Textarea | ✅ | Multi-line text input |
| Checkbox | ✅ NEW | Full checkbox with indeterminate state |
| Radio Group | ✅ NEW | Radio button group with keyboard nav |
| Select | ✅ | Dropdown select component |
| Switch | ✅ | Toggle switch |

### Data Display Components
| Component | Status | Notes |
|-----------|--------|-------|
| Card | ✅ | Card, CardHeader, CardTitle, CardContent, CardFooter |
| Badge | ✅ | Status badges with variants |
| Table | ✅ | Data tables with proper styling |
| Avatar | ✅ Enhanced | With fallbacks, loading states |
| Progress | ✅ Enhanced | Animated progress bars |
| Separator | ✅ | Visual dividers |

### Feedback & Overlay Components
| Component | Status | Notes |
|-----------|--------|-------|
| Dialog | ✅ NEW | Modal dialog with overlay |
| Alert Dialog | ✅ NEW | Confirmation dialogs |
| Toast | ✅ NEW | Toast notifications with Toaster provider |
| Alert | ✅ | Info/success/warning/error alerts |
| Empty State | ✅ Enhanced | Empty data states with actions |

### Skeleton Loading Components
| Component | Status | Notes |
|-----------|--------|-------|
| Skeleton | ✅ | Base skeleton loader |
| Card Skeleton | ✅ Enhanced | Card loading state |
| Input Skeleton | ✅ Enhanced | Input loading state |
| Button Skeleton | ✅ Enhanced | Button loading state |
| Table Skeleton | ✅ | Table loading state |

### Navigation Components
| Component | Status | Notes |
|-----------|--------|-------|
| Tabs | ✅ Enhanced | Tab navigation with min-height touch targets |
| Dropdown Menu | ✅ Enhanced | With proper touch targets |
| Navigation Menu | ✅ | Complex navigation |
| Breadcrumb | ✅ | Breadcrumb navigation |
| Pagination | ✅ | Page navigation |

### Specialized Components
| Component | Status | Notes |
|-----------|--------|-------|
| User Button | ✅ Enhanced | Avatar dropdown with account switcher |
| Organization Switcher | ✅ Enhanced | Multi-org management with keyboard nav |
| Circuit Background | ✅ | Tech pattern background |
| Hero Glow | ✅ Enhanced | Performance optimized glow effects |
| CTA Section | ✅ Enhanced | Call-to-action blocks with animations |
| Portal Sidebar | ✅ | Main sidebar for all portals |
| Portal Header | ✅ | Header component for portals |

---

## Clerk-Inspired Marketing Components

1. ✅ `circuit-background.tsx` - Animated circuit board pattern
2. ✅ `hero-glow.tsx` - Multi-colored glow effects
3. ✅ `user-button.tsx` - Avatar dropdown with account switcher
4. ✅ `organization-switcher.tsx` - Multi-org management
5. ✅ `pricing-card.tsx` - Premium pricing tables
6. ✅ `testimonial-grid.tsx` - Testimonials with photos
7. ✅ `trusted-logos.tsx` - Animated logo grid
8. ✅ `cta-section.tsx` - Glowing CTA blocks
9. ✅ `form-input.tsx` - Clerk-style inputs
10. ✅ `loading-skeleton.tsx` - Premium skeleton states
11. ✅ `navigation.tsx` - Sticky header with backdrop
12. ✅ `mobile-menu.tsx` - Full-screen overlay menu
