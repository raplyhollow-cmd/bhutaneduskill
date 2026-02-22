"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface CapacityStatus {
  currentCount: number;
  maxCount: number;
  usagePercentage: number;
  remainingSeats: number;
  needsWarning: boolean;
  isAtCapacity: boolean;
}

export function CapacityStatusCard() {
  const [capacity, setCapacity] = useState<CapacityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCapacity() {
      try {
        const response = await fetch("/api/school-admin/capacity");
        if (response.ok) {
          const result = await response.json();
          setCapacity(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch capacity:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCapacity();
  }, []);

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Seat Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-slate-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!capacity) {
    return null;
  }

  // Determine status styling
  const getStatusConfig = () => {
    if (capacity.isAtCapacity) {
      return {
        variant: "destructive" as const,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        icon: XCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        message: "At Capacity",
      };
    }
    if (capacity.needsWarning) {
      return {
        variant: "default" as const,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-700",
        icon: AlertTriangle,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        message: "Approaching Limit",
      };
    }
    return {
      variant: "default" as const,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      message: "Within Limits",
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <Card className={`border-2 ${status.borderColor} ${status.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            Seat Capacity
          </CardTitle>
          <Badge
            variant={capacity.isAtCapacity ? "destructive" : capacity.needsWarning ? "default" : "outline"}
            className={capacity.isAtCapacity ? "" : status.textColor}
          >
            {status.message}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900">
              {capacity.currentCount}
              <span className="text-lg font-normal text-slate-500"> / {capacity.maxCount}</span>
            </p>
            <p className="text-sm text-slate-600">students enrolled</p>
          </div>
          <div className={`w-14 h-14 rounded-full ${status.iconBg} flex items-center justify-center`}>
            <StatusIcon className={`w-7 h-7 ${status.iconColor}`} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Usage</span>
            <span className="font-medium">{capacity.usagePercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacity.isAtCapacity
                  ? "bg-red-500"
                  : capacity.needsWarning
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(capacity.usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Remaining Seats */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
          <span className="text-sm text-slate-600">Remaining seats</span>
          <span className={`text-lg font-bold ${capacity.remainingSeats === 0 ? "text-red-600" : "text-green-600"}`}>
            {capacity.remainingSeats === 0 ? "Full" : capacity.remainingSeats}
          </span>
        </div>

        {/* Warning Message */}
        {capacity.needsWarning && (
          <div className={`p-3 rounded-lg ${status.bgColor} border ${status.borderColor}`}>
            <p className={`text-sm ${status.textColor}`}>
              {capacity.isAtCapacity
                ? "Your school has reached its student capacity. Upgrade your plan to add more students."
                : `You're approaching your capacity limit. Only ${capacity.remainingSeats} seat${
                    capacity.remainingSeats !== 1 ? "s" : ""
                  } remaining.`}
            </p>
          </div>
        )}

        {/* Action Button */}
        {capacity.needsWarning && (
          <Button
            variant={capacity.isAtCapacity ? "default" : "outline"}
            className={`w-full ${
              capacity.isAtCapacity
                ? "bg-red-600 hover:bg-red-700 text-white"
                : `${status.textColor} ${status.borderColor} hover:${status.bgColor}`
            }`}
            asChild
          >
            <Link href="/school-admin/settings/billing">
              {capacity.isAtCapacity ? "Upgrade Plan" : "View Plans"} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
