/**
 * Command Menu
 *
 * Global command palette (Cmd+K) for quick navigation and actions.
 * Inspired by Vercel, Linear, and Spotlight search.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommandMenuStore } from "@/lib/stores/command-menu-store";
import { useGlobalShortcut, shortcuts } from "@/hooks/use-global-shortcut";
import { CommandInput } from "./command-input";
import { CommandList } from "./command-list";
import type { PortalType } from "@/config/portal-config";
import { getAllCommandsForPortal } from "@/lib/command-registry";
import { ceramicDuration, ceramicEasing } from "@/lib/design-system";

interface CommandMenuProps {
  portal: PortalType;
}

export function CommandMenu({ portal }: CommandMenuProps) {
  const {
    isOpen,
    query,
    selectedIndex,
    setIsOpen,
    setQuery,
    setSelectedIndex,
    close,
    reset,
  } = useCommandMenuStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const commands = getAllCommandsForPortal(portal);

  // Global shortcut to open command menu
  useGlobalShortcut({
    key: shortcuts.commandPalette,
    callback: () => {
      setIsOpen(true);
      // Focus input after menu opens
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    enabled: true,
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Reset when menu closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle command selection
  const handleSelect = useCallback(
    (item: { action: () => void }) => {
      close();
      // Execute action after close animation
      setTimeout(() => {
        item.action();
      }, 100);
    },
    [close]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: parseFloat(ceramicDuration.fast) }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={close}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: parseFloat(ceramicDuration.default),
                ease: ceramicEasing.default,
              }}
              className="w-full max-w-xl mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-ceramic-border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-ceramic-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-ceramic-primary">
                      Command Menu
                    </h2>
                    <div className="flex items-center gap-2">
                      <kbd className="text-xs text-ceramic-dimmed px-2 py-0.5 bg-ceramic-gray-100 rounded border border-ceramic-border">
                        ↑↓ to navigate
                      </kbd>
                      <kbd className="text-xs text-ceramic-dimmed px-2 py-0.5 bg-ceramic-gray-100 rounded border border-ceramic-border">
                        Enter to select
                      </kbd>
                      <kbd className="text-xs text-ceramic-dimmed px-2 py-0.5 bg-ceramic-gray-100 rounded border border-ceramic-border">
                        Esc to close
                      </kbd>
                    </div>
                  </div>
                  <CommandInput
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {/* List */}
                <CommandList
                  groups={[
                    {
                      id: "commands",
                      label: "",
                      items: commands,
                    },
                  ]}
                  query={query}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                  onSelectedIndexChange={setSelectedIndex}
                />

                {/* Footer */}
                <div className="p-3 border-t border-ceramic-border bg-ceramic-gray-50">
                  <div className="flex items-center justify-between text-xs text-ceramic-dimmed">
                    <span>Bhutan EduSkill</span>
                    <button
                      onClick={close}
                      className="flex items-center gap-1 hover:text-ceramic-primary transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
