# Smart UX Components - Complete Reference

> **Created:** 2026-03-02
> **Status:** Complete
> **Components:** 12 core components ready for use

## Overview

This document describes all Smart UX components available in the Bhutan EduSkill platform. These components are inspired by modern SaaS products like Notion, Linear, Slack, and Clerk to reduce clicks, eliminate navigation, and provide intelligent, context-aware interactions.

## Design Philosophy

- **Edit where you read** - In-place editing instead of modals
- **One-click actions** - Quick actions directly in tables
- **Smart defaults** - Progressive disclosure and sensible defaults
- **Keyboard-first** - Full keyboard navigation support
- **Immediate feedback** - Optimistic UI with auto-save
- **Context-aware** - Different options per portal/role

---

# Phase 0: AI Chat Integration

## PlatformAssistant / UnifiedAIAssistant

**Files:** `src/components/ai/platform-assistant.tsx`, `src/components/ai/unified-ai-assistant.tsx`

**Features:**
- Notion-style AI chat sidebar (slides from right)
- Floating toggle button (bottom-right)
- Role-based configurations for all 7 user types
- Welcome messages per role
- Quick suggestions
- Keyboard shortcut: `Cmd/Ctrl + ;`
- Auto-open/close with smooth animations

**Usage:**
```tsx
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant"

function SchoolAdminLayout({ children }) {
  const { user } = useUser()

  return (
    <>
      {children}
      <UnifiedAIAssistant
        userId={user.id}
        userName={user.name}
        userRole="school-admin"
      />
    </>
  )
}
```

**Integration Status:** ✅ Integrated in all 6 portal layouts (admin, school-admin, teacher, student, parent, counselor)

---

# Phase 1: Existing Components (Widely Available)

## Command Palette

**File:** `src/components/ui/command-palette.tsx`

**Features:**
- `Cmd+K` / `Ctrl+K` shortcut to open
- Searchable commands with fuzzy matching
- Keyboard navigation (arrows + enter)
- Grouped commands with icons

**Usage:**
```tsx
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"
```

## Express Add Modal

**File:** `src/components/ui/express-add-modal.tsx`

**Features:**
- Single field quick input
- Auto-submit on blur
- Enter key to submit
- Toast confirmation on success

**Usage:**
```tsx
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal"

const quickAdd = useExpressAdd()

<ExpressAddModal
  isOpen={quickAdd.isOpen}
  onClose={quickAdd.close}
  onSubmit={handleQuickAdd}
  title="Quick Add Student"
  placeholder="John Doe"
/>
```

## In-Place Editor

**File:** `src/components/ui/in-place-editor.tsx`

**Features:**
- Click to edit inline
- Auto-save on blur
- Escape to cancel
- Multiple variants (text, textarea, field, with undo)

**Usage:**
```tsx
import { InPlaceText, InPlaceTextarea } from "@/components/ui/in-place-editor"

<InPlaceText
  value={name}
  onSave={async (value) => {
    await updateName(value)
    return { success: true }
  }}
  placeholder="Enter name..."
/>
```

## Progressive Form

**File:** `src/components/ui/progressive-form.tsx`

**Features:**
- One question at a time
- Auto-advance on valid input
- Progress indicator
- Back navigation

---

# Phase 2: New Smart UX Components

## 1. SmartMultiSelect

**File:** `src/components/ui/smart-multi-select.tsx`

**Features:**
- Search/filter functionality
- Select All / Deselect All
- Grouped options with group-level selection
- Selected items displayed as chips with remove buttons
- Live count display (selected/total)
- Keyboard navigation (arrows, Enter, Escape, Tab)
- Full accessibility support

**Usage:**
```tsx
import { SmartMultiSelect } from "@/components/ui/smart-multi-select"

const options = [
  { value: "math", label: "Mathematics", group: "Core" },
  { value: "science", label: "Science", group: "Core" },
  { value: "art", label: "Art", group: "Elective" },
]

<SmartMultiSelect
  value={selected}
  onChange={setSelected}
  options={options}
  groupBy={(opt) => opt.group}
  placeholder="Select subjects"
  selectAll={true}
/>
```

**Use Cases:**
- Bulk add students to class
- Bulk assign subjects to teachers
- Select multiple homework for duplication
- Select multiple students for bulk message

---

## 2. StatusToggleCell

**File:** `src/components/ui/status-toggle-cell.tsx`

**Features:**
- Click to open dropdown with all status options
- Color-coded options (Active=green, Inactive=gray, etc.)
- Auto-save on selection
- Confirmation dialog for destructive changes
- Loading state during save
- Display current status as badge with icon

