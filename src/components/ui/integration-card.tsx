"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  iconOutline: ReactNode;
  iconFilled: ReactNode;
  label: string;
  className?: string;
}

export function IntegrationCard({
  iconOutline,
  iconFilled,
  label,
  className,
}: IntegrationCardProps) {
  return (
    <div className={cn("integration-card", className)}>
      <div className="integration-card__content">
        <div className="integration-card__icon">
          {/* Outline version - visible by default */}
          <div className="integration-icon-outline">
            {iconOutline}
          </div>
          {/* Filled version - visible on hover */}
          <div className="integration-icon-filled">
            {iconFilled}
          </div>
        </div>
        <span className="integration-card__label">{label}</span>
      </div>
    </div>
  );
}
