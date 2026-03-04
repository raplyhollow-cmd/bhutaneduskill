/**
 * BHUTAN EDUSKILL PRICING MODEL
 *
 * Tiered subscription pricing for Bhutan schools
 * Currency: Bhutanese Ngultrum (Nu.)
 */

// ============================================================================
// PRICING TIERS
// ============================================================================

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // Nu. per month
  annualPrice: number; // Nu. per year (2 months free = 10 months)
  maxStudents: number;
  features: string[];
  limitations: string[];
  idealFor: string[];
  highlight?: boolean; // For featured tier
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small schools starting their career guidance journey",
    monthlyPrice: 3000,
    annualPrice: 30000, // 2 months free
    maxStudents: 100,
    features: [
      "Up to 100 students",
      "RIASEC & MBTI assessments",
      "Basic career matching",
      "Student roadmaps",
      "Teacher dashboard",
      "Email support",
      "Monthly reports",
    ],
    limitations: [
      "No advanced analytics",
      "No workforce predictions",
      "No ministry integration",
      "No GNH tracking",
      "No phone support",
    ],
    idealFor: ["Primary schools", "Small private schools (<100 students)"],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing schools with comprehensive career programs",
    monthlyPrice: 10000,
    annualPrice: 100000,
    maxStudents: 500,
    features: [
      "Up to 500 students",
      "All Starter features",
      "BCSE readiness tracking",
      "RUB college matching",
      "Advanced analytics",
      "Counselor dashboard",
      "Parent portal access",
      "Priority email support",
      "Weekly reports",
      "GNH basic tracking",
    ],
    limitations: [
      "No workforce predictions",
      "No custom integrations",
      "No phone support",
    ],
    idealFor: ["Middle secondary schools", "Growing private schools"],
    highlight: true, // Featured tier
  },
  {
    id: "premier",
    name: "Premier",
    description: "For established schools wanting full intelligence capabilities",
    monthlyPrice: 25000,
    annualPrice: 250000,
    maxStudents: 1500,
    features: [
      "Up to 1,500 students",
      "All Growth features",
      "Workforce predictions",
      "Ministry integration",
      "Advanced GNH analytics",
      "Custom assessments",
      "API access",
      "Phone & email support",
      "Daily reports",
      "Dedicated account manager",
      "On-site training (1 day/quarter)",
    ],
    limitations: [],
    idealFor: ["Higher secondary schools", "Large private schools", "Institutions"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For school networks and districts wanting complete control",
    monthlyPrice: 50000,
    annualPrice: 500000,
    maxStudents: 5000,
    features: [
      "Up to 5,000 students",
      "All Premier features",
      "Multi-school management",
      "District-level analytics",
      "Custom integrations",
      "White-label options",
      "SLA guarantee",
      "24/7 priority support",
      "Unlimited training",
      "Dedicated success team",
      "Ministry reporting suite",
    ],
    limitations: [],
    idealFor: ["School networks", "Districts", "Ministry departments"],
  },
];

// ============================================================================
// BHUTAN-SPECIFIC PRICING
// ============================================================================

/**
 * Rural school discount (30% off)
 * Applies to schools outside Thimphu, Phuentsholing, Paro
 */
export const RURAL_DISCOUNT = 0.3;

/**
 * Multi-year discount (10% off for 2+ years)
 */
export const MULTIYEAR_DISCOUNT = 0.1;

/**
 * Ministry partnership discount (50% off)
 * For schools endorsed by Ministry of Education
 */
export const MINISTRY_DISCOUNT = 0.5;

/**
 * Calculate price with discounts
 */
export function calculatePrice(
  tierId: string,
  billingCycle: "monthly" | "annual",
  isRural: boolean = false,
  isMinistryEndorsed: boolean = false,
  multiYear: boolean = false
): {
  basePrice: number;
  finalPrice: number;
  discount: number;
  discountPercentage: number;
  appliedDiscounts: string[];
} {
  const tier = PRICING_TIERS.find((t) => t.id === tierId);
  if (!tier) {
    throw new Error(`Invalid tier: ${tierId}`);
  }

  const basePrice = billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
  let finalPrice = basePrice;
  let discount = 0;
  const appliedDiscounts: string[] = [];

  // Apply annual billing discount (built into pricing)
  if (billingCycle === "annual") {
    const monthlyPrice = tier.monthlyPrice * 12;
    const savings = monthlyPrice - basePrice;
    discount += savings;
    appliedDiscounts.push("Annual billing (2 months free)");
  }

  // Apply rural discount
  if (isRural) {
    const ruralDiscount = basePrice * RURAL_DISCOUNT;
    discount += ruralDiscount;
    finalPrice -= ruralDiscount;
    appliedDiscounts.push(`Rural school discount (${RURAL_DISCOUNT * 100}% off)`);
  }

  // Apply ministry endorsement discount
  if (isMinistryEndorsed) {
    const ministryDiscount = basePrice * MINISTRY_DISCOUNT;
    discount += ministryDiscount;
    finalPrice -= ministryDiscount;
    appliedDiscounts.push(`Ministry endorsement (${MINISTRY_DISCOUNT * 100}% off)`);
  }

  // Apply multi-year discount
  if (multiYear) {
    const multiDiscount = basePrice * MULTIYEAR_DISCOUNT;
    discount += multiDiscount;
    finalPrice -= multiDiscount;
    appliedDiscounts.push(`Multi-year commitment (${MULTIYEAR_DISCOUNT * 100}% off)`);
  }

  return {
    basePrice,
    finalPrice: Math.max(0, Math.round(finalPrice)),
    discount: Math.round(discount),
    discountPercentage: Math.round((discount / basePrice) * 100),
    appliedDiscounts,
  };
}