**Predefined Option Sets:**
```tsx
import {
  StatusToggleCell,
  ActiveInactiveToggle,
  PublishedDraftToggle,
  AttendanceStatusToggle,
  ApprovalStatusToggle,
  PaymentStatusToggle,
  StatusOptionSets
} from "@/components/ui/status-toggle-cell"
```

**Usage - Active/Inactive:**
```tsx
<ActiveInactiveToggle
  value={teacher.isActive ? "active" : "inactive"}
  onChange={async (value) => {
    await updateTeacherStatus(teacher.id, value)
    return { success: true }
  }}
/>
```

**Usage - Custom Options:**
```tsx
<StatusToggleCell
  value={homework.status}
  onChange={handleStatusChange}
  options={[
    {
      value: "published",
      label: "Published",
      color: "text-blue-600",
      icon: Eye,
      destructive: false,
    },
    {
      value: "draft",
      label: "Draft",
      color: "text-gray-600",
      icon: EyeOff,
      destructive: false,
    },
  ]}
/>
```

**Use Cases:**
- Active/Inactive toggle (teachers, students, users)
- Published/Unpublished (homework, announcements)
- Present/Absent/Late (attendance)
- Pending/Approved/Rejected (applications)
- Paid/Unpaid/Partial (fees)

---

## 3. BulkActionBar

**File:** `src/components/ui/bulk-action-bar.tsx`

**Features:**
- Selection count display with visual indicator
- Grouped action buttons (primary and secondary)
- Preview/confirmation modal before applying
- Progress indicator during execution
- Success/failure summary with error details
- Clear selection button
- Portal-specific variant styling (5 variants)
- Framer Motion animations

**Usage:**
```tsx
import { BulkActionBar } from "@/components/ui/bulk-action-bar"
import { Edit, Trash2, Mail } from "lucide-react"

const actions = [
  {
    id: "activate",
    label: "Activate",
    icon: UserCheck,
    execute: async (ids) => {
      const results = await bulkActivateStudents(ids)
      return { success: results.success, failed: results.failed }
    }
  },
  {
    id: "message",
    label: "Send Message",
    icon: Mail,
    secondary: true,
    execute: async (ids) => {
      await sendBulkMessage(ids)
      return { success: ids.length, failed: 0 }
    }
  },
  {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    dangerous: true,
    confirmMessage: (count) => `Delete ${count} students? This cannot be undone.`,
    execute: async (ids) => {
      const results = await bulkDeleteStudents(ids)
      return { success: results.success, failed: results.failed }
    }
  },
]

<BulkActionBar
  selectedIds={selectedIds}
  totalCount={totalStudents}
  actions={actions}
  onClearSelection={() => setSelectedIds([])}
  position="bottom"
  variant="school-admin"
  itemLabel="students"
/>
```

---

## 4. SlideOverPanel

**File:** `src/components/ui/slide-over-panel.tsx`

**Features:**
- Slides from right with smooth animation
- Backdrop blur effect
- Close on backdrop click
- Close on Escape key
- Breadcrumb navigation
- Preserves page context
- Size variants (sm, md, lg, xl, full)
- Focus trap

**Usage:**
```tsx
import { SlideOverPanel } from "@/components/ui/slide-over-panel"

<SlideOverPanel
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Student Details"
  size="lg"
  breadcrumbs={[
    { label: "Students", href: "/school-admin/students" },
    { label: student.name, href: "#" }
  ]}
  footer={
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose}>Close</Button>
      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  }
>
  <div className="space-y-4">
    {/* Student details content */}
  </div>
</SlideOverPanel>
```

**Convenience Wrappers:**
```tsx
import {
  StudentDetailsSlideOver,
  TeacherProfileSlideOver,
  ClassDetailsSlideOver,
  HomeworkSubmissionsSlideOver
} from "@/components/ui/slide-over-panel"
```

---

## 5. SlashCommandMenu

**File:** `src/components/ui/slash-command-menu.tsx`

**Features:**
- Triggered by `/` key in text inputs
- Searchable commands
- Context-aware (different commands per portal)
- Keyboard navigation
- Categorized commands
- Icon and description for each command
- Keyboard shortcut hints

**Usage:**
```tsx
import { SlashCommandMenu, useSlashCommand } from "@/components/ui/slash-command-menu"

function MyPage() {
  const { SlashCommandTrigger, menuState } = useSlashCommand({
    commands: "school-admin",  // or custom array
    onCommand: (command) => {
      if (command.id === "add-student") {
        // Open add student modal
      }
    }
  })

  return (
    <>
      <SlashCommandTrigger />
      <SlashCommandMenu
        open={menuState.isOpen}
        onClose={menuState.close}
        onSelect={menuState.handleSelect}
        position={menuState.position}
        portal="school-admin"
      />
    </>
  )
}
```

