/**
 * Query Provider Component
 *
 * Wraps the app with TanStack Query's QueryClientProvider
 * Required for useQuery and useMutation hooks to work
 */

"use client";

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Query Client Provider
 *
 * Creates a QueryClient instance and provides it to the app.
 * Using a single instance ensures cache is shared across components.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance on client side only
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is fresh for 5 seconds
            staleTime: 5000,
            // Retry: don't retry on 4xx errors
            retry: (failureCount, error) => {
              const err = error as { status?: number };
              if (err.status && err.status >= 400 && err.status < 500) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}
