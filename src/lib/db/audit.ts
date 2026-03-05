/**
 * Audit Logging for Database Changes
 *
 * Logs all updates to the users table, especially clerkUserId changes.
 * This helps track down issues like clerkUserId being incorrectly set to database id.
 */

import { db as originalDb } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

// Track if audit is enabled
const AUDIT_ENABLED = process.env.NODE_ENV === "development" || process.env.DB_AUDIT === "true";

/**
 * Wrapped update function that logs clerkUserId changes
 */
export async function auditUpdateUsers(updates: Record<string, any>, where: any) {
  if (AUDIT_ENABLED && updates.clerkUserId) {
    // Get current user state before update
    const currentUsers = await originalDb
      .select({ id: users.id, clerkUserId: users.clerkUserId, email: users.email })
      .from(users)
      .where(where)
      .limit(1);

    if (currentUsers.length > 0) {
      const currentUser = currentUsers[0];

      // AUDIT LOG
      console.error("\n🚨 [AUDIT] clerkUserId UPDATE DETECTED 🚨");
      console.error("  Time:", new Date().toISOString());
      console.error("  User:", currentUser.email);
      console.error("  DB id:", currentUser.id);
      console.error("  OLD clerkUserId:", currentUser.clerkUserId);
      console.error("  NEW clerkUserId:", updates.clerkUserId);
      console.error("  Is revert to DB id?", updates.clerkUserId === currentUser.id ? "YES ⚠️" : "NO");
      console.error("  Is valid Clerk pattern?", updates.clerkUserId?.startsWith("user_") ? "YES ✅" : "NO ❌");
      console.error("\n  STACK TRACE:");
      console.error(new Error().stack);
      console.error("=" .repeat(70) + "\n");
    }
  }

  // Perform the actual update
  return originalDb.update(users).set(updates).where(where);
}

/**
 * Audit wrapper for db.update() on users table
 * Replaces: db.update(users).set({...}).where(...)
 * With: auditUpdateUsers({...}, where)
 */
export { auditUpdateUsers as updateUsersWithAudit };
