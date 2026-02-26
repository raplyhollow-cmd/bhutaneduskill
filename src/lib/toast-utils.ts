/**
 * TOAST UTILITIES
 *
 * Centralized toast notification helpers for consistent user feedback
 * throughout the application. Replaces all alert() calls.
 *
 * @example
 * ```tsx
 * import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
 *
 * // Success toast
 * showSuccessToast("User created", "John Doe has been added successfully.");
 *
 * // Error toast
 * showErrorToast("Failed to save", "Please check your connection and try again.");
 *
 * // Loading toast (for async operations)
 * const dismiss = showLoadingToast("Saving changes...");
 * await saveData();
 * dismiss();
 * showSuccessToast("Changes saved");
 * ```
 */

import { useToast } from "@/components/ui/toaster";

// ============================================================================
// TOAST MESSAGE TEMPLATES
// ============================================================================

export const ToastMessages = {
  // Common actions
  created: (item: string) => ({ title: `${item} created`, description: `The ${item.toLowerCase()} has been created successfully.` }),
  updated: (item: string) => ({ title: `${item} updated`, description: `The ${item.toLowerCase()} has been updated successfully.` }),
  deleted: (item: string) => ({ title: `${item} deleted`, description: `The ${item.toLowerCase()} has been deleted.` }),
  saved: (item?: string) => ({ title: "Changes saved", description: item ? `${item} has been saved.` : "Your changes have been saved successfully." }),

  // Error messages
  createFailed: (item: string) => ({ title: `Failed to create ${item.toLowerCase()}`, description: `Please check your inputs and try again.` }),
  updateFailed: (item: string) => ({ title: `Failed to update ${item.toLowerCase()}`, description: `Please check your inputs and try again.` }),
  deleteFailed: (item: string) => ({ title: `Failed to delete ${item.toLowerCase()}`, description: `Please try again.` }),
  saveFailed: { title: "Failed to save", description: "Please check your connection and try again." },
  networkError: { title: "Network error", description: "Please check your connection and try again." },

  // Status messages
  loading: { title: "Loading...", description: "Please wait while we fetch the data." },
  saving: { title: "Saving...", description: "Please wait while we save your changes." },
  processing: { title: "Processing...", description: "Please wait while we process your request." },

  // Form actions
  formSaved: { title: "Form saved", description: "Your changes have been saved successfully." },
  formSubmitted: { title: "Form submitted", description: "Your form has been submitted successfully." },
  formCancelled: { title: "Action cancelled", description: "The action has been cancelled." },

  // User actions
  loginSuccess: { title: "Welcome back!", description: "You have been logged in successfully." },
  logoutSuccess: { title: "Logged out", description: "You have been logged out successfully." },
  profileUpdated: { title: "Profile updated", description: "Your profile has been updated successfully." },

  // Approval actions
  approved: (item: string) => ({ title: `${item} approved`, description: `The ${item.toLowerCase()} has been approved.` }),
  rejected: (item: string) => ({ title: `${item} rejected`, description: `The ${item.toLowerCase()} has been rejected.` }),
  pending: (item: string) => ({ title: `${item} pending approval`, description: `The ${item.toLowerCase()} is pending approval.` }),

  // Data operations
  dataLoaded: { title: "Data loaded", description: "The data has been loaded successfully." },
  dataRefreshed: { title: "Data refreshed", description: "The data has been refreshed successfully." },
  exportSuccess: { title: "Export successful", description: "Your data has been exported." },
  importSuccess: { title: "Import successful", description: "Your data has been imported." },

  // Validation
  validationError: { title: "Validation error", description: "Please check your inputs and try again." },
  requiredFields: { title: "Required fields", description: "Please fill in all required fields." },

  // Permissions
  accessDenied: { title: "Access denied", description: "You don't have permission to perform this action." },
  unauthorized: { title: "Unauthorized", description: "Please log in to continue." },
};

// Helper to get toast message values as array
function getToastMessage(message: { title: string; description?: string }): [string, string?] {
  return [message.title, message.description];
}

// ============================================================================
// TOAST HELPER FUNCTIONS (to be used with useToast hook)
// ============================================================================

/**
 * Show a success toast notification (requires useToast hook)
 * @deprecated Use the useToast hook directly: `const { toast } = useToast(); toast({ title, variant: "success" })`
 */
export function showSuccessToast(
  title: string,
  description?: string,
  options?: { duration?: number }
): string {
  // This is a client-side helper - in practice, use the useToast hook
  if (typeof window === "undefined") return "";

  // Dynamic import to avoid SSR issues
  const { toast: toastFn } = require("@/components/ui/toaster");
  return toastFn({
    title,
    description,
    variant: "success",
    duration: options?.duration ?? 3000,
  });
}

/**
 * Show an error toast notification (requires useToast hook)
 * @deprecated Use the useToast hook directly: `const { toast } = useToast(); toast({ title, variant: "error" })`
 */
export function showErrorToast(
  title: string,
  description?: string,
  options?: { duration?: number }
): string {
  if (typeof window === "undefined") return "";

  const { toast: toastFn } = require("@/components/ui/toast");
  return toastFn({
    title,
    description,
    variant: "error",
    duration: options?.duration ?? 5000,
  });
}

/**
 * Show a warning toast notification (requires useToast hook)
 * @deprecated Use the useToast hook directly: `const { toast } = useToast(); toast({ title, variant: "warning" })`
 */
