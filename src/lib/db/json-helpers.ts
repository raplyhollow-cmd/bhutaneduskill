/**
 * JSON Parsing Helper Functions
 *
 * Utilities for safely parsing and stringifying JSON fields
 * that are stored as text in PostgreSQL database columns.
 */

/**
 * Parse a JSON array field that's stored as text in the database
 * @param field - The field value (string, array, or null/undefined)
 * @returns Parsed array or empty array on error
 */
export function parseJsonArray<T = string>(field: string | T[] | null | undefined): T[] {
  if (!field) return [];
  try {
    return typeof field === "string" ? JSON.parse(field) : field;
  } catch {
    return [];
  }
}

/**
 * Parse a JSON object field that's stored as text in the database
 * @param field - The field value (string, object, or null/undefined)
 * @returns Parsed object or empty object on error
 */
export function parseJsonObject<T = Record<string, unknown>>(field: string | T | null | undefined): T {
  if (!field) return {} as T;
  try {
    return typeof field === "string" ? JSON.parse(field) : field;
  } catch {
    return {} as T;
  }
}

/**
 * Safely stringify an object to JSON for database storage
 * @param value - The value to stringify
 * @returns JSON string or empty string on error
 */
export function stringifyJson(value: unknown): string {
  if (!value) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

/**
 * Parse a JSON field with a default value on error
 * @param field - The field value (string or null/undefined)
 * @param defaultValue - The default value to return on parse error
 * @returns Parsed value or default value
 */
export function parseJsonWithDefault<T>(field: string | null | undefined, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if a string is valid JSON
 * @param str - The string to check
 * @returns true if valid JSON, false otherwise
 */
export function isValidJson(str: string): boolean {
  if (!str) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
