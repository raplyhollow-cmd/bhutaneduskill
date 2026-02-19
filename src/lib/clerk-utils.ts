/**
 * Clerk API Utilities
 *
 * Helper functions for interacting with the Clerk Backend API.
 * These utilities handle user creation, invitations, and webhook management.
 *
 * @see https://clerk.com/docs/backend-requests/resource/user_api
 */

import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Clerk API response wrapper
 */
interface ClerkApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Clerk User object (partial representation)
 */
interface ClerkUser {
  id: string;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification: {
      status: "verified" | "unverified" | "expired";
    };
  }>;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Clerk Invitation object
 */
interface ClerkInvitation {
  id: string;
  emailAddress: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  publicUrl?: string;
  url?: string;
}

/**
 * Data for creating a Clerk user
 */
export interface CreateClerkUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  phoneNumber?: string;
  skipPasswordChecks?: boolean;
  skipPasswordRequirement?: boolean;
}

/**
 * Data for sending a Clerk invitation
 */
export interface SendInvitationData {
  email: string;
  redirectUrl?: string;
  notify?: boolean;
  expiresInSeconds?: number;
}

/**
 * Webhook signature headers
 */
interface WebhookHeaders {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CLERK_API_BASE = "https://api.clerk.com/v1";
const DEFAULT_INVITE_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// ============================================================================
// HTTP HELPERS
// ============================================================================

/**
 * Create headers for Clerk API requests
 */
function getClerkHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Handle Clerk API response with proper error handling
 */
async function handleClerkResponse<T>(
  response: Response,
  context: string
): Promise<ClerkApiResponse<T>> {
  if (response.ok) {
    const data = await response.json();
    logger.debug(`[Clerk] ${context} successful`, { status: response.status });
    return { success: true, data };
  }

  // Parse error response
  let errorMessage = `Clerk API error: ${response.status} ${response.statusText}`;
  try {
    const errorData = await response.json();
    if (errorData.errors) {
      errorMessage = errorData.errors
        .map((e: { message?: string; longMessage?: string }) => e.longMessage || e.message)
        .join(", ");
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
  } catch {
    // Use default error message if JSON parsing fails
  }

  logger.apiError(new Error(errorMessage), {
    route: context,
    method: "POST",
    status: response.status,
  });

  return { success: false, error: errorMessage };
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Create a new user via Clerk API
 *
 * Creates a user in Clerk with optional profile information.
 * If no password is provided, the user will need to set it via email.
 *
 * @param data - User creation data
 * @returns ClerkApiResponse with created user or error
 *
 * @example
 * ```ts
 * const result = await createClerkUser({
 *   email: "user@example.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   password: "SecurePassword123!"
 * });
 *
 * if (result.success) {
 *   console.log("User created:", result.data.id);
 * }
 * ```
 */
export async function createClerkUser(
  data: CreateClerkUserData
): Promise<ClerkApiResponse<ClerkUser>> {
  try {
    const payload = {
      email_addresses: [
        {
          email_address: data.email,
          verification: {
            status: "verified" as const,
          },
        },
      ],
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      password: data.password,
      skip_password_checks: data.skipPasswordChecks ?? false,
      skip_password_requirement: data.skipPasswordRequirement ?? false,
      phone_phone_number: data.phoneNumber,
    };

    // Remove undefined values
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const response = await fetch(`${CLERK_API_BASE}/users`, {
      method: "POST",
      headers: getClerkHeaders(),
      body: JSON.stringify(cleanedPayload),
    });

    return handleClerkResponse<ClerkUser>(response, "createClerkUser");
  } catch (error) {
    logger.apiError(error, { route: "createClerkUser", method: "POST" });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Clerk user",
    };
  }
}

/**
 * Delete a user from Clerk
 *
 * Permanently deletes a user from Clerk. This action cannot be undone.
 *
 * @param clerkUserId - The Clerk user ID to delete
 * @returns ClerkApiResponse with success status or error
 *
 * @example
 * ```ts
 * const result = await deleteClerkUser("user_abc123");
 * if (result.success) {
 *   console.log("User deleted successfully");
 * }
 * ```
 */
export async function deleteClerkUser(
  clerkUserId: string
): Promise<ClerkApiResponse<null>> {
  try {
    const response = await fetch(`${CLERK_API_BASE}/users/${clerkUserId}`, {
      method: "DELETE",
      headers: getClerkHeaders(),
    });

    return handleClerkResponse<null>(response, "deleteClerkUser");
  } catch (error) {
    logger.apiError(error, {
      route: "deleteClerkUser",
      method: "DELETE",
      clerkUserId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete Clerk user",
    };
  }
}

/**
 * Get a user from Clerk by ID
 *
 * Retrieves a user's information from Clerk.
 *
 * @param clerkUserId - The Clerk user ID
 * @returns ClerkApiResponse with user data or error
 */
export async function getClerkUser(
  clerkUserId: string
): Promise<ClerkApiResponse<ClerkUser>> {
  try {
    const response = await fetch(`${CLERK_API_BASE}/users/${clerkUserId}`, {
      method: "GET",
      headers: getClerkHeaders(),
    });

    return handleClerkResponse<ClerkUser>(response, "getClerkUser");
  } catch (error) {
    logger.apiError(error, { route: "getClerkUser", method: "GET", clerkUserId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get Clerk user",
    };
  }
}

/**
 * Update a user in Clerk
 *
 * Updates user information in Clerk.
 *
 * @param clerkUserId - The Clerk user ID to update
 * @param data - Partial user data to update
 * @returns ClerkApiResponse with updated user or error
 */
export async function updateClerkUser(
  clerkUserId: string,
  data: Partial<CreateClerkUserData>
): Promise<ClerkApiResponse<ClerkUser>> {
  try {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      phone_phone_number: data.phoneNumber,
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const response = await fetch(`${CLERK_API_BASE}/users/${clerkUserId}`, {
      method: "PATCH",
      headers: getClerkHeaders(),
      body: JSON.stringify(cleanedPayload),
    });

    return handleClerkResponse<ClerkUser>(response, "updateClerkUser");
  } catch (error) {
    logger.apiError(error, {
      route: "updateClerkUser",
      method: "PATCH",
      clerkUserId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update Clerk user",
    };
  }
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Send an invitation via Clerk
 *
 * Creates and sends an invitation email to a user.
 * The user can click the link to sign up and be directed to your app.
 *
 * @param data - Invitation data including email and redirect URL
 * @returns ClerkApiResponse with invitation details or error
 *
 * @example
 * ```ts
 * const result = await sendInvitation({
 *   email: "newuser@example.com",
 *   redirectUrl: "https://yourapp.com/setup/unified"
 * });
 *
 * if (result.success) {
 *   console.log("Invitation sent:", result.data.publicUrl);
 * }
 * ```
 */
export async function sendInvitation(
  data: SendInvitationData
): Promise<ClerkApiResponse<ClerkInvitation>> {
  try {
    const payload = {
      email_address: data.email,
      redirect_url: data.redirectUrl ?? `${env.NEXT_PUBLIC_APP_URL}/setup/unified`,
      notify: data.notify ?? true,
      expires_in_seconds: data.expiresInSeconds ?? DEFAULT_INVITE_EXPIRY,
    };

    const response = await fetch(`${CLERK_API_BASE}/invitations`, {
      method: "POST",
      headers: getClerkHeaders(),
      body: JSON.stringify(payload),
    });

    return handleClerkResponse<ClerkInvitation>(response, "sendInvitation");
  } catch (error) {
    logger.apiError(error, { route: "sendInvitation", method: "POST", email: data.email });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send invitation",
    };
  }
}

/**
 * Revoke a pending invitation
 *
 * Revokes an invitation that hasn't been accepted yet.
 *
 * @param invitationId - The invitation ID to revoke
 * @returns ClerkApiResponse with success status or error
 */
export async function revokeInvitation(
  invitationId: string
): Promise<ClerkApiResponse<ClerkInvitation>> {
  try {
    const response = await fetch(`${CLERK_API_BASE}/invitations/${invitationId}/revoke`, {
      method: "POST",
      headers: getClerkHeaders(),
    });

    return handleClerkResponse<ClerkInvitation>(response, "revokeInvitation");
  } catch (error) {
    logger.apiError(error, {
      route: "revokeInvitation",
      method: "POST",
      invitationId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke invitation",
    };
  }
}

/**
 * List all pending invitations
 *
 * Gets a list of all pending invitations in your application.
 *
 * @returns ClerkApiResponse with invitations array or error
 */
export async function listInvitations(): Promise<
  ClerkApiResponse<ClerkInvitation[]>
> {
  try {
    const response = await fetch(`${CLERK_API_BASE}/invitations?status=pending`, {
      method: "GET",
      headers: getClerkHeaders(),
    });

    const result = await handleClerkResponse<{ data: ClerkInvitation[] }>(
      response,
      "listInvitations"
    );

    if (result.success && result.data) {
      return { success: true, data: result.data.data };
    }

    return result as unknown as ClerkApiResponse<ClerkInvitation[]>;
  } catch (error) {
    logger.apiError(error, { route: "listInvitations", method: "GET" });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list invitations",
    };
  }
}

// ============================================================================
// PASSWORD GENERATION
// ============================================================================

/**
 * Generate a secure random password
 *
 * Creates a random password that meets common security requirements:
 * - At least 12 characters
 * - Contains uppercase and lowercase letters
 * - Contains numbers
 * - Contains special characters
 *
 * @param length - Password length (default: 16, min: 8)
 * @returns Secure random password
 *
 * @example
 * ```ts
 * const password = generateRandomPassword(16);
 * console.log(password); // "aB3$xY9#pQ2@mN7"
 * ```
 */
export function generateRandomPassword(length: number = 16): string {
  const minLength = 8;
  const actualLength = Math.max(length, minLength);

  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure at least one character from each set
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + special;
  const crypto = window.crypto || (typeof global !== "undefined" ? global.crypto : null);

  if (crypto && crypto.getRandomValues) {
    const randomValues = new Uint32Array(actualLength - 4);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < actualLength - 4; i++) {
      password += allChars[randomValues[i] % allChars.length];
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < actualLength - 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
  }

  // Shuffle the password to randomize character positions
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// ============================================================================
// WEBHOOK UTILITIES
// ============================================================================

/**
 * Verify a Clerk webhook signature
 *
 * Verifies that a webhook request actually came from Clerk by checking
 * the Svix signature headers.
 *
 * Note: This requires the 'svix' package. Install with:
 * npm install svix
 *
 * @param headers - Webhook signature headers
 * @param payload - Raw webhook payload string
 * @param secret - Clerk webhook secret (optional, falls back to CLERK_WEBHOOK_SECRET env var)
 * @returns True if signature is valid, false otherwise
 *
 * @example
 * ```ts
 * import { headers } from 'next/headers';
 * import { createClerkWebhookVerifier } from '@/lib/clerk-utils';
 *
 * export async function POST(req: Request) {
 *   const payload = await req.text();
 *   const headerPayload = Object.fromEntries(await headers());
 *
 *   const verifier = createClerkWebhookVerifier();
 *   const isValid = await verifier.verify(payload, headerPayload);
 *
 *   if (!isValid) {
 *     return Response.json({ error: "Invalid signature" }, { status: 401 });
 *   }
 *
 *   // Process webhook...
 * }
 * ```
 */
export async function verifyClerkWebhookSignature(
  payload: string,
  headers: Partial<WebhookHeaders>,
  secret?: string
): Promise<boolean> {
  try {
    // Dynamic import to avoid issues when svix is not installed
    const { Webhook } = await import("svix");

    const webhookSecret =
      secret ?? process.env.CLERK_WEBHOOK_SECRET ?? env.CLERK_SECRET_KEY;

    if (!webhookSecret) {
      logger.error(new Error("CLERK_WEBHOOK_SECRET is not configured"));
      return false;
    }

    const wh = new Webhook(webhookSecret);

    // Verify the webhook
    wh.verify(payload, {
      "svix-id": headers["svix-id"] ?? "",
      "svix-timestamp": headers["svix-timestamp"] ?? "",
      "svix-signature": headers["svix-signature"] ?? "",
    });

    return true;
  } catch (error) {
    logger.security("webhook_verification_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Create a webhook signature for testing
 *
 * This is a helper for creating test signatures during development.
 * Do NOT use this in production for verifying incoming webhooks.
 *
 * @param payload - The payload to sign
 * @param secret - The secret to sign with
 * @returns Object with signature headers
 */
export function createClerkWebhookSignature(
  payload: string,
  secret: string
): WebhookHeaders {
  // This is a placeholder for testing purposes
  // In production, use the Svix library to verify signatures
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = Buffer.from(`${timestamp}.${payload}`).toString("base64");

  return {
    "svix-id": `test_${Date.now()}`,
    "svix-timestamp": timestamp,
    "svix-signature": signature,
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Bulk create users in Clerk
 *
 * Creates multiple users efficiently with rate limit handling.
 *
 * @param users - Array of user creation data
 * @param batchSize - Number of users to create per batch (default: 10)
 * @returns Object with successful and failed creations
 *
 * @example
 * ```ts
 * const result = await bulkCreateClerkUsers([
 *   { email: "user1@example.com", firstName: "User", lastName: "One" },
 *   { email: "user2@example.com", firstName: "User", lastName: "Two" },
 * ]);
 *
 * console.log(`Created: ${result.successful.length}`);
 * console.log(`Failed: ${result.failed.length}`);
 * ```
 */
export async function bulkCreateClerkUsers(
  users: CreateClerkUserData[],
  batchSize: number = 10
): Promise<{
  successful: Array<{ user: CreateClerkUserData; clerkId: string }>;
  failed: Array<{ user: CreateClerkUserData; error: string }>;
}> {
  const successful: Array<{ user: CreateClerkUserData; clerkId: string }> = [];
  const failed: Array<{ user: CreateClerkUserData; error: string }> = [];

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (user) => {
        const result = await createClerkUser(user);
        return { user, result };
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.result.success) {
        successful.push({
          user: r.value.user,
          clerkId: r.value.result.data!.id,
        });
      } else {
        failed.push({
          user: r.status === "fulfilled" ? r.value.user : { email: "unknown", firstName: "", lastName: "" },
          error:
            r.status === "rejected"
              ? (r.reason as Error)?.message ?? "Unknown error"
              : r.value.result.error ?? "Failed to create user",
        });
      }
    }

    // Rate limit delay: 100ms between batches
    if (i + batchSize < users.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  logger.info("Bulk Clerk user creation completed", {
    total: users.length,
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Export all utilities as a named export object for convenience
 */
export const clerkUtils = {
  createUser: createClerkUser,
  deleteUser: deleteClerkUser,
  getUser: getClerkUser,
  updateUser: updateClerkUser,
  sendInvitation,
  revokeInvitation,
  listInvitations,
  generateRandomPassword,
  verifyWebhook: verifyClerkWebhookSignature,
  bulkCreateUsers: bulkCreateClerkUsers,
};
