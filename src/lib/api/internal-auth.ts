/**
 * Internal API Authentication
 *
 * For service-to-service communication within the platform.
 * Uses a shared secret for internal endpoints.
 */

import { env } from "@/lib/env";

const INTERNAL_API_KEY = env.INTERNAL_API_KEY || "internal-dev-key-change-in-production";

export function verifyInternalApiKey(key: string): boolean {
  return key === INTERNAL_API_KEY;
}

export function getInternalApiKeyHeader(): string {
  return `Bearer ${INTERNAL_API_KEY}`;
}