export function showWarningToast(
  title: string,
  description?: string,
  options?: { duration?: number }
): string {
  if (typeof window === "undefined") return "";

  const { toast: toastFn } = require("@/components/ui/toast");
  return toastFn({
    title,
    description,
    variant: "warning",
    duration: options?.duration ?? 4000,
  });
}

/**
 * Show an info toast notification (requires useToast hook)
 * @deprecated Use the useToast hook directly: `const { toast } = useToast(); toast({ title, variant: "info" })`
 */
export function showInfoToast(
  title: string,
  description?: string,
  options?: { duration?: number }
): string {
  if (typeof window === "undefined") return "";

  const { toast: toastFn } = require("@/components/ui/toast");
  return toastFn({
    title,
    description,
    variant: "info",
    duration: options?.duration ?? 4000,
  });
}

/**
 * Show a loading toast notification
 * Returns a dismiss function to close the toast manually
 */
export function showLoadingToast(
  title: string,
  description?: string
): () => void {
  if (typeof window === "undefined") return () => {};

  const { toast: toastFn, dismiss } = require("@/components/ui/toaster");
  const id = toastFn({
    title,
    description,
    variant: "loading",
    duration: 0, // Manual dismiss
  });
  return () => dismiss(id);
}

// ============================================================================
// SPECIFIC ENTITY HELPERS
// ============================================================================

/**
 * Toast helpers for specific entity types
 * NOTE: These helpers must be called from client components that use the useToast hook
 */
export const EntityToast = {
  student: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("Student"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Student"))),
    deleted: () => showSuccessToast(...getToastMessage(ToastMessages.deleted("Student"))),
    createFailed: (error?: string) => showErrorToast(ToastMessages.createFailed("Student").title, error),
  },
  teacher: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("Teacher"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Teacher"))),
    deleted: () => showSuccessToast(...getToastMessage(ToastMessages.deleted("Teacher"))),
    createFailed: (error?: string) => showErrorToast(ToastMessages.createFailed("Teacher").title, error),
  },
  class: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("Class"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Class"))),
    deleted: () => showSuccessToast(...getToastMessage(ToastMessages.deleted("Class"))),
  },
  school: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("School"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("School"))),
    approved: () => showSuccessToast(...getToastMessage(ToastMessages.approved("School"))),
    rejected: () => showSuccessToast(...getToastMessage(ToastMessages.rejected("School"))),
  },
  subject: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("Subject"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Subject"))),
    deleted: () => showSuccessToast(...getToastMessage(ToastMessages.deleted("Subject"))),
  },
  homework: {
    created: () => showSuccessToast(...getToastMessage(ToastMessages.created("Homework"))),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Homework"))),
    submitted: () => showSuccessToast(...getToastMessage(ToastMessages.formSubmitted)),
  },
  attendance: {
    marked: () => showSuccessToast("Attendance marked", "Attendance has been recorded successfully."),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("Attendance"))),
  },
  fees: {
    paymentRecorded: () => showSuccessToast("Payment recorded", "The payment has been recorded successfully."),
    invoiceCreated: () => showSuccessToast("Invoice created", "The invoice has been created successfully."),
  },
  user: {
    created: (name?: string) => showSuccessToast("User created", name ? `${name} has been added successfully.` : "The user has been created."),
    updated: () => showSuccessToast(...getToastMessage(ToastMessages.updated("User"))),
    deleted: () => showSuccessToast(...getToastMessage(ToastMessages.deleted("User"))),
  },
};

// ============================================================================
// FORM HELPER FUNCTIONS
// ============================================================================

/**
 * Handle form submission with toast feedback
 * Use this in form onSubmit handlers
 */
export async function handleFormSubmit<T>(
  operation: () => Promise<T>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    showSuccessToast(
      options.successMessage || "Success",
      ToastMessages.formSaved.description
    );
    options.onSuccess?.(result);
    return result;
  } catch (error) {
    const message = options.errorMessage || (error instanceof Error ? error instanceof Error ? error.message : String(error) : "An error occurred");
    showErrorToast(
      ToastMessages.saveFailed.title,
      message
    );
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

// ============================================================================
// SERVER ACTION HELPERS
// ============================================================================

/**
 * Server action result with toast feedback
 * Use this in server actions that need to return success/error toasts
 */
export interface ServerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  toast?: {
    title: string;
    description?: string;
    variant: "success" | "error" | "warning";
  };
}

/**
 * Create a successful server action result
 */
export function successResult<T>(
  data: T,
  toast?: { title: string; description?: string }
): ServerActionResult<T> {
  return {
    success: true,
    data,
    toast: toast
      ? { title: toast.title, description: toast.description, variant: "success" }
      : undefined,
  };
}

/**
 * Create an error server action result
 */
export function errorResult(
  error: string,
  toast?: { title: string; description?: string }
): ServerActionResult {
  return {
    success: false,
    error,
    toast: toast
      ? { title: toast.title, description: toast.description, variant: "error" }
      : undefined,
  };
}

/**
 * Process server action result and show toast if present
 * Use this on the client side after calling a server action
 */
export function processActionResult<T>(result: ServerActionResult<T>): void {
  if (result.toast) {
    if (result.toast.variant === "success") {
      showSuccessToast(result.toast.title, result.toast.description);
    } else if (result.toast.variant === "error") {
      showErrorToast(result.toast.title, result.toast.description);
    } else {
      showWarningToast(result.toast.title, result.toast.description);
    }
  }
}