**Portal-Specific Commands:**
- **School Admin:** /student, /teacher, /class, /subject, /fee
- **Teacher:** /homework, /assignment, /attendance, /message
- **Student:** /goal, /journal, /homework
- **Parent:** /message, /payment

**Convenience Wrappers:**
```tsx
import {
  SchoolAdminSlashCommandMenu,
  TeacherSlashCommandMenu,
  StudentSlashCommandMenu,
  ParentSlashCommandMenu
} from "@/components/ui/slash-command-menu"
```

---

## 6. AttendanceGrid

**File:** `src/components/ui/attendance-grid.tsx`

**Features:**
- Students × dates grid layout
- Inline status toggle (click to cycle: Present/Absent/Late)
- Color-coded cells (green/red/yellow)
- Bulk mark all Present/Absent
- Save with confirmation
- Statistics summary (present, absent, late counts)
- Loading state per cell

**Usage:**
```tsx
import { AttendanceGrid, WeeklyAttendanceGrid, MonthlyAttendanceGrid } from "@/components/ui/attendance-grid"

const students = [
  { id: "1", name: "Tashi Wangmo", rollNumber: "01" },
  { id: "2", name: "Karma Dorji", rollNumber: "02" },
]

<AttendanceGrid
  students={students}
  startDate="2026-03-01"
  endDate="2026-03-07"
  initialAttendance={attendanceData}
  onSave={async (studentId, date, status) => {
    await saveAttendance(studentId, date, status)
  }}
  showStatistics={true}
  showRollNumber={true}
/>

// Or use convenience wrappers:
<WeeklyAttendanceGrid students={students} onSave={handleSave} />
<MonthlyAttendanceGrid students={students} onSave={handleSave} />
```

---

## 7. GradeGrid

**File:** `src/components/ui/grade-grid.tsx`

**Features:**
- Table view with inline grade input
- Auto-save on blur
- Bulk grade action (Apply All, Apply Selected)
- Grade statistics (average, highest, lowest)
- Max score display
- Validation (grade <= max)
- Loading state per cell
- Checkbox selection mode

**Usage:**
```tsx
import { GradeGrid } from "@/components/ui/grade-grid"

const students = [
  { id: "1", name: "Tashi Wangmo", rollNumber: "01" },
  { id: "2", name: "Karma Dorji", rollNumber: "02" },
]

<GradeGrid
  students={students}
  maxScore={100}
  initialGrades={existingGrades}
  onSave={async (studentId, grade) => {
    await saveGrade(studentId, grade)
  }}
  showStatistics={true}
/>
```

---

## 8. KeyboardShortcutsModal

**File:** `src/components/ui/keyboard-shortcuts-modal.tsx`

**Features:**
- Searchable shortcuts list
- Grouped by category
- Context-aware (different shortcuts per portal)
- Key combo display (platform-aware: `⌘` on Mac, `Ctrl` on Windows)
- Triggered by `Cmd/Ctrl + /`
- Close on Escape or backdrop click

**Usage:**
```tsx
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/keyboard-shortcuts-modal"

function MyPage() {
  const { shortcutsModal, close } = useKeyboardShortcuts({
    portal: "school-admin"
  })

  return (
    <>
      {/* Your page content */}
      {shortcutsModal}
    </>
  )
}
```

**Portal-Specific Shortcuts:**
- Navigation (G+D, G+S, G+T, etc.)
- Actions (N=new, E=edit, D=delete, etc.)
- Quick actions (C=compose, A=assign, etc.)

**Convenience Wrappers:**
```tsx
import {
  SchoolAdminKeyboardShortcutsModal,
  TeacherKeyboardShortcutsModal,
  StudentKeyboardShortcutsModal,
  ParentKeyboardShortcutsModal
} from "@/components/ui/keyboard-shortcuts-modal"
```

---

# Phase 3: Table Quick Actions

## TableQuickActions

**File:** `src/components/shared/table-quick-actions.tsx`

**Features:**
- Three-dot menu with hover reveal
- Support for separators
- Danger variant for destructive actions
- Configurable icons

**Usage:**
```tsx
import { TableQuickActions, ActionIcons, QuickAction } from "@/components/shared/table-quick-actions"
import { Eye, Edit, Trash2, Users } from "lucide-react"

<TableQuickActions
  actions={[
    { label: "View Details", icon: ActionIcons.view, onClick: handleView },
    { label: "Edit", icon: ActionIcons.edit, onClick: handleEdit },
    { label: "Assign Classes", icon: ActionIcons.assign, onClick: handleAssign },
    { separator: true },
    { label: "Delete", icon: ActionIcons.delete, onClick: handleDelete, variant: "danger" },
  ]}
/>
```

