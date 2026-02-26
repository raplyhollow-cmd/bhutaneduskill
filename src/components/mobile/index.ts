/**
 * Mobile Components Index
 *
 * Export all mobile-optimized components for easy importing.
 *
 * Usage:
 *   import { MobileCard, TouchButton, MobileViewportDebug } from "@/components/mobile";
 */

// Sidebar components
export {
  UniversalMobileSidebar,
  UniversalPortalHeader,
} from "./universal-mobile-sidebar";

// Card components
export {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent,
  MobileCardFooter,
  MobileStatCard,
  MobileActionCard,
  MobileGrid,
  MobileListItem,
} from "./mobile-card";

// Touch-friendly components
export {
  TouchButton,
  TouchIconButton,
  TouchFab,
  TouchToggle,
  TouchSegment,
} from "./touch-friendly";

// Debug utilities
export { MobileViewportDebug } from "./viewport-debug";

// Re-export types
export type {
  TouchButtonProps,
  TouchIconButtonProps,
  TouchFabProps,
  TouchToggleProps,
  TouchSegmentProps,
} from "./touch-friendly";
