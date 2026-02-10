"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface IconSwitchProps {
  iconOutline: React.ReactNode;
  iconFilled: React.ReactNode;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconSwitch({
  iconOutline,
  iconFilled,
  label,
  size = "md",
  className,
}: IconSwitchProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  return (
    <div className={cn("clerk-icon-wrapper group cursor-pointer", className)}>
      <div className="clerk-icon-spotlight">
        <div className="clerk-icon-fade" />
        <div className={cn(
          "clerk-icon-switch",
          sizeClasses[size]
        )}>
          <div className="icon-outline">{iconOutline}</div>
          <div className="icon-filled">{iconFilled}</div>
        </div>
      </div>
      <span className="clerk-icon-label text-white text-sm font-medium">
        {label}
      </span>
    </div>
  );
}
