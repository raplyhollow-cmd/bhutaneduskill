/**
 * GEMINI LAYER - Metadata-Driven AI Architecture
 *
 * This layer enables Gemini AI to:
 * 1. Read feature configurations directly (System Awareness)
 * 2. Autonomously query the universal API (Autonomous Querying)
 * 3. Provide self-healing suggestions (Self-Healing)
 *
 * The unified architecture makes this possible because:
 * - All features follow the same definition pattern
 * - All APIs follow /api/resources/[resource] pattern
 * - All components use the same building blocks
 */

import { features, type FeatureConfig } from "@/features";

// ============================================================================
// TYPES
// ============================================================================

export interface GeminiContext {
  features: Record<string, FeatureConfig>;
  apiPattern: string;
  componentPattern: string;
}

export interface SchemaMetadata {
  featureName: string;
  tableName: string;
  fields: FieldMetadata[];
  permissions: PermissionMetadata;
  apiEndpoints: string[];
}

export interface FieldMetadata {
  name: string;
  type: string;
  required: boolean;
  label?: string;
  reference?: {
    table: string;
    field: string;
  };
}

export interface PermissionMetadata {
  read: string[];
  create: string[];
  update: string[];
  delete: string[];
}

export interface AIAgentCapability {
  canQuery: boolean;
  canMutate: boolean;
  canAnalyze: boolean;
  canSuggest: boolean;
}

// ============================================================================
// SYSTEM AWARENESS - Feature Metadata Extraction
// ============================================================================

/**
 * Extracts metadata from a feature configuration for AI consumption
 * This converts our feature definitions into AI-readable format
 */
export function extractFeatureMetadata(featureKey: string): SchemaMetadata | null {
  const feature = features[featureKey];
  if (!feature) return null;

  const fields: FieldMetadata[] = Object.entries(feature.schema).map(([name, config]: [string, any]) => ({
    name,
    type: config.type || "text",
    required: config.required || false,
    label: config.label,
    reference: config.reference ? {
      table: config.reference.table,
      field: config.reference.field,
    } : undefined,
  }));

  return {
    featureName: feature.name,
    tableName: feature.tableName,
    fields,
    permissions: feature.permissions,
    apiEndpoints: [
      `GET /api/resources/${feature.name}`,
      `GET /api/resources/${feature.name}/{id}`,
      `POST /api/resources/${feature.name}`,
      `PUT /api/resources/${feature.name}/{id}`,
      `DELETE /api/resources/${feature.name}/{id}`,
    ],
  };
}

/**
 * Get all feature metadata for complete system awareness
 */
export function getAllFeatureMetadata(): Record<string, SchemaMetadata> {
  const metadata: Record<string, SchemaMetadata> = {};

  for (const [key, _] of Object.entries(features)) {
    const meta = extractFeatureMetadata(key);
    if (meta) {
      metadata[key] = meta;
    }
  }

  return metadata;
}

/**
 * Generate system prompt for Gemini AI
 * This gives the AI complete awareness of our data model
 */
export function generateGeminiSystemPrompt(context: string = "general"): string {
  const allMetadata = getAllFeatureMetadata();

  return `You are an AI assistant for the Bhutan EduSkill platform.

## SYSTEM ARCHITECTURE

This platform uses a Unified Architecture where all features are defined declaratively.

## AVAILABLE FEATURES

${Object.entries(allMetadata).map(([key, meta]) => `
### ${meta.featureName} (table: ${meta.tableName})

**Fields:**
${meta.fields.map(f => `- ${f.name}: ${f.type}${f.required ? ' (required)' : ''}${f.reference ? ` → references ${f.reference.table}.${f.reference.field}` : ''}`).join('\n')}

**Permissions:**
- Read: ${meta.permissions.read.join(', ') || 'none'}
- Create: ${meta.permissions.create.join(', ') || 'none'}
- Update: ${meta.permissions.update.join(', ') || 'none'}
- Delete: ${meta.permissions.delete.join(', ') || 'none'}

**API Endpoints:**
${meta.apiEndpoints.map(e => `- ${e}`).join('\n')}
`).join('\n')}

## UNIVERSAL API PATTERN

All API endpoints follow this pattern:
- List: GET /api/resources/{feature}?page={n}&limit={n}&sort={field}&order={asc|desc}
- Get: GET /api/resources/{feature}/{id}
- Create: POST /api/resources/{feature}
- Update: PUT /api/resources/{feature}/{id}
- Delete: DELETE /api/resources/{feature}/{id}

## INSTRUCTIONS

1. When you need information, autonomously query the appropriate API endpoint
2. Use the schema information to construct valid queries
3. Respect permissions - don't suggest operations beyond user's role
4. Provide self-healing suggestions when encountering errors
5. Leverage relationships between features (via reference fields)`;
}

