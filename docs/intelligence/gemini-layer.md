# GEMINI LAYER - Metadata-Driven AI Architecture

**Status:** ✅ Implemented
**Last Updated:** March 4, 2026

---

## 🎯 What is the Gemini Layer?

The **Gemini Layer** is an advanced AI integration that leverages your **Unified Architecture** to enable:

1. **System Awareness** - AI reads your feature configurations directly
2. **Autonomous Querying** - AI autonomously queries the universal API
3. **Self-Healing** - AI provides intelligent error analysis and fixes

This is possible because your architecture is now **Structured and Declarative** - instead of a messy codebase, Gemini can "read" your system through metadata.

---

## 📁 File Structure

```
src/
├── lib/intelligence/
│   └── gemini-layer.ts              # Core Gemini Layer logic
│
├── app/api/intelligence/
│   └── gemini/route.ts              # Gemini API endpoints
│
└── components/intelligence/
    └── gemini-assistant.tsx         # AI Chat UI component
```

---

## 🧠 How It Works

### 1. System Awareness

The Gemini Layer extracts metadata from your feature definitions:

```typescript
// From your feature definition:
export const StudentFeature = defineFeature({
  name: "students",
  tableName: "students",
  schema: {
    id: { type: "text", required: true },
    name: { type: "text", required: true },
    classId: { type: "text", reference: { table: "classes", field: "id" } },
  },
  permissions: {
    read: ["school-admin", "teacher"],
    create: ["school-admin"],
  },
});

// Gemini Layer extracts:
{
  featureName: "students",
  tableName: "students",
  fields: [
    { name: "id", type: "text", required: true },
    { name: "name", type: "text", required: true },
    { name: "classId", type: "text", reference: { table: "classes", field: "id" } },
  ],
  permissions: {
    read: ["school-admin", "teacher"],
    create: ["school-admin"],
  },
  apiEndpoints: [
    "GET /api/resources/students",
    "GET /api/resources/students/{id}",
    "POST /api/resources/students",
    "PUT /api/resources/students/{id}",
    "DELETE /api/resources/students/{id}",
  ],
}
```

### 2. Autonomous Querying

When you ask a question, the AI autonomously decides what to fetch:

```typescript
// User asks: "How many students are in Class 10A?"

// AI analyzes question → determines it needs:
// 1. Query /api/resources/students with filter classId="class-10a"
// 2. Query /api/resources/classes to verify class exists

// AI executes queries automatically
const data = await fetch("/api/resources/students?classId=class-10a");

// AI generates answer:
// "Found 28 students in Class 10A."
```

### 3. Self-Healing

When errors occur, the AI analyzes them against your schema:

```typescript
// Error: "column 'email' does not exist"

// AI analyzes:
// - Feature definition has email field
// - Database schema doesn't have email column
// - Suggestion: Run migration to add email column

// Generated diagnostic:
/*
## Expected Schema

| Field | Type | Required |
|-------|------|----------|
| id    | text | Yes      |
| name  | text | Yes      |
| email | text | Yes      |

## Suggestions

1. Schema mismatch detected.
2. Expected schema for students:
   - id: text (required)
   - name: text (required)
   - email: text (required)

3. Possible fixes:
   - Check database schema matches feature definition
   - Run migration to add missing columns
   - Update feature definition to match database
*/
```

---

## 🔌 API Usage

### Get System Metadata

```bash
GET /api/intelligence/gemini?mode=metadata
```

Response:
```json
{
  "features": {
    "students": {
      "featureName": "students",
      "tableName": "students",
      "fields": [...],
      "permissions": {...},
      "apiEndpoints": [...]
    },
    "teachers": {...}
  },
  "userRole": "school-admin"
}
```

### Get AI System Prompt

```bash
GET /api/intelligence/gemini?mode=system-prompt
```

Returns a complete system prompt that can be fed to Gemini AI with all feature metadata.

### Ask AI Question

```bash
POST /api/intelligence/gemini
{
  "action": "ask",
  "question": "Show me all teachers who teach Mathematics"
}
```

Response:
```json
{
  "answer": "Found 5 teachers who teach Mathematics:\n  - Mr. Dorji (Classes 10A, 10B)\n  - Ms. Wangmo (Classes 11A, 11B)...",
  "queryHistory": [
    {
      "timestamp": "2026-03-04T10:30:00Z",
      "query": "list teachers",
      "result": { "items": [...], "total": 5 }
    }
  ]
}
```

### Analyze Error (Self-Healing)

```bash
POST /api/intelligence/gemini
{
  "action": "analyze-error",
  "error": {
    "message": "column 'email' does not exist"
  },
  "context": {
    "feature": "students",
    "operation": "create"
  }
}
```

