/**
 * useGlobalShortcut Hook
 *
 * Detects keyboard shortcuts across the application.
 * Handles Cmd+K (Command Palette), Cmd+/ (Search), etc.
 */

import { useEffect, useRef } from "react";

interface ShortcutOptions {
  /**
   * Key combination to listen for (e.g., "cmd+k", "ctrl+k")
   */
  key: string;
  /**
   * Callback when shortcut is triggered
   */
  callback: (event: KeyboardEvent) => void;
  /**
   * Whether the shortcut is currently enabled
   */
  enabled?: boolean;
  /**
   * Prevent default browser behavior
   */
  preventDefault?: boolean;
}

/**
 * Normalize a key string for comparison
 */
function normalizeKey(event: KeyboardEvent): string {
  const parts: string[] = [];

  // Platform-specific modifier
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (cmdOrCtrl) parts.push(isMac ? "cmd" : "ctrl");

  // Main key
  const key = event.key.toLowerCase();
  parts.push(key);

  return parts.join("+");
}

/**
 * Parse a shortcut string into normalized form
 */
function parseShortcut(shortcut: string): string {
  return shortcut.toLowerCase().replace(/\s+/g, "").replace("ctrl", "cmd");
}

/**
 * Hook to register global keyboard shortcuts
 *
 * @example
 * ```tsx
 * useGlobalShortcut({
 *   key: "cmd+k",
 *   callback: () => setCommandMenuOpen(true),
 * });
 * ```
 */
export function useGlobalShortcut(options: ShortcutOptions): void {
  const { key, callback, enabled = true, preventDefault = true } = options;
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const normalized = normalizeKey(event);
      const targetShortcut = parseShortcut(key);

      if (normalized === targetShortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    // Add event listener with capture phase for early detection
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [key, enabled, preventDefault]);
}

/**
 * Common shortcuts
 */
export const shortcuts = {
  commandPalette: "cmd+k",
  search: "cmd+/",
  settings: "cmd+,",
  notifications: "cmd+shift+n",
} as const;
