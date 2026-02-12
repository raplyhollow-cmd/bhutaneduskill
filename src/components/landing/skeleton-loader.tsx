"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden ${className}`}
    >
      <div className="skeleton h-40 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3, className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton h-10 w-32 rounded-lg ${className}`} />
  );
}

// Shimmer effect for button borders
export function ShimmerButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-orange-500/25 ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </button>
  );
}

// Premium shimmer card
export function ShimmerCard({
  children,
  className = "",
  shimmer = true,
}: {
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 ${className}`}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}
      {children}
    </div>
  );
}
