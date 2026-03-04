/**
 * UNIFIED SEARCH & FILTER SYSTEM
 *
 * Provides cross-feature search and filtering capabilities.
 * Works with any unified feature.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Filter, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect" | "date" | "daterange" | "boolean" | "range";
  options?: FilterOption[];
  min?: number;
  max?: number;
  startDate?: string;
  endDate?: string;
}

export interface SearchConfig {
  placeholder?: string;
  searchFields?: string[];
  debounceMs?: number;
}

export interface UnifiedSearchProps {
  filters?: FilterConfig[];
  search?: SearchConfig;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  activeFilters?: Record<string, any>;
  searchQuery?: string;
  className?: string;
}

/**
 * Unified Search Bar Component
 */
export function UnifiedSearchBar({
  filters = [],
  search = {},
  onSearchChange,
  onFilterChange,
  activeFilters = {},
  searchQuery = "",
  className,
}: UnifiedSearchProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearchChange?.(value);
    }, search.debounceMs || 300),
    [onSearchChange, search.debounceMs]
  );

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setLocalSearch("");
    onSearchChange?.("");
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter(
      (v) => v !== null && v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
  }, [activeFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    const cleared: Record<string, any> = {};
    for (const key of Object.keys(activeFilters)) {
      cleared[key] = null;
    }
    onFilterChange?.(cleared);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input */}
      {search && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder || "Search..."}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 pr-8"
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Filters Button */}
      {filters.length > 0 && (
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter results by applying the following criteria
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-4">
              {filters.map((filter) => (
                <FilterItem
                  key={filter.key}
                  filter={filter}
                  value={activeFilters[filter.key]}
                  onChange={(value) => onFilterChange?.({ ...activeFilters, [filter.key]: value })}
                />
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </span>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.map((filter) => {
            const value = activeFilters[filter.key];
            if (!value) return null;

            const getDisplayValue = () => {
              if (filter.type === "boolean") {
                return value ? "Yes" : "No";
              }
              if (filter.type === "multiselect" && Array.isArray(value)) {
                return value.length === 1 ? value[0] : `${value.length} selected`;
              }
              if (filter.options) {
                const opt = filter.options.find((o) => o.value === value);
                return opt?.label || value;
              }
              return String(value);
            };

            return (
              <Badge key={filter.key} variant="secondary" className="gap-1">
                {filter.label}: {getDisplayValue()}
                <button
                  onClick={() => onFilterChange?.({ ...activeFilters, [filter.key]: null })}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Single Filter Item Component
 */
function FilterItem({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (filter.type) {
    case "select":
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">All</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.count !== undefined && `(${opt.count})`}
              </option>
            ))}
          </select>
        </div>
      );

    case "multiselect":
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <div className="space-y-1">
            {filter.options?.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.key}-${opt.value}`}
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...current, opt.value]);
                    } else {
                      onChange(current.filter((v: string) => v !== opt.value));
                    }
                  }}
                />
                <Label
                  htmlFor={`${filter.key}-${opt.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {opt.label}
                  {opt.count !== undefined && ` (${opt.count})`}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <Label>{filter.label}</Label>
          <div className="flex gap-2">
            <Button
              variant={value === true ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(value === true ? null : true)}
            >
              Yes
            </Button>
            <Button
              variant={value === false ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(value === false ? null : false)}
            >
              No
            </Button>
          </div>
        </div>
      );

    case "range":
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              min={filter.min}
              value={typeof value === "object" ? value?.min : value || ""}
              onChange={(e) => onChange({ ...value, min: e.target.value || null })}
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Max"
              max={filter.max}
              value={typeof value === "object" ? value?.max : ""}
              onChange={(e) => onChange({ ...value, max: e.target.value || null })}
            />
          </div>
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case "daterange":
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="From"
              value={typeof value === "object" ? value?.from : ""}
              onChange={(e) => onChange({ ...value, from: e.target.value || null })}
            />
            <span>to</span>
            <Input
              type="date"
              placeholder="To"
              value={typeof value === "object" ? value?.to : ""}
              onChange={(e) => onChange({ ...value, to: e.target.value || null })}
            />
          </div>
        </div>
      );

    default: // text
      return (
        <div className="space-y-2">
          <Label>{filter.label}</Label>
          <Input
            placeholder={`Search by ${filter.label.toLowerCase()}`}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );
  }
}

/**
 * Debounce utility
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Advanced Filter Builder
 */
export function AdvancedFilterBuilder({
  filters,
  onApply,
  activeFilters = {},
}: {
  filters: FilterConfig[];
  onApply: (filters: Record<string, any>) => void;
  activeFilters?: Record<string, any>;
}) {
  const [localFilters, setLocalFilters] = useState(activeFilters);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const reset: Record<string, any> = {};
    for (const key of Object.keys(localFilters)) {
      reset[key] = null;
    }
    setLocalFilters(reset);
    onApply(reset);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {filters.map((filter) => (
          <FilterItem
            key={filter.key}
            filter={filter}
            value={localFilters[filter.key]}
            onChange={(val) => setLocalFilters({ ...localFilters, [filter.key]: val })}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

/**
 * Quick Filter Pills
 */
export function QuickFilterPills({
  options,
  value,
  onChange,
  label,
}: {
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={value === null ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(null)}
        >
          All
        </Button>
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(value === option.value ? null : option.value)}
          >
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </Button>
        ))}
      </div>
    </div>
  );
}
