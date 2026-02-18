"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, XIcon, SearchIcon } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
  [key: string]: any
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  maxDisplay?: number
  className?: string
  id?: string
  name?: string
  required?: boolean
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      selected,
      onChange,
      placeholder = "Select options...",
      searchPlaceholder = "Search options...",
      disabled = false,
      maxDisplay = 3,
      className,
      id,
      name,
      required,
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLButtonElement>(null)
    const triggerRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef

    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [focusedIndex, setFocusedIndex] = React.useState(-1)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    const popoverContentRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map())

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }, [options, searchQuery])

    // Get selected option objects
    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => selected.includes(option.value))
    }, [options, selected])

    // Check if all options are selected
    const allSelected = filteredOptions.length > 0 &&
      filteredOptions.every((option) => selected.includes(option.value) || option.disabled)

    // Check if some (but not all) options are selected
    const someSelected = filteredOptions.some((option) => selected.includes(option.value)) && !allSelected

    // Handle option toggle
    const handleToggleOption = (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value))
      } else {
        onChange([...selected, value])
      }
    }

    // Handle select all
    const handleSelectAll = () => {
      if (allSelected) {
        // Deselect all non-disabled options
        const toRemove = filteredOptions
          .filter((option) => !option.disabled)
          .map((option) => option.value)
        onChange(selected.filter((v) => !toRemove.includes(v)))
      } else {
        // Select all non-disabled options
        const toAdd = filteredOptions
          .filter((option) => !option.disabled && !selected.includes(option.value))
          .map((option) => option.value)
        onChange([...selected, ...toAdd])
      }
    }

    // Handle remove chip
    const handleRemove = (value: string, event: React.MouseEvent) => {
      event.stopPropagation()
      onChange(selected.filter((v) => v !== value))
    }

    // Handle clear all
    const handleClearAll = (event: React.MouseEvent) => {
      event.stopPropagation()
      onChange([])
    }

    // Keyboard navigation
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
      if (!open) {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
          event.preventDefault()
          setOpen(true)
          return
        }
        return
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          setFocusedIndex((prev) => {
            const nextIndex = prev < filteredOptions.length - 1 ? prev + 1 : prev
            // Scroll into view
            setTimeout(() => {
              const element = itemRefs.current.get(nextIndex)
              element?.scrollIntoView({ block: "nearest" })
            }, 0)
            return nextIndex
          })
          break
        case "ArrowUp":
          event.preventDefault()
          setFocusedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : 0
            setTimeout(() => {
              const element = itemRefs.current.get(nextIndex)
              element?.scrollIntoView({ block: "nearest" })
            }, 0)
            return nextIndex
          })
          break
        case "Enter":
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const option = filteredOptions[focusedIndex]
            if (!option.disabled) {
              handleToggleOption(option.value)
            }
          }
          break
        case "Escape":
          event.preventDefault()
          setOpen(false)
          setFocusedIndex(-1)
          triggerRef.current?.focus()
          break
        case "Tab":
          setOpen(false)
          setFocusedIndex(-1)
          break
      }
    }, [open, filteredOptions, focusedIndex])

    // Focus search input when popover opens
    React.useEffect(() => {
      if (open) {
        searchInputRef.current?.focus()
      }
    }, [open])

    // Reset focused index when filtered options change
    React.useEffect(() => {
      setFocusedIndex(-1)
    }, [filteredOptions])

    // Reset focused index when opening
    React.useEffect(() => {
      if (open) {
        setFocusedIndex(0)
      } else {
        setFocusedIndex(-1)
      }
    }, [open])

    // Hidden input for form submission
    const hiddenInputValue = JSON.stringify(selected)

    return (
      <div className={cn("relative", className)}>
        <input
          type="hidden"
          name={name}
          value={hiddenInputValue}
          required={required && selected.length === 0}
          data-multi-select-value={hiddenInputValue}
        />

        {/* Trigger Button */}
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <button
              ref={ref || triggerRef}
              id={id}
              type="button"
              disabled={disabled}
              onKeyDown={handleKeyDown}
              className={cn(
                // Base styles
                "border-input data-[placeholder]:text-muted-foreground",
                "focus-visible:border-ring focus-visible:ring-ring/50",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "dark:bg-input/30 dark:hover:bg-input/50",
                "flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow]",
                "outline-none focus-visible:ring-[3px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-11",
                "text-left",
                "dark:bg-gray-800",
                open && "ring-2 ring-ring ring-offset-2",
                className
              )}
              aria-expanded={open}
              aria-required={required}
            >
              {/* Selected Items as Chips */}
              <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
                {selectedOptions.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                ) : (
                  <>
                    {selectedOptions.slice(0, maxDisplay).map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span className="truncate max-w-[120px]">{option.label}</span>
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
                    {selectedOptions.length > maxDisplay && (
                      <Badge variant="secondary" className="font-normal">
                        +{selectedOptions.length - maxDisplay} more
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {selected.length > 0 && !disabled && (
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
                "rounded-lg border bg-white dark:bg-gray-800 shadow-md p-1",
                "max-h-[300px] flex flex-col"
              )}
              onOpenAutoFocus={(e) => {
                e.preventDefault()
                searchInputRef.current?.focus()
              }}
            >
              {/* Search Input */}
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
                      e.preventDefault()
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

              {/* Select All Option */}
              {filteredOptions.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                    "border-b border-border/50 mb-1"
                  )}
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className={cn(
                      allSelected && "bg-primary border-primary text-primary-foreground",
                      someSelected && "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    )}
                    data-state={allSelected ? "checked" : someSelected ? "indeterminate" : "unchecked"}
                  />
                  <span>{allSelected ? "Deselect All" : "Select All"}</span>
                </button>
              )}

              {/* Options List */}
              <div
                className="overflow-y-auto py-1 max-h-[200px]"
                role="listbox"
                aria-multiselectable="true"
                aria-label="Multi-select options"
              >
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = selected.includes(option.value)
                    const isFocused = focusedIndex === index

                    return (
                      <button
                        key={option.value}
                        ref={(node) => {
                          if (node) itemRefs.current.set(index, node)
                          else itemRefs.current.delete(index)
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onClick={() => !option.disabled && handleToggleOption(option.value)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-left transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          isSelected && "bg-accent/50",
                          isFocused && "bg-accent",
                          option.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={option.disabled}
                          className="pointer-events-none"
                        />
                        <span className="flex-1 truncate">{option.label}</span>
                        {isSelected && (
                          <CheckIcon className="size-4 text-primary shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Footer with count */}
              {selected.length > 0 && (
                <div className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{selected.length} selected</span>
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
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
