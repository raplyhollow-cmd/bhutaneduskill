"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HeroGlowProps {
  className?: string
  colors?: "purple-blue" | "pink-purple" | "blue-green" | "orange-red"
  intensity?: "subtle" | "medium" | "strong"
  animated?: boolean
}

/**
 * HeroGlow - Multi-colored glow gradients for hero sections
 * Creates depth, focus, and premium feel
 *
 * Performance optimizations:
 * - Uses CSS classes instead of inline styles where possible
 * - will-change for GPU-accelerated animations
 * - Transform-based animations (better than opacity)
 *
 * @example
 * <HeroGlow colors="purple-blue" intensity="medium" animated />
 */
export function HeroGlow({
  className,
  colors = "purple-blue",
  intensity = "medium",
  animated = true
}: HeroGlowProps) {
  // Pre-computed position styles (memoized to avoid re-computation)
  const positionStyles = React.useMemo(() => ({
    "top-0 left-0": { top: "-10%", left: "-10%" },
    "top-0 right-0": { top: "-10%", right: "-10%" },
    "bottom-0 left-0": { bottom: "-10%", left: "-10%" },
    "bottom-0 right-0": { bottom: "-10%", right: "-10%" },
    "bottom-0 left-1/2": { bottom: "-10%", left: "50%", transform: "translate(-50%, -50%)" }
  }), [])

  const intensityMap = {
    subtle: { opacityClass: "opacity-[0.15]", blur: "blur-3xl" },
    medium: { opacityClass: "opacity-[0.25]", blur: "blur-3xl" },
    strong: { opacityClass: "opacity-[0.4]", blur: "blur-3xl" }
  }

  const colorSchemes = {
    "purple-blue": [
      { color: "bg-purple-500", position: "top-0 left-0", delay: "" },
      { color: "bg-blue-500", position: "top-0 right-0", delay: "delay-1000" },
      { color: "bg-violet-500", position: "bottom-0 left-1/2", delay: "delay-700" }
    ],
    "pink-purple": [
      { color: "bg-pink-500", position: "top-0 left-0", delay: "" },
      { color: "bg-purple-500", position: "top-0 right-0", delay: "delay-1000" },
      { color: "bg-fuchsia-500", position: "bottom-0 left-1/2", delay: "delay-700" }
    ],
    "blue-green": [
      { color: "bg-blue-500", position: "top-0 left-0", delay: "" },
      { color: "bg-cyan-500", position: "top-0 right-0", delay: "delay-1000" },
      { color: "bg-teal-500", position: "bottom-0 left-1/2", delay: "delay-700" }
    ],
    "orange-red": [
      { color: "bg-orange-500", position: "top-0 left-0", delay: "" },
      { color: "bg-red-500", position: "top-0 right-0", delay: "delay-1000" },
      { color: "bg-amber-500", position: "bottom-0 left-1/2", delay: "delay-700" }
    ]
  }

  const scheme = colorSchemes[colors]
  const { opacityClass, blur } = intensityMap[intensity]

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {scheme.map((glow, index) => (
        <div
          key={index}
          className={cn(
            "absolute w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2",
            glow.color,
            blur,
            opacityClass,
            animated && `animate-pulse ${glow.delay}`,
            // GPU acceleration hint for animated properties
            animated && "will-change-[opacity,transform]"
          )}
          style={positionStyles[glow.position as keyof typeof positionStyles]}
        />
      ))}

      {/* Additional ambient glow overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-black/5",
          animated && "animate-pulse-slow",
          animated && "will-change-opacity"
        )}
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * HeroGlowSpot - Single controllable glow spot
 * Performance optimized with CSS classes and will-change
 */
interface HeroGlowSpotProps {
  className?: string
  color?: string
  size?: "sm" | "md" | "lg" | "xl"
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  opacity?: number
  animated?: boolean
}

export function HeroGlowSpot({
  className,
  color = "bg-purple-500",
  size = "xl",
  position = "top-left",
  opacity = 0.25,
  animated = true
}: HeroGlowSpotProps) {
  const sizeMap = {
    sm: "w-64 h-64",
    md: "w-80 h-80",
    lg: "w-96 h-96",
    xl: "w-[30rem] h-[30rem]"
  }

  const positionMap = {
    "top-left": "-top-20 -left-20",
    "top-right": "-top-20 -right-20",
    "bottom-left": "-bottom-20 -left-20",
    "bottom-right": "-bottom-20 -right-20",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  }

  // Convert opacity to CSS class for better performance
  const opacityClass = `opacity-[${opacity}]`

  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none",
        sizeMap[size],
        positionMap[position],
        color,
        animated && "animate-pulse",
        // GPU acceleration for smoother animations
        animated && "will-change-[opacity,transform]",
        opacityClass,
        className
      )}
      aria-hidden="true"
    />
  )
}

/**
 * AmbientGlow - Subtle ambient background glow
 * For cards, sections, and smaller containers
 */
interface AmbientGlowProps {
  className?: string
  color?: string
  position?: "top" | "bottom" | "left" | "right" | "center"
}

export function AmbientGlow({
  className,
  color = "from-purple-500/10 to-blue-500/10",
  position = "center"
}: AmbientGlowProps) {
  const positionMap = {
    top: "bg-gradient-to-b",
    bottom: "bg-gradient-to-t",
    left: "bg-gradient-to-r",
    right: "bg-gradient-to-l",
    center: "bg-gradient-to-br"
  }

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none",
        positionMap[position],
        color,
        className
      )}
      aria-hidden="true"
    />
  )
}

/**
 * CardGlow - Glow effect for card hover states
 * Performance optimized with will-change for smooth hover transitions
 */
export function CardGlow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 will-change-opacity",
        className
      )}
      aria-hidden="true"
    />
  )
}
