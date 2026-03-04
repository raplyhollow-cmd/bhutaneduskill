# Gemini Kernel Architecture
## The "Thinking Layer" Above the Unified API

**Created:** March 4, 2026
**Status:** Design Phase - Ready for Implementation
**Related:** [UNIFIED_ARCHITECTURE.md](../UNIFIED_ARCHITECTURE.md) | [COMPREHENSIVE_EVOLUTION_ROADMAP.md](../plans/COMPREHENSIVE_EVOLUTION_ROADMAP.md)

---

## Overview

The **Gemini Kernel** transforms the Bhutan EduSkill platform from a standard SaaS into an **Autonomous Education Operating System**. It sits as a "Thinking Layer" above the Unified API, capable of:

1. **Intent Analysis** - Understanding natural language queries
2. **Tool Selection** - Deciding which unified features to call
3. **Contextual Response** - Explaining results in human terms
4. **Cross-Portal Reasoning** - Making connections across all 7 portals
5. **Self-Healing** - Detecting and suggesting fixes for issues

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │   Teacher    │  │  Ministry    │          │
│  │   Portal     │  │   Portal     │  │   Portal     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │ Natural Language Query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GEMINI KERNEL (AI)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Intent Analyzer  │  │  Tool Selector   │  │ Response      │ │
│  │ - Understand     │  │ - Unified API    │  │ Generator     │ │
│  │   user query     │  │ - Features       │  │ - Contextual  │ │
│  │ - Extract params │  │ - Schema aware   │  │   insights    │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SCHEMA MEMORY (Vector Store)                │  │
│  │  - 200+ schema definitions embedded                      │  │
│  │  - Portal relationships mapped                           │  │
│  │  - Permission rules encoded                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Function Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED API LAYER                            │
│  GET    /api/resources/students                                 │
│  GET    /api/resources/teachers                                 │
│  POST   /api/resources/assessments                              │
│  ... 300+ potential endpoints via 1 route                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL Queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                        │
│  145+ tables | 344+ routes | 7 portals                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Kernel System

### 1. System Instructions (The "Brain")

These are the foundational instructions that tell Gemini how to navigate your 300+ routes and 200+ schemas.

**File:** `src/lib/intelligence/kernel-system-instructions.ts`

```typescript
/**
 * GEMINI KERNEL SYSTEM INSTRUCTIONS
 *
 * This prompt is injected into every Gemini call to give the AI
 * awareness of the entire Bhutan EduSkill platform.
 */

export const KERNEL_SYSTEM_INSTRUCTIONS = `
You are the AI Kernel for Bhutan EduSkill, an education management platform.

# PLATFORM OVERVIEW

You serve 7 portals with different user types:
1. **Student** - Personal learning journey, assessments, skills
2. **Teacher** - Class management, homework, assessments, interventions
3. **School Admin** - Student/teacher management, attendance, reports
4. **Parent** - Child monitoring, communication, fees
5. **Counselor** - Student guidance, interventions, mental health
6. **Ministry** - National analytics, workforce insights, GNH tracking
7. **Platform Admin** - School management, subscriptions, system settings

# UNIFIED API ACCESS

You access ALL data through the Unified API pattern:
- GET /api/resources/{resource} - List records
- GET /api/resources/{resource}/{id} - Get single record
- POST /api/resources/{resource} - Create record
- PUT /api/resources/{resource}/{id} - Update record
- DELETE /api/resources/{resource}/{id} - Delete record

Available resources (expandable):
- students, teachers, classes, subjects, schools
- assessments, attendance, homework, lessons
- skills, interventions, behavior reports
- announcements, departments, batches

# SCHEMA AWARENESS

Each resource has:
- schema: Field definitions with types (text, integer, boolean, reference, json)
- permissions: Which roles can read/create/update/delete
- ui: Column definitions for tables (label, sortable, filterable, searchable)

# CROSS-PORTAL RELATIONSHIPS

