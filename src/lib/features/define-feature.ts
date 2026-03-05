/**
 * UNIFIED FEATURE SYSTEM
 *
 * Combines Schema + API + Components into a single definition.
 *
 * Usage:
 * export const StudentFeature = defineFeature({
 *   name: "students",
 *   schema: { id: primaryKey(), name: text().required(), ... },
 *   permissions: { read: [...], write: [...] },
 *   ui: { columns: [...], listComponent, formComponent }
 * });
 */

import { pgTable, text, integer, boolean, timestamp, pgSchema } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { eq, and, desc, count, sql, type SQL } from "drizzle-orm";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse, createdResponse, updatedResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// Re-export createApiRoute for convenience - it's defined in route-handler.ts
// This allows imports from @/lib/features/define-feature to access createApiRoute
export { createApiRoute, type UserType, type AuthContext, type AuthenticatedRequest } from "@/lib/api/route-handler";

// React hooks types (for type definitions only)
// Note: These are type-only imports - actual hook implementations are client-side
type useEffect = void;
type useState = any;

// ============================================================================
// TYPES
// ============================================================================

type UserRole = "student" | "teacher" | "school-admin" | "counselor" | "parent" | "admin";

type ColumnType =
  | "text"
  | "integer"
  | "boolean"
  | "timestamp"
  | "date"
  | "email"
  | "reference"
  | "json"
  | "enum";

type ColumnDefinition<T> = {
  type: ColumnType;
  required?: boolean;
  unique?: boolean;
  primary?: boolean;
  reference?: string | { table: string; displayField?: string; onDelete?: string }; // table name or config for foreign keys
  defaultValue?: any;
  label?: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  options?: string[]; // for enum type
  multiline?: boolean; // for text fields that should use textarea
  rows?: number; // for multiline text fields
  index?: boolean; // Create database index
  isArray?: boolean; // Field is an array
};

type SchemaDefinition = Record<string, ColumnDefinition<any>>;

type PermissionConfig = {
  read?: UserRole[];
  create?: UserRole[];
  update?: UserRole[];
  delete?: UserRole[];
};

type ColumnConfig = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  type?: "text" | "number" | "date" | "email" | "boolean" | "reference";
  reference?: {
    table: string;
    displayField: string;
  };
  render?: (value: any, row: any) => React.ReactNode;
};

type UIConfig = {
  columns?: ColumnConfig[];
  title?: string;
  titlePlural?: string;
  icon?: React.ComponentType<{ className?: string }>;
  basePath?: string;
};

// ============================================================================
// ACTION, WEBHOOK, AND PUBLIC ENDPOINT TYPES
// ============================================================================

/**
 * Action Handler - Non-CRUD operations
 * Accessed via: POST /api/resources/{resource}/actions/{actionName}
 *
 * @param id - Optional resource ID (if action is on a specific record)
 * @param data - Request body data
 * @param auth - Auth context with user info
 * @returns API response object
 */
type ActionHandler = (
  id: string | undefined,
  data: any,
  auth: any
) => Promise<any>;

/**
 * Webhook Handler - External service callbacks
 * Accessed via: POST /api/resources/{resource}/webhook/{webhookName}
 *
 * @param data - Webhook payload from external service
 * @param request - Original NextRequest object for headers/signature verification
 * @returns API response object
 */
type WebhookHandler = (
  data: any,
  request: Request
) => Promise<any>;

/**
 * Public Endpoint Handler - No authentication required
 * Accessed via: GET/POST /api/resources/{resource}/public/{endpointName}
 *
 * @param params - Query parameters or request body
 * @param request - Original NextRequest object
 * @returns API response object
 */
type PublicEndpoint = (
  params: any,
  request: Request
) => Promise<any>;

/**
 * Action Configuration
 */
type ActionConfig = {
  handler: ActionHandler;
  allowedRoles?: UserRole[];
  description?: string;
  requireId?: boolean; // Whether action requires a resource ID
};

/**
 * Webhook Configuration
 */
