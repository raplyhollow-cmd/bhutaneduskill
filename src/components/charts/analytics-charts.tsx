/**
 * ANALYTICS CHARTS
 *
 * Simple placeholder components for charts
 * When recharts is installed, these can be replaced with full chart implementations
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// SIMPLE CHART PLACEHOLDERS
// ============================================================================

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  color?: string;
}

export function SimpleBarChart({ data, title, color = "#3b82f6" }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Re-export for compatibility with existing imports
export const analyticsCharts = {
  SimpleBarChart,
};