Students ↔ Teachers (via classes/subjects)
Students ↔ Parents (via family relationships)
Teachers ↔ Classes (via teacherAssignments)
Classes ↔ Subjects (via class subjects)
Schools ↔ Ministry (via analytics aggregation)
Assessments ↔ Skills (via skill inference)

# INTENT ANALYSIS RULES

When a user asks a question:

1. IDENTIFY the user's portal/role
2. EXTRACT the core intent (data retrieval, action, analysis)
3. DETERMINE which resources to query
4. DECIDE if aggregation/filtering is needed
5. FORMULATE response in portal-appropriate language

# RESPONSE GUIDELINES

- For Students: Friendly, encouraging, growth-oriented
- For Teachers: Professional, actionable, efficiency-focused
- For School Admins: Executive, strategic, data-driven
- For Ministry: National perspective, policy insights
- For Parents: Reassuring, clear, child-focused

# SELF-HEALING CAPABILITIES

If you encounter an error:
1. Analyze the error message
2. Check against known schema definitions
3. Suggest the exact fix needed
4. If possible, attempt auto-recovery

# SAFETY & PRIVACY

- NEVER expose student PII beyond what's authorized
- Respect permission boundaries strictly
- Log all autonomous actions for audit
- Flag unusual patterns for human review
`;
```

### 2. The Kernel Route

