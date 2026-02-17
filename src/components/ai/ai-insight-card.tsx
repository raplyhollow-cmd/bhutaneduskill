"use client";

/**
 * AI Insight Card Component
 * Displays AI-generated insights with dismissible option
 */


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type InsightType = "info" | "warning" | "success" | "tip";

export interface InsightAction {
  label: string;
  href: string;
  onClick?: () => void;
}

export interface AIInsightCardProps {
  type: InsightType;
  title: string;
  message: string;
  actions?: InsightAction[];
  dismissible?: boolean;
  className?: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bgGradient: "from-blue-50 to-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderClass: "border-blue-200"
  },
  warning: {
    icon: AlertTriangle,
    bgGradient: "from-amber-50 to-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderClass: "border-amber-200"
  },
  success: {
    icon: CheckCircle,
    bgGradient: "from-green-50 to-green-100",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    borderClass: "border-green-200"
  },
  tip: {
    icon: Lightbulb,
    bgGradient: "from-orange-50 to-orange-100",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    borderClass: "border-orange-200"
  }
};

export function AIInsightCard({
  type,
  title,
  message,
  actions,
  dismissible = true,
  className
}: AIInsightCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "border-2 transition-all duration-300 hover:shadow-md",
      config.borderClass,
      className
    )}>
      <CardContent className={cn(
        "p-4 bg-gradient-to-br",
        config.bgGradient
      )}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.iconBg)}>
            <Icon className={cn("w-5 h-5", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              {dismissible && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{message}</p>

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actions.map((action, index) => {
                  const key = `action-${index}`;
                  if (action.onClick) {
                    return (
                      <Button
                        key={key}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      asChild
                    >
                      <a href={action.href}>{action.label}</a>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}