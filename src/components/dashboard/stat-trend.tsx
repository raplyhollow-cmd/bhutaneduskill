/**
 * Stat Trend Component
 *
 * Displays a statistic with trend indicator and mini sparkline.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTrendProps {
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatTrend({
  value,
  label,
  trend = "neutral",
  trendValue,
  icon,
  className,
}: StatTrendProps) {
  const trendConfig = {
    up: { icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    down: { icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    neutral: { icon: Minus, color: "text-gray-500", bg: "bg-gray-50" },
  };

  const { icon: TrendIcon, color, bg } = trendConfig[trend];

  return (
    <div className={cn("p-6 bg-white border border-gray-100 rounded-2xl", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {trendValue && (
        <div className={cn("mt-4 flex items-center gap-2", color)}>
          <div className={cn("p-1 rounded", bg)}>
            <TrendIcon className="w-3 h-3" />
          </div>
          <span className="text-sm font-medium">{trendValue}</span>
        </div>
      )}
    </div>
  );
}
