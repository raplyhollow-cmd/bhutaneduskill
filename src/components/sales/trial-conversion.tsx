"use client";

/**
 * TRIAL TO PAID CONVERSION FLOW
 *
 * Displays when a school's trial is ending
 * Shows value received, plans, and easy conversion
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  TrendingUp,
  Users,
  Award,
  Zap,
  Star,
  CreditCard,
} from "lucide-react";
import {
  PRICING_TIERS,
  calculatePrice,
  type PricingTier,
} from "@/lib/pricing-config";

// ============================================================================
// TYPES
// ============================================================================/

interface TrialStats {
  daysRemaining: number;
  studentsActive: number;
  assessmentsCompleted: number;
  roadmapsCreated: number;
  teacherLogins: number;
  parentViews: number;
}

// ============================================================================
// COMPONENT
// ============================================================================/

export function TrialConversionBanner({
  trialEndsAt,
  onUpgrade,
}: {
  trialEndsAt: Date;
  onUpgrade?: (tier: string) => void;
}) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date();
      const diff = trialEndsAt.getTime() - now.getTime();
      setDaysRemaining(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (daysRemaining > 14) return null; // Only show in last 2 weeks

  const isUrgent = daysRemaining <= 3;

  return (
    <Card
      className={`${
        isUrgent
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isUrgent ? "bg-red-200" : "bg-amber-200"
              }`}
            >
              <Zap className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {isUrgent ? "Trial Ending Soon!" : "Trial Period Active"}
              </p>
              <p className="text-sm text-gray-600">
                {daysRemaining === 0
                  ? "Your trial has ended. Upgrade to continue access."
                  : `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining in your trial.`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => onUpgrade?.("growth")}
            className={isUrgent ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isUrgent ? "Upgrade Now" : "View Plans"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrialConversionModal({
  trialStats,
  trialEndsAt,
  isOpen,
  onClose,
  onSubscribe,
}: {
  trialStats: TrialStats;
  trialEndsAt: Date;
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (tier: string, billingCycle: "monthly" | "annual") => void;
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [selectedTier, setSelectedTier] = useState<string>("growth");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <p className="text-sm text-gray-500">
            Your trial demonstrated the value of Bhutan EduSkill. Keep the momentum going!
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Trial Stats */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">
              Your Trial Results
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <StatCard
                icon={<Users className="w-4 h-4" />}
                value={trialStats.studentsActive.toString()}
                label="Active Students"
              />
              <StatCard
                icon={<Award className="w-4 h-4" />}
                value={trialStats.assessmentsCompleted.toString()}
                label="Assessments"
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                value={trialStats.roadmapsCreated.toString()}
                label="Roadmaps"
              />
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                value={trialStats.teacherLogins.toString()}
                label="Teacher Logins"
              />
              <StatCard
                icon={<Star className="w-4 h-4" />}
                value={trialStats.parentViews.toString()}
                label="Parent Views"
              />
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "annual"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600"
                }`}
              >
                Annual
                <Badge className="ml-2 bg-green-100 text-green-700">Save 16%</Badge>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_TIERS.slice(1, 4).map((tier) => {
              const pricing = calculatePrice(tier.id, billingCycle, false, false, false);
              const isSelected = selectedTier === tier.id;
              const isRecommended = tier.id === "growth";

              return (
                <Card
                  key={tier.id}
                  className={`relative cursor-pointer transition-all ${
                    isSelected
                      ? "border-purple-500 ring-2 ring-purple-200"
                      : isRecommended
                      ? "border-purple-300"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">Recommended</Badge>
                    </div>
                  )}

                  <CardHeader className={isSelected ? "bg-purple-50" : ""}>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">
                        Nu. {pricing.finalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{billingCycle === "annual" ? "year" : "month"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{tier.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Up to {tier.maxStudents.toLocaleString()} students
                    </div>

                    <div className="space-y-1">
                      {tier.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full mt-4 ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                      onClick={() => onSubscribe(tier.id, billingCycle)}
                    >
                      {isSelected ? "Selected" : "Select Plan"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ROI Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Your trial showed real value</h4>
                <p className="text-sm text-green-800 mt-1">
                  With {trialStats.studentsActive} engaged students and{" "}
                  {trialStats.assessmentsCompleted} assessments completed, Bhutan EduSkill
                  is already making a difference. Subscribe to keep building on this momentum.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              I'll decide later
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CreditCard className="w-4 h-4" />
              Bank transfer, mobile banking, and checks accepted
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
        {icon}
      </div>
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// ============================================================================
// TRIAL EXTENSION OFFER (for at-risk conversions)
// ============================================================================/

export function TrialExtensionOffer({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h3 className="font-semibold text-lg">Special Offer</h3>
            </div>
            <p className="text-purple-100 mb-4">
              Need more time? We can extend your trial by 14 days so you can fully
              experience the platform's value.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={onAccept}
              >
                Extend My Trial
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={onDecline}
              >
                No thanks
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
