"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircuitBackgroundProps {
  className?: string
  opacity?: number
  animated?: boolean
  variant?: "light" | "dark"
}

/**
 * CircuitBackground - Animated circuit board/tech patterns
 * Creates immediate tech credibility, feels modern and premium
 *
 * @example
 * <CircuitBackground opacity={0.1} animated />
 */
export function CircuitBackground({
  className,
  opacity = 0.08,
  animated = true,
  variant = "light"
}: CircuitBackgroundProps) {
  const gridColor = variant === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
  const dotColor = variant === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
  const lineColor = variant === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: variant === "dark"
            ? "linear-gradient(to bottom right, #0a0a0a, #171717, #0a0a0a)"
            : "linear-gradient(to bottom right, #fafafa, #f5f5f5, #fafafa)"
        }}
      />

      {/* SVG circuit pattern with subtle animation */}
      <svg
        className={cn(
          "absolute inset-0 w-full h-full",
          animated && "animate-pulse-slow"
        )}
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity }}
      >
        <defs>
          {/* Circuit pattern definition */}
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            {/* Grid lines */}
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill="none"
              stroke={gridColor}
              strokeWidth="0.5"
            />

            {/* Horizontal circuit lines */}
            <line
              x1="0"
              y1="25"
              x2="100"
              y2="25"
              stroke={lineColor}
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="75"
              x2="100"
              y2="75"
              stroke={lineColor}
              strokeWidth="1"
            />

            {/* Vertical circuit lines */}
            <line
              x1="25"
              y1="0"
              x2="25"
              y2="100"
              stroke={lineColor}
              strokeWidth="1"
            />
            <line
              x1="75"
              y1="0"
              x2="75"
              y2="100"
              stroke={lineColor}
              strokeWidth="1"
            />

            {/* Circuit nodes (dots) */}
            <circle cx="25" cy="25" r="1.5" fill={dotColor} />
            <circle cx="75" cy="25" r="1.5" fill={dotColor} />
            <circle cx="25" cy="75" r="1.5" fill={dotColor} />
            <circle cx="75" cy="75" r="1.5" fill={dotColor} />
            <circle cx="50" cy="50" r="1" fill={dotColor} />
          </pattern>

          {/* Animated circuit paths */}
          <pattern
            id="circuit-paths"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            {/* Circuit trace 1 */}
            <path
              d="M0,50 L30,50 L30,30 L50,30 L50,70 L70,70 L70,50 L100,50"
              fill="none"
              stroke={lineColor}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Circuit trace 2 */}
            <path
              d="M100,150 L130,150 L130,130 L150,130 L150,170 L170,170 L170,150 L200,150"
              fill="none"
              stroke={lineColor}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Circuit trace 3 */}
            <path
              d="M150,0 L150,20 L130,20 L130,40 L170,40 L170,20 L200,20"
              fill="none"
              stroke={lineColor}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </pattern>
        </defs>

        {/* Apply patterns */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-pattern)" />
        <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-paths)" />
      </svg>

      {/* Additional subtle glow spots for depth */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: variant === "dark"
            ? "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: variant === "dark"
            ? "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
        }}
      />
    </div>
  )
}

/**
 * CircuitBackgroundFixed - Fixed position circuit background
 * Useful for full-page backgrounds
 */
export function CircuitBackgroundFixed(props: CircuitBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10">
      <CircuitBackground {...props} />
    </div>
  )
}
