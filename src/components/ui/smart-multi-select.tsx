/**
 * SMART MULTI-SELECT COMPONENT
 *
 * A searchable dropdown with checkbox selection and grouping support.
 *
 * Features:
 * - Search/filter functionality
 * - Checkbox selection with Select All / Deselect All
 * - Grouped options (by category, grade, etc.)
 * - Selected items display as chips with remove buttons
 * - Live count display
 * - Full keyboard navigation
 * - Accessibility support
 */

"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  XIcon,
  SearchIcon,
} from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single option in the select dropdown
 */
export interface SelectOption<T = string> {
  /** Unique value for the option */
  value: T;
  /** Display label for the option */
  label: string;
  /** Group key for grouping options */
  group?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Optional additional data */
  [key: string]: unknown;
}

/**
 * Props for the SmartMultiSelect component
 */
export interface SmartMultiSelectProps<T = string> {
  /** Currently selected values */
  value: T[];
  /** Callback when selection changes */
  onChange: (value: T[]) => void;
  /** Available options to select from */
  options: SelectOption<T>[];
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Function to group options */
  groupBy?: (option: SelectOption<T>) => string;
  /** Whether to show search input */
  searchable?: boolean;
  /** Whether to show Select All / Deselect All option */
  selectAll?: boolean;
  /** Maximum number of selected items to display as chips */
  maxDisplayCount?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** ID for the component */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Label for screen readers */
  ariaLabel?: string;
}

/**
 * Grouped options for rendering
 */
interface GroupedOptions<T = string> {
  group: string;
  options: SelectOption<T>[];
}

// ============================================================================
// COMPONENT
// ============================================================================

const SmartMultiSelect = React.forwardRef<
  HTMLButtonElement,
  SmartMultiSelectProps
