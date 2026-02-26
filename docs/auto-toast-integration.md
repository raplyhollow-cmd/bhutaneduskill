# Auto-Toast Integration Documentation

> **Purpose:** Ensure every form save/change action shows a toast notification to the user.
> **Status:** In Progress - Key modals and forms updated
> **Last Updated:** February 25, 2026

---

## Overview

This document describes the implementation of automatic toast notifications across the entire Bhutan EduSkill application. The goal is to replace all `alert()` calls with modern toast notifications that appear in the bottom-right corner of the screen.

## Toast System

### Location
- **Toast Component:** `src/components/ui/toast.tsx`
- **Toast Utilities:** `src/lib/toast-utils.ts`
- **Toast Provider:** Already wrapped in `src/app/layout.tsx`

### Toast Variants

| Variant | Use Case | Icon Color |
|---------|----------|------------|
| `success` | Successful operations (create, update, delete) | Green |
| `error` / `destructive` | Failed operations | Red |
| `warning` | Warnings and confirmations | Orange |
| `info` | Informational messages | Blue |
| `loading` | In-progress operations | Purple (spinning) |

---

## Usage Patterns

### 1. Basic Toast Usage

```tsx
import { useToast } from "@/components/ui/toast";

export function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast({
        title: "Success",
        description: "Your changes have been saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    }
  };
}
```

### 2. Using Toast Utilities

```tsx
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

// Success
showSuccessToast("User created", "John Doe has been added.");

// Error
showErrorToast("Failed to save", "Please check your connection.");
```

### 3. Entity-Specific Toasts

```tsx
import { EntityToast } from "@/lib/toast-utils";

// Specific entity operations
EntityToast.student.created();
EntityToast.teacher.updated();
EntityToast.class.deleted();
EntityToast.school.approved();
```

---

## Files Modified (Updated with Toast)

### Modals (School Admin)

| File | Status | Notes |
|------|--------|-------|
| `src/components/school-admin/add-teacher-modal.tsx` | ✅ Updated | Added toast for success/error |
| `src/components/school-admin/class-edit-modal.tsx` | ⏳ Pending | |
| `src/components/school-admin/assign-teacher-modal.tsx` | ⏳ Pending | |

### Modals (Counselor)

| File | Status | Notes |
|------|--------|-------|
| `src/components/counselor/add-resource-modal.tsx` | ✅ Updated | Added toast for create, upload |
| `src/components/counselor/edit-resource-modal.tsx` | ✅ Updated | Added toast for update, delete |
| `src/components/counselor/share-resource-modal.tsx` | ✅ Updated | Added toast for share |

### Modals (Admin)

| File | Status | Notes |
|------|--------|-------|
| `src/components/admin/add-user-modal.tsx` | ✅ Already had toast | |
| `src/components/admin/edit-user-modal.tsx` | ✅ Updated | Added toast for update |
| `src/components/admin/add-school-modal.tsx` | ✅ Already had toast | |
| `src/components/admin/edit-school-modal.tsx` | ✅ Updated | Added toast for update |
| `src/components/admin/add-college-modal.tsx` | ✅ Updated | Added toast for create |
| `src/components/admin/edit-college-modal.tsx` | ✅ Updated | Added toast for update |
| `src/components/admin/add-career-modal.tsx` | ✅ Already had toast | |

### Forms & Components

| File | Status | Notes |
|------|--------|-------|
| `src/components/homework/homework-creator.tsx` | ✅ Updated | Replaced alert with toast |
| `src/components/form/auto-save-form.tsx` | ✅ Already had toast | Auto-save toasts |
| `src/components/form/slide-in-form.tsx` | ✅ Already had toast | Unsaved changes toast |

### Pages with `alert()` (Still Pending: 43 files)

| Portal | Files |
|--------|-------|
| Admin | `teachers/page.tsx`, `schools/[id]/page.tsx`, `users/page.tsx`, etc. |
| School Admin | `teachers/pending/page.tsx`, `applications/applications-client.tsx`, etc. |
| Teacher | `leave/page.tsx`, `reports/page.tsx` |
| Student | `id-card/page.tsx`, `hostel/page.tsx`, `rub/applications/page.tsx` |
| Counselor | `career-alignment/page.tsx`, `wellness-compass/page.tsx`, `red-flags/page.tsx` |

