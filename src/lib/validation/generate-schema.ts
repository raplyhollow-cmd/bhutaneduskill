/**
 * UNIVERSAL VALIDATION SCHEMA GENERATOR
 *
 * Automatically generates Zod validation schemas from feature definitions.
 * Eliminates the need to write validation logic manually.
 *
 * @example
 * import { LessonFeature } from "@/features";
 * const schema = generateValidationSchema(LessonFeature);
 */

import { z } from "zod";

// Type mapping from feature definition to Zod types
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

interface ColumnDefinition {
  type: ColumnType;
  required?: boolean;
  unique?: boolean;
  label?: string;
  options?: string[];
  isArray?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

interface SchemaDefinition {
  [key: string]: ColumnDefinition;
}

interface FeatureConfig {
  name: string;
  schema: SchemaDefinition;
}

/**
 * Generate Zod schema from feature definition
 */
export function generateValidationSchema(feature: FeatureConfig): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [fieldName, column] of Object.entries(feature.schema)) {
    shape[fieldName] = generateFieldSchema(fieldName, column);
  }

  return z.object(shape);
}

/**
 * Generate Zod schema for a single field
 */
function generateFieldSchema(fieldName: string, column: ColumnDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  // Base type schema
  switch (column.type) {
    case "text":
      schema = z.string();
      if (column.minLength) schema = (schema as z.ZodString).min(column.minLength);
      if (column.maxLength) schema = (schema as z.ZodString).max(column.maxLength);
      if (column.pattern) schema = (schema as z.ZodString).regex(new RegExp(column.pattern));
      break;

    case "integer":
      schema = z.number().int();
      if (column.min !== undefined) schema = (schema as z.ZodNumber).min(column.min);
      if (column.max !== undefined) schema = (schema as z.ZodNumber).max(column.max);
      break;

    case "boolean":
      schema = z.boolean();
      break;

    case "timestamp":
      schema = z.string().datetime();
      break;

    case "date":
      schema = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      });
      break;

    case "email":
      schema = z.string().email();
      break;

    case "reference":
      schema = z.string().min(1, "This field is required");
      break;

    case "json":
      schema = z.any();
      break;

    case "enum":
      if (!column.options || column.options.length === 0) {
        schema = z.string();
      } else {
        schema = z.enum(column.options as [string, ...string[]]);
      }
      break;

    default:
      schema = z.any();
  }

  // Apply array wrapper if needed
  if (column.isArray) {
    schema = z.array(schema);
  }

  // Apply optional/required
  if (!column.required) {
    schema = schema.optional().nullable();
  }

  // Add custom error messages
  if (column.required && column.type !== "boolean" && column.type !== "json") {
    if (column.type === "text" || column.type === "email" || column.type === "reference") {
      schema = (schema as z.ZodString).min(1, `${column.label || fieldName} is required`);
    }
  }

  return schema;
}

/**
 * Generate form default values from feature definition
 */
export function generateDefaultValues(feature: FeatureConfig): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const [fieldName, column] of Object.entries(feature.schema)) {
    if (column.type === "boolean") {
      defaults[fieldName] = false;
    } else if (column.type === "integer") {
      defaults[fieldName] = 0;
    } else if (column.isArray) {
      defaults[fieldName] = [];
    } else if (column.type === "json") {
      defaults[fieldName] = {};
    } else {
      defaults[fieldName] = "";
    }
  }

  return defaults;
}

/**
 * Generate type from feature definition
 */
export function generateFeatureType<T extends SchemaDefinition>(
  feature: { schema: T }
): z.ZodObject<z.ZodRawShape> {
  return generateValidationSchema(feature as any);
}

// Common validation schemas
export const commonValidations = {
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[+]?[\d\s\-()]+$/, "Invalid phone number"),
  url: z.string().url("Invalid URL"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  futureDate: z.string().refine((val) => new Date(val) > new Date(), "Date must be in the future"),
  pastDate: z.string().refine((val) => new Date(val) < new Date(), "Date must be in the past"),
  bhutanPhone: z.string().regex(/^(17|77)\d{6}$/, "Invalid Bhutan phone number"),
  cuid: z.string().regex(/^[a-z0-9]{25}$/, "Invalid ID format"),
};

/**
 * Create a filtered schema excluding certain fields
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  excludeFields: string[] = []
): z.ZodObject<any> {
  const shape = schema.shape;
  const newShape: any = {};

  for (const [key, value] of Object.entries(shape)) {
    if (!excludeFields.includes(key)) {
      newShape[key] = value;
    }
  }

  return z.object(newShape);
}

/**
 * Create a schema for updates (all fields optional)
 */
export function createUpdateSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<any> {
  const shape = schema.shape;
  const newShape: any = {};

  for (const [key, value] of Object.entries(shape)) {
    newShape[key] = (value as z.ZodTypeAny).optional().nullable();
  }

  return z.object(newShape);
}

// Re-exports
export { z };