>(
  <T extends string>(
    {
      value,
      onChange,
      options,
      placeholder = "Select options...",
      searchPlaceholder = "Search...",
      groupBy,
      searchable = true,
      selectAll = true,
      maxDisplayCount = 3,
      disabled = false,
      className,
      id,
      name,
      required,
      ariaLabel = "Multi-select dropdown",
    }: SmartMultiSelectProps<T>,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const internalRef = React.useRef<HTMLButtonElement>(null);
    const triggerRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef;

    // State
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const popoverContentRef = React.useRef<HTMLDivElement>(null);
    const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

    // ========================================================================
    // MEMOIZED VALUES
    // ========================================================================

    /** Filter options based on search query */
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;

      const query = searchQuery.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(query) ||
          String(option.value).toLowerCase().includes(query) ||
          (option.group && option.group.toLowerCase().includes(query))
      );
    }, [options, searchQuery]);

    /** Group filtered options by the groupBy function */
    const groupedOptions = React.useMemo(() => {
      if (!groupBy) {
        return [{ group: "", options: filteredOptions }] as GroupedOptions<T>[];
      }

      const groups = new Map<string, SelectOption<T>[]>();

      for (const option of filteredOptions) {
        const groupKey = groupBy(option) || "Other";
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(option);
      }

      // Convert map to array and sort by group name
      return Array.from(groups.entries())
        .map(([group, options]) => ({ group, options }))
        .sort((a, b) => a.group.localeCompare(b.group));
    }, [filteredOptions, groupBy]);

    /** Get selected option objects */
    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => value.includes(option.value));
    }, [options, value]);

    /** Calculate total number of non-disabled filtered options */
    const totalEnabledOptions = React.useMemo(() => {
      return filteredOptions.filter((o) => !o.disabled).length;
    }, [filteredOptions]);

    /** Count selected non-disabled options in filtered results */
    const selectedInFiltered = React.useMemo(() => {
      return filteredOptions.filter(
        (o) => value.includes(o.value) && !o.disabled
      ).length;
    }, [filteredOptions, value]);

    /** Check if all non-disabled filtered options are selected */
    const allSelected = React.useMemo(() => {
      return totalEnabledOptions > 0 && selectedInFiltered === totalEnabledOptions;
    }, [totalEnabledOptions, selectedInFiltered]);

    /** Check if some (but not all) filtered options are selected */
    const someSelected = React.useMemo(() => {
      return selectedInFiltered > 0 && !allSelected;
    }, [selectedInFiltered, allSelected]);

    /** Flatten grouped options for keyboard navigation */
    const flattenedOptions = React.useMemo(() => {
      return groupedOptions.flatMap((group) => group.options);
    }, [groupedOptions]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    /** Toggle an option's selection state */
    const handleToggleOption = (optionValue: T) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    /** Select or deselect all non-disabled filtered options */
    const handleSelectAll = () => {
      if (allSelected) {
        // Deselect all non-disabled filtered options
        const toRemove = filteredOptions
          .filter((option) => !option.disabled)
          .map((option) => option.value);
        onChange(value.filter((v) => !toRemove.includes(v)));
      } else {
        // Select all non-disabled filtered options
        const toAdd = filteredOptions
          .filter((option) => !option.disabled && !value.includes(option.value))
          .map((option) => option.value);
        onChange([...value, ...toAdd]);
      }
    };

    /** Select or deselect all options within a specific group */
    const handleSelectGroup = (group: GroupedOptions<T>) => {
      const groupEnabledValues = group.options
        .filter((o) => !o.disabled)
        .map((o) => o.value);

      const allInGroupSelected = groupEnabledValues.every((v) =>
        value.includes(v)
      );

      if (allInGroupSelected) {
        // Deselect all in group
        onChange(value.filter((v) => !groupEnabledValues.includes(v)));
      } else {
        // Select all in group
        const toAdd = groupEnabledValues.filter((v) => !value.includes(v));
        onChange([...value, ...toAdd]);
      }
    };

    /** Remove a chip when clicking its X button */
    const handleRemove = (optionValue: T, event: React.MouseEvent) => {
      event.stopPropagation();
      onChange(value.filter((v) => v !== optionValue));
    };

    /** Clear all selections */
    const handleClearAll = (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange([]);
    };

    /** Keyboard navigation handler */
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (!open) {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            event.key === "ArrowDown"
          ) {
            event.preventDefault();
            setOpen(true);
            return;
          }
          return;
        }

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            setFocusedIndex((prev) => {
              const nextIndex =
                prev < flattenedOptions.length - 1 ? prev + 1 : prev;
              // Scroll into view
              setTimeout(() => {
                const element = itemRefs.current.get(nextIndex);
                element?.scrollIntoView({ block: "nearest" });
              }, 0);
              return nextIndex;
            });
            break;
          case "ArrowUp":
            event.preventDefault();
            setFocusedIndex((prev) => {
              const nextIndex = prev > 0 ? prev - 1 : 0;
              setTimeout(() => {
                const element = itemRefs.current.get(nextIndex);
                element?.scrollIntoView({ block: "nearest" });
              }, 0);
              return nextIndex;
            });
            break;
          case "Enter":
            event.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < flattenedOptions.length) {
              const option = flattenedOptions[focusedIndex];
              if (!option.disabled) {
                handleToggleOption(option.value);
              }
            }
            break;
          case "Escape":
            event.preventDefault();
            setOpen(false);
            setFocusedIndex(-1);
            triggerRef.current?.focus();
            break;
          case "Tab":
            setOpen(false);
            setFocusedIndex(-1);
            break;
        }
      },
      [open, flattenedOptions, focusedIndex]
    );

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /** Focus search input when popover opens */
    React.useEffect(() => {
      if (open && searchable) {
        searchInputRef.current?.focus();
      }
    }, [open, searchable]);

    /** Reset focused index when filtered options change */
    React.useEffect(() => {
      setFocusedIndex(-1);
    }, [searchQuery]);

    /** Reset focused index when opening/closing */
    React.useEffect(() => {
      if (open) {
        setFocusedIndex(0);
      } else {
        setFocusedIndex(-1);
      }
    }, [open]);

    /** Hidden input value for form submission */
    const hiddenInputValue = JSON.stringify(value);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
      <div className={cn("relative", className)}>
        {/* Hidden input for form submission */}
        <input
          type="hidden"
          name={name}
          value={hiddenInputValue}
          required={required && value.length === 0}
          data-smart-multi-select-value={hiddenInputValue}
        />

        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          {/* Trigger Button */}
          <PopoverPrimitive.Trigger asChild>
            <button
              ref={ref || triggerRef}
              id={id}
              type="button"
              disabled={disabled}
              onKeyDown={handleKeyDown}
              className={cn(
                "border-input data-[placeholder]:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-ring/50",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                "flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow]",
                "outline-none focus-visible:ring-[3px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-11 text-left dark:bg-gray-800",
                open && "ring-2 ring-ring ring-offset-2"
              )}
              aria-expanded={open}
              aria-required={required}
              aria-label={ariaLabel}
            >
              {/* Selected Items as Chips */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
                {selectedOptions.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                ) : (
                  <>
                    {selectedOptions.slice(0, maxDisplayCount).map((option) => (
                      <Badge
                        key={String(option.value)}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {option.icon && (
                          <span className="shrink-0">{option.icon}</span>
                        )}
                        <span className="truncate max-w-[120px]">
                          {option.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemove(option.value, e)}
                          className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          aria-label={`Remove ${option.label}`}
                          disabled={disabled}
                        >
                          <XIcon className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedOptions.length > maxDisplayCount && (
                      <Badge variant="secondary" className="font-normal">
                        +{selectedOptions.length - maxDisplayCount} more
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {value.length > 0 && !disabled && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-full p-1 hover:bg-accent hover:text-destructive transition-colors"
                    aria-label="Clear all"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              </div>
            </button>
          </PopoverPrimitive.Trigger>

          {/* Popover Content */}
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              ref={popoverContentRef}
              align="start"
              sideOffset={4}
              className={cn(
                "bg-popover text-popover-foreground z-50 w-full min-w-[var(--radix-popper-anchor-width)] max-w-[var(--radix-popper-anchor-width)]",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                "rounded-lg border bg-white dark:bg-gray-800 shadow-md",
                "max-h-[320px] flex flex-col"
              )}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                if (searchable) {
                  searchInputRef.current?.focus();
                }
              }}
            >
              {/* Search Input */}
              {searchable && (
                <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
                  <SearchIcon className="size-4 text-muted-foreground shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="rounded-full p-0.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <XIcon className="size-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Select All Option */}
              {selectAll && totalEnabledOptions > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                    "border-b border-border/50"
                  )}
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    data-state={
                      allSelected
                        ? "checked"
                        : someSelected
                          ? "indeterminate"
                          : "unchecked"
                    }
                  />
                  <span className="flex-1">
                    {allSelected ? "Deselect All" : "Select All"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedInFiltered} / {totalEnabledOptions}
                  </span>
                </button>
              )}

              {/* Options List */}
              <div
                className="overflow-y-auto py-1 flex-1"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Multi-select options"
              >
                {flattenedOptions.length === 0 ? (
                  <div className="px-3 py-8 text-sm text-muted-foreground text-center">
                    {searchQuery ? "No results found" : "No options available"}
                  </div>
                ) : (
                  groupedOptions.map((group, groupIndex) => {
                    if (group.options.length === 0) return null;

                    const globalIndexStart = flattenedOptions.indexOf(
                      group.options[0]
                    );

                    return (
                      <div key={group.group || "ungrouped"}>
                        {/* Group Header */}
                        {group.group && (
                          <>
                            {groupIndex > 0 && (
                              <Separator className="my-1 mx-2" />
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5">
                              {selectAll && (
                                <Checkbox
                                  checked={group.options
                                    .filter((o) => !o.disabled)
                                    .every((o) => value.includes(o.value))}
                                  onCheckedChange={() =>
                                    handleSelectGroup(group)
                                  }
                                  className="size-3.5"
                                />
                              )}
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {group.group}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {group.options.filter((o) => value.includes(o.value)).length}
                                /
                                {group.options.filter((o) => !o.disabled).length}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Group Options */}
                        {group.options.map((option, optionIndex) => {
                          const globalIndex = globalIndexStart + optionIndex;
                          const isSelected = value.includes(option.value);
                          const isFocused = focusedIndex === globalIndex;

                          return (
                            <button
                              key={String(option.value)}
                              ref={(node) => {
                                if (node) itemRefs.current.set(globalIndex, node);
                                else itemRefs.current.delete(globalIndex);
                              }}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              disabled={option.disabled}
                              onClick={() =>
                                !option.disabled && handleToggleOption(option.value)
                              }
                              onMouseEnter={() => setFocusedIndex(globalIndex)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                isSelected && "bg-accent/50",
                                isFocused && "bg-accent",
                                group.group && "ml-4",
                                option.disabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {option.icon && (
                                <span className="shrink-0">{option.icon}</span>
                              )}
                              <Checkbox
                                checked={isSelected}
                                disabled={option.disabled}
                                className="pointer-events-none"
                              />
                              <span className="flex-1 truncate">
                                {option.label}
                              </span>
                              {isSelected && (
                                <CheckIcon className="size-4 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer with count */}
              {value.length > 0 && (
                <div className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    {value.length} selected
                    {selectedInFiltered < totalEnabledOptions &&
                      searchQuery &&
                      ` (${selectedInFiltered} visible)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }
);

SmartMultiSelect.displayName = "SmartMultiSelect";

export { SmartMultiSelect };
