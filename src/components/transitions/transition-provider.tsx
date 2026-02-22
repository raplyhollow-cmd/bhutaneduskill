/**
 * Transition Provider
 *
 * Wraps the app with AnimatePresence for route transitions.
 * This should be placed near the root of the app.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";

interface TransitionProviderProps {
  children: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
}

export function TransitionProvider({
  children,
  mode = "wait",
}: TransitionProviderProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode={mode} key={pathname}>
      {children}
    </AnimatePresence>
  );
}
