/**
 * Type Helper Utilities
 *
 * This file provides reusable type-safe patterns to solve common TypeScript errors.
 * Use these helpers instead of inline type assertions throughout the codebase.
 *
 * @see docs/typescript-patterns.md for documentation
 */

import { or, and } from "drizzle-orm";
import { type SQL } from "drizzle-orm";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// ============================================================================
// FRAMER MOTION HELPERS
// ============================================================================

/**
 * Type-safe easing presets for Framer Motion.
 *
 * @example
 * variants={{
 *   visible: { transition: { ease: motionEasing.default } }
 * }}
 */
export const motionEasing = {
  /** Default smooth easing */
  default: [0.25, 0.4, 0.25, 1] as const,
  /** Ease in - fast start, slow end */
  easeIn: [0.4, 0, 1, 1] as const,
  /** Ease out - slow start, fast end */
  easeOut: [0, 0, 0.2, 1] as const,
  /** Ease in and out */
  easeInOut: [0.4, 0, 0.2, 1] as const,
  /** Sharp/bouncy easing */
  sharp: [0.4, 0, 0.6, 1] as const,
} as const;

/**
 * Type-safe transition config for Framer Motion variants.
 *
 * @example
 * const variants = createVariants({
 *   visible: { delay: 0.1, duration: 0.6 }
 * });
 */
export const createTransition = (config: {
  delay?: number;
  duration?: number;
  ease?: readonly number[];
}) => ({
  delay: config.delay ?? 0,
  duration: config.duration ?? 0.6,
  ease: config.ease ?? motionEasing.default,
});

// ============================================================================

/**
 * Type-safe equality check for Drizzle ORM columns with union types.
 *
 * Use this when you have a string variable that needs to match a specific union type.
 *
 * @example
 * eqLiteral(announcements.priority, priorityValue)
 * // Instead of: eq(announcements.priority, priorityValue as "low" | "high")
 */
// Simple equality check - removed sql template literal to fix Drizzle type error
// Temporarily disabled due to Drizzle type errors in other files
// export const eqLiteral = <T extends string>(
//   column: { _: { columnName: string; dataType: string } },
//   value: string
// ) => {
//   return column === value;
// };

/**
 * Priority type assertion for announcements table.
 */
export const asPriority = (value: string): "low" | "normal" | "high" | "urgent" =>
  value as "low" | "normal" | "high" | "urgent";

/**
 * Category type assertion for announcements table.
 */
export const asCategory = (value: string): "general" | "event" | "exam" | "holiday" | "urgent" =>
  value as "general" | "event" | "exam" | "holiday" | "urgent";

/**
 * Target audience type assertion.
 */
export const asTargetAudience = (value: string): "all" | "students" | "teachers" | "parents" | "staff" | "counselor" =>
  value as "all" | "students" | "teachers" | "parents" | "staff" | "counselor";

/**
 * Safe OR wrapper that filters out undefined values.
 *
 * Use this when combining multiple optional conditions.
 *
 * @example
 * // Instead of:
 * const result = or(cond1, cond2, cond3);
 * if (result) conditions.push(result);
 *
 * // Use:
 * conditions.push(safeOr(cond1, cond2, cond3));
 */
export const safeOr = (
  ...conditions: (SQL<unknown> | undefined)[]
): SQL<unknown>[] => {
  const result = or(...conditions.filter(Boolean) as SQL<unknown>[]);
  return result ? [result] : [];
};

/**
 * Safe AND wrapper that filters out undefined values.
 */
export const safeAnd = (
  ...conditions: (SQL<unknown> | undefined)[]
): SQL<unknown>[] => {
  const result = and(...conditions.filter(Boolean) as SQL<unknown>[]);
  return result ? [result] : [];
};

/**
 * Push SQL condition to array if it exists.
 *
 * @example
 * pushIfDefined(conditions, or(cond1, cond2));
 */
export const pushIfDefined = (
  arr: SQL<unknown>[],
  condition: SQL<unknown> | undefined
): void => {
  if (condition) arr.push(condition);
};

// ============================================================================
// DYNAMIC IMPORT HELPERS
// ============================================================================

/**
 * Create a client-side only component with dynamic import.
 *
 * Use this wrapper instead of directly using dynamic() with ssr: false
 * in server components.
 *
 * @example
 * // In a client component file:
 * export const AnnouncementManagerWrapper = createClientComponent(
 *   () => import("./announcement-manager").then(m => m.ClientAnnouncementManager),
 *   { loading: <div>Loading...</div> }
 * );
 */
export function createClientComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: React.ReactNode;
  }
) {
  return dynamic(importFn, {
    ssr: false,
    loading: options?.loading
      ? () => options.loading as React.ReactElement
      : undefined,
  });
}

// ============================================================================
// TYPE ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a value is one of the given literal types.
 *
 * @example
 * const phase = asCareerPhase(user.currentPhase);
 */
export const asCareerPhase = (value: string): CareerPhase =>
  value as CareerPhase;

/**
 * Get a value from a typed record with proper type assertion.
 *
 * @example
 * const phaseInfo = CAREER_PHASES[asCareerPhase(currentPhase)];
 */
export const getFromRecord = <K extends string | number, V>(
  record: Record<K, V>,
  key: string
): V | undefined => {
  return record[key as K];
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Career phase type from assessments.
 */
export type CareerPhase =
  | "self_assessment"
  | "career_exploration"
  | "goal_setting"
  | "planning"
  | "implementation"
  | "review";

/**
 * User type enumeration.
 */
export type UserType =
  | "student"
  | "teacher"
  | "parent"
  | "counselor"
  | "admin"
  | "school_admin";

/**
 * Assessment types.
 */
export type AssessmentType =
  | "riasec"
  | "mbti"
  | "disc"
  | "spark_learning"
  | "spark_personality"
  | "spark_career";
