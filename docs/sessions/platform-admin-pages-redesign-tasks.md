# Platform Admin Pages - Ultra Luxury Redesign - Sequential Agent Tasks

> **Project:** Bhutan EduSkill - Platform Admin pages redesign
> **Reference Implementation:** `src/app/admin/users/page.tsx` (completed)
> **Reference Pattern:** `src/app/school-admin/teachers/page.tsx`
> **Total Pages:** 3 (Schools, Teachers, Counselors)
> **Est. Tokens per Task:** 30-50k (well under 200k limit)

---

## Task Handoff Protocol

**After each task:**
1. Agent reports completion with summary
2. Update `docs/sessions/platform-admin-handoff.md` with progress
3. Next agent reads handoff file for context
4. Next agent continues from where previous left off

**Handoff file:** `docs/sessions/platform-admin-handoff.md`

**Reusable Components (Already Created):**
- `src/components/admin/inline-edit-text.tsx`
- `src/components/admin/role-selector.tsx`
- `src/components/admin/quick-action-menu.tsx`

---

## Task 1: Schools Page Redesign

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 50k
**File:** `src/app/admin/schools/page.tsx`

### Instructions
1. Read QUICKREF.md (100 tokens)
2. Read reference `src/app/admin/users/page.tsx` (first 300 lines) for pattern
3. Read current `src/app/admin/schools/page.tsx` (analyze structure)
4. Apply ultra-luxury grid design:
   - Compact header with stats
   - Bulk action bar (conditional)
   - Toolbar with search + filters
   - Custom 12-column grid table
   - Inline editable fields (school name, contact)
   - Status toggle (active/inactive)
   - Quick action menu
   - Keyboard navigation
   - Optimistic UI

### Grid Layout (Schools)
```tsx
<div className="grid grid-cols-12 gap-2 px-4 py-2.5">
  <div className="col-span-1">Checkbox</div>
  <div className="col-span-3">School Name + Logo</div>
  <div className="col-span-2">Code (inline edit)</div>
  <div className="col-span-2">Type (dropdown)</div>
  <div className="col-span-2">Contact (inline edit)</div>
  <div className="col-span-1">Students count</div>
  <div className="col-span-1">Status (toggle)</div>
</div>
```

### Output Required
Update handoff with:
```markdown
## Task 1 Complete - Schools Page

Changed:
- [x] Compact header with stats
- [x] Bulk action bar
- [x] Toolbar with filters
- [x] Grid table (not HTML table)
- [x] Inline components integrated
- [x] Keyboard navigation
- [x] Optimistic UI

Build status: npx tsc --noEmit passed
```

---

## Task 2: Teachers Page Redesign

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 60k
**Depends On:** Task 1 handoff
**File:** `src/app/admin/teachers/page.tsx`

### Instructions
1. Read handoff from Task 1
2. Read QUICKREF.md
3. Read current `src/app/admin/teachers/page.tsx`
4. Apply ultra-luxury grid design with:
   - More columns (12+ columns due to complex data)
   - Inline subject editing
   - Verification status toggle
   - School assignment display
   - Performance metrics

### Grid Layout (Teachers - Wider)
```tsx
<div className="grid grid-cols-12 gap-2 px-4 py-2.5">
  <div className="col-span-1">Checkbox</div>
  <div className="col-span-3">Teacher + Avatar</div>
  <div className="col-span-2">Email (inline edit)</div>
  <div className="col-span-2">School</div>
  <div className="col-span-1">Subjects (inline)</div>
  <div className="col-span-1">Verified (toggle)</div>
  <div className="col-span-1">Students</div>
  <div className="col-span-1">Status (toggle)</div>
</div>
```

### Output Required
Update handoff with:
```markdown
## Task 2 Complete - Teachers Page

Changed:
- [x] Header compact
- [x] Bulk action bar
- [x] Toolbar with filters
- [x] Grid table (12-column)
- [x] Subject inline edit
- [x] Verification toggle
- [x] Keyboard navigation

Build status: npx tsc --noEmit passed
```

---

## Task 3: Counselors Page Redesign

**Agent:** Frontend Lead (Sonnet)
**Est. Tokens:** 50k
**Depends On:** Task 2 handoff
**File:** `src/app/admin/counselors/page.tsx`

### Instructions
1. Read handoff from Task 2
2. Read QUICKREF.md
3. Read current `src/app/admin/counselors/page.tsx`
4. Apply ultra-luxury grid design similar to teachers:
   - Verification workflow focus
   - School assignment management
   - Performance tracking display

### Grid Layout (Counselors)
```tsx
<div className="grid grid-cols-12 gap-2 px-4 py-2.5">
  <div className="col-span-1">Checkbox</div>
  <div className="col-span-3">Counselor + Avatar</div>
  <div className="col-span-3">Email (inline edit)</div>
  <div className="col-span-2">School</div>
  <div className="col-span-1">Verified (toggle)</div>
  <div className="col-span-1">Students</div>
  <div className="col-span-1">Status (toggle)</div>
</div>
```

### Output Required
Update handoff with:
```markdown
## Task 3 Complete - Counselors Page

Changed:
- [x] Header compact
- [x] Bulk action bar
- [x] Grid table
- [x] Verification toggle
- [x] Keyboard navigation
- [x] Optimistic UI

Build status: npx tsc --noEmit passed
```

---

## Task 4: Verification & Testing

**Agent:** QA Specialist (Sonnet)
**Est. Tokens:** 40k
**Depends On:** Task 3 handoff

### Instructions
1. Read handoff from Task 3
2. Run `npx tsc --noEmit` - verify no errors
3. Test all 3 pages:
   - [ ] Search filters work
   - [ ] Inline edits save correctly
   - [ ] Status toggle works (optimistic)
   - [ ] Bulk operations work
   - [ ] Keyboard nav works
   - [ ] Responsive verified
   - [ ] Empty states display

### Output Required
Update handoff with:
```markdown
## Task 4 Complete - Verification

All pages tested:
- [x] Schools page - all features work
- [x] Teachers page - all features work
- [x] Counselors page - all features work
- [x] Type check passed
- [x] Responsive verified

Ready for deployment
```

---

## Agent Session Instructions

### For Each Task:
1. **Start fresh session** (new conversation)
2. **Read QUICKREF.md** first (100 tokens)
3. **Read handoff file** for previous work
4. **Read reference implementation** (`src/app/admin/users/page.tsx`)
5. **Execute task**
6. **Update handoff file** with progress
7. **Report completion**

### Token Budget Per Agent:
- Max: 60k input tokens
- Read only files needed for task
- Use Grep to find patterns (don't read full files)

### Design Tokens to Apply:
```tsx
// Admin Portal Pink Theme
primary: 'rgb(236, 72, 153)'
primaryDark: 'rgb(219, 39, 119)'

// Spacing
compact: '1rem' (16px)
comfortable: '1.5rem' (24px)

// Typography
heading: 'text-lg font-semibold'
subtitle: 'text-xs text-gray-500'
body: 'text-sm text-gray-600'

// Radius
button: 'rounded-md'
card: 'rounded-xl'
badge: 'rounded-full'

// Animation
transition-all duration-150 ease-out
```

### After Task 4:
- All 3 pages fully redesigned
- All features working
- Build passing
- Ready for user review
