# Unified Architecture: Component + Schema + Route = 1

## 📊 Visual Diagram

**Interactive Diagram:** [Open unified-architecture.html](./diagrams/unified-architecture.html)

**Mermaid Source:** [View unified-architecture.mmd](./diagrams/unified-architecture.mmd)

## Overview

The Unified Architecture combines **Schema + Database + API + Components + Migrations** into a single feature definition. Instead of maintaining 4+ separate files per resource, you define everything in one place.

**FULL UNIFICATION:**
- ✅ **Schema Definition** - Field types, constraints, relationships
- ✅ **Database Schema** - Drizzle table definitions (generated)
- ✅ **SQL Migrations** - Auto-generated CREATE/ALTER statements
- ✅ **API Handlers** - list, get, create, update, delete
- ✅ **React Hooks** - useList, useGet, useCreate, useUpdate, useDelete
- ✅ **UI Components** - DataGrid, Form, ListPage
- ✅ **TypeScript Types** - Select, Insert, Update types

## Before vs After

### Traditional Approach (4 files per resource)
```
src/
├── drizzle/0001_schema.sql      # Database migration
├── lib/db/schema.ts              # Table definition
├── app/api/students/route.ts      # API endpoint
└── components/students-grid.tsx   # UI component
```

### Unified Approach (1 file per resource)
```
src/features/students.feature.tsx  # Everything in one place
```

---

## Core System

### defineFeature Function

Located at: [`src/lib/features/define-feature.ts`](../src/lib/features/define-feature.ts)

```typescript
import { defineFeature } from "@/lib/features/define-feature";

export const StudentFeature = defineFeature({
  name: "students",
  tableName: "users", // Use existing table

  schema: {
    id: { type: "text", required: true },
    firstName: { type: "text", required: true, label: "First Name", sortable: true },
    lastName: { type: "text", label: "Last Name", sortable: true },
    email: { type: "email", required: true, label: "Email" },
    classGrade: { type: "integer", label: "Grade", filterable: true },
    // ... more fields
  },

  permissions: {
    read: ["school-admin", "teacher", "parent"],
    create: ["school-admin", "admin"],
    update: ["school-admin", "admin"],
    delete: ["school-admin", "admin"],
  },

  ui: {
    title: "Student",
    titlePlural: "Students",
    basePath: "/school-admin/students",
    columns: [
      { key: "rollNumber", label: "Roll No.", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email" },
      { key: "classGrade", label: "Grade", filterable: true },
    ],
  },

  // Optional: Custom handlers override
  customHandlers: {
    list: async (params, auth) => { /* custom logic */ },
    get: async (id, auth) => { /* custom logic */ },
    // ...
  },
});
```

---

## Generated Components

### What Gets Generated Automatically

1. **API Handlers** - `list()`, `get()`, `create()`, `update()`, `delete()`
2. **React Hooks** - `useList()`, `useGet()`, `useCreate()`, `useUpdate()`, `useDelete()`
3. **UI Components** - `FeatureDataGrid`, `FeatureForm`, `FeatureListPage`
4. **TypeScript Types** - `Select`, `Insert`, `Update` types

---

## Universal API Route

Located at: [`src/app/api/resources/[resource]/route.ts`](../src/app/api/resources/[resource]/route.ts)

Single route handles ALL resources:

```
GET    /api/resources/students         → list students
GET    /api/resources/students/123     → get student
POST   /api/resources/students         → create student
PUT    /api/resources/students/123     → update student
DELETE /api/resources/students/123     → delete student
```

Same pattern for: teachers, classes, subjects, schools, assessments, etc.

---

## Universal Components

Located at: [`src/components/features/`](../src/components/features/)

### FeatureDataGrid
Auto-generated sortable, filterable, searchable data table.

```tsx
import { FeatureDataGrid, StudentFeature } from "@/features";

<FeatureDataGrid
  feature={StudentFeature}
  onEdit={(item) => console.log(item)}
  onDelete={(item) => console.log(item)}
/>
```

### FeatureForm
Auto-generated form with validation.

```tsx
import { FeatureForm, StudentFeature } from "@/features";

<FeatureForm
  feature={StudentFeature}
  mode="create"
  onSubmit={async (data) => { /* ... */ }}
/>
```

### FeatureListPage
Complete page with grid, search, pagination, and actions.

```tsx
import { FeatureListPage, StudentFeature } from "@/features";

export default function StudentsPage() {
  return <FeatureListPage feature={StudentFeature} />;
}
```

---

## Usage Examples

### Example 1: Create a New Page (3 lines)

```typescript
// src/app/school-admin/students/page.tsx
import { FeatureListPage, StudentFeature } from "@/features";

export default function StudentsPage() {
  return <FeatureListPage feature={StudentFeature} />;
}
```

### Example 2: Use Hooks in Custom Component

```typescript
import { StudentFeature } from "@/features";

export default function CustomStudentList() {
  const { data, isLoading } = StudentFeature.useList();

  if (isLoading) return <Loader />;
  return <div>{/* custom UI */}</div>;
}
```

### Example 3: Define a New Resource

```typescript
// src/features/books.feature.ts
import { defineFeature } from "@/lib/features/define-feature";

export const BookFeature = defineFeature({
  name: "books",
  schema: {
    id: { type: "text", required: true },
    title: { type: "text", required: true, label: "Title", sortable: true },
    author: { type: "text", label: "Author", sortable: true },
    isbn: { type: "text", label: "ISBN", unique: true },
    grade: { type: "integer", label: "Grade", filterable: true },
    isActive: { type: "boolean", label: "Available" },
  },
  permissions: {
    read: ["school-admin", "teacher", "student"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },
  ui: {
    title: "Book",
    titlePlural: "Library Books",
    basePath: "/school-admin/library",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "author", label: "Author", sortable: true },
      { key: "isbn", label: "ISBN" },
      { key: "grade", label: "Grade", filterable: true },
      { key: "isActive", label: "Available", type: "boolean" },
    ],
  },
});
```

