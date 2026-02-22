/**
 * Command Group
 *
 * Groups related commands together with a label.
 */

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function CommandGroup({ label, children, className, ...props }: CommandGroupProps) {
  return (
    <div className={cn("py-2", className)} role="group" aria-label={label} {...props}>
      {label && (
        <div className="px-4 py-1.5 text-xs font-semibold text-ceramic-dimmed uppercase tracking-wider">
          {label}
        </div>
      )}
      <div role="listbox" className="flex flex-col">
        {children}
      </div>
    </div>
  );
}