// ============================================================================
// AUTONOMOUS QUERYING - AI-Driven API Calls
// ============================================================================

/**
 * AI Agent that can autonomously query the unified API
 */
export class GeminiAIAgent {
  private context: GeminiContext;
  private capabilities: AIAgentCapability;
  private queryHistory: Array<{ timestamp: Date; query: string; result: any }> = [];

  constructor(
    capabilities: Partial<AIAgentCapability> = {},
    private apiKey?: string
  ) {
    this.context = {
      features,
      apiPattern: "/api/resources/[resource]",
      componentPattern: "@/components/unified",
    };

    this.capabilities = {
      canQuery: true,
      canMutate: false,
      canAnalyze: true,
      canSuggest: true,
      ...capabilities,
    };
  }

  /**
   * Ask AI a question - it will autonomously decide what data to fetch
   */
  async ask(question: string, userRole?: string): Promise<string> {
    // Step 1: Analyze question to determine what data is needed
    const dataPlan = this.analyzeDataNeeds(question);

    // Step 2: Execute queries autonomously
    const fetchedData = await this.executeDataPlan(dataPlan, userRole);

    // Step 3: Generate answer with fetched data
    const answer = await this.generateAnswer(question, fetchedData);

    return answer;
  }

  /**
   * Analyze question to determine what API calls to make
   */
  private analyzeDataNeeds(question: string): DataPlan {
    const plan: DataPlan = { queries: [] };

    const questionLower = question.toLowerCase();

    // Map keywords to features
    for (const [key, feature] of Object.entries(features)) {
      const featureName = feature.name.toLowerCase();
      const tableName = feature.tableName.toLowerCase();

      // Check if question mentions this feature
      if (
        questionLower.includes(featureName) ||
        questionLower.includes(tableName) ||
        questionLower.includes(key.toLowerCase())
      ) {
        plan.queries.push({
          feature: key,
          operation: "list",
          filters: this.extractFilters(question, feature),
        });
      }
    }

    // If no specific feature mentioned, search all
    if (plan.queries.length === 0) {
      plan.needsClarification = true;
    }

    return plan;
  }

  /**
   * Extract filter conditions from natural language
   */
  private extractFilters(question: string, feature: FeatureConfig): Record<string, any> {
    const filters: Record<string, any> = {};

    // Look for field names in the question
    for (const [fieldName, config] of Object.entries(feature.schema)) {
      const label = (config.label || fieldName).toLowerCase();
      const questionLower = question.toLowerCase();

      // Simple pattern matching for common filters
      if (questionLower.includes(`${label} is`)) {
        // Extract value after "is"
        // This is simplified - real implementation would use NLP
      }

      if (questionLower.includes(`${label} =`)) {
        // Extract value after "="
      }
    }

    return filters;
  }

  /**
   * Execute the data plan by making API calls
   */
  private async executeDataPlan(
    plan: DataPlan,
    userRole?: string
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const query of plan.queries) {
      try {
        const feature = features[query.feature];

        // Check permissions
        if (userRole && !feature.permissions.read.includes(userRole)) {
          results[query.feature] = { error: "Permission denied" };
          continue;
        }

        // Build API URL
        const url = `/api/resources/${query.feature}`;
        const params = new URLSearchParams();

        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            params.append(key, String(value));
          });
        }

        // Execute query
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();

        results[query.feature] = data;

        // Track query history
        this.queryHistory.push({
          timestamp: new Date(),
          query: `${query.operation} ${query.feature}`,
          result: data,
        });

      } catch (error) {
        results[query.feature] = { error: String(error) };
      }
    }

    return results;
  }

  /**
   * Generate answer based on fetched data
   */
  private async generateAnswer(
    question: string,
    data: Record<string, any>
  ): Promise<string> {
    // If using Gemini API, call it here
    // For now, provide a simple response

    if (Object.keys(data).length === 0) {
      return "I couldn't find relevant data to answer your question. Could you be more specific about what you're looking for?";
    }

    let answer = "";

    for (const [feature, result] of Object.entries(data)) {
      if ("error" in result) {
        answer += `Error fetching ${feature}: ${result.error}\n`;
      } else if (result.items && result.items.length > 0) {
        answer += `Found ${result.items.length} ${feature}:\n`;
        // Show first few items
        result.items.slice(0, 3).forEach((item: any) => {
          answer += `  - ${item.name || item.id || JSON.stringify(item)}\n`;
        });
      } else {
        answer += `No data found for ${feature}.\n`;
      }
    }

    return answer;
  }

  /**
   * Get query history for debugging
   */
  getQueryHistory() {
    return this.queryHistory;
  }
}