Then use it immediately:
```typescript
// src/app/school-admin/library/page.tsx
import { FeatureListPage, BookFeature } from "@/features";

export default function LibraryPage() {
  return <FeatureListPage feature={BookFeature} />;
}
```

---

## Available Features

| Feature | File | API Endpoints |
|---------|------|---------------|
| **Students** | [`students.feature.ts`](../src/features/students.feature.ts) | `/api/resources/students` |
| **Teachers** | [`teachers.feature.ts`](../src/features/teachers.feature.ts) | `/api/resources/teachers` |
| **Classes** | [`classes.feature.ts`](../src/features/classes.feature.ts) | `/api/resources/classes` |
| **Subjects** | [`subjects.feature.ts`](../src/features/subjects.feature.ts) | `/api/resources/subjects` |
| **Schools** | [`schools.feature.ts`](../src/features/schools.feature.ts) | `/api/resources/schools` |
| **Assessments** | [`assessments.feature.ts`](../src/features/assessments.feature.ts) | `/api/resources/assessments` |

---

## Schema Column Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | String field | `name: { type: "text" }` |
| `integer` | Number field | `age: { type: "integer" }` |
| `boolean` | True/false | `isActive: { type: "boolean" }` |
| `timestamp` | Date/time | `createdAt: { type: "timestamp" }` |
| `email` | Email validated | `email: { type: "email" }` |
| `json` | JSON data | `metadata: { type: "json" }` |
| `reference` | Foreign key | `classId: { type: "reference", reference: { table: "classes" } }` |

### Column Options

| Option | Type | Description |
|--------|------|-------------|
| `required` | boolean | Field must have value |
| `unique` | boolean | Field must be unique |
| `label` | string | Display label in UI |
| `sortable` | boolean | Enable sorting in table |
| `filterable` | boolean | Enable filtering in table |
| `searchable` | boolean | Include in search |

---

## Benefits

1. **Less Code** - ~50 lines vs ~300 lines per resource
2. **Consistency** - All resources follow same pattern
3. **Type Safety** - Types flow from schema → API → UI
4. **Single Source of Truth** - Change schema, everything updates
5. **Faster Development** - New resource in minutes, not hours

---

## Migration Guide

### From Old Pattern

**Before (3 files):**
```typescript
// lib/db/schema.ts
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  // ...
});

// app/api/students/route.ts
export async function GET(request) {
  // 100+ lines of query logic
}

// components/students-grid.tsx
export function StudentsGrid() {
  // 100+ lines of table UI
}
```

**After (1 file):**
```typescript
// features/students.feature.ts
export const StudentFeature = defineFeature({
  schema: {
    id: { type: "text", required: true },
    firstName: { type: "text", required: true, label: "First Name" },
    // ...
  },
  permissions: { /* ... */ },
  ui: { /* ... */ },
});
```

---

## File Structure

```
src/
├── features/
│   ├── index.ts                          # Exports all features
│   ├── students.feature.ts                # Student resource
│   ├── teachers.feature.ts                # Teacher resource
│   ├── classes.feature.ts                 # Class resource
│   ├── subjects.feature.ts                # Subject resource
│   ├── schools.feature.ts                 # School resource
│   └── assessments.feature.ts             # Assessment resource
├── lib/features/
│   └── define-feature.ts                  # Core system
├── components/features/
│   ├── index.ts
│   ├── feature-data-grid.tsx              # Universal table
│   └── feature-form.tsx                   # Universal form + list page
└── app/api/resources/
    └── [resource]/
        └── route.ts                        # Universal API route
```

---

## Advanced Usage

### Custom API Handlers

Override default handlers for complex logic:

```typescript
export const StudentFeature = defineFeature({
  // ...
  customHandlers: {
    list: async (params, auth) => {
      // Custom query with joins, aggregations, etc.
      const { db } = await import("@/lib/db");
      const { students, classes } = await import("@/lib/db/schema");
      // ... custom logic
    },
  },
});
```

### Custom Cell Rendering

```typescript
columns: [
  {
    key: "name",
    label: "Name",
    render: (value, row) => (
      <Link href={`/students/${row.id}`}>
        {value}
      </Link>
    )
  },
]
```

### Custom Hooks in Components

```typescript
const { data, isLoading, error } = StudentFeature.useList();
const { mutate: createStudent } = StudentFeature.useCreate();
```

---

## Security

- **Permission checks** built into API handlers
- **Role-based access** via `permissions` config
- **School isolation** via `schoolId` filtering
- **Soft deletes** for data recovery

---

## Performance

- **Optimized queries** - Only fetch needed columns
- **Pagination** - Built into all list endpoints
- **Caching ready** - Single endpoint easier to cache
- **Lazy loading** - Components load data on demand

---

## Future Enhancements

- [ ] Auto-generate Zod validation schemas
- [ ] Auto-generate export/import functionality
- [ ] Auto-generate bulk operations
- [ ] Auto-generate audit logs
- [ ] Auto-generate GraphQL schema
- [ ] Auto-generate OpenAPI spec

---

## Questions?

See also:
- [Development Framework](../DEVELOPMENT_FRAMEWORK.md)
- [Agent Quick Reference](AGENT_QUICKREF.md)
