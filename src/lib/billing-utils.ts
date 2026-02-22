/**
 * Billing & Subscription Utilities
 *
 * Provides seat capacity checking and subscription tier management
 * to enforce revenue protection limits.
 */

import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum student capacity per subscription tier
 */
export const TIER_LIMITS = {
  free: 50,
  basic: 100,
  standard: 500,
  premium: 1000,
  enterprise: 10000, // Effectively unlimited
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

/**
 * Seat capacity check result
 */
export interface SeatCapacityResult {
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  remainingSeats: number;
  incomingCount: number;
  tier: SubscriptionTier | string;
  message?: string;
}

// ============================================================================
// SEAT CAPACITY CHECKS
// ============================================================================

/**
 * Get the current student count for a school
 */
async function getCurrentStudentCount(schoolId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.schoolId, schoolId),
        eq(users.type, "student"),
        eq(users.isActive, true)
      )
    );

  return result?.count || 0;
}

/**
 * Get school subscription tier and limits
 */
async function getSchoolLimits(schoolId: string): Promise<{
  tier: string;
  maxStudents: number;
}> {
  const [school] = await db
    .select({
      subscriptionTier: schools.subscriptionTier,
      maxStudents: schools.maxStudents,
    })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) {
    throw new Error(`School not found: ${schoolId}`);
  }

  // If maxStudents is explicitly set, use it
  // Otherwise derive from tier
  const tier = (school.subscriptionTier || "standard") as SubscriptionTier;
  const tierLimit = TIER_LIMITS[tier] || TIER_LIMITS.standard;
  const maxStudents = school.maxStudents || tierLimit;

  return { tier, maxStudents };
}

/**
 * Check if a school has capacity for additional students
 *
 * @param schoolId - The school ID to check
 * @param incomingCount - Number of students to be added
 * @returns SeatCapacityResult with details
 * @throws Error if school not found
 */
export async function checkSeatCapacity(
  schoolId: string,
  incomingCount: number
): Promise<SeatCapacityResult> {
  // Get school limits
  const { tier, maxStudents } = await getSchoolLimits(schoolId);

  // Get current student count
  const currentCount = await getCurrentStudentCount(schoolId);

  // Calculate capacity
  const remainingSeats = Math.max(0, maxStudents - currentCount);
  const allowed = currentCount + incomingCount <= maxStudents;

  // Build result
  const result: SeatCapacityResult = {
    allowed,
    currentCount,
    maxCount: maxStudents,
    remainingSeats,
    incomingCount,
    tier,
  };

  // Add message if not allowed
  if (!allowed) {
    result.message = `Capacity exceeded. Your ${tier} plan limit is ${maxStudents} students. Currently using ${currentCount}. Please upgrade to add ${incomingCount} more students.`;
  }

  return result;
}

/**
 * Check if school is approaching capacity (90% threshold)
 * Useful for showing warnings in UI
 *
 * @param schoolId - The school ID to check
 * @returns Object with capacity info and warning flag
 */
export async function getCapacityStatus(schoolId: string): Promise<{
  currentCount: number;
  maxCount: number;
  usagePercentage: number;
  remainingSeats: number;
  needsWarning: boolean; // At 90% capacity
  isAtCapacity: boolean; // At 100% capacity
}> {
  const { tier, maxStudents } = await getSchoolLimits(schoolId);
  const currentCount = await getCurrentStudentCount(schoolId);

  const usagePercentage = Math.min(100, Math.round((currentCount / maxStudents) * 100));
  const remainingSeats = Math.max(0, maxStudents - currentCount);

  return {
    currentCount,
    maxCount: maxStudents,
    usagePercentage,
    remainingSeats,
    needsWarning: usagePercentage >= 90,
    isAtCapacity: currentCount >= maxStudents,
  };
}

/**
 * Enforce seat capacity - throws error if insufficient capacity
 * Use this in API routes to block operations that would exceed limits
 *
 * @param schoolId - The school ID to check
 * @param incomingCount - Number of students to be added
 * @throws Error if capacity would be exceeded
 */
export async function enforceSeatCapacity(
  schoolId: string,
  incomingCount: number
): Promise<void> {
  const result = await checkSeatCapacity(schoolId, incomingCount);

  if (!result.allowed) {
    logger.security("seat_capacity_exceeded", {
      schoolId,
      currentCount: result.currentCount,
      maxCount: result.maxCount,
      incomingCount,
      tier: result.tier,
    });

    throw new Error(result.message);
  }
}

// ============================================================================
// TIER MANAGEMENT
// ============================================================================

/**
 * Get the capacity limit for a given tier
 */
export function getTierLimit(tier: SubscriptionTier | string): number {
  return TIER_LIMITS[tier as SubscriptionTier] || TIER_LIMITS.standard;
}

/**
 * Get all available tiers and their limits
 */
export function getAllTierLimits(): Record<string, number> {
  return { ...TIER_LIMITS };
}

/**
 * Calculate recommended tier based on student count
 */
export function recommendTier(studentCount: number): SubscriptionTier {
  if (studentCount <= TIER_LIMITS.free) return "free";
  if (studentCount <= TIER_LIMITS.basic) return "basic";
  if (studentCount <= TIER_LIMITS.standard) return "standard";
  if (studentCount <= TIER_LIMITS.premium) return "premium";
  return "enterprise";
}
