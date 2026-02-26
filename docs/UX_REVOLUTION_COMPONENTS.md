# Clerk-Style UX Revolution Components

> **Created:** 2026-02-25
> **Status:** Complete
> **Demo Page:** `/ux-demo`

## Overview

This document describes the new progressive UX components built to replace traditional "save/ok/cancel" button patterns with modern, in-place interactions inspired by Linear, Clerk, and Notion.

## Design Philosophy

- **No more save buttons** - Auto-save on blur/enter
- **Edit where you read** - In-place editing
- **One question at a time** - Progressive disclosure
- **Immediate feedback** - Toast confirmations
- **Keyboard-first** - Shortcuts and navigation

---

## Components

### 1. Command Palette

**File:** `src/components/ui/command-palette.tsx`

**Features:**
- `Cmd+K` / `Ctrl+K` shortcut to open
- Searchable commands with fuzzy matching
- Keyboard navigation (arrows + enter)
- Grouped commands with icons
- Recent commands
- Custom keyboard shortcuts display

**Usage:**
```tsx
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"

function App() {
  const { isOpen, open, close } = useCommandPalette()

  const commands = [
    {
      id: "new-student",
      label: "Add new student",
      icon: Plus,
      shortcut: "N",
      action: () => router.push("/students/create")
    },
  ]

  return (
    <>
      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />
      <button onClick={open}>Open (Cmd+K)</button>
    </>
  )
}
```

**Animation Patterns:**
- Backdrop fade: 200ms
- Modal scale: Spring (stiffness: 400, damping: 30)
- Item stagger: 30ms delay per item
- Hover scale: 1.01

---

### 2. Express Add Modal

**File:** `src/components/ui/express-add-modal.tsx`

**Features:**
- Single field focused for quick input
- Auto-submit on blur (configurable)
- Enter key to submit
- Toast confirmation on success
- Skeleton loading state
- Character count and validation

**Usage:**
```tsx
import { ExpressAddModal, useExpressAdd, ExpressAddButton } from "@/components/ui/express-add-modal"

function StudentList() {
  const { isOpen, open, close } = useExpressAdd()

  const handleAdd = async (name: string) => {
    await createStudent({ name })
    return { success: true }
  }

  return (
    <>
      <ExpressAddButton onClick={open}>Add Student</ExpressAddButton>
      <ExpressAddModal
        isOpen={isOpen}
        onClose={close}
        onSubmit={handleAdd}
        title="Add Student"
        placeholder="Enter student name..."
        successMessage="Student added successfully"
        minLength={2}
        maxLength={50}
      />
    </>
  )
}
```

**Animation Patterns:**
- Backdrop fade: 150ms
- Modal spring: stiffness 400, damping 30
- Progress bar: 300ms fill on open
- Loading spinner: Infinite rotation

---

### 3. In-Place Editor

**File:** `src/components/ui/in-place-editor.tsx`

**Features:**
- Click to edit inline (no modal)
- Auto-save on blur
- Escape to cancel
- Visual feedback during edit
- Optimistic UI updates
- Multi-line textarea variant
- Undo support (with timeout)

**Usage - Text Input:**
```tsx
import { InPlaceText, InPlaceField } from "@/components/ui/in-place-editor"

function StudentName() {
  const [name, setName] = useState("Tashi Wangyel")

  const handleSave = async (newValue: string) => {
    await updateStudent({ name: newValue })
    return { success: true }
  }

  return (
    <InPlaceText
      value={name}
      onSave={handleSave}
      onChange={setName}
      placeholder="Student name"
      minLength={2}
    />
  )
}
```

**Usage - Field with Label:**
```tsx
<InPlaceField
  label="Email"
  value={email}
  onSave={handleSave}
  type="email"
  placeholder="Email address"
/>
```

**Usage - Textarea:**
```tsx
<InPlaceTextarea
  value={bio}
  onSave={handleSave}
  placeholder="Student bio"
  rows={3}
  maxLength={200}
/>
```

**Usage - With Undo:**
```tsx
<InPlaceTextWithUndo
  value={name}
  onSave={handleSave}
  onChange={setName}
/>
```

**Animation Patterns:**
- Hover scale: 1.01
- Tap scale: 0.99
- Icon fade in on hover
- Loading spinner: Infinite rotation
- Undo button: Scale in (0.8 -> 1)

---

### 4. Progressive Form

**File:** `src/components/ui/progressive-form.tsx`

**Features:**
- One question at a time
- Auto-advance on valid input
- Progress indicator
- Back navigation
- Smooth slide transitions
- Keyboard shortcuts (Enter/Escape)
- Conditional steps
- Summary view before submit

**Usage:**
```tsx
import ProgressiveForm, { type FormStep } from "@/components/ui/progressive-form"

const steps: FormStep[] = [
  {
    id: "name",
    question: "What's your name?",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
    minLength: 2,
  },
  {
    id: "email",
    question: "What's your email?",
    type: "email",
    required: true,
  },
  {
    id: "role",
    question: "Select your role",
    type: "select",
    required: true,
    options: [
      { value: "student", label: "Student", icon: User },
      { value: "teacher", label: "Teacher", icon: GraduationCap },
    ],
  },
]

function Onboarding() {
  const handleSubmit = async (data) => {
    await createUser(data)
    return { success: true }
  }

  return (
    <ProgressiveForm
      steps={steps}
      onSubmit={handleSubmit}
      title="Welcome! Let's get you set up."
      showProgress={true}
      autoAdvance={true}
    />
  )
}
```