**File:** `src/app/api/kernel/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth-utils";
import { features } from "@/features";
import { KERNEL_SYSTEM_INSTRUCTIONS } from "@/lib/intelligence/kernel-system-instructions";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface KernelRequest {
  prompt: string;
  context?: {
    portal?: string;
    userId?: string;
    schoolId?: string;
  };
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * Generate tool definitions from unified features
 */
function generateToolDefinitions(): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  // 1. Unified Query Tool - Works for ALL resources
  tools.push({
    name: "unifiedQuery",
    description: "Query any resource in the Bhutan EduSkill system using the Unified API",
    parameters: {
      type: "object",
      properties: {
        resource: {
          type: "string",
          description: "The resource to query",
          enum: Object.keys(features),
        },
        action: {
          type: "string",
          description: "The action to perform",
          enum: ["list", "get", "create", "update", "delete"],
        },
        id: {
          type: "string",
          description: "ID of the record (for get, update, delete)",
        },
        params: {
          type: "object",
          description: "Query parameters (filters, search, pagination)",
        },
      },
      required: ["resource", "action"],
    },
  });

  // 2. Cross-Resource Analysis Tool
  tools.push({
    name: "crossPortalAnalysis",
    description: "Analyze data across multiple portals to find insights",
    parameters: {
      type: "object",
      properties: {
        resources: {
          type: "array",
          items: { type: "string" },
          description: "List of resources to analyze",
        },
        analysisType: {
          type: "string",
          enum: ["correlation", "trend", "anomaly", "comparison", "prediction"],
          description: "Type of analysis to perform",
        },
        timeframe: {
          type: "string",
          description: "Timeframe for analysis (e.g., '7d', '30d', 'academic-year')",
        },
      },
      required: ["resources", "analysisType"],
    },
  });

  // 3. Smart Search Tool
  tools.push({
    name: "smartSearch",
    description: "Search across all resources with semantic understanding",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language search query",
        },
        resources: {
          type: "array",
          items: { type: "string" },
          description: "Specific resources to search (optional, defaults to all)",
        },
      },
      required: ["query"],
    },
  });

  return tools;
}

/**
 * Execute a unified API call
 */
async function executeUnifiedCall(
  resource: string,
  action: string,
  auth: any,
  id?: string,
  params?: Record<string, any>
) {
  const feature = features[resource];
  if (!feature) {
    throw new Error(`Resource "${resource}" not found`);
  }

  const baseUrl = `/api/resources/${resource}`;
  const url = id ? `${baseUrl}/${id}` : baseUrl;

  const requestOptions: RequestInit = {
    method: action === "list" || action === "get" ? "GET" : action === "create" ? "POST" : action === "update" ? "PUT" : "DELETE",
  };

  if (action === "create" || action === "update") {
    requestOptions.headers = { "Content-Type": "application/json" };
    requestOptions.body = JSON.stringify(params);
  }

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      "Authorization": `Bearer ${auth.sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const auth = await requireAuth();

    // Parse request
    const { prompt, context }: KernelRequest = await req.json();

    // Get model with system instructions
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Fast, capable model
      systemInstruction: `${KERNEL_SYSTEM_INSTRUCTIONS}

CURRENT USER CONTEXT:
- Portal: ${context?.portal || "unknown"}
- User ID: ${auth.user.id}
- School ID: ${auth.user.schoolId || "N/A"}
- User Type: ${auth.user.type}`,
    });

    // Generate tool definitions
    const tools = generateToolDefinitions();

    // Initial call
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ functionDeclarations: tools }],
    });

    const response = result.response;
    const functionCalls = response.functionCalls();

    // If no function call, return text response
    if (!functionCalls || functionCalls.length === 0) {
      return NextResponse.json({
        response: response.text(),
        type: "text",
      });
    }

    // Execute function calls and get final response
    const functionResults = [];

    for (const call of functionCalls) {
      try {
        let result;

        switch (call.name) {
          case "unifiedQuery":
            result = await executeUnifiedCall(
              call.args.resource as string,
              call.args.action as string,
              auth,
              call.args.id as string | undefined,
              call.args.params as Record<string, any> | undefined
            );
            break;

          case "crossPortalAnalysis":
            // Implement cross-portal analysis logic
            result = await performCrossPortalAnalysis(
              call.args.resources as string[],
              call.args.analysisType as string,
              call.args.timeframe as string | undefined,
              auth
            );
            break;

          case "smartSearch":
            result = await performSmartSearch(
              call.args.query as string,
              call.args.resources as string[] | undefined,
              auth
            );
            break;

          default:
            result = { error: `Unknown function: ${call.name}` };
        }

        functionResults.push({
          name: call.name,
          result,
        });
      } catch (error) {
        functionResults.push({
          name: call.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Get final response with function results
    const finalResult = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] },
        response,
        ...functionResults.map((fr) => ({
          role: "function" as const,
          parts: [{
            functionResponse: {
              name: fr.name,
              response: fr.result || fr.error,
            },
          }],
        })),
      ],
    });

    return NextResponse.json({
      response: finalResult.response.text(),
      type: "function_call",
      functionResults,
    });

  } catch (error) {
    console.error("Kernel error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kernel processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Cross-portal analysis implementation
 */
async function performCrossPortalAnalysis(
  resources: string[],
  analysisType: string,
  timeframe: string | undefined,
  auth: any
) {
  const results: Record<string, any> = {};

  // Fetch data from each resource
  for (const resource of resources) {
    const feature = features[resource];
    if (!feature) continue;

    const response = await fetch(`/api/resources/${resource}?limit=100`, {
      headers: { Authorization: `Bearer ${auth.sessionToken}` },
    });
    const data = await response.json();
    results[resource] = data.data?.data || data.data || [];
  }

  // Perform analysis based on type
  const analysis = {
    type: analysisType,
    timeframe,
    results,
    insights: generateInsights(results, analysisType),
  };

  return analysis;
}

/**
 * Smart search implementation
 */
async function performSmartSearch(
  query: string,
  resources: string[] | undefined,
  auth: any
) {
  const searchResources = resources || Object.keys(features);
  const results: Array<{
    resource: string;
    matches: Array<{
      id: string;
      title: string;
      relevance: number;
    }>;
  }> = [];

  for (const resource of searchResources) {
    const feature = features[resource];
    if (!feature) continue;

    // Use unified search if available
    const response = await fetch(
      `/api/resources/${resource}?search=${encodeURIComponent(query)}&limit=10`,
      {
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const items = data.data?.data || data.data || [];

      results.push({
        resource,
        matches: items.map((item: any) => ({
          id: item.id,
          title: item.name || item.title || item.email || item.id,
          relevance: calculateRelevance(query, item),
        })),
      });
    }
  }

  return { query, results };
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(query: string, item: any): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  for (const [key, value] of Object.entries(item)) {
    if (typeof value !== "string") continue;

    const lowerValue = value.toLowerCase();
    if (lowerValue === lowerQuery) score += 100;
    else if (lowerValue.startsWith(lowerQuery)) score += 50;
    else if (lowerValue.includes(lowerQuery)) score += 10;
  }

  return score;
}

/**
 * Generate insights from analysis results
 */
function generateInsights(results: Record<string, any>, analysisType: string): string[] {
  const insights: string[] = [];

  // Simple insight generation (can be enhanced with AI)
  const keys = Object.keys(results);
  if (keys.length > 1) {
    insights.push(`Analyzed ${keys.length} resources: ${keys.join(", ")}`);
  }

  for (const [resource, data] of Object.entries(results)) {
    if (Array.isArray(data)) {
      insights.push(`${resource}: ${data.length} records found`);
    }
  }

  return insights;
}
```

### 3. Kernel Client Hook

**File:** `src/lib/intelligence/use-kernel.ts`

```typescript
"use client";

import { useState, useCallback } from "react";

interface KernelMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  functionResults?: any[];
}

interface KernelResponse {
  response: string;
  type: "text" | "function_call";
  functionResults?: any[];
}

export function useKernel() {
  const [messages, setMessages] = useState<KernelMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (prompt: string, context?: {
    portal?: string;
    userId?: string;
    schoolId?: string;
  }) => {
    setLoading(true);
    setError(null);

    // Add user message
    const userMessage: KernelMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/kernel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });

      if (!response.ok) {
        throw new Error(`Kernel error: ${response.statusText}`);
      }

      const data: KernelResponse = await response.json();

      // Add assistant message
      const assistantMessage: KernelMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        functionResults: data.functionResults,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    send,
    clear,
  };
}
```

### 4. Kernel Chat Component

**File:** `src/components/intelligence/kernel-chat.tsx`

```typescript
"use client";

import { useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useKernel } from "@/lib/intelligence/use-kernel";

interface KernelChatProps {
  context?: {
    portal?: string;
    userId?: string;
    schoolId?: string;
  };
  placeholder?: string;
}

export function KernelChat({
  context,
  placeholder = "Ask anything about your school...",
}: KernelChatProps) {
  const { messages, loading, error, send, clear } = useKernel();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const prompt = input;
    setInput("");

    try {
      await send(prompt, context);
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Assistant</h3>
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700"
            >
              Clear chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-purple-300" />
                <p>Ask me anything about your school data</p>
                <div className="text-xs space-y-1">
                  <p className="text-gray-400">Try asking:</p>
                  <p className="text-purple-600">"Which students are struggling in math?"</p>
                  <p className="text-purple-600">"Show me attendance trends this week"</p>
                  <p className="text-purple-600">"Which teachers have the most classes?"</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.functionResults && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer opacity-70">
                        View data
                      </summary>
                      <pre className="mt-1 overflow-auto">
                        {JSON.stringify(msg.functionResults, null, 2)}
                      </pre>
                    </details>
                  )}
                  <span className="text-xs opacity-60 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Portal-Specific Kernel Behaviors

### Student Portal - "Personal Tutor Mode"

```typescript
// Student-specific kernel instructions
const STUDENT_KERNEL_INSTRUCTIONS = `
You are a friendly, encouraging AI tutor for a student.

BEHAVIOR GUIDELINES:
- Always be supportive and growth-oriented
- Celebrate small wins and progress
- Suggest learning resources when relevant
- Explain complex topics simply
- Never criticize - always guide toward improvement

