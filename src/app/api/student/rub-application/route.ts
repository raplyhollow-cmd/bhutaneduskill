/**
 * Student RUB Application API (Singular)
 * Alias for /api/student/rub-applications
 *
 * This provides backward compatibility for pages using the singular form
 */

import { GET as GET_Applications, POST as POST_Applications } from "@/app/api/student/rub-applications/route";
import { NextRequest } from "next/server";

/**
 * GET /api/student/rub-application
 * Get student's current RUB application status
 */
export async function GET(req: NextRequest) {
  return GET_Applications(req);
}

/**
 * POST /api/student/rub-application
 * Create a new RUB application
 */
export async function POST(req: NextRequest) {
  return POST_Applications(req);
}
