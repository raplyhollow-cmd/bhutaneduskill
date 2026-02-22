/**
 * Optimistic UI Utilities
 *
 * Helper functions for optimistic updates across the application.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Optimistically update a single item in a list
 */
export function optimisticUpdateItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string,
  updates: Partial<T>
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
  });
}

/**
 * Optimistically add an item to a list
 */
export function optimisticAddItem<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  newItem: T
) {
  queryClient.setQueryData<T[]>(queryKey, (old = []) => [...old, newItem]);
}

/**
 * Optimistically remove an item from a list
 */
export function optimisticRemoveItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: unknown[],
  id: string
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.filter((item) => item.id !== id);
  });
}

/**
 * Optimistically update a single query value
 */
export function optimisticUpdateValue<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updates: Partial<T>
) {
  queryClient.setQueryData<T>(queryKey, (old) => {
    if (!old) return old;
    return { ...old, ...updates };
  });
}

/**
 * Rollback to previous value on error
 */
export function rollbackQuery(
  queryClient: QueryClient,
  queryKey: unknown[],
  previousValue: unknown
) {
  queryClient.setQueryData(queryKey, previousValue);
}

/**
 * Create a temporary ID for optimistic updates
 */
export function createTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Check if an ID is a temporary ID
 */
export function isTempId(id: string) {
  return id.startsWith("temp-");
}
