/**
 * Student RUB Application API (Singular)
 * Alias for /api/student/rub-applications
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * This provides backward compatibility for pages using the singular form
 */

// Re-export from the plural form
export { GET, POST } from "@/app/api/student/rub-applications/route";
