/**
 * UNIFIED COMPONENTS - EXPORTS
 *
 * Central export point for all unified components.
 * This system provides a complete UI toolkit for any feature.
 */

// Core Components
export {
  FeatureDataGrid,
  useDataGrid,
  type ColumnConfig,
  type ActionConfig,
  type FilterConfig,
  type SortOrder,
} from "./FeatureDataGrid";

export {
  FeatureForm,
  FeatureView,
  type FormMode,
  type FeatureFormProps,
  type ColumnDefinition,
  type SchemaDefinition,
  type FieldRendererProps,
} from "./FeatureForm";

export {
  FeatureListPage,
  useFeatureList,
  type FeatureConfig,
  type FeatureListPageProps,
} from "./FeatureListPage";

// Search & Filter
export {
  UnifiedSearchBar,
  AdvancedFilterBuilder,
  QuickFilterPills,
  type SearchConfig,
  type FilterConfig as UnifiedFilterConfig,
  type FilterOption,
} from "./UnifiedSearch";

// Modals
export {
  UniversalModal,
  ConfirmDialog,
  BulkActionModal,
  DrawerModal,
  type ModalSize,
  type ModalMode,
} from "./UniversalModal";

// Notifications
export {
  notify,
  NotificationBell,
  DashboardStats,
  QuickActions,
  ActivityFeed,
  useNotifications,
  NotificationProvider,
  type NotificationType,
  type NotificationPriority,
  type AppNotification,
} from "./Notifications";
