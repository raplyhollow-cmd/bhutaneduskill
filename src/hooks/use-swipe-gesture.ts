/**
 * SWIPE GESTURE HOOK
 *
 * Touch-friendly swipe gesture detection for mobile interactions.
 * Inspired by iOS and Android gesture handling.
 *
 * FEATURES:
 * - Detect swipe direction (left, right, up, down)
 * - Configurable threshold and velocity
 * - Touch-friendly 44px minimum touch targets
 * - Smooth animations following gesture
 * - Callbacks for swipe start, move, end
 *
 * @example
 * ```tsx
 * import { useSwipeGesture } from "@/hooks/use-swipe-gesture"
 *
 * function SwipeableCard() {
 *   const { ref } = useSwipeGesture({
 *     onSwipeLeft: () => console.log("Swiped left"),
 *     onSwipeRight: () => console.log("Swiped right"),
 *     threshold: 50,
 *   })
 *
 *   return <div ref={ref} className="card">...</div>
 * }
 * ```
 */

"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"

export interface SwipeGestureOptions {
  onSwipeLeft?: (event: TouchEvent) => void
  onSwipeRight?: (event: TouchEvent) => void
  onSwipeUp?: (event: TouchEvent) => void
  onSwipeDown?: (event: TouchEvent) => void
  onSwipeStart?: (event: TouchEvent) => void
  onSwipeMove?: (event: TouchEvent, delta: { x: number; y: number }) => void
  onSwipeEnd?: (event: TouchEvent, direction: SwipeDirection | null) => void
  threshold?: number
  velocityThreshold?: number
  restrictToVertical?: boolean
  restrictToHorizontal?: boolean
  preventDefault?: boolean
}

export type SwipeDirection = "left" | "right" | "up" | "down" | null

