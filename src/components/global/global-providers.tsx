/**
 * Global Providers Client Component
 *
 * Contains all client-side global providers that need hooks.
 * This is imported by the root layout.
 *
 * IMPORTANT: Temporarily disabled CommandMenu and SlideOverProvider
 * due to hooks mismatch errors. These need to be refactored to avoid
 * conditional rendering with AnimatePresence.
 */

"use client";

/**
 * Global Providers Component
 *
 * Simplified version to fix hooks mismatch errors.
 * CommandMenu and SlideOverProvider are temporarily disabled.
 *
 * CRITICAL: Always render the same element with the same attributes
 * to avoid hydration mismatch. The data attribute is now static.
 */
export function GlobalProviders() {
  // Always render the same element with static attributes
  // This ensures consistent component tree structure AND no hydration mismatch
  return <div style={{ display: "none" }} aria-hidden="true" data-global-providers="true" />;
}
