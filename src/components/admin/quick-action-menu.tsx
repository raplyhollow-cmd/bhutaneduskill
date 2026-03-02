"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Key, MailCheck, Trash2 } from "lucide-react";

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
}

interface QuickActionMenuProps {
  user: User;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onVerifyEmail?: (user: User) => void;
}

export function QuickActionMenu({
  user,
  onEdit,
  onView,
  onDelete,
  onResetPassword,
  onVerifyEmail,
}: QuickActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 hover:bg-gray-100 rounded transition-opacity opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(user)}>
          <Eye className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm">View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Edit className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm">Edit Profile</span>
        </DropdownMenuItem>
        {onResetPassword && (
          <DropdownMenuItem onClick={() => onResetPassword(user)}>
            <Key className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm">Reset Password</span>
          </DropdownMenuItem>
        )}
        {onVerifyEmail && !user.emailVerified && (
          <DropdownMenuItem onClick={() => onVerifyEmail(user)}>
            <MailCheck className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm">Verify Email</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span className="text-sm">Delete User</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