export interface SwipeGestureResult {
  ref: (node: HTMLElement | null) => void
  swiping: boolean
  direction: SwipeDirection
  delta: { x: number; y: number }
  cancelSwipe: () => void
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  threshold = 50,
  velocityThreshold = 0.3,
  restrictToVertical = false,
  restrictToHorizontal = false,
  preventDefault = true,
}: SwipeGestureOptions = {}): SwipeGestureResult {
  const [swiping, setSwiping] = useState(false)
  const [direction, setDirection] = useState<SwipeDirection>(null)
  const [delta, setDelta] = useState({ x: 0, y: 0 })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }

    setDelta({ x: 0, y: 0 })
    setDirection(null)
    setSwiping(true)

    onSwipeStart?.(e)
  }, [onSwipeStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return

    const touch = e.touches[0]
    const currentDelta = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    }

    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    // Use RAF to prevent jank
    rafRef.current = requestAnimationFrame(() => {
      setDelta(currentDelta)

      // Determine direction
      let newDirection: SwipeDirection = null
      if (Math.abs(currentDelta.x) > Math.abs(currentDelta.y)) {
        if (!restrictToVertical) {
          newDirection = currentDelta.x > 0 ? "right" : "left"
        }
      } else {
        if (!restrictToHorizontal) {
          newDirection = currentDelta.y > 0 ? "down" : "up"
        }
      }

      setDirection(newDirection)
      onSwipeMove?.(e, currentDelta)
    })

    if (preventDefault) {
      e.preventDefault()
    }
  }, [onSwipeMove, preventDefault, restrictToVertical, restrictToHorizontal])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const finalDelta = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    }

    const deltaTime = Date.now() - touchStartRef.current.time
    const velocityX = Math.abs(finalDelta.x) / deltaTime
    const velocityY = Math.abs(finalDelta.y) / deltaTime

    let triggeredDirection: SwipeDirection = null

    // Check if swipe meets threshold or velocity requirement
    if (
      Math.abs(finalDelta.x) > threshold ||
      (Math.abs(finalDelta.x) > 20 && velocityX > velocityThreshold)
    ) {
      if (!restrictToVertical) {
        triggeredDirection = finalDelta.x > 0 ? "right" : "left"
      }
    } else if (
      Math.abs(finalDelta.y) > threshold ||
      (Math.abs(finalDelta.y) > 20 && velocityY > velocityThreshold)
    ) {
      if (!restrictToHorizontal) {
        triggeredDirection = finalDelta.y > 0 ? "down" : "up"
      }
    }

    // Trigger callbacks
    if (triggeredDirection) {
      switch (triggeredDirection) {
        case "left":
          onSwipeLeft?.(e)
          break
        case "right":
          onSwipeRight?.(e)
          break
        case "up":
          onSwipeUp?.(e)
          break
        case "down":
          onSwipeDown?.(e)
          break
      }
    }

    setSwiping(false)
    setDirection(null)
    setDelta({ x: 0, y: 0 })

    // Cancel RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    touchStartRef.current = null

    onSwipeEnd?.(e, triggeredDirection)
  }, [
    threshold,
    velocityThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeEnd,
    restrictToVertical,
    restrictToHorizontal,
  ])

  const cancelSwipe = useCallback(() => {
    setSwiping(false)
    setDirection(null)
    setDelta({ x: 0, y: 0 })
    touchStartRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Attach event listeners
  const ref = useCallback((node: HTMLElement | null) => {
    if (node === null) {
      // Cleanup previous element
      if (elementRef.current) {
        elementRef.current.removeEventListener("touchstart", handleTouchStart as EventListener)
        elementRef.current.removeEventListener("touchmove", handleTouchMove as EventListener)
        elementRef.current.removeEventListener("touchend", handleTouchEnd as EventListener)
      }
      elementRef.current = null
      return
    }

    elementRef.current = node
    node.addEventListener("touchstart", handleTouchStart as EventListener, { passive: !preventDefault })
    node.addEventListener("touchmove", handleTouchMove as EventListener, { passive: !preventDefault })
    node.addEventListener("touchend", handleTouchEnd as EventListener, { passive: true })
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault])

  return {
    ref,
    swiping,
    direction,
    delta,
    cancelSwipe,
  }
}

/**
 * Hook for swipe-to-delete functionality
 *
 * @example
 * ```tsx
 * function SwipeableListItem({ item, onDelete }) {
 *   const { ref, swiping, delta } = useSwipeToDelete({
 *     onDelete: () => onDelete(item.id),
 *     threshold: 80,
 *   })
 *
 *   return (
 *     <div ref={ref} className="relative overflow-hidden">
 *       <div
 *         className="bg-red-500 absolute inset-0 flex items-center justify-end px-4"
 *         style={{ transform: `translateX(${Math.min(0, delta.x)}px)` }}
 *       >
 *         <span className="text-white">Delete</span>
 *       </div>
 *       <div
 *         className="bg-white relative z-10 transition-transform"
 *         style={{ transform: `translateX(${delta.x}px)` }}
 *       >
 *         {item.name}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export interface UseSwipeToDeleteOptions extends Omit<SwipeGestureOptions, "onSwipeLeft"> {
  onDelete: () => void
  confirmThreshold?: number
}

export function useSwipeToDelete({
  onDelete,
  confirmThreshold = 150,
  ...options
}: UseSwipeToDeleteOptions) {
  const [confirmed, setConfirmed] = useState(false)

  return useSwipeGesture({
    ...options,
    restrictToHorizontal: true,
    onSwipeLeft: (e) => {
      setConfirmed(true)
      onDelete()
    },
    onSwipeMove: (e, delta) => {
      // Trigger delete if swiped past confirm threshold
      if (delta.x < -confirmThreshold) {
        setConfirmed(true)
        onDelete()
      }
    },
    onSwipeEnd: () => {
      setConfirmed(false)
    },
  })
}

/**
 * Hook for swipe-to-refresh functionality
 *
 * @example
 * ```tsx
 * function RefreshableList({ onRefresh, children }) {
 *   const { ref, pulling, progress, canRelease } = useSwipeToRefresh({
 *     onRefresh,
 *     threshold: 80,
 *   })
 *
 *   return (
 *     <div ref={ref} className="relative">
 *       {pulling && (
 *         <div className="absolute inset-x-0 top-0 h-12 flex items-center justify-center">
 *           {canRelease ? "Release to refresh" : "Pull to refresh..."}
 *         </div>
 *       )}
 *       <div style={{ transform: `translateY(${progress}px)` }}>
 *         {children}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export interface UseSwipeToRefreshOptions extends Omit<SwipeGestureOptions, "onSwipeDown"> {
  onRefresh: () => Promise<void> | void
  threshold?: number
  debounceMs?: number
}

export function useSwipeToRefresh({
  onRefresh,
  threshold = 80,
  debounceMs = 300,
  ...options
}: UseSwipeToRefreshOptions) {
  const [refreshing, setRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const [canRelease, setCanRelease] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  return useSwipeGesture({
    ...options,
    restrictToVertical: true,
    onSwipeMove: (e, delta) => {
      const progress = Math.max(0, Math.min(delta.y, threshold * 1.5))
      setPullProgress(progress)
      setCanRelease(progress >= threshold)
    },
    onSwipeEnd: async (e, direction) => {
      if (canRelease && direction === "down") {
        setRefreshing(true)

        // Debounce the refresh call
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {
          await onRefresh()
          setRefreshing(false)
          setPullProgress(0)
          setCanRelease(false)
        }, debounceMs)
      } else {
        setPullProgress(0)
        setCanRelease(false)
      }
    },
  })
}

export default useSwipeGesture
