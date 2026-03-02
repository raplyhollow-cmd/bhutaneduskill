"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  Users,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
  separator?: boolean;
}

export interface TableQuickActionsProps {
  actions: QuickAction[];
  align?: "start" | "center" | "end";
}

/**
 * Generic quick action menu component for table rows
 * Hover reveal behavior (opacity-0 group-hover:opacity-100)
 */
export function TableQuickActions({ actions, align = "end" }: TableQuickActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 hover:bg-gray-100 rounded transition-opacity opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {actions.map((action, index) => {
          // Skip items that are only separators without label
          if (action.separator && !action.label) {
            return <DropdownMenuSeparator key={index} />
          }

          return (
            <div key={index}>
              {action.separator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={action.onClick}
                className={cn(
                  "text-sm",
                  action.variant === "danger" && "text-red-600 focus:text-red-600"
                )}
              >
                {action.icon && <span className="w-4 h-4 mr-2">{action.icon}</span>}
                <span>{action.label}</span>
              </DropdownMenuItem>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Common action icons
export const ActionIcons = {
  view: <Eye className="w-4 h-4" />,
  edit: <Edit className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  duplicate: <Copy className="w-4 h-4" />,
  send: <Send className="w-4 h-4" />,
  publish: <CheckCircle className="w-4 h-4" />,
  assign: <Users className="w-4 h-4" />,
  classes: <GraduationCap className="w-4 h-4" />,
  subjects: <BookOpen className="w-4 h-4" />,
};