**ActionIcons Available:**
- `view` (Eye)
- `edit` (Edit/pencil)
- `delete` (Trash2)
- `duplicate` (Copy)
- `send` (Send/paper plane)
- `publish` (CheckCircle)
- `assign` (Users)
- `classes` (GraduationCap)
- `subjects` (BookOpen)

**Integration Status:** ✅ Added to all portal table views (school-admin, teacher, student)

---

# Component Summary Table

| Component | File | Primary Use Case | Status |
|-----------|------|------------------|--------|
| **PlatformAssistant** | `ai/platform-assistant.tsx` | AI chat sidebar | ✅ All portals |
| **CommandPalette** | `ui/command-palette.tsx` | Cmd+K quick actions | ✅ Available |
| **ExpressAddModal** | `ui/express-add-modal.tsx` | Quick single-field add | ✅ Available |
| **InPlaceEditor** | `ui/in-place-editor.tsx` | Inline editing | ✅ Available |
| **ProgressiveForm** | `ui/progressive-form.tsx` | Multi-step forms | ✅ Available |
| **SmartMultiSelect** | `ui/smart-multi-select.tsx` | Bulk selection | ✅ New |
| **StatusToggleCell** | `ui/status-toggle-cell.tsx` | Status changes | ✅ New |
| **BulkActionBar** | `ui/bulk-action-bar.tsx` | Bulk operations | ✅ New |
| **SlideOverPanel** | `ui/slide-over-panel.tsx` | Details panel | ✅ New |
| **SlashCommandMenu** | `ui/slash-command-menu.tsx` | `/` commands | ✅ New |
| **AttendanceGrid** | `ui/attendance-grid.tsx` | Attendance marking | ✅ New |
| **GradeGrid** | `ui/grade-grid.tsx` | Grade entry | ✅ New |
| **KeyboardShortcutsModal** | `ui/keyboard-shortcuts-modal.tsx` | Help screen | ✅ New |
| **TableQuickActions** | `shared/table-quick-actions.tsx` | Row actions | ✅ All tables |

---

# Import Reference

## All Components - Single Import Path

```tsx
// AI Chat
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant"
import { PlatformAssistant } from "@/components/ai/platform-assistant"

// Core UX
import { CommandPalette } from "@/components/ui/command-palette"
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal"
import { InPlaceText, InPlaceTextarea, InPlaceField } from "@/components/ui/in-place-editor"
import { ProgressiveForm } from "@/components/ui/progressive-form"

// New Smart UX
import { SmartMultiSelect } from "@/components/ui/smart-multi-select"
import { StatusToggleCell, ActiveInactiveToggle, PublishedDraftToggle } from "@/components/ui/status-toggle-cell"
import { BulkActionBar } from "@/components/ui/bulk-action-bar"
import { SlideOverPanel } from "@/components/ui/slide-over-panel"
import { SlashCommandMenu, useSlashCommand } from "@/components/ui/slash-command-menu"
import { AttendanceGrid, WeeklyAttendanceGrid } from "@/components/ui/attendance-grid"
import { GradeGrid } from "@/components/ui/grade-grid"
import { KeyboardShortcutsModal, useKeyboardShortcuts } from "@/components/ui/keyboard-shortcuts-modal"

// Table Actions
import { TableQuickActions, ActionIcons } from "@/components/shared/table-quick-actions"
```

---

# Portal Integration Status

| Portal | AI Chat | Quick Actions | Status Toggle | Bulk Actions | Inline Edit |
|--------|---------|--------------|---------------|--------------|-------------|
| **Platform Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **School Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Teacher** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Student** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Parent** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Counselor** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# Animation Patterns

### Shared Values

| Animation | Duration | Easing |
|-----------|----------|--------|
| Backdrop fade | 150-200ms | Linear |
| Modal scale | Spring | stiffness 400, damping 30 |
| Slide over | Spring | stiffness 200, damping 25 |
| Hover | 100ms | easeOut |
| Tap | 100ms | easeIn |

### Framer Motion Patterns

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

// Loading spinner (with repeatType)
animate={{ rotate: 360 }}
transition={{ repeat: Infinity, repeatType: "loop", duration: 1 }}
```

---

# Type Safety

All components are fully typed with TypeScript:

- No `any` types in new components
- Proper interface exports for all props
- Generic type support where applicable (`SmartMultiSelect<T>`)

---

# Future Enhancements

1. **Voice input** - Speech-to-text for command palette and inputs
2. **Drag-and-drop** - For list reordering and file uploads
3. **Offline support** - Queue actions until connection restored
4. **Custom keyboard shortcuts** - User-configurable key bindings
5. **Undo/Redo stack** - Global undo for actions
6. **Multi-cursor collaboration** - Real-time collaborative editing
7. **AI suggestions** - Context-aware AI suggestions in inputs