// ============================================================================
// SEAT PRICING (for overages)
// ============================================================================

/**
 * Price per additional student beyond tier limit
 */
export const ADDITIONAL_SEAT_PRICE = {
  starter: 50, // Nu. per student per month
  growth: 30,
  premier: 25,
  enterprise: 20,
} as const;

/**
 * Calculate cost for additional students
 */
export function calculateAdditionalSeats(
  tierId: string,
  additionalStudents: number,
  billingCycle: "monthly" | "annual" = "monthly"
): number {
  const pricePerSeat = ADDITIONAL_SEAT_PRICE[tierId as keyof typeof ADDITIONAL_SEAT_PRICE] || 30;
  const months = billingCycle === "annual" ? 12 : 1;
  return additionalStudents * pricePerSeat * months;
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

export interface Recommendation {
  tier: PricingTier;
  reason: string;
  estimatedMonthlyCost: number;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

/**
 * Recommend tier based on school profile
 */
export function recommendTier(params: {
  studentCount: number;
  hasCareerCounselor: boolean;
  wantsAdvancedAnalytics: boolean;
  wantsMinistryIntegration: boolean;
  isRural: boolean;
}): Recommendation {
  const { studentCount, wantsAdvancedAnalytics, wantsMinistryIntegration } = params;

  // Base tier on student count
  let tier = PRICING_TIERS.find((t) => studentCount <= t.maxStudents) || PRICING_TIERS[3];

  // Upgrade if they need advanced features
  if (wantsMinistryIntegration) {
    tier = PRICING_TIERS.find((t) => t.id === "enterprise") || tier;
  } else if (wantsAdvancedAnalytics) {
    if (tier.id === "starter" || tier.id === "growth") {
      tier = PRICING_TIERS.find((t) => t.id === "premier") || tier;
    }
  }

  const reasons: string[] = [];

  if (studentCount > tier.maxStudents) {
    reasons.push(`Your ${studentCount} students exceed the tier limit`);
  }

  if (wantsAdvancedAnalytics && tier.id === "growth") {
    reasons.push("Consider Premier for workforce predictions");
  }

  if (wantsMinistryIntegration && tier.id !== "enterprise") {
    reasons.push("Consider Enterprise for ministry integration");
  }

  if (params.isRural) {
    reasons.push("Rural school discount available (30% off)");
  }

  const estimatedMonthlyCost = calculatePrice(
    tier.id,
    "monthly",
    params.isRural,
    false,
    false
  ).finalPrice;

  return {
    tier,
    reason: reasons.join(". ") || `Best fit for ${studentCount} students`,
    estimatedMonthlyCost,
    canUpgrade: tier.id !== "enterprise",
    canDowngrade: tier.id !== "starter",
  };
}

// ============================================================================
// FREE TRIAL
// ============================================================================

export const FREE_TRIAL = {
  duration: 30, // days
  maxStudents: 200, // trial limit
  features: [
    "All Growth tier features",
    "Full platform access",
    "Setup support",
    "Trial period analytics",
  ],
  limitations: [
    "No data export",
    "No custom integrations",
    "Support via email only",
  ],
} as const;

/**
 * Calculate trial end date
 */
export function getTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + FREE_TRIAL.duration);
  return endDate;
}

// ============================================================================
// BILLING CYCLE
// ============================================================================

export interface BillingCycle {
  id: "monthly" | "annual";
  name: string;
  description: string;
  discountMonths: number; // Free months
}

export const BILLING_CYCLES: BillingCycle[] = [
  {
    id: "monthly",
    name: "Monthly",
    description: "Pay month-to-month",
    discountMonths: 0,
  },
  {
    id: "annual",
    name: "Annual",
    description: "Pay annually and save 16% (2 months free)",
    discountMonths: 2,
  },
];

// ============================================================================
// EXPORT
// ============================================================================

// PricingTier is already exported as interface above
