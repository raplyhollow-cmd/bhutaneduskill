"use client";

/**
 * React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorDisplay ... />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * Docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  renderError?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Something went wrong
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            An unexpected error occurred. Our team has been notified.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40 text-red-600">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={retry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go Home
            </a>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-sm text-gray-500">
          Bhutan EduSkill • Career Compass & School Management
        </p>
      </div>
    </div>
  );
}

/**
 * Error Boundary Class Component
 *
 * Wraps children and catches rendering errors.
 * Can be customized with fallback UI or custom error renderer.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logger
    logger.error(error, {
      componentStack: errorInfo.componentStack,
    });

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, renderError } = this.props;

    if (hasError && error) {
      // Use custom renderer if provided
      if (renderError) {
        return renderError(error, this.handleReset);
      }

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use default fallback
      return <DefaultErrorFallback error={error} retry={this.handleReset} />;
    }

    return children;
  }
}

/**
 * Functional wrapper for easier use with hooks
 *
 * Usage:
 * ```tsx
 * <withErrorBoundary>
 *   <YourComponent />
 * </withErrorBoundary>
 * ```
 */
export function withErrorBoundary({
  children,
  fallback,
  onError,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Higher-order component to wrap a component with error boundary
 *
 * Usage:
 * ```tsx
 * const SafeComponent = withErrorBoundaryHOC(RiskyComponent);
 * ```
 */
export function withErrorBoundaryHOC<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook to manually trigger error boundary from async operations
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const triggerError = useErrorTrigger();
 *
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       triggerError(error as Error);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorTrigger(): (error: Error) => never {
  return function triggerError(error: Error): never {
    throw error;
  };
}

export default ErrorBoundary;
