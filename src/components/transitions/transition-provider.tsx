/**
 * Transition Provider
 *
 * DISABLED: AnimatePresence was causing hooks mismatch errors with route transitions.
 * This provider has been simplified to always render the same structure.
 *
 * TODO: Re-implement AnimatePresence in a way that doesn't change component structure
 */

"use client";

import { usePathname } from "next/navigation";

interface TransitionProviderProps {
  children: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}

export function TransitionProvider({
  children,
  mode = "wait",
}: TransitionProviderProps) {
  const pathname = usePathname();

  // Simple wrapper that always renders the same structure
  // No AnimatePresence means no transitions, but also no hooks errors
  return <div key={pathname}>{children}</div>;
}