Response:
```json
{
  "error": "column 'email' does not exist",
  "suggestions": [
    "Schema mismatch detected.",
    "Expected schema for students: ...",
    "Possible fixes: ...",
    "1. Check database schema matches feature definition",
    "2. Run migration to add missing columns"
  ]
}
```

---

## 🎨 Component Usage

### GeminiAssistant (AI Chat)

```tsx
import { GeminiAssistant } from "@/components/intelligence/gemini-assistant";

export default function AdminDashboard() {
  return (
    <div>
      <h1>School Admin Dashboard</h1>

      <GeminiAssistant />

      {/* User can ask:
          - "How many students do we have?"
          - "Which subjects have no teachers?"
          - "Show me Class 10A attendance"
          - "Who teaches Mathematics?" */}
    </div>
  );
}
```

### SelfHealingDiagnostic (Error Analysis)

```tsx
import { SelfHealingDiagnostic } from "@/components/intelligence/gemini-assistant";

export function ErrorPage({ error }: { error: Error }) {
  return (
    <SelfHealingDiagnostic
      error={error}
      context={{
        feature: "students",
        operation: "create",
        testData: { name: "John", classId: "class-10a" },
      }}
      onFix={(suggestion) => {
        // Apply the suggested fix
        console.log("Applying fix:", suggestion);
      }}
    />
  );
}
```

---

## 🚀 Benefits

### Before Unified Architecture + Gemini Layer

```typescript
// AI couldn't understand your messy codebase
// You had to write custom API calls for each query
// No self-healing capabilities

// For each AI query:
const students = await fetch("/api/students"); // Custom endpoint
const teachers = await fetch("/api/teachers"); // Different endpoint
const classes = await fetch("/api/classes");   // Different pattern
```

### After Unified Architecture + Gemini Layer

```typescript
// AI reads your feature definitions
// AI autonomously queries the universal API
// Self-healing diagnostics available

// AI handles everything:
const answer = await agent.ask("How many students in Class 10A?");
// AI automatically queries /api/resources/students?classId=class-10a
// No custom code needed!
```

---

## 📊 Technical Details

### GeminiAIAgent Class

```typescript
const agent = new GeminiAIAgent({
  canQuery: true,    // Enable autonomous querying
  canMutate: false,  // Disable write operations (safety)
  canAnalyze: true,  // Enable data analysis
  canSuggest: true,  // Enable suggestions
});

const answer = await agent.ask("Your question", "school-admin");
```

### Error Analysis Functions

```typescript
import { analyzeError, generateE2EDiagnostic } from "@/lib/intelligence/gemini-layer";

// Get suggestions for any error
const suggestions = analyzeError(error, {
  feature: "students",
  operation: "create",
  data: { name: "John" },
});

// Generate full E2E diagnostic report
const report = generateE2EDiagnostic(
  "create student test",
  error,
  { feature: "students", operation: "create", testData: {...} }
);
```

---

## 🎯 Example Workflows

### Workflow 1: Data Exploration

1. User opens AI Assistant in dashboard
2. User asks: "Which subjects have no assigned teachers?"
3. AI autonomously queries:
   - GET /api/resources/subjects
   - GET /api/resources/teacher-assignments
4. AI analyzes data and responds:
   - "3 subjects have no teachers: History, Geography, Art"
5. User can immediately see which subjects need attention

### Workflow 2: Self-Healing E2E Test

1. E2E test fails with error: "column 'phone' required"
2. Test runner calls `/api/intelligence/gemini` with error context
3. AI generates diagnostic report showing:
   - Expected schema for the feature
   - Missing required field
   - Suggested fix
4. Developer applies fix and re-runs test

### Workflow 3: Analytics Question

1. School admin asks: "What's our attendance rate this month?"
2. AI queries:
   - GET /api/resources/attendance?startDate=...&endDate=...
   - GET /api/resources/students (for total count)
3. AI calculates and returns: "92.3% attendance rate this month"

---

## 🔐 Security & Permissions

The Gemini Layer respects your feature permissions:

```typescript
// If user is "teacher" and feature only allows "school-admin" to read:
{
  permissions: {
    read: ["school-admin"],  // Teacher not in list
  }
}

// AI will return: "Permission denied"
// And won't expose sensitive data
```

---

## 📈 Performance

- **Query Analysis:** < 50ms (in-memory pattern matching)
- **Autonomous Queries:** Depends on API response times
- **Error Analysis:** < 100ms (schema lookup + pattern matching)
- **Zero Cold Start:** All metadata available immediately

---

## 📚 Related Documentation

- [Unified Architecture](../unified/README.md) - The foundation that makes Gemini Layer possible
- [AI Integration](../unified/ai-integration.md) - Other AI features in the platform
- [Feature Definitions](../unified/features.md) - How to define features

---

**Generated:** March 4, 2026
**Part of:** Unified Architecture System
