"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  FileText,
  GraduationCap,
  BookOpen,
  Briefcase,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SearchScope = "all" | "careers" | "scholarships" | "resources";

export interface SearchDialogProps {
  /**
   * Placeholder text for the search input
   * @default "Search careers, scholarships, resources..."
   */
  placeholder?: string;
  /**
   * Scope to limit search results
   * @default "all"
   */
  searchScope?: SearchScope;
  /**
   * Whether the dialog is open (controlled mode)
   */
  open?: boolean;
  /**
   * Callback when dialog open state changes
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Optional trigger button - if provided, will be shown and control dialog
   */
  trigger?: React.ReactNode;
  /**
   * Custom search data sources - overrides default mock data
   */
  searchItems?: SearchItem[];
  /**
   * Custom search function - allows async search from API
   */
  onSearch?: (query: string, scope: SearchScope) => Promise<SearchItem[]>;
  /**
   * Callback when an item is selected
   */
  onSelect?: (item: SearchItem) => void;
  /**
   * Additional CSS classes for the dialog
   */
  className?: string;
}

export interface SearchItem {
  id: string;
  type: "career" | "scholarship" | "resource";
  title: string;
  description: string;
  url?: string;
  category?: string;
  tags?: string[];
  icon?: React.ReactNode;
}

// ============================================================================
// MOCK DATA - Production ready structure
// ============================================================================

const MOCK_SEARCH_ITEMS: SearchItem[] = [
  // Careers
  {
    id: "c1",
    type: "career",
    title: "Software Engineer",
    description: "Design, develop, and maintain software applications and systems.",
    url: "/dashboard/careers/software-engineer",
    category: "Technology",
    tags: ["IT", "Programming", "Development"],
  },
  {
    id: "c2",
    type: "career",
    title: "Data Scientist",
    description: "Analyze complex data to help organizations make better decisions.",
    url: "/dashboard/careers/data-scientist",
    category: "Technology",
    tags: ["IT", "Analytics", "Statistics"],
  },
  {
    id: "c3",
    type: "career",
    title: "Medical Doctor",
    description: "Diagnose and treat illnesses, injuries, and other health conditions.",
    url: "/dashboard/careers/medical-doctor",
    category: "Healthcare",
    tags: ["Medical", "Healthcare", "Science"],
  },
  {
    id: "c4",
    type: "career",
    title: "Civil Engineer",
    description: "Design and supervise the construction of infrastructure projects.",
    url: "/dashboard/careers/civil-engineer",
    category: "Engineering",
    tags: ["Construction", "Infrastructure", "Design"],
  },
  {
    id: "c5",
    type: "career",
    title: "Teacher",
    description: "Educate students and help them develop critical thinking skills.",
    url: "/dashboard/careers/teacher",
    category: "Education",
    tags: ["Teaching", "Education", "Mentoring"],
  },
  {
    id: "c6",
    type: "career",
    title: "Nurse",
    description: "Provide patient care and support in various healthcare settings.",
    url: "/dashboard/careers/nurse",
    category: "Healthcare",
    tags: ["Medical", "Healthcare", "Patient Care"],
  },
  {
    id: "c7",
    type: "career",
    title: "Accountant",
    description: "Manage financial records and ensure tax compliance.",
    url: "/dashboard/careers/accountant",
    category: "Business",
    tags: ["Finance", "Accounting", "Business"],
  },
  {
    id: "c8",
    type: "career",
    title: "Graphic Designer",
    description: "Create visual content for brands, marketing, and communications.",
    url: "/dashboard/careers/graphic-designer",
    category: "Arts",
    tags: ["Design", "Creative", "Visual"],
  },
  // Scholarships
  {
    id: "s1",
    type: "scholarship",
    title: "RUB Merit Scholarship",
    description: "Full scholarship for meritorious students at Royal University of Bhutan.",
    url: "/dashboard/scholarships/rub-merit",
    category: "Education",
    tags: ["RUB", "Full Scholarship", "Merit-based"],
  },
  {
    id: "s2",
    type: "scholarship",
    title: "KCSE Scholarship Program",
    description: "Support for Class 10 students pursuing higher secondary education.",
    url: "/dashboard/scholarships/kcse",
    category: "Education",
    tags: ["Class 10", "Secondary", "Financial Aid"],
  },
  {
    id: "s3",
    type: "scholarship",
    title: "Study in India Scholarship",
    description: "Government scholarship for undergraduate studies in Indian universities.",
    url: "/dashboard/scholarships/study-india",
    category: "International",
    tags: ["India", "International", "Undergraduate"],
  },
  {
    id: "s4",
    type: "scholarship",
    title: "STEM Excellence Award",
    description: "Scholarship for students excelling in Science, Technology, Engineering, and Mathematics.",
    url: "/dashboard/scholarships/stem-excellence",
    category: "STEM",
    tags: ["STEM", "Science", "Technology"],
  },
  // Resources
  {
    id: "r1",
    type: "resource",
    title: "RIASEC Career Assessment",
    description: "Discover your ideal career path based on your interests.",
    url: "/dashboard/assessment/riasec",
    category: "Assessment",
    tags: ["Career Test", "Personality", "Planning"],
  },
  {
    id: "r2",
    type: "resource",
    title: "Study Abroad Guide",
    description: "Complete guide to studying abroad for Bhutanese students.",
    url: "/dashboard/resources/study-abroad",
    category: "Guide",
    tags: ["International", "Education", "Planning"],
  },
  {
    id: "r3",
    type: "resource",
    title: "Subject Selection Guide",
    description: "Help choosing the right subjects for Class 11-12.",
    url: "/dashboard/resources/subject-selection",
    category: "Guide",
    tags: ["Class 11", "Class 12", "Academic"],
  },
  {
    id: "r4",
    type: "resource",
    title: "Career Planning Worksheet",
    description: "Interactive worksheet to plan your career path step by step.",
    url: "/dashboard/resources/career-worksheet",
    category: "Tool",
    tags: ["Planning", "Worksheet", "Interactive"],
  },
  {
    id: "r5",
    type: "resource",
    title: "MBTI Personality Assessment",
    description: "Understand your personality type and suitable careers.",
    url: "/dashboard/assessment/mbti",
    category: "Assessment",
    tags: ["Personality", "Career Test", "MBTI"],
  },
  {
    id: "r6",
    type: "resource",
    title: "Resume Building Guide",
    description: "Create a professional resume that stands out to employers.",
    url: "/dashboard/resources/resume-guide",
    category: "Guide",
    tags: ["Resume", "Job Search", "Career"],
  },
];