interface DataPlan {
  queries: Array<{
    feature: string;
    operation: "list" | "get" | "create" | "update" | "delete";
    filters?: Record<string, any>;
  }>;
  needsClarification?: boolean;
}

// ============================================================================
// SELF-HEALING - Error Analysis & Suggestions
// ============================================================================

/**
 * Analyze an error and provide self-healing suggestions
 */
export function analyzeError(error: any, context: {
  feature?: string;
  operation?: string;
  data?: any;
}): string[] {
  const suggestions: string[] = [];

  // Schema mismatch errors
  if (error.message?.includes("column") || error.message?.includes("field")) {
    suggestions.push("Schema mismatch detected.");

    if (context.feature) {
      const metadata = extractFeatureMetadata(context.feature);
      if (metadata) {
        suggestions.push(`Expected schema for ${metadata.tableName}:`);
        metadata.fields.forEach(f => {
          suggestions.push(`  - ${f.name}: ${f.type}${f.required ? ' (required)' : ''}`);
        });

        suggestions.push("\nPossible fixes:");
        suggestions.push("1. Check database schema matches feature definition");
        suggestions.push("2. Run migration to add missing columns");
        suggestions.push("3. Update feature definition to match database");
      }
    }
  }

  // Permission errors
  if (error.status === 403 || error.message?.includes("permission")) {
    suggestions.push("Permission denied. Possible fixes:");
    suggestions.push("1. Check user role has required permissions");
    suggestions.push("2. Update permissions in feature definition");

    if (context.feature && context.operation) {
      const feature = features[context.feature];
      if (feature) {
        const allowedRoles = feature.permissions[context.operation as keyof typeof feature.permissions] || [];
        suggestions.push(`3. Allowed roles for ${context.operation}: ${allowedRoles.join(", ")}`);
      }
    }
  }

  // Validation errors
  if (error.status === 400 || error.message?.includes("validation")) {
    suggestions.push("Validation failed. Check:");
    suggestions.push("1. All required fields are present");
    suggestions.push("2. Field types match schema");
    suggestions.push("3. Reference fields point to valid records");

    if (context.feature && context.data) {
      const metadata = extractFeatureMetadata(context.feature);
      if (metadata) {
        const missingRequired = metadata.fields
          .filter(f => f.required && !(f.name in context.data))
          .map(f => f.name);

        if (missingRequired.length > 0) {
          suggestions.push(`\nMissing required fields: ${missingRequired.join(", ")}`);
        }
      }
    }
  }

  // Not found errors
  if (error.status === 404) {
    suggestions.push("Resource not found. Possible fixes:");
    suggestions.push("1. Check the resource ID is correct");
    suggestions.push("2. Verify the resource hasn't been deleted");
    suggestions.push("3. Check the feature name is correct");

    if (context.feature) {
      suggestions.push(`4. Feature table: ${features[context.feature]?.tableName}`);
    }
  }

  return suggestions;
}

/**
 * Generate a diagnostic report for E2E test failures
 */
export function generateE2EDiagnostic(
  testName: string,
  error: any,
  context: {
    feature: string;
    operation: string;
    testData?: any;
  }
): string {
  const metadata = extractFeatureMetadata(context.feature);
  const suggestions = analyzeError(error, context);

  let report = `# E2E Test Failure Diagnostic\n\n`;
  report += `**Test:** ${testName}\n`;
  report += `**Feature:** ${context.feature}\n`;
  report += `**Operation:** ${context.operation}\n`;
  report += `**Error:** ${error.message || String(error)}\n\n`;

  if (metadata) {
    report += `## Expected Schema\n\n`;
    report += `| Field | Type | Required |\n`;
    report += `|-------|------|----------|\n`;
    metadata.fields.forEach(f => {
      report += `| ${f.name} | ${f.type} | ${f.required ? 'Yes' : 'No'} |\n`;
    });
    report += `\n`;
  }

  if (context.testData) {
    report += `## Test Data\n\n`;
    report += `\`\`\`json\n${JSON.stringify(context.testData, null, 2)}\n\`\`\`\n\n`;
  }

  report += `## Suggestions\n\n`;
  suggestions.forEach(s => {
    report += `${s}\n`;
  });

  return report;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const geminiLayer = {
  // System Awareness
  extractFeatureMetadata,
  getAllFeatureMetadata,
  generateGeminiSystemPrompt,

  // Autonomous Querying
  GeminiAIAgent,

  // Self-Healing
  analyzeError,
  generateE2EDiagnostic,
};
