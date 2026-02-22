/**
 * Form Components
 *
 * Auto-save form components with Clerk-style toast notifications.
 *
 * @example
 * ```tsx
 * import { AutoSaveForm, CompactSavingBadge } from '@/components/form'
 * ```
 */

// Main auto-save form component
export {
  AutoSaveForm,
  useAutoSaveForm,
  AutoSaveFormWatch,
  type AutoSaveFormProps,
  type AutoSaveFormContextValue,
  type AutoSaveFormWatchProps,
} from './auto-save-form'

// Standalone saving indicators
export {
  SavingIndicator,
  CompactSavingBadge,
  type SavingIndicatorProps,
  type CompactSavingBadgeProps,
} from './auto-save-form'

// Re-export from saving-indicator
export {
  SavingBadge,
  type SavingBadgeProps,
} from './saving-indicator'

// Re-export hooks
export {
  useDebouncedSave,
  formatTimeAgo,
  type UseDebouncedSaveOptions,
  type DebouncedSaveResult,
} from '@/hooks/use-debounced-save'
