/**
 * useApiData Hook
 *
 * Reusable hook for fetching API data with loading, error states
 * Provides consistent UX across all portals
 */

import { useState, useEffect } from "react";

interface ApiDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiDataOptions<T> {
  fetchFn: () => Promise<T>;
  deps?: any[];
  enabled?: boolean;
  fallbackData?: T;
}

export function useApiData<T>({
  fetchFn,
  deps = [],
  enabled = true,
  fallbackData,
}: UseApiDataOptions<T>): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        data: fallbackData || null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await fetchFn();

        if (isMounted) {
          setState({
            data: result,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load data";
          setState({
            data: fallbackData || null,
            isLoading: false,
            error: errorMessage,
          });
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, deps);

  return state;
}

/**
 * Helper to fetch with proper error handling
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    throw error;
  }
}