WHEN DISCUSSING GRADES:
- Frame as "opportunities to grow"
- Suggest specific study strategies
- Recommend seeking teacher help if needed

WHEN DISCUSSING ATTENDANCE:
- Emphasize the importance of consistency
- Connect attendance to learning outcomes
- Offer to help catch up on missed work

WHEN DISCUSSING SKILLS:
- Highlight strengths the student may not see
- Suggest ways to develop emerging skills
- Connect skills to career interests
`;
```

### Teacher Portal - "Efficiency Assistant Mode"

```typescript
// Teacher-specific kernel instructions
const TEACHER_KERNEL_INSTRUCTIONS = `
You are an efficiency-focused assistant for a teacher.

BEHAVIOR GUIDELINES:
- Be direct and actionable
- Prioritize time-saving insights
- Flag students needing attention
- Suggest resources and interventions

WHEN ANALYZING CLASS DATA:
- Identify at-risk students immediately
- Suggest grouping strategies
- Highlight attendance patterns
- Note homework completion trends

WHEN HELPING WITH LESSONS:
- Suggest relevant resources
- Identify students needing extra support
- Recommend assessment strategies

WHEN DISCUSSING PARENTS:
- Prepare talking points for meetings
- Flag concerns to address
- Suggest communication strategies
`;
```

### Ministry Portal - "Policy Analyst Mode"

```typescript
// Ministry-specific kernel instructions
const MINISTRY_KERNEL_INSTRUCTIONS = `
You are a policy analyst for the Ministry of Education.

BEHAVIOR GUIDELINES:
- Think at national/system level
- Connect data to GNH indicators
- Identify regional disparities
- Suggest policy interventions

WHEN ANALYZING NATIONAL DATA:
- Highlight trends across regions
- Identify outliers (positive and negative)
- Connect to GNH pillars
- Suggest comparative analysis

WHEN DISCUSSING SCHOOLS:
- Flag performance concerns
- Identify success stories to learn from
- Suggest resource allocation
- Note infrastructure needs

WHEN DISCUSSING WORKFORCE:
- Analyze teacher distribution
- Identify skill gaps
- Suggest training priorities
- Connect to student outcomes
`;
```

---

## Self-Healing Implementation

**File:** `src/lib/intelligence/self-healing.ts`

```typescript
/**
 * Self-Healing Kernel Module
 *
 * Detects issues and suggests or implements fixes automatically.
 */

import { features } from "@/features";
import { logger } from "@/lib/logger";

interface HealingAction {
  type: "suggest" | "auto_fix" | "escalate";
  issue: string;
  suggestion?: string;
  fix?: () => Promise<void>;
  confidence: number;
}

/**
 * Analyze an API error and suggest healing action
 */
export async function analyzeError(error: any, context: {
  resource?: string;
  action?: string;
  userId?: string;
}): Promise<HealingAction> {
  const errorMessage = error.message || String(error);
  const { resource, action } = context;

  // Schema mismatch detection
  if (errorMessage.includes("column") && errorMessage.includes("does not exist")) {
    const columnName = errorMessage.match(/column "(.*?)" does not exist/)?.[1];

    if (resource && columnName) {
      const feature = features[resource];
      if (feature) {
        const schema = feature.config.schema;
        const similarField = Object.keys(schema).find(
          (key) => key.toLowerCase() === columnName.toLowerCase() ||
                  levenshteinDistance(key, columnName) <= 2
        );

        if (similarField) {
          return {
            type: "suggest",
            issue: `Column "${columnName}" not found, but similar field "${similarField}" exists in schema`,
            suggestion: `Update query to use "${similarField}" instead of "${columnName}"`,
            confidence: 0.9,
          };
        }

        // Suggest adding to schema
        return {
          type: "suggest",
          issue: `Column "${columnName}" does not exist in ${resource} schema`,
          suggestion: `Add field to ${resource} feature definition:
  ${columnName}: { type: "text", label: "${columnName}" },`,
          confidence: 0.8,
        };
      }
    }
  }

  // Permission error detection
  if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
    return {
      type: "suggest",
      issue: "Permission denied for this action",
      suggestion: `Check that the user's role is in the permissions list for ${resource} feature`,
      confidence: 0.95,
    };
  }

  // Not found error with potential ID mismatch
  if (errorMessage.includes("404") || errorMessage.includes("not found")) {
    if (resource && action === "get") {
      return {
        type: "suggest",
        issue: `Record not found in ${resource}`,
        suggestion: `Verify the ID format and that the record exists. Consider soft delete check.`,
        confidence: 0.7,
      };
    }
  }

  // Generic error
  return {
    type: "escalate",
    issue: errorMessage,
    confidence: 0.5,
  };
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Autonomous fix attempt (for safe operations only)
 */