---

## Pattern for Adding Toasts to Existing Forms

### Step 1: Import useToast

```tsx
import { useToast } from "@/components/ui/toast";
```

### Step 2: Call the hook

```tsx
export function MyComponent() {
  const { toast } = useToast();
  // ...
}
```

### Step 3: Replace alert() calls

**Before:**
```tsx
if (response.ok) {
  onSuccess();
  onClose();
} else {
  alert("Failed to save");
}
```

**After:**
```tsx
if (response.ok) {
  toast({
    title: "Success",
    description: "Changes saved successfully.",
    variant: "success",
  });
  onSuccess();
  onClose();
} else {
  toast({
    title: "Failed to save",
    description: "Please try again.",
    variant: "destructive",
  });
}
```

---

## Common Toast Messages

### Success Messages

```typescript
// Create
"Teacher created" → "John Doe has been added successfully."
"Student created" → "Jane Smith has been enrolled successfully."
"Class created" → "Class 10 A has been created successfully."

// Update
"Changes saved" → "Your changes have been saved successfully."
"Profile updated" → "Your profile has been updated successfully."

// Delete
"Deleted successfully" → "The item has been deleted."
```

### Error Messages

```typescript
// Network errors
"Network error" → "Please check your connection and try again."

// Validation errors
"Required fields" → "Please fill in all required fields."
"Invalid input" → "Please check your inputs and try again."

// Server errors
"Failed to save" → "Something went wrong. Please try again."
```

---

## Testing Checklist

### Visual Verification

- [ ] Toast appears in bottom-right corner
- [ ] Toast has correct icon (green checkmark for success, red X for error)
- [ ] Toast auto-dismisses after duration (success: 3s, error: 5s)
- [ ] Multiple toasts stack vertically
- [ ] Toast can be dismissed with X button

### Functional Verification

- [ ] Success toast appears after successful form submission
- [ ] Error toast appears after failed submission
- [ ] Toast with action button works (retry option)
- [ ] Loading toast shows during async operations

### Test Cases

1. **Create Operation**
   - Fill form → Submit → Verify success toast appears

2. **Update Operation**
   - Edit existing item → Save → Verify update toast appears

3. **Delete Operation**
   - Delete item → Verify delete toast appears

4. **Validation Error**
   - Submit empty form → Verify error toast appears

5. **Network Error**
   - Disconnect network → Submit → Verify network error toast

---

## Batch Update Script

For updating multiple files at once, use this pattern:

```bash
# Find all files with alert()
grep -r "alert(" src/ --include="*.tsx" --include="*.ts" -l

# For each file:
# 1. Add import: import { useToast } from "@/components/ui/toast";
# 2. Add hook: const { toast } = useToast();
# 3. Replace alert() with toast()
```

---

## ESLint Rule (Recommended)

Add this to `.eslintrc.json` to prevent new `alert()` calls:

```json
{
  "rules": {
    "no-alert": "error"
  }
}
```

---

## Migration Status

### Completed
- ✅ Toast system established (`src/components/ui/toast.tsx`)
- ✅ Toast utilities created (`src/lib/toast-utils.ts`)
- ✅ All counselor modals updated
- ✅ Key admin modals updated
- ✅ School-admin teacher modal updated
- ✅ Homework creator updated

### In Progress
- ⏳ Remaining admin modals (assessment, scholarship, ticket)
- ⏳ School-admin modals (class, bulk-import)
- ⏳ Page-level forms (43 pages with `alert()`)

### Next Steps
1. Update remaining admin modals
2. Update school-admin modals
3. Update page-level forms
4. Add ESLint rule for no-alert
5. Run build to verify no errors

---

## Contact

For questions or issues with toast integration, refer to:
- **Toast Component:** `src/components/ui/toast.tsx`
- **Toast Utilities:** `src/lib/toast-utils.ts`
- **Design System:** Clerk Ceramic Design (dark theme toasts)
