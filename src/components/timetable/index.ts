/**
 * TIMETABLE COMPONENTS EXPORT
 *
 * Centralized exports for all intelligent timetable components.
 */

export { InteractiveTimetableGrid } from "./timetable-grid-interactive";
export {
  SwapRequestModal,
  SwapNotificationBadge,
} from "./swap-request-modal";
export { AIConstraintBuilder } from "./ai-constraint-builder";

// Re-export types for convenience
export type {
  TimetableConstraints,
  TimetableEntry,
  OptimizationResult,
  SwapRequest,
  SwapPartner,
  Conflict,
  Improvement,
  SchoolContext,
} from "@/lib/types/timetable-constraints";
