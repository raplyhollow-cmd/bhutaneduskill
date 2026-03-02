"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, GraduationCap, BookOpen, Users, HeartHandshake, Building2, Landmark, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { value: "student", label: "Student", icon: GraduationCap, color: "text-orange-600", bg: "bg-orange-50" },
  { value: "teacher", label: "Teacher", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "parent", label: "Parent", icon: Users, color: "text-gray-600", bg: "bg-gray-50" },
  { value: "counselor", label: "Counselor", icon: HeartHandshake, color: "text-purple-600", bg: "bg-purple-50" },
  { value: "school-admin", label: "School Admin", icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
  { value: "ministry", label: "Ministry", icon: Landmark, color: "text-teal-600", bg: "bg-teal-50" },
  { value: "admin", label: "Admin", icon: Shield, color: "text-pink-600", bg: "bg-pink-50" },
];

interface RoleSelectorProps {
  value: string;
  onChange: (newRole: string) => Promise<void> | void;
  size?: "sm" | "default";
}

export function RoleSelector({ value, onChange, size = "sm" }: RoleSelectorProps) {
  const currentRole = roles.find(r => r.value === value) || roles[0];
  const Icon = currentRole.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 font-medium transition-opacity",
            currentRole.bg, currentRole.color,
            size === "sm" ? "px-2 py-0.5 rounded-md text-xs" : "px-3 py-1 rounded-md text-sm",
            "hover:opacity-80 cursor-pointer"
          )}
        >
          <Icon className="w-3 h-3" />
          {currentRole.label}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {roles.map((role) => {
          const RoleIcon = role.icon;
          return (
            <DropdownMenuItem
              key={role.value}
              onClick={() => onChange(role.value)}
              className={cn(value === role.value && "bg-gray-100")}
            >
              <RoleIcon className={cn("w-4 h-4 mr-2", role.color)} />
              <span className="text-sm">{role.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
