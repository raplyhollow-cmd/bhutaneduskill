"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Custom hook for debounced auto-save functionality
 *
 * Features:
 * - Debounces save calls to avoid excessive API calls
 * - Tracks saving state and errors
 * - Handles race conditions by ignoring stale saves
 * - Cleanup on unmount
 *
 * @param saveFn - Async function to save data
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 *
 * @returns { debouncedSave, isSaving, lastSaved, saveError }
 *
 * @example
 * ```tsx
 * const { debouncedSave, isSaving, lastSaved, saveError } = useDebouncedSave(
 *   async (data) => await api.save(data),
 *   500
 * )
 *
 * // Trigger save on form change
 * useEffect(() => {
 *   debouncedSave(formData)
 * }, [formData, debouncedSave])
 * ```
 */
export interface UseDebouncedSaveOptions<T> {
  saveFn: (data: T) => Promise<void>
  delay?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface DebouncedSaveResult<T> {
  debouncedSave: (data: T) => void
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null
  clearError: () => void
  saveNow: (data: T) => Promise<void>
}

export function useDebouncedSave<T = unknown>({
  saveFn,
  delay = 500,
  onSuccess,
  onError,
}: UseDebouncedSaveOptions<T>): DebouncedSaveResult<T> {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<Error | null>(null)

  // Track pending save data
  const pendingDataRef = useRef<T | null>(null)
  // Track the latest save promise to handle race conditions
  const saveIdRef = useRef(0)

  // Clear error helper
  const clearError = useCallback(() => {
    setSaveError(null)
  }, [])

  // Perform the actual save operation
  const performSave = useCallback(
    async (data: T, saveId: number): Promise<void> => {
      try {
        await saveFn(data)

        // Only update state if this is still the latest save
        if (saveId === saveIdRef.current) {
          setLastSaved(new Date())
          setIsSaving(false)
          setSaveError(null)
          onSuccess?.(data)
        }
      } catch (error) {
        // Only update error state if this is still the latest save
        if (saveId === saveIdRef.current) {
          const errorObj =
            error instanceof Error ? error : new Error("Save failed")
          setSaveError(errorObj)
          setIsSaving(false)
          onError?.(errorObj)
        }
      }
    },
    [saveFn, onSuccess, onError]
  )

  // Debounced save function - schedules a save after delay
  const debouncedSave = useCallback(
    (data: T) => {
      // Store the pending data
      pendingDataRef.current = data
      setIsSaving(true)
      clearError()

      // Increment save ID to track this save attempt
      saveIdRef.current++
    },
    [clearError]
  )

  // Immediate save function (bypasses debounce)
  const saveNow = useCallback(
    async (data: T): Promise<void> => {
      setIsSaving(true)
      clearError()

      // Increment save ID to track this save attempt
      const currentSaveId = ++saveIdRef.current
      await performSave(data, currentSaveId)
    },
    [clearError, performSave]
  )

  // Effect that handles the actual debounced save
  useEffect(() => {
    if (!pendingDataRef.current) {
      return
    }

    // Set up timeout for debounced save
    const timeoutId = setTimeout(() => {
      if (pendingDataRef.current !== null) {
        const dataToSave = pendingDataRef.current
        const currentSaveId = saveIdRef.current

        // Clear pending data and perform save
        pendingDataRef.current = null
        performSave(dataToSave, currentSaveId)
      }
    }, delay)

    // Cleanup: cancel pending save if component unmounts or data changes
    return () => {
      clearTimeout(timeoutId)
    }
  }, [delay, performSave])

  // Cleanup on unmount - cancel any pending saves
  useEffect(
    () => () => {
      pendingDataRef.current = null
    },
    []
  )

  return {
    debouncedSave,
    isSaving,
    lastSaved,
    saveError,
    clearError,
    saveNow,
  }
}

/**
 * Time ago formatter for last saved display
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 10) return "just now"
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}
