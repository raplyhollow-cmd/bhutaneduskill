/**
 * Command Input
 *
 * Search input for the command menu with icon.
 */

import { forwardRef, ComponentPropsWithoutRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const CommandInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ceramic-dimmed pointer-events-none" />
        <input
          ref={ref}
          type="text"
          className={cn(
            "w-full pl-11 pr-4 py-3 bg-ceramic-gray-50 border border-ceramic-border rounded-xl",
            "text-sm text-ceramic-primary placeholder:text-ceramic-dimmed",
            "focus:outline-none focus:ring-2 focus:ring-ceramic-brand focus:border-transparent",
            "transition-all"
          )}
          placeholder="Type a command or search..."
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          {...props}
        />
      </div>
    );
  }
);

CommandInput.displayName = "CommandInput";
