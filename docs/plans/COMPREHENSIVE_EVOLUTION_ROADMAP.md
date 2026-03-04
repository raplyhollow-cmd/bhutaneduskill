# Comprehensive Evolution Roadmap
## Unified Architecture Migration & Beyond

**Created:** March 4, 2026
**Status:** Active
**Related:** [UNIFIED_ARCHITECTURE.md](../UNIFIED_ARCHITECTURE.md)

---

## Table of Contents

1. [Phase 1: Complete Unified System Foundation](#phase-1-complete-unified-system-foundation)
2. [Phase 2: Unified Validation System](#phase-2-unified-validation-system)
3. [Phase 3: Enhanced Forms System](#phase-3-enhanced-forms-system)
4. [Phase 4: Unified Search & Filters](#phase-4-unified-search--filters)
5. [Phase 5: Unified Modals & Dialogs](#phase-5-unified-modals--dialogs)
6. [Phase 6: Unified Notifications](#phase-6-unified-notifications)
7. [Phase 7: Unified Dashboards](#phase-7-unified-dashboards)
8. [Phase 8: Export/Import System](#phase-8-exportimport-system)
9. [Phase 9: Unified Charts](#phase-9-unified-charts)
10. [Phase 10: Unified Permissions](#phase-10-unified-permissions)
11. [Phase 11: Unified Error Handler](#phase-11-unified-error-handler)
12. [Appendix: Migration Tracking](#appendix-migration-tracking)

---

## Phase 1: Complete Unified System Foundation

**Priority:** 🔥 CRITICAL
**Estimated Effort:** 40-50 hours
**Dependencies:** None (starting point)
**Files to Create:** 8
**Files to Modify:** 15+

### 1.1 Feature Definitions - Complete All Resources

**Status:** ✅ 6/50+ resources completed

**Remaining Resources to Define:**

| Category | Resources | Files to Create |
|----------|-----------|-----------------|
| **Academic** | Attendance, Homework, Lessons, Exams, Results | 5 |
| **School Admin** | Departments, Batches, Timetables, Announcements | 4 |
| **Student** | Skills, Assessments, Learning Paths | 3 |
| **Teacher** | Behavior Reports, Interventions, Resources | 3 |
| **Parent** | Fees, Communication, Meetings | 3 |
| **Counselor** | Sessions, Notes, Treatment Plans | 3 |
| **Ministry** | Reports, Analytics, Workforce Data | 3 |
| **Platform** | Subscriptions, Invoices, Plans | 3 |
| **System** | Audit Logs, Cache, Background Jobs | 3 |
| **Total** | | **30+ new feature files** |

#### Task 1.1.1: Create Academic Features

**File:** `src/features/attendance.feature.ts`
```typescript
export const AttendanceFeature = defineFeature({
  name: "attendance",
  tableName: "attendance",
  schema: {
    id: { type: "text", required: true },
    studentId: { type: "reference", reference: { table: "users" }, required: true },
    classId: { type: "reference", reference: { table: "classes" }, required: true },
    date: { type: "date", required: true, sortable: true, filterable: true },
    status: { type: "enum", options: ["present", "absent", "late", "excused"], required: true, filterable: true },
    markedBy: { type: "reference", reference: { table: "users" } },
    remarks: { type: "text" },
    createdAt: { type: "timestamp", sortable: true },
  },
  permissions: {
    read: ["school-admin", "teacher", "parent"],
    create: ["teacher", "school-admin"],
    update: ["teacher", "school-admin"],
    delete: ["school-admin"],
  },
  ui: {
    title: "Attendance",
    titlePlural: "Attendance Records",
    basePath: "/school-admin/attendance",
    columns: [
      { key: "date", label: "Date", sortable: true, type: "date" },
      { key: "studentName", label: "Student", sortable: true },
      { key: "status", label: "Status", filterable: true, render: renderStatusBadge },
      { key: "markedBy", label: "Marked By" },
      { key: "remarks", label: "Remarks" },
    ],
  },
});
```

**File:** `src/features/homework.feature.ts`
**File:** `src/features/lessons.feature.ts`
**File:** `src/features/exams.feature.ts`
**File:** `src/features/results.feature.ts`

#### Task 1.1.2: Create School Admin Features

**File:** `src/features/departments.feature.ts`
**File:** `src/features/batches.feature.ts`
**File:** `src/features/timetables.feature.ts`
**File:** `src/features/announcements.feature.ts`

#### Task 1.1.3: Create Student Features

**File:** `src/features/student-skills.feature.ts`
**File:** `src/features/student-assessments.feature.ts`
**File:** `src/features/learning-paths.feature.ts`

#### Task 1.1.4: Create Teacher Features

**File:** `src/features/behavior-reports.feature.ts`
**File:** `src/features/interventions.feature.ts`
**File:** `src/features/teaching-resources.feature.ts`

### 1.2 Migrate Existing Pages to Use `FeatureListPage`

**Files to Modify:** 15+ pages

#### Task 1.2.1: School Admin Pages

**File:** `src/app/school-admin/students/page.tsx`
```typescript
// BEFORE (200+ lines)
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  // Fetch logic, error handling, etc.
  return <StudentsClient data={data} />;
}

// AFTER (3 lines)
import { FeatureListPage, StudentFeature } from "@/features";

export default function StudentsPage() {
  return <FeatureListPage feature={StudentFeature} />;
}
```

**Other pages to migrate:**
- `src/app/school-admin/teachers/page.tsx`
- `src/app/school-admin/classes/page.tsx`
- `src/app/school-admin/subjects/page.tsx`
- `src/app/school-admin/departments/page.tsx` (if exists)
- `src/app/school-admin/attendance/page.tsx`

#### Task 1.2.2: Ministry Pages

**File:** `src/app/ministry/page.tsx`
- Use `SchoolFeature` with custom filters for ministry view

#### Task 1.2.3: Platform Admin Pages

**File:** `src/app/platform-admin/schools/page.tsx`
- Use `SchoolFeature` with global view

### 1.3 Deprecate Old API Routes

**Action:** Mark old routes as deprecated, add redirect notices

**Files to Add Header Comments:**
```typescript
/**
 * @deprecated Use /api/resources/students instead
 * This route will be removed in v2.0
 */
```

**Routes to Deprecate:**
- `src/app/api/school-admin/students/route.ts` → `/api/resources/students`
- `src/app/api/school-admin/teachers/route.ts` → `/api/resources/teachers`
- `src/app/api/school-admin/classes/route.ts` → `/api/resources/classes`
- `src/app/api/school-admin/subjects/route.ts` → `/api/resources/subjects`
- `src/app/api/careers/route.ts` → `/api/resources/careers`
- All other single-resource CRUD routes

### 1.4 Update Feature Index

**File:** `src/features/index.ts`

```typescript
// ADD ALL NEW FEATURES
export { AttendanceFeature } from "./attendance.feature";
export { HomeworkFeature } from "./homework.feature";
// ... all others

export const features = {
  // Core
  students: StudentFeature,
  teachers: TeacherFeature,
  classes: ClassFeature,
  subjects: SubjectFeature,
  schools: SchoolFeature,
  assessments: AssessmentFeature,

  // Academic
  attendance: AttendanceFeature,
  homework: HomeworkFeature,
  lessons: LessonsFeature,
  exams: ExamsFeature,
  results: ResultsFeature,

  // ... all categories
};
```

---

## Phase 2: Unified Validation System

**Priority:** 🔥 HIGH
**Estimated Effort:** 20-30 hours
**Dependencies:** Phase 1
**Files to Create:** 3
**Files to Modify:** 50+

### Overview

Generate Zod validation schemas automatically from feature definitions.

### 2.1 Create Zod Schema Generator

**File:** `src/lib/features/schema-generator.ts`

```typescript
import { z } from "zod";
import type { SchemaDefinition, FieldDefinition } from "./define-feature";

export function generateZodSchema(schemaDef: SchemaDefinition) {
  const zodFields: Record<string, z.ZodTypeAny> = {};

  for (const [key, field] of Object.entries(schemaDef)) {
    zodFields[key] = fieldToZod(field);
  }

  return z.object(zodFields);
}

function fieldToZod(field: FieldDefinition): z.ZodTypeAny {
  let validator: z.ZodTypeAny;

  switch (field.type) {
    case "text":
      validator = z.string();
      break;
    case "email":
      validator = z.string().email();
      break;
    case "integer":
      validator = z.number().int();
      break;
    case "boolean":
      validator = z.boolean();
      break;
    case "timestamp":
    case "date":
      validator = z.string().datetime();
      break;
    case "json":
      validator = z.record(z.any());
      break;
    case "enum":
      validator = z.enum(field.options || []);
      break;
    case "reference":
      validator = z.string();
      break;
    default:
      validator = z.any();
  }

  if (!field.required) {
    validator = validator.optional().nullable();
  }

  if (field.unique) {
    validator = validator as z.ZodString; // Add unique check
  }

  return validator;
}

// Generate insert schema (excluding auto fields)
export function generateInsertSchema(feature: any) {
  const { schema } = feature.config;
  const fields = Object.entries(schema).filter(
    ([key]) => !["id", "createdAt", "updatedAt"].includes(key)
  );

  const insertSchema: SchemaDefinition = Object.fromEntries(fields);
  return generateZodSchema(insertSchema);
}

// Generate update schema (all optional)
export function generateUpdateSchema(feature: any) {
  const insertSchema = generateInsertSchema(feature);
  return insertSchema.partial();
}
```

### 2.2 Add Validation to API Handlers

**File:** `src/lib/features/define-feature.ts`

```typescript
// Add to feature definition
export function defineFeature<T extends SchemaDefinition>(config: FeatureConfig & { schema: T }) {
  const zodSchema = generateZodSchema(config.schema);
  const insertSchema = generateInsertSchema({ config });
  const updateSchema = generateUpdateSchema({ config });

  const api = {
    // ... existing handlers

    async create(data: unknown, auth: AuthContext) {
      // Validate before insert
      const validated = await insertSchema.parseAsync(data);

      const { db } = await import("@/lib/db");
      const table = getTable(config.tableName);

      const result = await db.insert(table).values(validated).returning();
      return result[0];
    },

    async update(id: string, data: unknown, auth: AuthContext) {
      const validated = await updateSchema.parseAsync(data);

      const { db } = await import("@/lib/db");
      const table = getTable(config.tableName);

      const result = await db.update(table)
        .set(validated)
        .where(eq(table.id, id))
        .returning();
      return result[0];
    },
  };

  return {
    // ... existing
    validation: {
      schema: zodSchema,
      insert: insertSchema,
      update: updateSchema,
    },
  };
}
```

### 2.3 Client-Side Validation Hooks

**File:** `src/lib/features/use-validation.ts`

```typescript
import { useCallback } from "react";
import type { z } from "zod";

export function useFormValidation(feature: any) {
  const schema = feature.validation.insert;

  const validate = useCallback((data: any) => {
    try {
      const validated = schema.parse(data);
      return { valid: true, data: validated, errors: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join(".");
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        return { valid: false, data: null, errors };
      }
      return { valid: false, data: null, errors: { _form: "Validation failed" } };
    }
  }, [schema]);

  return { validate };
}
```

### 2.4 Auto-Generate TypeScript Types from Schema

**File:** `src/lib/features/type-generator.ts`

```typescript
export function generateTypes<T extends SchemaDefinition>(
  schemaDef: T,
  tableName: string
) {
  // This would generate TypeScript types from the schema
  // For compile-time types, we use conditional types

  type FieldMap<T> = {
    [K in keyof T]: T[K]["type"] extends "text"
      ? string
      : T[K]["type"] extends "email"
      ? string
      : T[K]["type"] extends "integer"
      ? number
      : T[K]["type"] extends "boolean"
      ? boolean
      : T[K]["type"] extends "timestamp"
      ? Date
      : T[K]["type"] extends "json"
      ? Record<string, any>
      : any;
  };

  return {
    // These would be actual generated types
    Select: FieldMap<T> & { id: string; createdAt: Date; updatedAt: Date },
    Insert: Partial<Omit<FieldMap<T>, "id" | "createdAt" | "updatedAt">>,
    Update: Partial<Omit<FieldMap<T>, "id" | "createdAt" | "updatedAt">>,
  };
}
```

---

## Phase 3: Enhanced Forms System

**Priority:** 🔥 HIGH
**Estimated Effort:** 25-35 hours
**Dependencies:** Phase 2 (Validation)
**Files to Create:** 5
**Files to Modify:** 3

### 3.1 Smart Form Field Renderer

**File:** `src/components/features/form-field-renderer.tsx`

```typescript
"use client";

import { FieldDefinition } from "@/lib/features/define-feature";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { ReferencePicker } from "@/components/features/reference-picker";
import { JsonEditor } from "@/components/features/json-editor";

interface FormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FormFieldRendererProps) {
  const label = field.label || field.key;
  const required = field.required;

  // Text input
  if (field.type === "text" || field.type === "email") {
    return (
      <div className="space-y-1">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          type={field.type === "email" ? "email" : "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Number input
  if (field.type === "integer") {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Boolean checkbox
  if (field.type === "boolean") {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={value || false}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <Label>{label}</Label>
      </div>
    );
  }

  // Date picker
  if (field.type === "date" || field.type === "timestamp") {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <DatePicker value={value} onChange={onChange} disabled={disabled} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Enum select
  if (field.type === "enum" && field.options) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Reference picker
  if (field.type === "reference") {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <ReferencePicker
          table={field.reference?.table}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // JSON editor
  if (field.type === "json") {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <JsonEditor value={value} onChange={onChange} disabled={disabled} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Textarea for long text
  if (field.multiline) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={field.rows || 3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}
```

### 3.2 Reference Picker Component

**File:** `src/components/features/reference-picker.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReferencePickerProps {
  table: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  displayField?: string;
}

export function ReferencePicker({
  table,
  value,
  onChange,
  disabled,
  displayField = "name",
}: ReferencePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Array<{ id: string; [key: string]: any }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, search]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "20");

      const response = await fetch(`/api/resources/${table}?${params}`);
      const result = await response.json();
      setItems(result.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={disabled}
        >
          {selectedItem
            ? selectedItem[displayField] || selectedItem.id
            : `Select ${table}...`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No items found
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                >
                  <span>{item[displayField] || item.id}</span>
                  {item.id === value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.3 Multi-Select for Array Fields

**File:** `src/components/features/multi-select-picker.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectPickerProps {
  table: string;
  values?: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  displayField?: string;
}

export function MultiSelectPicker({
  table,
  values = [],
  onChange,
  disabled,
  displayField = "name",
}: MultiSelectPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; [key: string]: any }>>([]);

  useEffect(() => {
    if (open) {
      fetch(`/api/resources/${table}?limit=100`)
        .then((r) => r.json())
        .then((result) => setItems(result.data?.data || []));
    }
  }, [open, table]);

  const selectedItems = items.filter((i) => values.includes(i.id));

  const toggleItem = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start" disabled={disabled}>
          {selectedItems.length === 0
            ? `Select ${table}...`
            : `${selectedItems.length} selected`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        {/* Selected items display */}
        {selectedItems.length > 0 && (
          <div className="p-2 border-b flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <Badge key={item.id} variant="secondary">
                {item[displayField] || item.id}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {/* Available items */}
        <div className="max-h-64 overflow-y-auto p-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center justify-between"
            >
              <span>{item[displayField] || item.id}</span>
              {values.includes(item.id) && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.4 Update FeatureForm with Smart Fields

**File:** `src/components/features/feature-form.tsx`

```typescript
// Replace the manual form field rendering with:
import { FormFieldRenderer } from "./form-field-renderer";

export function FeatureForm({ feature, mode, initialValues, onSubmit, onCancel }: FeatureFormProps) {
  // ... existing state

  return (
    <Card>
      {/* ... header */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(([key, config]: [string, any]) => (
            <FormFieldRenderer
              key={key}
              field={{ ...config, key }}
              value={formData[key]}
              onChange={(value) => handleChange(key, value)}
              error={errors?.[key]}
              disabled={isSubmitting}
            />
          ))}

          {/* Submit buttons */}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 4: Unified Search & Filters

**Priority:** 🔥 HIGH
**Estimated Effort:** 30-40 hours
**Dependencies:** Phase 1
**Files to Create:** 4
**Files to Modify:** 2

### 4.1 Universal Search Service

**File:** `src/lib/features/unified-search.ts`

```typescript
import { db } from "@/lib/db";
import { features } from "@/features";
import { sql, or, like, ilike, and } from "drizzle-orm";

interface SearchOptions {
  query: string;
  resources?: string[]; // Which features to search
  schoolId?: string;
  limit?: number;
}

interface SearchResult {
  resource: string;
  id: string;
  title: string;
  description?: string;
  url: string;
  relevance: number;
}

export async function unifiedSearch(options: SearchOptions): Promise<SearchResult[]> {
  const { query, resources = Object.keys(features), schoolId, limit = 50 } = options;

  const results: SearchResult[] = [];

  for (const resourceName of resources) {
    const feature = features[resourceName];
    if (!feature) continue;

    // Get searchable columns
    const columns = feature.config.ui?.columns?.filter((c) => c.searchable) || [];
    const titleColumn = columns[0]?.key || "name";

    // Build search query
    const table = getTable(feature.config.tableName);
    const conditions = columns.map((col) =>
      ilike(table[col.key], `%${query}%`)
    );

    const whereClause = schoolId
      ? and(eq(table.schoolId, schoolId), or(...conditions))
      : or(...conditions);

    const items = await db
      .select()
      .from(table)
      .where(whereClause)
      .limit(Math.ceil(limit / resources.length));

    for (const item of items) {
      results.push({
        resource: resourceName,
        id: item.id,
        title: item[titleColumn] || item.id,
        description: item.description || item.email || item.code,
        url: `${feature.config.ui?.basePath}/${item.id}`,
        relevance: calculateRelevance(query, item, columns),
      });
    }
  }

  // Sort by relevance and limit
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

function calculateRelevance(query: string, item: any, columns: any[]): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();

  for (const col of columns) {
    const value = item[col.key];
    if (!value) continue;

    const lowerValue = String(value).toLowerCase();

    // Exact match = highest score
    if (lowerValue === lowerQuery) score += 100;
    // Starts with query = high score
    else if (lowerValue.startsWith(lowerQuery)) score += 50;
    // Contains query = medium score
    else if (lowerValue.includes(lowerQuery)) score += 10;
  }

  return score;
}
```

### 4.2 Universal Filter Builder

**File:** `src/lib/features/filter-builder.ts`

```typescript
import { sql, and, eq, inArray, gte, lte, isNull, isNotNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "between"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null"
  | "after"
  | "before";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[];
}

export interface FilterGroup {
  operator: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
}

export function buildFilterQuery(
  table: any,
  filterGroup: FilterGroup
): SQL | undefined {
  const conditions = filterGroup.conditions.map((condition) =>
    buildSingleCondition(table, condition)
  );

  const validConditions = conditions.filter(Boolean);
  if (validConditions.length === 0) return undefined;

  return filterGroup.operator === "AND"
    ? and(...validConditions as SQL[])
    : or(...validConditions as SQL[]);
}

function buildSingleCondition(table: any, condition: FilterCondition | FilterGroup): SQL | undefined {
  if ("operator" in condition && (condition.operator === "AND" || condition.operator === "OR")) {
    return buildFilterQuery(table, condition);
  }

  const { field, operator, value, values } = condition as FilterCondition;
  const column = table[field];

  switch (operator) {
    case "equals":
      return eq(column, value);
    case "not_equals":
      return sql`${column} != ${value}`;
    case "contains":
      return column.like(`%${value}%`);
    case "starts_with":
      return column.like(`${value}%`);
    case "ends_with":
      return column.like(`%${value}`);
    case "greater_than":
      return sql`${column} > ${value}`;
    case "less_than":
      return sql`${column} < ${value}`;
    case "between":
      return and(gte(column, value), lte(column, values?.[1]));
    case "in":
      return inArray(column, values || []);
    case "not_in":
      return sql`NOT ${column} = ANY(${values})`;
    case "is_null":
      return isNull(column);
    case "is_not_null":
      return isNotNull(column);
    case "after":
      return gte(column, value);
    case "before":
      return lte(column, value);
    default:
      return undefined;
  }
}
```

### 4.3 Filter UI Component

**File:** `src/components/features/filter-builder.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Filter } from "lucide-react";
import type { FilterCondition, FilterOperator } from "@/lib/features/filter-builder";

interface FilterBuilderProps {
  columns: Array<{ key: string; label: string; type?: string }>;
  onApply: (filters: FilterCondition[]) => void;
}

export function FilterBuilder({ columns, onApply }: FilterBuilderProps) {
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const addFilter = () => {
    setFilters([...filters, { field: columns[0]?.key, operator: "equals", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    setFilters(filters.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const getOperatorsForType = (type?: string): FilterOperator[] => {
    if (type === "number" || type === "integer") {
      return ["equals", "not_equals", "greater_than", "less_than", "between"];
    }
    if (type === "date" || type === "timestamp") {
      return ["equals", "after", "before", "between"];
    }
    return ["equals", "not_equals", "contains", "starts_with", "ends_with"];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filters</span>
        <Button size="sm" variant="outline" onClick={addFilter}>
          <Plus className="h-4 w-4 mr-1" />
          Add Filter
        </Button>
      </div>

      {filters.map((filter, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Select
            value={filter.field}
            onValueChange={(value) => updateFilter(index, { field: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.key} value={col.key}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filter.operator}
            onValueChange={(value) => updateFilter(index, { operator: value as FilterOperator })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getOperatorsForType(columns.find((c) => c.key === filter.field)?.type).map((op) => (
                <SelectItem key={op} value={op}>
                  {op.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={filter.value || ""}
            onChange={(e) => updateFilter(index, { value: e.target.value })}
            placeholder="Value"
            className="flex-1"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeFilter(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {filters.length > 0 && (
        <Button onClick={() => onApply(filters)} className="w-full">
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      )}
    </div>
  );
}
```

### 4.4 Advanced Search Component

**File:** `src/components/features/unified-search.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { unifiedSearch, type SearchResult } from "@/lib/features/unified-search";

interface UnifiedSearchProps {
  onSelect?: (result: SearchResult) => void;
  resources?: string[];
  schoolId?: string;
  placeholder?: string;
}

export function UnifiedSearch({
  onSelect,
  resources,
  schoolId,
  placeholder = "Search anything...",
}: UnifiedSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      const searchResults = await unifiedSearch({
        query: q,
        resources,
        schoolId,
        limit: 10,
      });
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        {loading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {query.length < 2 ? "Type at least 2 characters" : "No results found"}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.resource}-${result.id}-${index}`}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="font-medium text-sm">{result.title}</div>
                {result.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{result.description}</div>
                )}
                <div className="text-xs text-blue-600 mt-1 capitalize">
                  {result.resource}
                </div>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

---

## Phase 5: Unified Modals & Dialogs

**Priority:** MEDIUM
**Estimated Effort:** 15-20 hours
**Dependencies:** Phase 3
**Files to Create:** 3

### 5.1 Universal Modal Component

**File:** `src/components/features/universal-modal.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UniversalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
}

export function UniversalModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showClose = true,
}: UniversalModalProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={sizeClasses[size]}>
        {showClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
```

### 5.2 Confirm Dialog

**File:** `src/components/features/confirm-dialog.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icon || <AlertTriangle className={`h-6 w-6 ${variant === "danger" ? "text-red-600" : "text-amber-600"}`} />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription className="pl-9">{description}</DialogDescription>}
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            className={variantStyles[variant]}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Please wait..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.3 Modal Manager Hook

**File:** `src/lib/features/use-modal.ts`

```typescript
import { useState, useCallback } from "react";

export interface ModalState<T = any> {
  open: boolean;
  data?: T;
}

export function useModal<T = any>() {
  const [state, setState] = useState<ModalState<T>>({ open: false });

  const open = useCallback((data?: T) => {
    setState({ open: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ open: false });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, open: !prev.open }));
  }, []);

  return {
    open: state.open,
    data: state.data,
    openModal: open,
    closeModal: close,
    toggleModal: toggle,
  };
}
```

---

## Phase 6: Unified Notifications

**Priority:** HIGH
**Estimated Effort:** 25-30 hours
**Dependencies:** None
**Files to Create:** 5
**Files to Modify:** 1

### 6.1 Notification Service

**File:** `src/lib/notifications/notification-service.ts`

```typescript
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "announcement"
  | "assignment"
  | "reminder";

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export async function createNotification(options: CreateNotificationOptions) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      metadata: options.metadata,
      expiresAt: options.expiresAt,
      isRead: false,
      createdAt: new Date(),
    })
    .returning();

  return notification;
}

export async function notifyUser(userId: string, type: NotificationType, title: string, message: string) {
  return createNotification({ userId, type, title, message });
}

export async function notifyUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  const notifications = await Promise.all(
    userIds.map((userId) => createNotification({ userId, type, title, message }))
  );
  return notifications;
}

// Batch notify all users in a class
export async function notifyClass(
  classId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");

  const students = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.classId, classId));

  return notifyUsers(students.map((s) => s.id), type, title, message);
}

// Mark as read
export async function markNotificationRead(notificationId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

// Mark all as read
export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.userId, userId));
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result.length;
}
```

### 6.2 Toast Notifications (Client)

**File:** `src/components/notifications/toaster.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

let toastId = 0;

export function useToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${toastId++}`;
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ type: "success", title, message, duration });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ type: "error", title, message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ type: "info", title, message, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ type: "warning", title, message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}

export function Toaster() {
  const { toasts, removeToast } = useToaster();

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-md border-l-4"
          style={{
            borderLeftColor:
              toast.type === "success"
                ? "#16a34a"
                : toast.type === "error"
                ? "#dc2626"
                : toast.type === "warning"
                ? "#f59e0b"
                : "#2563eb",
          }}
        >
          <div className="flex items-start gap-3">
            {icons[toast.type]}
            <div className="flex-1">
              <div className="font-medium text-sm">{toast.title}</div>
              {toast.message && <div className="text-sm text-gray-600 mt-1">{toast.message}</div>}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeToast(toast.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 6.3 Notification Bell Component

**File:** `src/components/notifications/notification-bell.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
    fetchUnreadCount();
  }, [open]);

  const fetchNotifications = async () => {
    const response = await fetch(`/api/notifications?limit=10`);
    const result = await response.json();
    setNotifications(result.data || []);
  };

  const fetchUnreadCount = async () => {
    const response = await fetch(`/api/notifications/unread-count`);
    const result = await response.json();
    setUnreadCount(result.count || 0);
  };

  const markAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    await fetch(`/api/notifications/mark-all-read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 mt-2 rounded-full ${!notification.isRead ? "bg-blue-600" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <button
              onClick={() => (window.location.href = "/notifications")}
              className="w-full text-center text-sm text-blue-600 hover:underline py-1"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### 6.4 Notification API Route

**File:** `src/app/api/notifications/route.ts`

```typescript
import { createApiRoute } from "@/lib/api-wrapper";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const GET = createApiRoute(async (request, auth, context) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, auth.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    data: userNotifications,
  };
}, ["student", "teacher", "school-admin", "parent", "counselor", "admin"]);
```

---

## Phase 7: Unified Dashboards

**Priority:** MEDIUM
**Estimated Effort:** 30-40 hours
**Dependencies:** Phase 1
**Files to Create:** 6

### 7.1 Widget System

**File:** `src/components/dashboard/widget-system.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Refresh } from "lucide-react";

export interface DashboardWidgetProps {
  title: string;
  value?: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: ReactNode;
  action?: () => void;
  loading?: boolean;
  error?: string;
  children?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  colSpan?: 1 | 2 | 3 | 4;
}

export function DashboardWidget({
  title,
  value,
  change,
  icon,
  action,
  loading,
  error,
  children,
  size = "md",
  colSpan = 1,
}: DashboardWidgetProps) {
  const sizeClasses = {
    sm: "h-32",
    md: "h-40",
    lg: "h-56",
    xl: "h-72",
    full: "h-auto min-h-96",
  };

  if (error) {
    return (
      <Card className={`col-span-${colSpan} ${sizeClasses[size]}`}>
        <CardContent className="flex items-center justify-center h-full text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`col-span-${colSpan} ${sizeClasses[size]} ${action ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`} onClick={action}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Refresh className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : value !== undefined ? (
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <div className={`text-xs mt-1 ${change.type === "increase" ? "text-green-600" : change.type === "decrease" ? "text-red-600" : "text-gray-600"}`}>
                {change.type === "increase" && "+"}
                {change.value}% from last month
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
```

### 7.2 Stat Card Widget

**File:** `src/components/dashboard/stat-card.tsx`

```typescript
"use client";

import { DashboardWidget } from "./widget-system";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  change?: number;
  loading?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon: Icon, change, loading, trend }: StatCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <DashboardWidget
      title={title}
      value={value}
      icon={Icon && <Icon className="h-4 w-4 text-gray-600" />}
      change={change !== undefined ? {
        value: change,
        type: trend || (change >= 0 ? "increase" : "decrease"),
      } : undefined}
      loading={loading}
      size="md"
    />
  );
}
```

### 7.3 Chart Widget Wrapper

**File:** `src/components/dashboard/chart-widget.tsx`

```typescript
"use client";

import { DashboardWidget } from "./widget-system";
import type { ChartConfig } from "./chart-builder";

interface ChartWidgetProps {
  title: string;
  type: "bar" | "line" | "pie" | "area";
  data: any[];
  config: ChartConfig;
  loading?: boolean;
  size?: "lg" | "xl" | "full";
  colSpan?: 1 | 2 | 3 | 4;
}

export function ChartWidget({
  title,
  type,
  data,
  config,
  loading,
  size = "lg",
  colSpan = 2,
}: ChartWidgetProps) {
  return (
    <DashboardWidget title={title} loading={loading} size={size} colSpan={colSpan}>
      <ChartRenderer type={type} data={data} config={config} />
    </DashboardWidget>
  );
}
```

### 7.4 Table Widget

**File:** `src/components/dashboard/table-widget.tsx`

```typescript
"use client";

import { DashboardWidget } from "./widget-system";

interface TableWidgetProps {
  title: string;
  columns: Array<{ key: string; label: string }>;
  data: any[];
  loading?: boolean;
  maxRows?: number;
  size?: "lg" | "xl" | "full";
  colSpan?: 1 | 2 | 3 | 4;
  onViewAll?: () => void;
}

export function TableWidget({
  title,
  columns,
  data,
  loading,
  maxRows = 5,
  size = "lg",
  colSpan = 2,
  onViewAll,
}: TableWidgetProps) {
  const displayData = data.slice(0, maxRows);

  return (
    <DashboardWidget
      title={title}
      loading={loading}
      size={size}
      colSpan={colSpan}
      action={onViewAll}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col.key} className="text-left py-2 px-3 text-sm font-medium text-gray-600">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {columns.map((col) => (
                  <td key={col.key} className="py-2 px-3 text-sm">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardWidget>
  );
}
```

### 7.5 Activity Feed Widget

**File:** `src/components/dashboard/activity-feed.tsx`

```typescript
"use client";

import { DashboardWidget } from "./widget-system";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
  loading?: boolean;
  size?: "lg" | "xl" | "full";
}

export function ActivityFeed({
  title = "Recent Activity",
  activities,
  loading,
  size = "lg",
}: ActivityFeedProps) {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-600" />,
    info: <Clock className="h-4 w-4 text-blue-600" />,
  };

  return (
    <DashboardWidget title={title} loading={loading} size={size}>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            {icons[activity.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
```

### 7.6 Dashboard Grid Layout

**File:** `src/components/dashboard/dashboard-grid.tsx`

```typescript
"use client";

import { ReactNode } from "react";

interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function DashboardGrid({ children, columns = 3 }: DashboardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]}`}>
      {children}
    </div>
  );
}
```

---

## Phase 8: Export/Import System

**Priority:** HIGH
**Estimated Effort:** 35-45 hours
**Dependencies:** Phase 1
**Files to Create:** 5

### 8.1 Export Service

**File:** `src/lib/features/export-service.ts`

```typescript
import { features } from "@/features";

export type ExportFormat = "csv" | "xlsx" | "json" | "pdf";

export interface ExportOptions {
  feature: string;
  format: ExportFormat;
  filters?: Record<string, any>;
  columns?: string[]; // Specific columns to export
  schoolId?: string;
}

export async function exportData(options: ExportOptions): Promise<Blob> {
  const feature = features[options.feature];
  if (!feature) {
    throw new Error(`Feature ${options.feature} not found`);
  }

  // Fetch data
  const params = new URLSearchParams({
    ...options.filters,
    limit: "10000", // Max for export
  });

  const response = await fetch(`/api/resources/${options.feature}?${params}`, {
    headers: {
      "Accept": options.format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/json",
    },
  });

  const result = await response.json();
  const data = result.data?.data || result.data || [];

  // Format based on type
  switch (options.format) {
    case "csv":
      return exportToCsv(data, options.columns, feature);
    case "xlsx":
      return exportToXlsx(data, options.columns, feature);
    case "json":
      return exportToJson(data);
    case "pdf":
      return exportToPdf(data, options.columns, feature);
    default:
      return exportToJson(data);
  }
}

function exportToCsv(data: any[], columns?: string[], feature?: any): Blob {
  const cols = columns || feature?.config.ui?.columns?.map((c: any) => c.key) || Object.keys(data[0] || {});

  const headers = cols.map((key) => {
    const col = feature?.config.ui?.columns?.find((c: any) => c.key === key);
    return col?.label || key;
  });

  const rows = data.map((row) =>
    cols.map((key) => {
      const value = row[key];
      // Escape CSV values
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    })
  );

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  return new Blob([csv], { type: "text/csv" });
}

function exportToXlsx(data: any[], columns?: string[], feature?: any): Blob {
  // Use xlsx library
  const XLSX = require("xlsx");

  const cols = columns || feature?.config.ui?.columns?.map((c: any) => c.key) || Object.keys(data[0] || {});

  const headers = cols.map((key) => {
    const col = feature?.config.ui?.columns?.find((c: any) => c.key === key);
    return col?.label || key;
  });

  const rows = data.map((row) =>
    cols.map((key) => row[key] ?? "")
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function exportToJson(data: any[]): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: "application/json" });
}

async function exportToPdf(data: any[], columns?: string[], feature?: any): Promise<Blob> {
  // Use jsPDF or similar
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const cols = columns || feature?.config.ui?.columns?.map((c: any) => c.key) || Object.keys(data[0] || {});

  let y = 20;
  doc.setFontSize(16);
  doc.text(feature?.config.ui?.titlePlural || "Data", 14, y);
  y += 15;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
  y += 15;

  // Draw table
  const cellWidth = 170 / cols.length;
  const cellHeight = 10;

  // Headers
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  cols.forEach((key, i) => {
    const col = feature?.config.ui?.columns?.find((c: any) => c.key === key);
    const label = col?.label || key;
    doc.rect(14 + i * cellWidth, y, cellWidth, cellHeight, "F");
    doc.text(label, 14 + i * cellWidth + 2, y + 7);
  });
  y += cellHeight;

  // Data rows
  doc.setFillColor(255, 255, 255);
  data.slice(0, 50).forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    cols.forEach((key, i) => {
      const value = String(row[key] ?? "").substring(0, 20);
      doc.rect(14 + i * cellWidth, y, cellWidth, cellHeight, "S");
      doc.text(value, 14 + i * cellWidth + 2, y + 7);
    });
    y += cellHeight;
  });

  return new Blob([doc.output("blob")], { type: "application/pdf" });
}
```

### 8.2 Import Service

**File:** `src/lib/features/import-service.ts`

```typescript
import { features } from "@/features";

export type ImportFormat = "csv" | "xlsx" | "json";

export interface ImportOptions {
  feature: string;
  file: File;
  format: ImportFormat;
  mapping?: Record<string, string>; // Map file columns to schema fields
  onCreate?: (item: any) => void;
  onUpdate?: (item: any) => void;
  onError?: (errors: ImportError[]) => void;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportResult {
  success: number;
  failed: number;
  updated: number;
  errors: ImportError[];
}

export async function importData(options: ImportOptions): Promise<ImportResult> {
  const feature = features[options.feature];
  if (!feature) {
    throw new Error(`Feature ${options.feature} not found`);
  }

  let data: any[];

  switch (options.format) {
    case "csv":
      data = await parseCsv(options.file);
      break;
    case "xlsx":
      data = await parseXlsx(options.file);
      break;
    case "json":
      data = await parseJson(options.file);
      break;
  }

  // Apply mapping
  if (options.mapping) {
    data = data.map((row) => {
      const mapped: any = {};
      for (const [fileCol, schemaField] of Object.entries(options.mapping!)) {
        mapped[schemaField] = row[fileCol];
      }
      return mapped;
    });
  }

  // Validate and import
  const result: ImportResult = {
    success: 0,
    failed: 0,
    updated: 0,
    errors: [],
  };

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      // Validate
      const validation = feature.validation?.insert?.safeParse(item);
      if (!validation?.success) {
        result.failed++;
        validation?.error.errors.forEach((err) => {
          result.errors.push({
            row: i + 1,
            field: err.path[0] as string,
            message: err.message,
            value: item[err.path[0] as string],
          });
        });
        continue;
      }

      // Check if exists
      const existing = item.id
        ? await feature.api.get(item.id, { user: {} })
        : null;

      if (existing) {
        await feature.api.update(item.id, validation.data, { user: {} });
        result.updated++;
        options.onUpdate?.(validation.data);
      } else {
        await feature.api.create(validation.data, { user: {} });
        result.success++;
        options.onCreate?.(validation.data);
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        field: "_general",
        message: error instanceof Error ? error.message : "Unknown error",
        value: item,
      });
    }
  }

  options.onError?.(result.errors);
  return result;
}

async function parseCsv(file: File): Promise<any[]> {
  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
}

async function parseXlsx(file: File): Promise<any[]> {
  const XLSX = require("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(worksheet);
}

async function parseJson(file: File): Promise<any[]> {
  const text = await file.text();
  return JSON.parse(text);
}
```

### 8.3 Export Button Component

**File:** `src/components/features/export-button.tsx`

```typescript
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportData, type ExportFormat } from "@/lib/features/export-service";

interface ExportButtonProps {
  feature: string;
  filename?: string;
  disabled?: boolean;
  columns?: string[];
}

export function ExportButton({ feature, filename, disabled, columns }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    try {
      const blob = await exportData({
        feature,
        format,
        columns,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `${feature}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 8.4 Import Button Component

**File:** `src/components/features/import-button.tsx`

```typescript
"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { importData, type ImportResult } from "@/lib/features/import-service";

interface ImportButtonProps {
  feature: string;
  onComplete?: (result: ImportResult) => void;
}

export function ImportButton({ feature, onComplete }: ImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      const importResult = await importData({
        feature,
        file,
        format: file.name.endsWith(".csv")
          ? "csv"
          : file.name.endsWith(".xlsx")
          ? "xlsx"
          : "json",
        onCreate: () => setProgress((p) => p + 1),
        onUpdate: () => setProgress((p) => p + 1),
      });

      setResult(importResult);
      onComplete?.(importResult);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Upload a CSV, Excel, or JSON file to import data into {feature}.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-sm text-gray-600">
                Importing records...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.success}</div>
                  <div className="text-xs text-gray-600">Created</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-xs text-gray-600">Updated</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Errors:</p>
                  {result.errors.slice(0, 10).map((error, i) => (
                    <div key={i} className="text-xs text-red-600">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="text-xs text-gray-500">
                      ...and {result.errors.length - 10} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInput.current?.click()}
                className="w-full"
              >
                Choose File
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {result ? "Done" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## Phase 9: Unified Charts

**Priority:** MEDIUM
**Estimated Effort:** 40-50 hours
**Dependencies:** Phase 7 (Dashboard Widgets)
**Files to Create:** 4

### 9.1 Chart Configuration Builder

**File:** `src/components/dashboard/chart-builder.ts`

```typescript
import { features } from "@/features";

export type ChartType = "bar" | "line" | "pie" | "area" | "donut";

export interface ChartConfig {
  xAxis?: string;
  yAxis: string[];
 groupBy?: string;
  aggregate?: "count" | "sum" | "avg" | "min" | "max";
  colorBy?: string;
  limit?: number;
}

export interface ChartDataPoint {
  label: string;
  values: Record<string, number>;
}

export async function buildChartData(
  featureName: string,
  config: ChartConfig,
  filters?: Record<string, any>
): Promise<ChartDataPoint[]> {
  const feature = features[featureName];
  if (!feature) {
    throw new Error(`Feature ${featureName} not found`);
  }

  // Fetch data
  const params = new URLSearchParams({
    ...filters,
    limit: (config.limit || 100).toString(),
  });

  const response = await fetch(`/api/resources/${featureName}?${params}`);
  const result = await response.json();
  const data = result.data?.data || result.data || [];

  // Group and aggregate
  const grouped = new Map<string, Map<string, number>>();

  for (const item of data) {
    const groupKey = config.groupBy ? String(item[config.groupBy] || "Unknown") : "All";
    const seriesKey = config.colorBy ? String(item[config.colorBy] || "All") : "value";

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, new Map());
    }

    const series = grouped.get(groupKey)!;
    const current = series.get(seriesKey) || 0;

    // Aggregate
    for (const yAxis of config.yAxis) {
      const value = item[yAxis];
      if (typeof value === "number") {
        switch (config.aggregate) {
          case "sum":
            series.set(seriesKey, current + value);
            break;
          case "avg":
            // Need to track count separately
            series.set(seriesKey, current + value);
            break;
          case "count":
            series.set(seriesKey, current + 1);
            break;
          case "min":
            series.set(seriesKey, current === 0 ? value : Math.min(current, value));
            break;
          case "max":
            series.set(seriesKey, Math.max(current, value));
            break;
          default:
            series.set(seriesKey, current + value);
        }
      }
    }
  }

  // Convert to chart data
  const chartData: ChartDataPoint[] = [];
  for (const [label, series] of grouped.entries()) {
    const values: Record<string, number> = {};
    for (const [seriesKey, value] of series.entries()) {
      values[seriesKey] = value;
    }
    chartData.push({ label, values });
  }

  return chartData;
}
```

### 9.2 Chart Renderer Component

**File:** `src/components/dashboard/chart-renderer.tsx`

```typescript
"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartType, ChartDataPoint, ChartConfig } from "./chart-builder";

interface ChartRendererProps {
  type: ChartType;
  data: ChartDataPoint[];
  config: ChartConfig;
  colors?: string[];
}

export function ChartRenderer({ type, data, config, colors }: ChartRendererProps) {
  const defaultColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  ];

  const chartColors = colors || defaultColors;

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((point) => ({
      name: point.label,
      ...point.values,
    }));
  }, [data]);

  const seriesKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const point of data) {
      Object.keys(point.values).forEach((key) => keys.add(key));
    }
    return Array.from(keys);
  }, [data]);

  switch (type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={chartColors[i % chartColors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={chartColors[i % chartColors.length]}
                stroke={chartColors[i % chartColors.length]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={seriesKeys[0] || "value"}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case "donut":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={seriesKeys[0] || "value"}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              label
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Unsupported chart type: {type}</div>;
  }
}
```

### 9.3 Quick Chart Component

**File:** `src/components/dashboard/quick-chart.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { ChartRenderer } from "./chart-renderer";
import { buildChartData, type ChartType, type ChartConfig } from "./chart-builder";
import { Loader2 } from "lucide-react";

interface QuickChartProps {
  feature: string;
  type: ChartType;
  config: ChartConfig;
  filters?: Record<string, any>;
}

export function QuickChart({ feature, type, config, filters }: QuickChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const chartData = await buildChartData(feature, config, filters);
        setData(chartData);
      } catch (error) {
        console.error("Failed to load chart data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [feature, config, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return <ChartRenderer type={type} data={data} config={config} />;
}
```

### 9.4 Chart Builder Modal

**File:** `src/components/dashboard/chart-builder-modal.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { features } from "@/features";
import type { ChartType, ChartConfig } from "./chart-builder";

interface ChartBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: { feature: string; type: ChartType; chartConfig: ChartConfig }) => void;
}

export function ChartBuilderModal({ open, onClose, onSave }: ChartBuilderModalProps) {
  const [feature, setFeature] = useState("students");
  const [type, setType] = useState<ChartType>("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState("");
  const [aggregate, setAggregate] = useState<ChartConfig["aggregate"]>("count");

  const featureDef = features[feature];
  const columns = featureDef?.config.ui?.columns || [];

  const handleSave = () => {
    onSave({
      feature,
      type,
      chartConfig: {
        xAxis,
        yAxis,
        groupBy,
        aggregate,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Build Chart</DialogTitle>
          <DialogDescription>
            Configure your chart data source and visualization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data Source</Label>
            <Select value={feature} onValueChange={setFeature}>
              {Object.keys(features).map((f) => (
                <option key={f} value={f}>
                  {features[f].config.ui?.titlePlural || f}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Chart Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ChartType)}>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="donut">Donut Chart</option>
            </Select>
          </div>

          <div>
            <Label>X-Axis / Group By</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <option value="">Select column...</option>
              {columns.map((col: any) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Y-Axis / Value</Label>
            <Select
              value={yAxis[0] || ""}
              onValueChange={(v) => setYAxis([v])}
            >
              <option value="">Select column...</option>
              {columns.filter((c: any) => c.type === "number" || c.type === "integer").map((col: any) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Aggregation</Label>
            <Select value={aggregate} onValueChange={(v) => setAggregate(v as ChartConfig["aggregate"])}>
              <option value="count">Count</option>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Create Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 10: Unified Permissions

**Priority:** CRITICAL
**Estimated Effort:** 40-50 hours
**Dependencies:** Phase 1
**Files to Create:** 6

### 10.1 Permission Definitions

**File:** `src/lib/permissions/permission-definitions.ts`

```typescript
export type Role =
  | "admin"
  | "platform-admin"
  | "school-admin"
  | "teacher"
  | "counselor"
  | "parent"
  | "student";

export type Resource =
  | "students"
  | "teachers"
  | "classes"
  | "subjects"
  | "schools"
  | "assessments"
  | "attendance"
  | "homework"
  | "reports"
  | "analytics"
  | "settings"
  | "users";

export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";

export interface Permission {
  resource: Resource;
  action: PermissionAction;
  scope?: "all" | "school" | "class" | "own";
}

// Role-based permissions matrix
export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { resource: "users", action: "manage", scope: "all" },
    { resource: "schools", action: "manage", scope: "all" },
    { resource: "analytics", action: "read", scope: "all" },
    // ... all permissions
  ],
  "platform-admin": [
    { resource: "schools", action: "manage", scope: "all" },
    { resource: "analytics", action: "read", scope: "all" },
    { resource: "settings", action: "update", scope: "all" },
  ],
  "school-admin": [
    { resource: "students", action: "manage", scope: "school" },
    { resource: "teachers", action: "manage", scope: "school" },
    { resource: "classes", action: "manage", scope: "school" },
    { resource: "subjects", action: "manage", scope: "school" },
    { resource: "attendance", action: "read", scope: "school" },
    { resource: "reports", action: "read", scope: "school" },
  ],
  teacher: [
    { resource: "students", action: "read", scope: "class" },
    { resource: "attendance", action: "update", scope: "class" },
    { resource: "homework", action: "manage", scope: "class" },
    { resource: "reports", action: "read", scope: "class" },
    { resource: "assessments", action: "manage", scope: "class" },
  ],
  counselor: [
    { resource: "students", action: "read", scope: "school" },
    { resource: "assessments", action: "read", scope: "school" },
    { resource: "reports", action: "read", scope: "school" },
  ],
  parent: [
    { resource: "students", action: "read", scope: "own" },
    { resource: "attendance", action: "read", scope: "own" },
    { resource: "reports", action: "read", scope: "own" },
  ],
  student: [
    { resource: "assessments", action: "read", scope: "own" },
    { resource: "homework", action: "read", scope: "own" },
    { resource: "attendance", action: "read", scope: "own" },
  ],
};

// Check if a role has a specific permission
export function hasPermission(
  role: Role,
  resource: Resource,
  action: PermissionAction,
  scope?: string
): boolean {
  const permissions = rolePermissions[role] || [];

  return permissions.some(
    (p) =>
      p.resource === resource &&
      (p.action === action || p.action === "manage") &&
      (!scope || p.scope === "all" || p.scope === scope)
  );
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

// Custom permissions (user-specific overrides)
export interface UserPermissionOverride {
  userId: string;
  permissions: Permission[];
}
```

### 10.2 Permission Service

**File:** `src/lib/permissions/permission-service.ts`

```typescript
import { db } from "@/lib/db";
import { userPermissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Role, Resource, PermissionAction } from "./permission-definitions";

export interface AuthContext {
  user: {
    id: string;
    schoolId?: string;
    classId?: string;
    role?: Role;
  };
}

export class PermissionService {
  /**
   * Check if a user has permission to perform an action
   */
  static async check(
    auth: AuthContext,
    resource: Resource,
    action: PermissionAction,
    resourceId?: string
  ): Promise<boolean> {
    if (!auth.user?.id) return false;

    // Admins have all permissions
    if (auth.user.role === "admin") return true;

    // Get role-based permissions
    const roleHasPermission = this.checkRolePermission(
      auth.user.role as Role,
      resource,
      action,
      auth
    );

    if (!roleHasPermission) return false;

    // Check scope-based access
    return this.checkScopeAccess(auth, resource, resourceId);
  }

  /**
   * Check role-based permission
   */
  static checkRolePermission(
    role: Role | undefined,
    resource: Resource,
    action: PermissionAction,
    auth: AuthContext
  ): boolean {
    if (!role) return false;

    const { hasPermission } = require("./permission-definitions");
    return hasPermission(role, resource, action);
  }

  /**
   * Check if user can access specific resource based on scope
   */
  static async checkScopeAccess(
    auth: AuthContext,
    resource: Resource,
    resourceId?: string
  ): Promise<boolean> {
    // If no specific resource requested, just check general permission
    if (!resourceId) return true;

    // Check if user has custom permission override
    const overrides = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, auth.user.id));

    if (overrides.some((o) => o.permissions?.includes(`${resource}:${resourceId}`))) {
      return true;
    }

    // Scope-based checks
    switch (auth.user.role) {
      case "school-admin":
        // Can access resources in their school
        const resourceSchool = await this.getResourceSchoolId(resource, resourceId);
        return resourceSchool === auth.user.schoolId;

      case "teacher":
        // Can access resources in their classes
        return await this.checkTeacherAccess(auth.user.id, resource, resourceId);

      case "parent":
      case "student":
        // Can only access own resources
        return resourceId === auth.user.id;

      default:
        return false;
    }
  }

  /**
   * Check if teacher can access a resource
   */
  static async checkTeacherAccess(
    teacherId: string,
    resource: Resource,
    resourceId: string
  ): Promise<boolean> {
    const { db } = await import("@/lib/db");
    const { teacherAssignments, classes } = await import("@/lib/db/schema");

    // Get teacher's classes
    const assignments = await db
      .select({ classId: teacherAssignments.classId })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacherId));

    const teacherClassIds = new Set(assignments.map((a) => a.classId));

    // Check if resource belongs to teacher's classes
    switch (resource) {
      case "students":
        const student = await db
          .select({ classId: classes.id })
          .from(classes)
          .innerJoin(require("../../../lib/db/schema").users, eq(classes.id, require("../../../lib/db/schema").users.classId))
          .where(eq(require("../../../lib/db/schema").users.id, resourceId))
          .limit(1);

        return student.length > 0 && teacherClassIds.has(student[0].classId);

      case "attendance":
      case "homework":
        // Check class association
        const classItem = await db
          .select()
          .from(classes)
          .where(eq(classes.id, resourceId))
          .limit(1);

        return classItem.length > 0 && teacherClassIds.has(classItem[0].id);

      default:
        return false;
    }
  }

  /**
   * Get school ID for a resource
   */
  static async getResourceSchoolId(resource: Resource, resourceId: string): Promise<string | null> {
    const { db } = await import("@/lib/db");

    switch (resource) {
      case "students":
      case "teachers":
        const user = await db
          .select({ schoolId: require("../../../lib/db/schema").users.schoolId })
          .from(require("../../../lib/db/schema").users)
          .where(eq(require("../../../lib/db/schema").users.id, resourceId))
          .limit(1);
        return user[0]?.schoolId || null;

      case "classes":
        const cls = await db
          .select({ schoolId: require("../../../lib/db/schema").classes.schoolId })
          .from(require("../../../lib/db/schema").classes)
          .where(eq(require("../../../lib/db/schema").classes.id, resourceId))
          .limit(1);
        return cls[0]?.schoolId || null;

      default:
        return null;
    }
  }

  /**
   * Grant custom permission to user
   */
  static async grantPermission(userId: string, permission: string): Promise<void> {
    const existing = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    if (existing.length === 0) {
      await db.insert(userPermissions).values({
        userId,
        permissions: [permission],
      });
    } else {
      const permissions = existing[0].permissions || [];
      if (!permissions.includes(permission)) {
        await db
          .update(userPermissions)
          .set({ permissions: [...permissions, permission] })
          .where(eq(userPermissions.userId, userId));
      }
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(userId: string, permission: string): Promise<void> {
    const existing = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    if (existing.length > 0) {
      const permissions = (existing[0].permissions || []).filter((p) => p !== permission);
      await db
        .update(userPermissions)
        .set({ permissions })
        .where(eq(userPermissions.userId, userId));
    }
  }
}
```

### 10.3 Permission Hook

**File:** `src/lib/permissions/use-permissions.ts`

```typescript
"use client";

import { useMemo } from "react";
import type { Role, Resource, PermissionAction } from "./permission-definitions";
import { getRolePermissions } from "./permission-definitions";

interface UsePermissionsOptions {
  role?: Role;
  userId?: string;
  schoolId?: string;
  classId?: string;
}

export function usePermissions({ role, userId, schoolId, classId }: UsePermissionsOptions) {
  const permissions = useMemo(() => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  const can = useCallback(
    (resource: Resource, action: PermissionAction, scope?: string): boolean => {
      if (!role) return false;

      // Check role-based permissions
      const hasPermission = permissions.some(
        (p) =>
          p.resource === resource &&
          (p.action === action || p.action === "manage") &&
          (!scope || p.scope === "all" || p.scope === scope)
      );

      return hasPermission;
    },
    [role, permissions]
  );

  const canCreate = useCallback((resource: Resource) => can(resource, "create"), [can]);
  const canRead = useCallback((resource: Resource) => can(resource, "read"), [can]);
  const canUpdate = useCallback((resource: Resource) => can(resource, "update"), [can]);
  const canDelete = useCallback((resource: Resource) => can(resource, "delete"), [can]);
  const canManage = useCallback((resource: Resource) => can(resource, "manage"), [can]);

  return {
    permissions,
    can,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    role,
    userId,
    schoolId,
    classId,
  };
}
```

### 10.4 Permission Guard Component

**File:** `src/components/permissions/permission-guard.tsx`

```typescript
"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/permissions/use-permissions";
import type { Resource, PermissionAction } from "@/lib/permissions/permission-definitions";

interface PermissionGuardProps {
  resource: Resource;
  action: PermissionAction;
  scope?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  scope,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can } = usePermissions({});

  const hasPermission = can(resource, action, scope);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components
export function CanCreate({ resource, fallback, children }: Omit<PermissionGuardProps, "action">) {
  return (
    <PermissionGuard resource={resource} action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanEdit({ resource, fallback, children }: Omit<PermissionGuardProps, "action">) {
  return (
    <PermissionGuard resource={resource} action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({ resource, fallback, children }: Omit<PermissionGuardProps, "action">) {
  return (
    <PermissionGuard resource={resource} action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
```

### 10.5 API Permission Middleware

**File:** `src/lib/api/permission-middleware.ts`

```typescript
import type { Context } from "hono";
import { PermissionService, type AuthContext } from "@/lib/permissions/permission-service";
import type { Resource, PermissionAction } from "@/lib/permissions/permission-definitions";

export function withPermission(
  resource: Resource,
  action: PermissionAction
) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = c.get("auth") as AuthContext;

    if (!auth?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get resource ID from params if applicable
    const resourceId = c.req.param("id");

    const hasPermission = await PermissionService.check(
      auth,
      resource,
      action,
      resourceId
    );

    if (!hasPermission) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
```

### 10.6 Permission Management UI

**File:** `src/app/platform-admin/permissions/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Role, Resource, PermissionAction } from "@/lib/permissions/permission-definitions";

export function PermissionManager() {
  const [selectedRole, setSelectedRole] = useState<Role>("teacher");
  const [selectedResource, setSelectedResource] = useState<Resource>("students");

  const permissions = [
    { action: "create" as PermissionAction, label: "Create" },
    { action: "read" as PermissionAction, label: "View" },
    { action: "update" as PermissionAction, label: "Edit" },
    { action: "delete" as PermissionAction, label: "Delete" },
  ];

  const scopes = [
    { value: "all", label: "All" },
    { value: "school", label: "School Only" },
    { value: "class", label: "Class Only" },
    { value: "own", label: "Own Only" },
  ];

  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, boolean>>({});

  const togglePermission = (action: PermissionAction, scope: string) => {
    const key = `${action}:${scope}`;
    setPermissionMatrix((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                {["admin", "platform-admin", "school-admin", "teacher", "counselor", "parent", "student"].map((role) => (
                  <option key={role} value={role}>
                    {role.replace("-", " ").toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Resource</label>
              <Select value={selectedResource} onValueChange={(v) => setSelectedResource(v as Resource)}>
                {["students", "teachers", "classes", "subjects", "assessments", "attendance", "reports"].map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                  {scopes.map((scope) => (
                    <th key={scope.value} className="px-4 py-2 text-center text-sm font-medium">
                      {scope.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.action} className="border-t">
                    <td className="px-4 py-2 text-sm font-medium">{perm.label}</td>
                    {scopes.map((scope) => (
                      <td key={`${perm.action}-${scope.value}`} className="px-4 py-2 text-center">
                        <Checkbox
                          checked={permissionMatrix[`${perm.action}:${scope.value}`] || false}
                          onCheckedChange={() => togglePermission(perm.action, scope.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 11: Unified Error Handler

**Priority:** MEDIUM
**Estimated Effort:** 20-25 hours
**Dependencies:** None
**Files to Create:** 3

### 11.1 Error Classification

**File:** `src/lib/errors/error-types.ts`

```typescript
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AppError extends Error {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  userMessage: string;
  details?: Record<string, any>;
  retryable?: boolean;
  originalError?: unknown;
}

export class ValidationError extends Error implements AppError {
  code = "VALIDATION_ERROR";
  category = ErrorCategory.VALIDATION;
  severity = ErrorSeverity.LOW;
  statusCode = 400;
  userMessage = "Please check your input and try again.";

  constructor(public details: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error implements AppError {
  code = "AUTHENTICATION_ERROR";
  category = ErrorCategory.AUTHENTICATION;
  severity = ErrorSeverity.MEDIUM;
  statusCode = 401;
  userMessage = "Please sign in to continue.";
  retryable = true;

  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error implements AppError {
  code = "AUTHORIZATION_ERROR";
  category = ErrorCategory.AUTHORIZATION;
  severity = ErrorSeverity.MEDIUM;
  statusCode = 403;
  userMessage = "You don't have permission to perform this action.";

  constructor(resource?: string, action?: string) {
    super(
      action && resource
        ? `Not authorized to ${action} ${resource}`
        : "Authorization failed"
    );
    this.name = "AuthorizationError";
    this.details = { resource, action };
  }
}

export class NotFoundError extends Error implements AppError {
  code = "NOT_FOUND";
  category = ErrorCategory.NOT_FOUND;
  severity = ErrorSeverity.LOW;
  statusCode = 404;
  userMessage = "The requested resource was not found.";

  constructor(resource: string = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
    this.details = { resource };
  }
}

export class ConflictError extends Error implements AppError {
  code = "CONFLICT_ERROR";
  category = ErrorCategory.CONFLICT;
  severity = ErrorSeverity.LOW;
  statusCode = 409;
  userMessage = "This action conflicts with existing data.";

  constructor(message: string, public details?: Record<string, any>) {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error implements AppError {
  code = "RATE_LIMIT_EXCEEDED";
  category = ErrorCategory.RATE_LIMIT;
  severity = ErrorSeverity.MEDIUM;
  statusCode = 429;
  userMessage = "Too many requests. Please try again later.";
  retryable = true;

  constructor(public retryAfter?: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.details = { retryAfter };
  }
}

export class DatabaseError extends Error implements AppError {
  code = "DATABASE_ERROR";
  category = ErrorCategory.DATABASE;
  severity = ErrorSeverity.HIGH;
  statusCode = 500;
  userMessage = "A database error occurred. Please try again.";
  retryable = true;

  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends Error implements AppError {
  code = "EXTERNAL_SERVICE_ERROR";
  category = ErrorCategory.EXTERNAL;
  severity = ErrorSeverity.HIGH;
  statusCode = 502;
  userMessage = "An external service is unavailable. Please try again later.";
  retryable = true;

  constructor(service: string, public originalError?: unknown) {
    super(`External service ${service} error`);
    this.name = "ExternalServiceError";
    this.details = { service };
  }
}
```

### 11.2 Error Handler

**File:** `src/lib/errors/error-handler.ts`

```typescript
import { type AppError, ErrorCategory, ErrorSeverity } from "./error-types";
import { logger } from "@/lib/monitoring/logger";

interface ErrorLogContext {
  userId?: string;
  schoolId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

export class ErrorHandler {
  /**
   * Handle an error - log it and return appropriate response
   */
  static handle(error: unknown, context?: ErrorLogContext): AppError {
    const appError = this.toAppError(error);
    this.log(appError, context);
    return appError;
  }

  /**
   * Convert any error to AppError
   */
  static toAppError(error: unknown): AppError {
    // Already an AppError
    if (this.isAppError(error)) {
      return error;
    }

    // Drizzle errors
    if (this.isDrizzleError(error)) {
      return this.handleDrizzleError(error);
    }

    // Zod validation errors
    if (this.isZodError(error)) {
      return this.handleZodError(error);
    }

    // Generic Error
    if (error instanceof Error) {
      return {
        code: "INTERNAL_ERROR",
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.HIGH,
        statusCode: 500,
        userMessage: "An unexpected error occurred. Please try again.",
        name: "InternalError",
        message: error.message,
        originalError: error,
      };
    }

    // Unknown error type
    return {
      code: "UNKNOWN_ERROR",
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.HIGH,
      statusCode: 500,
      userMessage: "An unexpected error occurred.",
      name: "UnknownError",
      message: String(error),
      originalError: error,
    };
  }

  /**
   * Check if error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "category" in error &&
      "statusCode" in error
    );
  }

  /**
   * Check if error is from Drizzle
   */
  static isDrizzleError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as { code?: string };
    return e.code?.startsWith("PGRST") || e.code?.startsWith("Postgres");
  }

  /**
   * Handle Drizzle-specific errors
   */
  static handleDrizzleError(error: unknown): AppError {
    const { ValidationError, ConflictError, DatabaseError } = require("./error-types");

    const err = error as { code?: string; constraint?: string; detail?: string };

    // Unique constraint violation
    if (err.code === "23505" || err.code === "PGRST116") {
      return new ConflictError(
        "A record with these values already exists.",
        { constraint: err.constraint }
      );
    }

    // Foreign key violation
    if (err.code === "23503" || err.code === "PGRST117") {
      return new ValidationError({
        _form: ["Referenced record does not exist."],
      });
    }

    // Not null violation
    if (err.code === "23502") {
      return new ValidationError({
        _form: ["Required field is missing."],
      });
    }

    return new DatabaseError(
      err.detail || "A database error occurred.",
      error
    );
  }

  /**
   * Check if error is from Zod
   */
  static isZodError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const e = error as { name?: string; errors?: unknown[] };
    return e.name === "ZodError" || Array.isArray(e.errors);
  }

  /**
   * Handle Zod validation errors
   */
  static handleZodError(error: unknown): AppError {
    const { ValidationError } = require("./error-types");

    const err = error as { errors: Array<{ path: string[]; message: string }> };

    const details: Record<string, string[]> = {};

    for (const issue of err.errors) {
      const field = issue.path.join(".") || "_form";
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(issue.message);
    }

    return new ValidationError(details);
  }

  /**
   * Log error based on severity
   */
  static log(error: AppError, context?: ErrorLogContext): void {
    const logData = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      message: error.message,
      details: error.details,
      context,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(error.message, logData);
        // Also send to alerting service
        this.alert(error, context);
        break;

      case ErrorSeverity.MEDIUM:
        logger.warn(error.message, logData);
        break;

      case ErrorSeverity.LOW:
        logger.info(error.message, logData);
        break;
    }
  }

  /**
   * Send alert for critical errors
   */
  static alert(error: AppError, context?: ErrorLogContext): void {
    // Integrate with alerting service (Sentry, PagerDuty, etc.)
    if (typeof window !== "undefined") {
      // Client-side: could send to monitoring endpoint
      fetch("/api/errors", {
        method: "POST",
        body: JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
            stack: (error as Error).stack,
          },
          context,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't error in error handler
      });
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    return error.userMessage;
  }

  /**
   * Format error for API response
   */
  static toResponse(error: AppError): Response {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.userMessage,
          details: process.env.NODE_ENV === "development" ? error.details : undefined,
        },
      },
      { status: error.statusCode }
    );
  }
}
```

### 11.3 Error Boundary Component

**File:** `src/components/errors/error-boundary.tsx`

```typescript
"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking
    if (typeof window !== "undefined") {
      fetch("/api/errors/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          path: window.location.pathname,
        }),
      }).catch(() => {});
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                An unexpected error occurred. This has been logged and our team will look into it.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm font-medium cursor-pointer">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => (window.location.href = "/")}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Appendix: Migration Tracking

### Feature Migration Status

| Feature | Status | Old Files Removed? | Components Migrated? |
|---------|--------|-------------------|---------------------|
| students | ✅ Complete | ❌ No | ✅ Yes |
| teachers | ✅ Complete | ❌ No | ⏳ Partial |
| classes | ✅ Complete | ❌ No | ❌ No |
| subjects | ✅ Complete | ❌ No | ❌ No |
| schools | ✅ Complete | ❌ No | ❌ No |
| assessments | ✅ Complete | ❌ No | ❌ No |

### Phase Completion Status

| Phase | Status | Completion % |
|-------|--------|--------------|
| Phase 1: Unified System Foundation | 🟡 In Progress | 12% |
| Phase 2: Unified Validation | ❌ Not Started | 0% |
| Phase 3: Enhanced Forms | ❌ Not Started | 0% |
| Phase 4: Unified Search & Filters | ❌ Not Started | 0% |
| Phase 5: Unified Modals | ❌ Not Started | 0% |
| Phase 6: Unified Notifications | ❌ Not Started | 0% |
| Phase 7: Unified Dashboards | ❌ Not Started | 0% |
| Phase 8: Export/Import | ❌ Not Started | 0% |
| Phase 9: Unified Charts | ❌ Not Started | 0% |
| Phase 10: Unified Permissions | ❌ Not Started | 0% |
| Phase 11: Unified Error Handler | ❌ Not Started | 0% |

### Total Estimated Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1 | 40-50h | 🔥 CRITICAL |
| Phase 2 | 20-30h | 🔥 HIGH |
| Phase 3 | 25-35h | 🔥 HIGH |
| Phase 4 | 30-40h | 🔥 HIGH |
| Phase 5 | 15-20h | MEDIUM |
| Phase 6 | 25-30h | HIGH |
| Phase 7 | 30-40h | MEDIUM |
| Phase 8 | 35-45h | HIGH |
| Phase 9 | 40-50h | MEDIUM |
| Phase 10 | 40-50h | CRITICAL |
| Phase 11 | 20-25h | MEDIUM |
| **TOTAL** | **320-415 hours** | |

### Suggested Implementation Order

1. **Sprint 1 (Week 1-2):** Phases 1-2
   - Complete core unified system
   - Add validation layer
   - Migrate 5-10 core features

2. **Sprint 2 (Week 3-4):** Phases 3-4
   - Enhanced forms with smart fields
   - Unified search and filters

3. **Sprint 3 (Week 5-6):** Phases 5-6
   - Unified modals
   - Notification system

4. **Sprint 4 (Week 7-8):** Phases 7-8
   - Dashboard widgets
   - Export/import functionality

5. **Sprint 5 (Week 9-10):** Phases 9-10
   - Charts and visualizations
   - Complete permissions system

6. **Sprint 6 (Week 11-12):** Phase 11 + Polish
   - Error handling
   - Testing and documentation

---

**End of Roadmap**
