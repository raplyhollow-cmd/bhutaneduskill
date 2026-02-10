/**
 * Skeleton Loading Components
 *
 * A collection of loading skeleton components for various UI patterns.
 * All components use the `animate-pulse` utility for smooth loading animations.
 *
 * @example
 * ```tsx
 * import { CardSkeleton, TableSkeleton, ListSkeleton } from "@/components/ui/skeleton"
 *
 * // Card skeleton
 * <CardSkeleton rows={3} showAvatar />
 *
 * // Table skeleton
 * <TableSkeleton rows={5} columns={4} />
 *
 * // List skeleton
 * <ListSkeleton items={5} showIcon />
 * ```
 */

// Base skeleton component
export { Skeleton } from "@/components/ui/skeleton"

// Card skeleton variants
export {
  CardSkeleton,
  StatCardSkeleton,
  CardGridSkeleton,
} from "@/components/ui/skeleton/card-skeleton"

// Table skeleton variants
export {
  TableSkeleton,
  CompactTableSkeleton,
  WideTableSkeleton,
} from "@/components/ui/skeleton/table-skeleton"

// List skeleton variants
export {
  ListSkeleton,
  ActivityListSkeleton,
  HorizontalListSkeleton,
  NotificationListSkeleton,
} from "@/components/ui/skeleton/list-skeleton"
