/**
 * Motion Components
 *
 * Pre-built animated components using the motion design system.
 * All components respect reduced motion preferences and are optimized for performance.
 *
 * @see docs/design/motion-system.md
 *
 * @example
 * import { FadeIn, HoverCard, LoadingSpinner } from '@/components/motion';
 *
 * <FadeIn>
 *   <HoverCard variant="lift">
 *     Content
 *   </HoverCard>
 * </FadeIn>
 */

// ============================================================================
// WRAPPER COMPONENTS
// ============================================================================

export {
  AnimatedWrapper,
  FadeIn,
  FadeUp,
  ScaleIn,
  StaggerIn,
  NoAnimation,
} from "./animated-wrapper";

export type {
  AnimatedWrapperProps,
  AnimatedWrapperVariant,
} from "./animated-wrapper";

// ============================================================================
// INTERACTIVE COMPONENTS
// ============================================================================

export {
  HoverCard,
  LiftCard,
  GlowCard,
  BrandCard,
  IconBounce,
} from "./hover-card";

export type {
  HoverCardProps,
  HoverCardVariant,
} from "./hover-card";

export {
  Pressable,
  SnappyPress,
  StrongPress,
  Interactive,
  PressableButton,
} from "./pressable";

export type {
  PressableProps,
  PressableVariant,
} from "./pressable";

// ============================================================================
// PROGRESS COMPONENTS
// ============================================================================

export {
  ProgressIndicator,
  Spinner,
  LoadingSpinner,
} from "./progress-indicator";

export type {
  ProgressIndicatorProps,
  ProgressVariant,
  ProgressSize,
} from "./progress-indicator";

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

export {
  SuccessToast,
  ErrorToast,
  WarningToast,
  InfoToast,
  useToast,
} from "./success-toast";

export type {
  SuccessToastProps,
  ToastVariant,
} from "./success-toast";
