/**
 * STUDENT PORTAL SERVER-SIDE AUTH
 *
 * Server-side authentication wrapper for student portal
 * Bypasses Clerk client-side auth() which fails in client components
 */

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { users } from "@/lib/db/schema";

export async function getStudentAuth() {
  // Server-side auth that bypasses Clerk client issues
  // Returns user info if authenticated, null if not authenticated

  const authResult = await requireAuth(['student']);
  if ('error' in authResult) {
    return null;
  }
  const { user } = authResult;  // Full user object from requireAuth
  return user;
}

export async function fetchStudentAuthForServer() {
  // Direct server-side auth that doesn't rely on Clerk's client auth()
  // Returns user data or null if not authenticated

  const authResult = await requireAuth(['student']);
  if ('error' in authResult) {
    return { user: null, authenticated: false };
  }
  return {
    user: authResult.user,
    authenticated: true,
  };
}

// Wrapper function for student data fetching that uses server-side auth
export async function fetchStudentDataServer() {
  const { user, authenticated } = await fetchStudentAuthForServer();

  if (!authenticated || !user) {
    console.warn("Student not authenticated in fetchStudentDataServer");
    return {
      student: null,
      homework: { pending: 0, submitted: 0, graded: 0, total: 0 },
      assessments: { completed: 0, total: 0 },
      attendance: { rate: 0, presentDays: 0, totalDays: 0 },
      achievements: [],
      deadlines: [],
      careerMatches: { totalMatches: 0, topMatches: 0, topCareer: null, hollandCode: null },
      fees: null,
    };
  }

  // If user exists but auth failed, we still provide data structure
  return {
    student: user,
  };
}