type WebhookConfig = {
  handler: WebhookHandler;
  source: string; // External service name (e.g., "clerk", "stripe", "rma")
  verifySignature?: boolean; // Whether to verify webhook signature
  secretHeader?: string; // Header name containing signature (e.g., "webhook-signature")
};

/**
 * Public Endpoint Configuration
 */
type PublicEndpointConfig = {
  handler: PublicEndpoint;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  description?: string;
  rateLimit?: number; // Max requests per window
};

type FeatureConfig = {
  name: string;
  schema: SchemaDefinition;
  permissions?: PermissionConfig;
  ui?: UIConfig;
  tableName?: string;
  customHandlers?: {
    list?: (params: any, auth: any) => Promise<any>;
    get?: (id: string, auth: any) => Promise<any>;
    create?: (data: any, auth: any) => Promise<any>;
    update?: (id: string, data: any, auth: any) => Promise<any>;
    delete?: (id: string, auth: any) => Promise<any>;
  };
  bulkOperations?: {
    [key: string]: (...args: any[]) => Promise<any>;
  };
  tableConfig?: {
    comments?: string;
    additionalIndexes?: Array<{
      columns: string[];
      name?: string;
      unique?: boolean;
    }>;
  };
  // NEW: Actions (non-CRUD operations)
  actions?: Record<string, ActionHandler | ActionConfig>;
  // NEW: Webhooks (external service callbacks)
  webhooks?: Record<string, WebhookHandler | WebhookConfig>;
  // NEW: Public endpoints (no auth required)
  public?: Record<string, PublicEndpoint | PublicEndpointConfig>;
};

type GeneratedTypes<T extends SchemaDefinition> = {
  Select: {
    [K in keyof T]: any;
  };
  Insert: {
    [K in keyof T]?: any;
  };
  Update: {
    [K in keyof T]?: any;
  };
};

// ============================================================================
// FEATURE DEFINITION
// ============================================================================

export function defineFeature<T extends SchemaDefinition>(config: FeatureConfig & { schema: T }) {
  const tableName = config.tableName || config.name;

  // Generate Drizzle schema
  const schema = generateDrizzleSchema(config);

  // Generate API handlers
  const api = generateApiHandlers(config, tableName);

  // Generate types
  const types = generateTypes(config);

  // Normalize actions (convert simple handlers to config objects)
  const normalizedActions = normalizeActions(config.actions || {});

  // Normalize webhooks (convert simple handlers to config objects)
  const normalizedWebhooks = normalizeWebhooks(config.webhooks || {});

  // Normalize public endpoints (convert simple handlers to config objects)
  const normalizedPublic = normalizePublicEndpoints(config.public || {});

  // Return complete feature object
  const feature = {
    name: config.name,
    tableName,
    schema,
    api,
    types,
    config,
    bulkOperations: config.bulkOperations || {},
    // NEW: Extended handlers
    actions: normalizedActions,
    webhooks: normalizedWebhooks,
    public: normalizedPublic,
  };

  // Register API routes (side effect)
  registerFeatureRoutes(config.name, api, config.permissions, {
    actions: normalizedActions,
    webhooks: normalizedWebhooks,
    public: normalizedPublic,
  });

  return feature;
}

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

function generateDrizzleSchema(config: FeatureConfig) {
  const columns: Record<string, any> = {};

  for (const [key, colDef] of Object.entries(config.schema)) {
    let column: any;

    switch (colDef.type) {
      case "text":
        column = text(key);
        break;
      case "integer":
        column = integer(key);
        break;
      case "boolean":
        column = boolean(key);
        break;
      case "timestamp":
        column = timestamp(key, { withTimezone: true });
        break;
      case "date":
        column = text(key); // Store dates as text in ISO format
        break;
      case "email":
        column = text(key);
        break;
      case "json":
        column = text(key); // Store JSON as text
        break;
      default:
        column = text(key);
    }

    // Apply modifiers
    if (colDef.required) {
      column = column.notNull();
    }
    if (colDef.unique) {
      column = column.unique();
    }

    columns[key] = column;
  }

  // Add standard timestamps if not present
  if (!columns.createdAt) {
    columns.createdAt = timestamp("created_at", { withTimezone: true }).notNull();
  }
  if (!columns.updatedAt) {
    columns.updatedAt = timestamp("updated_at", { withTimezone: true }).notNull();
  }
  if (!columns.id) {
    columns.id = text("id").primaryKey();
  }
  if (!columns.isActive) {
    columns.isActive = boolean("is_active").default(true);
  }

  return pgTable(config.tableName || config.name, columns);
}

