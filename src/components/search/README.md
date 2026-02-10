# Search Dialog Component

A command palette style search dialog component for the Career Compass platform. Provides keyboard-driven navigation across careers, scholarships, and resources.

## Features

- **Keyboard Shortcuts**: Open with `Cmd+K` / `Ctrl+K` or `/`
- **Real-time Search**: Instant results with highlighting
- **Category Grouping**: Results organized by type (Careers, Scholarships, Resources)
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select
- **Accessibility**: Full ARIA labels and screen reader support
- **Dark Mode**: Automatic theme support
- **Responsive**: Works on mobile and desktop
- **Customizable**: Scope search to specific categories or use custom data sources

## Installation

The component is located at:
```
src/components/search/search-dialog.tsx
```

## Basic Usage

### Quick Start (Default Mode)

```tsx
import { SearchDialog } from "@/components/search";

export default function Header() {
  return (
    <div>
      <SearchDialog />
    </div>
  );
}
```

Press `Cmd+K` or `Ctrl+K` to open the search dialog.

### With Trigger Button

```tsx
import { SearchDialog, SearchTriggerButton } from "@/components/search";

export default function Header() {
  return (
    <SearchDialog trigger={<SearchTriggerButton />} />
  );
}
```

### Controlled Mode

```tsx
"use client";

import { useState } from "react";
import { SearchDialog } from "@/components/search";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Search</button>
      <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
```

### With Custom Scope

Limit search to specific categories:

```tsx
<SearchDialog searchScope="careers" />
<SearchDialog searchScope="scholarships" />
<SearchDialog searchScope="resources" />
```

### With Custom Data

```tsx
const customItems = [
  {
    id: "1",
    type: "career",
    title: "Custom Career",
    description: "A custom career entry",
    url: "/custom/career",
    category: "Technology",
    tags: ["Tech", "IT"],
  },
];

<SearchDialog searchItems={customItems} />
```

### With API Search

For fetching results from an API:

```tsx
<SearchDialog
  onSearch={async (query, scope) => {
    const response = await fetch(`/api/search?q=${query}&scope=${scope}`);
    return response.json();
  }}
/>
```

### With Selection Callback

```tsx
<SearchDialog
  onSelect={(item) => {
    console.log("Selected:", item);
    // Handle navigation or other actions
  }}
/>
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open search dialog |
| `/` | Open search (when not in an input) |
| `Escape` | Close dialog |
| `Arrow Down` | Navigate to next result |
| `Arrow Up` | Navigate to previous result |
| `Enter` | Select highlighted result |

## Props

### SearchDialogProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | "Search careers, scholarships, resources..." | Input placeholder text |
| `searchScope` | `"all" \| "careers" \| "scholarships" \| "resources"` | `"all"` | Limit search to specific category |
| `open` | `boolean` | - | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when open state changes |
| `trigger` | `ReactNode` | - | Custom trigger button |
| `searchItems` | `SearchItem[]` | - | Custom search data (overrides mock data) |
| `onSearch` | `(query: string, scope: SearchScope) => Promise<SearchItem[]>` | - | Custom async search function |
| `onSelect` | `(item: SearchItem) => void` | - | Callback when item is selected |
| `className` | `string` | - | Additional CSS classes |

### SearchItem Interface

```typescript
interface SearchItem {
  id: string;
  type: "career" | "scholarship" | "resource";
  title: string;
  description: string;
  url?: string;
  category?: string;
  tags?: string[];
  icon?: React.ReactNode;
}
```

### SearchTriggerButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Additional CSS classes |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Button size |
| `variant` | `"default" \| "minimal"` | `"default"` | Button style variant |

## Hook

### useSearchDialog

Programmatically control the search dialog:

```tsx
"use client";

import { useSearchDialog } from "@/components/search";

export default function CustomSearchButton() {
  const { isOpen, open, close, toggle } = useSearchDialog();

  return (
    <>
      <button onClick={open}>Open Search</button>
      <SearchDialog open={isOpen} onOpenChange={(value) => !value && close()} />
    </>
  );
}
```

## Styling

The component uses Tailwind CSS and follows the project's design system. It includes:

- Clerk-inspired premium design
- Smooth animations with Framer Motion
- Dark mode support via `next-themes`
- Responsive design for mobile devices
- Highlighted matching text in results

## Accessibility

- Full ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Escape key to close
- Visible focus indicators

## Examples

### In Navigation Bar

```tsx
// src/components/layout/navigation.tsx
import { SearchDialog, SearchTriggerButton } from "@/components/search";

export function Navigation() {
  return (
    <nav className="flex items-center gap-4">
      <Logo />
      <NavLinks />
      <div className="ml-auto">
        <SearchDialog trigger={<SearchTriggerButton />} />
      </div>
    </nav>
  );
}
```

### Global Keyboard Shortcut

The component automatically registers global keyboard shortcuts. Just include it in your layout:

```tsx
// src/app/layout.tsx
import { SearchDialog } from "@/components/search";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SearchDialog />
        {children}
      </body>
    </html>
  );
}
```

## Notes

- The mock data includes sample careers, scholarships, and resources
- Connect to your database or API by providing `onSearch` function
- The component uses `framer-motion` for smooth animations
- Dialog clicks outside to close
- Search is debounced with 200ms delay
