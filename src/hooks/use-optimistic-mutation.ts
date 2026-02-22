/**
 * useOptimisticMutation Hook
 *
 * Wrapper around TanStack Query mutation with optimistic updates.
 * Provides instant UI feedback before server confirmation.
 */

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

interface OptimisticMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "onMutate"> {
  queryKey: unknown[];
  onOptimisticUpdate?: (variables: TVariables) => void | Promise<void>;
}

interface OptimisticContext<TPrevious> {
  previousData: TPrevious;
}

export function useOptimisticMutation<TData, TError, TVariables, TContext = unknown>({
  queryKey,
  onOptimisticUpdate,
  ...options
}: OptimisticMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Apply optimistic update
      if (onOptimisticUpdate) {
        await onOptimisticUpdate(variables);
      }

      // Return context with previous data for rollback
      return { previousData } as TContext & OptimisticContext<typeof previousData>;
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context && typeof context === "object" && "previousData" in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: unknown }).previousData);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Refetch after success or error to ensure server state
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook for optimistic updates to a list (e.g., adding/removing items)
 */
export function useOptimisticListMutation<TItem extends { id: string }>({
  queryKey,
  addFn,
  removeFn,
  updateFn,
}: {
  queryKey: unknown[];
  addFn?: (variables: TItem) => Promise<unknown>;
  removeFn?: (variables: { id: string }) => Promise<unknown>;
  updateFn?: (variables: { id: string; updates: Partial<TItem> }) => Promise<unknown>;
}) {
  const queryClient = useQueryClient();

  const add = useOptimisticMutation({
    queryKey,
    mutationFn: addFn!,
    onOptimisticUpdate: (newItem) => {
      const previousData = queryClient.getQueryData<TItem[]>(queryKey) || [];
      queryClient.setQueryData<TItem[]>(queryKey, [...previousData, newItem as TItem]);
    },
  });

  const remove = useOptimisticMutation({
    queryKey,
    mutationFn: removeFn!,
    onOptimisticUpdate: ({ id }) => {
      const previousData = queryClient.getQueryData<TItem[]>(queryKey) || [];
      queryClient.setQueryData<TItem[]>(
        queryKey,
        previousData.filter((item) => item.id !== id)
      );
    },
  });

  const update = useOptimisticMutation({
    queryKey,
    mutationFn: updateFn!,
    onOptimisticUpdate: ({ id, updates }) => {
      const previousData = queryClient.getQueryData<TItem[]>(queryKey) || [];
      queryClient.setQueryData<TItem[]>(
        queryKey,
        previousData.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    },
  });

  return { add, remove, update };
}
