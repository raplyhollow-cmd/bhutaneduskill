/**
 * CHILD SELECTOR COMPONENT
 *
 * Allows parents to switch between their children to view different students' data.
 * Features:
 * - Dropdown, Tabs, and Card variants
 * - LocalStorage persistence for selection
 * - Parent portal gray color scheme: rgb(107 114 128) → rgb(75 85 99)
 * - Support for 2-10 children per parent
 * - Shows child's name, grade, and photo
 * - Callback when child is switched
 *
 * @example
 * ```tsx
 * <ChildSelector
 *   children={children}
 *   selectedChildId={selectedId}
 *   onChildChange={(child) => setSelectedId(child.id)}
 *   variant="tabs"
 *   persistSelection
 * />
 * ```
 */

"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface Child {
  id: string;
  firstName: string;
  lastName?: string;
  name?: string; // Legacy support
  grade?: string;
  classGrade?: number;
  section?: string;
  school?: string;
  profilePicture?: string;
  clerkUserId?: string;
  dateOfBirth?: string;
  // Optional additional info
  assessmentCompleted?: boolean;
  riasecCode?: string;
  engagementLevel?: "high" | "medium" | "low";
}

export interface ChildSelectorProps {
  /**
   * Array of children belonging to this parent
   */
  children: Child[];
  /**
   * Currently selected child ID
   */
  selectedChildId?: string;
  /**
   * Callback when child selection changes
   */
  onChildChange?: (child: Child) => void;
  /**
   * Visual variant
   * @default "dropdown"
   */
  variant?: "dropdown" | "tabs" | "cards";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Storage key for persisting selection
   * @default "parent-selected-child-id"
   */
  storageKey?: string;
  /**
   * Enable/disable localStorage persistence
   * @default true
   */
  persistSelection?: boolean;
  /**
   * Show additional child info (school, grade, etc.)
   * @default true
   */
  showDetails?: boolean;
  /**
   * Label for the selector
   * @default "Select Child"
   */
  label?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function getDisplayName(child: Child): string {
  if (child.name) return child.name;
  return `${child.firstName}${child.lastName ? " " + child.lastName : ""}`;
}

function getInitials(child: Child): string {
  const name = getDisplayName(child);
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradeLabel(child: Child): string {
  if (child.grade) return child.grade;
  if (child.classGrade) {
    if (child.classGrade <= 12) return `Class ${child.classGrade}`;
    return `Grade ${child.classGrade}`;
  }
  return "";
}

function getAgeFromBirthDate(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getEngagementColor(level?: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

// ============================================================================
// Dropdown Variant
// ============================================================================

interface ChildDropdownProps extends Omit<ChildSelectorProps, "variant"> {
  selectedChild: Child | undefined;
  handleChildChange: (childId: string) => void;
}

function ChildDropdown({
  children,
  selectedChild,
  selectedChildId,
  showDetails = true,
  label = "Select Child",
  className,
  handleChildChange,
}: ChildDropdownProps) {
  return (
    <div className={cn("w-full", className)}>
      {children.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">{label}</label>
        </div>
      )}

      <Select value={selectedChildId} onValueChange={handleChildChange}>
        <SelectTrigger
          className={cn(
            "w-full h-auto py-3 px-4",
            "border-gray-300 bg-white",
            "hover:border-gray-400",
            "focus-visible:ring-gray-400 focus-visible:border-gray-500",
            "data-[state=open]:border-gray-500"
          )}
          data-size="default"
        >
          {selectedChild ? (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={selectedChild.profilePicture} alt={getDisplayName(selectedChild)} />
                <AvatarFallback
                  className="text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                >
                  {getInitials(selectedChild)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-gray-900 text-sm">{getDisplayName(selectedChild)}</span>
                {showDetails && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {getGradeLabel(selectedChild)}
                    {selectedChild.section && ` - ${selectedChild.section}`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="h-4 w-4" />
              <span>Select a child</span>
            </div>
          )}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </SelectTrigger>

        <SelectContent
          align="center"
          className="min-w-[var(--radix-select-trigger-width)] max-h-[300px]"
        >
          {children.map((child) => {
            const initials = getInitials(child);
            const grade = getGradeLabel(child);
            const age = getAgeFromBirthDate(child.dateOfBirth);

            return (
              <SelectItem
                key={child.id}
                value={child.id}
                className="focus:bg-gray-100 cursor-pointer py-3 px-2"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar size="sm">
                    <AvatarImage src={child.profilePicture} alt={getDisplayName(child)} />
                    <AvatarFallback
                      className="text-white text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {getDisplayName(child)}
                      </span>
                      {child.assessmentCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs py-0 px-1.5 h-auto">
                          Active
                        </Badge>
                      )}
                    </div>
                    {showDetails && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <GraduationCap className="h-3 w-3" />
                        {grade && <span>{grade}</span>}
                        {child.section && <span>· {child.section}</span>}
                        {age && <span>· {age} yrs</span>}
                        {child.engagementLevel && (
                          <>
                            <span>·</span>
                            <span
                              className={cn("w-2 h-2 rounded-full", getEngagementColor(child.engagementLevel))}
                              aria-label={`Engagement: ${child.engagementLevel}`}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
          {children.length === 0 && (
            <div className="py-6 px-4 text-center text-sm text-gray-500">
              No children added yet. Contact your school administrator to link your account.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// Tabs Variant
// ============================================================================

interface ChildTabsProps extends Omit<ChildSelectorProps, "variant"> {
  selectedChild: Child | undefined;
  handleChildChange: (childId: string) => void;
}

function ChildTabs({
  children,
  selectedChildId,
  showDetails = true,
  className,
  handleChildChange,
}: ChildTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        className="inline-flex items-center rounded-lg bg-gray-100 p-1 gap-1 w-full overflow-x-auto"
        role="tablist"
        aria-label="Select child to view"
      >
        {children.map((child) => {
          const isSelected = child.id === selectedChildId;
          const initials = getInitials(child);

          return (
            <button
              key={child.id}
              role="tab"
              aria-selected={isSelected}
              aria-label={getDisplayName(child)}
              onClick={() => handleChildChange(child.id)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50",
                isSelected
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              )}
            >
              <Avatar size="sm" className="h-6 w-6">
                <AvatarImage src={child.profilePicture} alt={getDisplayName(child)} />
                <AvatarFallback
                  className={cn(
                    "text-white text-[10px] font-semibold",
                    isSelected
                      ? ""
                      : "bg-gray-300"
                  )}
                  style={isSelected ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" } : {}}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[100px] sm:max-w-[150px] truncate">
                {child.firstName || child.name?.split(" ")[0]}
              </span>
              {showDetails && child.classGrade && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    isSelected ? "bg-gray-200 text-gray-700" : "bg-gray-200/50 text-gray-600"
                  )}
                >
                  {child.classGrade}
                </span>
              )}
            </button>
          );
        })}
        {children.length === 0 && (
          <div className="py-4 px-4 text-center text-sm text-gray-500 w-full">
            No children added yet
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Cards Variant
// ============================================================================

interface ChildCardsProps extends Omit<ChildSelectorProps, "variant"> {
  selectedChild: Child | undefined;
  handleChildChange: (childId: string) => void;
}

function ChildCards({
  children,
  selectedChildId,
  showDetails = true,
  className,
  handleChildChange,
}: ChildCardsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Select child to view">
        {children.map((child) => {
          const isSelected = child.id === selectedChildId;
          const initials = getInitials(child);
          const grade = getGradeLabel(child);

          return (
            <button
              key={child.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleChildChange(child.id)}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4 text-left transition-all",
                "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50",
                isSelected
                  ? "border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              {/* Selection indicator - Parent portal gray gradient */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
                />
              )}

              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={child.profilePicture} alt={getDisplayName(child)} />
                  <AvatarFallback
                    className={cn("text-white font-semibold", isSelected ? "" : "bg-gray-300")}
                    style={isSelected ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" } : {}}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{getDisplayName(child)}</p>
                  {showDetails && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {grade && <span>{grade}</span>}
                      {child.section && <span>· {child.section}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional info badges */}
              {showDetails && (child.assessmentCompleted || child.riasecCode) && (
                <div className="flex gap-2 mt-3">
                  {child.assessmentCompleted && (
                    <Badge className="bg-green-100 text-green-700 text-xs">Assessment Complete</Badge>
                  )}
                  {child.riasecCode && <Badge variant="outline" className="text-xs">{child.riasecCode}</Badge>}
                </div>
              )}
            </button>
          );
        })}
        {children.length === 0 && (
          <div className="col-span-full py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No children linked to your account</p>
            <p className="text-xs text-gray-400 mt-1">Contact your school administrator for assistance</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ChildSelector({
  children,
  selectedChildId: controlledSelectedId,
  onChildChange,
  variant = "dropdown",
  storageKey = "parent-selected-child-id",
  persistSelection = true,
  showDetails = true,
  label,
  className,
}: ChildSelectorProps) {
  // Internal state for uncontrolled usage with localStorage persistence
  const [internalSelectedId, setInternalSelectedId] = React.useState<string>(() => {
    // Try to load from localStorage on mount
    if (persistSelection && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored && children.find((c) => c.id === stored)) {
        return stored;
      }
    }
    // Default to first child or controlled value
    return controlledSelectedId || children[0]?.id || "";
  });

  // Use controlled or uncontrolled state
  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;

  const selectedChild = React.useMemo(
    () => children.find((c) => c.id === selectedId),
    [children, selectedId]
  );

  // Notify parent when selection changes
  React.useEffect(() => {
    if (selectedChild && onChildChange) {
      onChildChange(selectedChild);
    }
  }, [selectedChild, onChildChange]);

  // Handle child selection change
  const handleChildChange = React.useCallback(
    (childId: string) => {
      const child = children.find((c) => c.id === childId);
      if (!child) return;

      // Update internal state if uncontrolled
      if (controlledSelectedId === undefined) {
        setInternalSelectedId(childId);
      }

      // Persist to localStorage
      if (persistSelection && typeof window !== "undefined") {
        localStorage.setItem(storageKey, childId);
      }

      // Notify parent
      if (onChildChange) {
        onChildChange(child);
      }
    },
    [children, controlledSelectedId, onChildChange, persistSelection, storageKey]
  );

  // Handle empty state
  if (children.length === 0) {
    return (
      <div className={cn("p-4 bg-yellow-50 border border-yellow-200 rounded-lg", className)}>
        <p className="text-sm text-yellow-800">No children linked to your account yet.</p>
      </div>
    );
  }

  // Single child - show as display only
  if (children.length === 1) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border",
          className
        )}
        style={{
          background: "linear-gradient(to right, rgb(249 250 251) 0%, rgb(243 244 246) 100%)",
          borderColor: "rgb(229 231 235)",
        }}
      >
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={selectedChild?.profilePicture} alt={getDisplayName(selectedChild!)} />
            <AvatarFallback
              className="text-white text-lg font-bold"
              style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
            >
              {getInitials(selectedChild!)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">{getDisplayName(selectedChild!)}</p>
            {showDetails && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {getGradeLabel(selectedChild!)}
                {selectedChild?.school && ` · ${selectedChild.school}`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render based on variant
  const commonProps = {
    children,
    selectedChild,
    selectedChildId: selectedId,
    showDetails,
    label,
    className,
    handleChildChange,
  };

  switch (variant) {
    case "tabs":
      return <ChildTabs {...commonProps} />;
    case "cards":
      return <ChildCards {...commonProps} />;
    case "dropdown":
    default:
      return <ChildDropdown {...commonProps} />;
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for managing child selection state
 *
 * @example
 * const { selectedChild, setSelectedChild, children } = useChildSelector(myChildren)
 */
export function useChildSelector(
  children: Child[],
  options?: {
    storageKey?: string;
    persist?: boolean;
    initialChildId?: string;
  }
) {
  const { storageKey = "parent-selected-child-id", persist = true, initialChildId } = options || {};

  const [selectedChildId, setSelectedChildId] = React.useState<string>(() => {
    if (initialChildId) return initialChildId;
    if (persist && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored && children.find((c) => c.id === stored)) {
        return stored;
      }
    }
    return children[0]?.id || "";
  });

  const selectedChild = React.useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const setSelectedChild = React.useCallback(
    (child: Child) => {
      setSelectedChildId(child.id);
      if (persist && typeof window !== "undefined") {
        localStorage.setItem(storageKey, child.id);
      }
    },
    [persist, storageKey]
  );

  return {
    children,
    selectedChild,
    setSelectedChild,
    selectedChildId,
  };
}

// ============================================================================
// Display Components
// ============================================================================

/**
 * ChildDisplayCard - Shows selected child info in a compact card format
 */
export interface ChildDisplayCardProps {
  child: Child;
  showActions?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function ChildDisplayCard({ child, showActions, onEdit, className }: ChildDisplayCardProps) {
  const initials = getInitials(child);
  const grade = getGradeLabel(child);

  return (
    <div
      className={cn("flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm", className)}
      style={{ borderColor: "rgb(229 231 235)" }}
    >
      <Avatar>
        <AvatarImage src={child.profilePicture} alt={getDisplayName(child)} />
        <AvatarFallback
          className="text-white font-semibold"
          style={{ background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{getDisplayName(child)}</p>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5" />
          {grade && <span>{grade}</span>}
          {child.section && <span>· {child.section}</span>}
          {child.school && <span>· {child.school}</span>}
        </p>
      </div>
      {showActions && onEdit && (
        <button
          onClick={onEdit}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Switch
        </button>
      )}
    </div>
  );
}

/**
 * ChildSelectorHeader - Header component with child selector
 */
export interface ChildSelectorHeaderProps {
  children: Child[];
  selectedChildId?: string;
  onChildChange?: (child: Child) => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ChildSelectorHeader({
  children,
  selectedChildId,
  onChildChange,
  title = "Parent Dashboard",
  subtitle = "Track {child}'s progress and activities",
  actions,
}: ChildSelectorHeaderProps) {
  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-1">
            {selectedChild ? subtitle.replace("{child}", getDisplayName(selectedChild)) : subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children.length > 1 && (
          <ChildSelector
            children={children}
            selectedChildId={selectedChildId}
            onChildChange={onChildChange}
            variant="dropdown"
            className="w-full sm:w-auto min-w-[250px]"
          />
        )}
        {actions}
      </div>
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default ChildSelector;