// ============================================================================
// TYPE ICONS CONFIGURATION
// ============================================================================

const TYPE_ICONS: Record<SearchItem["type"], React.ReactNode> = {
  career: <Briefcase className="h-4 w-4" />,
  scholarship: <GraduationCap className="h-4 w-4" />,
  resource: <BookOpen className="h-4 w-4" />,
};

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  career: "Career",
  scholarship: "Scholarship",
  resource: "Resource",
};

const TYPE_COLORS: Record<SearchItem["type"], string> = {
  career: "text-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  scholarship: "text-purple-500 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  resource: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight matching text in the search result
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="rounded-sm bg-yellow-200/70 px-0.5 text-foreground dark:bg-yellow-500/30">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Convert scope to item type for comparison
 */
function scopeToItemType(scope: SearchScope): SearchItem["type"] | "all" {
  switch (scope) {
    case "careers":
      return "career";
    case "scholarships":
      return "scholarship";
    case "resources":
      return "resource";
    default:
      return "all";
  }
}

/**
 * Filter and score search items based on query
 */
function performSearch(items: SearchItem[], query: string, scope: SearchScope): SearchItem[] {
  const itemTypeFilter = scopeToItemType(scope);

  if (!query.trim()) {
    // Return all items within scope, sorted by type
    return items.filter((item) => itemTypeFilter === "all" || item.type === itemTypeFilter);
  }

  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);

  return items
    .filter((item) => {
      // Filter by scope
      if (itemTypeFilter !== "all" && item.type !== itemTypeFilter) {
        return false;
      }

      // Search in title, description, category, and tags
      const searchableText = [
        item.title,
        item.description,
        item.category,
        ...(item.tags || []),
      ].join(" ").toLowerCase();

      return terms.some((term) => searchableText.includes(term));
    })
    .map((item) => {
      // Calculate relevance score
      let score = 0;
      const lowerTitle = item.title.toLowerCase();
      const lowerDescription = item.description.toLowerCase();
      const lowerCategory = (item.category || "").toLowerCase();

      // Title matches are most important
      terms.forEach((term) => {
        if (lowerTitle.includes(term)) {
          score += 10;
          // Exact word match gets bonus
          if (lowerTitle.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
        if (lowerDescription.includes(term)) {
          score += 3;
        }
        if (lowerCategory.includes(term)) {
          score += 2;
        }
        if (item.tags?.some((tag) => tag.toLowerCase().includes(term))) {
          score += 1;
        }
      });

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Group items by category
 */
function groupItemsByCategory(items: SearchItem[]): Record<string, SearchItem[]> {
  const grouped: Record<string, SearchItem[]> = {};

  items.forEach((item) => {
    const category = TYPE_LABELS[item.type];
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SearchDialog({
  placeholder = "Search careers, scholarships, resources...",
  searchScope = "all",
  open: controlledOpen,
  onOpenChange,
  trigger,
  searchItems,
  onSearch,
  onSelect,
  className,
}: SearchDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [internalOpen, setInternalOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Use controlled or uncontrolled mode
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  // Use custom items or mock data
  const allItems = searchItems || MOCK_SEARCH_ITEMS;

  // ============================================================================
  // SEARCH EFFECTS
  // ============================================================================

  React.useEffect(() => {
    const doSearch = async () => {
      setIsSearching(true);

      if (onSearch) {
        // Use custom search function (API call)
        try {
          const searchResults = await onSearch(query, searchScope);
          setResults(searchResults);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }
      } else {
        // Use local search
        // Simulate network delay for realistic loading state
        await new Promise((resolve) => setTimeout(resolve, 150));
        setResults(performSearch(allItems, query, searchScope));
      }

      setIsSearching(false);
    };

    const timeoutId = setTimeout(doSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [query, searchScope, allItems, onSearch]);

  // Reset selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // ============================================================================
  // KEYBOARD EVENT HANDLERS
  // ============================================================================

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      // Global keyboard shortcuts to open dialog
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
        return;
      }

      // "/" key to open dialog (only when not typing in an input)
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setOpen(true);
          return;
        }
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
        return;
      }

      // Arrow key navigation when open
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && results.length > 0) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    },
    [isOpen, results.length, selectedIndex, setOpen]
  );

  // Register/unregister global keyboard event listeners
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the dialog is rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-search-item]");
      const selectedItem = items[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelect = (item: SearchItem) => {
    onSelect?.(item);

    // Navigate to URL if provided
    if (item.url) {
      window.location.href = item.url;
    }

    setOpen(false);
    setQuery("");
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const groupedResults = groupItemsByCategory(results);
  const categoryOrder = Object.keys(groupedResults);

  // Calculate flat list index for keyboard navigation
  const getFlatIndex = (categoryIndex: number, itemIndex: number) => {
    let index = 0;
    for (let i = 0; i < categoryIndex; i++) {
      index += groupedResults[categoryOrder[i]].length;
    }
    return index + itemIndex;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Trigger Button (if provided) */}
      {trigger && (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}

      {/* Dialog Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "relative w-full max-w-2xl overflow-hidden",
                  "rounded-xl bg-white dark:bg-gray-900",
                  "shadow-2xl shadow-black/20",
                  "border border-gray-200 dark:border-gray-800",
                  className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-dialog-title"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
                  <Search className="h-5 w-5 shrink-0 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    id="search-dialog-title"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                      "flex-1 bg-transparent outline-none",
                      "text-gray-900 dark:text-gray-100 placeholder:text-gray-400",
                      "text-base"
                    )}
                    autoComplete="off"
                    autoFocus
                  />
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
                  ) : query ? (
                    <button
                      onClick={() => setQuery("")}
                      className={cn(
                        "shrink-0 rounded-md p-1",
                        "text-gray-400 hover:text-gray-600",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "transition-colors"
                      )}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <kbd
                      className={cn(
                        "hidden sm:inline-flex",
                        "shrink-0 rounded-md px-2 py-1",
                        "bg-gray-100 dark:bg-gray-800",
                        "text-xs text-gray-500 dark:text-gray-400",
                        "font-mono"
                      )}
                    >
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Content */}
                <div
                  ref={listRef}
                  className={cn(
                    "max-h-[400px] overflow-y-auto",
                    "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
                    "scrollbar-track-transparent"
                  )}
                >
                  {isSearching ? (
                    // Loading State
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Searching...
                      </p>
                    </div>
                  ) : query && results.length === 0 ? (
                    // No Results State
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                          "bg-gray-100 dark:bg-gray-800"
                        )}
                      >
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        No results found
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        We couldn't find anything matching{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          &quot;{query}&quot;
                        </span>
                        . Try a different search term.
                      </p>
                    </div>
                  ) : !query ? (
                    // Empty State with Quick Links
                    <div className="py-4">
                      <div className="px-4 mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quick Access
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 px-2">
                        {[
                          { type: "career", label: "Browse Careers", icon: Briefcase },
                          { type: "scholarship", label: "Scholarships", icon: GraduationCap },
                          { type: "resource", label: "Resources", icon: BookOpen },
                          { type: "assessment", label: "Assessments", icon: FileText },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => setQuery(item.label.split(" ")[0])}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left",
                              "text-sm text-gray-600 dark:text-gray-400",
                              "hover:bg-gray-100 dark:hover:bg-gray-800",
                              "transition-colors"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                            <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>

                      {/* Keyboard Shortcuts Help */}
                      <div className="mt-4 mx-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Keyboard Shortcuts
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Open search</span>
                            <div className="flex gap-1">
                              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                                {/^Mac/i.test(navigator.platform) ? "Cmd" : "Ctrl"}+K
                              </kbd>
                              <span className="text-gray-400">or</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                                /
                              </kbd>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Navigate</span>
                            <div className="flex gap-1">
                              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                                ↑
                              </kbd>
                              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                                ↓
                              </kbd>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Select</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                              Enter
                            </kbd>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Close</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[10px]">
                              Esc
                            </kbd>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Search Results
                    <div className="py-2">
                      {categoryOrder.map((category, categoryIndex) => {
                        const categoryItems = groupedResults[category];
                        if (!categoryItems.length) return null;

                        return (
                          <div key={category} className="mb-2 last:mb-0">
                            {/* Category Header */}
                            <div className="px-4 py-1.5">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {category}
                                <span className="ml-1 text-gray-400 dark:text-gray-500">
                                  ({categoryItems.length})
                                </span>
                              </span>
                            </div>

                            {/* Category Items */}
                            <div role="listbox" aria-label={`${category} results`}>
                              {categoryItems.map((item, itemIndex) => {
                                const flatIndex = getFlatIndex(categoryIndex, itemIndex);
                                const isSelected = flatIndex === selectedIndex;

                                return (
                                  <button
                                    key={item.id}
                                    data-search-item
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                      "flex items-start gap-3 w-full px-4 py-3 text-left",
                                      "transition-colors",
                                      isSelected
                                        ? "bg-gray-100 dark:bg-gray-800"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                      "outline-none",
                                      isSelected && "ring-inset ring-2 ring-gray-300 dark:ring-gray-600"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                  >
                                    {/* Type Icon */}
                                    <div
                                      className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                        TYPE_COLORS[item.type]
                                      )}
                                    >
                                      {item.icon || TYPE_ICONS[item.type]}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            "text-sm font-medium text-gray-900 dark:text-gray-100",
                                            isSelected && "text-gray-950 dark:text-white"
                                          )}
                                        >
                                          {highlightMatch(item.title, query)}
                                        </span>
                                        {item.category && (
                                          <span
                                            className={cn(
                                              "shrink-0 rounded-full px-2 py-0.5",
                                              "text-[10px] font-medium",
                                              "bg-gray-100 dark:bg-gray-800",
                                              "text-gray-600 dark:text-gray-400"
                                            )}
                                          >
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                      <p
                                        className={cn(
                                          "mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1"
                                        )}
                                      >
                                        {highlightMatch(item.description, query)}
                                      </p>
                                      {item.tags && item.tags.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {item.tags.slice(0, 3).map((tag) => (
                                            <span
                                              key={tag}
                                              className={cn(
                                                "inline-flex rounded px-1.5 py-0.5",
                                                "text-[10px]",
                                                "bg-gray-100 dark:bg-gray-800",
                                                "text-gray-500 dark:text-gray-400"
                                              )}
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Arrow Icon on Hover/Select */}
                                    <ArrowRight
                                      className={cn(
                                        "h-4 w-4 shrink-0 mt-2 transition-opacity",
                                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                      )}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {!query && (
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 py-3",
                      "border-t border-gray-200 dark:border-gray-800",
                      "bg-gray-50/50 dark:bg-gray-800/50"
                    )}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Search across {allItems.filter((i) => searchScope === "all" || i.type === scopeToItemType(searchScope)).length}{" "}
                      items
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                      <Command className="h-3.5 w-3.5" />
                      <span className="text-xs">Keyboard shortcuts enabled</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// TRIGGER BUTTON COMPONENT
// ============================================================================

interface SearchTriggerButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "minimal";
}

export function SearchTriggerButton({ className, size = "default", variant = "default" }: SearchTriggerButtonProps) {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(/^Mac/i.test(navigator.platform));
  }, []);

  const sizeStyles = {
    sm: "h-9 px-3 text-sm",
    default: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "flex items-center gap-2 w-full max-w-md rounded-lg",
        "border border-gray-300 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        "text-gray-500 dark:text-gray-400",
        "hover:bg-gray-50 dark:hover:bg-gray-800",
        "hover:border-gray-400 dark:hover:border-gray-600",
        "transition-colors",
        "cursor-pointer",
        sizeStyles[size],
        className
      )}
      aria-label="Open search dialog"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search...</span>
      <kbd
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5",
          "bg-gray-100 dark:bg-gray-800",
          "text-xs font-mono",
          "hidden sm:inline-flex"
        )}
      >
        {isMac ? "Cmd+K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}

// ============================================================================
// HOOK FOR PROGRAMMATIC CONTROL
// ============================================================================

export function useSearchDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SearchDialog;
