/**
 * Layout Components
 *
 * A comprehensive set of layout components for building consistent,
 * responsive page layouts.
 *
 * @example
 * ```tsx
 * import { PageContainer, PageHeader, Grid, Stack } from "@/components/layouts";
 *
 * export default function Page() {
 *   return (
 *     <PageContainer>
 *       <PageHeader title="Dashboard" />
 *       <Grid cols={{ sm: 1, md: 2, lg: 3 }}>
 *         <Stack gap={16}>...</Stack>
 *       </Grid>
 *     </PageContainer>
 *   );
 * }
 * ```
 */

// Page Container
export {
  PageContainer,
  PageHeader,
  PageSection,
  type PageContainerProps,
  type PageHeaderProps,
  type PageSectionProps,
} from "./page-container";

// Grid
export {
  Grid,
  GridItem,
  CardGrid,
  ListGrid,
  StatGrid,
  FormGrid,
  type GridProps,
  type GridItemProps,
  type ColsValue,
  type GapValue,
} from "./grid";

// Stack
export {
  Stack,
  VStack,
  HStack,
  TightStack,
  NormalStack,
  LooseStack,
  SpaciousStack,
  Separator,
  StackWithSeparator,
  type StackProps,
  type HStackProps,
  type SeparatorProps,
  type StackWithSeparatorProps,
  type GapToken,
} from "./stack";

// Cluster
export {
  Cluster,
  VCluster,
  TightCluster,
  NormalCluster,
  LooseCluster,
  CenterCluster,
  SpaceBetweenCluster,
  FlowCluster,
  useWrapInfo,
  type ClusterProps,
  type VClusterProps,
  type UseWrapInfoReturn,
} from "./cluster";

// Sidebar Layout
export {
  SidebarLayout,
  SidebarNavItem,
  SidebarSection,
  SidebarFooter,
  type SidebarLayoutProps,
  type SidebarNavItemProps,
  type SidebarSectionProps,
  type SidebarFooterProps,
} from "./sidebar-layout";

// Header
export {
  Header,
  Breadcrumb,
  PageTitle,
  PageActions,
  type HeaderProps,
  type BreadcrumbProps,
  type BreadcrumbItem,
  type PageTitleProps,
  type PageActionsProps,
} from "./header";

// Empty State
export {
  EmptyState,
  EmptyStateIcon,
  NoData,
  NoResults,
  NoFiles,
  NoUsers,
  NoNotifications,
  ErrorState,
  LoadingState,
  type EmptyStateProps,
  type EmptyStateIconProps,
  type EmptyStateIconType,
} from "./empty-state";