// ============================================================================
// API HANDLER GENERATION
// ============================================================================

function generateApiHandlers(config: FeatureConfig, tableName: string) {
  const {
    permissions = {
      read: ["school-admin", "admin", "teacher"],
      create: ["school-admin", "admin"],
      update: ["school-admin", "admin"],
      delete: ["school-admin", "admin"],
    },
    customHandlers = {},
  } = config;

  return {
    // LIST - Get all records with pagination and filtering
    list: customHandlers.list || (async (params: any, auth: any) => {
      const { page = 1, limit = 20, filters = {}, sortBy, sortOrder } = params;
      const { user } = auth;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = buildWhereConditions(config.schema, filters, user);

      // Get the schema table
      const table = getTable(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      // Execute query
      const [dataResult, countResult] = await Promise.all([
        db
          .select()
          .from(table)
          .where(conditions)
          .orderBy(sortBy ? table[sortBy] : desc(table.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(table)
          .where(conditions),
      ]);

      return successResponse({
        data: dataResult,
        pagination: {
          total: countResult[0]?.count || 0,
          page,
          limit,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
        },
      });
    }),

    // GET - Get single record by ID
    get: customHandlers.get || (async (id: string, auth: any) => {
      const table = getTable(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      const result = await db
        .select()
        .from(table)
        .where(eq(table.id, id))
        .limit(1);

      if (result.length === 0) {
        return notFoundResponse(config.name);
      }

      return successResponse({ data: result[0] });
    }),

    // CREATE - Create new record
    create: customHandlers.create || (async (data: any, auth: any) => {
      const table = getTable(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      const id = `${config.name.substring(0, 3)}-${nanoid()}`;

      const result = await db
        .insert(table)
        .values({
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info(`${config.name} created`, { id, userId: auth.userId });

      return createdResponse({ data: result[0] });
    }),

    // UPDATE - Update existing record
    update: customHandlers.update || (async (id: string, data: any, auth: any) => {
      const table = getTable(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      const result = await db
        .update(table)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(table.id, id))
        .returning();

      if (result.length === 0) {
        return notFoundResponse(config.name);
      }

      logger.info(`${config.name} updated`, { id, userId: auth.userId });

      return updatedResponse({ data: result[0] });
    }),

    // DELETE - Delete (soft delete) record
    delete: customHandlers.delete || (async (id: string, auth: any) => {
      const table = getTable(tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found`);
      }

      // Soft delete if isActive column exists
      if (config.schema.isActive) {
        await db
          .update(table)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(table.id, id));
      } else {
        await db.delete(table).where(eq(table.id, id));
      }

      logger.info(`${config.name} deleted`, { id, userId: auth.userId });

      return successResponse({ message: `${config.name} deleted successfully` });
    }),
  };
}

// ============================================================================
// TYPE GENERATION
// ============================================================================

function generateTypes<T extends SchemaDefinition>(config: FeatureConfig & { schema: T }): GeneratedTypes<T> {
  // This is a simplified version - in real implementation, we'd use TypeScript's type system
  return {
    Select: {} as any,
    Insert: {} as any,
    Update: {} as any,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildWhereConditions(schema: SchemaDefinition, filters: any, user: any) {
  const conditions: any[] = [];

  // Add school filter if user has schoolId
  if (user.schoolId && schema.schoolId) {
    conditions.push(eq(sql`${user.schoolId}`, sql`${schema.schoolId}`));
  }

  // Add isActive filter for soft deletes
  if (schema.isActive) {
    conditions.push(eq(sql`true`, sql`is_active`));
  }

  // Add custom filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      // Implement filter logic based on column type
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getTable(tableName: string) {
  // Import tables dynamically
  const { tables } = require("@/lib/db/schema");
  return tables[tableName];
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

const registeredRoutes = new Map<string, any>();

interface ExtendedHandlers {
  actions?: Record<string, ActionConfig>;
  webhooks?: Record<string, WebhookConfig>;
  public?: Record<string, PublicEndpointConfig>;
}

function registerFeatureRoutes(
  featureName: string,
  api: any,
  permissions?: PermissionConfig,
  extended?: ExtendedHandlers
) {
  if (registeredRoutes.has(featureName)) {
    return; // Already registered
  }

  // Create route handler with extended support
  const routeHandler = createRouteHandler(featureName, api, permissions, extended);
  registeredRoutes.set(featureName, routeHandler);

  // Log route registration
  const extraRoutes: string[] = [];
  if (extended?.actions) extraRoutes.push(`${Object.keys(extended.actions).length} actions`);
  if (extended?.webhooks) extraRoutes.push(`${Object.keys(extended.webhooks).length} webhooks`);
  if (extended?.public) extraRoutes.push(`${Object.keys(extended.public).length} public endpoints`);

  logger.info(`Feature routes registered`, {
    feature: featureName,
    extra: extraRoutes.join(', ') || 'standard CRUD only'
  });
}

function createRouteHandler(
  featureName: string,
  api: any,
  permissions?: PermissionConfig,
  extended?: ExtendedHandlers
) {
  return {
    GET: async (request: Request, auth: any) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const type = url.searchParams.get("type") || (id && id !== featureName ? "get" : "list");

      // Check for public endpoint
      const publicEndpoint = url.searchParams.get("public");
      if (publicEndpoint && extended?.public?.[publicEndpoint]) {
        const endpointConfig = extended.public[publicEndpoint];
        if (endpointConfig.method === "GET") {
          const params = Object.fromEntries(url.searchParams);
          return await endpointConfig.handler(params, request);
        }
        return badRequestResponse(`Public endpoint ${publicEndpoint} does not support GET`);
      }

      // Check permissions for standard endpoints
      const allowedRoles = permissions?.read || ["school-admin", "admin"];
      if (!auth.user || !hasPermission(auth.user.type, allowedRoles)) {
        return errorResponse("Unauthorized", 401);
      }

      if (type === "get" && id) {
        return await api.get(id, auth);
      } else {
        const params = Object.fromEntries(url.searchParams);
        return await api.list(params, auth);
      }
    },

    POST: async (request: Request, auth: any) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const data = await request.json();

      // Check for action endpoint
      const action = url.searchParams.get("action");
      if (action && extended?.actions?.[action]) {
        const actionConfig = extended.actions[action];
        const allowedRoles = actionConfig.allowedRoles || permissions?.update || ["school-admin", "admin"];
        if (!auth.user || !hasPermission(auth.user.type, allowedRoles)) {
          return errorResponse("Unauthorized for action: " + action, 401);
        }
        return await actionConfig.handler(id, data, auth);
      }

      // Check for webhook endpoint (no auth)
      const webhook = url.searchParams.get("webhook");
      if (webhook && extended?.webhooks?.[webhook]) {
        const webhookConfig = extended.webhooks[webhook];
        // TODO: Add signature verification if configured
        return await webhookConfig.handler(data, request);
      }

      // Check for public endpoint
      const publicEndpoint = url.searchParams.get("public");
      if (publicEndpoint && extended?.public?.[publicEndpoint]) {
        const endpointConfig = extended.public[publicEndpoint];
        if (endpointConfig.method === "POST") {
          return await endpointConfig.handler(data, request);
        }
        return badRequestResponse(`Public endpoint ${publicEndpoint} does not support POST`);
      }

      // Standard CREATE endpoint
      const allowedRoles = permissions?.create || ["school-admin", "admin"];
      if (!auth.user || !hasPermission(auth.user.type, allowedRoles)) {
        return errorResponse("Unauthorized", 401);
      }

      return await api.create(data, auth);
    },

    PUT: async (request: Request, auth: any) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const data = await request.json();

      // Check for public endpoint
      const publicEndpoint = url.searchParams.get("public");
      if (publicEndpoint && extended?.public?.[publicEndpoint]) {
        const endpointConfig = extended.public[publicEndpoint];
        if (endpointConfig.method === "PUT") {
          return await endpointConfig.handler(data, request);
        }
        return badRequestResponse(`Public endpoint ${publicEndpoint} does not support PUT`);
      }

      const allowedRoles = permissions?.update || ["school-admin", "admin"];
      if (!auth.user || !hasPermission(auth.user.type, allowedRoles)) {
        return errorResponse("Unauthorized", 401);
      }

      return await api.update(id, data, auth);
    },

    DELETE: async (request: Request, auth: any) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();

      // Check for public endpoint
      const publicEndpoint = url.searchParams.get("public");
      if (publicEndpoint && extended?.public?.[publicEndpoint]) {
        const endpointConfig = extended.public[publicEndpoint];
        if (endpointConfig.method === "DELETE") {
          return await endpointConfig.handler({ id }, request);
        }
        return badRequestResponse(`Public endpoint ${publicEndpoint} does not support DELETE`);
      }

      const allowedRoles = permissions?.delete || ["school-admin", "admin"];
      if (!auth.user || !hasPermission(auth.user.type, allowedRoles)) {
        return errorResponse("Unauthorized", 401);
      }

      return await api.delete(id, auth);
    },
  };
}

function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Normalize action definitions - convert simple handlers to config objects
 */
function normalizeActions(actions: Record<string, ActionHandler | ActionConfig>): Record<string, ActionConfig> {
  const normalized: Record<string, ActionConfig> = {};
  for (const [name, handlerOrConfig] of Object.entries(actions)) {
    if (typeof handlerOrConfig === 'function') {
      normalized[name] = {
        handler: handlerOrConfig as ActionHandler,
        allowedRoles: undefined, // Will use default permissions
        requireId: false,
      };
    } else {
      normalized[name] = handlerOrConfig as ActionConfig;
    }
  }
  return normalized;
}

/**
 * Normalize webhook definitions - convert simple handlers to config objects
 */
function normalizeWebhooks(webhooks: Record<string, WebhookHandler | WebhookConfig>): Record<string, WebhookConfig> {
  const normalized: Record<string, WebhookConfig> = {};
  for (const [name, handlerOrConfig] of Object.entries(webhooks)) {
    if (typeof handlerOrConfig === 'function') {
      normalized[name] = {
        handler: handlerOrConfig as WebhookHandler,
        source: name,
        verifySignature: false,
      };
    } else {
      normalized[name] = handlerOrConfig as WebhookConfig;
    }
  }
  return normalized;
}

/**
 * Normalize public endpoint definitions - convert simple handlers to config objects
 */
function normalizePublicEndpoints(publicEndpoints: Record<string, PublicEndpoint | PublicEndpointConfig>): Record<string, PublicEndpointConfig> {
  const normalized: Record<string, PublicEndpointConfig> = {};
  for (const [name, handlerOrConfig] of Object.entries(publicEndpoints)) {
    if (typeof handlerOrConfig === 'function') {
      normalized[name] = {
        handler: handlerOrConfig as PublicEndpoint,
        method: "GET",
      };
    } else {
      normalized[name] = handlerOrConfig as PublicEndpointConfig;
    }
  }
  return normalized;
}

// ============================================================================
// REACT HOOKS (Client-side only)
// ============================================================================

// React hooks are implemented in client-side components
// These are type-only stubs for the feature return type

// The actual hooks are implemented in:
// src/components/features/use-resource-*.ts files (client-side)

// ============================================================================
// MIGRATION GENERATOR (Full Schema Unification)
// ============================================================================

/**
 * Generate SQL migration for a feature definition
 * This creates the actual database schema from the feature config
 */
export function generateFeatureMigration(config: FeatureConfig, existingTables: Set<string> = new Set()): string {
  const tableName = config.tableName || config.name;
  const isNewTable = !existingTables.has(tableName);

  let sql = `-- Migration: ${config.name}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;

  if (isNewTable) {
    // CREATE TABLE
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

    const columns: string[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: string[] = [];
    const indexes: string[] = [];

    // Add user-defined columns
    for (const [colName, colDef] of Object.entries(config.schema)) {
      const pgType = getPostgresTypeForMigration(colDef.type);
      let colSql = `  ${colName} ${pgType}`;

      // Constraints
      const constraints: string[] = [];

      if (colDef.primary) {
        primaryKeys.push(colName);
      } else {
        if (colDef.required) constraints.push("NOT NULL");
        if (colDef.unique) constraints.push("UNIQUE");
        if (colDef.defaultValue !== undefined) {
          constraints.push(`DEFAULT ${formatMigrationDefaultValue(colDef.defaultValue)}`);
        }
      }

      if (constraints.length > 0) {
        colSql += ' ' + constraints.join(' ');
      }

      columns.push(colSql);

      // Foreign key
      if (colDef.reference) {
        const refConfig = typeof colDef.reference === 'string'
          ? { table: colDef.reference, onDelete: 'no action' }
          : colDef.reference;
        foreignKeys.push(
          `  CONSTRAINT ${tableName}_${colName}_fk FOREIGN KEY (${colName}) REFERENCES ${refConfig.table} (id) ON DELETE ${refConfig.onDelete?.toUpperCase() || 'NO ACTION'}`
        );
      }

      // Indexes
      if (colDef.index) {
        indexes.push(`CREATE INDEX IF NOT EXISTS idx_${tableName}_${colName} ON ${tableName} (${colName});`);
      }
    }

    // Add standard columns if not defined
    if (!config.schema.id) {
      columns.push(`  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()`);
      primaryKeys.push('id');
    }
    if (!config.schema.createdAt) {
      columns.push(`  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    }
    if (!config.schema.updatedAt) {
      columns.push(`  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
    }

    // Combine columns with foreign keys
    sql += columns.join(',\n');
    if (foreignKeys.length > 0) {
      sql += ',\n' + foreignKeys.join(',\n');
    }
    sql += '\n);\n\n';

    // Add indexes
    if (indexes.length > 0) {
      sql += indexes.join('\n');
      sql += '\n';
    }

    // Add table comment if provided
    if (config.tableConfig?.comments) {
      sql += `COMMENT ON TABLE ${tableName} IS '${config.tableConfig.comments}';\n`;
    }

  } else {
    // ALTER TABLE for schema changes
    sql += `-- Schema updates for ${tableName}\n`;
    sql += `-- Review and modify as needed\n`;
    sql += `-- ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ...\n`;
  }

  return sql;
}

function getPostgresTypeForMigration(type: ColumnType): string {
  const types: Record<ColumnType, string> = {
    text: "TEXT",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    timestamp: "TIMESTAMP WITH TIME ZONE",
    date: "TEXT",
    email: "TEXT",
    json: "TEXT",
    enum: "TEXT",
    reference: "TEXT",
  };
  return types[type] || "TEXT";
}

function formatMigrationDefaultValue(value: any): string {
  if (value === null) return "NULL";
  if (typeof value === "string") return `'${value}'`;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${value}'`;
}

/**
 * Get all table names from feature definitions
 */
export function getFeatureTables(features: Record<string, ReturnType<typeof defineFeature>>): string[] {
  return Object.values(features).map(f => f.tableName || f.name);
}

/**
 * Generate comprehensive migration for all features
 */
export function generateFullMigration(features: Record<string, ReturnType<typeof defineFeature>>): string {
  let sql = `-- Full Database Migration\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Bhutan EduSkill Platform - Unified Architecture\n\n`;

  const tableNames = new Set<string>();

  for (const [name, feature] of Object.entries(features)) {
    sql += generateFeatureMigration(feature.config, tableNames);
    tableNames.add(feature.tableName || name);
    sql += '\n';
  }

  return sql;
}
