# Portal Color System

## Overview

Each portal in the Career Compass system has a unique color gradient used for branding and UI elements. These colors are defined in `portal-sidebar.tsx` and should be used consistently across all portal-specific components.

---

## Portal Colors (RGB Gradients)

```typescript
// From portal-sidebar.tsx - use these for all portal styling
student:      "rgb(249 115 22) → rgb(194 65 12)"    // Orange
teacher:      "rgb(59 130 246) → rgb(37 99 235)"    // Blue
parent:       "rgb(107 114 128) → rgb(75 85 99)"    // Gray
counselor:    "rgb(168 85 247) → rgb(147 51 234)"   // Purple
admin:        "rgb(236 72 153) → rgb(219 39 119)"   // Pink
school-admin: "rgb(139 92 246) → rgb(124 58 237)"   // Violet
```

---

## Usage in Components

### Inline Style (Required for Gradients)

```tsx
// ✅ CORRECT - Use inline styles for gradients
<div style={{
  background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)'
}}>
  Student Portal Content
</div>

// ❌ WRONG - Do NOT use Tailwind classes for custom gradients
<div className="from-student-orange to-student-orange-dark">
  This will cause build errors!
</div>
```

### Portal Theme Object

```tsx
// src/design-system/tokens/index.ts
export const portalThemes = {
  student: {
    name: 'Student',
    gradientInline: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)',
    primary: 'rgb(249 115 22)',
    primaryDark: 'rgb(194 65 12)',
  },
  teacher: {
    name: 'Teacher',
    gradientInline: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    primary: 'rgb(59 130 246)',
    primaryDark: 'rgb(37 99 235)',
  },
  // ... other portals
}
```

---

## Color Best Practices

1. **Always use inline styles for gradients** - Tailwind custom classes for gradients cause build errors
2. **Match portal colors consistently** - Use the correct gradient for each portal
3. **Test contrast** - Ensure text is readable on gradient backgrounds
4. **Use semantic colors** - Don't mix portal colors (e.g., don't use teacher blue on student pages)

---

## Known Issues

### Color System Conflict
- `design-system/tokens/index.ts` defines navy/teal/terra-cotta palette
- `globals.css` uses orange/silver theme
- **Decision:** Stick with the portal-specific gradients defined above

---

## Portal-Specific Components

These components automatically use the correct portal colors:
- `PortalSidebar` - Main navigation sidebar
- `PortalHeader` - Top header bar
- `homework-creator.tsx` - Teacher homework creation
- `attendance-tracker.tsx` - Attendance taking interface