**Animation Patterns:**
- Slide transition: Spring (stiffness: 300, damping: 30)
- X translation: +/- 50px
- Scale: 0.95 -> 1
- Opacity: 0 -> 1
- Duration: 200ms base

---

## Animation Patterns Summary

### Shared Values

| Animation | Duration | Easing |
|-----------|----------|--------|
| Backdrop fade | 150-200ms | Linear |
| Modal scale | Spring | stiffness 400, damping 30 |
| Item stagger | 30ms | - |
| Hover | 100ms | easeOut |
| Tap | 100ms | easeIn |

### Framer Motion Patterns Used

```tsx
// Scale on hover/tap
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Spring animation (modals, dialogs)
transition={{
  type: "spring",
  stiffness: 400,
  damping: 30,
}}

// Slide transitions (progressive form)
variants={{
  enter: { x: 50, opacity: 0, scale: 0.95 },
  center: { x: 0, opacity: 1, scale: 1 },
  exit: { x: -50, opacity: 0, scale: 0.95 },
}}

// Loading spinner
animate={{ rotate: 360 }}
transition={{ repeat: Infinity, repeatType: "loop", duration: 1 }}
```

---

## Design Tokens Used

All components reference tokens from `src/styles/design-tokens.ts`:

- Colors: `semantic`, `dark`, `neutral`
- Spacing: `spacing`, `gap`
- Radius: `radius`
- Shadow: `shadow`, `shadowDark`
- Animation: `duration`, `easing`, `spring`
- Typography: `fontSize`, `fontWeight`

---

## Demo Page

Visit `/ux-demo` to see all components in action with interactive examples.

**Features:**
- Command Palette with navigation and actions
- Express Add for students and teachers
- In-place editing on a student profile card
- Progressive form for student enrollment
- Toast notifications for all actions

---

## Migration Guide

### From Traditional Modal to Express Add

**Before:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>Add Student</DialogHeader>
    <Input value={name} onChange={(e) => setName(e.target.value)} />
    <DialogFooter>
      <Button variant="outline" onClick={cancel}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**After:**
```tsx
<ExpressAddModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={async (name) => {
    await createStudent({ name })
    return { success: true }
  }}
  title="Add Student"
  placeholder="Enter student name..."
/>
```

### From Edit Form to In-Place Editor

**Before:**
```tsx
<Button onClick={() => setEditing(true)}>Edit Name</Button>
{editing && (
  <form onSubmit={handleSubmit}>
    <Input value={name} onChange={handleChange} />
    <Button type="submit">Save</Button>
    <Button type="button" variant="ghost" onClick={cancel}>Cancel</Button>
  </form>
)}
```

**After:**
```tsx
<InPlaceText
  value={name}
  onSave={async (newName) => {
    await updateStudent({ name: newName })
    return { success: true }
  }}
  onChange={setName}
/>
```

---

## Component API Summary

| Component | Props | Key Features |
|-----------|-------|--------------|
| `CommandPalette` | `isOpen`, `onClose`, `commands`, `groups` | Keyboard nav, search, groups |
| `ExpressAddModal` | `isOpen`, `onClose`, `onSubmit`, `title` | Auto-save, validation, toast |
| `ExpressAddButton` | `onClick`, `variant`, `size`, `icon` | Styled trigger button |
| `InPlaceText` | `value`, `onSave`, `type`, `placeholder` | Click-to-edit, auto-save |
| `InPlaceTextarea` | `value`, `onSave`, `rows`, `maxLength` | Multi-line edit |
| `InPlaceField` | `label`, `value`, `onSave`, `layout` | Label + input combo |
| `InPlaceTextWithUndo` | `value`, `onSave`, `onChange` | With 5s undo window |
| `ProgressiveForm` | `steps`, `onSubmit`, `title` | Multi-step, auto-advance |
| `ProgressiveFormSummary` | `steps`, `values`, `onEdit` | Review before submit |

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useCommandPalette()` | Manage command palette state + keyboard |
| `useExpressAdd()` | Manage express modal state |
| `useProgressiveForm()` | Manage form state + navigation |
| `useToast()` | Show notifications (from toast.tsx) |
| `useUnsavedChangesToast()` | Show save warning toast |

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/ui/command-palette.tsx` | Command palette component |
| `src/components/ui/express-add-modal.tsx` | Quick add modal |
| `src/components/ui/in-place-editor.tsx` | In-place editing components |
| `src/components/ui/progressive-form.tsx` | Multi-step form |
| `src/app/ux-demo/page.tsx` | Demo page showcasing all |
| `src/components/ui/toast.tsx` | Enhanced toast (already existed) |

---

## Future Enhancements

1. **Keyboard shortcuts customization** - Allow custom key bindings
2. **Bulk actions** - Select multiple items for batch operations
3. **Drag-and-drop reordering** - For list items
4. **Voice input** - Speech-to-text for inputs
5. **Offline support** - Queue actions until connection restored
