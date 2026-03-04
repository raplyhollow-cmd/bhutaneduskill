/**
 * ATTENDANCE PAGE (Unified Architecture)
 *
 * Demonstrates the new 1-file = 1-feature pattern.
 * Before: Multiple files for schema, API, components
 * After: Single import from AttendanceFeature
 */

import { FeatureListPage } from "@/components/features";
import { AttendanceFeature } from "@/features";

export default function AttendancePage() {
  return <FeatureListPage feature={AttendanceFeature} />;
}
