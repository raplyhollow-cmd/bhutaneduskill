# Design System Documentation

UI/UX standards, design patterns, and component guidelines.

## Documents

| Document | Description |
|----------|-------------|
| **[Homepage Redesign](HOMEPAGE_REDESIGN.md)** | ⭐ Latest: User selector, social proof, quick start guide |
| **[Smart UX Components](SMART_UX_COMPONENTS.md)** | Complete reference for all Smart UX components |
| [UX Revolution](UX_REVOLUTION_COMPONENTS.md) | Progressive UX components (in-place editing, etc.) |
| [UX Standards](ux-standards.md) | Comprehensive UX design standards |
| [Portal Colors](portal-colors.md) | Color schemes for each portal |
| [Component Patterns](component-patterns.md) | Component usage patterns and guidelines |
| [Advanced UX/UI](advanced-ux-ui.md) | Premium UX patterns and references |

## Portal Color Reference

| Portal | Primary Gradient | Use Case |
|--------|------------------|----------|
| **Student** | `rgb(249 115 22) → rgb(194 65 12)` | Student portal, career planning |
| **Teacher** | `rgb(59 130 246) → rgb(37 99 235)` | Teacher portal, classroom management |
| **Parent** | `rgb(107 114 128) → rgb(75 85 99)` | Parent portal, child progress |
| **Counselor** | `rgb(168 85 247) → rgb(147 51 234)` | Counselor portal, interventions |
| **School Admin** | `rgb(139 92 246) → rgb(124 58 237)` | School admin portal |
| **Platform Admin** | `rgb(236 72 153) → rgb(219 39 119)` | Platform admin, multi-school |
| **Ministry** | `rgb(168 85 247) → rgb(147 51 234)` | Ministry portal, national |

## Styling Rules

### Gradients
**NEVER use Tailwind gradient classes** - always use inline styles.

```tsx
// CORRECT
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>

// WRONG - causes build errors
<div className="from-orange-500 to-orange-600">
```

### Framer Motion
**ALWAYS include `repeatType: "loop"`** when using `repeat: Infinity`.

```tsx
// CORRECT
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{ repeat: Infinity, repeatType: "loop", duration: 2 }}
/>

// WRONG - causes runtime error
transition={{ repeat: Infinity, duration: 2 }}
```

### Component Padding Standards
- **Cards:** `px-6 py-5`
- **Buttons:** `px-4 py-2` with `h-10`
- **Inputs:** `px-4 py-2.5` with `h-10`
- **Tables:** `px-4 py-3` for cells, `h-12 px-4` for headers

## Design References
- Vercel - Clean, minimal aesthetics
- Clerk - Modern auth flows
- Notion - Information density
- Instagram - Visual polish
- Spotify - Smooth interactions

For more design patterns, see [component-patterns.md](component-patterns.md).
