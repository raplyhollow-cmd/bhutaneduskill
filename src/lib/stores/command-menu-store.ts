/**
 * Command Menu Store
 *
 * Zustand store for managing command menu state.
 */

import { create } from "zustand";

interface CommandMenuState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  setIsOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
}

export const useCommandMenuStore = create<CommandMenuState>((set) => ({
  isOpen: false,
  query: "",
  selectedIndex: 0,

  setIsOpen: (open) => set({ isOpen: open }),

  setQuery: (query) => set({ query, selectedIndex: 0 }),

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  open: () => set({ isOpen: true, query: "", selectedIndex: 0 }),

  close: () => set({ isOpen: false, query: "", selectedIndex: 0 }),

  toggle: () => set((state) => ({
    isOpen: !state.isOpen,
    query: state.isOpen ? "" : state.query,
    selectedIndex: 0,
  })),

  reset: () => set({ query: "", selectedIndex: 0 }),
}));
