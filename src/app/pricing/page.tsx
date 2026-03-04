"use client";

/**
 * PRICING PAGE - Bhutan EduSkill
 *
 * Displays tiered pricing for schools
 * Rural discounts, Ministry endorsements, Annual savings
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Check,
  X,
  Zap,
  Star,
  Users,
  DollarSign,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  PRICING_TIERS,
  BILLING_CYCLES,
  calculatePrice,
  FREE_TRIAL,
  type PricingTier,
} from "@/lib/pricing-config";

// ============================================================================
// COMPONENT
// ============================================================================

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [isRural, setIsRural] = useState(false);
  const [isMinistryEndorsed, setIsMinistryEndorsed] = useState(false);

  const annualSavings = billingCycle === "annual" ? "Save 16%" : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Invest in your students' future with Bhutan's most comprehensive career
            guidance platform
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="container mx-auto px-4 -mt-8">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-sm text-gray-600 mb-1">Monthly</p>
                <p className="text-xs text-gray-400">Pay month-to-month</p>
              </div>
              <Switch
                checked={billingCycle === "annual"}
                onCheckedChange={(checked) =>
                  setBillingCycle(checked ? "annual" : "monthly")
                }
                className="mx-4"
              />
              <div className="text-center flex-1">
                <p className="text-sm font-semibold text-purple-600 mb-1">
                  Annual
                </p>
                <p className="text-xs text-purple-500">Save 16% (2 months free)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discount Options */}
      <div className="container mx-auto px-4 mt-8">
        <Card className="max-w-2xl mx-auto bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Special Discounts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rural" className="cursor-pointer">
                  Rural School Discount
                  <span className="ml-2 text-sm text-amber-700">(30% off - outside Thimphu, Phuentsholing, Paro)</span>
                </Label>
                <Switch
                  id="rural"
                  checked={isRural}
                  onCheckedChange={setIsRural}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ministry" className="cursor-pointer">
                  Ministry Endorsed
                  <span className="ml-2 text-sm text-amber-700">(50% off - Ministry partnership)</span>
                </Label>
                <Switch
                  id="ministry"
                  checked={isMinistryEndorsed}
                  onCheckedChange={setIsMinistryEndorsed}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => {
            const pricing = calculatePrice(
              tier.id,
              billingCycle,
              isRural,
              isMinistryEndorsed,
              false
            );

            return (
              <PricingCard
                key={tier.id}
                tier={tier}
                pricing={pricing}
                billingCycle={billingCycle}
                isHighlighted={tier.highlight || false}
              />
            );
          })}
        </div>
      </div>

      {/* Free Trial CTA */}
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Start Your Free Trial</h2>
            <p className="text-purple-100 mb-6">
              Try Bhutan EduSkill free for {FREE_TRIAL.duration} days. No credit card required.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              {FREE_TRIAL.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              Start Free Trial
            </Button>
            <p className="text-xs text-purple-200 mt-4">
              Up to {FREE_TRIAL.maxStudents} students • Full access • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <FAQItem
            question="What is included in the free trial?"
            answer="You get full access to all Growth tier features for 30 days. This includes assessments, roadmaps, analytics, and counselor dashboards. No credit card required."
          />
          <FAQItem
            question="Do you offer discounts for rural schools?"
            answer="Yes! Schools outside Thimphu, Phuentsholing, and Paro qualify for a 30% rural discount to ensure equal access across Bhutan."
          />
          <FAQItem
            question="Can I change plans later?"
            answer="Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept bank transfers, mobile banking (B-WISE), and checks. Annual plans can also be paid via government requisition."
          />
          <FAQItem
            question="Do Ministry-endorsed schools get special pricing?"
            answer="Yes! Schools with Ministry endorsement receive 50% off as part of our national partnership program."
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PricingCard({
  tier,
  pricing,
  billingCycle,
  isHighlighted,
}: {
  tier: PricingTier;
  pricing: {
    basePrice: number;
    finalPrice: number;
    discount: number;
    discountPercentage: number;
    appliedDiscounts: string[];
  };
  billingCycle: "monthly" | "annual";
  isHighlighted: boolean;
}) {
  const priceDisplay = billingCycle === "annual"
    ? `Nu. ${pricing.finalPrice.toLocaleString()}/year`
    : `Nu. ${pricing.finalPrice.toLocaleString()}/month`;

  const monthlyEquivalent = billingCycle === "annual"
    ? `≈ Nu. ${Math.round(pricing.finalPrice / 12).toLocaleString()}/month`
    : null;

  return (
    <Card
      className={`relative ${
        isHighlighted
          ? "border-purple-500 shadow-xl scale-105 z-10"
          : "border-gray-200"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-600 text-white px-3 py-1">Most Popular</Badge>
        </div>
      )}

      <CardHeader className={isHighlighted ? "bg-purple-50" : ""}>
        <CardTitle className="flex items-center justify-between">
          <span>{tier.name}</span>
          {isHighlighted && <Star className="w-5 h-5 text-purple-600 fill-purple-600" />}
        </CardTitle>
        <p className="text-sm text-gray-600">{tier.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <DollarSign className="w-4 h-4" />
            <span className="text-3xl font-bold text-gray-900">
              {pricing.finalPrice.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {billingCycle === "monthly" ? "per month" : "per year"}
          </p>
          {monthlyEquivalent && (
            <p className="text-xs text-gray-400">{monthlyEquivalent}</p>
          )}
          {pricing.discount > 0 && (
            <Badge className="mt-2 bg-green-100 text-green-700">
              Save Nu. {pricing.discount.toLocaleString()}
            </Badge>
          )}
        </div>

        {/* Student Limit */}
        <div className="flex items-center justify-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          Up to {tier.maxStudents.toLocaleString()} students
        </div>

        {/* Features */}
        <div className="space-y-2">
          {tier.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
          {tier.limitations.map((limitation, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
              <X className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{limitation}</span>
            </div>
          ))}
        </div>

        {/* Ideal For */}
        {tier.idealFor.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Ideal for:</p>
            <div className="flex flex-wrap gap-1">
              {tier.idealFor.map((ideal, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {ideal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          className={`w-full ${
            isHighlighted
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }`}
        >
          {billingCycle === "monthly" ? "Start Monthly" : "Start Annual"}
        </Button>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-gray-900">{question}</span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isOpen && <p className="mt-3 text-gray-600">{answer}</p>}
      </CardContent>
    </Card>
  );
}