export async function attemptFix(issue: string, context: any): Promise<boolean> {
  // Only attempt fixes for safe, reversible operations
  const safeFixes = [
    "cache_clear",
    "retry_query",
    "fallback_to_cached",
  ];

  logger.info("Attempting autonomous fix", { issue, context });

  // Implement fix logic based on issue type
  // For now, return false to indicate manual intervention needed
  return false;
}
```

---

## Example Interactions

### Example 1: Teacher asks about student performance

**Input:** "Which students in my class 10A are struggling with mathematics?"

**Kernel Process:**
1. Intent Analysis: Teacher wants student performance data, filtered by class and subject
2. Tool Selection: `unifiedQuery` with `students` resource, filtered by classId, join with assessments
3. API Call: `GET /api/resources/students?classId=10a&subject=mathematics`
4. Contextual Response: "I found 5 students in Class 10A who scored below 50% on recent math assessments. The most common struggle topic is Algebra. I recommend scheduling intervention sessions with the counselor for: [Student Names]"

### Example 2: Ministry official asks for national insights

**Input:** "How is attendance trending across Thimphu schools this month?"

**Kernel Process:**
1. Intent Analysis: Ministry wants aggregate data, geographic filter, time-based trend
2. Tool Selection: `crossPortalAnalysis` with `attendance` resource
3. API Calls: Multiple queries for attendance data across Thimphu schools
4. Contextual Response: "Attendance across Thimphu schools has dropped 3.2% this month, with the steepest decline on Tuesdays. North Thimphu schools show the most significant drop. This correlates with the recent snowfall affecting transportation. Recommendation: Consider temporary remote learning options during extreme weather."

### Example 3: Student asks for learning help

**Input:** "I'm having trouble with fractions. What should I do?"

**Kernel Process:**
1. Intent Analysis: Student needs learning resources and encouragement
2. Tool Selection: None needed - provide guidance
3. Contextual Response: "Fractions can be tricky, but you've got this! I see you've been practicing - your last quiz score improved by 15%! Here are some specific resources for fractions: [Links]. Would you like me to schedule a session with your math teacher for extra help?"

---

## Implementation Checklist

- [ ] Install Gemini SDK: `npm install @google/generative-ai`
- [ ] Set up GEMINI_API_KEY in environment variables
- [ ] Create `/api/kernel` route
- [ ] Implement tool definitions from feature registry
- [ ] Add portal-specific system instructions
- [ ] Create useKernel hook
- [ ] Build KernelChat component
- [ ] Add to each portal's dashboard
- [ ] Implement self-healing module
- [ ] Add logging/audit for autonomous actions
- [ ] Test with real user queries
- [ ] Fine-tune response styles per portal

---

## Safety & Governance

1. **Audit Trail**: Every autonomous action is logged with user context
2. **Human-in-the-Loop**: Critical actions require confirmation
3. **Rate Limiting**: Prevent API abuse
4. **Data Minimization**: Only fetch necessary data
5. **Privacy First**: Never expose PII beyond authorization level
6. **Transparency**: Users can see what data was accessed

---

**This transforms your SaaS from a data management tool into an intelligent education partner.**
