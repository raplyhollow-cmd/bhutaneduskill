/**
 * Command Item
 *
 * Individual command item component with keyboard navigation support.
 */

import { ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface CommandItemProps extends ComponentPropsWithoutRef<"div"> {
  icon?: LucideIcon;
  shortcut?: string;
  isSelected?: boolean;
}

export const CommandItem = forwardRef<HTMLDivElement, CommandItemProps>(
  ({ icon: Icon, shortcut, isSelected, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ceramic-brand focus:ring-offset-2",
          isSelected
            ? "bg-ceramic-purple-50 text-ceramic-brand"
            : "hover:bg-ceramic-gray-100 text-ceramic-gray-900",
          className
        )}
        tabIndex={isSelected ? 0 : -1}
        {...props}
      >
        {Icon && (
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        )}
        <span className="flex-1 text-sm font-medium">{children}</span>
        {shortcut && (
          <kbd className="text-xs text-ceramic-dimmed px-2 py-0.5 bg-ceramic-gray-100 rounded border border-ceramic-border">
            {shortcut}
          </kbd>
        )}
      </div>
    );
  }
);

CommandItem.displayName = "CommandItem";
