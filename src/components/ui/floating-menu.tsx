"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FloatingMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}

export function FloatingMenu({ trigger, children, align = "end" }: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={cn(
            // Floating effect - the key to Clerk's sleek look
            "absolute top-full mt-2",
            "z-50",
            // Rounded, compact container
            "min-w-[180px]",
            "py-1",
            // Background: dark with transparency
            "bg-[#1A202C]/95",
            "backdrop-blur-md",
            // Rounded edges - very rounded
            "rounded-xl",
            // Subtle border
            "border border-white/[0.08]",
            // Shadow for floating effect
            "shadow-xl",
            "shadow-black/20",
            // Animation
            "animate-fade-in",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface FloatingMenuItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "danger";
}

export function FloatingMenuItem({
  children,
  icon,
  onClick,
  className,
  variant = "default",
}: FloatingMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Flex layout for icon + text
        "flex items-center gap-3",
        // Full width
        "w-full",
        // Compact padding
        "px-4 py-2.5",
        // Text styling
        "text-sm",
        // Font
        "font-medium",
        variant === "default" ? "text-gray-300" : "text-red-400",
        // Hover effect - subtle background tint
        "hover:bg-white/[0.05]",
        "hover:text-white",
        // Transition
        "transition-colors",
        // No outline
        "outline-none",
        // Cursor
        "cursor-pointer",
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}
