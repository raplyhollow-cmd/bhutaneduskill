# Admin Users Page Redesign - Sequential Agent Tasks

> **Project:** Bhutan EduSkill - `/admin/users` page ultra-luxury redesign
> **Reference Plan:** `C:\Users\pc\.claude\plans\cuddly-singing-glacier.md`
> **Design Reference:** `src/app/school-admin/teachers/page.tsx`
> **Total Tasks:** 5 sequential tasks
> **Est. Tokens per Task:** 30-50k (well under 200k limit)

---

## Task Handoff Protocol

**After each task:**
1. Agent reports completion with summary
2. User starts fresh session
3. Next agent reads HANDOFF.md for context
4. Next agent continues from where previous left off

**File for handoffs:** `docs/sessions/admin-users-handoff.md`

---

## Task 1: Read & Analyze Current Page

**Agent:** Explore Agent (Haiku - larger context)
**Est. Tokens:** 20k
**Purpose:** Understand current state without making changes

### Instructions
1. Read QUICKREF.md (100 tokens)
2. Read current `src/app/admin/users/page.tsx` (first 300 lines only)
3. Read reference `src/app/school-admin/teachers/page.tsx` (first 200 lines)
4. Read plan file `C:\Users\pc\.claude\plans\cuddly-singing-glacier.md`

### Output Required
Create `docs/sessions/admin-users-handoff.md` with:
```markdown
# Task 1 Complete - Analysis

## Current State
- File size: ___ lines
- Key components found: ___
- State management: ___
- Current issues: ___

## Reference Patterns Found
- School-admin teachers page uses: ___
- Grid layout: ___
- Bulk actions: ___
```

---

## Task 2: Create Inline Edit Components

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 40k
**Depends On:** Task 1 handoff

### Files to Create/Modify
1. **NEW:** `src/components/admin/inline-edit-text.tsx`
2. **NEW:** `src/components/admin/role-selector.tsx`
3. **NEW:** `src/components/admin/quick-action-menu.tsx`

### Instructions
1. Read handoff from Task 1
2. Read QUICKREF.md
3. Create inline edit component (click to edit, Enter to save, Esc to cancel)
4. Create role selector dropdown (change user role inline)
5. Create quick action menu (three-dot menu with all actions)

### Component Specs

**InlineEditText:**
```tsx
interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
}
// Features:
// - Click to edit
// - Enter to save
// - Escape to cancel
// - Blur to save
// - Show edit icon on hover
```

**RoleSelector:**
```tsx
interface RoleSelectorProps {
  value: string;
  onChange: (newRole: string) => Promise<void> | void;
  user: User;
}
// Features:
// - Dropdown with all roles
// - Role icons for each
// - Optimistic update
```

**QuickActionMenu:**
```tsx
interface QuickActionMenuProps {
  user: User;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}
// Actions: View, Edit, Reset Password, Verify Email, Delete
```

### Output Required
Update handoff with:
```markdown
## Task 2 Complete - Components Created

Created:
- [x] inline-edit-text.tsx
- [x] role-selector.tsx
- [x] quick-action-menu.tsx

Build status: npx tsc --noEmit passed
```

---

## Task 3: Redesign Main Page Layout

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 50k
**Depends On:** Task 2 handoff

### File to Modify
- `src/app/admin/users/page.tsx`

### Instructions
1. Read handoff from Task 2
2. Read school-admin teachers page reference
3. Replace JSX structure (keep state/logic):
   - Compact header
   - Bulk action bar (conditional)
   - Toolbar with search + filters
   - Custom grid table (12-column)
   - Status badges with inline toggle
4. Use new components from Task 2

### Grid Layout
```tsx
<div className="grid grid-cols-12 gap-2 px-4 py-2.5">
  <div className="col-span-1">Checkbox</div>
  <div className="col-span-3">User + Avatar</div>
  <div className="col-span-3">Email (inline edit)</div>
  <div className="col-span-2">Role (dropdown)</div>
  <div className="col-span-2">School</div>
  <div className="col-span-1">Status (toggle)</div>
</div>
```

### Output Required
Update handoff with:
```markdown
## Task 3 Complete - Layout Redesigned

Changed:
- [x] Header compact
- [x] Bulk action bar
- [x] Toolbar with filters
- [x] Grid table (not HTML table)
- [x] Inline components integrated

Build status: npx tsc --noEmit passed
```

---

## Task 4: Add Optimistic UI & Keyboard Nav

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 40k
**Depends On:** Task 3 handoff

### File to Modify
- `src/app/admin/users/page.tsx`

### Instructions
1. Read handoff from Task 3
2. Add optimistic UI for status toggle
3. Add optimistic UI for role change
4. Add keyboard navigation:
   - Arrow keys to navigate rows
   - Enter to view details
   - Space to select
   - Escape to clear selection
5. Add rollback on error

### Optimistic Pattern
```tsx
const toggleStatus = async (userId: string) => {
  // Update UI immediately
  setUsers(prev => prev.map(u =>
    u.id === userId ? { ...u, isActive: !u.isActive } : u
  ));

  try {
    await api.toggleStatus(userId);
  } catch {
    // Rollback
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isActive: u.isActive } : u
    ));
    toast.error("Failed to update");
  }
};
```

### Output Required
Update handoff with:
```markdown
## Task 4 Complete - Optimistic UI

Added:
- [x] Optimistic status toggle
- [x] Optimistic role change
- [x] Keyboard navigation
- [x] Error rollback
- [x] Toast notifications

Build status: npx tsc --noEmit passed
```

---

## Task 5: Verification & Testing

**Agent:** QA Specialist (Sonnet)
**Est. Tokens:** 30k
**Depends On:** Task 4 handoff

### Instructions
1. Read handoff from Task 4
2. Run `npx tsc --noEmit` - verify no errors
3. Check all features work:
   - [ ] Search filters
   - [ ] Role dropdown
   - [ ] Status toggle (optimistic)
   - [ ] Inline edit name
   - [ ] Inline edit email
   - [ ] Bulk selection
   - [ ] Bulk actions
   - [ ] Keyboard nav
   - [ ] Quick action menu
4. Test responsive (no horizontal scroll on desktop)
5. Verify color theme (admin pink gradient)

### Output Required
Update handoff with:
```markdown
## Task 5 Complete - Verification

Tests passed:
- [x] Type check passed
- [x] All inline edits work
- [x] Optimistic UI works
- [x] Keyboard nav works
- [x] Bulk operations work
- [x] Responsive verified

Ready for deployment
```

---

## Agent Session Instructions

### For Each Task:
1. **Start fresh session** (new conversation)
2. **Read QUICKREF.md** first (100 tokens)
3. **Read handoff file** for previous work
4. **Read plan file** for design reference
5. **Execute task**
6. **Update handoff file** with progress
7. **Report completion**

### Token Budget Per Agent:
- Max: 50k input tokens
- Read only files needed for task
- Use Grep to find patterns (don't read full files)

### After Task 5:
- All tasks complete
- Page fully redesigned
- Build passing
- Ready for user review
